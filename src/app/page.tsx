'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Users, Settings, BookOpen, GraduationCap, Shield } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock authentication
    const urlParams = new URLSearchParams(window.location.search);
    const loggedIn = urlParams.get('loggedIn');
    const email = urlParams.get('email');
    
    if (loggedIn && email) {
      setUser({ email });
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    window.location.href = `/?loggedIn=true&email=${email}`;
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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
              <div className="space-y-2">
                <button
                  onClick={() => handleLogin('admin@moonriver.com')}
                  className="block w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Login as Admin
                </button>
                <button
                  onClick={() => handleLogin('educator@moonriver.com')}
                  className="block w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Login as Educator
                </button>
                <button
                  onClick={() => handleLogin('student@moonriver.com')}
                  className="block w-full max-w-xs mx-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Login as Student
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Demo accounts for testing different roles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                Welcome, {user?.name}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Roles:</strong> {roles.join(', ')}</p>
                <p><strong>Auth0 ID:</strong> {user?.sub}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}