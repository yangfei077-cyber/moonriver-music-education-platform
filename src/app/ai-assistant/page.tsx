'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Bot, ArrowLeft, Send, MessageSquare, User, BookOpen, Users, Settings, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

export default function AIAssistant() {
  const { user, error, isLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  // Fetch user interests
  const fetchUserInterests = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/student-interests?userId=${encodeURIComponent(user.sub || '')}&roles=${encodeURIComponent((user as any)?.['https://moonriver.com/roles']?.join(',') || 'student')}`);
      if (response.ok) {
        const data = await response.json();
        const interests = (data.interests || []).map((interest: any) => interest.label);
        setUserInterests(interests);
      }
    } catch (error) {
      console.error('Error fetching user interests:', error);
    }
  };

  // Initialize with welcome message and fetch interests
  useEffect(() => {
    if (user && messages.length === 0) {
      fetchUserInterests();
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${user.name || user.email}! I'm your AI music education assistant. I can help you with:

🎵 **Course Information** - Learn about available courses and instructors
👨‍🏫 **Educator Recommendations** - Find the perfect teacher for your needs
📅 **Scheduling** - Information about classes and appointments

I can also provide personalized recommendations based on your music interests! 

What would you like to know about music education at MoonRiver?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

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
          userRoles: user?.['https://moonriver.com/roles'] || ['student'],
          userInfo: {
            name: user?.name,
            email: user?.email
          },
          userInterests: userInterests
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getQuickPrompts = () => {
    const prompts = [
      "What courses are available?",
      "Who are the best instructors for beginners?",
      "How do I schedule a lesson?",
      "What should I practice daily?",
      "Tell me about music theory basics"
    ];
    
    // Add personalized prompts if user has interests
    if (userInterests.length > 0) {
      prompts.unshift(
        `Recommend courses based on my interests (${userInterests.slice(0, 2).join(', ')})`,
        `Which educators match my interests (${userInterests.slice(0, 2).join(', ')})?`
      );
    }
    
    return prompts;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h2>
          <p className="text-gray-600 mb-4">Please log in to use the AI assistant</p>
          <Link
            href="/api/auth/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
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
                  AI Music Assistant
                </h1>
                <p className="text-gray-600">
                  Your intelligent guide to music education at MoonRiver
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>Powered by DeepHermes 3</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.role === 'assistant' ? (
                            <Bot className="w-4 h-4 mr-2 text-purple-600" />
                          ) : (
                            <User className="w-4 h-4 mr-2" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.context && (
                          <div className="mt-2 text-xs opacity-70 italic">
                            💡 {message.context}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center">
                          <Bot className="w-4 h-4 mr-2 text-purple-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about music education..."
                      className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Prompts Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 h-[600px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Prompts
                </h3>
                <div className="space-y-2">
                  {getQuickPrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt)}
                      className="w-full text-left text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 p-3 rounded-md transition-colors"
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