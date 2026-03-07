import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Document } from '../types';

export default function PatientDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch mock documents
    fetch('/api/patients/p1/documents')
      .then(res => res.json())
      .then(data => setDocuments(data.documents || []))
      .catch(err => console.error("Failed to fetch documents", err));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log("Upload success:", data);
      
      // Add mock document to list
      setDocuments(prev => [
        { id: `doc-${Date.now()}`, name: file.name, date: new Date().toISOString().split('T')[0], status: 'processing' },
        ...prev
      ]);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage your medical reports and view AI summaries.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-50 p-4 rounded-full">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload a Medical Report</h3>
          <p className="text-sm text-slate-500 mb-6">
            Upload PDF, DOCX, or images of your medical reports. Our AI will process it and prepare a summary for you and your doctor.
          </p>
          <label className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors inline-block">
            <span>{isUploading ? 'Uploading...' : 'Select File'}</span>
            <input 
              type="file" 
              className="sr-only" 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <Link to={`/document/${doc.id}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <File className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-500">Uploaded on {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Clock className="h-3 w-3" /> Processing
                      </span>
                    )}
                    {doc.status === 'needs_review' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        <AlertCircle className="h-3 w-3" /> Doctor Reviewing
                      </span>
                    )}
                    {(!doc.status || doc.status === 'ready') && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
            {documents.length === 0 && (
              <li className="p-8 text-center text-slate-500 text-sm">
                No documents uploaded yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
