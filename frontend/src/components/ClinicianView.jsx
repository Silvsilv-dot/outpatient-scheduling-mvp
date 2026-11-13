import React, { useState, useEffect } from 'react';

export default function ClinicianView({ clinicianId = 1 }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('daily'); // 'daily' or 'weekly'

  useEffect(() => {
    async function fetchClinicianSchedule() {
      try {
        setLoading(true);
        
        // Safety check: Guarantee an integer is used in the URL to prevent 404s
        const safeId = clinicianId || 1;
        
        const response = await fetch(`/api/v1/batch4/clinician/${safeId}/schedule?view=${selectedView}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_BATCH4_ACCESS_KEY}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 503) {
            throw new Error('Access denied: Invalid or missing preview configuration.');
          }
          throw new Error(`Failed to load clinician schedule data (Status: ${response.status})`);
        }
        
        const data = await response.json();
        setSchedule(data.appointments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClinicianSchedule();
  }, [clinicianId, selectedView]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading clinician calendar view...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error loading calendar: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Clinician Calendar & Agenda</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView('daily')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Daily Calendar
          </button>
          <button
            onClick={() => setSelectedView('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Weekly Calendar
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {schedule.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No appointments found for this {selectedView}.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {schedule.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.patient_name}</p>
                  <p className="text-xs text-gray-500">Time: {item.appointment_time}</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  item.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
