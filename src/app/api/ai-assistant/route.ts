import { NextRequest, NextResponse } from 'next/server';

// Knowledge base with role-based access
const KNOWLEDGE_BASE = {
  // Public knowledge (accessible to all)
  public: {
    courses: [
      {
        id: 1,
        title: "Piano Fundamentals",
        description: "Learn basic piano techniques, scales, and simple songs",
        instructor: "Dr. Sarah Johnson",
        duration: "8 weeks",
        level: "Beginner",
        price: "$299",
        schedule: "Tuesdays & Thursdays 6:00-7:00 PM",
        instruments: ["Piano"],
        styles: ["Classical", "Pop", "Jazz"]
      },
      {
        id: 2,
        title: "Advanced Guitar Techniques",
        description: "Master advanced guitar techniques, fingerpicking, and composition",
        instructor: "Mike Chen",
        duration: "12 weeks",
        level: "Advanced",
        price: "$399",
        schedule: "Mondays & Wednesdays 7:00-8:30 PM",
        instruments: ["Guitar"],
        styles: ["Rock", "Blues", "Folk"]
      },
      {
        id: 3,
        title: "Music Theory & Composition",
        description: "Learn music theory fundamentals and composition techniques",
        instructor: "Dr. Sarah Johnson",
        duration: "10 weeks",
        level: "Intermediate",
        price: "$349",
        schedule: "Saturdays 10:00 AM-12:00 PM",
        instruments: ["Any"],
        styles: ["All genres"]
      }
    ],
    educators: [
      {
        id: "educator@moonriver.com",
        name: "Dr. Sarah Johnson",
        title: "Piano & Music Theory Specialist",
        specialization: "Piano, Music Theory, Composition",
        bio: "PhD in Music Theory with 15+ years teaching experience",
        rating: 4.9,
        students: 150,
        location: "New York, NY",
        instruments: ["Piano", "Organ"],
        styles: ["Classical", "Jazz", "Contemporary"],
        courses: ["Piano Fundamentals", "Music Theory & Composition"]
      },
      {
        id: "mike.chen@moonriver.com",
        name: "Mike Chen",
        title: "Guitar & Production Expert",
        specialization: "Guitar, Jazz Improvisation, Music Production",
        bio: "Professional guitarist and music producer with Grammy nominations",
        rating: 4.8,
        students: 120,
        location: "Los Angeles, CA",
        instruments: ["Guitar", "Bass"],
        styles: ["Rock", "Jazz", "Blues", "Folk"],
        courses: ["Advanced Guitar Techniques"]
      },
      {
        id: "alex.rivera@moonriver.com",
        name: "Alex Rivera",
        title: "Vocal & Performance Coach",
        specialization: "Vocal Training, Performance, Audio Engineering",
        bio: "Professional vocalist and audio engineer with studio experience",
        rating: 4.7,
        students: 95,
        location: "Miami, FL",
        instruments: ["Voice", "Piano"],
        styles: ["Pop", "R&B", "Latin", "Contemporary"],
        courses: ["Vocal Fundamentals", "Performance Techniques"]
      }
    ]
  },
  
  // Educator-specific knowledge
  educator: {
    studentRecommendations: [
      "Analyze student interests to suggest relevant course materials and practice pieces",
      "Recommend students to explore different genres within their interest areas",
      "Suggest students connect with peers who share similar musical interests",
      "Guide students toward appropriate skill level materials based on their progress",
      "Encourage students to attend concerts and performances in their preferred genres",
      "Recommend supplementary learning resources like apps, books, or online tutorials",
      "Suggest students join music communities related to their interests",
      "Help students set realistic goals based on their interests and skill level"
    ],
    schedulingTips: [
      "Schedule lessons during student's peak energy hours for better focus and retention",
      "Allow buffer time between lessons for preparation and note-taking",
      "Consider student's other commitments when scheduling regular sessions",
      "Plan longer sessions for complex topics or performance preparation",
      "Schedule makeup lessons within 48 hours to maintain learning momentum",
      "Use calendar reminders to help students remember their lesson times",
      "Offer flexible scheduling options for students with irregular schedules",
      "Plan recital and performance preparation sessions well in advance"
    ],
    appointmentManagement: [
      "Send appointment confirmations 24 hours before scheduled lessons",
      "Provide clear instructions for virtual lessons including platform links and requirements",
      "Create lesson agendas and share them with students beforehand",
      "Allow 10-15 minutes between lessons for preparation and student transitions",
      "Maintain a waiting list for popular time slots to fill cancellations quickly",
      "Track student attendance patterns to optimize scheduling",
      "Offer group sessions for students with similar skill levels and interests",
      "Schedule regular progress review sessions every 4-6 weeks"
    ],
  },
  
  // Student-specific knowledge
  student: {
    teacherRecommendations: [
      "Dr. Sarah Johnson is excellent for beginners wanting classical foundation",
      "Mike Chen is perfect for students interested in contemporary styles",
      "Alex Rivera specializes in vocal training and performance coaching",
      "Consider your learning style when choosing an instructor",
      "Schedule trial lessons to find the best fit"
    ],
    courseRecommendations: [
      "Start with Piano Fundamentals if you're a complete beginner",
      "Advanced Guitar Techniques requires basic guitar knowledge",
      "Music Theory & Composition complements any instrument study",
      "Consider your schedule when choosing course times",
      "Group classes offer peer learning opportunities"
    ]
  },
  
  // Admin-specific knowledge (includes everything)
  admin: {
    systemInfo: [
      "Platform supports 500+ concurrent users",
      "Payment processing through Stripe integration",
      "Student progress tracking with analytics dashboard",
      "Automated scheduling system with calendar integration",
      "Email notifications for appointments and course updates"
    ],
    management: [
      "Monitor educator performance through student feedback",
      "Track course completion rates and student satisfaction",
      "Manage educator schedules and availability",
      "Process refunds and course transfers",
      "Generate monthly revenue and enrollment reports"
    ],
    // Demo student data (ONLY accessible to admins)
    studentData: [
      {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        enrolledCourses: ["Piano Fundamentals", "Music Theory"],
        progress: "85% complete",
        lastLogin: "2024-01-15"
      },
      {
        name: "Bob Smith",
        email: "bob.smith@example.com", 
        enrolledCourses: ["Advanced Guitar Techniques"],
        progress: "60% complete",
        lastLogin: "2024-01-14"
      }
    ]
  }
};

