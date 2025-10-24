import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '../../../../lib/auth0';

// Course and enrollment storage (in production, use a database)
const courses: Map<number, any> = new Map();
const enrollments: Map<string, number[]> = new Map();
const courseProgress: Map<string, Map<number, number>> = new Map();

// Preselect student@moonriver.com with demo enrollments
const DEMO_STUDENT_EMAIL = 'student@moonriver.com';
enrollments.set(DEMO_STUDENT_EMAIL, [1, 2, 9, 13]); // Piano Fundamentals (1), Advanced Guitar Techniques (2), Vocal Training (9), Folk & Acoustic Guitar (13)

// Set specific progress for student@moonriver.com
const studentProgress = new Map<number, number>();
studentProgress.set(1, 75); // Piano Fundamentals - 75%
studentProgress.set(2, 45); // Advanced Guitar Techniques - 45%
studentProgress.set(9, 30); // Vocal Training & Performance - 30%
studentProgress.set(13, 20); // Folk & Acoustic Guitar - 20%
courseProgress.set(DEMO_STUDENT_EMAIL, studentProgress);

// Initialize with sample courses
const sampleCourses = [
  {
    id: 1,
    title: 'Piano Fundamentals',
    description: 'Learn the basics of piano playing, including proper posture, hand positioning, and fundamental techniques.',
    instructor: 'Dr. Sarah Johnson',
    instructorEmail: 'educator@moonriver.com',
    level: 'Beginner',
    duration: '8 weeks',
    maxStudents: 15,
    currentStudents: 8,
    price: '$199',
    schedule: 'Tuesdays & Thursdays, 6:00 PM - 7:30 PM',
    startDate: '2024-02-01',
    endDate: '2024-03-28',
    topics: ['Basic scales', 'Chord progressions', 'Simple melodies', 'Reading sheet music'],
    prerequisites: 'No prior experience required',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 2,
    title: 'Advanced Guitar Techniques',
    description: 'Master advanced guitar techniques including fingerpicking, barre chords, and improvisation.',
    instructor: 'Mike Chen',
    instructorEmail: 'mike@moonriver.com',
    level: 'Advanced',
    duration: '12 weeks',
    maxStudents: 12,
    currentStudents: 5,
    price: '$299',
    schedule: 'Mondays & Wednesdays, 7:00 PM - 8:30 PM',
    startDate: '2024-02-05',
    endDate: '2024-04-29',
    topics: ['Fingerpicking patterns', 'Barre chords', 'Jazz improvisation', 'Advanced scales'],
    prerequisites: 'Intermediate guitar skills required',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    title: 'Music Theory Essentials',
    description: 'Comprehensive music theory course covering scales, chords, harmony, and composition basics.',
    instructor: 'Dr. Sarah Johnson',
    instructorEmail: 'educator@moonriver.com',
    level: 'Intermediate',
    duration: '10 weeks',
    maxStudents: 20,
    currentStudents: 12,
    price: '$249',
    schedule: 'Saturdays, 10:00 AM - 12:00 PM',
    startDate: '2024-02-03',
    endDate: '2024-04-13',
    topics: ['Scale construction', 'Chord theory', 'Harmonic progressions', 'Composition basics'],
    prerequisites: 'Basic music reading skills',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 4,
    title: 'Jazz Improvisation Workshop',
    description: 'Learn the art of jazz improvisation with focus on chord changes, scales, and solo techniques.',
    instructor: 'Mike Chen',
    instructorEmail: 'mike@moonriver.com',
    level: 'Advanced',
    duration: '6 weeks',
    maxStudents: 10,
    currentStudents: 7,
    price: '$349',
    schedule: 'Sundays, 2:00 PM - 4:00 PM',
    startDate: '2024-02-11',
    endDate: '2024-03-24',
    topics: ['Jazz scales', 'Chord substitution', 'Rhythmic patterns', 'Performance techniques'],
    prerequisites: 'Intermediate to advanced instrumental skills',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 5,
    title: 'Songwriting & Composition',
    description: 'Develop your songwriting skills and learn composition techniques for various musical styles.',
    instructor: 'Dr. Sarah Johnson',
    instructorEmail: 'educator@moonriver.com',
    level: 'Beginner',
    duration: '8 weeks',
    maxStudents: 18,
    currentStudents: 10,
    price: '$229',
    schedule: 'Fridays, 6:30 PM - 8:00 PM',
    startDate: '2024-02-02',
    endDate: '2024-03-29',
    topics: ['Lyric writing', 'Melody creation', 'Chord progressions', 'Song structure'],
    prerequisites: 'Basic knowledge of any instrument',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 6,
    title: 'Digital Music Production',
    description: 'Learn modern music production techniques using digital audio workstations and software.',
    instructor: 'Alex Rivera',
    instructorEmail: 'alex@moonriver.com',
    level: 'Intermediate',
    duration: '10 weeks',
    maxStudents: 15,
    currentStudents: 9,
    price: '$279',
    schedule: 'Thursdays, 7:30 PM - 9:00 PM',
    startDate: '2024-02-08',
    endDate: '2024-04-18',
    topics: ['DAW basics', 'MIDI programming', 'Audio recording', 'Mixing & mastering'],
    prerequisites: 'Basic computer skills',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 7,
    title: 'Classical Violin Techniques',
    description: 'Master classical violin playing with focus on proper bow technique, intonation, and musical expression.',
    instructor: 'Elena Petrov',
    instructorEmail: 'elena@moonriver.com',
    level: 'Intermediate',
    duration: '12 weeks',
    maxStudents: 8,
    currentStudents: 6,
    price: '$399',
    schedule: 'Mondays & Fridays, 5:00 PM - 6:30 PM',
    startDate: '2024-02-12',
    endDate: '2024-05-06',
    topics: ['Bow technique', 'Left hand positioning', 'Classical repertoire', 'Performance skills'],
    prerequisites: 'Basic violin knowledge',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 8,
    title: 'Blues Guitar Mastery',
    description: 'Dive deep into blues guitar playing, learning traditional and modern blues techniques and styles.',
    instructor: 'Marcus Johnson',
    instructorEmail: 'marcus@moonriver.com',
    level: 'Intermediate',
    duration: '8 weeks',
    maxStudents: 12,
    currentStudents: 8,
    price: '$249',
    schedule: 'Wednesdays, 7:00 PM - 8:30 PM',
    startDate: '2024-02-07',
    endDate: '2024-03-27',
    topics: ['12-bar blues', 'Blues scales', 'Bending techniques', 'Rhythm patterns'],
    prerequisites: 'Basic guitar skills',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 9,
    title: 'Vocal Training & Performance',
    description: 'Develop your singing voice through proper breathing, vocal exercises, and performance techniques.',
    instructor: 'Sarah Williams',
    instructorEmail: 'sarah@moonriver.com',
    level: 'Beginner',
    duration: '10 weeks',
    maxStudents: 16,
    currentStudents: 12,
    price: '$229',
    schedule: 'Tuesdays & Thursdays, 6:00 PM - 7:30 PM',
    startDate: '2024-02-06',
    endDate: '2024-04-16',
    topics: ['Breathing techniques', 'Vocal warm-ups', 'Range expansion', 'Stage presence'],
    prerequisites: 'No prior experience required',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
  },
  {
    id: 10,
    title: 'Electronic Music & Synthesizers',
    description: 'Explore electronic music creation using synthesizers, drum machines, and modern production tools.',
    instructor: 'Alex Rivera',
    instructorEmail: 'alex@moonriver.com',
    level: 'Beginner',
    duration: '8 weeks',
    maxStudents: 14,
    currentStudents: 7,
    price: '$269',
    schedule: 'Saturdays, 1:00 PM - 3:00 PM',
    startDate: '2024-02-10',
    endDate: '2024-04-06',
    topics: ['Synthesizer basics', 'Sound design', 'Electronic genres', 'Live performance'],
    prerequisites: 'Basic music theory knowledge',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 11,
    title: 'Jazz Piano Fundamentals',
    description: 'Learn jazz piano techniques including chord voicings, improvisation, and classic jazz standards.',
    instructor: 'Dr. Sarah Johnson',
    instructorEmail: 'educator@moonriver.com',
    level: 'Intermediate',
    duration: '12 weeks',
    maxStudents: 10,
    currentStudents: 6,
    price: '$349',
    schedule: 'Sundays, 11:00 AM - 1:00 PM',
    startDate: '2024-02-11',
    endDate: '2024-05-05',
    topics: ['Jazz chord voicings', 'Swing rhythm', 'Jazz standards', 'Improvisation'],
    prerequisites: 'Intermediate piano skills',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 12,
    title: 'Rock Drumming Techniques',
    description: 'Master rock drumming patterns, fills, and performance techniques for live and studio settings.',
    instructor: 'Tommy Rodriguez',
    instructorEmail: 'tommy@moonriver.com',
    level: 'Beginner',
    duration: '10 weeks',
    maxStudents: 8,
    currentStudents: 5,
    price: '$279',
    schedule: 'Mondays & Wednesdays, 7:30 PM - 9:00 PM',
    startDate: '2024-02-05',
    endDate: '2024-04-15',
    topics: ['Basic rock beats', 'Drum fills', 'Ghost notes', 'Dynamic control'],
    prerequisites: 'No prior experience required',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 13,
    title: 'Folk & Acoustic Guitar',
    description: 'Learn fingerpicking styles and acoustic guitar techniques for folk, country, and singer-songwriter genres.',
    instructor: 'Mike Chen',
    instructorEmail: 'mike@moonriver.com',
    level: 'Beginner',
    duration: '8 weeks',
    maxStudents: 15,
    currentStudents: 11,
    price: '$199',
    schedule: 'Fridays, 6:00 PM - 7:30 PM',
    startDate: '2024-02-09',
    endDate: '2024-04-05',
    topics: ['Fingerpicking patterns', 'Open tunings', 'Folk songs', 'Acoustic techniques'],
    prerequisites: 'Basic guitar knowledge',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop'
  },
  {
    id: 14,
    title: 'Music Business & Industry',
    description: 'Learn about the music industry, copyright, publishing, and how to build a sustainable music career.',
    instructor: 'David Kim',
    instructorEmail: 'david@moonriver.com',
    level: 'Beginner',
    duration: '6 weeks',
    maxStudents: 20,
    currentStudents: 14,
    price: '$189',
    schedule: 'Wednesdays, 6:30 PM - 8:00 PM',
    startDate: '2024-02-14',
    endDate: '2024-03-27',
    topics: ['Copyright law', 'Music publishing', 'Marketing strategies', 'Career planning'],
    prerequisites: 'No prior experience required',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  },
  {
    id: 15,
    title: 'World Music Exploration',
    description: 'Discover musical traditions from around the world and learn to play various ethnic instruments.',
    instructor: 'Priya Sharma',
    instructorEmail: 'priya@moonriver.com',
    level: 'Beginner',
    duration: '10 weeks',
    maxStudents: 16,
    currentStudents: 9,
    price: '$239',
    schedule: 'Saturdays, 10:00 AM - 12:00 PM',
    startDate: '2024-02-03',
    endDate: '2024-04-13',
    topics: ['African rhythms', 'Indian classical', 'Latin percussion', 'Asian instruments'],
    prerequisites: 'No prior experience required',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop'
  }
];

