'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Users, ArrowLeft, User, Mail, Calendar, BookOpen, Star, MessageSquare } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  progress: string;
  lastLogin: string;
  interests: string[];
  totalHours: number;
  completedLessons: number;
}

export default function EducatorStudents() {
  const { user, error, isLoading } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyStudents();
    }
  }, [user]);

  const fetchMyStudents = async () => {
    setLoading(true);
    try {
      // Demo students data - in production this would come from an API
      const allStudents: Student[] = [
        {
          id: 'auth0|68f0970657a65f6a14ef94f0',
          name: 'Demo Student',
          email: 'student@moonriver.com',
          enrolledCourses: ['Piano Fundamentals', 'Music Theory & Composition'],
          progress: '85%',
          lastLogin: '2024-01-15',
          interests: ['neo-soul', 'punk', 'jazz'],
          totalHours: 24,
          completedLessons: 12
        },
        {
          id: 'student-2',
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          enrolledCourses: ['Piano Fundamentals'],
          progress: '60%',
          lastLogin: '2024-01-14',
          interests: ['classical', 'piano'],
          totalHours: 18,
          completedLessons: 9
        },
        {
          id: 'student-3',
          name: 'Bob Smith',
          email: 'bob.smith@example.com',
          enrolledCourses: ['Advanced Guitar Techniques'],
          progress: '45%',
          lastLogin: '2024-01-13',
          interests: ['rock', 'blues', 'guitar'],
          totalHours: 15,
          completedLessons: 6
        },
        {
          id: 'student-4',
          name: 'Carol Davis',
          email: 'carol.davis@example.com',
          enrolledCourses: ['Music Theory & Composition'],
          progress: '70%',
          lastLogin: '2024-01-12',
          interests: ['composition', 'music-theory'],
          totalHours: 20,
          completedLessons: 10
        },
        {
          id: 'student-5',
          name: 'David Wilson',
          email: 'david.wilson@example.com',
          enrolledCourses: ['Classical Violin Techniques', 'Music Theory & Composition'],
          progress: '92%',
          lastLogin: '2024-01-16',
          interests: ['classical', 'violin', 'chamber-music'],
          totalHours: 32,
          completedLessons: 16
        },
        {
          id: 'student-6',
          name: 'Emma Thompson',
          email: 'emma.thompson@example.com',
          enrolledCourses: ['Vocal Training & Performance'],
          progress: '78%',
          lastLogin: '2024-01-15',
          interests: ['pop', 'r&b', 'vocal-training'],
          totalHours: 22,
          completedLessons: 11
        },
        {
          id: 'student-7',
          name: 'Frank Rodriguez',
          email: 'frank.rodriguez@example.com',
          enrolledCourses: ['Rock Drumming Techniques', 'Digital Music Production'],
          progress: '65%',
          lastLogin: '2024-01-14',
          interests: ['rock', 'metal', 'drums'],
          totalHours: 19,
          completedLessons: 8
        },
        {
          id: 'student-8',
          name: 'Grace Lee',
          email: 'grace.lee@example.com',
          enrolledCourses: ['Jazz Piano Fundamentals', 'Blues Guitar Mastery'],
          progress: '88%',
          lastLogin: '2024-01-16',
          interests: ['jazz', 'blues', 'piano', 'guitar'],
          totalHours: 28,
          completedLessons: 14
        },
        {
          id: 'student-9',
          name: 'Henry Chen',
          email: 'henry.chen@example.com',
          enrolledCourses: ['Electronic Music & Synthesizers', 'Digital Music Production'],
          progress: '55%',
          lastLogin: '2024-01-13',
          interests: ['electronic', 'edm', 'production'],
          totalHours: 16,
          completedLessons: 7
        },
        {
          id: 'student-10',
          name: 'Isabella Martinez',
          email: 'isabella.martinez@example.com',
          enrolledCourses: ['Folk & Acoustic Guitar', 'Songwriting & Composition'],
          progress: '72%',
          lastLogin: '2024-01-15',
          interests: ['folk', 'acoustic', 'songwriting'],
          totalHours: 21,
          completedLessons: 10
        },
        {
          id: 'student-11',
          name: 'James Anderson',
          email: 'james.anderson@example.com',
          enrolledCourses: ['World Music Exploration', 'Music Business & Industry'],
          progress: '68%',
          lastLogin: '2024-01-14',
          interests: ['world-music', 'business', 'career'],
          totalHours: 18,
          completedLessons: 9
        },
        {
          id: 'student-12',
          name: 'Katherine Park',
          email: 'katherine.park@example.com',
          enrolledCourses: ['Piano Fundamentals', 'Classical Violin Techniques'],
          progress: '81%',
          lastLogin: '2024-01-16',
          interests: ['classical', 'piano', 'violin'],
          totalHours: 25,
          completedLessons: 13
        },
        {
          id: 'student-13',
          name: 'Liam O\'Connor',
          email: 'liam.oconnor@example.com',
          enrolledCourses: ['Blues Guitar Mastery', 'Jazz Improvisation Workshop'],
          progress: '76%',
          lastLogin: '2024-01-15',
          interests: ['blues', 'jazz', 'guitar'],
          totalHours: 23,
          completedLessons: 12
        },
        {
          id: 'student-14',
          name: 'Maya Patel',
          email: 'maya.patel@example.com',
          enrolledCourses: ['Vocal Training & Performance', 'Songwriting & Composition'],
          progress: '83%',
          lastLogin: '2024-01-16',
          interests: ['pop', 'indie', 'songwriting'],
          totalHours: 26,
          completedLessons: 13
        },
        {
          id: 'student-15',
          name: 'Nathan Taylor',
          email: 'nathan.taylor@example.com',
          enrolledCourses: ['Rock Drumming Techniques', 'Electronic Music & Synthesizers'],
          progress: '59%',
          lastLogin: '2024-01-13',
          interests: ['rock', 'electronic', 'drums'],
          totalHours: 17,
          completedLessons: 8
        },
        {
          id: 'student-16',
          name: 'Olivia Brown',
          email: 'olivia.brown@example.com',
          enrolledCourses: ['Classical Violin Techniques', 'Music Theory & Composition'],
          progress: '94%',
          lastLogin: '2024-01-17',
          interests: ['classical', 'violin', 'orchestra'],
          totalHours: 35,
          completedLessons: 18
        },
        {
          id: 'student-17',
          name: 'Peter Kim',
          email: 'peter.kim@example.com',
          enrolledCourses: ['Blues Guitar Mastery', 'Jazz Improvisation Workshop'],
          progress: '71%',
          lastLogin: '2024-01-16',
          interests: ['blues', 'jazz', 'guitar'],
          totalHours: 24,
          completedLessons: 12
        },
        {
          id: 'student-18',
          name: 'Quinn Johnson',
          email: 'quinn.johnson@example.com',
          enrolledCourses: ['Vocal Training & Performance', 'Digital Music Production'],
          progress: '67%',
          lastLogin: '2024-01-15',
          interests: ['pop', 'production', 'singing'],
          totalHours: 20,
          completedLessons: 10
        },
        {
          id: 'student-19',
          name: 'Rachel Green',
          email: 'rachel.green@example.com',
          enrolledCourses: ['Folk & Acoustic Guitar', 'World Music Exploration'],
          progress: '82%',
          lastLogin: '2024-01-17',
          interests: ['folk', 'world-music', 'acoustic'],
          totalHours: 27,
          completedLessons: 14
        },
        {
          id: 'student-20',
          name: 'Samuel White',
          email: 'samuel.white@example.com',
          enrolledCourses: ['Rock Drumming Techniques', 'Music Business & Industry'],
          progress: '58%',
          lastLogin: '2024-01-14',
          interests: ['rock', 'business', 'drums'],
          totalHours: 18,
          completedLessons: 9
        },
        {
          id: 'student-21',
          name: 'Tina Lopez',
          email: 'tina.lopez@example.com',
          enrolledCourses: ['Electronic Music & Synthesizers', 'Songwriting & Composition'],
          progress: '75%',
          lastLogin: '2024-01-16',
          interests: ['electronic', 'songwriting', 'edm'],
          totalHours: 23,
          completedLessons: 11
        },
        {
          id: 'student-22',
          name: 'Uma Patel',
          email: 'uma.patel@example.com',
          enrolledCourses: ['Classical Violin Techniques', 'Vocal Training & Performance'],
          progress: '89%',
          lastLogin: '2024-01-17',
          interests: ['classical', 'violin', 'opera'],
          totalHours: 30,
          completedLessons: 15
        },
        {
          id: 'student-23',
          name: 'Victor Chen',
          email: 'victor.chen@example.com',
          enrolledCourses: ['Jazz Piano Fundamentals', 'Digital Music Production'],
          progress: '64%',
          lastLogin: '2024-01-15',
          interests: ['jazz', 'piano', 'production'],
          totalHours: 19,
          completedLessons: 9
        },
        {
          id: 'student-24',
          name: 'Wendy Davis',
          email: 'wendy.davis@example.com',
          enrolledCourses: ['Piano Fundamentals', 'Music Theory & Composition'],
          progress: '77%',
          lastLogin: '2024-01-16',
          interests: ['classical', 'piano', 'theory'],
          totalHours: 22,
          completedLessons: 11
        },
        {
          id: 'student-25',
          name: 'Xavier Rodriguez',
          email: 'xavier.rodriguez@example.com',
          enrolledCourses: ['Blues Guitar Mastery', 'Rock Drumming Techniques'],
          progress: '69%',
          lastLogin: '2024-01-14',
          interests: ['blues', 'rock', 'guitar', 'drums'],
          totalHours: 21,
          completedLessons: 10
        }
      ];

      // Filter students based on educator's courses - limit to 3 students for "My Students"
      let myStudents = [];
      if (user?.email === 'educator@moonriver.com') {
        // Dr. Sarah Johnson's students (Piano, Music Theory, and Jazz Piano courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Piano Fundamentals' || 
            course === 'Music Theory & Composition' ||
            course === 'Jazz Piano Fundamentals' ||
            course === 'Songwriting & Composition'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'mike.chen@moonriver.com') {
        // Mike Chen's students (Guitar courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Advanced Guitar Techniques' ||
            course === 'Blues Guitar Mastery' ||
            course === 'Folk & Acoustic Guitar'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'elena@moonriver.com') {
        // Elena Petrov's students (Violin courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Classical Violin Techniques'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'sarah@moonriver.com') {
        // Sarah Williams' students (Vocal courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Vocal Training & Performance'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'alex@moonriver.com') {
        // Alex Rivera's students (Production courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Digital Music Production' ||
            course === 'Electronic Music & Synthesizers'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'tommy@moonriver.com') {
        // Tommy Rodriguez's students (Drum courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Rock Drumming Techniques'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'david@moonriver.com') {
        // David Kim's students (Business courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Music Business & Industry'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      } else if (user?.email === 'priya@moonriver.com') {
        // Priya Sharma's students (World Music courses) - take first 3
        const filteredStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'World Music Exploration'
          )
        );
        myStudents = filteredStudents.slice(0, 3);
      }

      setStudents(myStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: string) => {
    const percentage = parseInt(progress);
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleMessageStudent = (student: Student) => {
    setSelectedStudent(student);
    setMessageData({
      subject: `Message from ${user?.name || user?.email}`,
      message: ''
    });
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!selectedStudent || !messageData.message.trim()) return;

    setSending(true);
    try {
      console.log('Sending message to student:', {
        action: 'sendMessageToStudent',
        studentId: selectedStudent.id,
        studentEmail: selectedStudent.email,
        educatorId: user?.sub,
        educatorEmail: user?.email,
        subject: messageData.subject,
        message: messageData.message
      });

      const response = await fetch('/api/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessageToStudent',
          studentId: selectedStudent.id,
          subject: messageData.subject,
          message: messageData.message
        })
      });

      if (response.ok) {
        // Reset form and close modal
        setMessageData({ subject: '', message: '' });
        setShowMessageModal(false);
        setSelectedStudent(null);
        
        // Show success message (you could add a toast notification here)
        alert('Message sent successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to send message: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedStudent(null);
    setMessageData({ subject: '', message: '' });
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view students</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Users className="w-8 h-8 text-purple-600 mr-3" />
                  My Students
                </h1>
                <p className="text-gray-600">
                  View and manage your students' progress and engagement
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{students.length}</div>
                <div className="text-sm text-gray-500">Active Students</div>
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {students.length > 0 ? (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    {/* Student Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-500">{student.progress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                          style={{ width: student.progress }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{student.totalHours}</div>
                        <div className="text-xs text-gray-500">Total Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{student.completedLessons}</div>
                        <div className="text-xs text-gray-500">Lessons Done</div>
                      </div>
                    </div>

                    {/* Enrolled Courses */}
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enrolled Courses</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.enrolledCourses.map((course, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Music Interests</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.interests.map((interest, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Last Login */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Last active: {student.lastLogin}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleMessageStudent(student)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </button>
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm flex items-center justify-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        Progress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600 mb-4">
                You don't have any students enrolled in your courses yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Message</h3>
                <button
                  onClick={closeMessageModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">To:</p>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={messageData.subject}
                  onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter message subject"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={messageData.message}
                  onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeMessageModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!messageData.message.trim() || sending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
