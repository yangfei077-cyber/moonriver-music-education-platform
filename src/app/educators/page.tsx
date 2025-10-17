'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Users, MessageSquare, Star, MapPin, Globe, Filter, Search, Send, Mail, ArrowLeft } from 'lucide-react';

interface Educator {
  id: string;
  name: string;
  email: string;
  title: string;
  specialization: string;
  bio: string;
  experience: string;
  education: string;
  courses: string[];
  rating: number;
  students: number;
  avatar: string;
  availability: string;
  languages: string[];
  instruments: string[];
  styles: string[];
  location: string;
}

export default function EducatorDirectoryPage() {
  const { user, isLoading } = useUser();
  const [educators, setEducators] = useState<Educator[]>([]);
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageData, setMessageData] = useState({
    message: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filters, setFilters] = useState<{
    specialization: string;
    search: string;
  }>({
    specialization: '',
    search: ''
  });
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const [allEducators, setAllEducators] = useState<Educator[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchEducators();
    }
  }, [user]);

  useEffect(() => {
    // Only debounce if we have educators loaded and search is not empty
    if (allEducators.length > 0 && filters.search.trim()) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        applyFilters();
      }, 300); // 300ms debounce

      setSearchTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else if (allEducators.length > 0) {
      // If no search term, apply filters immediately
      applyFilters();
    }
  }, [filters.search, allEducators.length]);

  useEffect(() => {
    // Apply filters immediately for specialization changes
    if (allEducators.length > 0) {
      applyFilters();
    }
  }, [filters.specialization, allEducators]);

  const fetchEducators = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/educators');
      if (response.ok) {
        const data = await response.json();
        setAllEducators(data.educators || []);
        setAvailableSpecializations(data.specializations || []);
        applyFilters();
      } else {
        console.error('Failed to fetch educators:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching educators:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Don't apply filters if we don't have educators yet
    if (allEducators.length === 0) {
      setEducators([]);
      return;
    }

    // If no filters are applied, show all educators
    if (!filters.search.trim() && (!filters.specialization || filters.specialization === '')) {
      setEducators([...allEducators]);
      return;
    }

    let filteredEducators = [...allEducators];

    // Apply specialization filter
    if (filters.specialization && filters.specialization !== '') {
      filteredEducators = filteredEducators.filter((educator: Educator) =>
        educator.specialization.toLowerCase().includes(filters.specialization.toLowerCase())
      );
    }

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredEducators = filteredEducators.filter((educator: Educator) =>
        educator.name.toLowerCase().includes(searchTerm) ||
        educator.specialization.toLowerCase().includes(searchTerm) ||
        educator.bio.toLowerCase().includes(searchTerm) ||
        educator.instruments.some(instrument => instrument.toLowerCase().includes(searchTerm)) ||
        educator.styles.some(style => style.toLowerCase().includes(searchTerm))
      );
    }

    setEducators(filteredEducators);
  };

  const sendMessage = async () => {
    if (!selectedEducator || !messageData.message) {
      alert('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          educatorId: selectedEducator.id,
          subject: `Message from ${user?.name || user?.email}`,
          message: messageData.message
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Message sent successfully!');
        setShowMessageModal(false);
        setMessageData({ message: '' });
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessageModal = (educator: Educator) => {
    setSelectedEducator(educator);
    setShowMessageModal(true);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view educators</div>;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Users className="w-8 h-8 text-purple-600 mr-3" />
                  Educator Directory
                </h1>
                <p className="text-gray-600">
                  Connect with experienced music educators and send them messages
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilters({ search: '', specialization: '' });
                    setTimeout(() => applyFilters(), 100);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  Show All
                </button>
                <button
                  onClick={fetchEducators}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                >
                  <Search className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Educators
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search educators..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Specialization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Specializations</option>
                  {availableSpecializations.map(specialization => (
                    <option key={specialization} value={specialization}>{specialization}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ specialization: '', search: '' })}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Educator Grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {educators.map((educator) => (
              <div key={educator.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Educator Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {educator.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{educator.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{educator.title}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {getRatingStars(educator.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {educator.rating} ({educator.students} students)
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{educator.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Educator Details */}
                <div className="p-6">
                  {/* Specialization */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Specialization</h4>
                    <p className="text-sm text-gray-600">{educator.specialization}</p>
                  </div>

                  {/* Bio */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">About</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{educator.bio}</p>
                  </div>

                  {/* Instruments */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Instruments</h4>
                    <div className="flex flex-wrap gap-1">
                      {educator.instruments.map((instrument, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Styles */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Styles</h4>
                    <div className="flex flex-wrap gap-1">
                      {educator.styles.map((style, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Courses</h4>
                    <div className="flex flex-wrap gap-1">
                      {educator.courses.map((course, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message Button */}
                  <button
                    onClick={() => openMessageModal(educator)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No Educators Message */}
          {educators.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Educators Found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or check back later.
              </p>
              <button
                onClick={() => setFilters({ specialization: '', search: '' })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedEducator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Message to {selectedEducator.name}
                </h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !messageData.message}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
