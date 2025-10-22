import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Token Vault for secure Google Calendar token storage
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

  getToken(userId: string, tokenName: string): string | null {
    const key = `${userId}:${tokenName}`;
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Update last used timestamp and usage count
    tokenData.lastUsed = new Date().toISOString();
    tokenData.usageCount = (tokenData.usageCount || 0) + 1;
    
    try {
      return this.decryptToken(tokenData.token);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  }

  hasToken(userId: string, tokenName: string): boolean {
    const key = `${userId}:${tokenName}`;
    return this.tokens.has(key);
  }
}

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;

  try {
    // Check for stored Google Calendar tokens
    const tokensFile = process.cwd() + '/data/google-tokens.json';
    const fs = require('fs');
    
    if (!fs.existsSync(tokensFile)) {
      return NextResponse.json({
        connected: false,
        userId: userId,
        message: 'Google Calendar not connected'
      });
    }
    
    const tokensData = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
    const userTokens = tokensData[userId!];
    
    if (!userTokens || !userTokens.access_token) {
      return NextResponse.json({
        connected: false,
        userId: userId,
        message: 'Google Calendar not connected'
      });
    }

    // Check if token is expired
    if (userTokens.expires_at && Date.now() > userTokens.expires_at) {
      // Try to refresh the token if we have a refresh token
      if (userTokens.refresh_token) {
        try {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              refresh_token: userTokens.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          
          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            
            // Update stored tokens
            userTokens.access_token = newTokens.access_token;
            userTokens.expires_at = Date.now() + (newTokens.expires_in * 1000);
            tokensData[userId!] = userTokens;
            fs.writeFileSync(tokensFile, JSON.stringify(tokensData, null, 2));
          } else {
            return NextResponse.json({
              connected: false,
              userId: userId,
              message: 'Google Calendar connection expired and refresh failed'
            });
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return NextResponse.json({
            connected: false,
            userId: userId,
            message: 'Google Calendar connection expired'
          });
        }
      } else {
        return NextResponse.json({
          connected: false,
          userId: userId,
          message: 'Google Calendar connection expired'
        });
      }
    }

    // Test the token by making a simple API call
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${userTokens.access_token}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        connected: true,
        userId: userId,
        message: 'Google Calendar is connected'
      });
    } else {
      return NextResponse.json({
        connected: false,
        userId: userId,
        message: 'Google Calendar connection expired'
      });
    }
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return NextResponse.json({
      connected: false,
      userId: userId,
      message: 'Error checking Google Calendar connection'
    });
  }
}
