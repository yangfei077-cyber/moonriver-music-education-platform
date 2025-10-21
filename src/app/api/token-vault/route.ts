import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Token Vault Implementation - Pillar 2: "Control the Tools"
class TokenVault {
  private static instance: TokenVault;
  private tokens: Map<string, any> = new Map();
  private usageLog: Map<string, any[]> = new Map();

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

  // AI Actions System - Secure Tool Execution
  async executeSecureTool(userId: string, toolName: string, params: any, requiredScopes: string[] = []): Promise<any> {
    const tokenKey = `${userId}:${toolName}`;
    const tokenData = this.tokens.get(tokenKey);
    
    if (!tokenData) {
      throw new Error(`No token found for tool: ${toolName}`);
    }

    // Log tool usage for audit
    this.logToolUsage(userId, toolName, params, requiredScopes);

    // Decrypt and return token for secure API calls
    const decryptedToken = this.decryptToken(tokenData.encryptedToken);
    
    // Update last used timestamp
    tokenData.lastUsed = new Date().toISOString();
    this.tokens.set(tokenKey, tokenData);

    return {
      token: decryptedToken,
      scopes: requiredScopes,
      usageId: this.generateUsageId(),
      timestamp: new Date().toISOString()
    };
  }

  // Secure API call wrapper
  async makeSecureAPICall(userId: string, toolName: string, url: string, options: any = {}, requiredScopes: string[] = []): Promise<any> {
    const tokenInfo = await this.executeSecureTool(userId, toolName, { url, ...options }, requiredScopes);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${tokenInfo.token}`,
        'X-Token-Vault-Usage-ID': tokenInfo.usageId,
        'X-Token-Vault-Timestamp': tokenInfo.timestamp
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Usage logging and audit trail
  private logToolUsage(userId: string, toolName: string, params: any, scopes: string[]): void {
    const logEntry = {
      userId,
      toolName,
      params: this.sanitizeParams(params),
      scopes,
      timestamp: new Date().toISOString(),
      usageId: this.generateUsageId()
    };

    const userLogs = this.usageLog.get(userId) || [];
    userLogs.push(logEntry);
    
    // Keep only last 100 entries per user
    if (userLogs.length > 100) {
      userLogs.splice(0, userLogs.length - 100);
    }
    
    this.usageLog.set(userId, userLogs);
  }

  private sanitizeParams(params: any): any {
    // Remove sensitive data from logs
    const sanitized = { ...params };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }

  private generateUsageId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get usage analytics
  getUsageAnalytics(userId: string): any {
    const userLogs = this.usageLog.get(userId) || [];
    const toolUsage = userLogs.reduce((acc, log) => {
      acc[log.toolName] = (acc[log.toolName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsage: userLogs.length,
      toolUsage,
      recentUsage: userLogs.slice(-10),
      lastUsed: userLogs[userLogs.length - 1]?.timestamp
    };
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user?.sub;
  const vault = TokenVault.getInstance();
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'analytics') {
    const analytics = vault.getUsageAnalytics(userId!);
    return NextResponse.json({ analytics });
  }

  const tokens = vault.listTokens(userId!);
  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user?.sub;
  const vault = TokenVault.getInstance();

  // Handle secure tool execution
  if (body.action === 'executeTool') {
    try {
      const { toolName, params, scopes, url, options } = body;
      
      if (url) {
        // Make secure API call
        const result = await vault.makeSecureAPICall(userId!, toolName, url, options, scopes);
        return NextResponse.json({ 
          success: true, 
          result,
          message: 'Secure API call executed successfully' 
        });
      } else {
        // Execute secure tool
        const tokenInfo = await vault.executeSecureTool(userId!, toolName, params, scopes);
        return NextResponse.json({ 
          success: true, 
          tokenInfo,
          message: 'Secure tool executed successfully' 
        });
      }
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Tool execution failed' 
      }, { status: 400 });
    }
  }

  // Handle token storage
  const { tokenName, token } = body;
  
  if (!tokenName || !token) {
    return NextResponse.json({ error: 'Token name and value are required' }, { status: 400 });
  }
  
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
