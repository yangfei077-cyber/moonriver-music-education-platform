import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../lib/auth0';
import crypto from 'crypto';

// AI Tools Service - Pillar 2: "Control the Tools"
class AIToolsService {
  private static instance: AIToolsService;
  private tokens: Map<string, any> = new Map();
  private usageLog: Map<string, any[]> = new Map();

  static getInstance(): AIToolsService {
    if (!AIToolsService.instance) {
      AIToolsService.instance = new AIToolsService();
    }
    return AIToolsService.instance;
  }

  // Simulate Auth0 AI Service for token vault access
  async simulateTokenVaultAccess(service: string, scopes: string[]): Promise<string> {
    // In a real implementation, this would integrate with Auth0's token management
    // For demo purposes, we'll use a mock token
    return `mock_${service}_token_${Date.now()}`;
  }

  // Execute medical tool example (as per your specification)
  async executeMedicalTool(toolName: string, params: any): Promise<any> {
    const token = await this.simulateTokenVaultAccess('google', ['calendar.readonly']);
    
    // Secure API calls with managed tokens
    const response = await fetch('https://www.googleapis.com/calendar/v3/events', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return this.processSecureResponse(response);
  }

  // Process secure response with error handling
  private async processSecureResponse(response: Response): Promise<any> {
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Sanitize sensitive data
    return this.sanitizeResponse(data);
  }

  // Sanitize response data
  private sanitizeResponse(data: any): any {
    // Remove or mask sensitive information
    if (data.items) {
      data.items = data.items.map((item: any) => ({
        ...item,
        // Remove sensitive fields
        private: undefined,
        // Keep only necessary fields
        id: item.id,
        summary: item.summary,
        start: item.start,
        end: item.end
      }));
    }
    
    return data;
  }

  // Execute Google Calendar tool
  async executeGoogleCalendarTool(action: string, params: any): Promise<any> {
    const token = await this.simulateTokenVaultAccess('google-calendar', ['calendar.readonly']);
    
    let url = 'https://www.googleapis.com/calendar/v3/';
    let options: any = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    switch (action) {
      case 'listEvents':
        url += 'events';
        options.method = 'GET';
        break;
      case 'createEvent':
        url += 'events';
        options.method = 'POST';
        options.body = JSON.stringify(params);
        break;
      case 'updateEvent':
        url += `events/${params.eventId}`;
        options.method = 'PUT';
        options.body = JSON.stringify(params.eventData);
        break;
      case 'deleteEvent':
        url += `events/${params.eventId}`;
        options.method = 'DELETE';
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(url, options);
    return this.processSecureResponse(response);
  }

  // Execute Spotify tool
  async executeSpotifyTool(action: string, params: any): Promise<any> {
    const token = await this.simulateTokenVaultAccess('spotify', ['user-read-private', 'user-read-email']);
    
    let url = 'https://api.spotify.com/v1/';
    let options: any = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    switch (action) {
      case 'getUserProfile':
        url += 'me';
        options.method = 'GET';
        break;
      case 'searchTracks':
        url += `search?q=${encodeURIComponent(params.query)}&type=track`;
        options.method = 'GET';
        break;
      case 'getPlaylists':
        url += 'me/playlists';
        options.method = 'GET';
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(url, options);
    return this.processSecureResponse(response);
  }

  // Execute OpenRouter AI tool
  async executeOpenRouterTool(action: string, params: any): Promise<any> {
    const token = await this.simulateTokenVaultAccess('openrouter', ['ai:inference']);
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://music-education-platform.com',
        'X-Title': 'Music Education Platform'
      },
      body: JSON.stringify({
        model: params.model || 'nousresearch/deephermes-3-llama-3-8b-preview:free',
        messages: params.messages || [],
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7
      })
    };

    const response = await fetch(url, options);
    return this.processSecureResponse(response);
  }

  // Log tool usage for audit
  private logToolUsage(userId: string, toolName: string, action: string, params: any): void {
    const logEntry = {
      userId,
      toolName,
      action,
      params: this.sanitizeParams(params),
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
    const sanitized = { ...params };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.apiKey;
    return sanitized;
  }

  private generateUsageId(): string {
    return `ai_tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get usage analytics
  getUsageAnalytics(userId: string): any {
    const userLogs = this.usageLog.get(userId) || [];
    const toolUsage = userLogs.reduce((acc, log) => {
      const key = `${log.toolName}:${log.action}`;
      acc[key] = (acc[key] || 0) + 1;
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

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user?.sub;
  const { toolName, action, params } = await request.json();
  const aiTools = AIToolsService.getInstance();

  try {
    let result;

    switch (toolName) {
      case 'google-calendar':
        result = await aiTools.executeGoogleCalendarTool(action, params);
        break;
      case 'spotify':
        result = await aiTools.executeSpotifyTool(action, params);
        break;
      case 'openrouter':
        result = await aiTools.executeOpenRouterTool(action, params);
        break;
      case 'medical':
        result = await aiTools.executeMedicalTool(action, params);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    // Log usage
    aiTools['logToolUsage'](userId!, toolName, action, params);

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully executed ${toolName}:${action}`,
      usageId: aiTools['generateUsageId']()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: `Failed to execute ${toolName}:${action}`
    }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user?.sub;
  const aiTools = AIToolsService.getInstance();
  const analytics = aiTools.getUsageAnalytics(userId!);

  return NextResponse.json({ analytics });
}
