import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, User, Loader2 } from 'lucide-react';
// Import the db we just set up in your routes folder
import { db } from '../routes/firebase'; 
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
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
  currentUserId: string;   // Now your internal ID (e.g., 'dr_1')
  currentUserName: string; // The person currently logged in
  recipientName: string;   // The person they are talking to
  roomId: string;          // Combined ID (e.g., 'dr1_pat1')
  role: 'doctor' | 'patient';
}

export default function ChatInterface({ 
  currentUserId, 
  currentUserName,
  recipientName, 
  roomId, 
  role 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Listen for Live Messages from Firestore
  useEffect(() => {
    // Query: Find messages for this room, sort by time
    const q = query(
      collection(db, "messages"),
      where("room_id", "==", roomId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        // Firebase timestamps need to be converted to JS Dates
        const firestoreTime = data.createdAt as Timestamp;
        
        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: firestoreTime ? firestoreTime.toDate() : new Date(),
          isMe: data.senderId === currentUserId,
        };
      });
      
      setMessages(fetchedMessages);
      setIsReady(true);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [roomId, currentUserId]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message Function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput(''); // Clear input immediately for snappy UI

    try {
      await addDoc(collection(db, "messages"), {
        room_id: roomId,
        text: messageText,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: serverTimestamp(), // Use Firebase server time
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-slate-500 text-sm font-medium">Connecting to Secure Firebase...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-inner">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{recipientName}</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              SECURE CHAT
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-tighter font-bold">
            {role}
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-xs text-slate-400 italic">No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm transition-all ${
              msg.isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="leading-relaxed">{msg.text}</p>
              <div className={`text-[9px] mt-1.5 font-medium opacity-60 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message securely..."
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={!input.trim()}
          className="bg-indigo-600 disabled:bg-slate-300 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}