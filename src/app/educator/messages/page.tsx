'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Send, Reply, Trash2, Mail, Clock, User, Search, Filter, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastMessage: Message;
  unreadCount: number;
  messageCount: number;
}

export default function EducatorMessagesPage() {
  const { user, isLoading } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyMessage, setReplyMessage] = useState({ message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Refresh conversations when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Get demo students to build conversation list
      const demoStudents = [
        {
          id: 'auth0|68f0970657a65f6a14ef94f0',
          name: 'Demo Student',
          email: 'student@moonriver.com'
        },
        {
          id: 'student-2',
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com'
        },
        {
          id: 'student-3',
          name: 'Bob Smith',
          email: 'bob.smith@example.com'
        },
        {
          id: 'student-4',
          name: 'Carol Davis',
          email: 'carol.davis@example.com'
        },
        {
          id: 'student-5',
          name: 'David Wilson',
          email: 'david.wilson@example.com'
        },
        {
          id: 'student-6',
          name: 'Emma Thompson',
          email: 'emma.thompson@example.com'
        },
        {
          id: 'student-7',
          name: 'Frank Rodriguez',
          email: 'frank.rodriguez@example.com'
        },
        {
          id: 'student-8',
          name: 'Grace Lee',
          email: 'grace.lee@example.com'
        },
        {
          id: 'student-9',
          name: 'Henry Chen',
          email: 'henry.chen@example.com'
        },
        {
          id: 'student-10',
          name: 'Isabella Martinez',
          email: 'isabella.martinez@example.com'
        },
        {
          id: 'student-11',
          name: 'James Anderson',
          email: 'james.anderson@example.com'
        },
        {
          id: 'student-12',
          name: 'Katherine Park',
          email: 'katherine.park@example.com'
        },
        {
          id: 'student-13',
          name: 'Liam O\'Connor',
          email: 'liam.oconnor@example.com'
        },
        {
          id: 'student-14',
          name: 'Maya Patel',
          email: 'maya.patel@example.com'
        },
        {
          id: 'student-15',
          name: 'Nathan Taylor',
          email: 'nathan.taylor@example.com'
        }
      ];

      // Filter students based on educator's courses (same logic as students page)
      let myStudents: typeof demoStudents = [];
      if (user?.email === 'educator@moonriver.com') {
        // Dr. Sarah Johnson's students (Piano, Music Theory, Jazz Piano, Songwriting courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'student@moonriver.com' || 
          student.email === 'alice.johnson@example.com' ||
          student.email === 'carol.davis@example.com' ||
          student.email === 'grace.lee@example.com' ||
          student.email === 'isabella.martinez@example.com' ||
          student.email === 'maya.patel@example.com' ||
          student.email === 'katherine.park@example.com'
        );
      } else if (user?.email === 'mike.chen@moonriver.com') {
        // Mike Chen's students (Guitar courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'bob.smith@example.com' ||
          student.email === 'grace.lee@example.com' ||
          student.email === 'liam.oconnor@example.com' ||
          student.email === 'isabella.martinez@example.com'
        );
      } else if (user?.email === 'elena@moonriver.com') {
        // Elena Petrov's students (Violin courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'david.wilson@example.com' ||
          student.email === 'katherine.park@example.com'
        );
      } else if (user?.email === 'sarah@moonriver.com') {
        // Sarah Williams' students (Vocal courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'emma.thompson@example.com' ||
          student.email === 'maya.patel@example.com'
        );
      } else if (user?.email === 'alex@moonriver.com') {
        // Alex Rivera's students (Production courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'frank.rodriguez@example.com' ||
          student.email === 'henry.chen@example.com' ||
          student.email === 'nathan.taylor@example.com'
        );
      } else if (user?.email === 'tommy@moonriver.com') {
        // Tommy Rodriguez's students (Drum courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'frank.rodriguez@example.com' ||
          student.email === 'nathan.taylor@example.com'
        );
      } else if (user?.email === 'david@moonriver.com') {
        // David Kim's students (Business courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'james.anderson@example.com'
        );
      } else if (user?.email === 'priya@moonriver.com') {
        // Priya Sharma's students (World Music courses)
        myStudents = demoStudents.filter(student => 
          student.email === 'james.anderson@example.com'
        );
      }

      // Get messages for each student
      const conversationPromises = myStudents.map(async (student) => {
        const messagesResponse = await fetch(`/api/educators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'getMessages', 
            educatorId: user?.email, // Use email for demo purposes
            studentId: student.id 
          })
        });
        
        console.log('Fetching messages for educator-student pair:', {
          educatorId: user?.email,
          educatorSub: user?.sub,
          studentId: student.id,
          studentEmail: student.email
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const userMessages = messagesData.messages || [];
          
          if (userMessages.length > 0) {
            const unreadCount = userMessages.filter((msg: Message) => !msg.read && msg.from !== user?.sub).length;
            const lastMessage = userMessages[userMessages.length - 1];
            
            return {
              studentId: student.id,
              studentName: student.name,
              studentEmail: student.email,
              lastMessage,
              unreadCount,
              messageCount: userMessages.length
            };
          }
        }
        return null;
      });
      
      const conversationResults = await Promise.all(conversationPromises);
      const validConversations = conversationResults.filter((conv): conv is Conversation => conv !== null);
      
      setConversations(validConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (studentId: string) => {
    try {
      const response = await fetch('/api/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getMessages',
          educatorId: user?.sub,
          studentId: studentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedConversation || !replyMessage.message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessageToStudent',
          studentId: selectedConversation,
          subject: `Reply from ${user?.name || user?.email}`,
          message: replyMessage.message.trim()
        })
      });

      if (response.ok) {
        setReplyMessage({ message: '' });
        // Refresh messages
        fetchMessages(selectedConversation);
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        const errorData = await response.json();
        alert(`Failed to send reply: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleConversationClick = (studentId: string) => {
    setSelectedConversation(studentId);
    fetchMessages(studentId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterUnread || conv.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  if (isLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view messages</div>;
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
                  <MessageSquare className="w-8 h-8 text-purple-600 mr-3" />
                  Messages
                </h1>
                <p className="text-gray-600">
                  Communicate with your students
                </p>
              </div>
              <button
                onClick={fetchConversations}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setFilterUnread(!filterUnread)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm ${
                        filterUnread 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      Unread Only
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.studentId}
                        onClick={() => handleConversationClick(conversation.studentId)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.studentId ? 'bg-purple-50 border-r-4 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {conversation.studentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.studentName}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(conversation.lastMessage.timestamp)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-1">
                              {conversation.lastMessage.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conversation.studentEmail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                      <p className="text-gray-600">
                        {searchTerm || filterUnread 
                          ? 'No conversations match your filters.' 
                          : 'Start a conversation with your students.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="bg-white rounded-lg shadow-sm flex flex-col h-[600px]">
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {conversations.find(c => c.studentId === selectedConversation)?.studentName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {conversations.find(c => c.studentId === selectedConversation)?.studentName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {conversations.find(c => c.studentId === selectedConversation)?.studentEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.from === user?.sub ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.from === user?.sub
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.from === user?.sub ? 'text-purple-200' : 'text-gray-500'
                            }`}>
                              {formatTimestamp(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-600">Start the conversation below!</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={replyMessage.message}
                        onChange={(e) => setReplyMessage({ message: e.target.value })}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                      <button
                        onClick={sendReply}
                        disabled={!replyMessage.message.trim() || sending}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {sending ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a student from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
