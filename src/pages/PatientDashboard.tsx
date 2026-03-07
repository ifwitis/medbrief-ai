import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, File, MessageSquare, Stethoscope, ShieldCheck, Activity, Loader2, Clipboard, Trash2 } from 'lucide-react';
import { auth, db } from '../routes/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { uploadDocument } from '../../server/services/uploadDocument';
import type { MedicalDocument, TranslationConfig } from '../types';

interface UserProfile {
  displayName?: string;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
}

const DEFAULT_OPTIONS: TranslationConfig = {
  language: "English",
  difficulty: "layman",
  detailLevel: "summary",
};

export default function PatientDashboard() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubUser: (() => void) | undefined;
    let unsubDocs: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          setUserData((docSnap.data() as UserProfile) || null);
          setLoading(false);
        });

        const q = query(collection(db, "documents"), where("patientId", "==", user.uid));
        unsubDocs = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as MedicalDocument[];

          docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setDocuments(docs);
        });
      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubAuth();
      unsubUser?.();
      unsubDocs?.();
    };
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser;
    if (!file || !user) return;

    setIsUploading(true);

    try {
      await uploadDocument({
        file,
        patientId: user.uid,
        patientName: userData?.displayName || user.email?.split('@')[0] || "Patient",
        doctorId: userData?.assignedDoctorId || null,
        uploadedBy: "patient",
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

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this record? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "documents", docId));
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Could not delete the document. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
        <p className="text-slate-500 font-medium">Loading your health portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="flex items-center gap-5 z-10">
          <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Stethoscope className="text-indigo-400 h-8 w-8" />
          </div>
          <div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Primary Care</p>
            <h2 className="text-2xl font-bold">
              {userData?.assignedDoctorName || "Assigning Physician..."}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {userData?.assignedDoctorId ? "Connected & Active" : "Searching for available specialist"}
            </p>
          </div>
        </div>

        {userData?.assignedDoctorId && (
          <Link
            to={`/chat/room_${userData.assignedDoctorId}_${auth.currentUser?.uid}?name=${encodeURIComponent(userData?.assignedDoctorName || 'Doctor')}`}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-3 shadow-lg active:scale-95"
          >
            <MessageSquare className="h-5 w-5" /> Message Doctor
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group relative">
          <div className="bg-indigo-50 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Add Medical Record</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-[200px]">Upload lab results, X-rays, or clinical notes.</p>

          <label className={`cursor-pointer px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            isUploading ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
          }`}>
            {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
            {isUploading ? 'Syncing...' : 'Browse Files'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </label>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-6 bg-slate-50/50 border-b flex justify-between items-center">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" /> Medical History
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Encrypted
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {documents.map((docItem) => (
              <div key={docItem.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <Link to={`/document/${docItem.id}?role=patient`} className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                    <Clipboard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">{docItem.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {docItem.uploadedBy === 'doctor' ? `Sent by ${userData?.assignedDoctorName}` : 'Self-uploaded'}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="hidden md:inline text-[10px] text-slate-400 font-bold uppercase">
                    {docItem.createdAt?.toDate?.()?.toLocaleDateString?.()}
                  </span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">
                    {docItem.status}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(docItem.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
                <div className="bg-slate-50 p-4 rounded-full">
                  <File className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium italic">No documents in your secure vault.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
