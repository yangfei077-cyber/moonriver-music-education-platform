'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Users, UserPlus, Mail, Phone, Calendar, Award } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  enrolledCourses: string[];
  progress: {
    totalCourses: number;
    completedCourses: number;
    averageScore: number;
  };
}

export default function StudentsPage() {
  const { user, isLoading } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockStudents: Student[] = [
        {
          id: 1,
          name: 'Alex Johnson',
          email: 'alex.johnson@email.com',
          phone: '+1 (555) 123-4567',
          joinDate: '2024-01-15',
          enrolledCourses: ['Piano Fundamentals', 'Music Theory Essentials'],
          progress: {
            totalCourses: 2,
            completedCourses: 1,
            averageScore: 85,
          },
        },
        {
          id: 2,
          name: 'Sarah Chen',
          email: 'sarah.chen@email.com',
          phone: '+1 (555) 234-5678',
          joinDate: '2024-01-20',
          enrolledCourses: ['Advanced Guitar Techniques'],
          progress: {
            totalCourses: 1,
            completedCourses: 0,
            averageScore: 0,
          },
        },
        {
          id: 3,
          name: 'Michael Rodriguez',
          email: 'michael.r@email.com',
          phone: '+1 (555) 345-6789',
          joinDate: '2024-01-25',
          enrolledCourses: ['Piano Fundamentals', 'Advanced Guitar Techniques', 'Music Theory Essentials'],
          progress: {
            totalCourses: 3,
            completedCourses: 2,
            averageScore: 92,
          },
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) return;

    const student: Student = {
      id: Date.now(),
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      joinDate: new Date().toISOString().split('T')[0],
      enrolledCourses: [],
      progress: {
        totalCourses: 0,
        completedCourses: 0,
        averageScore: 0,
      },
    };

    setStudents([...students, student]);
    setNewStudent({ name: '', email: '', phone: '' });
    setShowAddForm(false);
  };

  const removeStudent = async (studentId: number) => {
    setStudents(students.filter(student => student.id !== studentId));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view students</div>;
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
  const canManageStudents = isAdmin || isEducator;

  if (!canManageStudents) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">Only educators and admins can view student information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 text-purple-600 mr-2" />
              Student Management
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </button>
          </div>

          {/* Add Student Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Student</h2>
              <form onSubmit={addStudent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                  >
                    Add Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students Grid */}
          {loading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => removeStudent(student.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {student.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined: {new Date(student.joinDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {student.enrolledCourses.length} enrolled courses
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      Progress
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Courses Completed:</span>
                        <span className="font-medium">{student.progress.completedCourses}/{student.progress.totalCourses}</span>
                      </div>
                      {student.progress.averageScore > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Average Score:</span>
                          <span className="font-medium">{student.progress.averageScore}%</span>
                        </div>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${student.progress.totalCourses > 0 ? (student.progress.completedCourses / student.progress.totalCourses) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  {student.enrolledCourses.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Enrolled Courses:</h4>
                      <div className="space-y-1">
                        {student.enrolledCourses.map((course, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {course}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {students.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">Add your first student to get started.</p>
            </div>
          )}

          {/* Summary Stats */}
          {students.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Summary</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{students.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {students.reduce((sum, student) => sum + student.progress.completedCourses, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Courses Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(students.reduce((sum, student) => sum + student.progress.averageScore, 0) / students.length) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
