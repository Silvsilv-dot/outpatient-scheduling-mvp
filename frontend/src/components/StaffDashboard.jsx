import { useEffect, useRef, useState } from 'react';

const ROSTER_URL = '/api/v1/batch4/appointments';

function formatStoredTime(value) {
  if (!value) return 'Time unavailable';

  // The database stores timestamps without a timezone.
  // Display the stored value without inventing a timezone conversion.
  return String(value).replace('T', ' ');
}

function statusClass(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'rescheduled':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function StaffDashboard() {
  const [keyInput, setKeyInput] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);

  const requestVersion = useRef(0);
  const pageSize = 100;

  useEffect(() => {
    if (!accessKey) return undefined;

    const controller = new AbortController();
    const version = ++requestVersion.current;

    async function loadRoster() {
      setLoading(true);
      setError('');
      setLoaded(false);
      setAppointments([]);

      try {
        const response = await fetch(
          `${ROSTER_URL}?limit=${pageSize}&offset=${page * pageSize}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessKey}`,
            },
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const body = isJson ? await response.json() : null;

        if (!response.ok) {
          const detail =
            typeof body?.detail === 'string' ? body.detail : '';

          throw new Error(
            detail ||
              `The roster request failed with HTTP ${response.status}.`
          );
        }

        if (!isJson || !Array.isArray(body)) {
          throw new Error(
            'The server did not return an appointment list. Check API routing.'
          );
        }

        if (
          controller.signal.aborted ||
          version !== requestVersion.current
        ) {
          return;
        }

        setAppointments(body);
        setLoaded(true);
      } catch (err) {
        if (
          controller.signal.aborted ||
          version !== requestVersion.current
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'The appointment roster could not be loaded.'
        );
      } finally {
        if (
          !controller.signal.aborted &&
          version === requestVersion.current
        ) {
          setLoading(false);
        }
      }
    }

    loadRoster();

    return () => controller.abort();
  }, [accessKey, page, reload]);

  function unlockPreview(event) {
    event.preventDefault();

    const value = keyInput.trim();

    if (!value) {
      setError('Enter your Batch 4 preview access key.');
      return;
    }

    setError('');
    setPage(0);
    setAccessKey(value);
    setKeyInput('');
  }

  function lockPreview() {
    requestVersion.current += 1;
    setAccessKey('');
    setKeyInput('');
    setAppointments([]);
    setError('');
    setLoaded(false);
    setLoading(false);
    setSearchTerm('');
    setFilterStatus('all');
    setPage(0);
  }

  const query = searchTerm.trim().toLowerCase();

  const filteredAppointments = appointments.filter((appointment) => {
    const status = String(appointment.status || '').toLowerCase();

    const matchesStatus =
      filterStatus === 'all' || status === filterStatus;

    const matchesSearch = [
      appointment.id,
      appointment.patient_id,
      appointment.clinician_id,
      appointment.clinician_name,
    ].some((value) =>
      String(value ?? '').toLowerCase().includes(query)
    );

    return matchesStatus && matchesSearch;
  });

  return (
    <section className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Front-Desk Appointment Roster
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Restricted, read-only Batch 4 preview. Use synthetic test data only.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md"
        >
          {error}
        </div>
      )}

      {!accessKey ? (
        <form
          onSubmit={unlockPreview}
          className="max-w-xl bg-white border rounded-lg p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="batch4-preview-key"
              className="block text-sm font-medium text-gray-900"
            >
              Batch 4 preview access key
            </label>
            <input
              id="batch4-preview-key"
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="mt-2 w-full border rounded-md p-2"
            />
          </div>

          <p className="text-sm text-gray-600">
            Enter the key you saved as BATCH4_PREVIEW_ACCESS_KEY in Vercel.
            Do not enter your Neon API key or database connection string.
          </p>

          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            Load appointment roster
          </button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              Refresh roster
            </button>

            <button
              type="button"
              onClick={lockPreview}
              className="px-4 py-2 rounded-md border bg-white"
            >
              Lock preview / change key
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 bg-white border rounded-lg p-4">
            <label className="flex-1">
              <span className="block text-sm font-medium mb-2">
                Search this page
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Appointment ID, patient ID, or clinician"
                className="w-full border rounded-md p-2"
              />
            </label>

            <label>
              <span className="block text-sm font-medium mb-2">
                Status on this page
              </span>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="border rounded-md p-2"
              >
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="no-show">No-show</option>
              </select>
            </label>
          </div>

          {loading && (
            <p role="status" className="py-6">
              Loading appointment roster...
            </p>
          )}

          {!loading && loaded && (
            <>
              <p className="text-sm text-gray-600">
                Page {page + 1}. Loaded {appointments.length} records;
                showing {filteredAppointments.length} after filtering.
                Times are displayed as stored; the clinic timezone has
                not yet been configured.
              </p>

              <div className="overflow-x-auto bg-white border rounded-lg">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Read-only preview appointment roster
                  </caption>

                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="p-4">Appointment ID</th>
                      <th scope="col" className="p-4">Patient ID</th>
                      <th scope="col" className="p-4">Clinician</th>
                      <th scope="col" className="p-4">
                        Appointment time (as stored)
                      </th>
                      <th scope="col" className="p-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center">
                          {appointments.length === 0
                            ? 'No appointment records returned for this page.'
                            : 'No appointments match these filters on this page.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="p-4">{appointment.id}</td>
                          <td className="p-4">{appointment.patient_id}</td>
                          <td className="p-4">
                            {appointment.clinician_name}
                          </td>
                          <td className="p-4">
                            {formatStoredTime(
                              appointment.appointment_time
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${statusClass(
                                appointment.status
                              )}`}
                            >
                              {appointment.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  className="px-4 py-2 border rounded-md bg-white disabled:opacity-50"
                >
                  Previous page
                </button>

                <button
                  type="button"
                  disabled={appointments.length < pageSize}
                  onClick={() => setPage((value) => value + 1)}
                  className="px-4 py-2 border rounded-md bg-white disabled:opacity-50"
                >
                  Next page
                </button>
              </div>
            </>
          )}

          <p className="text-sm text-gray-600">
            Confirm, cancel, and reschedule actions are not enabled in
            this read-only stage.
          </p>
        </>
      )}
    </section>
  );
}
