import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function App() {
  const [patientIdInput, setPatientIdInput] = useState('1');
  const [currentPatientId, setCurrentPatientId] = useState(1);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/appointments?patient_id=${currentPatientId}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error("Failed to fetch appointments", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [currentPatientId]);

  const handlePortalLoad = (e) => {
    e.preventDefault();
    if (patientIdInput) {
      setCurrentPatientId(patientIdInput);
    }
  };

  const handleReschedule = async (slotId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/appointments/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: currentPatientId, slot_id: slotId || "slot_101" })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Appointment rescheduled successfully!");
      } else {
        alert(`Reschedule failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Network error during reschedule.");
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#fff', backgroundColor: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Outpatient Scheduler MVP</h1>
      
      {/* Credential Login Box */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', maxWidth: '600px' }}>
        <h3>Patient Credential Login</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Enter your Patient ID to load your scheduled appointments.</p>
        <form onSubmit={handlePortalLoad} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={patientIdInput} 
            onChange={(e) => setPatientIdInput(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff', flex: 1 }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Load Portal
          </button>
        </form>
      </div>

      <h2>My Appointments (Patient #{currentPatientId})</h2>
      {loading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', maxWidth: '600px', textAlign: 'center', color: '#94a3b8' }}>
          No upcoming appointments found for Patient ID #{currentPatientId}.
        </div>
      ) : (
        appointments.map((appt, idx) => (
          <div key={idx} style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', maxWidth: '600px', marginBottom: '1rem', border: '1px solid #334155' }}>
            <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>Clinician ID: {appt.clinician_id}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{appt.appointment_time}</div>
            <div style={{ display: 'inline-block', background: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              Estimated Wait Time: {appt.estimated_wait_time}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Status: {appt.status}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Notes: {appt.notes}</div>
            <button 
              onClick={() => handleReschedule(appt.slot_id)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reschedule
            </button>
          </div>
        ))
      )}
    </div>
  );
}
