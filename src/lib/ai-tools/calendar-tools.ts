import { google } from "googleapis";
import { auth0 } from "../auth0-client";
import { formatISO, addHours } from 'date-fns';

export const checkUsersCalendar = {
  execute: async ({ date }: { date: Date }) => {
    try {
      const { token } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });

      if (!token) {
        return {
          available: false,
          error: 'No Google Calendar access token available. Please connect your Google account.'
        };
      }

      // Google SDK
      const calendar = google.calendar("v3");
      const auth = new google.auth.OAuth2();

      auth.setCredentials({ access_token: token });

      const response = await calendar.freebusy.query({
        auth,
        requestBody: {
          timeMin: formatISO(date),
          timeMax: formatISO(addHours(date, 1)),
          timeZone: "UTC",
          items: [{ id: "primary" }],
        },
      });

      const busyTimes = response.data?.calendars?.primary?.busy || [];
      const isAvailable = busyTimes.length === 0;

      return {
        available: isAvailable,
        busyTimes: busyTimes,
        date: formatISO(date),
        message: isAvailable 
          ? 'User is available at this time' 
          : `User has ${busyTimes.length} conflicting events`
      };
    } catch (error) {
      console.error('Error checking calendar availability:', error);
      return {
        available: false,
        error: 'Failed to check calendar availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export const createCalendarEvent = {
  execute: async ({ title, description, startTime, endTime, location }: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }) => {
    try {
      const { token } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });

      if (!token) {
        return {
          success: false,
          error: 'No Google Calendar access token available. Please connect your Google account.'
        };
      }

      // Google SDK
      const calendar = google.calendar("v3");
      const auth = new google.auth.OAuth2();

      auth.setCredentials({ access_token: token });

      const event = {
        summary: title,
        description: description || '',
        location: location || '',
        start: {
          dateTime: formatISO(startTime),
          timeZone: 'UTC',
        },
        end: {
          dateTime: formatISO(endTime),
          timeZone: 'UTC',
        },
      };

      const response = await calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink,
        message: 'Event created successfully'
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: 'Failed to create calendar event',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export const getUpcomingEvents = {
  execute: async ({ maxResults = 10, daysAhead = 7 }: {
    maxResults?: number;
    daysAhead?: number;
  }) => {
    try {
      const { token } = await auth0.getAccessTokenForConnection({ connection: 'google-oauth2' });

      if (!token) {
        return {
          success: false,
          error: 'No Google Calendar access token available. Please connect your Google account.'
        };
      }

      // Google SDK
      const calendar = google.calendar("v3");
      const auth = new google.auth.OAuth2();

      auth.setCredentials({ access_token: token });

      const now = new Date();
      const futureDate = addHours(now, daysAhead * 24);

      const response = await calendar.events.list({
        auth,
        calendarId: 'primary',
        timeMin: formatISO(now),
        timeMax: formatISO(futureDate),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      return {
        success: true,
        events: events.map(event => ({
          id: event.id,
          title: event.summary,
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          location: event.location,
          htmlLink: event.htmlLink
        })),
        count: events.length,
        message: `Found ${events.length} upcoming events`
      };
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return {
        success: false,
        error: 'Failed to get upcoming events',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
