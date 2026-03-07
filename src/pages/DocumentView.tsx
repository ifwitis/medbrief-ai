import React, { useState, useEffect } from 'react';
// Add this import at the very top of your file
import { pdfjs, Page, Document } from 'react-pdf';
// Use a reliable CDN link or the local node_modules path
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
import { useParams, useSearchParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {
  FileText, Settings, Languages, CheckCircle,
  AlertCircle, MessageSquare, Pill, Activity, Calendar,
  ShieldAlert, ClipboardCheck, Info
} from 'lucide-react';

// Use the interfaces we defined earlier
import { DocumentResult, TranslationConfig } from '../types';

export default function DocumentView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const location = useLocation();

  const [options, setOptions] = useState<TranslationConfig>({
    language: 'English',
    difficulty: 'layman',
    detailLevel: 'summary'
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (containerRef.current) {
      // Measure the actual space available in the UI
      setContainerWidth(containerRef.current.offsetWidth - 40); // minus padding
    }
  }, [loading]); // Run once loading finishes

  // Mock data representing the processed document results
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate AI Processing delay
    const timer = setTimeout(() => {
      setData({
        priorityItems: [
          { id: 1, text: "Elevated blood pressure (140/90)", clarity: "High", category: "Warning" },
          { id: 2, text: "Low Vitamin D levels (15 ng/mL)", clarity: "High", category: "Health Risk" }
        ],
        vagueDetails: [
          { id: 3, text: "Occasional fatigue noted in history", clarity: "Low" }
        ],
        caregiverSummary: {
          medications: [{ name: "Vitamin D3", dosage: "2000 IU", frequency: "Daily", purpose: "Bone health" }],
          lifestyle: ["Monitor salt intake", "Daily 20-minute walk"],
          appointments: [{ provider: "Primary Care", purpose: "BP Follow-up", date: "Next Week" }]
        }
      });
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48); // 48px for padding (p-6)
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 animate-pulse">AI is rephrasing facts and mapping layout...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* LEFT: VISUAL TRANSLATION VIEW (7 Columns) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Medical Report Summary</h1>
            <p className="text-slate-500 text-sm">Mapping facts from original layout</p>
          </div>
          <div className="flex gap-2">
            <select
              className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
              value={options.language}
              onChange={(e) => setOptions({...options, language: e.target.value})}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>Chinese (Real-time)</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {/* 1. SIMPLE HEADER CONTROLS */}
          <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
              disabled={pageNumber === 1}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 transition-colors"
            >
              Previous
            </button>

            <span className="text-sm font-medium text-slate-500">
              Page <span className="text-slate-900">{pageNumber}</span> of {numPages}
            </span>

            <button
              onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
              disabled={pageNumber === numPages}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 transition-colors"
            >
              Next
            </button>
          </div>

          {/* 2. PDF CONTAINER */}
          <div
            ref={containerRef}
            className="bg-slate-100 rounded-2xl border border-slate-200 flex justify-center p-4 min-h-[800px]"
          >
            <div className="shadow-xl bg-white">
              <Document
                file={location.state?.fileUrl || `/api/documents/${id}/file`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: STRUCTURED INSIGHTS (5 Columns) */}
      <div className="lg:col-span-5 space-y-6">

        {/* 1. CAREGIVER SUMMARY PILLARS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" /> Caregiver Summary
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <Pill className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Medication</p>
                {data.caregiverSummary.medications.map((m: any, i: number) => (
                  <p key={i} className="text-sm text-slate-700">{m.name} ({m.dosage}) - {m.purpose}</p>
                ))}
              </div>
            </div>
            <div className="flex gap-3 border-t pt-3">
              <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Lifestyle</p>
                <ul className="text-sm text-slate-700 list-disc list-inside">
                  {data.caregiverSummary.lifestyle.map((l: string, i: number) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            </div>
            <div className="flex gap-3 border-t pt-3">
              <Calendar className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Appointments</p>
                {data.caregiverSummary.appointments.map((a: any, i: number) => (
                  <p key={i} className="text-sm text-slate-700">{a.provider}: {a.purpose}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. CLINICAL BRIDGE (Doctor Tools) */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-slate-600" /> Messaging for Doctor
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Vague Details Clarification */}
            {data.vagueDetails.map((item: any) => (
              <div key={item.id} className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3" /> Needs Clarification
                </p>
                <p className="text-sm text-amber-900 mb-2">{item.text}</p>
                {role === 'patient' && (
                   <button className="w-full bg-white border border-amber-200 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors">
                     Add context for the doctor
                   </button>
                )}
              </div>
            ))}

            <div className="bg-white p-3 rounded-xl border border-slate-200">
               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Checklist for Visit</p>
               <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                 <input type="checkbox" className="rounded text-indigo-600" />
                 Confirm BP monitor accuracy
               </label>
               <label className="flex items-center gap-2 text-sm text-slate-700">
                 <input type="checkbox" className="rounded text-indigo-600" />
                 Discuss Vitamin D side effects
               </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
