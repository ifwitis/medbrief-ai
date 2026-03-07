import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Languages, 
  ArrowRight, 
  Loader2, 
  LogOut, 
  Activity 
} from 'lucide-react';
import { auth, db } from '../routes/firebase'; // Ensure this path is correct
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 1. Listen for Auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle "Enter Portal" Logic
  const handlePortalAccess = async () => {
    setIsChecking(true);
    
    if (user) {
      try {
        // Fetch user data from Firestore to get their role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Redirect based on role: /doctor or /patient
          navigate(userData.role === 'doctor' ? '/doctor' : '/patient');
        } else {
          // User exists in Auth but not Firestore (cleanup case)
          navigate('/signup');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        alert("Failed to access portal. Please try again.");
      }
    } else {
      // If not logged in, go to signup
      navigate('/signup');
    }
    setIsChecking(false);
  };

  // 3. Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center min-h-[80vh]">
      <div className="max-w-4xl space-y-8 px-6">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest shadow-sm">
          <ShieldCheck className="h-4 w-4" /> HIPAA Compliant Architecture
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl leading-[1.1]">
          Understand medical reports with <span className="text-indigo-600">AI Clarity</span>
        </h1>
        
        <p className="text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
          MedConnect AI bridges the gap between complex medical jargon and patient understanding. 
          Upload reports, get summaries, and chat with your doctor in an encrypted environment.
        </p>
        
        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <button
            onClick={handlePortalAccess}
            disabled={isChecking}
            className="flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-10 py-5 text-xl font-bold text-white shadow-xl hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isChecking ? (
              <>
                <Loader2 className="animate-spin h-6 w-6" />
                Checking...
              </>
            ) : (
              <>
                {user ? "Go to My Portal" : "Enter Secure Portal"}
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
          
          {user ? (
            <button
              onClick={handleSignOut}
              className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-red-600 shadow-sm ring-2 ring-inset ring-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          ) : (
            <Link
              to="/signup"
              className="rounded-2xl bg-white px-10 py-5 text-lg font-bold text-slate-900 shadow-sm ring-2 ring-inset ring-slate-200 hover:bg-slate-50 hover:scale-[1.02] transition-all flex items-center justify-center"
            >
              Create Account
            </Link>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-left">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
              <FileText className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Smart Summaries</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our AI extracts prioritized items and clarifies vague details into easy-to-read, actionable checklists.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
              <Activity className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Encrypted Chat</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Discuss results directly with your physician through our secure, real-time Firebase-powered channel.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
              <Languages className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Multilingual</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Instantly translate complex reports into over 20 languages to ensure absolute clarity for every patient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}