'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Users, Settings, BookOpen, GraduationCap, Shield, Heart, User, Search, MessageSquare, Mail, Tag, Calendar } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface Interest {
  id: string;
  label: string;
  category: string;
}

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  // Fetch user interests
  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;
      
      setLoadingInterests(true);
      try {
        const response = await fetch('/api/student-interests');
        if (response.ok) {
          const data = await response.json();
          setInterests(data.interests || []);
        } else {
          console.error('Failed to fetch interests:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoadingInterests(false);
      }
    };

    fetchInterests();
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
            
            {/* Three Auth0 Pillars */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">1. User Authentication</h3>
                <p className="text-gray-300 text-sm">Secure the human prompting the agent</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">2. Token Vault</h3>
                <p className="text-gray-300 text-sm">Control tools & API access</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">3. Fine-Grained Auth</h3>
                <p className="text-gray-300 text-sm">Limit knowledge & RAG access</p>
              </div>
            </div>

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

  // Get roles from Auth0 user object (set by the callback handler)
  const roles = (user as any)?.['https://moonriver.com/roles'] || ['student'];

  const isAdmin = roles.includes('admin');
  const isEducator = roles.includes('educator');
  const isStudent = roles.includes('student');

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
                {isAdmin && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">ADMIN</span>}
                {isEducator && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">EDUCATOR</span>}
                {isStudent && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">STUDENT</span>}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            
            {/* Role-specific content */}
            {isAdmin && (
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <Users className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-600">Manage educators and students</p>
                </Link>
                <Link href="/admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <Settings className="w-8 h-8 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
                  <p className="text-gray-600">Configure platform settings</p>
                </Link>
              </div>
            )}

            {isEducator && (
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/educator/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <BookOpen className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                  <p className="text-gray-600">Manage your music courses</p>
                </Link>
                <Link href="/educator/students" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <Users className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Students</h3>
                  <p className="text-gray-600">View student progress</p>
                </Link>
              </div>
            )}

            {isStudent && (
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <Search className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Catalog</h3>
                  <p className="text-gray-600">Browse and enroll in courses</p>
                </Link>
                <Link href="/educators" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <MessageSquare className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Educator Directory</h3>
                  <p className="text-gray-600">Connect with educators and send messages</p>
                </Link>
                <Link href="/student/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <BookOpen className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                  <p className="text-gray-600">Access your enrolled courses</p>
                </Link>
                <Link href="/student/progress" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <GraduationCap className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Progress</h3>
                  <p className="text-gray-600">Track your learning journey</p>
                </Link>
                <Link href="/student/messages" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                  <p className="text-gray-600">View conversations with educators</p>
                </Link>
              </div>
            )}
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
                      {roles[0]?.charAt(0).toUpperCase() + roles[0]?.slice(1) || 'Student'}
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

              {/* Selected Interests */}
              {isStudent && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    My Interests
                  </h4>
                  {loadingInterests ? (
                    <p className="text-xs text-gray-500">Loading interests...</p>
                  ) : interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {interests.slice(0, 6).map((interest) => (
                        <span
                          key={interest.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                        >
                          {interest.label}
                        </span>
                      ))}
                      {interests.length > 6 && (
                        <span 
                          key="more-interests"
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          +{interests.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No interests selected yet</p>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {isStudent && (
                    <>
                      <Link
                        href="/student/interests"
                        className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs text-center"
                      >
                        Manage Interests
                      </Link>
                      <Link
                        href="/student/profile"
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs text-center"
                      >
                        View Full Profile
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}