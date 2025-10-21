'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Users, Settings, BookOpen, GraduationCap, Shield, User, Search, MessageSquare, Mail, Tag, Calendar, Bot, Clock, Target } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function EducatorDashboard() {
  const { user, error, isLoading } = useUser();
  const [myStudents, setMyStudents] = useState<any[]>([]);

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  // Fetch educator's students
  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!user) return;
      
      try {
        // Mock data for demo - in real app, this would fetch from API
        const demoStudents = [
          {
            id: 'student1',
            name: 'student@moonriver.com',
            email: 'student@moonriver.com',
            progress: 75,
            interests: ['Neo-Soul', 'Punk', 'Jazz'],
            lastLesson: '2024-01-15'
          }
        ];
        setMyStudents(demoStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchMyStudents();
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">Error: {error.message}</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
                <Music className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              MoonRiver Platform
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Secure music education platform demonstrating Auth0 for AI Agents with 
              User Authentication, Token Vault, and Fine-Grained Authorization
            </p>
            
            <div className="space-y-4">
              <a
                href="/api/auth/login"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Login with Auth0
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get roles from Auth0 user object
  const roles = (user as any)?.['https://moonriver.com/roles'] || ['educator'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Music className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">MoonRiver Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.name || user?.email}
              </div>
              <div className="flex space-x-2">
                {roles.includes('educator') && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">EDUCATOR</span>}
              </div>
              <a
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dashboard Cards */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Educator Dashboard</h2>
            
            {/* Educator-specific content */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/educator/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <BookOpen className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                <p className="text-gray-600">Manage your music courses</p>
              </Link>
              <Link href="/educator/students" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Directory</h3>
                <p className="text-gray-600">Connect with students and send messages</p>
              </Link>
              <Link href="/educator/messages" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <MessageSquare className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                <p className="text-gray-600">View conversations with students</p>
              </Link>
              <Link href="/educator/ai-assistant" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <Bot className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Teaching Assistant</h3>
                <p className="text-gray-600">Get help with student recommendations and teaching strategies</p>
              </Link>
            </div>
          </div>

          {/* Auth0 Challenge Compliance */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 text-green-600 mr-2" />
                Auth0 Challenge Compliance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">User Authentication ✓</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Token Vault ✓</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Fine-Grained Auth ✓</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-purple-600 mr-2" />
                My Profile
              </h3>
              
              {/* Basic Information */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Mail className="w-3 h-3 inline mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-2 py-1 rounded text-xs">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <User className="w-3 h-3 inline mr-1" />
                      Name
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-2 py-1 rounded text-xs">
                      {user?.name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Tag className="w-3 h-3 inline mr-1" />
                      Role
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-2 py-1 rounded text-xs">
                      Educator
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Member Since
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-2 py-1 rounded text-xs">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* My Students */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  My Students
                </h4>
                {myStudents.length > 0 ? (
                  <div className="space-y-2">
                    {myStudents.map((student) => (
                      <div key={student.id} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-gray-600">
                          Progress: {student.progress}% • Last lesson: {student.lastLesson}
                        </div>
                        {student.interests && student.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.interests.slice(0, 3).map((interest, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No students assigned yet</p>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href="/educator/students"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs text-center"
                  >
                    View All Students
                  </Link>
                  <Link
                    href="/educator/messages"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs text-center"
                  >
                    Check Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
