import { NextResponse } from 'next/server';

export async function GET() {
  // Use Auth0's Continue URL for Token Vault linking
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const authUrl = `https://${auth0Domain}/continue?connection=google-oauth2&connection_scope=https://www.googleapis.com/auth/calendar offline_access&prompt=consent`;
  
  return NextResponse.json({
    authUrl,
    message: 'Redirect to Auth0 Continue URL for Google Calendar linking'
  });
}
