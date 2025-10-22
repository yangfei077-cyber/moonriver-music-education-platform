import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { TokenVault } from '@/lib/token-vault';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;

  try {
    const vault = TokenVault.getInstance();
    const accessToken = await vault.getValidGoogleAccessToken(userId!);

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        userId: userId,
        message: 'Google Calendar not connected'
      });
    }

    // Validate token by hitting Calendar API
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        connected: true,
        userId: userId,
        message: 'Google Calendar is connected'
      });
    }

    return NextResponse.json({
      connected: false,
      userId: userId,
      message: 'Google Calendar connection expired'
    });
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return NextResponse.json({
      connected: false,
      userId: userId,
      message: 'Error checking Google Calendar connection'
    });
  }
}
