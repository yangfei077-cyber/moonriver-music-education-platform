'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Heart, Music, Save, Tag, Filter, Check, ArrowLeft } from 'lucide-react';

interface Interest {
  id: string;
  label: string;
  category: string;
}

export default function StudentInterestsPage() {
  const { user, isLoading } = useUser();
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchInterests();
    }
  }, [user]);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student-interests?userId=${encodeURIComponent(user?.sub || '')}&roles=${encodeURIComponent((user as any)?.['https://moonriver.com/roles']?.join(',') || 'student')}`);
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

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to manage your interests</div>;
  }

  const categories = ['all', 'genre', 'instrument', 'skill', 'level'];
  const filteredInterests = getFilteredInterests();

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
              <Heart className="w-8 h-8 text-red-600 mr-3" />
              My Music Interests
            </h1>
            <p className="text-gray-600">
              Select your musical interests to personalize your learning experience
            </p>
          </div>

          {/* Selected Interests Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Selected Interests ({selectedInterests.length}/10)
              </h2>
              <button
                onClick={saveInterests}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Interests'}
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {selectedInterests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Browse by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Available Interests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Interests ({filteredInterests.length})
            </h3>
            
            {filteredInterests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
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
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center mb-1">
                            <span className="mr-2">{getCategoryIcon(interest.category)}</span>
                            <span className="font-medium text-sm">{interest.label}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(interest.category)}`}>
                            {interest.category}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fine-Grained Authorization Info */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 text-green-600 mr-2" />
              Personal Interest Management
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Data:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Only you can see and edit your interests</li>
                  <li>• Interests are used to personalize your experience</li>
                  <li>• Helps recommend relevant courses and content</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Privacy & Security:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Your interests are private to you</li>
                  <li>• Educators and admins cannot access your interests</li>
                  <li>• Role-based access control enforced</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
