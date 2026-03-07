import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../routes/firebase';
import { onAuthStateChanged } from 'firebase/auth'; 
import { ArrowLeft, Loader2 } from 'lucide-react';
import ChatInterface from '../components/ChatInterface'; // Adjust path as needed

export default function ChatPage() {
  const { roomId } = useParams(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Extract IDs from the RoomID string (room_DOCTORID_PATIENTID)
  const idParts = roomId?.split('_') || [];
  const doctorId = idParts[1];
  const patientId = idParts[2];
  
  const recipientName = searchParams.get('name') || 'Secure Chat';

  useEffect(() => {
  // This listener is the ONLY way to handle refreshes correctly
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
        setCurrentUser(user);
        setLoading(false); // Only stop loading once we know the user is here
        } else {
        // No user found after checking, send them home
        navigate('/login');
        }
    });
    return () => unsubscribe();
    }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Authorizing Session...</p>
      </div>
    );
  }

  if (!currentUser || !doctorId || !patientId) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-500">Invalid Chat Session. Please return to dashboard.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-bold underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </button>

        <ChatInterface 
          currentUserId={currentUser.uid}
          currentUserName={currentUser.displayName || 'User'}
          recipientName={recipientName}
          doctorId={doctorId}
          patientId={patientId}
          role={currentUser.uid === doctorId ? 'doctor' : 'patient'}
        />
      </div>
    </div>
  );
}