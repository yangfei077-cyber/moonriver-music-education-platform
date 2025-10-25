'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Bot } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';

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

export default function HomePage() {
  const { user, error, isLoading } = useUser();
  const { roles, isAdmin, isEducator, isStudent, loadingRoles, displayName, setDisplayName } = useUserContext();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [teachingAreas, setTeachingAreas] = useState<TeachingArea[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [loadingTeachingAreas, setLoadingTeachingAreas] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  // Fetch user data when user is available
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch additional data based on user roles
  useEffect(() => {
    if (user && !loadingRoles) {
      if (isStudent) {
        fetchInterests();
        fetchEnrolledCourses();
      }
      if (isEducator) {
        fetchTeachingAreas();
      }
    }
  }, [user, isStudent, isEducator, loadingRoles]);


  const fetchUserProfile = async () => {
    if (!user) return;
    
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
    }
  };

  // Fetch user interests
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

  // Fetch teaching areas
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

  // Fetch enrolled courses
  const fetchEnrolledCourses = async () => {
    if (!user) return;
    
    setLoadingCourses(true);
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      if (data.success) {
        // Filter only enrolled courses
        const enrolled = data.courses.filter((course: any) => course.isEnrolled);
        setEnrolledCourses(enrolled);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoadingCourses(false);
    }
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

  if (error && error.message !== 'Unauthorized') {
    return (
      <div className="min-h-screen bg-[#FFFCF5] flex justify-center items-center">
        <div className="text-center">
          <p className="text-[#F27430] text-lg">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show landing page for unauthenticated users
    return (
      <div className="bg-background-light dark:bg-background-dark font-body text-text-light dark:text-text-dark transition-colors duration-300">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Fredoka+One&display=swap');
          @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
          .font-display {
            font-family: 'Fredoka One', cursive;
          }
          .font-body {
            font-family: 'Poppins', sans-serif;
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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="py-6 flex justify-between items-center">
            <a className="text-3xl font-display text-text-light dark:text-text-dark" href="#">
              <span className="logo-m text-primary">M</span>oonriver
            </a>
            <nav className="hidden md:flex items-center space-x-8">
              <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#courses">Courses</a>
              <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#testimonials">Testimonials</a>
              <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#about">About</a>
            </nav>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="bg-mango-orange text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all"
            >
              Get Started
            </button>
          </header>

          {/* Hero Section */}
          <section className="text-center py-20 lg:py-32">
            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight text-text-light dark:text-text-dark">
              Unlock Your<br/>Musical <span className="text-primary">Potential</span>
            </h1>
            <p className="mt-6 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Join Moonriver to learn music from the best instructors. Our fun and engaging courses are designed for all ages and skill levels.
            </p>
            <div className="mt-10">
              <button 
                onClick={() => window.location.href = '/auth/login'}
                className="bg-primary text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 shadow-lg transition-all"
              >
                Explore Courses
              </button>
            </div>
          </section>

          {/* Courses Section */}
          <section className="py-20" id="courses">
            <h2 className="text-4xl font-bold font-display text-center mb-12 text-text-light dark:text-text-dark">Our Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Guitar Lessons */}
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                <img 
                  alt="A person playing a guitar." 
                  className="w-full h-56 object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL1zUbxXexbyiKXIWpU4av2YB7H8OAybbWCI9pvAza-Sytevf4NWm-PsvhazlNKq8GINFVBGV3jLKCyg8HfWQRbr_dsF7DvzMxByTddGvJAC-tOmb4Kz8jLj9tkiUS5x3tmtKh9ozjBFoEhCM1SfadNm9OBUzpc-f7KBgjns_lXvu0d5qTAf4wuONdUP77nvtMXBPQtbF5ugRvnBLTIN_lTiNMygWsuchSs3Fy8NIna6Tl-Zf4lmiXsux6YBq0bgNnREvUchivS8yA"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold font-display text-primary">Guitar Lessons</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">From acoustic to electric, master the strings with our comprehensive guitar curriculum.</p>
                  <button className="mt-4 bg-mango-light text-text-light font-semibold px-4 py-2 rounded-full hover:bg-opacity-90 transition-all">Learn More</button>
                </div>
              </div>

              {/* Piano & Keyboard */}
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                <img 
                  alt="A grand piano in a sunlit room." 
                  className="w-full h-56 object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhcZbFo5Pfm5dmXhh_K2ko0aoqjMiveFmWM4Q0ctwoUVH5rrsGWIKHh7GKSOunheuorBcx8BDN0gAIqm3tImfOKKaUxnfrrL0sy98Q90bGsVdHsZ-I2mKczHf6iN4LiUWibp7H9U7YSnlq1hHZYiOWDGBuLz1g5V0KZsv5jmKWE2UKKaV_mX4KbYtbJkMmwYKnTgkbJcvVXYgjkCBTvtZ4oykEgQPpu9lOIgHBkeTpKBP2ZHCW8Dp4mh3M5fNFYFbHpJ2x7GznUMBY"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold font-display text-primary">Piano & Keyboard</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Unlock the world of melodies and harmonies on the piano, from classical to pop.</p>
                  <button className="mt-4 bg-mango-light text-text-light font-semibold px-4 py-2 rounded-full hover:bg-opacity-90 transition-all">Learn More</button>
                </div>
              </div>

              {/* Vocal Training */}
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                <img 
                  alt="A person singing into a microphone." 
                  className="w-full h-56 object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe6ArUgKe0V_FUjQm4_dKDfwcRYcklCzp_xcNA8ApXFpZzF4Ws8pMzILNCGfg181aweO8FDDZ2VNgavOryrECa0akaZPxHVsR78BWFsE9s_kItcjapyU1u_lTUxStg8K7PPHtWYoYV7NipOFmh20DEDwTwON0KEZ7Glx3-naC4j0K5OVg1e4xquRUpcYYQwr9-OMXwEJCQqNA4HKgGnv5q7xYO-Bm4IjMJDPh-j9TTM4CzfB8h6B2T3KI-EAs654QpdfFiGTZXMS9n"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold font-display text-primary">Vocal Training</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Find your voice and sing with confidence with our expert vocal coaching.</p>
                  <button className="mt-4 bg-mango-light text-text-light font-semibold px-4 py-2 rounded-full hover:bg-opacity-90 transition-all">Learn More</button>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 bg-mango-light/20 dark:bg-card-dark/50 rounded-lg" id="testimonials">
            <h2 className="text-4xl font-bold font-display text-center mb-12 text-text-light dark:text-text-dark">What Our Students Say</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Sarah L. Testimonial */}
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <img 
                    alt="Portrait of Sarah L." 
                    className="w-12 h-12 rounded-full object-cover mr-4" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAangbT8VT5c_SeI43kEGkFB_U1ra4I-6EBmFBMkJ47RGY0sDNHfT9pvl3GOvKAQMxVSP3MJr-JDovm6WkWT2fuqcPqh4kg02Q8bUtPzysgG_Ea1JNPIMYVXKxun7rEi0Xne00h84LB9t1e4b56qbs73-TSGZGK92IV9HdwlCdsZKRC2DzgcSeclwoHEEq2s6hNtH-_BlfN0NOl5P4RoHgIJhyKUyM4pkaVC43JaJneHBoTh-iEF5zy63pF2_iONHEJR5LNbSdVPYh"
                  />
                  <div>
                    <p className="font-semibold text-text-light dark:text-text-dark">Sarah L.</p>
                    <div className="flex text-primary">
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">"Moonriver has completely changed my approach to music. The instructors are patient and incredibly knowledgeable. I've progressed more in 6 months than I did in years of self-teaching!"</p>
              </div>

              {/* Mike R. Testimonial */}
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <img 
                    alt="Portrait of Mike R." 
                    className="w-12 h-12 rounded-full object-cover mr-4" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7slwmOCreL5hKSYbyAvziZL28ji4C9ixVzSNXZJ6TkH_DB471Ay6wU7H5X_Heu7398gLPH84myaYhSqq1NbqsPvl5M4rZ-RMv-kF6Ar_Pm0Suo6NzCDPvUAC5U9VIO9PT8bcGBKqcRFetkyj0VK8yj_uPJHSnvr__qS9RHQlGNvUUg-OihDrKE5xkImv73VH4ZUzQmd-USFRgDNZ3_5Y4Q4uJzxc72Zj1C1_e4kzXaIX_YSwcDqSO4_IgfrhcfQEYdDa8fEAUXPXJ"
                  />
                  <div>
                    <p className="font-semibold text-text-light dark:text-text-dark">Mike R.</p>
                    <div className="flex text-primary">
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star</i>
                      <i className="material-icons text-sm">star_half</i>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">"The flexibility of the online courses is fantastic. I can learn piano around my busy work schedule. Highly recommend it to any adult looking to pick up a new skill."</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-16 mt-20 border-t border-gray-200 dark:border-gray-700" id="about">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <a className="text-3xl font-display text-text-light dark:text-text-dark" href="#">
                  <span className="logo-m text-primary">M</span>oonriver
                </a>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Your journey to musical mastery starts here.</p>
              </div>
              <div>
                <h4 className="font-semibold text-lg text-text-light dark:text-text-dark">Quick Links</h4>
                <ul className="mt-4 space-y-2">
                  <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#courses">Courses</a></li>
                  <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Pricing</a></li>
                  <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg text-text-light dark:text-text-dark">Connect With Us</h4>
                <div className="flex space-x-4 mt-4 text-gray-600 dark:text-gray-300">
                  <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                  <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 7a5 5 0 100 10 5 5 0 000-10zm0-2a7 7 0 110 14 7 7 0 010-14zm6.406-2a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fillRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              © 2025 Moonriver Music. All rights reserved.
          </div>
          </footer>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background-light">
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
            <a className="text-3xl font-display mb-12 block" href="/">
              <span className="logo-m text-dash-primary">M</span><span className="text-text-light">oonriver</span>
            </a>
            <nav className="space-y-4">
              <a className="flex items-center space-x-3 text-dash-primary bg-dash-secondary/20 px-4 py-2 rounded-lg font-semibold" href="/">
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </a>
              {isStudent && (
                <>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/student/courses">
                    <span className="material-symbols-outlined">music_note</span>
                    <span>My Courses</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/student/appointments">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span>Schedule</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/educators">
                    <span className="material-symbols-outlined">person</span>
                    <span>Instructors</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/ai-assistant">
                    <Bot className="w-5 h-5" />
                    <span>AI Assistant</span>
                  </Link>
                </>
              )}
              {isEducator && (
                <>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/educator/courses">
                    <span className="material-symbols-outlined">music_note</span>
                    <span>My Courses</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/appointments">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span>My Schedule</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/educator/students">
                    <span className="material-symbols-outlined">person</span>
                    <span>My Students</span>
                  </Link>
                  <Link className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors" href="/educator/ai-assistant">
                    <Bot className="w-5 h-5" />
                    <span>AI Teaching Assistant</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-text-light/70 hover:text-dash-primary hover:bg-dash-secondary/20 px-4 py-2 rounded-lg transition-colors w-full"
            >
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
              <h1 className="text-3xl font-bold text-text-light">Welcome Back, {displayName || user?.name || user?.email}!</h1>
              <p className="text-[rgb(146,64,14)]">Let's make some music today.</p>
              <div className="flex space-x-2 mt-2">
                {isAdmin && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">ADMIN</span>}
                {isEducator && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">EDUCATOR</span>}
                {isStudent && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">STUDENT</span>}
              </div>
              </div>
            <div className="flex items-center space-x-4">
              <span className="material-symbols-outlined text-[#555555] text-2xl cursor-pointer">notifications</span>
              <Link href="/profile" className="w-12 h-12 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-semibold hover:bg-[#E76F51] transition-colors cursor-pointer overflow-hidden">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Link>
              </div>
          </header>

          <div className="space-y-6">
            {/* Main Content */}
              
              {/* My Courses Section */}
              <section id="my-courses">
                <h2 className="text-2xl font-bold font-display text-[#333333] mb-6">My Courses</h2>
                {loadingCourses ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C4A]"></div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="bg-[#FDF8F0] rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                        <img 
                          alt={course.title} 
                          className="w-full h-48 object-cover" 
                          src={course.image || "https://images.unsplash.com/photo-1493225457124-a3eb60212f5f?w=400&h=300&fit=crop"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop";
                          }}
                        />
                        <div className="p-6">
                          <h3 className="text-xl font-bold font-display text-[#F28C4A]">{course.title}</h3>
                          <p className="mt-2 text-sm text-[#555555]">with {course.instructor}</p>
                          <div className="w-full bg-[#FDE2B3] rounded-full h-2.5 mt-4">
                            <div 
                              className="bg-[#F28C4A] h-2.5 rounded-full" 
                              style={{width: `${course.progress || 0}%`}}
                            ></div>
                          </div>
                          <p className="text-right text-sm mt-1 text-[#555555]">
                            {course.progress || 0}% Complete
                          </p>
                          <button className="mt-4 w-full bg-[#F28C4A] text-white font-semibold py-2 rounded-lg hover:bg-[#E76F51] transition-all">Continue Lesson</button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-[#FDE2B3]/20 border-2 border-dashed border-[#F28C4A] rounded-lg p-8 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-transform duration-300">
                      <div className="text-6xl text-[#F28C4A] mb-4">+</div>
                      <h3 className="text-xl font-bold font-display text-[#F28C4A]">Explore New Courses</h3>
                    </div>
                  </div>
                )}
              </section>

              {/* Progress Tracker Section */}
              <section id="progress-tracker">
                <h2 className="text-2xl font-bold font-display text-[#333333] mb-6">Progress Tracker</h2>
                <div className="bg-[#FDF8F0] rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-[#333333] mb-4">Weekly Practice Hours</h3>
                  <div className="flex space-x-4 mb-6">
                    <button className="px-4 py-2 bg-[#F28C4A] text-white rounded-lg font-semibold">This Week</button>
                    <button className="px-4 py-2 text-[#555555] hover:bg-[#FDE2B3] rounded-lg">Last Week</button>
                  </div>
                  <div className="h-32 bg-[#FDE2B3]/20 rounded-lg flex items-center justify-center">
                    <p className="text-[#555555]">Chart placeholder</p>
                  </div>
                </div>
              </section>

              {/* Announcements Section */}
              <section id="announcements">
                <h2 className="text-2xl font-bold font-display text-[#333333] mb-6">Announcements</h2>
                <div className="bg-[#FDF8F0] rounded-lg shadow-md p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">🎉</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#333333]">New Course Available!</h3>
                      <p className="text-[#555555] mt-1">Check out our latest course: "Music Theory in 30 Days"</p>
                </div>
              </div>
            </div>
              </section>
          </div>

        </main>
        </div>
    </div>
  );
}