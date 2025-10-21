'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Users, Mail, BookOpen, TrendingUp, Clock, ArrowLeft, Filter, Search } from 'lucide-react';

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

export default function StudentsDirectoryPage() {
  const { user, isLoading } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    course: string;
    search: string;
  }>({
    course: '',
    search: ''
  });
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (allStudents.length > 0) {
      if (filters.search) {
        const timeout = setTimeout(() => {
          applyFilters();
        }, 300);
        setSearchTimeout(timeout);
      } else {
        applyFilters();
      }
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters, allStudents]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Demo students data - all students in the platform
      const allStudentsData: Student[] = [
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

      setAllStudents(allStudentsData);
      
      // Extract available courses for filtering
      const courses = [...new Set(allStudentsData.flatMap(student => student.enrolledCourses))];
      setAvailableCourses(courses.sort());
      
      // Apply initial filters
      applyFilters();
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredStudents = [...allStudents];

    // Filter by course
    if (filters.course) {
      filteredStudents = filteredStudents.filter(student =>
        student.enrolledCourses.includes(filters.course)
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredStudents = filteredStudents.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.interests.some(interest => interest.toLowerCase().includes(searchLower))
      );
    }

    setStudents(filteredStudents);
  };

  const getProgressColor = (progress: string) => {
    const percentage = parseInt(progress);
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view students</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students Directory</h1>
                <p className="text-gray-600 mt-1">Browse all students in the platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Course
                    </label>
              <select
                value={filters.course}
                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Courses</option>
                {availableCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
                    </label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                  type="text"
                  placeholder="Search by name or music interests..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
            </div>
                    </div>
                  </div>

        {/* Students Grid - Simplified View */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{student.name}</h3>
                  </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Music Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {student.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Students Message */}
        {students.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or check back later for new students.
            </p>
            <button
              onClick={() => setFilters({ course: '', search: '' })}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}