import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../../lib/auth0';

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { googleUserId } = await request.json();
    
    if (!googleUserId) {
      return NextResponse.json({ error: 'Google user ID is required' }, { status: 400 });
    }

    const userId = session.user?.sub;
    
    // Get Management API token
    const managementTokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
        scope: 'create:user_identities'
      })
    });

    if (!managementTokenResponse.ok) {
      throw new Error('Failed to get Management API token');
    }

    const tokenData = await managementTokenResponse.json();
    const managementToken = tokenData.access_token;

    // Link Google identity to the current user
    const linkResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/identities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'google-oauth2',
        user_id: googleUserId,
        connection: 'google-oauth2',
        isSocial: true
      })
    });

    if (!linkResponse.ok) {
      const errorText = await linkResponse.text();
      throw new Error(`Failed to link Google identity: ${linkResponse.status} ${errorText}`);
    }

    const result = await linkResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Google account linked successfully',
      identity: result
    });

  } catch (error) {
    console.error('Error linking Google account:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
