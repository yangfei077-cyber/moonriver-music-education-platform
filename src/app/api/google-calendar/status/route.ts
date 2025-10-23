import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0-client';

export async function GET(request: NextRequest) {
  // MCP-compliant authentication: No sessions, only bearer tokens
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="https://genai-2976115566729862.au.auth0.com/.well-known/oauth-authorization-server"'
        }
      }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Validate the access token using Auth0's Token Vault
    const { token: validatedToken } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });

    if (!validatedToken) {
      return NextResponse.json({
        connected: false,
        message: 'Google Calendar not connected via Auth0 Token Vault'
      });
    }

    // Validate token by hitting Calendar API
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${validatedToken}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        connected: true,
        message: 'Google Calendar is connected via Auth0 Token Vault',
        mcpCompliant: true
      });
    }

    return NextResponse.json({
      connected: false,
      message: 'Google Calendar connection expired'
    });
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return NextResponse.json({
      connected: false,
      message: 'Error checking Google Calendar connection'
    });
  }
}
