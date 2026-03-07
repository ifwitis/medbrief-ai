import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FileText, Settings, Languages, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { StructuredData, TranslationOptions } from '../types';

export default function DocumentView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';
  
  const [options, setOptions] = useState<TranslationOptions>({
    language: 'English',
    difficulty: 'layman',
    detailLevel: 'summary'
  });

  // Mock data for the document
  const [data] = useState<StructuredData>({
    priorityItems: [
      { id: 1, text: "Elevated blood pressure (140/90)", clarity: "High" },
      { id: 2, text: "Low Vitamin D levels (15 ng/mL)", clarity: "High" },
      { id: 3, text: "Mild anemia", clarity: "Medium" }
    ],
    vagueDetails: [
      { id: 4, text: "Patient reports occasional fatigue", clarity: "Low" },
      { id: 5, text: "Slight discomfort in lower back", clarity: "Low" }
    ]
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Document Viewer & Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Review</h1>
            <p className="text-slate-500 mt-1">ID: {id}</p>
          </div>
          {role === 'doctor' && (
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              Approve & Send to Patient
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-slate-400" />
            <select 
              className="text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={options.language}
              onChange={(e) => setOptions({...options, language: e.target.value})}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>Chinese</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <select 
              className="text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={options.difficulty}
              onChange={(e) => setOptions({...options, difficulty: e.target.value as any})}
            >
              <option value="layman">Layman Terms</option>
              <option value="medical">Medical Terms</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <select 
              className="text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={options.detailLevel}
              onChange={(e) => setOptions({...options, detailLevel: e.target.value as any})}
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>

        {/* Original Document Placeholder */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 h-[600px] flex items-center justify-center relative overflow-hidden">
          <div className="text-center p-6">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Original Document Viewer</p>
            <p className="text-slate-400 text-sm mt-2">The uploaded PDF/Image will be displayed here.</p>
          </div>
        </div>
      </div>

      {/* Right Column: AI Analysis & Actions */}
      <div className="space-y-6">
        {/* Priority Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Priority Items
            </h3>
          </div>
          <ul className="divide-y divide-slate-100 p-4 space-y-3">
            {data.priorityItems.map(item => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 mt-1">
                    Clarity: {item.clarity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Vague Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Vague Details
            </h3>
          </div>
          <ul className="divide-y divide-slate-100 p-4 space-y-3">
            {data.vagueDetails.map(item => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                  {role === 'patient' && (
                    <button className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1 hover:text-indigo-700">
                      <MessageSquare className="h-3 w-3" /> Ask Doctor
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Doctor's Recommended Actions (Editable if Doctor) */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-100/50 px-4 py-3 border-b border-indigo-100">
            <h3 className="font-semibold text-indigo-900">Recommended Actions</h3>
          </div>
          <div className="p-4">
            {role === 'doctor' ? (
              <textarea 
                className="w-full text-sm rounded-xl border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500 p-3 h-32"
                defaultValue="- Schedule follow-up for blood pressure monitoring.&#10;- Start Vitamin D supplement (2000 IU daily)."
              />
            ) : (
              <ul className="list-disc list-inside text-sm text-indigo-900 space-y-2">
                <li>Schedule follow-up for blood pressure monitoring.</li>
                <li>Start Vitamin D supplement (2000 IU daily).</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
