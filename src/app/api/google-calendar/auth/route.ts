import { auth0 } from '../../../../../lib/auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback';
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'Google Calendar integration not configured. Please set GOOGLE_CLIENT_ID environment variable.' 
    }, { status: 500 });
  }

  const scope = 'https://www.googleapis.com/auth/calendar';
  const state = encodeURIComponent(JSON.stringify({ userId: session.user?.sub }));
  
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    'response_type=code&' +
    'access_type=offline&' +
    'prompt=consent&' +
    `state=${state}`;

  return NextResponse.json({
    authUrl: authUrl,
    message: 'Redirect to Google OAuth'
  });
}
