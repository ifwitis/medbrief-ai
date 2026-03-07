import React, { useState, useEffect, useMemo } from 'react';
import { pdfjs, Page, Document as PdfDocument } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Activity,
  Calendar,
  ClipboardCheck,
  Info,
  Pill,
  AlertCircle,
} from 'lucide-react';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../routes/firebase';
import type { MedicalDocument, DocumentResult, TranslationConfig } from '../types';

export default function DocumentView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  const [docRecord, setDocRecord] = useState<MedicalDocument | null>(null);
  const [data, setData] = useState<DocumentResult | null>(null);

  const [options, setOptions] = useState<TranslationConfig>({
    language: 'English',
    difficulty: 'layman',
    detailLevel: 'summary',
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "documents", id), (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const record = { id: snap.id, ...snap.data() } as MedicalDocument;
      setDocRecord(record);

      if (record.processingOptions) {
        setOptions(record.processingOptions);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!docRecord || !id) return;

    const processDocument = async () => {
      try {
        setProcessing(true);

        const fileUrl =
          location.state?.fileUrl ||
          docRecord.fileMeta?.downloadURL ||
          docRecord.fileMeta?.storagePath ||
          `/api/documents/${id}/file`;

        const params = new URLSearchParams({
          fileUrl,
          language: options.language,
          difficulty: options.difficulty,
          detailLevel: options.detailLevel,
        });
        console.log("Processing doc with:", {
          id,
          fileUrl:
            location.state?.fileUrl ||
            docRecord?.fileMeta?.downloadURL ||
            docRecord?.fileMeta?.storagePath,
          options,
        });

        const res = await fetch(`/api/documents/${id}/process?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to process document: ${res.status}`);
        }

        const payload = await res.json();
        setData(payload.data as DocumentResult);
      } catch (err) {
        console.error(err);
      } finally {
        setProcessing(false);
      }
    };

    processDocument();
  }, [docRecord, id, location.state, options]);

  const selectedTranslation = useMemo(() => {
    return (
      data?.translations?.find(
        (t) => t.language.toLowerCase() === options.language.toLowerCase()
      ) || null
    );
  }, [data, options.language]);

  const priorityItems = useMemo(() => {
    return [...(data?.priorityItems || [])].sort((a, b) => a.rank - b.rank);
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 animate-pulse">Loading document...</p>
      </div>
    );
  }

  if (!docRecord) {
    return <div className="p-8 text-slate-500">Document not found.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{docRecord.name}</h1>
            <p className="text-slate-500 text-sm">
              {processing ? 'Reprocessing document with AI...' : 'Displaying current AI interpretation'}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
              value={options.language}
              onChange={(e) => setOptions({ ...options, language: e.target.value })}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>Chinese</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Difficulty</label>
            <select
              className="w-full rounded-lg border border-slate-200"
              value={options.difficulty}
              onChange={(e) =>
                setOptions({
                  ...options,
                  difficulty: e.target.value as "layman" | "medical",
                })
              }
            >
              <option value="layman">Layman</option>
              <option value="medical">Medical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Detail Level</label>
            <select
              className="w-full rounded-lg border border-slate-200"
              value={options.detailLevel}
              onChange={(e) =>
                setOptions({
                  ...options,
                  detailLevel: e.target.value as "summary" | "detailed",
                })
              }
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>

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

        <div
          ref={containerRef}
          className="bg-slate-100 rounded-2xl border border-slate-200 flex justify-center p-4 min-h-[800px]"
        >
          <div className="shadow-xl bg-white">
            <PdfDocument
              file={
                location.state?.fileUrl ||
                docRecord.fileMeta?.downloadURL ||
                docRecord.fileMeta?.storagePath ||
                `/api/documents/${id}/file`
              }
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </PdfDocument>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" /> Caregiver Summary
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="rounded-xl bg-slate-50 border p-3">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Summary</p>
              <p className="text-sm text-slate-700">{data?.summary || "No summary available."}</p>
            </div>

            <div className="flex gap-3">
              <Pill className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Medication</p>
                {(data?.caregiverSummary?.medications || []).length > 0 ? (
                  data?.caregiverSummary.medications.map((m, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {m.name} ({m.dosage}) - {m.frequency} - {m.purpose}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No medications extracted.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t pt-3">
              <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Lifestyle</p>
                {(data?.caregiverSummary?.lifestyle || []).length > 0 ? (
                  <ul className="text-sm text-slate-700 list-disc list-inside">
                    {data?.caregiverSummary.lifestyle.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No lifestyle items extracted.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t pt-3">
              <Calendar className="h-5 w-5 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Appointments</p>
                {(data?.caregiverSummary?.appointments || []).length > 0 ? (
                  data?.caregiverSummary.appointments.map((a, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {a.provider}: {a.purpose} ({a.date})
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No appointments extracted.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Priority Items</h3>
          </div>
          <div className="p-4 space-y-3">
            {priorityItems.length > 0 ? (
              priorityItems.map((item) => (
                <div key={item.id} className="rounded-xl border p-3 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-700 mt-1">{item.description}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      #{item.rank}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Clarity: {item.clarity}{item.category ? ` • ${item.category}` : ""}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 bg-white rounded-lg border p-2">
                    <span className="font-semibold">Source:</span> {item.source}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No priority items extracted.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-slate-600" /> Messaging for Doctor
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {(data?.vagueDetails || []).map((item) => (
              <div key={item.id} className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3" /> Needs Clarification
                </p>
                <p className="text-sm text-amber-900 mb-2">{item.text}</p>
                <p className="text-xs text-amber-700 mb-2">Source: {item.source}</p>
                {role === 'patient' && (
                  <button className="w-full bg-white border border-amber-200 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors">
                    Add context for the doctor
                  </button>
                )}
              </div>
            ))}

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Recommended Actions</p>
              {(data?.actions || []).length > 0 ? (
                data?.actions.map((action) => (
                  <div key={action.id} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        {action.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{action.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Source: {action.source}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No follow-up actions extracted.</p>
              )}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Translation</p>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {data?.translations?.find(
                  (t) => t.language.toLowerCase() === options.language.toLowerCase()
                )?.content || "No translation available."}
              </div>
            </div>

            {processing && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4" />
                Updating AI-generated interpretation...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
