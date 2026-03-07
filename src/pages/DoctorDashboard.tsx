import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, UserPlus, Activity, Users, Clipboard, Upload, UserMinus, X, Loader2, Trash2 } from 'lucide-react';
import { db, auth } from '../routes/firebase';
import {
  collection, query, onSnapshot, where, doc,
  updateDoc, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { uploadDocument } from '../../server/services/uploadDocument';
import type { MedicalDocument, TranslationConfig } from '../types';

interface DoctorProfile {
  displayName?: string;
}

interface PatientUser {
  id: string;
  displayName?: string;
  email?: string;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  role?: string;
}

const DEFAULT_OPTIONS: TranslationConfig = {
  language: "English",
  difficulty: "layman",
  detailLevel: "summary",
};

export default function DoctorDashboard() {
  const [reports, setReports] = useState<MedicalDocument[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<PatientUser[]>([]);
  const [myPatients, setMyPatients] = useState<PatientUser[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientUser | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const doctorUid = auth.currentUser?.uid;

  useEffect(() => {
    let unsubDocs: (() => void) | undefined;
    let unsubUnassigned: (() => void) | undefined;
    let unsubMyPatients: (() => void) | undefined;
    let unsubUser: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          setUserData((docSnap.data() as DoctorProfile) || null);
        });

        const qDocs = query(collection(db, "documents"), where("doctorId", "==", user.uid));
        unsubDocs = onSnapshot(qDocs, (snap) => {
          const sortedDocs = snap.docs
            .map(d => ({ id: d.id, ...d.data() })) as MedicalDocument[];

          sortedDocs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setReports(sortedDocs);
          setLoading(false);
        });

        const qUnassigned = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("assignedDoctorId", "==", null)
        );

        unsubUnassigned = onSnapshot(qUnassigned, (snap) => {
          setUnassignedPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientUser[]);
        });

        const qMyPatients = query(collection(db, "users"), where("assignedDoctorId", "==", user.uid));
        unsubMyPatients = onSnapshot(qMyPatients, (snap) => {
          setMyPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientUser[]);
        });

      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubAuth();
      unsubDocs?.();
      unsubUnassigned?.();
      unsubMyPatients?.();
      unsubUser?.();
    };
  }, [navigate]);

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;

    try {
      await deleteDoc(doc(db, "documents", reportId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the document.");
    }
  };

  const claimPatient = async (patientId: string) => {
    if (!doctorUid) return;
    await updateDoc(doc(db, "users", patientId), {
      assignedDoctorId: doctorUid,
      assignedDoctorName: userData?.displayName || "Dr. Specialist"
    });
  };

  const unassignPatient = async (patientId: string) => {
    if (!window.confirm("Are you sure you want to release this patient?")) return;

    await updateDoc(doc(db, "users", patientId), {
      assignedDoctorId: null,
      assignedDoctorName: null
    });

    if (selectedPatient?.id === patientId) {
      setSelectedPatient(null);
    }
  };

  const handleFileUploadForPatient = async (
    e: React.ChangeEvent<HTMLInputElement>,
    patientId: string,
    patientName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !doctorUid) return;

    setIsUploading(true);

    try {
      await uploadDocument({
        file,
        patientId,
        patientName,
        doctorId: doctorUid,
        uploadedBy: "doctor",
        options: DEFAULT_OPTIONS,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Could not upload and process the document.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {unassignedPatients.length > 0 && (
        <section className="bg-amber-50/80 p-6 rounded-[2rem] border border-amber-200 shadow-sm">
          <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4" /> New Patient Requests ({unassignedPatients.length})
          </h2>
          <div className="flex flex-wrap gap-4">
            {unassignedPatients.map(p => (
              <div key={p.id} className="bg-white px-5 py-3 rounded-2xl border border-amber-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="font-bold text-slate-900">{p.displayName || p.email}</span>
                <button
                  onClick={() => claimPatient(p.id)}
                  className="bg-amber-600 text-white text-[10px] px-4 py-2 rounded-lg font-black uppercase hover:bg-amber-700 transition-colors"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" /> My Care Team
          </h2>
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {myPatients.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-5 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPatient?.id === p.id
                      ? 'bg-indigo-50 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold capitalize ${
                      selectedPatient?.id === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.displayName?.charAt(0) || 'P'}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{p.displayName || p.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPatient.displayName}</h2>
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
                  <MessageSquare className="h-4 w-4" /> Message
                </Link>

                <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                  <Upload className="h-4 w-4" /> {isUploading ? 'Uploading...' : 'Add Report'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUploadForPatient(e, selectedPatient.id, selectedPatient.displayName || selectedPatient.email || "Patient")}
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
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
                      <div className="flex items-center gap-2">
                        <Link to={`/document/${report.id}?role=doctor`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">
                          Review
                        </Link>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" /> Patient Files
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-5 w-full">
                      <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
                        {report.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-900">{report.patientName}</p>
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
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
