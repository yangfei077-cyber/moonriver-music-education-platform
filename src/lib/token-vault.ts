import crypto from 'crypto';

// Token Vault Implementation for secure token storage
export class TokenVault {
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

  isTokenExpired(userId: string): boolean {
    const { expiresAt } = this.getGoogleTokens(userId);
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  }

  hasGoogleTokens(userId: string): boolean {
    const { accessToken } = this.getGoogleTokens(userId);
    return accessToken !== null;
  }

  async refreshGoogleToken(userId: string): Promise<boolean> {
    const { refreshToken } = this.getGoogleTokens(userId);
    
    if (!refreshToken) {
      return false;
    }

    try {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      
      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        this.storeGoogleTokens(userId, newTokens.access_token, refreshToken, newTokens.expires_in);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  async getValidGoogleAccessToken(userId: string): Promise<string | null> {
    if (!this.hasGoogleTokens(userId)) {
      return null;
    }

    // Check if token is expired and refresh if needed
    if (this.isTokenExpired(userId)) {
      const refreshed = await this.refreshGoogleToken(userId);
      if (!refreshed) {
        return null;
      }
    }

    const { accessToken } = this.getGoogleTokens(userId);
    return accessToken;
  }
}
