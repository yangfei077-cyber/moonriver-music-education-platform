'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Bot, Music, Brain, Mic, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  status: 'available' | 'unavailable';
}

export default function AIAgentPage() {
  const { user, isLoading } = useUser();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const checkAvailableTools = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'available-tools' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTools(data.availableTools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          status: tool.status
        })));
      } else {
        setError(data.error || 'Failed to check tools');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const runAIAction = async (action: string) => {
    if (!query.trim()) {
      setError('Please enter a query first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, query })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        if (data.requiresToken) {
          setError(`${data.error}. Go to Token Vault to add your ${data.requiresToken} token.`);
        } else {
          setError(data.error || 'Action failed');
        }
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access AI Agent</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="w-8 h-8 text-purple-600 mr-3" />
              AI Music Education Agent
            </h1>
            <p className="text-gray-600">
              Your personal AI assistant powered by your own API tokens from the Token Vault
            </p>
          </div>

          {/* Available Tools Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Available AI Tools
              </h2>
              <button
                onClick={checkAvailableTools}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Tools'}
              </button>
            </div>

            {tools.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No AI tools available. Add your existing API tokens to the Token Vault to enable AI features.
                </p>
                <a
                  href="/token-vault"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  Manage Your API Tokens
                </a>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <div key={tool.name} className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      {tool.name === 'spotify-api' && <Music className="w-5 h-5 text-green-600 mr-2" />}
                      {tool.name === 'openai-api' && <Brain className="w-5 h-5 text-blue-600 mr-2" />}
                      {tool.name === 'google-cloud-api' && <Mic className="w-5 h-5 text-red-600 mr-2" />}
                      <span className="font-medium text-gray-900 capitalize">
                        {tool.name.replace('-api', '')}
                      </span>
                      {tool.status === 'available' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Actions Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Actions</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe what you want to learn or analyze..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => runAIAction('analyze-music')}
                disabled={loading}
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Music className="w-5 h-5 mr-2 text-green-600" />
                <span>Analyze Music</span>
              </button>
              
              <button
                onClick={() => runAIAction('generate-lesson')}
                disabled={loading}
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                <span>Generate Lesson</span>
              </button>
              
              <button
                onClick={() => runAIAction('transcribe-audio')}
                disabled={loading}
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Mic className="w-5 h-5 mr-2 text-red-600" />
                <span>Transcribe Audio</span>
              </button>
            </div>
          </div>

          {/* Results Section */}
          {(result || error) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                  {error.includes('Token Vault') && (
                    <a
                      href="/token-vault"
                      className="inline-block mt-2 text-red-600 hover:text-red-800 underline"
                    >
                      Go to Token Vault to add your existing API token
                    </a>
                  )}
                </div>
              )}
              
              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Success!</span>
                  </div>
                  <div className="text-gray-700">
                    <p className="mb-2">{result.analysis || result.lesson}</p>
                    <p className="text-sm text-gray-500">
                      Powered by: {result.source || 'AI Agent'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Token Vault Integration Info */}
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bot className="w-5 h-5 text-green-600 mr-2" />
              Token Vault Integration
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• AI Agent uses your personal API tokens (that you already have)</li>
                  <li>• Tokens are encrypted and stored securely</li>
                  <li>• Each user has isolated token access</li>
                  <li>• No shared API keys or rate limits</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Supported services:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Spotify API (music analysis)</li>
                  <li>• OpenAI API (AI lessons)</li>
                  <li>• Google Cloud API (transcription)</li>
                  <li>• Add your existing API tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
