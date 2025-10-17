import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Import our TokenVault class
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
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedToken: string): string {
    const crypto = require('crypto');
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
}

// AI Agent API endpoint demonstrating Token Vault usage
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
  const vault = TokenVault.getInstance();

  const { action, query } = await request.json();

  try {
    switch (action) {
      case 'analyze-music':
        // Use user's Spotify token to analyze their music preferences
        const spotifyToken = vault.getToken(userId!, 'spotify-api');
        
        if (!spotifyToken) {
          return NextResponse.json({ 
            error: 'Spotify API token required. Please add your Spotify API key to the Token Vault.',
            requiresToken: 'spotify-api'
          }, { status: 400 });
        }

        // Make API call using user's token
        const spotifyResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!spotifyResponse.ok) {
          return NextResponse.json({ 
            error: 'Spotify API error. Please check your token.',
            requiresToken: 'spotify-api'
          }, { status: 400 });
        }

        const spotifyData = await spotifyResponse.json();
        
        // AI analysis using user's data
        return NextResponse.json({
          success: true,
          analysis: `Based on your Spotify listening history, I can see you enjoy ${spotifyData.items[0]?.artists[0]?.name || 'various artists'}. Here are some music education recommendations...`,
          data: spotifyData
        });

      case 'generate-lesson':
        // Use user's OpenAI token for AI-generated lessons
        const openaiToken = vault.getToken(userId!, 'openai-api');
        
        if (!openaiToken) {
          return NextResponse.json({ 
            error: 'OpenAI API token required. Please add your OpenAI API key to the Token Vault.',
            requiresToken: 'openai-api'
          }, { status: 400 });
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a music education AI assistant. Create personalized music lessons based on user preferences.'
              },
              {
                role: 'user',
                content: `Create a music lesson plan for: ${query}`
              }
            ]
          })
        });

        if (!openaiResponse.ok) {
          return NextResponse.json({ 
            error: 'OpenAI API error. Please check your token.',
            requiresToken: 'openai-api'
          }, { status: 400 });
        }

        const openaiData = await openaiResponse.json();
        
        return NextResponse.json({
          success: true,
          lesson: openaiData.choices[0]?.message?.content || 'No lesson generated',
          source: 'openai-gpt-4'
        });

      case 'transcribe-audio':
        // Use user's Google Cloud token for audio transcription
        const googleToken = vault.getToken(userId!, 'google-cloud-api');
        
        if (!googleToken) {
          return NextResponse.json({ 
            error: 'Google Cloud API token required. Please add your Google Cloud API key to the Token Vault.',
            requiresToken: 'google-cloud-api'
          }, { status: 400 });
        }

        // Audio transcription logic would go here
        return NextResponse.json({
          success: true,
          transcription: 'Audio transcription would happen here using Google Cloud Speech-to-Text API',
          source: 'google-cloud'
        });

      case 'available-tools':
        // Return list of tools user can access based on their stored tokens
        const availableTools = [];
        
        if (vault.getToken(userId!, 'spotify-api')) {
          availableTools.push({
            name: 'spotify-api',
            description: 'Analyze your music preferences and create personalized playlists',
            status: 'available'
          });
        }
        
        if (vault.getToken(userId!, 'openai-api')) {
          availableTools.push({
            name: 'openai-api',
            description: 'Generate AI-powered music lessons and educational content',
            status: 'available'
          });
        }
        
        if (vault.getToken(userId!, 'google-cloud-api')) {
          availableTools.push({
            name: 'google-cloud-api',
            description: 'Transcribe audio recordings and analyze speech patterns',
            status: 'available'
          });
        }

        return NextResponse.json({
          success: true,
          availableTools,
          message: availableTools.length > 0 
            ? `You have access to ${availableTools.length} AI tools`
            : 'No AI tools configured. Add API tokens to the Token Vault to enable AI features.'
        });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Agent error:', error);
    return NextResponse.json({ 
      error: 'AI Agent service error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
