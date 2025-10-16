import { NextRequest, NextResponse } from 'next/server';

// Simplified user management for demo
export async function GET(request: NextRequest) {
  // Mock user data for demo
  const mockUsers = [
    {
      id: 'auth0|admin123',
      email: 'admin@moonriver.com',
      name: 'Admin User',
      picture: '/default-avatar.png',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:30:00Z',
      loginsCount: 25,
      roles: ['admin'],
    },
    {
      id: 'auth0|educator123',
      email: 'educator@moonriver.com',
      name: 'Educator User',
      picture: '/default-avatar.png',
      createdAt: '2024-01-02T00:00:00Z',
      lastLogin: '2024-01-14T09:15:00Z',
      loginsCount: 18,
      roles: ['educator'],
    },
    {
      id: 'auth0|student123',
      email: 'student@moonriver.com',
      name: 'Student User',
      picture: '/default-avatar.png',
      createdAt: '2024-01-03T00:00:00Z',
      lastLogin: '2024-01-13T14:20:00Z',
      loginsCount: 12,
      roles: ['student'],
    },
  ];

  return NextResponse.json({ users: mockUsers });
}

export async function POST(request: NextRequest) {
  const { action, userId, role } = await request.json();
  
  if (action === 'assignRole') {
    // Mock role assignment
    return NextResponse.json({ 
      success: true, 
      message: `Role '${role}' assigned to user ${userId}` 
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}