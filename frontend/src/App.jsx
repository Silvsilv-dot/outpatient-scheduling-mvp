import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function fetchAllAppointments() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error('Failed to fetch staff appointments', err);
      }
    }
    fetchAllAppointments();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Front-Desk Staff Dashboard</h1>
      <p className="text-sm text-gray-400">Manage, review, and update patient appointments across all clinicians.</p>
      
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Appointment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Patient ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Clinician ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wait Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-400">No appointments found in system.</td>
              </tr>
            ) : (
              appointments.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">#{app.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Patient #{app.patient_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Clinician #{app.clinician_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(app.appointment_time).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-400 font-medium">{app.estimated_wait_time || '15 mins'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm uppercase font-semibold text-blue-400">{app.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClinicianView() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments`);
        if (res.ok) {
          const data = await res.json();
          setSchedule(data);
        }
      } catch (err) {
        console.error('Failed to load clinician schedule', err);
      }
    }
    fetchSchedule();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Clinician Daily Agenda</h1>
      <p className="text-sm text-gray-400">Review assigned patient consultations and live wait-time queues.</p>
      
      <div className="space-y-4">
        {schedule.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 text-center text-gray-400">
            No active appointments scheduled.
          </div>
        ) : (
          schedule.map((item) => (
            <div key={item.id} className="bg-gray-800 p-5 rounded-lg shadow border border-gray-700 flex justify-between items-center text-gray-200">
              <div>
                <div className="text-sm font-semibold text-blue-400">Patient ID: {item.patient_id}</div>
                <div className="text-lg font-bold text-gray-100">{new Date(item.appointment_time).toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">Notes: {item.notes || 'None'}</div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-amber-950 text-amber-300 font-medium px-2.5 py-1 rounded border border-amber-800">
                  Wait Time: {item.estimated_wait_time || '15 mins'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('patient');
  const [patientIdInput, setPatientIdInput] = useState('1');
  const [currentPatientId, setCurrentPatientId] = useState('1');
  const [userAppointments, setUserAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setCurrentPatientId(patientIdInput);
    showToast(`Logged in as Patient ID #${patientIdInput}`, 'success');
  };

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments`);
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(app => String(app.patient_id) === String(currentPatientId));
          setUserAppointments(filtered.length > 0 ? filtered : data);
        }
      } catch (err) {
        console.error('Failed to load appointments', err);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'patient') {
      fetchAppointments();
    }
  }, [activeTab, currentPatientId]);

  const handleReschedule = (appointmentTime, appointmentId) => {
    const now = new Date();
    const appTime = new Date(appointmentTime);
    const diffInHours = (appTime - now) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      showToast("Rescheduling is disabled within 24 hours of the appointment time.", "error");
      return; 
    }

    showToast(`Rescheduling appointment #${appointmentId}...`, "success");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md text-white font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="font-bold text-xl text-blue-400">Outpatient Scheduler MVP</span>
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('patient')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'patient' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Patient Portal
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'staff' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Front-Desk Staff
            </button>
            <button
              onClick={() => setActiveTab('clinician')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'clinician' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Clinician View
            </button>
          </nav>
        </div>
      </header>

      <main className="py-6">
        {activeTab === 'patient' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-100">Patient Credential Login</h2>
                <p className="text-xs text-gray-400">Enter your Patient ID to load your scheduled appointments.</p>
              </div>
              <form onSubmit={handleLogin} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  placeholder="Patient ID (e.g. 1)"
                  className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                >
                  Load Portal
                </button>
              </form>
            </div>

            <h1 className="text-2xl font-bold text-gray-100">My Appointments (Patient #{currentPatientId})</h1>
            
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading appointments...</div>
            ) : (
              <div className="space-y-4">
                {userAppointments.length === 0 ? (
                  <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 text-center text-gray-400">
                    No upcoming appointments found for Patient ID #{currentPatientId}.
                  </div>
                ) : (
                  userAppointments.map((app) => {
                    const appTime = new Date(app.appointment_time);
                    const isWithin24Hours = (appTime - new Date()) / (1000 * 60 * 60) < 24;

                    return (
                      <div key={app.id} className="bg-gray-800 p-5 rounded-lg shadow border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="text-sm font-semibold text-blue-400">Clinician ID: {app.clinician_id}</div>
                          <div className="text-lg font-bold text-gray-100">{appTime.toLocaleString()}</div>
                          
                          {app.estimated_wait_time && (
                            <div className="text-xs font-medium text-amber-300 mt-1 bg-amber-950 px-2 py-0.5 rounded inline-block border border-amber-800">
                              Estimated Wait Time: {app.estimated_wait_time}
                            </div>
                          )}

                          <div className="text-xs text-gray-400 mt-1">Status: <span className="uppercase font-medium text-gray-200">{app.status}</span></div>
                          {app.notes && <div className="text-xs text-gray-400 mt-0.5">Notes: {app.notes}</div>}
                        </div>
                        <div>
                          <button
                            onClick={() => handleReschedule(app.appointment_time, app.id)}
                            disabled={isWithin24Hours}
                            aria-disabled={isWithin24Hours}
                            data-reschedule-disabled={isWithin24Hours ? "true" : "false"}
                            className={`px-4 py-2 rounded text-sm font-medium transition ${
                              isWithin24Hours 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isWithin24Hours ? 'Rescheduling Locked (< 24h)' : 'Reschedule'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'staff' && <StaffDashboard />}
        {activeTab === 'clinician' && <ClinicianView />}
      </main>
    </div>
  );
}
