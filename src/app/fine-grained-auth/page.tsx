'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { BookOpen, Users, GraduationCap, Shield, Lock, Eye } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  instructor: string;
  level: string;
  students: string[];
  assignments: Array<{
    id: number;
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
  progress: {
    completed: number;
    total: number;
  };
}

interface FineGrainedData {
  user: {
    email: string;
    roles: string[];
  };
  accessibleData: {
    courses?: Course[];
    students?: any[];
    myProgress?: any[];
    systemStats?: any;
  };
  permissions: {
    canViewAllCourses: boolean;
    canEditCourses: boolean;
    canViewAllStudents: boolean;
    canViewStudentProgress: boolean;
    canEnrollInCourses: boolean;
    canSubmitAssignments: boolean;
  };
}

export default function FineGrainedAuthPage() {
  const { user, isLoading } = useUser();
  const [data, setData] = useState<FineGrainedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFineGrainedData();
    }
  }, [user]);

  const fetchFineGrainedData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fine-grained-auth');
      if (response.ok) {
        const fineGrainedData = await response.json();
        setData(fineGrainedData);
      }
    } catch (error) {
      console.error('Error fetching fine-grained data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access Fine-Grained Authorization</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="w-6 h-6 text-purple-600 mr-2" />
              Fine-Grained Authorization
            </h1>
            <p className="text-gray-600 mb-6">
              Role-based access control demonstrating how different user roles see different data and have different permissions.
            </p>

            {loading ? (
              <div className="text-center py-8">Loading authorization data...</div>
            ) : data ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Current User</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Email:</strong> {data.user.email}</p>
                      <p><strong>Roles:</strong> {data.user.roles.join(', ')}</p>
                    </div>
                    <div>
                      <p><strong>Permissions:</strong></p>
                      <div className="text-sm space-y-1">
                        {Object.entries(data.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-gray-700">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accessible Data */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Courses */}
                  {data.accessibleData.courses && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                        Accessible Courses
                      </h3>
                      <div className="space-y-3">
                        {data.accessibleData.courses.map((course) => (
                          <div key={course.id} className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                            <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                            <p className="text-sm text-gray-600">Level: {course.level}</p>
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{course.progress.completed}/{course.progress.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(course.progress.completed / course.progress.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            {course.assignments && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Assignments:</p>
                                <ul className="text-sm text-gray-600">
                                  {course.assignments.map((assignment) => (
                                    <li key={assignment.id} className="flex items-center">
                                      <div className={`w-2 h-2 rounded-full mr-2 ${assignment.completed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                      {assignment.title} - Due: {assignment.dueDate}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students (for educators/admins) */}
                  {data.accessibleData.students && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                        Accessible Students
                      </h3>
                      <div className="space-y-3">
                        {data.accessibleData.students.map((student) => (
                          <div key={student.id} className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-gray-600">
                              Enrolled in {student.enrolledCourses?.length || 0} courses
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* My Progress (for students) */}
                  {data.accessibleData.myProgress && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <GraduationCap className="w-5 h-5 text-purple-600 mr-2" />
                        My Progress
                      </h3>
                      <div className="space-y-3">
                        {data.accessibleData.myProgress.map((progress) => (
                          <div key={progress.courseId} className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">{progress.courseTitle}</h4>
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{progress.progress.completed}/{progress.progress.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${(progress.progress.completed / progress.progress.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Stats (for admins) */}
                  {data.accessibleData.systemStats && (
                    <div className="bg-white border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Eye className="w-5 h-5 text-red-600 mr-2" />
                        System Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Courses:</span>
                          <span className="font-medium">{data.accessibleData.systemStats.totalCourses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Educators:</span>
                          <span className="font-medium">{data.accessibleData.systemStats.totalEducators}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Students:</span>
                          <span className="font-medium">{data.accessibleData.systemStats.totalStudents}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Unable to load authorization data.</p>
              </div>
            )}
          </div>

          {/* Auth0 Challenge Compliance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              Fine-Grained Authorization Compliance
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Role-based data filtering</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Permission-based API access control</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Context-aware data visibility</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Secure action authorization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
