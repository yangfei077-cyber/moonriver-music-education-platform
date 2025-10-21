import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for appointments


// Appointment storage (in production, use a database)
const appointments: Map<string, any> = new Map();
let appointmentIdCounter = 1;

// Demo appointment data
const demoAppointments = [
  {
    id: 1,
    educatorId: 'educator@moonriver.com',
    educatorName: 'Dr. Sarah Johnson',
    studentId: 'google-oauth2|116668263889504416152',
    studentName: 'Demo Student',
    studentEmail: 'yangfei077@gmail.com',
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
    studentId: 'google-oauth2|116668263889504416152',
    studentName: 'Demo Student',
    studentEmail: 'yangfei077@gmail.com',
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
  const session = await getSession(request);
  
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

  // Transform appointments to match frontend interface
  const transformedAppointments = allAppointments.map(apt => {
    const startDate = new Date(apt.startTime);
    const endDate = new Date(apt.endTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
    
    return {
      id: apt.id,
      educatorName: apt.educatorName,
      title: apt.title,
      date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
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
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  
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
      'taylor-swift': 'Taylor Swift'
    };

    const educatorName = educatorMap[educatorId] || educatorId;
    
    // Convert date and time to startTime and endTime
    const startTime = new Date(`${date}T${time}:00`).toISOString();
    const endTime = new Date(`${date}T${time}:00`);
    endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration
    const endTimeISO = endTime.toISOString();

    // Check for time conflicts
    const start = new Date(startTime);
    const end = new Date(endTimeISO);
    
    const conflictingAppointments = Array.from(appointments.values()).filter(apt => {
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
    const newAppointment = {
      id: appointmentIdCounter++,
      educatorId,
      educatorName,
      studentId: userId,
      studentName: user?.name || 'Student',
      studentEmail: userEmail,
      title,
      description: notes || '',
      startTime,
      endTime: endTimeISO,
      status: 'pending',
      type,
      location: 'TBD',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      googleEventId: null // Will be set if Google Calendar sync succeeds
    };

    // Note: Google Calendar sync can be implemented later if needed

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
