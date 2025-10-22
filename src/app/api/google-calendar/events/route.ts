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
    // Get real Google Calendar token from storage
    const tokensFile = process.cwd() + '/data/google-tokens.json';
    const fs = require('fs');
    
    if (!fs.existsSync(tokensFile)) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }
    
    const tokensData = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
    const userTokens = tokensData[userId!];
    
    if (!userTokens || !userTokens.access_token) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    if (userTokens.expires_at && Date.now() > userTokens.expires_at) {
      if (userTokens.refresh_token) {
        try {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              refresh_token: userTokens.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          
          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            userTokens.access_token = newTokens.access_token;
            userTokens.expires_at = Date.now() + (newTokens.expires_in * 1000);
            tokensData[userId!] = userTokens;
            fs.writeFileSync(tokensFile, JSON.stringify(tokensData, null, 2));
          } else {
            return NextResponse.json(
              { error: 'Google Calendar token expired and refresh failed. Please reconnect.' },
              { status: 400 }
            );
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return NextResponse.json(
            { error: 'Google Calendar token expired. Please reconnect.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Google Calendar token expired. Please reconnect.' },
          { status: 400 }
        );
      }
    }

    const accessToken = userTokens.access_token;

    // 1. UPLOAD: Upload Moonriver events to Google Calendar
    const appointmentsFile = process.cwd() + '/data/appointments.json';
    let moonriverAppointments = [];
    let uploadedCount = 0;
    
    if (fs.existsSync(appointmentsFile)) {
      const appointmentsData = JSON.parse(fs.readFileSync(appointmentsFile, 'utf8'));
      moonriverAppointments = appointmentsData.appointments.filter((apt: any) => 
        (apt.studentId === userId || apt.studentEmail === userEmail) && 
        apt.status !== 'cancelled'
      );
    }

    // Upload each Moonriver appointment to Google Calendar
    for (const appointment of moonriverAppointments) {
      const googleEvent = {
        summary: `${appointment.title} - ${appointment.educatorName}`,
        description: appointment.description || `Lesson with ${appointment.educatorName}`,
        start: {
          dateTime: appointment.startTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: appointment.endTime,
          timeZone: 'UTC'
        },
        location: appointment.location || 'TBD',
        extendedProperties: {
          private: {
            moonriver: 'true',
            moonriverAppointmentId: appointment.id.toString()
          }
        }
      };

      try {
        let googleEventId = appointment.googleEventId;
        
        if (googleEventId) {
          // Update existing event
          const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          });

          if (updateResponse.ok) {
            console.log(`Updated Google Calendar event for appointment ${appointment.id}`);
            uploadedCount++;
          }
        } else {
          // Create new event
          const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          });

          if (createResponse.ok) {
            const createdEvent = await createResponse.json();
            googleEventId = createdEvent.id;
            
            // Update appointment with Google Event ID
            const appointmentsData = JSON.parse(fs.readFileSync(appointmentsFile, 'utf8'));
            const appointmentIndex = appointmentsData.appointments.findIndex((apt: any) => apt.id === appointment.id);
            if (appointmentIndex !== -1) {
              appointmentsData.appointments[appointmentIndex].googleEventId = googleEventId;
              fs.writeFileSync(appointmentsFile, JSON.stringify(appointmentsData, null, 2));
            }
            
            console.log(`Created Google Calendar event for appointment ${appointment.id}`);
            uploadedCount++;
          }
        }

      } catch (error) {
        console.error(`Failed to upload appointment ${appointment.id} to Google Calendar:`, error);
      }
    }

    // 2. FETCH: Fetch events from Google Calendar
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
      success: true,
      uploadedCount,
      appointments,
      total: appointments.length,
      message: `Uploaded ${uploadedCount} appointments to Google Calendar and found ${appointments.length} Moonriver events in Google Calendar`
    });

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json(
      { error: 'Error fetching Google Calendar events' },
      { status: 500 }
    );
  }
}
