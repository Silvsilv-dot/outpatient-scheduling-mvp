import React, { useState, useEffect } from 'react';

const RAW_URL = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_URL = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;

export default function App() {
  const [activeTab, setActiveTab] = useState('patient');
  const [patientIdInput, setPatientIdInput] = useState('1');
  const [currentPatientId, setCurrentPatientId] = useState(1);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consentGiven, setConsentGiven] = useState(true);
  const [apiStatus, setApiStatus] = useState('Connecting to API...');

  const [authToken, setAuthToken] = useState('front-desk-token');
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    if (activeTab === 'patient') {
      loadAppointments();
      loadSlots();
    }
  }, [currentPatientId, activeTab]);

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/appointments/slots`);
      if (res.ok) {
        setApiStatus('Connected to FastAPI');
      } else {
        setApiStatus(`API Error (${res.status})`);
      }
    } catch (err) {
      setApiStatus('Network Error');
    }
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      const targetId = consentGiven ? currentPatientId : 'pat_unconsented';
      const res = await fetch(`${BACKEND_URL}/api/v1/appointments?patient_id=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : [data]);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/appointments/slots`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setAvailableSlots([]);
    }
  }

  const handleReschedule = async (slotId) => {
    const targetId = consentGiven ? currentPatientId : 'pat_unconsented';
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/appointments/reschedule`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${targetId === 'pat_unconsented' ? 'unconsented' : 'valid-token'}`
        },
        body: JSON.stringify({ patient_id: targetId, slot_id: slotId || selectedSlot || "slot_101" })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Appointment rescheduled successfully!");
        loadAppointments();
      } else {
        alert(`Reschedule failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Network error during reschedule.");
    }
  };

  const handleStaffCheck = async (endpoint) => {
    try {
      const targetUrl = endpoint.startsWith('/') ? `${BACKEND_URL}${endpoint}` : `${BACKEND_URL}/api/v1/appointments/${endpoint}`;
      const res = await fetch(targetUrl, {
        headers: { 'Authorization': authToken }
      });
      const data = await res.json();
      if (res.ok) {
        setStaffData(data);
      } else {
        setStaffData({ error: data.detail || `Access Denied (${res.status})` });
      }
    } catch (err) {
      setStaffData({ error: "Network error connecting to staff portal." });
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', backgroundColor: '#090d16', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#38bdf8' }}>Outpatient Scheduling Portal</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Production MVP — Secure Patient & Staff Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('patient')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'patient' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Patient Portal
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'staff' ? '#2563eb' : '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Staff & RBAC View
          </button>
        </div>
      </header>

      {/* On-Screen Connection Status Banner */}
      <div style={{ background: apiStatus.includes('Connected') ? '#064e3b' : '#7f1d1d', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        <strong>System Status:</strong> {apiStatus}
      </div>

      {activeTab === 'patient' ? (
        <div>
          <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #1f2937', maxWidth: '700px' }}>
            <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Patient Verification</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Patient ID / MRN</label>
                <input 
                  type="text" 
                  value={patientIdInput} 
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #374151', background: '#030712', color: '#fff' }}
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button 
                  onClick={() => setCurrentPatientId(patientIdInput)}
                  style={{ padding: '0.55rem 1.2rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Load Records
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={consentGiven} 
                onChange={(e) => setConsentGiven(e.target.checked)} 
                id="consentCheck"
              />
              <label htmlFor="consentCheck" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer' }}>
                Active Patient Consent Provided
              </label>
            </div>
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Appointments for Patient #{currentPatientId}</h2>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading records...</p>
          ) : appointments.length === 0 ? (
            <div style={{ background: '#111827', padding: '2rem', borderRadius: '10px', maxWidth: '700px', textAlign: 'center', color: '#94a3b8', border: '1px solid #1f2937' }}>
              No active appointments found.
            </div>
          ) : (
            appointments.map((appt, idx) => (
              <div key={idx} style={{ background: '#111827', padding: '1.5rem', borderRadius: '10px', maxWidth: '700px', marginBottom: '1rem', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Clinician ID: {appt.clinician_id ?? 1}</span>
                  <span style={{ background: '#047857', color: '#d1fae5', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{appt.status ?? 'SCHEDULED'}</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#fff' }}>{appt.appointment_time ?? '2026-11-15T10:00:00'}</div>
                <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Estimated Wait Time: {appt.estimated_wait_time ?? '15 mins'}</div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.5rem 0 1rem' }}>{appt.notes ?? 'Routine checkup'}</p>
                
                <div style={{ background: '#030712', padding: '1rem', borderRadius: '6px', border: '1px solid #1f2937', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select 
                    value={selectedSlot} 
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', background: '#111827', color: '#fff', border: '1px solid #374151' }}
                  >
                    <option value="">Select a new slot...</option>
                    {availableSlots.map((s) => (
                      <option key={s.slot_id} value={s.slot_id}>{s.time} ({s.slot_id})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleReschedule(selectedSlot)}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '10px', border: '1px solid #1f2937', maxWidth: '800px' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Staff & RBAC Portal</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Authorization Header</label>
              <input 
                type="text" 
                value={authToken} 
                onChange={(e) => setAuthToken(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #374151', background: '#030712', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button 
                onClick={() => handleStaffCheck('front-desk')}
                style={{ padding: '0.55rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
              >
                Test Front-Desk
              </button>
              <button 
                onClick={() => handleStaffCheck('/api/v1/admin/manager_metrics')}
                style={{ padding: '0.55rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
              >
                Test Manager RBAC
              </button>
            </div>
          </div>

          <div style={{ background: '#030712', padding: '1rem', borderRadius: '6px', border: '1px solid #1f2937' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '0.9rem' }}>Response:</h4>
            <pre style={{ margin: 0, color: '#34d399', fontSize: '0.85rem', overflowX: 'auto' }}>
              {staffData ? JSON.stringify(staffData, null, 2) : '// Click a button to test permissions'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
