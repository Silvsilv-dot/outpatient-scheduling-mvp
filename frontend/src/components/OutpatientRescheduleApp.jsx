import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Download,
  RefreshCw,
  ArrowLeft,
  User,
  ChevronDown,
  ChevronUp,
  Server,
  Database
} from 'lucide-react';

const MOCK_CURRENT_APPT = {
  id: "APT-12345",
  clinician: "Dr. Emily Carter",
  specialty: "Family Medicine",
  date: "2026-11-12",
  time: "09:00 AM",
  tz: "EST",
  type: "Annual Wellness Exam",
  location: "Main Clinic Suite 300 (Virtual Available)"
};

const INITIAL_SLOTS = [
  { id: "slot-101", date: "2026-11-15", time: "09:00 AM", period: "morning", available: true },
  { id: "slot-102", date: "2026-11-15", time: "10:30 AM", period: "morning", available: true },
  { id: "slot-103", date: "2026-11-15", time: "02:00 PM", period: "afternoon", available: true },
  { id: "slot-104", date: "2026-11-15", time: "03:30 PM", period: "afternoon", available: false },
  { id: "slot-105", date: "2026-11-16", time: "08:30 AM", period: "morning", available: true },
  { id: "slot-106", date: "2026-11-16", time: "01:15 PM", period: "afternoon", available: true },
  { id: "slot-107", date: "2026-11-17", time: "11:00 AM", period: "morning", available: false },
  { id: "slot-108", date: "2026-11-17", time: "04:00 PM", period: "afternoon", available: false }
];

