import { NextRequest, NextResponse } from 'next/server';
import { TokenVault } from '@/lib/token-vault';

export async function GET(request: NextRequest) {
  console.log('Google Calendar callback received:', request.url);
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('Callback params:', { code: code?.substring(0, 20) + '...', state, error });

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=oauth_error`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=missing_params`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback';
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=config_error`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      
      // Handle specific Google OAuth errors
      if (errorText.includes('invalid_grant')) {
        console.log('Authorization code expired or already used - redirecting to re-authorize');
        return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=code_expired`);
      }
      
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=token_error`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful:', { 
      access_token: tokenData.access_token ? 'RECEIVED' : 'NOT RECEIVED',
      refresh_token: tokenData.refresh_token ? 'RECEIVED' : 'NOT RECEIVED'
    });
    
    const { access_token, refresh_token } = tokenData;

    // Parse state to get user ID
    const stateData = JSON.parse(decodeURIComponent(state));
    const userId = stateData.userId;

    // Store tokens securely in Auth0 Token Vault
    const vault = TokenVault.getInstance();

    try {
      // Some Google responses omit refresh_token on subsequent consents
      let refreshToStore: string | null = refresh_token || null;
      if (!refreshToStore) {
        const existing = vault.getGoogleTokens(userId);
        refreshToStore = existing.refreshToken;
      }

      if (refreshToStore) {
        vault.storeGoogleTokens(userId, access_token, refreshToStore, tokenData.expires_in);
        console.log('Tokens stored with refresh token for user:', userId);
      } else {
        // Fallback: store access token and expiry only (no refresh available)
        vault.storeToken(userId, 'google_calendar_access', access_token);
        const expiresAt = Date.now() + (tokenData.expires_in * 1000);
        vault.storeToken(userId, 'google_calendar_expires_at', expiresAt.toString());
        vault.storeToken(userId, 'google_calendar_created_at', new Date().toISOString());
        console.log('Tokens stored without refresh token for user:', userId);
      }
      
      console.log('Tokens stored securely in Auth0 Token Vault for user:', userId);
      
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?success=calendar_connected`);
    } catch (tokenError) {
      console.error('Error storing tokens in Token Vault:', tokenError);
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=token_storage_failed`);
    }
  } catch (error) {
    console.error('Error processing Google Calendar callback:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/student/appointments?error=callback_error`);
  }
}
