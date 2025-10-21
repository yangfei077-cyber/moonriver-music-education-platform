'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Save, Check } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface TeachingArea {
  id: string;
  label: string;
  category: string;
}

export default function EducatorTeachingAreas() {
  const { user } = useUser();
  const [availableAreas, setAvailableAreas] = useState<TeachingArea[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeachingAreas();
    }
  }, [user]);

  const fetchTeachingAreas = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRoles = (user as any)?.['https://moonriver.com/roles'] || ['educator'];
      const rolesParam = Array.isArray(userRoles) ? userRoles.join(',') : 'educator';

      const response = await fetch(
        `/api/educator-teaching-areas?userId=${encodeURIComponent(user.sub || '')}&roles=${encodeURIComponent(rolesParam)}&userEmail=${encodeURIComponent(user.email || '')}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableAreas(data.availableAreas || []);
        setSelectedAreas((data.teachingAreas || []).map((area: TeachingArea) => area.id));
      } else {
        console.error('Failed to fetch teaching areas:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teaching areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTeachingAreas = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userRoles = (user as any)?.['https://moonriver.com/roles'] || ['educator'];

      const response = await fetch('/api/educator-teaching-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.sub,
          userRoles,
          userEmail: user.email,
          teachingAreaIds: selectedAreas
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        console.error('Failed to save teaching areas:', response.status);
      }
    } catch (error) {
      console.error('Error saving teaching areas:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const getCategoryAreas = (category: string) => {
    return availableAreas.filter(area => area.category === category);
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'genre': return 'Genre';
      case 'instrument': return 'Instrument';
      case 'skill': return 'Skill';
      case 'level': return 'Level';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'genre': return '♫';
      case 'instrument': return '🎸';
      case 'skill': return '🎯';
      case 'level': return '📈';
      default: return '♫';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teaching areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-2 text-purple-600" />
              My Teaching Areas
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Select Your Teaching Areas
              </h2>
              <p className="text-gray-600 text-sm">
                Choose the areas where you have expertise and can provide instruction. This helps students find the right educator for their needs.
              </p>
            </div>

            {/* Selected Areas Summary */}
            {selectedAreas.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Selected Areas ({selectedAreas.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAreas.map(areaId => {
                    const area = availableAreas.find(a => a.id === areaId);
                    return area ? (
                      <span
                        key={areaId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {area.label}
                        <button
                          onClick={() => toggleArea(areaId)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Teaching Areas by Category */}
            <div className="space-y-6">
              {['genre', 'instrument', 'skill', 'level'].map(category => {
                const categoryAreas = getCategoryAreas(category);
                if (categoryAreas.length === 0) return null;

                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">{getCategoryIcon(category)}</span>
                      {getCategoryName(category)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categoryAreas.map(area => (
                        <button
                          key={area.id}
                          onClick={() => toggleArea(area.id)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                            selectedAreas.includes(area.id)
                              ? 'bg-purple-100 border-purple-300 text-purple-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={saveTeachingAreas}
                disabled={saving}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : saving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Teaching Areas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