// Privacy check for student information
function checkPrivacyViolation(query: string, userRoles: string[]): boolean {
  const queryLower = query.toLowerCase();
  const privacyKeywords = [
    'other students', 'student information', 'student data', 'student details',
    'student names', 'student emails', 'student contact', 'student progress',
    'student grades', 'student performance', 'student attendance',
    'who are the students', 'list students', 'all students',
    'student personal', 'student private', 'student confidential'
  ];
  
  // Check if query is asking for other students' information
  const isAskingForStudentInfo = privacyKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  // Only allow access to student info for admins and educators
  const canAccessStudentInfo = userRoles.includes('admin') || userRoles.includes('educator');
  
  return isAskingForStudentInfo && !canAccessStudentInfo;
}

// Get role-based knowledge
function getRoleBasedKnowledge(userRoles: string[]) {
  const knowledge: any = { ...KNOWLEDGE_BASE.public };
  
  if (userRoles.includes('educator')) {
    knowledge.educator = KNOWLEDGE_BASE.educator;
  }
  
  if (userRoles.includes('student')) {
    knowledge.student = KNOWLEDGE_BASE.student;
  }
  
  if (userRoles.includes('admin')) {
    knowledge.admin = KNOWLEDGE_BASE.admin;
    // Admin gets access to everything
    knowledge.educator = KNOWLEDGE_BASE.educator;
    knowledge.student = KNOWLEDGE_BASE.student;
  }
  
  return knowledge;
}

