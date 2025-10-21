import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Token Vault for secure Google Calendar token storage
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

  getToken(userId: string, tokenName: string): string | null {
    const key = `${userId}:${tokenName}`;
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Update last used timestamp and usage count
    tokenData.lastUsed = new Date().toISOString();
    tokenData.usageCount = (tokenData.usageCount || 0) + 1;
    
    try {
      return this.decryptToken(tokenData.token);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { appointments } = await request.json();
    const userId = session.user?.sub;
    
    // Retrieve stored access token from Token Vault
    const tokenVault = TokenVault.getInstance();
    const accessToken = tokenVault.getToken(userId!, 'google_calendar_access_token');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect first.' },
        { status: 400 }
      );
    }

    const syncedEvents = [];
    
    for (const appointment of appointments) {
      try {
        // Parse appointment date and time
        const [startTime, endTime] = appointment.time.split(' - ');
        const [datePart] = appointment.date.split('T');
        
        // Create start and end datetime
        const startDateTime = new Date(`${datePart}T${startTime}`);
        const endDateTime = new Date(`${datePart}T${endTime}`);
        
        const event = {
          summary: appointment.title,
          description: `Lesson with ${appointment.educatorName}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'America/New_York', // Adjust timezone as needed
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/New_York',
          },
          attendees: [
            {
              email: session.user?.email,
              displayName: session.user?.name,
            },
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 10 }, // 10 minutes before
            ],
          },
        };

        // Create event in Google Calendar
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (response.ok) {
          const createdEvent = await response.json();
          syncedEvents.push(createdEvent);
        } else {
          console.error('Failed to create event:', await response.text());
        }
      } catch (eventError) {
        console.error('Error creating event for appointment:', appointment, eventError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedEvents.length} appointments to Google Calendar`,
      syncedCount: syncedEvents.length,
      events: syncedEvents
    });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar' },
      { status: 500 }
    );
  }
}
