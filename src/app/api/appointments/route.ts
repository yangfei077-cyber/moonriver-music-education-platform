import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Token Vault integration for Google Calendar (using the same class as token-vault API)
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

    // Update last used timestamp
    tokenData.lastUsed = new Date().toISOString();
    this.tokens.set(key, tokenData);

    return this.decryptToken(tokenData.encryptedToken);
  }
}

// Google Calendar API integration
class GoogleCalendarService {
  static async createEvent(accessToken: string, event: any): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  static async updateEvent(accessToken: string, eventId: string, event: any): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      throw error;
    }
  }

  static async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      throw error;
    }
  }

  static formatEventForGoogle(appointment: any): any {
    return {
      summary: appointment.title,
      description: appointment.description || '',
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      },
      attendees: [
        {
          email: appointment.studentEmail,
          displayName: appointment.studentName,
        },
      ],
      location: appointment.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };
  }
}

// Appointment storage (in production, use a database)
const appointments: Map<string, any> = new Map();
let appointmentIdCounter = 1;

// Demo appointment data
const demoAppointments = [
  {
    id: 1,
    educatorId: 'educator@moonriver.com',
    educatorName: 'Dr. Sarah Johnson',
    studentId: 'student-1',
    studentName: 'Demo Student',
    studentEmail: 'student@moonriver.com',
    title: 'Piano Fundamentals - Lesson 1',
    description: 'Introduction to piano basics, hand positioning, and first scales',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
    status: 'confirmed', // pending, confirmed, completed, cancelled
    type: 'lesson', // lesson, consultation, practice_session
    location: 'Studio A',
    notes: 'Student is a complete beginner, focus on fundamentals',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    educatorId: 'educator@moonriver.com',
    educatorName: 'Dr. Sarah Johnson',
    studentId: 'student-1',
    studentName: 'Demo Student',
    studentEmail: 'student@moonriver.com',
    title: 'Music Theory Session',
    description: 'Review of chord progressions and scale construction',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // 3 days + 45 min
    status: 'confirmed',
    type: 'lesson',
    location: 'Studio A',
    notes: 'Follow up on previous lesson progress',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    educatorId: 'mike.chen@moonriver.com',
    educatorName: 'Mike Chen',
    studentId: 'student-3',
    studentName: 'Bob Smith',
    studentEmail: 'bob.smith@example.com',
    title: 'Advanced Guitar Techniques',
    description: 'Fingerpicking patterns and barre chord practice',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 2 days + 90 min
    status: 'pending',
    type: 'lesson',
    location: 'Studio B',
    notes: 'Student struggling with barre chords, needs extra practice',
    createdAt: new Date().toISOString()
  }
];

