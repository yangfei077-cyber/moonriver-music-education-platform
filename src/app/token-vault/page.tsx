'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Plus, Trash2, Key, Eye, EyeOff } from 'lucide-react';

interface Token {
  name: string;
  createdAt: string;
  lastUsed: string;
}

export default function TokenVaultPage() {
  const { user, isLoading } = useUser();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenValue, setNewTokenValue] = useState('');
  const [showTokenValue, setShowTokenValue] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/token-vault');
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const addToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName || !newTokenValue) return;

    setLoading(true);
    try {
      const response = await fetch('/api/token-vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenName: newTokenName,
          token: newTokenValue,
        }),
      });

      if (response.ok) {
        setNewTokenName('');
        setNewTokenValue('');
        fetchTokens();
      }
    } catch (error) {
      console.error('Error adding token:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenName: string) => {
    try {
      const response = await fetch(`/api/token-vault?tokenName=${tokenName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access Token Vault</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Key className="w-6 h-6 text-purple-600 mr-2" />
              Token Vault
            </h1>
            <p className="text-gray-600 mb-6">
              Securely store and manage API tokens for your music education tools. 
              All tokens are encrypted and stored securely on the server.
            </p>

            {/* Add Token Form */}
            <form onSubmit={addToken} className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Token</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Name
                  </label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g., Spotify API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Value
                  </label>
                  <div className="relative">
                    <input
                      type={showTokenValue ? 'text' : 'password'}
                      value={newTokenValue}
                      onChange={(e) => setNewTokenValue(e.target.value)}
                      placeholder="Enter your token value"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokenValue(!showTokenValue)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showTokenValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Adding...' : 'Add Token'}
              </button>
            </form>

            {/* Tokens List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stored Tokens</h3>
              {tokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tokens stored yet. Add your first token above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div key={token.name} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{token.name}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>Created: {new Date(token.createdAt).toLocaleDateString()}</p>
                          <p>Last used: {new Date(token.lastUsed).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteToken(token.name)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auth0 Challenge Compliance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 text-green-600 mr-2" />
              Token Vault Compliance
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Tokens encrypted at rest using AES-256-GCM</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ User-scoped token storage</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Secure token retrieval and usage tracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">✓ Fine-grained access control per user</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
