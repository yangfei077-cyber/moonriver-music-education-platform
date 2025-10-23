'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function AIToolsTestPage() {
  const { user, isLoading } = useUser();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCalendarAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-tools/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'checkUsersCalendar',
          parameters: {
            date: new Date().toISOString()
          }
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing calendar availability:', error);
      setResults({ error: 'Failed to test calendar availability' });
    } finally {
      setLoading(false);
    }
  };

  const testSmartScheduling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-tools/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'smart-schedule',
          appointmentData: {
            preferredDate: new Date().toISOString(),
            duration: 60
          }
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing smart scheduling:', error);
      setResults({ error: 'Failed to test smart scheduling' });
    } finally {
      setLoading(false);
    }
  };

  const testUpcomingEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-tools/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'getUpcomingEvents',
          parameters: {
            maxResults: 5,
            daysAhead: 7
          }
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing upcoming events:', error);
      setResults({ error: 'Failed to test upcoming events' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to test AI tools</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Tools Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={testCalendarAvailability}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          Test Calendar Availability
        </button>
        
        <button
          onClick={testSmartScheduling}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          Test Smart Scheduling
        </button>
        
        <button
          onClick={testUpcomingEvents}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          Test Upcoming Events
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Testing AI tools...</p>
        </div>
      )}

      {results && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Results:</h2>
          <pre className="bg-white p-4 rounded overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure you have a Google connection configured in your Auth0 Dashboard</li>
          <li>Connect your Google account through Auth0's universal login</li>
          <li>Grant calendar permissions when prompted</li>
          <li>The AI tools will use Auth0's Token Vault to access your Google Calendar</li>
        </ol>
      </div>
    </div>
  );
}
