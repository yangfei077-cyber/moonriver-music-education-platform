import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../../lib/auth0';
import { checkUsersCalendar, createCalendarEvent, getUpcomingEvents } from '../../../../lib/ai-tools/calendar-tools';

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tool, parameters } = await request.json();

    if (!tool || !parameters) {
      return NextResponse.json({ 
        error: 'Tool name and parameters are required' 
      }, { status: 400 });
    }

    let result;

    switch (tool) {
      case 'checkUsersCalendar':
        result = await checkUsersCalendar.execute(parameters);
        break;
      
      case 'createCalendarEvent':
        result = await createCalendarEvent.execute(parameters);
        break;
      
      case 'getUpcomingEvents':
        result = await getUpcomingEvents.execute(parameters);
        break;
      
      default:
        return NextResponse.json({ 
          error: `Unknown tool: ${tool}` 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tool,
      result
    });

  } catch (error) {
    console.error('AI Tools Calendar error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute calendar tool',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return available calendar tools
  return NextResponse.json({
    success: true,
    tools: [
      {
        name: 'checkUsersCalendar',
        description: 'Check user availability on a given date time on their calendar',
        parameters: {
          date: 'Date - The date and time to check availability for'
        }
      },
      {
        name: 'createCalendarEvent',
        description: 'Create a new event in the user\'s Google Calendar',
        parameters: {
          title: 'string - Event title',
          description: 'string (optional) - Event description',
          startTime: 'Date - Event start time',
          endTime: 'Date - Event end time',
          location: 'string (optional) - Event location'
        }
      },
      {
        name: 'getUpcomingEvents',
        description: 'Get upcoming events from the user\'s Google Calendar',
        parameters: {
          maxResults: 'number (default: 10) - Maximum number of events to retrieve',
          daysAhead: 'number (default: 7) - Number of days ahead to look for events'
        }
      }
    ]
  });
}
