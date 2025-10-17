'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { BookOpen, Clock, User, CheckCircle, Circle, Calendar, ArrowLeft } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Course {
  id: number;
  title: string;
  instructor: string;
  level: string;
  students: string[];
  assignments: Assignment[];
  progress: { completed: number; total: number };
}

export default function StudentCoursesPage() {
  const { user, isLoading } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/fine-grained-auth');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.accessibleData.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (course: Course) => {
    return Math.round((course.progress.completed / course.progress.total) * 100);
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your courses</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
              My Courses
            </h1>
            <p className="text-gray-600">
              View your enrolled music education courses and track your progress
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Enrolled</h3>
              <p className="text-gray-600 mb-6">
                You haven't enrolled in any courses yet. Contact your educator to get started.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Course Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User className="w-4 h-4 mr-1" />
                          <span>{course.instructor}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span className="capitalize">{course.level} Level</span>
                        </div>
                      </div>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {course.level}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{getProgressPercentage(course)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(course)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.progress.completed} of {course.progress.total} assignments completed
                      </p>
                    </div>
                  </div>

                  {/* Assignments */}
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Assignments
                    </h4>
                    <div className="space-y-3">
                      {course.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {assignment.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className={`font-medium ${assignment.completed ? 'text-green-700' : 'text-gray-900'}`}>
                                {assignment.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                Due: {formatDate(assignment.dueDate)}
                              </p>
                            </div>
                          </div>
                          {assignment.completed && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Completed
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fine-Grained Authorization Info */}
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 text-green-600 mr-2" />
              Fine-Grained Authorization Active
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What you can see:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Only your enrolled courses</li>
                  <li>• Your assignment progress</li>
                  <li>• Course materials and due dates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data isolation:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Cannot see other students' data</li>
                  <li>• Cannot access educator features</li>
                  <li>• Role-based course filtering</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
