'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  instructor: string;
  level: string;
  description: string;
  duration: string;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'audio' | 'text' | 'quiz';
  completed: boolean;
}

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    instructor: '',
    level: 'Beginner',
    description: '',
    duration: '',
  });

  useEffect(() => {
    // Check for mock authentication
    const urlParams = new URLSearchParams(window.location.search);
    const loggedIn = urlParams.get('loggedIn');
    const email = urlParams.get('email');
    
    if (loggedIn && email) {
      setUser({ email });
      fetchCourses();
    }
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockCourses: Course[] = [
        {
          id: 1,
          title: 'Piano Fundamentals',
          instructor: 'Dr. Sarah Johnson',
          level: 'Beginner',
          description: 'Learn the basics of piano playing, including proper posture, hand positioning, and basic scales.',
          duration: '8 weeks',
          lessons: [
            { id: 1, title: 'Introduction to Piano', duration: '15 min', type: 'video', completed: true },
            { id: 2, title: 'Hand Positioning', duration: '20 min', type: 'video', completed: true },
            { id: 3, title: 'Basic Scales', duration: '25 min', type: 'video', completed: false },
            { id: 4, title: 'Scale Practice Quiz', duration: '10 min', type: 'quiz', completed: false },
          ],
        },
        {
          id: 2,
          title: 'Advanced Guitar Techniques',
          instructor: 'Mike Chen',
          level: 'Advanced',
          description: 'Master advanced guitar techniques including fingerpicking, jazz improvisation, and complex chord progressions.',
          duration: '12 weeks',
          lessons: [
            { id: 5, title: 'Fingerpicking Patterns', duration: '30 min', type: 'video', completed: false },
            { id: 6, title: 'Jazz Theory Basics', duration: '25 min', type: 'text', completed: false },
            { id: 7, title: 'Improvisation Techniques', duration: '35 min', type: 'video', completed: false },
          ],
        },
        {
          id: 3,
          title: 'Music Theory Essentials',
          instructor: 'Prof. Emily Davis',
          level: 'Intermediate',
          description: 'Comprehensive music theory course covering scales, chords, harmony, and composition basics.',
          duration: '10 weeks',
          lessons: [
            { id: 8, title: 'Introduction to Scales', duration: '20 min', type: 'video', completed: true },
            { id: 9, title: 'Chord Construction', duration: '25 min', type: 'video', completed: false },
            { id: 10, title: 'Harmony Principles', duration: '30 min', type: 'text', completed: false },
          ],
        },
      ];
      setCourses(mockCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.instructor) return;

    const course: Course = {
      id: Date.now(),
      title: newCourse.title,
      instructor: newCourse.instructor,
      level: newCourse.level,
      description: newCourse.description,
      duration: newCourse.duration,
      lessons: [],
    };

    setCourses([...courses, course]);
    setNewCourse({ title: '', instructor: '', level: 'Beginner', description: '', duration: '' });
    setShowCreateForm(false);
  };

  const deleteCourse = async (courseId: number) => {
    setCourses(courses.filter(course => course.id !== courseId));
  };

  const toggleLessonCompletion = (courseId: number, lessonId: number) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId 
                ? { ...lesson, completed: !lesson.completed }
                : lesson
            )
          }
        : course
    ));
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view courses</div>;
  }

  // Mock role assignment based on email for demo
  let roles = [];
  if (user?.email === 'admin@moonriver.com') {
    roles = ['admin'];
  } else if (user?.email === 'educator@moonriver.com') {
    roles = ['educator'];
  } else if (user?.email === 'student@moonriver.com') {
    roles = ['student'];
  } else {
    roles = ['student']; // default role
  }
  const isAdmin = roles.includes('admin');
  const isEducator = roles.includes('educator');
  const canCreateCourses = isAdmin || isEducator;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 text-purple-600 mr-2" />
              Music Courses
            </h1>
            {canCreateCourses && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </button>
            )}
          </div>

          {/* Create Course Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Course</h2>
              <form onSubmit={createCourse} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level
                    </label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      placeholder="e.g., 8 weeks"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                  >
                    Create Course
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-8">Loading courses...</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">by {course.instructor}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level}
                      </span>
                      {canCreateCourses && (
                        <div className="flex space-x-1">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteCourse(course.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Duration: {course.duration}</span>
                    <span className="text-sm text-gray-500">
                      {course.lessons.filter(l => l.completed).length}/{course.lessons.length} lessons completed
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${course.lessons.length > 0 ? (course.lessons.filter(l => l.completed).length / course.lessons.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>

                  {/* Lessons */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Lessons:</h4>
                    <div className="space-y-2">
                      {course.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleLessonCompletion(course.id, lesson.id)}
                              className="mr-3 text-gray-400 hover:text-gray-600"
                            >
                              {lesson.completed ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div>
                              <span className={`text-sm ${lesson.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {lesson.title}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">({lesson.duration})</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            lesson.type === 'video' ? 'bg-blue-100 text-blue-800' :
                            lesson.type === 'audio' ? 'bg-green-100 text-green-800' :
                            lesson.type === 'text' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {lesson.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {courses.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-500">Check back later for new music courses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}