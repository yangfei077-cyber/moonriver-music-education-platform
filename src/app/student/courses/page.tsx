'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { BookOpen, Clock, User, CheckCircle, Circle, Calendar, ArrowLeft, Play, FileText, Trophy } from 'lucide-react';

interface Course {
  id: number;
  title: string;
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
  isEnrolled: boolean;
  canEnroll: boolean;
  progress: number;
}

export default function StudentCoursesPage() {
  const { user, isLoading } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (data.success) {
        // Filter only enrolled courses
        const enrolledCourses = data.courses.filter((course: Course) => course.isEnrolled);
        setCourses(enrolledCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your courses</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB]">
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
              <Link className="flex items-center space-x-3 text-[#F28C4A] bg-[#FFF0E6] px-4 py-2 rounded-lg font-semibold" href="/student/courses">
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
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/profile">
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </Link>
            </nav>
          </div>
          <div>
            <button className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors w-full">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold font-display text-[#F28C4A]">My Courses</h1>
              <p className="text-[#333333]">Your musical journey continues here.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="material-symbols-outlined text-[#555555] text-2xl cursor-pointer">notifications</span>
              <Link href="/profile" className="w-12 h-12 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-semibold hover:bg-[#E76F51] transition-colors cursor-pointer overflow-hidden">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Link>
            </div>
          </header>

          {/* Course Cards */}
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold font-display text-[#333333] mb-2">No Enrolled Courses</h3>
                <p className="text-[#666666] mb-6">You haven't enrolled in any courses yet. Start your musical journey today!</p>
                <Link 
                  href="/courses" 
                  className="inline-flex items-center bg-[#F28C4A] text-white px-6 py-3 rounded-lg hover:bg-[#E76F51] transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex">
                  {/* Course Image */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={course.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop";
                      }}
                    />
                  </div>
                  
                  {/* Course Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold font-display text-[#F28C4A] mb-1">{course.title}</h3>
                        <p className="text-[#333333] text-sm">with {course.instructor}</p>
                        <p className="text-[#666666] text-xs mt-1">{course.level} • {course.duration}</p>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[#333333] font-medium">Progress</span>
                        <span className="text-sm text-[#F28C4A] font-bold">{course.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-[#FDE2B3] rounded-full h-2">
                        <div 
                          className="bg-[#F28C4A] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex items-center text-sm text-[#333333] mb-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Schedule: {course.schedule}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col justify-center p-6 space-y-3">
                    <button className="flex items-center justify-center bg-[#F28C4A] text-white px-6 py-2 rounded-lg hover:bg-[#E76F51] transition-colors">
                      <Play className="w-4 h-4 mr-2" />
                      Continue Course
                    </button>
                    <button className="flex items-center justify-center bg-[#FFF0E6] text-[#333333] px-6 py-2 rounded-lg hover:bg-[#FDE2B3] transition-colors">
                      <FileText className="w-4 h-4 mr-2" />
                      Materials
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}