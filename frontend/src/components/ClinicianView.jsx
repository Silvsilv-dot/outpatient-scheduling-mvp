import { useEffect, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export default function ClinicianView({ clinicianId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSchedule([]);
    setError('');
    if (!clinicianId) {
      setLoading(false);
      return () => controller.abort();
    }
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/clinicians/${encodeURIComponent(clinicianId)}/schedule`, { signal: controller.signal });
        if (!res.ok) throw new Error('Could not load clinician schedule.');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Unexpected schedule response: expected an array.');
        if (!controller.signal.aborted) setSchedule([...data].sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)));
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [clinicianId, reload]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-4 flex flex-wrap justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Clinician Schedule &amp; Agenda</h1><p className="text-sm text-gray-500">Appointments returned by the clinician schedule service.</p></div>
        <button type="button" onClick={() => setReload(value => value + 1)} disabled={loading || !clinicianId} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Refresh Schedule</button>
      </div>
      {!clinicianId ? <p role="status">No clinician selected. Configure a clinician ID for this demo.</p> : loading ? <p role="status">Loading agenda...</p> : error ? <div role="alert" className="p-4 bg-red-100 text-red-800 rounded">{error}</div> : schedule.length === 0 ? <p className="p-6 bg-gray-50 border rounded-lg">No appointments returned for this clinician.</p> : (
        <div className="grid gap-4">{schedule.map(item => (
          <div key={item.id} className="flex flex-col sm:flex-row justify-between gap-3 p-4 bg-white border rounded-lg shadow-sm">
            <div><div className="text-sm font-semibold text-blue-600">{item.appointment_time && !Number.isNaN(new Date(item.appointment_time).getTime()) ? new Date(item.appointment_time).toLocaleString() : 'Time unavailable'}</div><div className="text-lg font-semibold">{item.patient_name || 'Patient name unavailable'}</div><div className="text-sm text-gray-500">Reason: {item.reason || 'Not provided'}</div></div>
            <div><span className={`px-3 py-1 rounded-full text-xs ${item.status === 'confirmed' ? 'bg-green-100 text-green-800' : item.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{item.status}</span></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
