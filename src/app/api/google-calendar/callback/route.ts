import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Google Calendar callback received:', request.url);
  
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.APP_BASE_URL}/student/appointments?error=calendar_connection_failed`);
  }

  // Since we're using Auth0's Token Vault, users should connect through Auth0's universal login
  // This callback is no longer needed for the OAuth flow
  console.log('Redirecting to appointments page - Google Calendar should be connected via Auth0');
  
  return NextResponse.redirect(`${process.env.APP_BASE_URL}/student/appointments?success=calendar_connected`);
}