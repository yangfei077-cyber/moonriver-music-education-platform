import { getSession } from '@auth0/nextjs-auth0/server';
import { NextRequest, NextResponse } from 'next/server';

// Educator and messaging storage (in production, use a database)
const educators: Map<string, any> = new Map();
const messages: Map<string, any[]> = new Map();

// Add demo messages for student@moonriver.com
const DEMO_STUDENT_USER_ID = 'auth0|68f0970657a65f6a14ef94f0'; // student@moonriver.com
const DEMO_EDUCATOR_ID = 'auth0|68f0970657a65f6a14ef94f1'; // Dr. Sarah Johnson (simulated Auth0 sub)

// Demo conversation between student and Dr. Sarah Johnson
const demoMessages = [
  {
    id: '1',
    from: DEMO_STUDENT_USER_ID,
    fromName: 'student@moonriver.com',
    to: DEMO_EDUCATOR_ID,
    toName: 'Dr. Sarah Johnson',
    subject: 'Question about Piano Fundamentals',
    message: 'Hi Dr. Johnson, I have a question about the piano fundamentals course. I\'m struggling with the chord progressions section. Could you provide some additional resources?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: true
  },
  {
    id: '2',
    from: DEMO_EDUCATOR_ID,
    fromName: 'Dr. Sarah Johnson',
    to: DEMO_STUDENT_USER_ID,
    toName: 'student@moonriver.com',
    subject: 'Re: Question about Piano Fundamentals',
    message: 'Hello! I\'d be happy to help with chord progressions. I recommend practicing the I-V-vi-IV progression first, as it\'s used in many popular songs. I\'ll send you some additional exercises via email.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true
  },
  {
    id: '3',
    from: DEMO_STUDENT_USER_ID,
    fromName: 'student@moonriver.com',
    to: DEMO_EDUCATOR_ID,
    toName: 'Dr. Sarah Johnson',
    subject: 'Re: Question about Piano Fundamentals',
    message: 'Thank you so much! The exercises you suggested really helped. I\'m feeling more confident with the chord progressions now.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    read: false
  }
];

messages.set(`${DEMO_STUDENT_USER_ID}:${DEMO_EDUCATOR_ID}`, demoMessages);

// Add demo educator-to-student messages
const educatorToStudentMessages = [
  {
    id: '4',
    from: DEMO_EDUCATOR_ID,
    fromName: 'Dr. Sarah Johnson',
    to: DEMO_STUDENT_USER_ID,
    toName: 'Demo Student',
    subject: 'Welcome to Piano Fundamentals!',
    message: 'Welcome to the Piano Fundamentals course! I\'m excited to be your instructor. Please feel free to reach out if you have any questions about the course material.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    read: true
  },
  {
    id: '5',
    from: DEMO_EDUCATOR_ID,
    fromName: 'Dr. Sarah Johnson',
    to: DEMO_STUDENT_USER_ID,
    toName: 'Demo Student',
    subject: 'Practice Schedule Reminder',
    message: 'Hi! Just a friendly reminder that we have our weekly practice session tomorrow at 2 PM. Please prepare the scales we discussed last week.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: false
  }
];

// Add these messages to the existing conversation
const existingMessages = messages.get(`${DEMO_STUDENT_USER_ID}:${DEMO_EDUCATOR_ID}`) || [];
messages.set(`${DEMO_STUDENT_USER_ID}:${DEMO_EDUCATOR_ID}`, [...existingMessages, ...educatorToStudentMessages]);

// Add demo messages for educator@moonriver.com (real educator)
// These will be visible when the actual educator logs in
const REAL_EDUCATOR_EMAIL = 'educator@moonriver.com';
const DEMO_STUDENT_ID = 'auth0|68f0970657a65f6a14ef94f0'; // student@moonriver.com

// Create demo messages for the real educator
const realEducatorMessages = [
  {
    id: 'demo1',
    from: REAL_EDUCATOR_EMAIL,
    fromName: 'Dr. Sarah Johnson',
    to: DEMO_STUDENT_ID,
    toName: 'Demo Student',
    subject: 'Welcome to Piano Fundamentals!',
    message: 'Welcome to the Piano Fundamentals course! I\'m excited to be your instructor. Please feel free to reach out if you have any questions about the course material.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    read: true
  },
  {
    id: 'demo2',
    from: DEMO_STUDENT_ID,
    fromName: 'Demo Student',
    to: REAL_EDUCATOR_EMAIL,
    toName: 'Dr. Sarah Johnson',
    subject: 'Question about scales',
    message: 'Hi Dr. Johnson, I have a question about the major scales. Should I focus on C major first or practice all of them?',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true
  },
  {
    id: 'demo3',
    from: REAL_EDUCATOR_EMAIL,
    fromName: 'Dr. Sarah Johnson',
    to: DEMO_STUDENT_ID,
    toName: 'Demo Student',
    subject: 'Re: Question about scales',
    message: 'Great question! I recommend starting with C major since it has no sharps or flats. Once you\'re comfortable with C major, we can move on to G major and D major.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: false
  }
];

