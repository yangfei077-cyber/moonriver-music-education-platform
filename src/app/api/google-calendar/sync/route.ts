import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TokenVault } from '@/lib/token-vault';

// JSON file storage for appointments
const APPOINTMENTS_FILE = path.join(process.cwd(), 'data', 'appointments.json');

// Helper function to read appointments
function readAppointments() {
  try {
    const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading appointments:', error);
    return { appointments: [], nextId: 1 };
  }
}

// Helper function to write appointments
function writeAppointments(data: any) {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing appointments:', error);
    return false;
  }
}

// Real Google Calendar service
class GoogleCalendarService {
  static async createEvent(token: string, event: any) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Google Calendar event: ${errorText}`);
    }

    return await response.json();
  }
  
  static async updateEvent(token: string, eventId: string, event: any) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update Google Calendar event: ${errorText}`);
    }

    return await response.json();
  }
  
  static async deleteEvent(token: string, eventId: string) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete Google Calendar event: ${errorText}`);
    }

    return { success: true };
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;
  const userEmail = user?.email;

  try {
    // Get all appointments for the current user
    const { appointments } = readAppointments();
    const userAppointments = appointments.filter((apt: any) => 
      apt.studentId === userId || apt.studentEmail === userEmail
    );

    // Get Google Calendar token from Auth0 Token Vault
    const vault = TokenVault.getInstance();
    const accessToken = await vault.getValidGoogleAccessToken(userId!);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    const updatedAppointments = [];

    // Sync each appointment
    for (const appointment of userAppointments) {
      if (appointment.status === 'cancelled') {
        // If appointment is cancelled and has a Google Event ID, delete it
        if (appointment.googleEventId) {
          try {
            await GoogleCalendarService.deleteEvent(accessToken, appointment.googleEventId);
            console.log(`Deleted Google Calendar event for cancelled appointment ${appointment.id}`);
          } catch (error) {
            console.error(`Failed to delete Google Calendar event for appointment ${appointment.id}:`, error);
          }
        }
        continue;
      }

      // Create or update the event in Google Calendar
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
        location: appointment.location || 'TBD'
      };

      try {
        let googleEventId = appointment.googleEventId;
        
        if (googleEventId) {
          // Update existing event
          await GoogleCalendarService.updateEvent(accessToken, googleEventId, googleEvent);
          console.log(`Updated Google Calendar event for appointment ${appointment.id}`);
        } else {
          // Create new event
          const createdEvent = await GoogleCalendarService.createEvent(accessToken, googleEvent);
          googleEventId = createdEvent.id;
          console.log(`Created Google Calendar event for appointment ${appointment.id}`);
        }

        // Update the appointment with the Google Event ID
        const updatedAppointment = {
          ...appointment,
          googleEventId,
          syncedAt: new Date().toISOString()
        };

        updatedAppointments.push(updatedAppointment);
        syncedCount++;

      } catch (error) {
        console.error(`Failed to sync appointment ${appointment.id} to Google Calendar:`, error);
      }
    }

    // Update appointments in the file
    if (updatedAppointments.length > 0) {
      const { appointments: allAppointments, nextId } = readAppointments();
      
      // Update the appointments with Google Event IDs
      updatedAppointments.forEach(updatedAppointment => {
        const index = allAppointments.findIndex((apt: any) => apt.id === updatedAppointment.id);
        if (index !== -1) {
          allAppointments[index] = updatedAppointment;
        }
      });

      writeAppointments({ appointments: allAppointments, nextId });
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Successfully synced ${syncedCount} appointments to Google Calendar`
    });

  } catch (error) {
    console.error('Error syncing appointments to Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync appointments to Google Calendar' },
      { status: 500 }
    );
  }
}