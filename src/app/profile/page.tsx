'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Shield, Music, ArrowLeft, Edit, Save, X, Tag, Filter, Check } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserContext } from '../../contexts/UserContext';

interface Interest {
  id: string;
  label: string;
  category: string;
}

interface TeachingArea {
  id: string;
  label: string;
  category: string;
}

export default function ProfilePage() {
  const { user, error, isLoading } = useUser();
  const { roles, isAdmin, isEducator, isStudent, displayName, setDisplayName } = useUserContext();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [teachingAreas, setTeachingAreas] = useState<TeachingArea[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [loadingTeachingAreas, setLoadingTeachingAreas] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      const roles = (user as any)?.['https://moonriver.com/roles'] || ['student'];
      const isStudent = roles.includes('student');
      const isEducator = roles.includes('educator');
      
      if (isStudent) {
        fetchInterests();
      }
      if (isEducator) {
        fetchTeachingAreas();
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const response = await fetch(`/api/user-profile?userId=${encodeURIComponent(user.email || user.sub || '')}`);
      const data = await response.json();
      
      if (data.success && data.profile) {
        setDisplayName(data.profile.displayName || user.name || user.email || '');
      } else {
        setDisplayName(user.name || user.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setDisplayName(user.name || user.email || '');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchInterests = async () => {
    if (!user) return;
    
    setLoadingInterests(true);
    try {
      const roles = (user as any)?.['https://moonriver.com/roles'] || ['student'];
      const response = await fetch(`/api/student-interests?userId=${encodeURIComponent(user.sub || '')}&userRoles=${encodeURIComponent(JSON.stringify(roles))}`);
      const data = await response.json();
      if (data.success) {
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
    } finally {
      setLoadingInterests(false);
    }
  };

  const fetchTeachingAreas = async () => {
    if (!user) return;
    
    setLoadingTeachingAreas(true);
    try {
      const roles = (user as any)?.['https://moonriver.com/roles'] || ['student'];
      const response = await fetch(`/api/educator-teaching-areas?userId=${encodeURIComponent(user.sub || '')}&userRoles=${encodeURIComponent(JSON.stringify(roles))}`);
      const data = await response.json();
      if (data.success) {
        setTeachingAreas(data.teachingAreas || []);
      }
    } catch (error) {
      console.error('Error fetching teaching areas:', error);
    } finally {
      setLoadingTeachingAreas(false);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.email || user.sub,
          displayName: displayName
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        // Optionally show a success message
        console.log('Name updated successfully');
      } else {
        console.error('Failed to update name:', data.error);
        // Reset to original name on error
        setDisplayName(user?.name || user?.email || '');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      // Reset to original name on error
      setDisplayName(user?.name || user?.email || '');
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.name || user?.email || '');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFCF5] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2B949] mx-auto mb-4"></div>
          <p className="text-[#1F2937] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFCF5] flex justify-center items-center">
        <div className="text-center">
          <p className="text-[#F27430] text-lg">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFCF5] flex justify-center items-center">
        <div className="text-center">
          <p className="text-[#F27430] text-lg">Please log in to view your profile</p>
          <Link href="/api/auth/login" className="mt-4 inline-block bg-[#6366F1] text-white px-6 py-2 rounded-lg hover:bg-[#818CF8] transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
        .font-display {
          font-family: 'Fredoka One', cursive;
        }
        .logo-m {
          display: inline-block;
          transform: scaleY(0.7);
          font-size: 1.2em;
          line-height: 1;
          position: relative;
          top: -0.05em;
        }
      `}</style>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white flex-shrink-0 p-6 hidden lg:flex flex-col justify-between">
          <div>
            <Link className="text-3xl font-display mb-12 block" href="/">
              <span className="logo-m text-[#F28C4A]">M</span><span className="text-[#333333]">oonriver</span>
            </Link>
            <nav className="space-y-4">
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/">
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </Link>
              {isStudent && (
                <>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/student/courses">
                    <span className="material-symbols-outlined">music_note</span>
                    <span>My Courses</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/student/appointments">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span>Schedule</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educators">
                    <span className="material-symbols-outlined">person</span>
                    <span>Instructors</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/ai-assistant">
                    <span className="material-symbols-outlined">smart_toy</span>
                    <span>AI Assistant</span>
                  </Link>
                </>
              )}
              {isEducator && (
                <>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educator/courses">
                    <span className="material-symbols-outlined">music_note</span>
                    <span>My Courses</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educator/schedule">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span>Schedule</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educator/students">
                    <span className="material-symbols-outlined">person</span>
                    <span>My Students</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educator/ai-assistant">
                    <span className="material-symbols-outlined">smart_toy</span>
                    <span>AI Teaching Assistant</span>
                  </Link>
                </>
              )}
              <Link className="flex items-center space-x-3 text-[#F28C4A] bg-[#FFF0E6] px-4 py-2 rounded-lg font-semibold" href="/profile">
                <span className="material-symbols-outlined">person</span>
                <span>My Profile</span>
              </Link>
            </nav>
          </div>
          <div>
            <Link href="/profile" className="w-12 h-12 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-semibold hover:bg-[#E76F51] transition-colors cursor-pointer mx-auto">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-[#333333]">My Profile</h1>
              <p className="text-[#555555]">Manage your account and preferences</p>
              <div className="flex space-x-2 mt-2">
                {isAdmin && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">ADMIN</span>}
                {isEducator && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">EDUCATOR</span>}
                {isStudent && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">STUDENT</span>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="w-12 h-12 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-semibold hover:bg-[#E76F51] transition-colors cursor-pointer">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Link>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-[#FDF8F0] rounded-lg shadow-md p-8">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-bold text-3xl mr-6">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="text-2xl font-bold text-[#333333] bg-[#FFF0E6] border border-[#F2C69D] rounded px-3 py-1"
                          />
                          <button
                            onClick={handleSaveName}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-[#333333]">{displayName}</h2>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-[#555555] hover:bg-[#FFF0E6] rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {isAdmin && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">ADMIN</span>}
                      {isEducator && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">EDUCATOR</span>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-[#F28C4A]" />
                      Email Address
                    </label>
                    <p className="text-[#333333] bg-[#FFF0E6] px-4 py-3 rounded-lg">
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Music Interests for Students */}
                {isStudent && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-lg font-medium text-[#333333] flex items-center">
                        <Music className="w-5 h-5 mr-2 text-[#F28C4A]" />
                        Music Interests
                      </label>
                      <button 
                        onClick={() => setIsInterestsModalOpen(true)}
                        className="text-dash-primary hover:text-dash-accent text-sm font-medium"
                      >
                        Edit Interests
                      </button>
                    </div>
                    {loadingInterests ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C4A]"></div>
                      </div>
                    ) : interests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <span key={interest.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FFF0E6] text-[#F28C4A]">
                            {interest.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#555555] italic">No interests selected yet</p>
                    )}
                  </div>
                )}

                {/* Teaching Areas for Educators */}
                {isEducator && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-lg font-medium text-[#333333] flex items-center">
                        <Music className="w-5 h-5 mr-2 text-[#F28C4A]" />
                        Teaching Areas
                      </label>
                      <Link 
                        href="/educator/teaching-areas"
                        className="text-[#F28C4A] hover:text-[#E76F51] text-sm font-medium"
                      >
                        Edit Teaching Areas
                      </Link>
                    </div>
                    {loadingTeachingAreas ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C4A]"></div>
                      </div>
                    ) : teachingAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {teachingAreas.map((area) => (
                          <span key={area.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FFF0E6] text-[#F28C4A]">
                            {area.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#555555] italic">No teaching areas selected yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-[#FDF8F0] rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold font-display text-[#333333] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isStudent && (
                    <>
                      <button 
                        onClick={() => setIsInterestsModalOpen(true)}
                        className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors w-full text-left"
                      >
                        <Music className="w-5 h-5" />
                        <span>Edit Interests</span>
                      </button>
                      <Link 
                        href="/ai-assistant"
                        className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">smart_toy</span>
                        <span>AI Assistant</span>
                      </Link>
                    </>
                  )}
                  {isEducator && (
                    <>
                      <Link 
                        href="/educator/teaching-areas"
                        className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors"
                      >
                        <Music className="w-5 h-5" />
                        <span>Edit Teaching Areas</span>
                      </Link>
                      <Link 
                        href="/educator/ai-assistant"
                        className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">smart_toy</span>
                        <span>AI Teaching Assistant</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-[#FDF8F0] rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold font-display text-[#333333] mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#555555]">Member since:</span>
                    <p className="text-[#333333]">January 2024</p>
                  </div>
                  <div>
                    <span className="text-[#555555]">Last login:</span>
                    <p className="text-[#333333]">Today</p>
                  </div>
                  <div>
                    <span className="text-[#555555]">Status:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Interests Modal */}
      <InterestsModal 
        isOpen={isInterestsModalOpen} 
        onClose={() => setIsInterestsModalOpen(false)}
        onSave={(savedInterests) => {
          // Refresh interests after saving
          if (isStudent) {
            fetchInterests();
          }
        }}
      />
    </div>
  );
}

// Interests Modal Component
function InterestsModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (interests: string[]) => void }) {
  const { user } = useUser();
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchInterests();
    }
  }, [isOpen, user]);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student-interests?userId=${encodeURIComponent(user?.sub || '')}&userRoles=${encodeURIComponent(JSON.stringify((user as any)?.['https://moonriver.com/roles'] || ['student']))}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableInterests(data.availableInterests);
        // Extract IDs from interest objects
        const interestIds = (data.interests || []).map((interest: Interest) => interest.id);
        setSelectedInterests(interestIds);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      setMessage({ type: 'error', text: 'Failed to load interests' });
    } finally {
      setLoading(false);
    }
  };

  const saveInterests = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/student-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interests: selectedInterests,
          userId: user?.sub,
          userRoles: (user as any)?.['https://moonriver.com/roles'] || ['student']
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully saved ${data.count} interests!` });
        setTimeout(() => {
          onSave(selectedInterests);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save interests' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        if (prev.length >= 10) {
          setMessage({ type: 'error', text: 'Maximum 10 interests allowed' });
          return prev;
        }
        return [...prev, interestId];
      }
    });
    setMessage(null);
  };

  const getFilteredInterests = () => {
    if (selectedCategory === 'all') {
      return availableInterests;
    }
    return availableInterests.filter(interest => interest.category === selectedCategory);
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

  if (!isOpen) return null;

  const categories = ['all', 'genre', 'instrument', 'skill', 'level'];
  const filteredInterests = getFilteredInterests();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-light rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-text-light flex items-center">
              <Music className="w-6 h-6 text-dash-primary mr-3" />
              My Music Interests
            </h2>
            <p className="text-text-light/70 mt-1">
              Select your musical interests to personalize your learning experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-text-light/70" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Selected Interests Summary */}
          <div className="bg-background-light rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-light flex items-center">
                <Tag className="w-5 h-5 mr-2 text-dash-primary" />
                Selected Interests ({selectedInterests.length}/10)
              </h3>
              <button
                onClick={saveInterests}
                disabled={saving}
                className="bg-dash-primary hover:bg-dash-accent text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Interests'}
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {selectedInterests.length === 0 ? (
              <p className="text-text-light/70 text-center py-4">
                No interests selected yet. Choose from the categories below!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map(interestId => {
                  const interest = availableInterests.find(i => i.id === interestId);
                  if (!interest) return null;
                  
                  return (
                    <span
                      key={interestId}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(interest.category)} flex items-center`}
                    >
                      <span className="mr-1">{getCategoryIcon(interest.category)}</span>
                      {interest.label}
                      <button
                        onClick={() => toggleInterest(interestId)}
                        className="ml-2 text-xs hover:bg-black hover:bg-opacity-10 rounded-full p-1"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="bg-background-light rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-dash-primary" />
              Browse by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-dash-primary text-white'
                      : 'bg-gray-100 text-text-light hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Available Interests */}
          <div className="bg-background-light rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-light mb-4">
              Available Interests ({filteredInterests.length})
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dash-primary"></div>
              </div>
            ) : filteredInterests.length === 0 ? (
              <p className="text-text-light/70 text-center py-8">
                No interests found in this category.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredInterests.map(interest => {
                  const isSelected = selectedInterests.includes(interest.id);
                  
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      disabled={!isSelected && selectedInterests.length >= 10}
                      className={`p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-dash-primary bg-dash-secondary/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center mb-1">
                            <span className="mr-2">{getCategoryIcon(interest.category)}</span>
                            <span className="font-medium text-sm text-text-light">{interest.label}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(interest.category)}`}>
                            {interest.category}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-dash-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
