import { NextRequest, NextResponse } from 'next/server';

// Mock teaching areas data - same as student interests
const availableTeachingAreas = [
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
  { id: 'r&b', label: 'R&B', category: 'genre' },
  { id: 'metal', label: 'Metal', category: 'genre' },
  { id: 'funk', label: 'Funk', category: 'genre' },
  { id: 'soul', label: 'Soul', category: 'genre' },
  { id: 'disco', label: 'Disco', category: 'genre' },
  { id: 'indie', label: 'Indie', category: 'genre' },
  { id: 'alternative', label: 'Alternative', category: 'genre' },
  { id: 'gospel', label: 'Gospel', category: 'genre' },

  // Instruments
  { id: 'piano', label: 'Piano', category: 'instrument' },
  { id: 'guitar', label: 'Guitar', category: 'instrument' },
  { id: 'drums', label: 'Drums', category: 'instrument' },
  { id: 'bass', label: 'Bass', category: 'instrument' },
  { id: 'violin', label: 'Violin', category: 'instrument' },
  { id: 'cello', label: 'Cello', category: 'instrument' },
  { id: 'saxophone', label: 'Saxophone', category: 'instrument' },
  { id: 'trumpet', label: 'Trumpet', category: 'instrument' },
  { id: 'flute', label: 'Flute', category: 'instrument' },
  { id: 'voice', label: 'Voice', category: 'instrument' },
  { id: 'ukulele', label: 'Ukulele', category: 'instrument' },
  { id: 'banjo', label: 'Banjo', category: 'instrument' },
  { id: 'harmonica', label: 'Harmonica', category: 'instrument' },
  { id: 'keyboard', label: 'Keyboard', category: 'instrument' },
  { id: 'synthesizer', label: 'Synthesizer', category: 'instrument' },

  // Skills
  { id: 'music-theory', label: 'Music Theory', category: 'skill' },
  { id: 'composition', label: 'Composition', category: 'skill' },
  { id: 'arrangement', label: 'Arrangement', category: 'skill' },
  { id: 'improvisation', label: 'Improvisation', category: 'skill' },
  { id: 'sight-reading', label: 'Sight Reading', category: 'skill' },
  { id: 'ear-training', label: 'Ear Training', category: 'skill' },
  { id: 'music-production', label: 'Music Production', category: 'skill' },
  { id: 'songwriting', label: 'Songwriting', category: 'skill' },
  { id: 'performance', label: 'Performance', category: 'skill' },
  { id: 'recording', label: 'Recording', category: 'skill' },

  // Levels
  { id: 'beginner', label: 'Beginner', category: 'level' },
  { id: 'intermediate', label: 'Intermediate', category: 'level' },
  { id: 'advanced', label: 'Advanced', category: 'level' },
  { id: 'professional', label: 'Professional', category: 'level' }
];

// Mock educator teaching areas storage
let educatorTeachingAreas: { [key: string]: string[] } = {
  'educator@moonriver.com': ['piano', 'music-theory', 'composition', 'jazz', 'classical'],
  'mike.chen@moonriver.com': ['guitar', 'rock', 'blues', 'composition']
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRoles = searchParams.get('roles');

    console.log('GET educator teaching areas:', { userId, userRoles });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For demo purposes, allow educators and admins to view teaching areas
    if (!userRoles || (!userRoles.includes('educator') && !userRoles.includes('admin'))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userEmail = searchParams.get('userEmail') || userId;
    const selectedAreaIds = educatorTeachingAreas[userEmail] || [];
    
    // Convert IDs to full objects
    const selectedAreas = availableTeachingAreas.filter(area => 
      selectedAreaIds.includes(area.id)
    );

    console.log('Returning teaching areas:', { userEmail, selectedAreas });

    return NextResponse.json({
      teachingAreas: selectedAreas,
      availableAreas: availableTeachingAreas
    });

  } catch (error) {
    console.error('Error fetching educator teaching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teaching areas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userRoles, userEmail, teachingAreaIds } = body;

    console.log('POST educator teaching areas:', { userId, userRoles, userEmail, teachingAreaIds });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is an educator
    if (!userRoles || !userRoles.includes('educator')) {
      return NextResponse.json({ error: 'Only educators can manage teaching areas' }, { status: 403 });
    }

    if (!Array.isArray(teachingAreaIds)) {
      return NextResponse.json({ error: 'Teaching areas must be an array' }, { status: 400 });
    }

    // Validate teaching area IDs
    const validIds = availableTeachingAreas.map(area => area.id);
    const invalidIds = teachingAreaIds.filter((id: string) => !validIds.includes(id));
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid teaching area IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Store teaching areas
    const email = userEmail || userId;
    educatorTeachingAreas[email] = teachingAreaIds;

    // Convert IDs to full objects
    const selectedAreas = availableTeachingAreas.filter(area => 
      teachingAreaIds.includes(area.id)
    );

    console.log('Saved teaching areas:', { email, selectedAreas });

    return NextResponse.json({
      success: true,
      teachingAreas: selectedAreas
    });

  } catch (error) {
    console.error('Error saving educator teaching areas:', error);
    return NextResponse.json(
      { error: 'Failed to save teaching areas' },
      { status: 500 }
    );
  }
}
