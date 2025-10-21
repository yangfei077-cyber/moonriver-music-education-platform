# Google Calendar Integration Setup Guide

This guide will help you set up real Google Calendar integration for the Moonriver Music Education Platform.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console
3. The Moonriver Music application running locally

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Give it a name (e.g., "Moonriver Music Calendar Integration")
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/google-calendar/callback` (for development)
   - `https://yourdomain.com/api/google-calendar/callback` (for production)
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID='your-client-id.googleusercontent.com'
GOOGLE_CLIENT_SECRET='your-client-secret'
GOOGLE_REDIRECT_URI='http://localhost:3000/api/google-calendar/callback'
```

## Step 5: OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Fill in the required information:
   - App name: "Moonriver Music"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
5. Add test users (your email) if in testing mode
6. Save and continue

## Step 6: Test the Integration

1. Start your application: `npm run dev`
2. Go to the scheduling page: `http://localhost:3000/student/appointments`
3. Click "Connect with Google Calendar"
4. Complete the OAuth flow
5. Test syncing appointments

## Features

### What the integration provides:

1. **OAuth Authentication**: Secure connection to user's Google Calendar
2. **Event Creation**: Automatically creates calendar events for appointments
3. **Event Details**: Includes lesson title, instructor, time, and reminders
4. **Reminders**: Sets up email and popup reminders
5. **Attendees**: Adds the student as an attendee
6. **Timezone Support**: Properly handles timezone information

### API Endpoints:

- `GET /api/google-calendar/auth` - Get OAuth URL
- `GET /api/google-calendar/callback` - Handle OAuth callback
- `GET /api/google-calendar/status` - Check connection status
- `POST /api/google-calendar/sync` - Sync appointments to calendar

## Security Considerations

1. **Token Storage**: In production, store OAuth tokens encrypted in a database
2. **Token Refresh**: Implement token refresh logic for expired tokens
3. **Scope Limitation**: Only request necessary calendar permissions
4. **Error Handling**: Proper error handling for API failures
5. **Rate Limiting**: Implement rate limiting for API calls

## Production Deployment

For production deployment:

1. Update redirect URIs in Google Cloud Console
2. Change OAuth consent screen to production mode
3. Implement proper token storage and encryption
4. Add error monitoring and logging
5. Test thoroughly with real Google accounts

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Check that redirect URIs match exactly
2. **"invalid_client"**: Verify client ID and secret are correct
3. **"access_denied"**: Check OAuth consent screen configuration
4. **"insufficient_scope"**: Ensure calendar scope is added

### Debug Mode:

Enable debug logging by setting:
```env
DEBUG=google-calendar:*
```

## Support

For issues with Google Calendar integration:
1. Check Google Cloud Console logs
2. Verify OAuth credentials
3. Test with different Google accounts
4. Check network connectivity to Google APIs

## Next Steps

After successful setup:
1. Implement token refresh logic
2. Add webhook support for calendar changes
3. Implement event updates and deletions
4. Add calendar selection (multiple calendars)
5. Add timezone detection and handling
