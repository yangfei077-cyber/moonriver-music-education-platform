import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../lib/auth0.js';
import { getUserRoles } from '../../../lib/user-roles';

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const userId = user?.sub;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Fetch roles from Auth0 Management API
    const roles = await getUserRoles(userId);

    return NextResponse.json({
      success: true,
      roles: roles,
      userId: userId
    });
  } catch (error) {
    console.error('Error in GET /api/user-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
