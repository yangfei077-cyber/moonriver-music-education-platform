'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { GraduationCap, TrendingUp, Award, Clock, CheckCircle, Target, Circle, ArrowLeft } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface CourseProgress {
  courseId: number;
  courseTitle: string;
  progress: { completed: number; total: number };
  assignments: Assignment[];
}

export default function StudentProgressPage() {
  const { user, isLoading } = useUser();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/fine-grained-auth');
      if (response.ok) {
        const data = await response.json();
        setCourseProgress(data.accessibleData.myProgress || []);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallProgress = () => {
    if (courseProgress.length === 0) return 0;
    
    const totalCompleted = courseProgress.reduce((sum, course) => sum + course.progress.completed, 0);
    const totalAssignments = courseProgress.reduce((sum, course) => sum + course.progress.total, 0);
    
    return totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;
  };

  const getCompletedAssignments = () => {
    return courseProgress.reduce((sum, course) => sum + course.progress.completed, 0);
  };

  const getTotalAssignments = () => {
    return courseProgress.reduce((sum, course) => sum + course.progress.total, 0);
  };

  const getOverdueAssignments = () => {
    const today = new Date();
    return courseProgress.reduce((count, course) => {
      return count + course.assignments.filter(assignment => {
        if (assignment.completed) return false;
        return new Date(assignment.dueDate) < today;
      }).length;
    }, 0);
  };

  const getUpcomingAssignments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return courseProgress.reduce((count, course) => {
      return count + course.assignments.filter(assignment => {
        if (assignment.completed) return false;
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      }).length;
    }, 0);
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your progress</div>;
  }

  const overallProgress = getOverallProgress();
  const completedAssignments = getCompletedAssignments();
  const totalAssignments = getTotalAssignments();
  const overdueAssignments = getOverdueAssignments();
  const upcomingAssignments = getUpcomingAssignments();

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
              <GraduationCap className="w-8 h-8 text-purple-600 mr-3" />
              My Progress
            </h1>
            <p className="text-gray-600">
              Track your learning journey and monitor your course completion
            </p>
          </div>

          {/* Progress Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Overall Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Completed Assignments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedAssignments}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">of {totalAssignments} total assignments</p>
            </div>

            {/* Overdue Assignments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueAssignments}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">assignments past due date</p>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Due This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingAssignments}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">assignments due soon</p>
            </div>
          </div>

          {/* Course Progress Details */}
          {courseProgress.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data</h3>
              <p className="text-gray-600">
                You haven't enrolled in any courses yet. Enroll in a course to start tracking your progress.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {courseProgress.map((course) => {
                const courseProgressPercent = Math.round((course.progress.completed / course.progress.total) * 100);
                
                return (
                  <div key={course.courseId} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{course.courseTitle}</h3>
                        <div className="flex items-center">
                          <Award className="w-5 h-5 text-yellow-500 mr-2" />
                          <span className="text-sm font-medium text-gray-600">{courseProgressPercent}% Complete</span>
                        </div>
                      </div>
                      
                      {/* Course Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Course Progress</span>
                          <span>{course.progress.completed} / {course.progress.total} assignments</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${courseProgressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Details */}
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Assignment Status</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="font-medium text-green-700 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed ({course.progress.completed})
                          </h5>
                          {course.assignments.filter(a => a.completed).map((assignment) => (
                            <div key={assignment.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                              <span className="text-sm text-green-700">{assignment.title}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700 flex items-center">
                            <Circle className="w-4 h-4 mr-2" />
                            Pending ({course.progress.total - course.progress.completed})
                          </h5>
                          {course.assignments.filter(a => !a.completed).map((assignment) => {
                            const isOverdue = new Date(assignment.dueDate) < new Date();
                            return (
                              <div key={assignment.id} className={`flex items-center p-3 rounded-lg ${
                                isOverdue ? 'bg-red-50' : 'bg-gray-50'
                              }`}>
                                <Circle className={`w-4 h-4 mr-3 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                                <div>
                                  <span className={`text-sm ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                                    {assignment.title}
                                  </span>
                                  <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    {isOverdue && ' (Overdue)'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fine-Grained Authorization Info */}
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 text-green-600 mr-2" />
              Fine-Grained Authorization Active
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What you can see:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Your personal progress data only</li>
                  <li>• Assignment completion status</li>
                  <li>• Course-specific progress tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data privacy:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Cannot see other students' progress</li>
                  <li>• Cannot access educator analytics</li>
                  <li>• Role-based data filtering applied</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
