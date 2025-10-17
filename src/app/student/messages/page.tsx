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
  educatorId: string;
  educatorName: string;
  educatorSpecialization: string;
  lastMessage: Message;
  unreadCount: number;
  messageCount: number;
}

export default function StudentMessagesPage() {
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

  // Refresh conversations when page becomes visible (e.g., coming back from educator directory)
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
      // Get all educators to build conversation list
      const educatorsResponse = await fetch('/api/educators');
      if (educatorsResponse.ok) {
        const educatorsData = await educatorsResponse.json();
        const educators = educatorsData.educators;
        
        // Get messages for each educator
        const conversationPromises = educators.map(async (educator: any) => {
          const messagesResponse = await fetch(`/api/educators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'getMessages', 
              educatorId: educator.id 
            })
          });
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const userMessages = messagesData.messages || [];
            
            if (userMessages.length > 0) {
              const unreadCount = userMessages.filter((msg: Message) => !msg.read).length;
              const lastMessage = userMessages[userMessages.length - 1];
              
              return {
                educatorId: educator.id,
                educatorName: educator.name,
                educatorSpecialization: educator.specialization,
                lastMessage,
                unreadCount,
                messageCount: userMessages.length
              };
            }
          }
          return null;
        });
        
        const conversationResults = await Promise.all(conversationPromises);
        const validConversations = conversationResults.filter(Boolean);
        setConversations(validConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (educatorId: string) => {
    try {
      const response = await fetch(`/api/educators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getMessages', 
          educatorId 
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
    if (!selectedConversation || !replyMessage.message) {
      alert('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          educatorId: selectedConversation,
          subject: `Re: Message from ${user?.name || user?.email}`,
          message: replyMessage.message
        })
      });

      if (response.ok) {
        setReplyMessage({ message: '' });
        await fetchMessages(selectedConversation);
        await fetchConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (educatorId: string) => {
    setSelectedConversation(educatorId);
    fetchMessages(educatorId);
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
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.educatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.educatorSpecialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnread = !filterUnread || conv.unreadCount > 0;
    
    return matchesSearch && matchesUnread;
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
                  Message Inbox
                </h1>
                <p className="text-gray-600">
                  View and manage your conversations with educators
                </p>
              </div>
              <button
                onClick={fetchConversations}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                {/* Search and Filter */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="unread-only"
                      checked={filterUnread}
                      onChange={(e) => setFilterUnread(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="unread-only" className="text-sm text-gray-700">
                      Show unread only
                    </label>
                  </div>
                </div>

                {/* Conversations */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">
                        {conversations.length === 0 
                          ? 'No conversations yet. Start messaging educators!'
                          : 'No conversations match your filters.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.educatorId}
                        onClick={() => selectConversation(conversation.educatorId)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation === conversation.educatorId ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.educatorName}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              {conversation.educatorSpecialization}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {conversation.lastMessage.subject}
                            </p>
                          </div>
                          <div className="ml-2 text-right">
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(conversation.lastMessage.timestamp)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="bg-white rounded-lg shadow">
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200">
                    {(() => {
                      const conversation = conversations.find(c => c.educatorId === selectedConversation);
                      return conversation ? (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {conversation.educatorName}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {conversation.educatorSpecialization}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Messages List */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.from === user?.sub ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.from === user?.sub
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {message.from === user?.sub ? 'You' : message.fromName}
                            </span>
                            <span className="text-xs opacity-75">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          value={replyMessage.message}
                          onChange={(e) => setReplyMessage(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Type your message..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        onClick={sendReply}
                        disabled={sending || !replyMessage.message}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to view and reply to messages.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/educators"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <User className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Browse Educators</h4>
                  <p className="text-sm text-gray-600">Find and message new educators</p>
                </div>
              </Link>
              <Link
                href="/student/courses"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Mail className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">My Courses</h4>
                  <p className="text-sm text-gray-600">View your enrolled courses</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
