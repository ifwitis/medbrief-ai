import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, FileText, UserPlus, Activity, Users, 
  Clipboard, Upload, UserMinus, X, Loader2, Copy, Search, Globe, Trash2 
} from 'lucide-react';
import { db, auth } from '../routes/firebase';
import { 
  collection, query, onSnapshot, where, doc, 
  updateDoc, addDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function DoctorDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<any[]>([]);
  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]); 
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const doctorUid = auth.currentUser?.uid;

  // --- DELETE LOGIC ---
  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this report?")) return;
    
    try {
      await deleteDoc(doc(db, "documents", reportId));
      // No need to manually update state, onSnapshot handles the real-time sync
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete report. Please try again.");
    }
  };

  useEffect(() => {
    let unsubDocs: () => void;
    let unsubRequests: () => void;
    let unsubMyPatients: () => void;
    let unsubAllPatients: () => void;
    let unsubUser: () => void;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Listen to Doctor's own profile
        unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          setUserData(docSnap.data());
        });

        // 2. Get ALL reports assigned to this doctor
        const qDocs = query(collection(db, "documents"), where("doctorId", "==", user.uid));
        unsubDocs = onSnapshot(qDocs, (snap) => {
          const sortedDocs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setReports(sortedDocs);
          setLoading(false); 
        });

        const qRequests = query(collection(db, "users"), where("role", "==", "patient"), where("requestedDoctorIds", "array-contains", user.uid));
        unsubRequests = onSnapshot(qRequests, (snap) => {
          const pendingRequests = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((p: any) => !p.assignedDoctorId);
          setUnassignedPatients(pendingRequests);
        });

        const qMyPatients = query(collection(db, "users"), where("assignedDoctorId", "==", user.uid));
        unsubMyPatients = onSnapshot(qMyPatients, (snap) => {
          setMyPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qAllPatients = query(collection(db, "users"), where("role", "==", "patient"));
        unsubAllPatients = onSnapshot(qAllPatients, (snap) => {
          setAllPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubAuth();
      if (unsubDocs) unsubDocs();
      if (unsubRequests) unsubRequests();
      if (unsubMyPatients) unsubMyPatients();
      if (unsubAllPatients) unsubAllPatients();
      if (unsubUser) unsubUser();
    };
  }, [navigate]);

  const claimPatient = async (patientId: string) => {
    if (!doctorUid) return;
    await updateDoc(doc(db, "users", patientId), {
      assignedDoctorId: doctorUid,
      assignedDoctorName: userData?.displayName || "Dr. Specialist",
      requestedDoctorIds: [] 
    });
    setSearchTerm(""); 
  };

  const unassignPatient = async (patientId: string) => {
    if (!window.confirm("Are you sure you want to release this patient?")) return;
    await updateDoc(doc(db, "users", patientId), {
      assignedDoctorId: null,
      assignedDoctorName: null
    });
    if (selectedPatient?.id === patientId) setSelectedPatient(null);
  };

  const handleFileUploadForPatient = async (e: React.ChangeEvent<HTMLInputElement>, patientId: string, patientName: string) => {
    const file = e.target.files?.[0];
    if (!file || !doctorUid) return;
    setIsUploading(true);
    
    await addDoc(collection(db, "documents"), {
      name: file.name,
      patientId: patientId,
      patientName: patientName,
      doctorId: doctorUid, 
      status: 'Ready',
      createdAt: serverTimestamp(),
      uploadedBy: 'doctor'
    });
    
    setIsUploading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
        <p className="text-slate-500 font-medium">Accessing Clinical Portal...</p>
      </div>
    );
  }

  const patientReports = reports.filter(r => r.patientId === selectedPatient?.id);
  const discoverablePatients = allPatients.filter(p => {
    const isUnassigned = !p.assignedDoctorId;
    const matchesSearch = searchTerm === "" || 
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return isUnassigned && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Doctor ID Bar */}
      <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">Your Doctor ID (Share with patients):</span>
        <div className="flex items-center gap-2">
          <code className="bg-slate-100 px-3 py-1 rounded text-sm font-bold text-slate-800">
            {doctorUid}
          </code>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(doctorUid || "");
              alert("Doctor ID copied to clipboard!");
            }}
            className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Discovery Section */}
      {unassignedPatients.length > 0 && (
        <section className="bg-amber-50/80 p-6 rounded-[2rem] border border-amber-200 shadow-sm">
          <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4" /> Pending Patient Requests ({unassignedPatients.length})
          </h2>
          <div className="flex flex-wrap gap-4">
            {unassignedPatients.map(p => (
              <div key={p.id} className="bg-white px-5 py-3 rounded-2xl border border-amber-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="font-bold text-slate-900">{p.displayName || p.email}</span>
                <button 
                  onClick={() => claimPatient(p.id)} 
                  className="bg-amber-600 text-white text-[10px] px-4 py-2 rounded-lg font-black uppercase hover:bg-amber-700 transition-colors"
                >
                  Accept Request
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          
          {/* My Care Team */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" /> My Care Team
            </h2>
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {myPatients.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPatient(p)}
                    className={`p-5 cursor-pointer transition-all flex items-center justify-between ${selectedPatient?.id === p.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold capitalize ${selectedPatient?.id === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {p.displayName?.charAt(0) || 'P'}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{p.displayName || p.email}</span>
                    </div>
                  </div>
                ))}
                {myPatients.length === 0 && (
                  <p className="p-10 text-center text-slate-400 text-sm italic">No patients assigned yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Directory */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" /> Patient Directory
            </h2>
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm p-4">
              <div className="relative mb-4">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search to add patient manually..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                {discoverablePatients.slice(0, 10).map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{p.displayName || 'Unnamed Patient'}</span>
                      <span className="text-xs text-slate-500">{p.email}</span>
                    </div>
                    <button 
                      onClick={() => claimPatient(p.id)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                    >
                      Override & Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPatient.displayName || 'Unnamed Patient'}</h2>
                  <p className="text-slate-400 text-sm">{selectedPatient.email}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border-b flex flex-wrap gap-3">
                <Link 
                  to={`/chat/room_${doctorUid}_${selectedPatient.id}?name=${encodeURIComponent(selectedPatient.displayName || 'Patient')}`}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> Message Patient
                </Link>
                
                <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                  <Upload className="h-4 w-4" /> {isUploading ? 'Uploading...' : 'Add Report'}
                  <input type="file" className="hidden" onChange={(e) => handleFileUploadForPatient(e, selectedPatient.id, selectedPatient.displayName || 'Patient')} disabled={isUploading} />
                </label>

                <button 
                  onClick={() => unassignPatient(selectedPatient.id)}
                  className="ml-auto text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" /> Release
                </button>
              </div>

              <div className="p-6 flex-1">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Patient Records
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {patientReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <Clipboard className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-bold text-sm text-slate-900">{report.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            {report.uploadedBy === 'doctor' ? 'Added by you' : 'Added by patient'}
                          </p>
                        </div>
                      </div>
                      <Link to={`/document/${report.id}?role=doctor`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
                        Review
                      </Link>
                    </div>
                  ))}
                  {patientReports.length === 0 && <p className="text-sm text-slate-400 italic">No records found.</p>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" /> Master Clinical Queue
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-5 w-full">
                      <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
                        {report.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-900">{report.patientName || 'Unnamed Patient'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clipboard className="h-3 w-3" /> {report.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Link 
                        to={`/document/${report.id}?role=doctor`} 
                        className="flex-1 md:flex-none text-center px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-300 text-center">
                    <p className="text-slate-500 font-medium">Your clinical queue is clear.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}