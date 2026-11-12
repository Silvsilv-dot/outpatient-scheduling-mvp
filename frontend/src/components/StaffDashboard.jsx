import React, { useState, useEffect } from 'react';

export default function StaffDashboard() {
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/batch4/staff/appointments?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_BATCH4_ACCESS_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        triggerToast('Failed to load appointments');
      }
    } catch (error) {
      triggerToast('Network error loading appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const updateAppointmentStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/v1/batch4/staff/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_BATCH4_ACCESS_KEY}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        triggerToast(`Appointment ${newStatus.toLowerCase()} successfully!`);
        fetchAppointments(); 
      } else {
        triggerToast('Failed to update status');
      }
    } catch (error) {
      triggerToast('Network error updating status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg shadow">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Staff Coordination Dashboard</h2>
        <div className="space-x-2">
          {['All', 'Confirmed', 'Pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">Showing bookings filtered by: <strong>{filter}</strong></p>
        
        {loading ? (
          <p className="text-sm text-gray-500">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments found.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.patient_name} - Dr. {item.clinician_name}</p>
                  <p className="text-xs text-gray-500">{item.appointment_time}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                    item.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => updateAppointmentStatus(item.id, 'Confirmed')}
                    disabled={item.status === 'Confirmed'}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => updateAppointmentStatus(item.id, 'Rescheduled')}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
