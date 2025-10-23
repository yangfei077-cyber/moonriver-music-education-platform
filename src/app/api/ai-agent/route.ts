import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0-client';

// AI Agent API endpoint demonstrating Token Vault usage
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;

  const { action, query } = await request.json();

  try {
    switch (action) {
      case 'analyze-music':
        // Use user's Spotify token from Auth0 Token Vault
        const { token: spotifyToken } = await auth0.getAccessTokenForConnection({ connection: 'spotify' });
        
        if (!spotifyToken) {
          return NextResponse.json({ 
            error: 'Spotify connection required. Please connect your Spotify account through Auth0.',
            requiresConnection: 'spotify'
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
        // Use user's OpenAI token from Auth0 Token Vault
        const { token: openaiToken } = await auth0.getAccessTokenForConnection({ connection: 'openai' });
        
        if (!openaiToken) {
          return NextResponse.json({ 
            error: 'OpenAI connection required. Please connect your OpenAI account through Auth0.',
            requiresConnection: 'openai'
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
        // Use user's Google Cloud token from Auth0 Token Vault
        const { token: googleToken } = await auth0.getAccessTokenForConnection({ connection: 'google-cloud' });
        
        if (!googleToken) {
          return NextResponse.json({ 
            error: 'Google Cloud connection required. Please connect your Google Cloud account through Auth0.',
            requiresConnection: 'google-cloud'
          }, { status: 400 });
        }

        // Audio transcription logic would go here
        return NextResponse.json({
          success: true,
          transcription: 'Audio transcription would happen here using Google Cloud Speech-to-Text API',
          source: 'google-cloud'
        });

      case 'available-tools':
        // Return list of tools user can access based on their Auth0 connections
        const availableTools = [];
        
        try {
          const { token: spotifyToken } = await auth0.getAccessTokenForConnection({ connection: 'spotify' });
          if (spotifyToken) {
            availableTools.push({
              name: 'spotify-api',
              description: 'Analyze your music preferences and create personalized playlists',
              status: 'available'
            });
          }
        } catch (error) {
          // Connection not available
        }
        
        try {
          const { token: openaiToken } = await auth0.getAccessTokenForConnection({ connection: 'openai' });
          if (openaiToken) {
            availableTools.push({
              name: 'openai-api',
              description: 'Generate AI-powered music lessons and educational content',
              status: 'available'
            });
          }
        } catch (error) {
          // Connection not available
        }
        
        try {
          const { token: googleToken } = await auth0.getAccessTokenForConnection({ connection: 'google-cloud' });
          if (googleToken) {
            availableTools.push({
              name: 'google-cloud-api',
              description: 'Transcribe audio recordings and analyze speech patterns',
              status: 'available'
            });
          }
        } catch (error) {
          // Connection not available
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
