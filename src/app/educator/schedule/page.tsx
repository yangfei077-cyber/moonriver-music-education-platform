'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Calendar, Clock, User, MapPin, Plus, Edit, Trash2, ArrowLeft, Filter } from 'lucide-react';

interface Appointment {
  id: number;
  educatorId: string;
  educatorName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  type: 'lesson' | 'consultation' | 'practice_session';
  location: string;
  notes: string;
  createdAt: string;
  googleEventId?: string;
}

export default function EducatorSchedulePage() {
  const { user, isLoading } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    date: ''
  });
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    studentEmail: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'lesson' as const,
    location: '',
    notes: ''
  });
  const [hasGoogleCalendarToken, setHasGoogleCalendarToken] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      checkGoogleCalendarToken();
    }
  }, [user, filters]);

  const checkGoogleCalendarToken = async () => {
    try {
      const response = await fetch('/api/token-vault');
      if (response.ok) {
        const data = await response.json();
        const hasToken = data.tokens?.some((token: any) => token.name === 'google-calendar');
        setHasGoogleCalendarToken(hasToken);
      }
    } catch (error) {
      console.error('Error checking Google Calendar token:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('startDate', filters.date);

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        console.error('Failed to fetch appointments:', data.error);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          educatorId: user?.email,
          educatorName: user?.name || 'Educator',
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          studentId: '',
          studentName: '',
          studentEmail: '',
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          type: 'lesson',
          location: '',
          notes: ''
        });
        fetchAppointments();
        
        // Show sync status message
        if (data.syncedWithGoogle) {
          alert('Appointment created and synced with Google Calendar!');
        } else if (hasGoogleCalendarToken) {
          alert('Appointment created, but failed to sync with Google Calendar. Please check your token.');
        }
      } else {
        alert(data.error || 'Failed to create appointment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleUpdateAppointment = async (updates: Partial<Appointment>) => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          appointmentId: selectedAppointment.id,
          updates
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        alert(data.error || 'Failed to update appointment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId: number, reason: string) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          appointmentId,
          reason
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchAppointments();
      } else {
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your schedule</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-gray-600 mt-1">Manage your appointments and lessons</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Google Calendar Sync Status */}
              <div className="flex items-center space-x-2">
                {hasGoogleCalendarToken ? (
                  <div className="flex items-center text-green-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">Synced with Google Calendar</span>
                  </div>
                ) : (
                  <Link 
                    href="/token-vault" 
                    className="flex items-center text-orange-600 hover:text-orange-700 text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Connect Google Calendar</span>
                  </Link>
                )}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div>
              <button
                onClick={() => setFilters({ status: '', date: '' })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.googleEventId && (
                      <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3 mr-1" />
                        Synced
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{appointment.studentName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatDateTime(appointment.startTime)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{appointment.location}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{appointment.type.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit appointment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {appointment.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this appointment?')) {
                          const reason = prompt('Reason for cancellation:');
                          if (reason) {
                            handleCancelAppointment(appointment.id, reason);
                          }
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Cancel appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {(appointment.description || appointment.notes) && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {appointment.description && (
                    <p className="text-sm text-gray-600 mb-2">{appointment.description}</p>
                  )}
                  {appointment.notes && (
                    <p className="text-sm text-gray-500 italic">{appointment.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Appointments Message */}
        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-4">
              {filters.status || filters.date 
                ? 'Try adjusting your filters or create a new appointment.'
                : 'You don\'t have any appointments scheduled yet.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Create Your First Appointment
            </button>
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Appointment</h3>
            <form onSubmit={handleCreateAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    required
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="lesson">Lesson</option>
                    <option value="consultation">Consultation</option>
                    <option value="practice_session">Practice Session</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Appointment Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedAppointment.status}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    status: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={selectedAppointment.notes}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    notes: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateAppointment({
                  status: selectedAppointment.status,
                  notes: selectedAppointment.notes
                })}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
