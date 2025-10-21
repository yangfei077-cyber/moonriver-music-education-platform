'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Music, LogIn, UserPlus, Shield, BookOpen, Users, Star } from 'lucide-react';

export default function AuthPage() {
  const { user, isLoading } = useUser();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user && !isLoading) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFCF5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2B949] mx-auto mb-4"></div>
          <p className="text-[#1F2937] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Fredoka+One&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 flex justify-between items-center">
          <a className="text-3xl font-display text-[#1F2937]" href="/">
            <span className="logo-m text-[#F2B949]">M</span>oonriver
          </a>
          <nav className="hidden md:flex items-center space-x-8">
            <a className="hover:text-[#F2B949] transition-colors" href="#features">Features</a>
            <a className="hover:text-[#F2B949] transition-colors" href="#about">About</a>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="text-center py-20 lg:py-32">
          <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight text-[#1F2937]">
            Unlock Your<br/>Musical <span className="text-[#F2B949]">Potential</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto text-gray-600">
            Join Moonriver to learn music from the best instructors. Our fun and engaging platform features secure authentication, AI-powered learning, and personalized course recommendations.
          </p>
          
          {/* Auth Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/api/auth/register"
              className="bg-[#F2B949] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 shadow-lg transition-all flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Get Started
            </a>
            <a
              href="/api/auth/login"
              className="bg-[#F27430] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 shadow-lg transition-all flex items-center justify-center"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20" id="features">
          <h2 className="text-4xl font-bold font-display text-center mb-12 text-[#1F2937]">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <div className="p-6">
                <div className="bg-[#EDD377]/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-[#F2B949]" />
                </div>
                <h3 className="text-2xl font-bold font-display text-[#F2B949]">Secure Authentication</h3>
                <p className="mt-2 text-gray-600">Powered by Auth0, ensuring enterprise-grade security for all users with role-based access control.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <div className="p-6">
                <div className="bg-[#EDD377]/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-[#F2B949]" />
                </div>
                <h3 className="text-2xl font-bold font-display text-[#F2B949]">AI Assistant</h3>
                <p className="mt-2 text-gray-600">Get personalized recommendations and guidance with our AI-powered teaching assistant.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <div className="p-6">
                <div className="bg-[#EDD377]/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-[#F2B949]" />
                </div>
                <h3 className="text-2xl font-bold font-display text-[#F2B949]">Connect & Learn</h3>
                <p className="mt-2 text-gray-600">Connect with expert educators, message instructors, and schedule personalized lessons.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auth0 Pillars */}
        <section className="py-20 bg-[#EDD377]/20 rounded-2xl mb-20" id="about">
          <h2 className="text-4xl font-bold font-display text-center mb-12 text-[#1F2937]">Auth0 Security Pillars</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 px-6">
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Shield className="w-8 h-8 text-[#F2B949] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1F2937] mb-2">1. User Authentication</h3>
              <p className="text-gray-600 text-sm">Secure the human prompting the agent</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Shield className="w-8 h-8 text-[#F2B949] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1F2937] mb-2">2. Token Vault</h3>
              <p className="text-gray-600 text-sm">Control tools & API access</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Shield className="w-8 h-8 text-[#F2B949] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1F2937] mb-2">3. Fine-Grained Auth</h3>
              <p className="text-gray-600 text-sm">Limit knowledge & RAG access</p>
            </div>
          </div>
        </section>

        {/* Demo Accounts */}
        <section className="py-12 bg-white rounded-2xl shadow-sm mb-20">
          <h3 className="text-2xl font-bold font-display text-center mb-6 text-[#1F2937]">Try Demo Accounts</h3>
          <div className="grid md:grid-cols-3 gap-6 px-6">
            <div className="text-center">
              <div className="bg-[#EDD377]/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-[#F2B949]" />
              </div>
              <p className="font-semibold text-[#1F2937]">Student</p>
              <p className="text-gray-600 text-sm mt-1">student@moonriver.com</p>
              <div className="flex justify-center text-[#F2B949] mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="bg-[#EDD377]/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-[#F2B949]" />
              </div>
              <p className="font-semibold text-[#1F2937]">Educator</p>
              <p className="text-gray-600 text-sm mt-1">educator@moonriver.com</p>
              <div className="flex justify-center text-[#F2B949] mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="bg-[#EDD377]/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-[#F2B949]" />
              </div>
              <p className="font-semibold text-[#1F2937]">Admin</p>
              <p className="text-gray-600 text-sm mt-1">admin@moonriver.com</p>
              <div className="flex justify-center text-[#F2B949] mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-gray-200">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <a className="text-3xl font-display text-[#1F2937]" href="/">
                <span className="logo-m text-[#F2B949]">M</span>oonriver
              </a>
              <p className="mt-4 text-gray-600">Your journey to musical mastery starts here.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-[#1F2937]">Quick Links</h4>
              <ul className="mt-4 space-y-2">
                <li><a className="hover:text-[#F2B949] transition-colors text-gray-600" href="#features">Features</a></li>
                <li><a className="hover:text-[#F2B949] transition-colors text-gray-600" href="#about">About</a></li>
                <li><a className="hover:text-[#F2B949] transition-colors text-gray-600" href="/api/auth/login">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-[#1F2937]">Connect With Us</h4>
              <p className="mt-4 text-gray-600">Secure music education platform with Auth0 authentication.</p>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © 2024 Moonriver Music Education Platform. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}