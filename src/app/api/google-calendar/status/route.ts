import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../../lib/auth0.js';

export async function GET(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;
  const userEmail = user?.email;

  try {
    // Try to get Google Calendar token from Auth0 Token Vault
    const { token: accessToken } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });
    
    if (accessToken) {
      // Test the token by making a simple API call
      try {
        const testResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (testResponse.ok) {
          const calendarData = await testResponse.json();
          return NextResponse.json({
            connected: true,
            message: 'Google Calendar is connected and working!',
            calendarId: calendarData.id,
            calendarSummary: calendarData.summary,
            userId: userId,
            userEmail: userEmail
          });
        } else {
          return NextResponse.json({
            connected: false,
            message: 'Google Calendar token is invalid or expired',
            error: `API call failed with status ${testResponse.status}`,
            userId: userId,
            userEmail: userEmail
          });
        }
      } catch (apiError) {
        return NextResponse.json({
          connected: false,
          message: 'Google Calendar token exists but API call failed',
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          userId: userId,
          userEmail: userEmail
        });
      }
    } else {
      return NextResponse.json({
        connected: false,
        message: 'Google Calendar not connected - no token found',
        userId: userId,
        userEmail: userEmail
      });
    }
  } catch (error: any) {
    console.log('Token retrieval error:', error.message);
    
    if (error.code === 'missing_refresh_token') {
      return NextResponse.json({
        connected: false,
        message: 'Google Calendar not connected - missing refresh token',
        needsAuth: true,
        connectUrl: '/api/google-calendar/auth',
        userId: userId,
        userEmail: userEmail
      });
    }
    
    return NextResponse.json({
      connected: false,
      message: 'Error checking Google Calendar connection',
      error: error.message,
      userId: userId,
      userEmail: userEmail
    });
  }
}