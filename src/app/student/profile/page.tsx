'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { User, Heart, Edit, Calendar, Mail, Tag, Music, ArrowLeft } from 'lucide-react';

interface Interest {
  id: string;
  label: string;
  category: string;
}

export default function StudentProfilePage() {
  const { user, isLoading } = useUser();
  const [interests, setInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student-interests?userId=${encodeURIComponent(user?.sub || '')}&roles=${encodeURIComponent((user as any)?.['https://moonriver.com/roles']?.join(',') || 'student')}`);
      if (response.ok) {
        const data = await response.json();
        // Extract IDs from interest objects
        const interestIds = (data.interests || []).map((interest: Interest) => interest.id);
        setInterests(interestIds);
        setAvailableInterests(data.availableInterests || []);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'genre': return '🎵';
      case 'instrument': return '🎸';
      case 'skill': return '🎯';
      case 'level': return '📈';
      default: return '🏷️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'genre': return 'bg-purple-100 text-purple-800';
      case 'instrument': return 'bg-blue-100 text-blue-800';
      case 'skill': return 'bg-green-100 text-green-800';
      case 'level': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterestLabel = (interestId: string) => {
    const interest = availableInterests.find(i => i.id === interestId);
    return interest ? interest.label : interestId;
  };

  const getInterestCategory = (interestId: string) => {
    const interest = availableInterests.find(i => i.id === interestId);
    return interest ? interest.category : 'other';
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your profile</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
              <User className="w-8 h-8 text-purple-600 mr-3" />
              My Profile
            </h1>
            <p className="text-gray-600">
              View and manage your music education profile
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Name
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {user.name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Role
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      Student
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Member Since
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Music Interests */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    My Music Interests
                  </h2>
                  <Link
                    href="/student/interests"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Interests
                  </Link>
                </div>

                {interests.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      You haven't selected any music interests yet.
                    </p>
                    <Link
                      href="/student/interests"
                      className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                    >
                      Add Your Interests
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      You have {interests.length} music interests selected:
                    </p>
                    
                    {/* Group interests by category */}
                    {['genre', 'instrument', 'skill', 'level'].map(category => {
                      const categoryInterests = interests.filter(interestId => 
                        getInterestCategory(interestId) === category
                      );
                      
                      if (categoryInterests.length === 0) return null;
                      
                      return (
                        <div key={category} className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {getCategoryIcon(category)} {category}s ({categoryInterests.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {categoryInterests.map(interestId => (
                              <span
                                key={interestId}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}
                              >
                                {getInterestLabel(interestId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interests</span>
                    <span className="font-medium">{interests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile Complete</span>
                    <span className="font-medium">
                      {interests.length > 0 ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/student/interests"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-center text-sm"
                  >
                    Manage Interests
                  </Link>
                  <Link
                    href="/student/courses"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center text-sm"
                  >
                    View Courses
                  </Link>
                  <Link
                    href="/student/progress"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center text-sm"
                  >
                    Track Progress
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
