'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Bot, Send, Brain, BookOpen, Shield, User, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextUsed?: number;
}

interface KnowledgeAccess {
  public: number;
  intermediate: number;
  advanced: number;
  admin: number;
  total: number;
}

export default function AIAssistantPage() {
  const { user, isLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [knowledgeAccess, setKnowledgeAccess] = useState<KnowledgeAccess | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showKnowledgeInfo, setShowKnowledgeInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchKnowledgeAccess();
      // Add welcome message
      setMessages([{
        id: '1',
        type: 'assistant',
        content: `Hello! I'm your AI Music Education Assistant. I can help you with music theory, instruments, teaching methods, and more. What would you like to learn about today?`,
        timestamp: new Date()
      }]);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchKnowledgeAccess = async () => {
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'knowledge-access' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeAccess(data.knowledgeAccess);
        setUserRole(data.userRole);
      }
    } catch (error) {
      console.error('Error fetching knowledge access:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'chat',
          query: inputMessage.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          contextUsed: data.contextUsed
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered a network error. Please try again.',
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

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI Music Education Assistant. I can help you with music theory, instruments, teaching methods, and more. What would you like to learn about today?`,
      timestamp: new Date()
    }]);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access AI Assistant</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="w-8 h-8 text-purple-600 mr-3" />
              AI Music Education Assistant
            </h1>
            <p className="text-gray-600">
              Your intelligent music education companion with role-based knowledge access
            </p>
          </div>

          {/* Knowledge Access Info */}
          {knowledgeAccess && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <button
                onClick={() => setShowKnowledgeInfo(!showKnowledgeInfo)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">
                    Your Knowledge Access ({userRole})
                  </span>
                </div>
                {showKnowledgeInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {showKnowledgeInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{knowledgeAccess.public}</div>
                      <div className="text-gray-600">Public</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{knowledgeAccess.intermediate}</div>
                      <div className="text-gray-600">Intermediate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{knowledgeAccess.advanced}</div>
                      <div className="text-gray-600">Advanced</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{knowledgeAccess.admin}</div>
                      <div className="text-gray-600">Admin</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{knowledgeAccess.total}</div>
                      <div className="text-gray-600">Total</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Fine-grained authorization controls your access to different levels of music education knowledge
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">AI Assistant Online</span>
                </div>
                <button
                  onClick={clearChat}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start">
                      {message.type === 'assistant' && (
                        <Bot className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.contextUsed && (
                          <p className="text-xs opacity-75 mt-1">
                            Used {message.contextUsed} knowledge sources
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center">
                      <Bot className="w-4 h-4 mr-2" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about music education..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Fine-Grained Authorization Info */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              Fine-Grained Authorization in Action
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Knowledge Access Control:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Students: Basic + Intermediate knowledge</li>
                  <li>• Educators: Basic + Intermediate + Advanced</li>
                  <li>• Admins: All knowledge levels</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">RAG Pipeline Features:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Role-based knowledge retrieval</li>
                  <li>• Context-aware AI responses</li>
                  <li>• Token Vault integration for LLM access</li>
                  <li>• Secure knowledge filtering</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
