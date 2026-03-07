import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../routes/firebase'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Stethoscope, Loader2, ArrowLeft, Mail, Lock, UserCircle } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Firebase Auth Profile with Name
      await updateProfile(user, { displayName: name });

      // 3. Prepare Firestore Document
      // Note: assignedDoctorId is set to null for patients so they appear in the Doctor's 'Discovery' list
      const userData: any = {
        uid: user.uid,
        displayName: name,
        email: email,
        role: role,
        createdAt: serverTimestamp(),
      };

      if (role === 'patient') {
        userData.assignedDoctorId = null;
        userData.assignedDoctorName = null;
      }

      // 4. Save to Firestore users collection
      await setDoc(doc(db, "users", user.uid), userData);

      // 5. Redirect to the correct portal immediately
      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (error: any) {
      console.error("Signup failed:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Link 
        to="/" 
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Get Started</h2>
          <p className="text-slate-500 mt-2 font-medium">Create your secure medical account</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                role === 'patient' 
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100' 
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <User className={`h-6 w-6 ${role === 'patient' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${role === 'patient' ? 'text-indigo-700' : 'text-slate-500'}`}>
                Patient
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                role === 'doctor' 
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100' 
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <Stethoscope className={`h-6 w-6 ${role === 'doctor' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${role === 'doctor' ? 'text-indigo-700' : 'text-slate-500'}`}>
                Doctor
              </span>
            </button>
          </div>

          {/* Input Fields */}
          <div className="relative">
            <UserCircle className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Create Password" 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex justify-center items-center disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 font-medium">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}