// Generate personalized recommendations based on user interests
function generatePersonalizedRecommendations(userInterests: string[], knowledge: any): string {
  if (!userInterests || userInterests.length === 0) {
    return '';
  }

  const recommendations: string[] = [];
  
  // Map interests to courses and educators
  const interestToCourses: { [key: string]: string[] } = {
    'piano': ['Piano Fundamentals', 'Music Theory & Composition'],
    'guitar': ['Advanced Guitar Techniques'],
    'jazz': ['Advanced Guitar Techniques', 'Music Theory & Composition'],
    'classical': ['Piano Fundamentals', 'Music Theory & Composition'],
    'rock': ['Advanced Guitar Techniques'],
    'blues': ['Advanced Guitar Techniques'],
    'pop': ['Piano Fundamentals', 'Vocal Fundamentals'],
    'composition': ['Music Theory & Composition'],
    'music-theory': ['Music Theory & Composition'],
    'neo-soul': ['Advanced Guitar Techniques', 'Vocal Fundamentals'],
    'punk': ['Advanced Guitar Techniques'],
    'folk': ['Advanced Guitar Techniques'],
    'r&b': ['Vocal Fundamentals', 'Performance Techniques'],
    'latin': ['Vocal Fundamentals', 'Performance Techniques'],
    'contemporary': ['Vocal Fundamentals', 'Performance Techniques']
  };

  const interestToEducators: { [key: string]: string[] } = {
    'piano': ['Dr. Sarah Johnson'],
    'classical': ['Dr. Sarah Johnson'],
    'composition': ['Dr. Sarah Johnson'],
    'music-theory': ['Dr. Sarah Johnson'],
    'guitar': ['Mike Chen'],
    'jazz': ['Mike Chen'],
    'rock': ['Mike Chen'],
    'blues': ['Mike Chen'],
    'folk': ['Mike Chen'],
    'neo-soul': ['Mike Chen', 'Alex Rivera'],
    'punk': ['Mike Chen'],
    'vocal': ['Alex Rivera'],
    'pop': ['Alex Rivera'],
    'r&b': ['Alex Rivera'],
    'latin': ['Alex Rivera'],
    'contemporary': ['Alex Rivera'],
    'performance': ['Alex Rivera']
  };

  // Find matching courses and educators
  const matchedCourses = new Set<string>();
  const matchedEducators = new Set<string>();

  userInterests.forEach(interest => {
    const courses = interestToCourses[interest.toLowerCase()] || [];
    const educators = interestToEducators[interest.toLowerCase()] || [];
    
    courses.forEach(course => matchedCourses.add(course));
    educators.forEach(educator => matchedEducators.add(educator));
  });

  if (matchedCourses.size > 0) {
    recommendations.push(`Based on your interests (${userInterests.join(', ')}), I recommend these courses: ${Array.from(matchedCourses).join(', ')}`);
  }

  if (matchedEducators.size > 0) {
    recommendations.push(`I also recommend connecting with these educators who specialize in your interests: ${Array.from(matchedEducators).join(', ')}`);
  }

  return recommendations.join('\n');
}

// Generate educator-specific recommendations based on their students
function generateEducatorRecommendations(userStudents: any[], knowledge: any): string {
  if (!userStudents || userStudents.length === 0) {
    return '';
  }

  const recommendations: string[] = [];
  
  // Analyze student interests and provide recommendations
  const allInterests = userStudents.flatMap(student => student.interests || []);
  const interestCounts: { [key: string]: number } = {};
  
  allInterests.forEach(interest => {
    interestCounts[interest] = (interestCounts[interest] || 0) + 1;
  });

  const topInterests = Object.entries(interestCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([interest]) => interest);

  if (topInterests.length > 0) {
    recommendations.push(`📊 **Student Interest Analysis**: Your students are most interested in ${topInterests.join(', ')}. Consider incorporating these genres into your lesson plans.`);
  }

  // Provide messaging recommendations for specific students
  const strugglingStudents = userStudents.filter(student => 
    parseInt(student.progress) < 60
  );
  
  if (strugglingStudents.length > 0) {
    const studentNames = strugglingStudents.map(s => s.name).join(', ');
    recommendations.push(`⚠️ **Students Needing Attention**: ${studentNames} may benefit from additional support. Consider reaching out with encouragement and practice tips.`);
  }

  // Add scheduling tip
  const schedulingTips = knowledge.educator?.schedulingTips || [];
  if (schedulingTips.length > 0) {
    const randomSchedulingTip = schedulingTips[Math.floor(Math.random() * schedulingTips.length)];
    recommendations.push(`📅 **Scheduling Tip**: ${randomSchedulingTip}`);
  }

  return recommendations.join('\n\n');
}

