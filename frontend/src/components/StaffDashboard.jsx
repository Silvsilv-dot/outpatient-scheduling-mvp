import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());
  const timer = useRef(null);
  const request = useRef(null);
  const writes = useRef(new Set());
  const mounted = useRef(false);

  const showToast = useCallback((message, type = 'success') => {
    if (!mounted.current) return;
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAppointments = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/appointments`, { signal: controller.signal });
      if (!res.ok) throw new Error('Failed to fetch appointment roster.');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected appointment response: expected an array.');
      if (!controller.signal.aborted) setAppointments(data);
    } catch (err) {
      if (!controller.signal.aborted) showToast(err.message, 'error');
    } finally {
      if (!controller.signal.aborted && mounted.current) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    mounted.current = true;
    fetchAppointments();
    return () => {
      mounted.current = false;
      request.current?.abort();
      clearTimeout(timer.current);
    };
  }, [fetchAppointments]);

  async function handleStatusUpdate(id, status) {
    if (writes.current.has(id)) return;
    if (status === 'cancelled' && !window.confirm('Cancel this appointment?')) return;
    writes.current.add(id);
    setPendingIds(new Set(writes.current));
    try {
      const res = await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Could not update appointment status.');
      if (!mounted.current) return;
      setAppointments(previous => previous.map(app => app.id === id ? { ...app, status } : app));
      showToast(`Appointment status updated to ${status}.`);
      await fetchAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      writes.current.delete(id);
      if (mounted.current) setPendingIds(new Set(writes.current));
    }
  }

  const query = searchTerm.trim().toLowerCase();
  const filtered = appointments.filter(app =>
    (filterStatus === 'all' || app.status === filterStatus) &&
    (!query || [app.patient_name, app.clinician_name].some(name => String(name ?? '').toLowerCase().includes(query)))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && <div role={toast.type === 'error' ? 'alert' : 'status'} className={`p-4 rounded-md text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{toast.message}</div>}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h1 className="text-2xl font-bold">Front-Desk Staff Dashboard</h1><p className="text-sm text-gray-500">Review bookings, confirm appointments, and process cancellations.</p></div>
        <button type="button" onClick={fetchAppointments} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Refresh Roster</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg border">
        <label className="flex-grow"><span className="sr-only">Search by patient or clinician</span><input type="search" placeholder="Search by patient or clinician..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md" /></label>
        <label><span className="sr-only">Filter by appointment status</span><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded-md"><option value="all">All Statuses</option><option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></label>
      </div>
      {loading ? <p role="status" className="text-center py-12">Loading appointment data...</p> : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">Patient appointment roster</caption>
            <thead><tr className="bg-gray-100 border-b text-xs uppercase">{['ID', 'Patient', 'Clinician', 'Date & Time', 'Status', 'Actions'].map(title => <th key={title} scope="col" className="p-4">{title}</th>)}</tr></thead>
            <tbody className="divide-y text-sm">
              {filtered.length === 0 ? <tr><td colSpan={6} className="p-4 text-center">No matching appointments found.</td></tr> : filtered.map(app => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{app.id}</td><td className="p-4">{app.patient_name || 'Not provided'}</td><td className="p-4">{app.clinician_name || 'Not assigned'}</td>
                  <td className="p-4">{app.appointment_time && !Number.isNaN(new Date(app.appointment_time).getTime()) ? new Date(app.appointment_time).toLocaleString() : 'Time unavailable'}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${app.status === 'confirmed' ? 'bg-green-100 text-green-800' : app.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{app.status}</span></td>
                  <td className="p-4 space-x-2 whitespace-nowrap">
                    <button type="button" onClick={() => handleStatusUpdate(app.id, 'confirmed')} disabled={pendingIds.has(app.id) || app.status !== 'scheduled'} className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50" aria-label={`Confirm appointment ${app.id}`}>Confirm</button>
                    <button type="button" onClick={() => handleStatusUpdate(app.id, 'cancelled')} disabled={pendingIds.has(app.id) || !['scheduled', 'confirmed'].includes(app.status)} className="px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50" aria-label={`Cancel appointment ${app.id}`}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
