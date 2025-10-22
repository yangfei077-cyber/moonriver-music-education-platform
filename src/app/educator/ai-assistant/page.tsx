'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Bot, ArrowLeft, Send, MessageSquare, User, BookOpen, Users, Calendar, Clock, Target, Mail, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

export default function EducatorAIAssistant() {
  const { user, error, isLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [myStudents, setMyStudents] = useState<any[]>([]);

  // Fetch educator's students
  const fetchMyStudents = async () => {
    if (!user) return;
    
    try {
      // Demo students data - in production this would come from an API
      const allStudents = [
        {
          id: 'auth0|68f0970657a65f6a14ef94f0',
          name: 'Demo Student',
          email: 'student@moonriver.com',
          enrolledCourses: ['Piano Fundamentals', 'Music Theory & Composition'],
          interests: ['neo-soul', 'punk', 'jazz'],
          progress: '85%',
          lastLogin: '2024-01-15'
        },
        {
          id: 'student-2',
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          enrolledCourses: ['Piano Fundamentals'],
          interests: ['classical', 'piano'],
          progress: '60%',
          lastLogin: '2024-01-14'
        },
        {
          id: 'student-3',
          name: 'Bob Smith',
          email: 'bob.smith@example.com',
          enrolledCourses: ['Advanced Guitar Techniques'],
          interests: ['rock', 'blues', 'guitar'],
          progress: '45%',
          lastLogin: '2024-01-13'
        }
      ];

      // Filter students based on educator's courses
      let myStudents: any[] = [];
      if (user?.email === 'educator@moonriver.com') {
        // Dr. Sarah Johnson's students (Piano and Music Theory courses)
        myStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => 
            course === 'Piano Fundamentals' || course === 'Music Theory & Composition'
          )
        );
      } else if (user?.email === 'mike.chen@moonriver.com') {
        // Mike Chen's students (Guitar courses)
        myStudents = allStudents.filter(student => 
          student.enrolledCourses.some(course => course === 'Advanced Guitar Techniques')
        );
      }

      setMyStudents(myStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Initialize with welcome message and fetch students
  useEffect(() => {
    if (user && messages.length === 0) {
      fetchMyStudents();
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${user.name || user.email}! I'm your AI teaching assistant. I specialize in helping educators like you with:

👥 **Student Recommendations** - Get personalized suggestions for your students based on their interests and progress
📅 **Scheduling & Appointments** - Optimize lesson planning and student appointments

I can help you communicate more effectively with your students and improve their learning experience!

What would you like help with today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          userRoles: (user as any)?.['https://moonriver.com/roles'] || ['educator'],
          userInfo: {
            name: user?.name,
            email: user?.email
          },
          userStudents: myStudents, // Pass student data for context
          userId: user?.sub
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          context: data.context
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.requiresToken) {
        const tokenMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🔑 **Token Required**: ${data.message}\n\nTo continue using the AI Assistant, please:\n1. Go to the **Token Vault** (link in your dashboard)\n2. Add your **OpenRouter API Key** \n3. Name it "openrouter-api"\n4. Return here to continue chatting\n\nThis allows you to use your own API quota and ensures better service availability.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, tokenMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getQuickPrompts = () => {
    const basePrompts = [
      "Suggest lesson plan ideas for jazz piano beginners",
      "How can I motivate students who are losing interest?",
      "What should I focus on for students learning classical piano?",
      "Help me optimize my lesson scheduling"
    ];

    return basePrompts;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access the AI Assistant</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
                  <Bot className="w-8 h-8 text-purple-600 mr-3" />
                  AI Teaching Assistant
                </h1>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Powered by DeepHermes 3
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm flex flex-col h-[600px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                        {message.context && (
                          <div className="text-xs mt-1 text-gray-400">
                            {message.context}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask about student recommendations, messaging, or teaching strategies..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Quick Prompts - Now wider */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Prompts
                </h3>
                <div className="space-y-2">
                  {getQuickPrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt)}
                      className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
