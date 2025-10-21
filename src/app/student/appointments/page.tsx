'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Calendar, Clock, User, MapPin, Plus, ArrowLeft, Filter, Search } from 'lucide-react';

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
}

interface Educator {
  id: string;
  name: string;
  email: string;
  title: string;
  specialization: string;
  courses: string[];
}

export default function StudentAppointmentsPage() {
  const { user, isLoading } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    educator: ''
  });
  const [formData, setFormData] = useState({
    educatorId: '',
    educatorName: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'lesson' as const,
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchEducators();
    }
  }, [user, filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('startDate', filters.date);

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducators = async () => {
    try {
      const response = await fetch('/api/educators');
      const data = await response.json();

      if (data.success) {
        setEducators(data.educators);
      }
    } catch (error) {
      console.error('Error fetching educators:', error);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          educatorId: formData.educatorId,
          educatorName: formData.educatorName,
          studentId: user?.sub,
          studentName: user?.name || 'Student',
          studentEmail: user?.email,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowBookingModal(false);
        setFormData({
          educatorId: '',
          educatorName: '',
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          type: 'lesson',
          location: '',
          notes: ''
        });
        fetchAppointments();
        alert('Appointment booked successfully! The educator will confirm your appointment.');
      } else {
        alert(data.error || 'Failed to book appointment');
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
        alert('Appointment cancelled successfully.');
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
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your appointments</div>;
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
                <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
                <p className="text-gray-600 mt-1">View and book appointments with educators</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Educator
              </label>
              <select
                value={filters.educator}
                onChange={(e) => setFilters({ ...filters, educator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Educators</option>
                {educators.map(educator => (
                  <option key={educator.id} value={educator.email}>{educator.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {appointment.educatorName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDateTime(appointment.startTime)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {appointment.location}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {appointment.type.replace('_', ' ')}
                      </p>
                      {appointment.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Description:</strong> {appointment.description}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this appointment?')) {
                          const reason = prompt('Reason for cancellation:');
                          if (reason) {
                            handleCancelAppointment(appointment.id, reason);
                          }
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Appointments Message */}
        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-4">
              {filters.status || filters.date || filters.educator
                ? 'Try adjusting your filters or book a new appointment.'
                : 'You don\'t have any appointments scheduled yet.'
              }
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Book Your First Appointment
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Book New Appointment</h3>
            <form onSubmit={handleBookAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Educator</label>
                  <select
                    required
                    value={formData.educatorId}
                    onChange={(e) => {
                      const educator = educators.find(ed => ed.email === e.target.value);
                      setFormData({ 
                        ...formData, 
                        educatorId: e.target.value,
                        educatorName: educator?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select an educator</option>
                    {educators.map(educator => (
                      <option key={educator.id} value={educator.email}>
                        {educator.name} - {educator.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Piano Lesson, Guitar Consultation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => {
                      const startTime = new Date(e.target.value);
                      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
                      setFormData({ 
                        ...formData, 
                        startTime: e.target.value,
                        endTime: endTime.toISOString().slice(0, 16)
                      });
                    }}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Studio A, Online, Student's Home"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what you'd like to work on or discuss"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Any additional information for the educator"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
