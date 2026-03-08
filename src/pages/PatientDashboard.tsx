import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, File, MessageSquare, Stethoscope, ShieldCheck, Activity, Loader2, Clipboard, UserPlus } from 'lucide-react';
import { auth, db } from '../routes/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function PatientDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [doctorSearchId, setDoctorSearchId] = useState("");
  const [requesting, setRequesting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    let unsubUser: () => void;
    let unsubDocs: () => void;
    let unsubDoctors: () => void;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          setUserData(docSnap.data());
          setLoading(false); 
        });

        const qDocs = query(collection(db, "documents"), where("patientId", "==", user.uid));
        unsubDocs = onSnapshot(qDocs, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setDocuments(docs);
        });

        const qDoctors = query(collection(db, "users"), where("role", "==", "doctor"));
        unsubDoctors = onSnapshot(qDoctors, (snapshot) => {
          setAllDoctors(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } else {
        navigate('/login');
      }
    });

    return () => { 
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubDocs) unsubDocs();
      if (unsubDoctors) unsubDoctors();
    };
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser; 
    if (!file || !user) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      // NEW: Smart error handling that reads the message from the server
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server upload failed');
      }

      const result = await response.json();

      if (result.structuredData) {
        const docRef = await addDoc(collection(db, "documents"), {
          name: file.name,
          patientId: user.uid,
          patientName: userData?.displayName || user.email?.split('@')[0],
          doctorId: userData?.assignedDoctorId || null,
          status: 'Ready',
          uploadedBy: 'patient',
          createdAt: serverTimestamp(),
          aiSummary: result.structuredData
        });

        const fileUrl = URL.createObjectURL(file);
        navigate(`/document/${docRef.id}?role=patient`, { 
          state: { 
            initialData: result.structuredData,
            fileUrl: fileUrl 
          } 
        });
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      // Alerts the specific error message sent from the server!
      alert(err.message || "Failed to analyze the document. Is your server running?");
    } finally {
      setIsUploading(false);
    }
  };

  const requestDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorSearchId.trim() || !auth.currentUser) return;
    
    setRequesting(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        requestedDoctorIds: arrayUnion(doctorSearchId.trim())
      });
      setDoctorSearchId("");
      alert("Request sent to doctor!");
    } catch (err) {
      console.error("Error requesting doctor:", err);
      alert("Failed to send request.");
    } finally {
      setRequesting(false);
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

  const requestedIds = userData?.requestedDoctorIds || [];
  const availableDoctors = allDoctors.filter(doc => !requestedIds.includes(doc.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="pt-2 pb-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hello, {userData?.displayName || userData?.email?.split('@')[0] || "Patient"} 👋
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">
          Welcome to your secure health portal. Here is a summary of your care.
        </p>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex items-center gap-5 z-10">
          <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Stethoscope className="text-indigo-400 h-8 w-8" />
          </div>
          <div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Primary Care</p>
            <h2 className="text-2xl font-bold">
              {userData?.assignedDoctorName || "No Doctor Assigned"}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {userData?.assignedDoctorId ? "Connected & Active" : "Request a doctor below to share your records."}
            </p>
          </div>
        </div>

        {userData?.assignedDoctorId && (
          <Link 
            to={`/chat/room_${userData.assignedDoctorId}_${auth.currentUser?.uid}?name=${encodeURIComponent(userData?.assignedDoctorName || 'Doctor')}`}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-3 shadow-lg active:scale-95 z-10"
          >
            <MessageSquare className="h-5 w-5" /> Message Doctor
          </Link>
        )}
      </div>

      {!userData?.assignedDoctorId && (
        <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Connect with a Doctor
            </h3>
            <p className="text-sm text-indigo-700/70 mt-1">Select a doctor to request care.</p>
          </div>
          
          <form onSubmit={requestDoctor} className="flex w-full md:w-auto gap-2">
            <select 
              value={doctorSearchId}
              onChange={(e) => setDoctorSearchId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 bg-white text-slate-700 font-medium"
              required
            >
              <option value="" disabled>Select a doctor...</option>
              {availableDoctors.length > 0 ? (
                availableDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.displayName || doctor.email}
                  </option>
                ))
              ) : (
                <option value="" disabled>No new doctors available</option>
              )}
            </select>
            <button 
              type="submit" 
              disabled={requesting || !doctorSearchId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md disabled:bg-indigo-400 whitespace-nowrap"
            >
              {requesting ? 'Sending...' : 'Request'}
            </button>
          </form>
        </div>
      )}

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
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
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
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <Link to={`/document/${doc.id}?role=patient`} className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-500 group-hover:text-indigo-600">
                    <Clipboard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {doc.uploadedBy === 'doctor' ? `Sent by ${userData?.assignedDoctorName}` : 'Self-uploaded'}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="hidden md:inline text-[10px] text-slate-400 font-bold uppercase">
                    {doc.createdAt?.toDate().toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">
                    Ready
                  </span>
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