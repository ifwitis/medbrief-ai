import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, User, Bell } from 'lucide-react';
import { db } from '../routes/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export default function DoctorDashboard() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Ordering by creation time so newest patients are at the top
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinical Queue</h1>
          <p className="text-slate-500 mt-1">Review active patient submissions and provide AI-assisted clarity.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 font-bold text-sm">
          <Bell className="h-4 w-4" /> {reports.length} Actions Required
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between shadow-sm gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-5 w-full">
              <div className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-100">
                {report.patientName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl text-slate-900">{report.patientName}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1 font-medium"><FileText className="h-4 w-4" /> {report.name}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Awaiting Review</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Link 
                to={`/document/${report.id}?role=doctor`} 
                className="flex-1 md:flex-none text-center px-8 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Review
              </Link>
              <Link 
                to={`/chat/room_doctor_uid_here_${report.patientId}?role=doctor&name=${encodeURIComponent(report.patientName)}`} 
                className="flex-1 md:flex-none text-center px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100"
              >
                <MessageSquare className="h-4 w-4" /> Chat
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}