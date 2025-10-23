import { getSession } from '@auth0/nextjs-auth0/server';
import { NextRequest, NextResponse } from 'next/server';

// Fine-Grained Authorization Implementation
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const isAdmin = roles.includes('admin');
  const isEducator = roles.includes('educator');
  const isStudent = roles.includes('student');

  // Mock music education data with fine-grained access
  const musicData = {
    courses: [
      {
        id: 1,
        title: 'Piano Fundamentals',
        instructor: 'Dr. Sarah Johnson',
        level: 'Beginner',
        students: ['student@moonriver.com'],
        assignments: [
          { id: 1, title: 'Scale Practice', dueDate: '2024-01-15', completed: false },
          { id: 2, title: 'Chord Progressions', dueDate: '2024-01-22', completed: true },
        ],
        progress: { completed: 1, total: 2 },
      },
      {
        id: 2,
        title: 'Advanced Guitar Techniques',
        instructor: 'Mike Chen',
        level: 'Advanced',
        students: ['student@moonriver.com'],
        assignments: [
          { id: 3, title: 'Fingerpicking Patterns', dueDate: '2024-01-20', completed: false },
          { id: 4, title: 'Jazz Improvisation', dueDate: '2024-01-25', completed: false },
        ],
        progress: { completed: 0, total: 2 },
      },
    ],
    educators: [
      { id: 1, name: 'Dr. Sarah Johnson', email: 'educator@moonriver.com', courses: [1] },
      { id: 2, name: 'Mike Chen', email: 'mike@moonriver.com', courses: [2] },
    ],
    students: [
      { id: 1, name: 'Alex Student', email: 'student@moonriver.com', enrolledCourses: [1, 2] },
    ],
  };

  // Fine-grained data filtering based on role
  let accessibleData: any = {};

  if (isAdmin) {
    // Admin can see everything
    accessibleData = {
      ...musicData,
      systemStats: {
        totalCourses: musicData.courses.length,
        totalEducators: musicData.educators.length,
        totalStudents: musicData.students.length,
      },
    };
  } else if (isEducator) {
    // Educator can see their courses and students
    const educatorEmail = user?.email;
    const educatorCourses = musicData.courses.filter(course => 
      course.instructor === musicData.educators.find(e => e.email === educatorEmail)?.name
    );
    
    accessibleData = {
      courses: educatorCourses,
      students: musicData.students.filter(student => 
        educatorCourses.some(course => student.enrolledCourses.includes(course.id))
      ),
    };
  } else if (isStudent) {
    // Student can only see their enrolled courses
    const studentEmail = user?.email;
    const student = musicData.students.find(s => s.email === studentEmail);
    
    if (student) {
      accessibleData = {
        courses: musicData.courses.filter(course => 
          student.enrolledCourses.includes(course.id)
        ),
        myProgress: musicData.courses
          .filter(course => student.enrolledCourses.includes(course.id))
          .map(course => ({
            courseId: course.id,
            courseTitle: course.title,
            progress: course.progress,
            assignments: course.assignments,
          })),
      };
    }
  }

  return NextResponse.json({
    user: {
      email: user?.email,
      roles: roles,
    },
    accessibleData,
    permissions: {
      canViewAllCourses: isAdmin || isEducator,
      canEditCourses: isAdmin || isEducator,
      canViewAllStudents: isAdmin || isEducator,
      canViewStudentProgress: isAdmin || isEducator,
      canEnrollInCourses: isStudent,
      canSubmitAssignments: isStudent,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const isAdmin = roles.includes('admin');
  const isEducator = roles.includes('educator');

  if (!isAdmin && !isEducator) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const { action, data } = body;

  // Fine-grained authorization for different actions
  switch (action) {
    case 'createCourse':
      if (!isAdmin && !isEducator) {
        return NextResponse.json({ error: 'Only educators can create courses' }, { status: 403 });
      }
      break;
    
    case 'updateCourse':
      if (!isAdmin && !isEducator) {
        return NextResponse.json({ error: 'Only educators can update courses' }, { status: 403 });
      }
      break;
    
    case 'deleteCourse':
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can delete courses' }, { status: 403 });
      }
      break;
    
    case 'enrollStudent':
      if (!isAdmin && !isEducator) {
        return NextResponse.json({ error: 'Only educators can enroll students' }, { status: 403 });
      }
      break;
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Action '${action}' completed successfully`,
    data: data,
  });
}
