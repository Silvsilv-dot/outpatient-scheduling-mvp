import React, { useState } from 'react';

export default function StaffDashboard() {
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState('');

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
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
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
            <div>
              <p className="font-medium text-sm text-gray-900">Jane Doe - Dr. Smith</p>
              <p className="text-xs text-gray-500">2026-11-12 09:30 AM</p>
            </div>
            <div className="space-x-2">
              <button 
                onClick={() => triggerToast("Appointment confirmed successfully!")}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
              <button 
                onClick={() => triggerToast("Appointment rescheduled successfully!")}
                className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
