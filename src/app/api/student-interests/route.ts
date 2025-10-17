import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Student interests storage (in production, use a database)
const studentInterests: Map<string, string[]> = new Map();

// Preselect student@moonriver.com with demo interests
// This would typically be done during user registration or onboarding
const DEMO_STUDENT_INTERESTS = ['neo-soul', 'punk', 'jazz'];
const DEMO_STUDENT_USER_ID = 'auth0|68f0970657a65f6a14ef94f0'; // student@moonriver.com
studentInterests.set(DEMO_STUDENT_USER_ID, DEMO_STUDENT_INTERESTS);

// Available music interests/tags
const AVAILABLE_INTERESTS = [
  // Genres
  { id: 'neo-soul', label: 'Neo-Soul', category: 'genre' },
  { id: 'punk', label: 'Punk', category: 'genre' },
  { id: 'jazz', label: 'Jazz', category: 'genre' },
  { id: 'classical', label: 'Classical', category: 'genre' },
  { id: 'rock', label: 'Rock', category: 'genre' },
  { id: 'pop', label: 'Pop', category: 'genre' },
  { id: 'blues', label: 'Blues', category: 'genre' },
  { id: 'country', label: 'Country', category: 'genre' },
  { id: 'hip-hop', label: 'Hip-Hop', category: 'genre' },
  { id: 'electronic', label: 'Electronic', category: 'genre' },
  { id: 'folk', label: 'Folk', category: 'genre' },
  { id: 'reggae', label: 'Reggae', category: 'genre' },
  
  // Instruments
  { id: 'piano', label: 'Piano', category: 'instrument' },
  { id: 'guitar', label: 'Guitar', category: 'instrument' },
  { id: 'drums', label: 'Drums', category: 'instrument' },
  { id: 'bass', label: 'Bass', category: 'instrument' },
  { id: 'violin', label: 'Violin', category: 'instrument' },
  { id: 'trumpet', label: 'Trumpet', category: 'instrument' },
  { id: 'saxophone', label: 'Saxophone', category: 'instrument' },
  { id: 'flute', label: 'Flute', category: 'instrument' },
  { id: 'voice', label: 'Voice', category: 'instrument' },
  { id: 'keyboard', label: 'Keyboard', category: 'instrument' },
  { id: 'cello', label: 'Cello', category: 'instrument' },
  { id: 'clarinet', label: 'Clarinet', category: 'instrument' },
  
  // Skills
  { id: 'composition', label: 'Composition', category: 'skill' },
  { id: 'improvisation', label: 'Improvisation', category: 'skill' },
  { id: 'songwriting', label: 'Songwriting', category: 'skill' },
  { id: 'arrangement', label: 'Arrangement', category: 'skill' },
  { id: 'production', label: 'Music Production', category: 'skill' },
  { id: 'theory', label: 'Music Theory', category: 'skill' },
  { id: 'ear-training', label: 'Ear Training', category: 'skill' },
  { id: 'sight-reading', label: 'Sight Reading', category: 'skill' },
  { id: 'performance', label: 'Performance', category: 'skill' },
  { id: 'recording', label: 'Recording', category: 'skill' },
  
  // Learning Goals
  { id: 'beginner', label: 'Beginner', category: 'level' },
  { id: 'intermediate', label: 'Intermediate', category: 'level' },
  { id: 'advanced', label: 'Advanced', category: 'level' },
  { id: 'professional', label: 'Professional', category: 'level' },
  { id: 'hobby', label: 'Hobby', category: 'level' },
  { id: 'career', label: 'Career Development', category: 'level' }
];

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;

  // Only students can access their interests
  if (!roles.includes('student')) {
    return NextResponse.json({ error: 'Access denied. Only students can view interests.' }, { status: 403 });
  }

  const userInterestIds = studentInterests.get(userId!) || [];
  
  // Convert interest IDs to full interest objects
  const userInterests = userInterestIds.map(id => 
    AVAILABLE_INTERESTS.find(interest => interest.id === id)
  ).filter(Boolean);

  return NextResponse.json({
    success: true,
    interests: userInterests,
    availableInterests: AVAILABLE_INTERESTS,
    totalAvailable: AVAILABLE_INTERESTS.length
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;

  // Only students can update their interests
  if (!roles.includes('student')) {
    return NextResponse.json({ error: 'Access denied. Only students can update interests.' }, { status: 403 });
  }

  const { interests } = await request.json();

  if (!Array.isArray(interests)) {
    return NextResponse.json({ error: 'Interests must be an array' }, { status: 400 });
  }

  // Validate interests against available options
  const validInterestIds = AVAILABLE_INTERESTS.map(i => i.id);
  const invalidInterests = interests.filter(interest => !validInterestIds.includes(interest));
  
  if (invalidInterests.length > 0) {
    return NextResponse.json({ 
      error: 'Invalid interests provided', 
      invalidInterests 
    }, { status: 400 });
  }

  // Limit to 10 interests per student
  if (interests.length > 10) {
    return NextResponse.json({ 
      error: 'Maximum 10 interests allowed' 
    }, { status: 400 });
  }

  // Store student interests
  studentInterests.set(userId!, interests);

  return NextResponse.json({
    success: true,
    message: 'Interests updated successfully',
    interests: interests,
    count: interests.length
  });
}

// Admin endpoint to view all student interests
export async function PUT(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];

  // Only admins can view all student interests
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Access denied. Admin access required.' }, { status: 403 });
  }

  const allStudentInterests = Array.from(studentInterests.entries()).map(([userId, interests]) => ({
    userId,
    interests,
    count: interests.length
  }));

  // Get interest statistics
  const interestStats: { [key: string]: number } = {};
  studentInterests.forEach(interests => {
    interests.forEach(interest => {
      interestStats[interest] = (interestStats[interest] || 0) + 1;
    });
  });

  const popularInterests = Object.entries(interestStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([interest, count]) => ({ interest, count }));

  return NextResponse.json({
    success: true,
    allStudentInterests,
    totalStudents: studentInterests.size,
    popularInterests,
    availableInterests: AVAILABLE_INTERESTS
  });
}