// Store messages for the real educator (using email as educator ID for demo purposes)
messages.set(`${DEMO_STUDENT_ID}:${REAL_EDUCATOR_EMAIL}`, realEducatorMessages);

// Helper function to get consistent message key
function getMessageKey(studentId: string, educatorId: string): string {
  // Always use student:educator format for consistency
  return `${studentId}:${educatorId}`;
}

// Initialize with sample educators
const sampleEducators = [
  {
    id: 'educator@moonriver.com',
    name: 'Dr. Sarah Johnson',
    email: 'educator@moonriver.com',
    title: 'Professor of Music Education',
    specialization: 'Piano, Music Theory, Composition',
    bio: 'Dr. Sarah Johnson has over 15 years of experience in music education. She holds a PhD in Music Education and specializes in piano instruction and music theory. Sarah has published numerous papers on music pedagogy and has taught at prestigious music schools worldwide.',
    experience: '15+ years',
    education: 'PhD in Music Education, Juilliard School',
    courses: ['Piano Fundamentals', 'Music Theory Essentials', 'Songwriting & Composition'],
    rating: 4.9,
    students: 156,
    avatar: '/api/placeholder/150/150',
    availability: 'Available for consultation',
    languages: ['English', 'Spanish'],
    instruments: ['Piano', 'Violin', 'Voice'],
    styles: ['Classical', 'Jazz', 'Contemporary'],
    location: 'New York, NY',
    website: 'https://sarahjohnsonmusic.com',
    socialMedia: {
      twitter: '@sarahjmusic',
      instagram: '@sarahjmusic',
      youtube: 'Sarah Johnson Music'
    }
  },
  {
    id: 'mike@moonriver.com',
    name: 'Mike Chen',
    email: 'mike@moonriver.com',
    title: 'Guitar Specialist & Jazz Educator',
    specialization: 'Guitar, Jazz Improvisation, Music Production',
    bio: 'Mike Chen is a professional guitarist and educator with expertise in jazz, rock, and contemporary music. He has performed with renowned artists and has been teaching guitar for over 12 years. Mike is known for his innovative teaching methods and patient approach.',
    experience: '12+ years',
    education: 'Bachelor of Music, Berklee College of Music',
    courses: ['Advanced Guitar Techniques', 'Jazz Improvisation Workshop'],
    rating: 4.8,
    students: 89,
    avatar: '/api/placeholder/150/150',
    availability: 'Available for lessons',
    languages: ['English', 'Mandarin'],
    instruments: ['Guitar', 'Bass', 'Piano'],
    styles: ['Jazz', 'Rock', 'Blues', 'Fusion'],
    location: 'Los Angeles, CA',
    website: 'https://mikechenmusic.com',
    socialMedia: {
      twitter: '@mikechenmusic',
      instagram: '@mikechenmusic',
      youtube: 'Mike Chen Guitar'
    }
  },
  {
    id: 'alex@moonriver.com',
    name: 'Alex Rivera',
    email: 'alex@moonriver.com',
    title: 'Digital Music Producer & Sound Engineer',
    specialization: 'Music Production, Sound Design, Audio Engineering',
    bio: 'Alex Rivera is a Grammy-nominated music producer and sound engineer with extensive experience in digital music production. He has worked with major record labels and has been teaching music production for over 8 years. Alex specializes in modern production techniques and industry-standard software.',
    experience: '8+ years',
    education: 'Master of Music Technology, NYU',
    courses: ['Digital Music Production'],
    rating: 4.7,
    students: 67,
    avatar: '/api/placeholder/150/150',
    availability: 'Available for workshops',
    languages: ['English', 'Spanish'],
    instruments: ['Digital Audio Workstation', 'Synthesizers'],
    styles: ['Electronic', 'Hip-Hop', 'Pop', 'Experimental'],
    location: 'Miami, FL',
    website: 'https://alexriveraproductions.com',
    socialMedia: {
      twitter: '@alexriveraprod',
      instagram: '@alexriveraprod',
      youtube: 'Alex Rivera Productions'
    }
  }
];

// Initialize educators
sampleEducators.forEach(educator => {
  educators.set(educator.id, educator);
});

