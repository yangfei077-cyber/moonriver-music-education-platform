import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Auth0 Token Vault Implementation for Google Calendar tokens
class TokenVault {
  private static instance: TokenVault;
  private tokens: Map<string, any> = new Map();

  static getInstance(): TokenVault {
    if (!TokenVault.instance) {
      TokenVault.instance = new TokenVault();
    }
    return TokenVault.instance;
  }

  encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  storeToken(userId: string, tokenName: string, token: string): void {
    const encryptedToken = this.encryptToken(token);
    const key = `${userId}:${tokenName}`;
    this.tokens.set(key, {
      encryptedToken,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    });
  }

  getToken(userId: string, tokenName: string): string | null {
    const key = `${userId}:${tokenName}`;
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Update last used timestamp
    tokenData.lastUsed = new Date().toISOString();
    this.tokens.set(key, tokenData);

    try {
      return this.decryptToken(tokenData.encryptedToken);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  }

  storeGoogleTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number): void {
    this.storeToken(userId, 'google_calendar_access', accessToken);
    this.storeToken(userId, 'google_calendar_refresh', refreshToken);
    
    // Store expiration timestamp
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.storeToken(userId, 'google_calendar_expires_at', expiresAt.toString());
    
    // Store created timestamp
    this.storeToken(userId, 'google_calendar_created_at', new Date().toISOString());
  }

  getGoogleTokens(userId: string): { accessToken: string | null, refreshToken: string | null, expiresAt: number | null } {
    const accessToken = this.getToken(userId, 'google_calendar_access');
    const refreshToken = this.getToken(userId, 'google_calendar_refresh');
    const expiresAtStr = this.getToken(userId, 'google_calendar_expires_at');
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr) : null;
    
    return { accessToken, refreshToken, expiresAt };
  }

  hasGoogleTokens(userId: string): boolean {
    const { accessToken } = this.getGoogleTokens(userId);
    return accessToken !== null;
  }
}

export async function GET(request: NextRequest) {
  console.log('Google Calendar callback received:', request.url);
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('Callback params:', { code: code?.substring(0, 20) + '...', state, error });

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=oauth_error`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=missing_params`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback';
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=config_error`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      
      // Handle specific Google OAuth errors
      if (errorText.includes('invalid_grant')) {
        console.log('Authorization code expired or already used - redirecting to re-authorize');
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=code_expired`);
      }
      
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=token_error`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful:', { 
      access_token: tokenData.access_token ? 'RECEIVED' : 'NOT RECEIVED',
      refresh_token: tokenData.refresh_token ? 'RECEIVED' : 'NOT RECEIVED'
    });
    
    const { access_token, refresh_token } = tokenData;

    // Parse state to get user ID
    const stateData = JSON.parse(decodeURIComponent(state));
    const userId = stateData.userId;

    // Store tokens securely in Auth0 Token Vault
    const vault = TokenVault.getInstance();
    vault.storeGoogleTokens(userId, access_token, refresh_token, tokenData.expires_in);
    
    console.log('Tokens stored securely in Auth0 Token Vault for user:', userId);
    
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?success=calendar_connected`);
  } catch (error) {
    console.error('Error processing Google Calendar callback:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=callback_error`);
  }
}