// Initialize courses
sampleCourses.forEach(course => {
  courses.set(course.id, course);
});

export async function GET(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || user?.roles || ['student']; // Default to student if no roles found
  const userId = user?.sub;
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const instructor = searchParams.get('instructor');

  // Get all courses
  let allCourses = Array.from(courses.values());

  // Apply filters
  if (level) {
    allCourses = allCourses.filter(course => course.level.toLowerCase() === level.toLowerCase());
  }
  
  if (instructor) {
    allCourses = allCourses.filter(course => 
      course.instructor.toLowerCase().includes(instructor.toLowerCase())
    );
  }

  // Add enrollment status for students
  if (roles.includes('student')) {
    const userEmail = user?.email;
    const studentEnrollments = enrollments.get(userEmail!) || [];
    const studentProgressMap = courseProgress.get(userEmail!) || new Map();
    console.log('Student enrollments for', userEmail, ':', studentEnrollments);
    allCourses = allCourses.map(course => {
      const isEnrolled = studentEnrollments.includes(course.id);
      const canEnroll = course.currentStudents < course.maxStudents && !studentEnrollments.includes(course.id);
      const progress = studentProgressMap.get(course.id) || 0;
      console.log(`Course ${course.id} (${course.title}): isEnrolled=${isEnrolled}, canEnroll=${canEnroll}, progress=${progress}%`);
      return {
        ...course,
        isEnrolled,
        canEnroll,
        progress
      };
    });
  }

  return NextResponse.json({
    success: true,
    courses: allCourses,
    total: allCourses.length,
    filters: {
      levels: [...new Set(Array.from(courses.values()).map(c => c.level))],
      instructors: [...new Set(Array.from(courses.values()).map(c => c.instructor))]
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || user?.roles || ['student']; // Default to student if no roles found
  const userId = user?.sub;
  const userEmail = user?.email;
  const { action, courseId } = await request.json();

  // Only students can enroll in courses
  if (!roles.includes('student')) {
    return NextResponse.json({ error: 'Only students can enroll in courses' }, { status: 403 });
  }

  if (action === 'enroll') {
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const course = courses.get(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course is full
    if (course.currentStudents >= course.maxStudents) {
      return NextResponse.json({ error: 'Course is full' }, { status: 400 });
    }

    // Check if already enrolled
    const studentEnrollments = enrollments.get(userEmail!) || [];
    if (studentEnrollments.includes(courseId)) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Enroll student
    studentEnrollments.push(courseId);
    enrollments.set(userEmail!, studentEnrollments);

    // Update course enrollment count
    course.currentStudents += 1;
    courses.set(courseId, course);

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${course.title}`,
      course: {
        ...course,
        isEnrolled: true,
        canEnroll: false
      }
    });
  }

  if (action === 'unenroll') {
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const course = courses.get(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Remove enrollment
    const studentEnrollments = enrollments.get(userEmail!) || [];
    const updatedEnrollments = studentEnrollments.filter(id => id !== courseId);
    enrollments.set(userEmail!, updatedEnrollments);

    // Update course enrollment count
    course.currentStudents = Math.max(0, course.currentStudents - 1);
    courses.set(courseId, course);

    return NextResponse.json({
      success: true,
      message: `Successfully unenrolled from ${course.title}`,
      course: {
        ...course,
        isEnrolled: false,
        canEnroll: course.currentStudents < course.maxStudents
      }
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
