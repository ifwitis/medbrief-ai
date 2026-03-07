import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, MessageSquare, Stethoscope, ShieldCheck, Activity } from 'lucide-react';
import { auth, db } from '../routes/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function PatientDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const user = auth.currentUser;

  // In a real app, this would be fetched from the user's Firestore profile
  const myDoctor = { id: "doctor_uid_here", name: "Dr. Smith" };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "documents"), where("patientId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    
    await addDoc(collection(db, "documents"), {
      name: file.name,
      patientId: user.uid,
      patientName: user.displayName || user.email?.split('@')[0] || "Patient",
      status: 'Ready',
      createdAt: serverTimestamp(),
      doctorId: myDoctor.id
    });
    
    setIsUploading(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Health Dashboard</h1>
          <div className="flex items-center gap-2 text-indigo-600 mt-2 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
            <Stethoscope className="h-4 w-4" /> Your Doctor: {myDoctor.name}
          </div>
        </div>
        <Link 
          to={`/chat/room_${myDoctor.id}_${user?.uid}?role=patient&name=${encodeURIComponent(myDoctor.name)}`}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
        >
          <MessageSquare className="h-5 w-5" /> Message {myDoctor.name}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-indigo-300 transition-colors">
          <div className="bg-indigo-50 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform">
            <Upload className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Upload Records</h3>
          <p className="text-sm text-slate-500 mb-6">PDF, JPEG, or PNG supported</p>
          <label className="cursor-pointer bg-slate-900 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
            {isUploading ? 'Syncing...' : 'Choose File'}
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-500" /> Recent Reports</span>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <ul className="divide-y divide-slate-100">
            {documents.length > 0 ? documents.map((doc) => (
              <li key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <Link to={`/document/${doc.id}?role=patient`} className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-600"><File className="h-6 w-6" /></div>
                  <div>
                    <p className="font-bold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Encrypted & Verified</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ready</span>
                </div>
              </li>
            )) : (
              <li className="p-20 text-center text-slate-400 font-medium">No documents uploaded yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}