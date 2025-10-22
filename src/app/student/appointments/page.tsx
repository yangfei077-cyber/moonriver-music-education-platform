'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface Appointment {
  id: number | string;
  educatorName: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'completed';
  source?: 'moonriver' | 'google_calendar';
  description?: string;
  location?: string;
  googleEventId?: string;
}

export default function StudentAppointmentsPage() {
  const { user, isLoading } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    date: '',
    time: '',
    educatorId: '',
    notes: ''
  });
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    notes: ''
  });
  const [cancelReason, setCancelReason] = useState('');

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
    
    // Check if Google Calendar is connected
    checkGoogleCalendarConnection();
    
    // Check for URL parameters (success/error messages)
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'calendar_connected') {
      setNotification({ type: 'success', message: 'Successfully connected to Google Calendar!' });
      setIsGoogleCalendarConnected(true);
      // Clean up URL
      window.history.replaceState({}, '', '/student/appointments');
    } else if (error) {
      let errorMessage = 'An error occurred';
      if (error === 'oauth_error') errorMessage = 'Failed to connect to Google Calendar';
      if (error === 'missing_params') errorMessage = 'Invalid connection parameters';
      if (error === 'callback_error') errorMessage = 'Connection callback failed';
      
      setNotification({ type: 'error', message: errorMessage });
      // Clean up URL
      window.history.replaceState({}, '', '/student/appointments');
    }
  }, []);

  const checkGoogleCalendarConnection = async () => {
    try {
      const response = await fetch('/api/google-calendar/status');
      const data = await response.json();
      setIsGoogleCalendarConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsGoogleCalendarConnected(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        console.error('No auth URL received');
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const syncWithGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google-calendar/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update the appointments list with Google Calendar events
        setAppointments(prevAppointments => {
          // Remove existing Google Calendar appointments and add new ones
          const moonriverAppointments = prevAppointments.filter(apt => apt.source !== 'google_calendar');
          return [...moonriverAppointments, ...data.appointments];
        });
        
        setNotification({
          type: 'success',
          message: data.message || `Synced ${data.appointments.length} appointments from Google Calendar!`
        });
      } else {
        const errorData = await response.json();
        setNotification({
          type: 'error',
          message: errorData.error || 'Failed to sync appointments from Google Calendar.'
        });
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      setNotification({
        type: 'error',
        message: 'Error syncing with Google Calendar. Please try again.'
      });
    }
  };

  const createAppointment = async () => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...newAppointment
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Appointment created successfully!'
        });
        setShowCreateModal(false);
        setNewAppointment({
          title: '',
          date: '',
          time: '',
          educatorId: '',
          notes: ''
        });
        // Refresh appointments
        fetchAppointments();
      } else {
        let errorMessage = 'Failed to create appointment.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        setNotification({
          type: 'error',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setNotification({
        type: 'error',
        message: 'Error creating appointment. Please try again.'
      });
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    // Pre-fill current date and time
    setRescheduleData({
      newDate: appointment.date,
      newTime: appointment.time.split(' - ')[0].replace(/\s(AM|PM)/, ''),
      notes: ''
    });
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleData.newDate || !rescheduleData.newTime) {
      setNotification({
        type: 'error',
        message: 'Please select both date and time'
      });
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reschedule',
          appointmentId: selectedAppointment.id,
          newDate: rescheduleData.newDate,
          newTime: rescheduleData.newTime,
          notes: rescheduleData.notes
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Appointment rescheduled successfully!'
        });
        setShowRescheduleModal(false);
        setRescheduleData({ newDate: '', newTime: '', notes: '' });
        fetchAppointments(); // Refresh the list
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to reschedule appointment'
        });
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to reschedule appointment'
      });
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          appointmentId: selectedAppointment.id,
          reason: cancelReason || 'No reason provided'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Appointment cancelled successfully!'
        });
        setShowCancelModal(false);
        setCancelReason('');
        fetchAppointments(); // Refresh the list
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to cancel appointment'
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to cancel appointment'
      });
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your schedule</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
        .font-display {
          font-family: 'Fredoka One', cursive;
        }
        .logo-m {
          display: inline-block;
          transform: scaleY(0.7);
          font-size: 1.2em;
          line-height: 1;
          position: relative;
          top: -0.05em;
        }
      `}</style>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white flex-shrink-0 p-6 hidden lg:flex flex-col justify-between">
          <div>
            <Link className="text-3xl font-display mb-12 block" href="/">
              <span className="logo-m text-[#F28C4A]">M</span><span className="text-[#333333]">oonriver</span>
            </Link>
            <nav className="space-y-4">
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/">
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/student/courses">
                <span className="material-symbols-outlined">music_note</span>
                <span>My Courses</span>
              </Link>
              <Link className="flex items-center space-x-3 text-[#F28C4A] bg-[#FFF0E6] px-4 py-2 rounded-lg font-semibold" href="/student/appointments">
                <span className="material-symbols-outlined">calendar_month</span>
                <span>Schedule</span>
              </Link>
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/educators">
                <span className="material-symbols-outlined">person</span>
                <span>Instructors</span>
              </Link>
              <Link className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors" href="/ai-assistant">
                <span className="material-symbols-outlined">smart_toy</span>
                <span>AI Assistant</span>
              </Link>
            </nav>
          </div>
          <div>
            <button className="flex items-center space-x-3 text-[#555555] hover:text-[#F28C4A] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors w-full">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {/* Notifications */}
          {notification && (
            <div className={`mb-4 p-4 rounded-lg ${
              notification.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-700' 
                : 'bg-red-100 border border-red-300 text-red-700'
            }`}>
              <div className="flex justify-between items-center">
                <span>{notification.message}</span>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display text-[#333333]">My Schedule</h1>
              <p className="text-[#666666] mt-1">Your upcoming lessons and events.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#F28C4A] text-white px-6 py-2 rounded-lg hover:bg-[#E76F51] transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Lesson</span>
              </button>
              <span className="material-symbols-outlined text-[#555555] text-2xl cursor-pointer">notifications</span>
              <Link href="/profile" className="w-12 h-12 rounded-full bg-[#F28C4A] flex items-center justify-center text-white font-semibold hover:bg-[#E76F51] transition-colors cursor-pointer overflow-hidden">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Link>
            </div>
          </header>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold font-display text-[#F28C4A]">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button onClick={goToToday} className="bg-[#FFF0E6] text-[#F28C4A] px-4 py-2 rounded-lg hover:bg-[#FDE2B3] transition-colors">
                Today
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="p-3"></div>;
                }

                const hasAppointment = getAppointmentsForDate(day).length > 0;
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`}
                    className={`
                      p-3 cursor-pointer rounded-lg transition-colors relative
                      ${isToday ? 'bg-[#F28C4A] text-white' : ''}
                      ${!isToday ? 'hover:bg-gray-100' : ''}
                    `}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasAppointment && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#F28C4A] rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-80 bg-[#FDE2B3] p-6 hidden xl:flex flex-col">
          <h3 className="text-xl font-bold font-display text-[#333333] mb-6">Upcoming Events</h3>
          
          <div className="space-y-4 mb-8">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#F28C4A] text-white px-3 py-1 rounded-lg text-xs font-bold">
                    {appointment.date.split('-')[1]} {appointment.date.split('-')[2].padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-[#333333]">{appointment.title}</h4>
                      {appointment.source === 'google_calendar' && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          Google
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#666666] mb-1">{appointment.time}</p>
                    <p className="text-sm text-[#666666]">with {appointment.educatorName}</p>
                    {appointment.source === 'moonriver' && (
                      <div className="flex space-x-2 mt-2">
                        <button 
                          onClick={() => handleRescheduleClick(appointment)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => handleCancelClick(appointment)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {appointment.source === 'google_calendar' && (
                      <div className="flex space-x-2 mt-2">
                        <button className="text-blue-600 text-xs hover:underline">View in Google</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold font-display text-[#333333] mb-3">Google Calendar</h4>
            <p className="text-sm text-[#666666] mb-4">
              Sync your Moonriver schedule with your Google Calendar to get notifications and reminders.
            </p>
            
            {isGoogleCalendarConnected ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected to Google Calendar</span>
                </div>
                <button 
                  onClick={syncWithGoogleCalendar}
                  className="w-full bg-[#F28C4A] text-white px-4 py-2 rounded-lg hover:bg-[#E76F51] transition-colors flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Sync Appointments</span>
                </button>
                <button 
                  onClick={checkGoogleCalendarConnection}
                  className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Refresh Connection
                </button>
              </div>
            ) : (
              <button 
                onClick={connectGoogleCalendar}
                disabled={isConnecting}
                className="w-full bg-white border border-[#F28C4A] text-[#F28C4A] px-4 py-2 rounded-lg hover:bg-[#FFF0E6] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect with Google Calendar'}</span>
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Create New Lesson Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-display text-[#333333]">Create New Lesson</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createAppointment(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Lesson Title</label>
                <input
                  type="text"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  placeholder="e.g., Guitar Lesson, Vocal Training"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Date</label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Time</label>
                <input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Educator</label>
                <select
                  value={newAppointment.educatorId}
                  onChange={(e) => setNewAppointment({...newAppointment, educatorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  required
                >
                  <option value="">Select an educator</option>
                  <option value="john-williams">John Williams</option>
                  <option value="adele-adkins">Adele Adkins</option>
                  <option value="steve-vai">Steve Vai</option>
                  <option value="taylor-swift">Taylor Swift</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">Notes (Optional)</label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  rows={3}
                  placeholder="Any additional notes for this lesson..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#F28C4A] text-white rounded-lg hover:bg-[#E76F51] transition-colors"
                >
                  Create Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-display text-[#333333]">Reschedule Lesson</h2>
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={rescheduleData.notes}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, notes: e.target.value })}
                  placeholder="Reason for rescheduling..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="flex-1 px-4 py-2 bg-[#F28C4A] text-white rounded-lg hover:bg-[#E76F51] transition-colors"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-display text-[#333333]">Cancel Lesson</h2>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this lesson? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F28C4A]"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Lesson
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}