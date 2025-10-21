import { NextRequest, NextResponse } from 'next/server';

// Mock user profiles storage (in a real app, this would be a database)
const userProfiles = new Map<string, any>();

// Initialize with some demo data
userProfiles.set('student@moonriver.com', {
  userId: 'student@moonriver.com',
  displayName: 'James',
  preferences: {},
  updatedAt: new Date().toISOString()
});

userProfiles.set('educator@moonriver.com', {
  userId: 'educator@moonriver.com', 
  displayName: 'educator@moonriver.com',
  preferences: {},
  updatedAt: new Date().toISOString()
});

userProfiles.set('admin@moonriver.com', {
  userId: 'admin@moonriver.com',
  displayName: 'admin@moonriver.com', 
  preferences: {},
  updatedAt: new Date().toISOString()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const profile = userProfiles.get(userId);
  
  if (!profile) {
    // Create a new profile if it doesn't exist
    const newProfile = {
      userId,
      displayName: userId,
      preferences: {},
      updatedAt: new Date().toISOString()
    };
    userProfiles.set(userId, newProfile);
    return NextResponse.json({ success: true, profile: newProfile });
  }

  return NextResponse.json({ success: true, profile });
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, displayName, preferences } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get existing profile or create new one
    const existingProfile = userProfiles.get(userId) || {
      userId,
      displayName: userId,
      preferences: {},
      updatedAt: new Date().toISOString()
    };

    // Update the profile
    const updatedProfile = {
      ...existingProfile,
      displayName: displayName || existingProfile.displayName,
      preferences: preferences || existingProfile.preferences,
      updatedAt: new Date().toISOString()
    };

    userProfiles.set(userId, updatedProfile);

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
