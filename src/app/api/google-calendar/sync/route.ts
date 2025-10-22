import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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