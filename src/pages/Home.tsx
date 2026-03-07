import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Languages } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Understand your medical reports with <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          MedConnect AI bridges the gap between complex medical jargon and patient understanding. 
          Upload your reports, get clear summaries, and communicate effectively with your doctor.
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <Link
            to="/patient"
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
          >
            I am a Patient
          </Link>
          <Link
            to="/doctor"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
          >
            I am a Doctor
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Summaries</h3>
            <p className="text-slate-600 text-sm">AI extracts prioritized items and clarifies vague details into easy-to-read checklists.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-emerald-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Doctor Approved</h3>
            <p className="text-slate-600 text-sm">Doctors review and refine AI-generated recommended actions before you see them.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-amber-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Languages className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Multilingual</h3>
            <p className="text-slate-600 text-sm">Translate your reports into English, Spanish, Chinese, and more with a single click.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
