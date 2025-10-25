import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const googleOAuthUrl = `${baseUrl}/auth/login?connection=google-oauth2&connection_scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent&returnTo=${encodeURIComponent(`${baseUrl}/student/appointments`)}`;

  return NextResponse.json({
    authUrl: googleOAuthUrl,
    message: 'Redirect to linking endpoint after OAuth'
  });
}