// Initialize demo appointments
demoAppointments.forEach(appointment => {
  appointments.set(appointment.id.toString(), appointment);
  appointmentIdCounter = Math.max(appointmentIdCounter, appointment.id + 1);
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
  const userEmail = user?.email;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');

  // Get all appointments
  let allAppointments = Array.from(appointments.values());

  // Filter appointments based on user role
  if (roles.includes('educator')) {
    // Educators see their own appointments
    allAppointments = allAppointments.filter(apt => apt.educatorId === userEmail);
  } else if (roles.includes('student')) {
    // Students see appointments they're involved in
    allAppointments = allAppointments.filter(apt => 
      apt.studentId === userId || 
      apt.studentEmail === userEmail ||
      apt.studentEmail === user?.email
    );
  }

  // Apply additional filters
  if (startDate) {
    const start = new Date(startDate);
    allAppointments = allAppointments.filter(apt => new Date(apt.startTime) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    allAppointments = allAppointments.filter(apt => new Date(apt.startTime) <= end);
  }

  if (status) {
    allAppointments = allAppointments.filter(apt => apt.status === status);
  }

  // Sort by start time
  allAppointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return NextResponse.json({
    success: true,
    appointments: allAppointments,
    total: allAppointments.length
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
  const userEmail = user?.email;

  const { action, ...data } = await request.json();

  if (action === 'create') {
    // Only educators and students can create appointments
    if (!roles.includes('educator') && !roles.includes('student')) {
      return NextResponse.json({ error: 'Only educators and students can create appointments' }, { status: 403 });
    }

    const {
      educatorId,
      educatorName,
      studentId,
      studentName,
      studentEmail,
      title,
      description,
      startTime,
      endTime,
      type = 'lesson',
      location,
      notes
    } = data;

    // Validate required fields
    if (!educatorId || !studentId || !title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for time conflicts
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const conflictingAppointments = Array.from(appointments.values()).filter(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (apt.educatorId === educatorId || apt.studentId === studentId) &&
        apt.status !== 'cancelled' &&
        ((start >= aptStart && start < aptEnd) || (end > aptStart && end <= aptEnd) || (start <= aptStart && end >= aptEnd))
      );
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({ error: 'Time conflict with existing appointment' }, { status: 400 });
    }

    // Create new appointment
    const newAppointment = {
      id: appointmentIdCounter++,
      educatorId,
      educatorName,
      studentId,
      studentName,
      studentEmail,
      title,
      description,
      startTime,
      endTime,
      status: 'pending',
      type,
      location: location || 'TBD',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      googleEventId: null // Will be set if Google Calendar sync succeeds
    };

    // Try to sync with Google Calendar if educator has a token
    try {
      const vault = TokenVault.getInstance();
      const googleToken = vault.getToken(educatorId, 'google-calendar');
      if (googleToken) {
        // Use secure API call through Token Vault
        const googleEvent = GoogleCalendarService.formatEventForGoogle(newAppointment);
        const response = await fetch('/api/ai-tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: 'google-calendar',
            action: 'createEvent',
            params: googleEvent
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          newAppointment.googleEventId = result.result.id;
          console.log('Successfully synced appointment with Google Calendar:', result.result.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
      // Continue with appointment creation even if Google Calendar sync fails
    }

    appointments.set(newAppointment.id.toString(), newAppointment);

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      message: 'Appointment created successfully',
      syncedWithGoogle: !!newAppointment.googleEventId
    });
  }

  if (action === 'update') {
    const { appointmentId, updates } = data;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appointment = appointments.get(appointmentId.toString());
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    const canUpdate = 
      (roles.includes('educator') && appointment.educatorId === userEmail) ||
      (roles.includes('student') && (appointment.studentId === userId || appointment.studentEmail === userEmail));

    if (!canUpdate) {
      return NextResponse.json({ error: 'Unauthorized to update this appointment' }, { status: 403 });
    }

    // Update appointment
    const updatedAppointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Try to sync with Google Calendar if educator has a token and appointment has Google Event ID
    try {
      const vault = TokenVault.getInstance();
      const googleToken = vault.getToken(appointment.educatorId, 'google-calendar');
      if (googleToken && appointment.googleEventId) {
        const googleEvent = GoogleCalendarService.formatEventForGoogle(updatedAppointment);
        await GoogleCalendarService.updateEvent(googleToken, appointment.googleEventId, googleEvent);
        console.log('Successfully updated Google Calendar event:', appointment.googleEventId);
      }
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      // Continue with appointment update even if Google Calendar sync fails
    }

    appointments.set(appointmentId.toString(), updatedAppointment);

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully',
      syncedWithGoogle: !!appointment.googleEventId
    });
  }

  if (action === 'cancel') {
    const { appointmentId, reason } = data;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appointment = appointments.get(appointmentId.toString());
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    const canCancel = 
      (roles.includes('educator') && appointment.educatorId === userEmail) ||
      (roles.includes('student') && (appointment.studentId === userId || appointment.studentEmail === userEmail));

    if (!canCancel) {
      return NextResponse.json({ error: 'Unauthorized to cancel this appointment' }, { status: 403 });
    }

    // Cancel appointment
    const cancelledAppointment = {
      ...appointment,
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledAt: new Date().toISOString(),
      cancelledBy: userEmail
    };

    // Try to sync cancellation with Google Calendar if educator has a token and appointment has Google Event ID
    try {
      const vault = TokenVault.getInstance();
      const googleToken = vault.getToken(appointment.educatorId, 'google-calendar');
      if (googleToken && appointment.googleEventId) {
        await GoogleCalendarService.deleteEvent(googleToken, appointment.googleEventId);
        console.log('Successfully cancelled Google Calendar event:', appointment.googleEventId);
      }
    } catch (error) {
      console.error('Failed to cancel Google Calendar event:', error);
      // Continue with appointment cancellation even if Google Calendar sync fails
    }

    appointments.set(appointmentId.toString(), cancelledAppointment);

    return NextResponse.json({
      success: true,
      appointment: cancelledAppointment,
      message: 'Appointment cancelled successfully',
      syncedWithGoogle: !!appointment.googleEventId
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
