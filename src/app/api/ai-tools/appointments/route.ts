import { NextRequest, NextResponse } from 'next/server';
import { checkUsersCalendar, createCalendarEvent } from '../../../../lib/ai-tools/calendar-tools';

export async function POST(request: NextRequest) {
  // MCP-compliant authentication: No sessions, only bearer tokens
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="https://genai-2976115566729862.au.auth0.com/.well-known/oauth-authorization-server"'
        }
      }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { action, appointmentData } = await request.json();

    switch (action) {
      case 'check-availability':
        // Check if user is available at a specific time
        const { date } = appointmentData;
        const availabilityResult = await checkUsersCalendar.execute({ date: new Date(date) });
        
        return NextResponse.json({
          success: true,
          action: 'check-availability',
          result: availabilityResult,
          mcpCompliant: true
        });

      case 'create-appointment-event':
        // Create a Google Calendar event for an appointment
        const { title, description, startTime, endTime, location } = appointmentData;
        const eventResult = await createCalendarEvent.execute({
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location
        });
        
        return NextResponse.json({
          success: true,
          action: 'create-appointment-event',
          result: eventResult,
          mcpCompliant: true
        });

      case 'smart-schedule':
        // Smart scheduling: check availability and suggest times
        const { preferredDate, duration = 60 } = appointmentData;
        const baseDate = new Date(preferredDate);
        
        // Check availability for the preferred time
        const preferredAvailability = await checkUsersCalendar.execute({ date: baseDate });
        
        // If not available, suggest alternative times (check next hour)
        let suggestions = [];
        if (!preferredAvailability.available) {
          for (let i = 1; i <= 3; i++) {
            const alternativeDate = new Date(baseDate.getTime() + (i * 60 * 60 * 1000));
            const altAvailability = await checkUsersCalendar.execute({ date: alternativeDate });
            
            if (altAvailability.available) {
              suggestions.push({
                time: alternativeDate.toISOString(),
                available: true
              });
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          action: 'smart-schedule',
          result: {
            preferredTime: {
              time: baseDate.toISOString(),
              available: preferredAvailability.available
            },
            suggestions,
            message: preferredAvailability.available 
              ? 'Preferred time is available!' 
              : 'Preferred time is not available. Here are some alternatives:'
          },
          mcpCompliant: true
        });

      default:
        return NextResponse.json({ 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('AI Tools Appointments error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute appointment tool',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // MCP-compliant authentication: No sessions, only bearer tokens
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="https://genai-2976115566729862.au.auth0.com/.well-known/oauth-authorization-server"'
        }
      }
    );
  }

  // Return available appointment tools
  return NextResponse.json({
    success: true,
    tools: [
      {
        name: 'check-availability',
        description: 'Check if user is available at a specific time',
        parameters: {
          date: 'Date - The date and time to check availability for'
        }
      },
      {
        name: 'create-appointment-event',
        description: 'Create a Google Calendar event for an appointment',
        parameters: {
          title: 'string - Event title',
          description: 'string (optional) - Event description',
          startTime: 'Date - Event start time',
          endTime: 'Date - Event end time',
          location: 'string (optional) - Event location'
        }
      },
      {
        name: 'smart-schedule',
        description: 'Smart scheduling with availability checking and suggestions',
        parameters: {
          preferredDate: 'Date - Preferred appointment time',
          duration: 'number (optional, default: 60) - Appointment duration in minutes'
        }
      }
    ],
    mcpCompliant: true
  });
}