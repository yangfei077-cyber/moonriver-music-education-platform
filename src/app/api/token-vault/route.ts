import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Token Vault Implementation
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

    return this.decryptToken(tokenData.encryptedToken);
  }

  listTokens(userId: string): Array<{name: string, createdAt: string, lastUsed: string}> {
    const userTokens = [];
    for (const [key, tokenData] of this.tokens.entries()) {
      if (key.startsWith(`${userId}:`)) {
        const tokenName = key.split(':')[1];
        userTokens.push({
          name: tokenName,
          createdAt: tokenData.createdAt,
          lastUsed: tokenData.lastUsed,
        });
      }
    }
    return userTokens;
  }

  deleteToken(userId: string, tokenName: string): boolean {
    const key = `${userId}:${tokenName}`;
    return this.tokens.delete(key);
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user?.sub;
  const vault = TokenVault.getInstance();
  const tokens = vault.listTokens(userId!);

  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tokenName, token } = await request.json();
  const userId = session.user?.sub;
  const vault = TokenVault.getInstance();
  
  vault.storeToken(userId!, tokenName, token);

  return NextResponse.json({ success: true, message: 'Token stored securely' });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tokenName = searchParams.get('tokenName');
  const userId = session.user?.sub;
  const vault = TokenVault.getInstance();
  
  if (!tokenName) {
    return NextResponse.json({ error: 'Token name required' }, { status: 400 });
  }

  const deleted = vault.deleteToken(userId!, tokenName);
  
  return NextResponse.json({ 
    success: deleted, 
    message: deleted ? 'Token deleted' : 'Token not found' 
  });
}
