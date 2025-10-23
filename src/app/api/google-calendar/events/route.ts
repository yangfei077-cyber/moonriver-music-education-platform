import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth0 } from '@/lib/auth0-client';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;
  const userEmail = user?.email;

  try {
    // Get Google Calendar token from Auth0 Token Vault
    const { token: accessToken } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });
    
    console.log('Token retrieval result:', { 
      userId, 
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0 
    });
    
    if (!accessToken) {
      console.log('No valid access token found for user:', userId);
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

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

    // 1. UPLOAD: Upload Moonriver appointments to Google Calendar
    for (const appointment of moonriverAppointments) {
      console.log('Processing appointment:', appointment.id, 'startTime:', appointment.startTime, 'endTime:', appointment.endTime, 'googleEventId:', appointment.googleEventId);
      
      // Check if Google event still exists (if we have a googleEventId)
      let shouldCreateNew = true;
      if (appointment.googleEventId) {
        try {
          const checkResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleEventId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (checkResponse.ok) {
            console.log('Google event exists for appointment', appointment.id, '- skipping upload');
            continue; // Event exists, skip
          } else {
            console.log('Google event not found for appointment', appointment.id, '- will create new one');
            shouldCreateNew = true;
          }
        } catch (error) {
          console.log('Error checking Google event for appointment', appointment.id, '- will create new one:', error);
          shouldCreateNew = true;
        }
      }
      
      // Convert local time to ISO string with timezone
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);
      
      const googleEvent = {
        summary: `${appointment.title} - ${appointment.educatorName}`,
        description: appointment.description || `Lesson with ${appointment.educatorName}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC'
        },
        location: appointment.location || 'TBD',
       extendedProperties: {
         private: {
           moonriver: 'true'
         }
       }
      };

      console.log('Google Event data being sent:', JSON.stringify(googleEvent, null, 2));

      try {
        // Create new event
        console.log('Creating new event for appointment', appointment.id);
        const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        });

        console.log('Create response status:', createResponse.status);
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.log('Create response error:', errorText);
        }

        if (createResponse.ok) {
          const createdEvent = await createResponse.json();
          const googleEventId = createdEvent.id;
          
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
