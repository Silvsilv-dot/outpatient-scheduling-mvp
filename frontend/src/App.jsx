import { useState } from 'react';
import StaffDashboard from './components/StaffDashboard';
import ClinicianView from './components/ClinicianView';

export default function App() {
  const [activeTab, setActiveTab] = useState('staff');
  const clinicianId = import.meta.env.VITE_DEMO_CLINICIAN_ID || '';
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <span className="font-bold text-xl text-blue-700">Outpatient Scheduler MVP</span>
          <nav aria-label="Dashboard views" className="flex flex-wrap gap-2">
            {[['staff', 'Front-Desk Staff'], ['clinician', 'Clinician View']].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="py-6">{activeTab === 'staff' ? <StaffDashboard /> : <ClinicianView clinicianId={clinicianId} />}</main>
    </div>
  );
}
