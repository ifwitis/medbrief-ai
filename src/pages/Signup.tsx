import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../routes/firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User, Stethoscope, Loader2, ArrowLeft } from 'lucide-react';

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

      // 2. Save the role in Firestore (Open rules allow this)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        createdAt: new Date()
      });

      // 3. Redirect to the correct portal immediately
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
      <Link to="/" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Create Secure Account</h2>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                role === 'patient' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'
              }`}
            >
              <User className={role === 'patient' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="text-xs font-bold mt-2 uppercase">Patient</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                role === 'doctor' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'
              }`}
            >
              <Stethoscope className={role === 'doctor' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="text-xs font-bold mt-2 uppercase">Doctor</span>
            </button>
          </div>

          <input type="text" placeholder="Full Name" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-lg flex justify-center items-center disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Log In</Link></p>
      </div>
    </div>
  );
}