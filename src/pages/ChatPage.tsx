import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../routes/firebase';
import { 
  collection, addDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { Send, ArrowLeft, Lock } from 'lucide-react';

export default function ChatPage() {
  const { roomId } = useParams(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const userName = searchParams.get('name') || 'User';

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: userName,
        roomId: roomId,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
        <div className="text-center">
          <h2 className="font-bold text-slate-900">{userName}</h2>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest justify-center">
            <Lock className="h-3 w-3" /> Secure Session
          </div>
        </div>
        <div className="w-10"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.senderId === auth.currentUser?.uid ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border'}`}>
              <p className="text-sm font-medium">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 bg-white">
        <input 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          className="flex-1 px-4 py-3 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
          placeholder="Type a message..." 
        />
        <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-200">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}