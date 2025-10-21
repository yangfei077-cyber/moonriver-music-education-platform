'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Users, Calendar, Star, Clock, DollarSign } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  price: string;
  schedule: string;
  currentStudents: number;
  maxStudents: number;
  rating: number;
  instruments: string[];
  styles: string[];
}

export default function EducatorCourses() {
  const { user, error, isLoading } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyCourses();
    }
  }, [user]);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      // Filter courses where the current user is the instructor
      const allCourses = [
        {
          id: 1,
          title: "Piano Fundamentals",
          description: "Learn basic piano techniques, scales, and simple songs",
          instructor: "Dr. Sarah Johnson",
          duration: "8 weeks",
          level: "Beginner",
          price: "$299",
          schedule: "Tuesdays & Thursdays 6:00-7:00 PM",
          currentStudents: 12,
          maxStudents: 15,
          rating: 4.9,
          instruments: ["Piano"],
          styles: ["Classical", "Pop", "Jazz"]
        },
        {
          id: 2,
          title: "Advanced Guitar Techniques",
          description: "Master advanced guitar techniques, fingerpicking, and composition",
          instructor: "Mike Chen",
          duration: "12 weeks",
          level: "Advanced",
          price: "$399",
          schedule: "Mondays & Wednesdays 7:00-8:30 PM",
          currentStudents: 8,
          maxStudents: 10,
          rating: 4.8,
          instruments: ["Guitar"],
          styles: ["Rock", "Blues", "Folk"]
        },
        {
          id: 3,
          title: "Music Theory & Composition",
          description: "Learn music theory fundamentals and composition techniques",
          instructor: "Dr. Sarah Johnson",
          duration: "10 weeks",
          level: "Intermediate",
          price: "$349",
          schedule: "Saturdays 10:00 AM-12:00 PM",
          currentStudents: 6,
          maxStudents: 12,
          rating: 4.7,
          instruments: ["Any"],
          styles: ["All genres"]
        }
      ];

      // Filter courses based on current user
      let myCourses = [];
      if (user?.email === 'educator@moonriver.com') {
        // Dr. Sarah Johnson's courses
        myCourses = allCourses.filter(course => course.instructor === "Dr. Sarah Johnson");
      } else if (user?.email === 'mike.chen@moonriver.com') {
        // Mike Chen's courses
        myCourses = allCourses.filter(course => course.instructor === "Mike Chen");
      } else if (user?.email === 'alex.rivera@moonriver.com') {
        // Alex Rivera's courses (would need to be added to the list)
        myCourses = [];
      }

      setCourses(myCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
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
    return <div className="flex justify-center items-center min-h-screen">Please log in to view courses</div>;
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
                  <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
                  My Courses
                </h1>
                <p className="text-gray-600">
                  Manage and monitor your music education courses
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
                <div className="text-sm text-gray-500">Active Courses</div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    {/* Course Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center">
                          {getRatingStars(course.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {course.rating} ({course.currentStudents} students)
                        </span>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{course.schedule}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{course.price}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{course.currentStudents}/{course.maxStudents} students</span>
                      </div>
                    </div>

                    {/* Instruments & Styles */}
                    <div className="mb-6">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Instruments</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {course.instruments.map((instrument, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {instrument}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Styles</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {course.styles.map((style, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm">
                        View Students
                      </button>
                      <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm">
                        Edit Course
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
              <p className="text-gray-600 mb-4">
                You don't have any courses assigned yet. Contact admin to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