export async function GET(request: NextRequest) {
  console.log('Educators API GET request received');
  const session = await getSession();
  
  if (!session) {
    console.log('No session found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
  const { searchParams } = new URL(request.url);
  const educatorId = searchParams.get('id');
  const specialization = searchParams.get('specialization');

  console.log('User info:', { userId, roles, educatorId, specialization });

  if (educatorId) {
    // Get specific educator
    const educator = educators.get(educatorId);
    if (!educator) {
      return NextResponse.json({ error: 'Educator not found' }, { status: 404 });
    }

    // Get messages for this educator (if student)
    let messagesData = [];
    if (roles.includes('student')) {
      messagesData = messages.get(`${userId}:${educatorId}`) || [];
    }

    return NextResponse.json({
      success: true,
      educator: {
        ...educator,
        messages: messagesData
      }
    });
  }

  // Get all educators
  let allEducators = Array.from(educators.values());
  console.log('Total educators in storage:', allEducators.length);

  // Apply filters
  if (specialization) {
    console.log('Applying specialization filter:', specialization);
    allEducators = allEducators.filter(educator => 
      educator.specialization.toLowerCase().includes(specialization.toLowerCase())
    );
    console.log('Educators after specialization filter:', allEducators.length);
  }

  // Remove sensitive information for non-admin users
  if (!roles.includes('admin')) {
    console.log('User is not admin, removing sensitive info');
    allEducators = allEducators.map(educator => {
      const { website, socialMedia, ...publicInfo } = educator;
      return publicInfo;
    });
  } else {
    console.log('User is admin, keeping all info');
  }

  const specializations = [...new Set(Array.from(educators.values()).map(e => e.specialization))];
  console.log('Available specializations:', specializations);
  console.log('Final response - educators count:', allEducators.length);

  return NextResponse.json({
    success: true,
    educators: allEducators,
    total: allEducators.length,
    specializations: specializations
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
  const { action, educatorId, studentId, message, subject } = await request.json();

  // Check if user is authorized for messaging actions
  if (action === 'sendMessage') {
    // Only students can send messages to educators
    if (!roles.includes('student')) {
      return NextResponse.json({ error: 'Only students can send messages' }, { status: 403 });
    }
  } else if (action === 'sendMessageToStudent') {
    // Only educators can send messages to students
    if (!roles.includes('educator')) {
      return NextResponse.json({ error: 'Only educators can send messages to students' }, { status: 403 });
    }
  }

  if (action === 'sendMessage') {
    if (!educatorId || !message || !subject) {
      return NextResponse.json({ error: 'Educator ID, subject, and message are required' }, { status: 400 });
    }

    const educator = educators.get(educatorId);
    if (!educator) {
      return NextResponse.json({ error: 'Educator not found' }, { status: 404 });
    }

    // Create message
    const newMessage = {
      id: Date.now().toString(),
      from: userId,
      fromName: user.name || user.email,
      to: educatorId,
      toName: educator.name,
      subject,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store message - append to existing conversation
    // Use consistent key format: always student:educator
    const messageKey = getMessageKey(userId, educatorId);
    const existingMessages = messages.get(messageKey) || [];
    
    // Add new message to existing conversation
    existingMessages.push(newMessage);
    messages.set(messageKey, existingMessages);
    
    console.log(`Message stored for ${messageKey}:`, newMessage);
    console.log(`Total messages for this conversation: ${existingMessages.length}`);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id
    });
  } else if (action === 'sendMessageToStudent') {
    if (!studentId || !message || !subject) {
      return NextResponse.json({ error: 'Student ID, subject, and message are required' }, { status: 400 });
    }

    // Create message from educator to student
    const newMessage = {
      id: Date.now().toString(),
      from: userId, // Educator's ID
      fromName: user.name || user.email,
      to: studentId,
      toName: `Student ${studentId}`, // In production, you'd fetch the actual student name
      subject,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store message - append to existing conversation
    // Use consistent key format: always student:educator
    // For demo purposes, use educator email as ID
    const educatorId = user?.email || userId;
    const messageKey = getMessageKey(studentId, educatorId);
    const existingMessages = messages.get(messageKey) || [];
    
    // Add new message to existing conversation
    existingMessages.push(newMessage);
    messages.set(messageKey, existingMessages);
    
    console.log(`Message sent to student ${messageKey}:`, newMessage);
    console.log(`Total messages for this conversation: ${existingMessages.length}`);
    console.log('All messages in storage:', Array.from(messages.entries()));

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id
    });
  }

  if (action === 'getMessages') {
    if (!educatorId && !studentId) {
      return NextResponse.json({ error: 'Educator ID or Student ID is required' }, { status: 400 });
    }

    let messageKey;
    // Determine who is making the request based on roles and parameters
    const userRoles = user?.['https://moonriver.com/roles'] || [];
    const isEducator = userRoles.includes('educator');
    
    if (isEducator && studentId) {
      // Educator getting messages with student
      // For demo purposes, use educator email as ID
      const educatorIdForKey = user?.email || userId;
      messageKey = getMessageKey(studentId, educatorIdForKey);
    } else if (educatorId) {
      // Student getting messages with educator
      messageKey = getMessageKey(userId, educatorId);
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    const userMessages = messages.get(messageKey) || [];
    
    console.log(`Retrieving messages for ${messageKey}:`, userMessages);
    console.log(`Total messages found: ${userMessages.length}`);
    console.log('Request params:', { educatorId, studentId, userId });
    console.log('All available message keys:', Array.from(messages.keys()));

    return NextResponse.json({
      success: true,
      messages: userMessages
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