export default function OutpatientRescheduleApp() {
  const [theme, setTheme] = useState(() => localStorage.getItem('demo_theme') || 'light');
  const [step, setStep] = useState(1);
  const [apiMode, setApiMode] = useState('MOCK');
  const [simulatedEdgeCase, setSimulatedEdgeCase] = useState('NONE');

  // Form Step 1
  const [apptId, setApptId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Form Step 2
  const [selectedDate, setSelectedDate] = useState('2026-11-15');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('ALL');

  // Step 3 & 4 Execution
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [confirmationRef, setConfirmationRef] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('demo_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [step]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleFillDemo = () => {
    setApptId('APT-12345');
    setAccessCode('DEMO-PASS');
    setErrors({});
  };

  const validateStep1 = () => {
    const errs = {};
    if (!apptId.trim()) errs.apptId = 'Appointment ID is required.';
    if (!accessCode.trim()) errs.accessCode = 'Access code is required.';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      if (simulatedEdgeCase === 'INVALID_CREDS') {
        throw new Error('Invalid Appointment ID or Access Code. Please check your details.');
      }
      if (apiMode === 'LIVE') {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: apptId, access_code: accessCode })
        });
        if (!res.ok) throw new Error('Authentication failed on backend');
      } else {
        await new Promise(r => setTimeout(r, 600));
        if (apptId.toUpperCase() !== 'APT-12345' || accessCode !== 'DEMO-PASS') {
          throw new Error('Invalid Appointment ID or Access Code.');
        }
      }
      setStep(2);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (simulatedEdgeCase === 'RECOVERABLE_409') {
        throw new Error('409 Conflict: This slot was just booked by another patient. Please retry or select another time.');
      }
      if (apiMode === 'LIVE') {
        const res = await fetch('/api/v1/appointments/reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_id: selectedSlot.id, patient_id: apptId })
        });
        if (!res.ok) throw new Error('Reschedule failed');
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
      setConfirmationRef(`DEMO-RESCH-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(4);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = () => {
    if (!selectedSlot) return;
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Outpatient Scheduling Demo//EN
BEGIN:VEVENT
SUMMARY:Rescheduled Demo Appointment - ${MOCK_CURRENT_APPT.clinician}
DESCRIPTION:Synthetic Educational Demo Appointment. No real clinic visit scheduled.
LOCATION:${MOCK_CURRENT_APPT.location}
DTSTART:${selectedSlot.date.replace(/-/g, '')}T090000Z
DTEND:${selectedSlot.date.replace(/-/g, '')}T100000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `demo_appointment_${selectedSlot.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = () => {
    setStep(1);
    setApptId('');
    setAccessCode('');
    setSelectedSlot(null);
    setErrors({});
    setApiError(null);
    setSimulatedEdgeCase('NONE');
  };

  const filteredSlots = INITIAL_SLOTS.filter(s => {
    if (s.date !== selectedDate) return false;
    if (simulatedEdgeCase === 'EMPTY_SLOTS') return false;
    if (filterPeriod === 'MORNING') return s.period === 'morning';
    if (filterPeriod === 'AFTERNOON') return s.period === 'afternoon';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* Dev Simulation Bar */}
      <div className="bg-slate-800 text-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-teal-400" />
          <span className="font-semibold uppercase tracking-wider">Dev Control:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 my-1">
          <label className="flex items-center gap-1 cursor-pointer">
            <span className="text-slate-400">Mode:</span>
            <select
              value={apiMode}
              onChange={e => setApiMode(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 focus:outline-none"
            >
              <option value="MOCK">MOCK (Local Latency)</option>
              <option value="LIVE">LIVE (FastAPI Backend)</option>
            </select>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <span className="text-slate-400">Edge Case Test:</span>
            <select
              value={simulatedEdgeCase}
              onChange={e => setSimulatedEdgeCase(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 focus:outline-none"
            >
              <option value="NONE">None (Normal Flow)</option>
              <option value="INVALID_CREDS">Invalid Credentials (Step 1)</option>
              <option value="EMPTY_SLOTS">Empty Availability (Step 2)</option>
              <option value="RECOVERABLE_409">409 Conflict Retry (Step 3)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Header Bar */}
      <header className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-teal-700 dark:text-teal-400">Outpatient Scheduling</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Rescheduling Educational Demo</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            <Database className="w-3 h-3 mr-1" /> Demo Synthetic data
          </span>
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-8">
        {/* Step Progress Bar */}
        <nav aria-label="Rescheduling Steps" className="mb-8">
          <ol className="flex items-center w-full justify-between text-xs sm:text-sm font-medium">
            {[
              { num: 1, label: 'Find' },
              { num: 2, label: 'Choose time' },
              { num: 3, label: 'Review' },
              { num: 4, label: 'Confirmation' },
            ].map(s => {
              const isCurrent = step === s.num;
              const isComplete = step > s.num;
              return (
                <li key={s.num} className="flex items-center space-x-2">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                    isCurrent ? 'bg-teal-600 text-white dark:bg-teal-500' :
                    isComplete ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' :
                    'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {isComplete ? '✓' : s.num}
                  </span>
                  <span className={`hidden sm:inline ${isCurrent ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Global Error Notice */}
        {apiError && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold">Unable to proceed</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* STEP 1: FIND APPOINTMENT */}
        {step === 1 && (
          <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold mb-2 focus:outline-none">
              Find Your Appointment
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Enter your appointment details to view and reschedule your time.
            </p>

            <form onSubmit={handleStep1Submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="apptId" className="block text-sm font-semibold mb-1">
                  Appointment ID
                </label>
                <input
                  id="apptId"
                  type="text"
                  value={apptId}
                  onChange={e => setApptId(e.target.value)}
                  onBlur={() => handleBlur('apptId')}
                  aria-describedby="apptId-help apptId-error"
                  placeholder="e.g. APT-12345"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.apptId && touched.apptId
                      ? 'border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[44px]`}
                />
                <p id="apptId-help" className="text-xs text-slate-500 mt-1">Format: AAA-##### (e.g. APT-12345)</p>
                {errors.apptId && touched.apptId && (
                  <p id="apptId-error" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.apptId}</p>
                )}
              </div>

              <div>
                <label htmlFor="accessCode" className="block text-sm font-semibold mb-1">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    id="accessCode"
                    type={showCode ? 'text' : 'password'}
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    onBlur={() => handleBlur('accessCode')}
                    aria-describedby="accessCode-error"
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-12 py-3 rounded-lg border ${
                      errors.accessCode && touched.accessCode
                        ? 'border-rose-500 bg-rose-50/30'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[44px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    aria-label={showCode ? 'Hide access code' : 'Show access code'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.accessCode && touched.accessCode && (
                  <p id="accessCode-error" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.accessCode}</p>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline min-h-[44px] px-1"
                  >
                    Try demo details
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => setShowDemoDetails(!showDemoDetails)}
                    className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline flex items-center min-h-[44px] px-1"
                  >
                    Demo credentials {showDemoDetails ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </button>
                </div>

                {showDemoDetails && (
                  <div className="mt-2 p-3 rounded bg-slate-100 dark:bg-slate-800 text-xs space-y-1 font-mono">
                    <p><span className="text-slate-500">Appt ID:</span> APT-12345</p>
                    <p><span className="text-slate-500">Access Code:</span> DEMO-PASS</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center min-h-[44px]"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
            </form>
          </section>
        )}

        {/* STEP 2: CHOOSE A NEW TIME */}
        {step === 2 && (
          <section className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-4 focus:outline-none">
                Current Appointment Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Clinician & Specialty</p>
                    <p className="font-semibold">{MOCK_CURRENT_APPT.clinician}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{MOCK_CURRENT_APPT.specialty}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Current Date & Time</p>
                    <p className="font-semibold">{MOCK_CURRENT_APPT.date} at {MOCK_CURRENT_APPT.time} ({MOCK_CURRENT_APPT.tz})</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{MOCK_CURRENT_APPT.type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold">Select New Appointment Time</h3>
                  <p className="text-xs text-slate-500">Time zone: Eastern Standard Time (EST)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedDate('2026-11-15'); setSelectedSlot(INITIAL_SLOTS[0]); }}
                    className="text-xs px-3 py-1.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-medium hover:bg-teal-100 min-h-[36px]"
                  >
                    Next available
                  </button>
                  <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-800">
                    {['ALL', 'MORNING', 'AFTERNOON'].map(p => (
                      <button
                        key={p}
                        onClick={() => setFilterPeriod(p)}
                        className={`text-xs px-2.5 py-1 rounded capitalize transition min-h-[36px] ${
                          filterPeriod === p
                            ? 'bg-white dark:bg-slate-700 font-semibold shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {p.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date Selection Tabs */}
              <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
                {['2026-11-15', '2026-11-16', '2026-11-17'].map(d => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                    className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition whitespace-nowrap min-h-[44px] ${
                      selectedDate === d
                        ? 'border-b-2 border-teal-600 text-teal-600 dark:text-teal-400 font-bold bg-teal-50/50 dark:bg-teal-950/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Time Slots Grid */}
              {filteredSlots.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium">No available slots for this date/filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Please select another date or clear your filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredSlots.map(slot => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg text-left border text-sm transition min-h-[44px] flex flex-col justify-between ${
                          !slot.available
                            ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 ring-2 ring-teal-500 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 hover:border-teal-500 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{slot.time}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                          {slot.available ? slot.period : 'Unavailable'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="py-3 px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition min-h-[44px]"
                >
                  {selectedSlot ? 'Continue to Review' : 'Select a time slot'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3: REVIEW CHANGES */}
        {step === 3 && (
          <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
              Review & Confirm Reschedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-400">Current Appointment</span>
                <p className="font-semibold text-lg mt-1">{MOCK_CURRENT_APPT.date}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{MOCK_CURRENT_APPT.time} ({MOCK_CURRENT_APPT.tz})</p>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <p><span className="text-slate-500">Clinician:</span> {MOCK_CURRENT_APPT.clinician}</p>
                  <p><span className="text-slate-500">Location:</span> {MOCK_CURRENT_APPT.location}</p>
                </div>
              </div>

              {/* New */}
              <div className="p-4 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">New Proposed Time</span>
                  <button onClick={() => setStep(2)} className="text-xs text-teal-600 hover:underline min-h-[44px]">Edit time</button>
                </div>
                <p className="font-semibold text-lg mt-1 text-teal-900 dark:text-teal-100">{selectedSlot?.date}</p>
                <p className="text-sm text-teal-800 dark:text-teal-300">{selectedSlot?.time} (EST)</p>
                <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800 text-xs space-y-1">
                  <p><span className="text-slate-500">Clinician:</span> {MOCK_CURRENT_APPT.clinician}</p>
                  <p><span className="text-slate-500">Location:</span> {MOCK_CURRENT_APPT.location}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleStep3Submit}
                className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition flex items-center min-h-[44px]"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
                Confirm demo reschedule
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && (
          <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
                Demo Appointment Rescheduled
              </h2>
              <p className="text-sm text-slate-500 mt-1">Confirmation Ref: <span className="font-mono font-semibold">{confirmationRef}</span></p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-left text-sm space-y-2 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Updated Appointment Details</p>
              <p><span className="text-slate-500">Date & Time:</span> {selectedSlot?.date} at {selectedSlot?.time} (EST)</p>
              <p><span className="text-slate-500">Clinician:</span> {MOCK_CURRENT_APPT.clinician}</p>
              <p><span className="text-slate-500">Location:</span> {MOCK_CURRENT_APPT.location}</p>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs text-left border border-amber-200 dark:border-amber-900">
              <strong>Notice:</strong> This is an educational prototype. No real clinical appointment was modified and no notification was sent.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleDownloadICS}
                className="w-full sm:w-auto px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center min-h-[44px]"
              >
                <Download className="w-4 h-4 mr-2" /> Download calendar event (.ics)
              </button>
              <button
                onClick={handleStartOver}
                className="w-full sm:w-auto px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition min-h-[44px]"
              >
                Start over
              </button>
            </div>
          </section>
        )}

        {/* Footer Emergency Disclaimer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="font-semibold text-slate-700 dark:text-slate-400 mb-1">Urgent Help Notice</p>
          <p>If you are experiencing a medical emergency, please dial 911 or visit the nearest emergency room immediately.</p>
        </footer>
      </main>
    </div>
  );
}
