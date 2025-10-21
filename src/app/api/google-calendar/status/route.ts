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
    // Check Token Vault for stored Google Calendar tokens
    const tokenVault = TokenVault.getInstance();
    const accessToken = tokenVault.getToken(userId!, 'google_calendar_access_token');
    
    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        userId: userId,
        message: 'Google Calendar not connected'
      });
    }

    // Test the token by making a simple API call
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
