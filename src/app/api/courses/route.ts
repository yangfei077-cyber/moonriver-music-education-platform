import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Course and enrollment storage (in production, use a database)
const courses: Map<number, any> = new Map();
const enrollments: Map<string, number[]> = new Map();

// Preselect student@moonriver.com with demo enrollments
const DEMO_STUDENT_USER_ID = 'auth0|68f0970657a65f6a14ef94f0'; // student@moonriver.com
enrollments.set(DEMO_STUDENT_USER_ID, [1, 2]); // Piano Fundamentals (1) and Advanced Guitar Techniques (2)

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
    image: '/api/placeholder/400/300'
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
    image: '/api/placeholder/400/300'
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
    image: '/api/placeholder/400/300'
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
    image: '/api/placeholder/400/300'
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
    image: '/api/placeholder/400/300'
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
    image: '/api/placeholder/400/300'
  }
];

// Initialize courses
sampleCourses.forEach(course => {
  courses.set(course.id, course);
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
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
    const studentEnrollments = enrollments.get(userId!) || [];
    console.log('Student enrollments for', userId, ':', studentEnrollments);
    allCourses = allCourses.map(course => {
      const isEnrolled = studentEnrollments.includes(course.id);
      const canEnroll = course.currentStudents < course.maxStudents && !studentEnrollments.includes(course.id);
      console.log(`Course ${course.id} (${course.title}): isEnrolled=${isEnrolled}, canEnroll=${canEnroll}`);
      return {
        ...course,
        isEnrolled,
        canEnroll
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
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
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
    const studentEnrollments = enrollments.get(userId!) || [];
    if (studentEnrollments.includes(courseId)) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Enroll student
    studentEnrollments.push(courseId);
    enrollments.set(userId!, studentEnrollments);

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
    const studentEnrollments = enrollments.get(userId!) || [];
    const updatedEnrollments = studentEnrollments.filter(id => id !== courseId);
    enrollments.set(userId!, updatedEnrollments);

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
