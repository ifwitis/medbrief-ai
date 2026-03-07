import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Patient } from '../types';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    // Fetch mock patients
    fetch('/api/doctors/d1/dashboard')
      .then(res => res.json())
      .then(data => setPatients(data.patients || []))
      .catch(err => console.error("Failed to fetch patients", err));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Dashboard</h1>
        <p className="text-slate-500 mt-1">Review patient documents and refine AI recommendations.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 px-4 py-5 sm:p-6">
          <dt className="truncate text-sm font-medium text-slate-500">Total Patients</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            {patients.length}
          </dd>
        </div>
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 px-4 py-5 sm:p-6">
          <dt className="truncate text-sm font-medium text-slate-500">Pending Reviews</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-amber-600 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            {patients.reduce((acc, p) => acc + p.pendingActions.length, 0)}
          </dd>
        </div>
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 px-4 py-5 sm:p-6">
          <dt className="truncate text-sm font-medium text-slate-500">Approved Reports</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-emerald-600 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            12
          </dd>
        </div>
      </div>

      {/* Patient List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Action Required</h2>
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <li key={patient.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">{patient.name}</h3>
                      <p className="text-xs text-slate-500">ID: {patient.id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {patient.pendingActions.map((action, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{action.action}</p>
                          <p className="text-xs text-slate-500 mt-1">Document ID: {action.docId}</p>
                        </div>
                      </div>
                      <Link
                        to={`/document/${action.docId}?role=doctor`}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              </li>
            ))}
            {patients.length === 0 && (
              <li className="p-8 text-center text-slate-500 text-sm">
                No pending actions.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
