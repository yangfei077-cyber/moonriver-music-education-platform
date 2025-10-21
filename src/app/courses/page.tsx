'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { BookOpen, Clock, Users, DollarSign, Calendar, User, Filter, Search, Star, CheckCircle, ArrowLeft } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  instructorEmail: string;
  level: string;
  duration: string;
  maxStudents: number;
  currentStudents: number;
  price: string;
  schedule: string;
  startDate: string;
  endDate: string;
  topics: string[];
  prerequisites: string;
  image: string;
  isEnrolled?: boolean;
  canEnroll?: boolean;
}

export default function CourseCatalogPage() {
  const { user, isLoading } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [filters, setFilters] = useState<{
    level: string;
    instructor: string;
    search: string;
  }>({
    level: '',
    instructor: '',
    search: ''
  });
  const [availableFilters, setAvailableFilters] = useState<{
    levels: string[];
    instructors: string[];
  }>({
    levels: [],
    instructors: []
  });
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    // Only debounce if we have courses loaded and search is not empty
    if (allCourses.length > 0 && filters.search.trim()) {
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
    } else if (allCourses.length > 0) {
      // If no search term, apply filters immediately
      applyFilters();
    }
  }, [filters.search, allCourses.length]);

  useEffect(() => {
    // Apply filters immediately for level and instructor changes
    if (allCourses.length > 0) {
      applyFilters();
    }
  }, [filters.level, filters.instructor]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.instructor) params.append('instructor', filters.instructor);

      const response = await fetch(`/api/courses?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Courses API response:', data); // Debug log
        setAllCourses(data.courses);
        setAvailableFilters(data.filters);
        // Set courses directly with fetched data, then apply search filter
        let filteredCourses = data.courses;
        if (filters.search.trim()) {
          const searchTerm = filters.search.toLowerCase().trim();
          filteredCourses = filteredCourses.filter((course: Course) =>
            course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm) ||
            course.instructor.toLowerCase().includes(searchTerm) ||
            course.topics.some(topic => topic.toLowerCase().includes(searchTerm))
          );
        }
        setCourses(filteredCourses);
      } else {
        console.error('Failed to fetch courses:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredCourses = [...allCourses];

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredCourses = filteredCourses.filter((course: Course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructor.toLowerCase().includes(searchTerm) ||
        course.topics.some(topic => topic.toLowerCase().includes(searchTerm))
      );
    }

    setCourses(filteredCourses);
  };

  const enrollInCourse = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', courseId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update course in the list
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, isEnrolled: true, canEnroll: false, currentStudents: course.currentStudents + 1 }
            : course
        ));
      } else {
        alert(data.error || 'Failed to enroll in course');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const unenrollFromCourse = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unenroll', courseId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update course in the list
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, isEnrolled: false, canEnroll: true, currentStudents: course.currentStudents - 1 }
            : course
        ));
      } else {
        alert(data.error || 'Failed to unenroll from course');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view courses</div>;
  }

  console.log('Course page state:', { 
    user: user?.email, 
    allCourses: allCourses.length, 
    courses: courses.length, 
    loading 
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
              Course Catalog
            </h1>
            <p className="text-gray-600">
              Browse and enroll in music education courses
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Courses
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4">
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
                    placeholder="Search courses..."
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

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Levels</option>
                  {availableFilters.levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Instructor Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Instructor
                </label>
                <select
                  value={filters.instructor}
                  onChange={(e) => setFilters(prev => ({ ...prev, instructor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Instructors</option>
                  {availableFilters.instructors.map(instructor => (
                    <option key={instructor} value={instructor}>{instructor}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ level: '', instructor: '', search: '' })}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Course Image */}
                <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white opacity-50" />
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    <span>{course.instructor}</span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{course.currentStudents}/{course.maxStudents} students</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{course.price}</span>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Topics Covered:</h4>
                    <div className="flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* No Courses Message */}
          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or check back later for new courses.
              </p>
              <button
                onClick={() => setFilters({ level: '', instructor: '', search: '' })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}