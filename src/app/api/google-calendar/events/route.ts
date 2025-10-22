import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Auth0 Token Vault Implementation for Google Calendar tokens
class TokenVault {
  private static instance: TokenVault;
  private tokens: Map<string, any> = new Map();

  static getInstance(): TokenVault {
    if (!TokenVault.instance) {
      TokenVault.instance = new TokenVault();
    }
    return TokenVault.instance;
  }

  encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  storeToken(userId: string, tokenName: string, token: string): void {
    const encryptedToken = this.encryptToken(token);
    const key = `${userId}:${tokenName}`;
    this.tokens.set(key, {
      encryptedToken,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    });
  }

  getToken(userId: string, tokenName: string): string | null {
    const key = `${userId}:${tokenName}`;
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Update last used timestamp
    tokenData.lastUsed = new Date().toISOString();
    this.tokens.set(key, tokenData);

    try {
      return this.decryptToken(tokenData.encryptedToken);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  }

  storeGoogleTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number): void {
    this.storeToken(userId, 'google_calendar_access', accessToken);
    this.storeToken(userId, 'google_calendar_refresh', refreshToken);
    
    // Store expiration timestamp
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.storeToken(userId, 'google_calendar_expires_at', expiresAt.toString());
    
    // Store created timestamp
    this.storeToken(userId, 'google_calendar_created_at', new Date().toISOString());
  }

  getGoogleTokens(userId: string): { accessToken: string | null, refreshToken: string | null, expiresAt: number | null } {
    const accessToken = this.getToken(userId, 'google_calendar_access');
    const refreshToken = this.getToken(userId, 'google_calendar_refresh');
    const expiresAtStr = this.getToken(userId, 'google_calendar_expires_at');
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr) : null;
    
    return { accessToken, refreshToken, expiresAt };
  }

  hasGoogleTokens(userId: string): boolean {
    const { accessToken } = this.getGoogleTokens(userId);
    return accessToken !== null;
  }

  async getValidGoogleAccessToken(userId: string): Promise<string | null> {
    let { accessToken, refreshToken, expiresAt } = this.getGoogleTokens(userId);

    if (!accessToken || !refreshToken) {
      return null; // No tokens stored
    }

    if (expiresAt && Date.now() >= expiresAt) {
      // Token expired, try to refresh
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          this.storeGoogleTokens(userId, newTokens.access_token, refreshToken, newTokens.expires_in);
          return newTokens.access_token;
        } else {
          console.error('Failed to refresh Google Calendar token:', await refreshResponse.text());
          return null;
        }
      } catch (error) {
        console.error('Error refreshing Google Calendar token:', error);
        return null;
      }
    }
    return accessToken;
  }
}

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
    const vault = TokenVault.getInstance();
    const accessToken = await vault.getValidGoogleAccessToken(userId!);
    
    if (!accessToken) {
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
      // Skip appointments that are already synced to Google Calendar
      if (appointment.googleEventId) {
        console.log('Skipping appointment', appointment.id, '- already synced to Google Calendar with ID:', appointment.googleEventId);
        continue;
      }
      
      console.log('Processing appointment:', appointment.id, 'startTime:', appointment.startTime, 'endTime:', appointment.endTime);
      
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
        // Create new event (since we already filtered out existing ones)
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
