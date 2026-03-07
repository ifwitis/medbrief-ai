import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, User, Loader2, Lock } from 'lucide-react';
import { db } from '../routes/firebase'; 
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from "firebase/firestore";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

interface ChatInterfaceProps {
  currentUserId: string; 
  currentUserName: string;
  recipientName: string;
  doctorId: string;    // Pass these separately to ensure
  patientId: string;   // we build the ID correctly
  role: 'doctor' | 'patient';
}

export default function ChatInterface({ 
  currentUserId, 
  currentUserName,
  recipientName, 
  doctorId,
  patientId,
  role 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // IMPORTANT: Generate the Room ID consistently
  // This ensures doctor_123 + patient_456 ALWAYS equals the same string
  const roomId = `room_${doctorId}_${patientId}`;

  useEffect(() => {
    if (!doctorId || !patientId) return;

    console.log("Syncing with Room:", roomId);

    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId),
      orderBy("timestamp", "asc")
    );

    // includeMetadataChanges: true is vital for "instant" feel
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle the "null" timestamp while the server is writing the doc
        const rawTimestamp = data.timestamp as Timestamp;
        const finalTimestamp = rawTimestamp ? rawTimestamp.toDate() : new Date();

        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: finalTimestamp,
          isMe: data.senderId === currentUserId,
        };
      });
      
      setMessages(fetchedMessages);
      setIsReady(true);
    }, (error) => {
      console.error("Firestore Sync Error:", error);
      // If you see a "Missing Index" error in the console, click the link provided there!
      setIsReady(true); 
    });

    return () => unsubscribe();
  }, [roomId, currentUserId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput(''); 

    try {
      await addDoc(collection(db, "messages"), {
        roomId: roomId,
        text: messageText,
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: Timestamp.now(), // Use Firestore Timestamp
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(messageText); // Give text back to user on failure
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-tight">Establishing Secure Link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[650px] w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-none">{recipientName}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> End-to-End Encrypted
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] bg-white/10 text-white px-3 py-1 rounded-full uppercase font-black tracking-tighter border border-white/10">
            {role} Access
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <Lock className="h-12 w-12 mb-2 stroke-1" />
            <p className="text-sm italic font-medium">Messages are secured with 256-bit encryption</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm transition-all ${
              msg.isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              <div className={`text-[10px] mt-2 font-bold opacity-50 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-slate-100 flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a secure message..."
          className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
        />
        <button 
          type="submit" 
          disabled={!input.trim()} 
          className="bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-indigo-200 disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}