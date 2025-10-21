import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;

  try {
    // TODO: In production, retrieve stored access token for user
    // For demo purposes, we'll use a mock token
    const accessToken = 'mock-access-token'; // Replace with actual token retrieval
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

    // Fetch events from Google Calendar
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Google Calendar events' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter for Moonriver-created events only
    const moonriverEvents = data.items?.filter((event: any) => {
      // Check if the event was created by Moonriver (look for specific identifiers)
      return event.description?.includes('Created by Moonriver') ||
             event.summary?.includes('Moonriver') ||
             event.extendedProperties?.private?.moonriver === 'true';
    }) || [];

    // Transform Google Calendar events to Moonriver appointment format
    const appointments = moonriverEvents.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      date: event.start?.dateTime ? 
        event.start.dateTime.split('T')[0] : 
        event.start?.date || new Date().toISOString().split('T')[0],
      time: event.start?.dateTime ? 
        event.start.dateTime.split('T')[1].split('+')[0].substring(0, 5) : 
        '00:00',
      educatorName: event.attendees?.find((a: any) => a.email !== user?.email)?.displayName || 'Unknown Educator',
      description: event.description || '',
      location: event.location || '',
      googleEventId: event.id,
      source: 'google_calendar'
    }));

    return NextResponse.json({
      appointments,
      total: appointments.length,
      message: `Found ${appointments.length} Moonriver appointments in Google Calendar`
    });

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json(
      { error: 'Error fetching Google Calendar events' },
      { status: 500 }
    );
  }
}