// Simple RAG implementation - find relevant context
function findRelevantContext(query: string, knowledge: any, userInterests?: string[]): string {
  const queryLower = query.toLowerCase();
  const relevantContext: string[] = [];
  
  // Add personalized recommendations if interests are provided
  if (userInterests && (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('course') || queryLower.includes('educator'))) {
    const personalizedRecs = generatePersonalizedRecommendations(userInterests, knowledge);
    if (personalizedRecs) {
      relevantContext.push(`PERSONALIZED RECOMMENDATIONS: ${personalizedRecs}`);
    }
  }
  
  // Search through all knowledge categories
  Object.entries(knowledge).forEach(([category, data]: [string, any]) => {
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        // Search through object properties
        Object.values(item).forEach((value: any) => {
          if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
            relevantContext.push(`${category}: ${JSON.stringify(item)}`);
          }
        });
      });
    } else if (typeof data === 'object') {
      // Recursively search nested objects
      const nestedContext = findRelevantContext(query, data);
      if (nestedContext) {
        relevantContext.push(nestedContext);
      }
    }
  });
  
  return relevantContext.slice(0, 5).join('\n'); // Increased to 5 for better context
}

export async function POST(request: NextRequest) {
  try {
    // For demo purposes, we'll accept requests without strict auth
    // In production, implement proper JWT verification
    const { message, userRoles, userInfo, userInterests, userStudents } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Get role-based knowledge
    const roles = userRoles || ['student']; // Default to student role
    
    // Check for privacy violations first
    if (checkPrivacyViolation(message, roles)) {
      return NextResponse.json({
        success: true,
        response: `I'm sorry, but I cannot share information about other students. This information is confidential and protected by privacy policies. 

If you're looking for:
- **Learning resources**: I can help you find courses and study materials
- **Your own progress**: You can check your personal dashboard
- **General music education**: I'm happy to provide guidance and recommendations

Is there anything else I can help you with regarding your own learning journey?`,
        context: 'Privacy protection activated'
      });
    }
    
    const knowledge = getRoleBasedKnowledge(roles);
    
    // Find relevant context using simple RAG
    let relevantContext = findRelevantContext(message, knowledge, userInterests);
    
    // Add educator-specific recommendations if user is an educator
    if (roles.includes('educator') && userStudents) {
      const educatorRecs = generateEducatorRecommendations(userStudents, knowledge);
      if (educatorRecs) {
        relevantContext += '\n\n' + educatorRecs;
      }
    }
    
    // Prepare system prompt based on user role
    let systemPrompt = `You are an AI assistant for MoonRiver Music Education Platform. You help users with music education questions and recommendations.

IMPORTANT PRIVACY RULES:
- NEVER share information about other students, including names, emails, progress, or personal details
- Only provide information that the user is authorized to access based on their role
- If asked about other students, politely decline and redirect to appropriate alternatives

USER INFORMATION:
- Name: ${userInfo?.name || 'User'}
- Email: ${userInfo?.email || 'user@example.com'}
- Roles: ${roles.join(', ')}
- Music Interests: ${userInterests ? userInterests.join(', ') : 'Not specified'}
${roles.includes('educator') && userStudents ? `- Active Students: ${userStudents.length} students` : ''}
${roles.includes('educator') && userStudents ? `- Student Interests: ${userStudents.flatMap((s: any) => s.interests || []).join(', ')}` : ''}

Available knowledge:
${JSON.stringify(knowledge, null, 2)}

Relevant context for this query:
${relevantContext}

Please provide helpful, accurate responses based on the available knowledge. Be concise but informative. Always respect privacy and confidentiality. If the user has specified music interests, use them to provide personalized recommendations.`;

    // Make API call to OpenRouter
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MoonRiver Music Education Platform'
      },
      body: JSON.stringify({
        model: 'nousresearch/deephermes-3-llama-3-8b-preview:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!openrouterResponse.ok) {
      console.error('OpenRouter API error:', await openrouterResponse.text());
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable' 
      }, { status: 500 });
    }
    
    const aiResponse = await openrouterResponse.json();
    
    return NextResponse.json({
      success: true,
      response: aiResponse.choices[0].message.content,
      context: relevantContext ? 'Used relevant context from knowledge base' : 'No specific context found'
    });
    
  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}