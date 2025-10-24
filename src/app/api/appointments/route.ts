import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth0 } from '../../../../lib/auth0.js';

// Helper function to get Google Calendar token from Auth0 Token Vault
async function getGoogleCalendarToken(): Promise<string | null> {
  try {
    const tokenData = await auth0.getAccessToken({
      audience: 'https://www.googleapis.com/auth/calendar.freebusy'
    });
    return tokenData?.token || null;
  } catch (error) {
    console.error('Error getting Google Calendar token from Auth0:', error);
    return null;
  }
}


// JSON file storage for appointments
const APPOINTMENTS_FILE = path.join(process.cwd(), 'data', 'appointments.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize appointments file if it doesn't exist
if (!fs.existsSync(APPOINTMENTS_FILE)) {
  fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify({ appointments: [], nextId: 1 }, null, 2));
}

// Helper functions for JSON file operations
function readAppointments() {
  try {
    const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading appointments:', error);
    return { appointments: [], nextId: 1 };
  }
}

function writeAppointments(data: any) {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing appointments:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const userId = user?.sub;
    const userEmail = user?.email;

    // Email-based role detection (same as UserContext)
    const getUserRolesFromEmail = (email: string) => {
      if (email === 'admin@moonriver.com') return ['Admin'];
      if (email === 'educator@moonriver.com') return ['Educator'];
      return ['Student'];
    };
    
    const roles = userEmail ? getUserRolesFromEmail(userEmail) : ['Student'];


    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Get all appointments from JSON file
    const { appointments: fileAppointments, nextId } = readAppointments();
    let allAppointments = fileAppointments || [];

  // Filter appointments based on user role
  if (roles.includes('Educator')) {
    // Educators see their own appointments
    allAppointments = allAppointments.filter((apt: any) => 
      apt.educatorId === userEmail || 
      apt.instructorEmail === userEmail ||
      apt.educatorEmail === userEmail
    );
  } else if (roles.includes('Student')) {
    // Students see appointments they're involved in
    allAppointments = allAppointments.filter((apt: any) => 
      apt.studentId === userId || 
      apt.studentEmail === userEmail ||
      apt.studentEmail === user?.email
    );
  }

  // Apply additional filters
  if (startDate) {
    const start = new Date(startDate);
    allAppointments = allAppointments.filter((apt: any) => new Date(apt.startTime) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    allAppointments = allAppointments.filter((apt: any) => new Date(apt.startTime) <= end);
  }

  if (status) {
    allAppointments = allAppointments.filter((apt: any) => apt.status === status);
  } else {
    // By default, exclude cancelled appointments unless specifically requested
    allAppointments = allAppointments.filter((apt: any) => apt.status !== 'cancelled');
  }

  // Sort by start time
  allAppointments.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Transform appointments to match frontend interface
  const transformedAppointments = allAppointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const endDate = new Date(apt.endTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
    
    // Extract date directly from the stored string to avoid timezone conversion
    const dateOnly = apt.startTime.split('T')[0]; // YYYY-MM-DD format
    
    return {
      id: apt.id,
      educatorName: apt.educatorName,
      title: apt.title,
      date: dateOnly, // Use the date part directly from stored string
      time: `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      duration: durationHours === 1 ? '1 hour' : `${durationHours} hours`,
      status: apt.status,
      source: 'moonriver',
      description: apt.description,
      location: apt.location,
      googleEventId: apt.googleEventId
    };
  });

  return NextResponse.json({
    success: true,
    appointments: transformedAppointments,
    total: transformedAppointments.length
  });
  } catch (error) {
    console.error('Error in GET /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const userId = user?.sub;
  const userEmail = user?.email;

  // Email-based role detection (same as UserContext)
  const getUserRolesFromEmail = (email: string) => {
    if (email === 'admin@moonriver.com') return ['Admin'];
    if (email === 'educator@moonriver.com') return ['Educator'];
    return ['Student'];
  };
  
  const roles = userEmail ? getUserRolesFromEmail(userEmail) : ['Student'];


  const { action, ...data } = await request.json();

  if (action === 'create') {
    // Only educators and students can create appointments
    if (!roles.includes('Educator') && !roles.includes('Student')) {
      return NextResponse.json({ error: 'Only educators and students can create appointments' }, { status: 403 });
    }

    const {
      educatorId,
      title,
      date,
      time,
      notes,
      type = 'lesson'
    } = data;

    // Validate required fields
    if (!educatorId || !title || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Map educator ID to name
    const educatorMap: { [key: string]: string } = {
      'john-williams': 'John Williams',
      'adele-adkins': 'Adele Adkins',
      'steve-vai': 'Steve Vai',
      'taylor-swift': 'Taylor Swift',
      'educator@moonriver.com': 'Dr. Sarah Johnson',
      'mike.chen@moonriver.com': 'Mike Chen'
    };

    const educatorName = educatorMap[educatorId] || educatorId;
    
    // Convert date and time to startTime and endTime
    // Store as local time strings to avoid timezone conversion issues
    const startTimeISO = `${date}T${time}:00`;
    
    // Calculate end time (add 1 hour)
    const [hours, minutes] = time.split(':').map(Number);
    const endHour = hours + 1;
    const endTimeFormatted = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const endTimeISO = `${date}T${endTimeFormatted}:00`;

    // Check for time conflicts
    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);
    
    const { appointments: conflictAppointments } = readAppointments();
    const conflictingAppointments = conflictAppointments.filter((apt: any) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (apt.educatorId === educatorId || apt.studentId === userId) &&
        apt.status !== 'cancelled' &&
        ((start >= aptStart && start < aptEnd) || (end > aptStart && end <= aptEnd) || (start <= aptStart && end >= aptEnd))
      );
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({ error: 'Time conflict with existing appointment' }, { status: 400 });
    }

    // Create new appointment
    const { appointments: existingAppointments, nextId } = readAppointments();
    const newAppointment = {
      id: nextId,
      educatorId,
      educatorName,
      studentId: userId,
      studentName: user?.name || 'Student',
      studentEmail: userEmail,
      title,
      description: notes || '',
      startTime: startTimeISO,
      endTime: endTimeISO,
      status: 'pending',
      type,
      location: 'TBD',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      googleEventId: null // Will be set if Google Calendar sync succeeds
    };

    // Note: Google Calendar sync can be implemented later if needed

    // Save to JSON file
    existingAppointments.push(newAppointment);
    writeAppointments({ appointments: existingAppointments, nextId: nextId + 1 });

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

    const { appointments: updateAppointments } = readAppointments();
    const appointment = updateAppointments.find((apt: any) => apt.id.toString() === appointmentId.toString());
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    const canUpdate = 
      (roles.includes('Educator') && appointment.educatorId === userEmail) ||
      (roles.includes('Student') && (appointment.studentId === userId || appointment.studentEmail === userEmail));

    if (!canUpdate) {
      return NextResponse.json({ error: 'Unauthorized to update this appointment' }, { status: 403 });
    }

    // Update appointment
    const updatedAppointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Google Calendar sync can be added later if needed

    // Save to JSON file
    const { appointments: updateFileAppointments, nextId: updateNextId } = readAppointments();
    const appointmentIndex = updateFileAppointments.findIndex((apt: any) => apt.id.toString() === appointmentId.toString());
    if (appointmentIndex !== -1) {
      updateFileAppointments[appointmentIndex] = updatedAppointment;
      writeAppointments({ appointments: updateFileAppointments, nextId: updateNextId });
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully',
      syncedWithGoogle: !!appointment.googleEventId
    });
  }

  if (action === 'reschedule') {
    const { appointmentId, newDate, newTime, notes } = data;

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json({ error: 'Appointment ID, new date, and new time are required' }, { status: 400 });
    }

    const { appointments: updateAppointments } = readAppointments();
    const appointment = updateAppointments.find((apt: any) => apt.id.toString() === appointmentId.toString());
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    const canReschedule = 
      (roles.includes('Educator') && appointment.educatorId === userEmail) ||
      (roles.includes('Student') && (appointment.studentId === userId || appointment.studentEmail === userEmail));

    if (!canReschedule) {
      return NextResponse.json({ error: 'Unauthorized to reschedule this appointment' }, { status: 403 });
    }

    // Check if appointment can be rescheduled (not completed or already cancelled)
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot reschedule completed or cancelled appointments' }, { status: 400 });
    }

    // Calculate new start and end times
    // Handle time format conversion - ensure proper 24-hour format
    let formattedTime = newTime;
    
    // If time is in 12-hour format (contains AM/PM), convert to 24-hour
    if (newTime.toLowerCase().includes('am') || newTime.toLowerCase().includes('pm')) {
      const isPM = newTime.toLowerCase().includes('pm');
      const timeOnly = newTime.replace(/\s*(am|pm)/i, '');
      const [hours, minutes] = timeOnly.split(':');
      let hour24 = parseInt(hours);
      
      if (isPM && hour24 !== 12) {
        hour24 += 12;
      } else if (!isPM && hour24 === 12) {
        hour24 = 0;
      }
      
      formattedTime = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } else {
      // Assume 24-hour format, just pad with zeros if needed
      const [hours, minutes] = newTime.split(':');
      formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    // Store as local time strings to avoid timezone conversion issues
    const newStartTimeISO = `${newDate}T${formattedTime}:00`;
    
    // Calculate end time (add 1 hour)
    const [hours, minutes] = formattedTime.split(':').map(Number);
    const endHour = hours + 1;
    const endTimeFormatted = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const newEndTimeISO = `${newDate}T${endTimeFormatted}:00`;

    // Check for time conflicts with new time
    const start = new Date(newStartTimeISO);
    const end = new Date(newEndTimeISO);
    
    const { appointments: conflictAppointments } = readAppointments();
    const conflictingAppointments = conflictAppointments.filter((apt: any) => {
      if (apt.id.toString() === appointmentId.toString()) return false; // Skip the appointment being rescheduled
      
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (apt.educatorId === appointment.educatorId || apt.studentId === appointment.studentId) &&
        apt.status !== 'cancelled' &&
        ((start >= aptStart && start < aptEnd) || (end > aptStart && end <= aptEnd) || (start <= aptStart && end >= aptEnd))
      );
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({ error: 'Time conflict with existing appointment' }, { status: 400 });
    }

    // Create reschedule record
    const rescheduleRecord = {
      originalStartTime: appointment.startTime,
      originalEndTime: appointment.endTime,
      rescheduledAt: new Date().toISOString(),
      rescheduledBy: userEmail,
      reason: notes || 'No reason provided'
    };

    // Update appointment with new time
    const rescheduledAppointment = {
      ...appointment,
      startTime: newStartTimeISO,
      endTime: newEndTimeISO,
      status: 'pending', // Reset to pending for confirmation
      rescheduleHistory: [...(appointment.rescheduleHistory || []), rescheduleRecord],
      updatedAt: new Date().toISOString()
    };

    // Google Calendar sync - update event if it exists
    let googleCalendarSynced = false;
    if (appointment.googleEventId) {
      try {
        // Get Google Calendar token from Auth0 Token Vault
        const accessToken = await getGoogleCalendarToken();
        
        if (accessToken) {
          // Update event in Google Calendar
          const googleEvent = {
            summary: `${rescheduledAppointment.title} - ${rescheduledAppointment.educatorName}`,
            description: rescheduledAppointment.description || `Lesson with ${rescheduledAppointment.educatorName}`,
            start: {
              dateTime: new Date(rescheduledAppointment.startTime).toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(rescheduledAppointment.endTime).toISOString(),
              timeZone: 'UTC'
            },
            location: rescheduledAppointment.location || 'TBD',
            extendedProperties: {
              private: {
                moonriver: 'true'
              }
            }
          };
          
          const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleEventId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          });
          
          if (updateResponse.ok) {
            console.log(`Updated Google Calendar event ${appointment.googleEventId} for rescheduled appointment ${appointmentId}`);
            googleCalendarSynced = true;
          } else {
            console.error(`Failed to update Google Calendar event ${appointment.googleEventId}:`, updateResponse.status);
          }
        }
      } catch (error) {
        console.error('Error syncing reschedule to Google Calendar:', error);
      }
    }

    // Save to JSON file
    const { appointments: rescheduleFileAppointments, nextId: rescheduleNextId } = readAppointments();
    const appointmentIndex = rescheduleFileAppointments.findIndex((apt: any) => apt.id.toString() === appointmentId.toString());
    if (appointmentIndex !== -1) {
      rescheduleFileAppointments[appointmentIndex] = rescheduledAppointment;
      writeAppointments({ appointments: rescheduleFileAppointments, nextId: rescheduleNextId });
    }

    return NextResponse.json({
      success: true,
      appointment: rescheduledAppointment,
      message: `Appointment rescheduled successfully${googleCalendarSynced ? ' and updated in Google Calendar' : ''}`,
      syncedWithGoogle: googleCalendarSynced
    });
  }

  if (action === 'cancel') {
    const { appointmentId, reason } = data;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const { appointments: updateAppointments } = readAppointments();
    const appointment = updateAppointments.find((apt: any) => apt.id.toString() === appointmentId.toString());
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check permissions
    const canCancel = 
      (roles.includes('Educator') && appointment.educatorId === userEmail) ||
      (roles.includes('Student') && (appointment.studentId === userId || appointment.studentEmail === userEmail));

    if (!canCancel) {
      return NextResponse.json({ error: 'Unauthorized to cancel this appointment' }, { status: 403 });
    }

    // Check if appointment can be cancelled (not already completed or cancelled)
    if (appointment.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel completed appointments' }, { status: 400 });
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }

    // Cancel appointment
    const cancelledAppointment = {
      ...appointment,
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledAt: new Date().toISOString(),
      cancelledBy: userEmail
    };

    // Google Calendar sync - delete event if it exists
    let googleCalendarSynced = false;
    if (appointment.googleEventId) {
      try {
        // Get Google Calendar token from Auth0 Token Vault
        const accessToken = await getGoogleCalendarToken();
        
        if (accessToken) {
          // Delete event from Google Calendar
          const deleteResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleEventId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (deleteResponse.ok) {
            console.log(`Deleted Google Calendar event ${appointment.googleEventId} for cancelled appointment ${appointmentId}`);
            googleCalendarSynced = true;
          } else {
            console.error(`Failed to delete Google Calendar event ${appointment.googleEventId}:`, deleteResponse.status);
          }
        }
      } catch (error) {
        console.error('Error syncing cancellation to Google Calendar:', error);
      }
    }

    // Save to JSON file
    const { appointments: cancelFileAppointments, nextId: cancelNextId } = readAppointments();
    const appointmentIndex = cancelFileAppointments.findIndex((apt: any) => apt.id.toString() === appointmentId.toString());
    if (appointmentIndex !== -1) {
      cancelFileAppointments[appointmentIndex] = cancelledAppointment;
      writeAppointments({ appointments: cancelFileAppointments, nextId: cancelNextId });
    }

    return NextResponse.json({
      success: true,
      appointment: cancelledAppointment,
      message: `Appointment cancelled successfully${googleCalendarSynced ? ' and removed from Google Calendar' : ''}`,
      syncedWithGoogle: googleCalendarSynced
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
