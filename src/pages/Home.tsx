import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useRef, ChangeEvent } from 'react';
import { FileText, ShieldCheck, Languages, Upload} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      // Important: Use 'document' as the key because your server expects upload.single("document")
      formData.append('document', file);

      try {
        const response = await fetch('http://localhost:3000/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.structuredData) {
          // Send the user to the view page and pass the AI data in the "state"
          navigate('/document/new-upload', { 
            state: { initialData: result.structuredData } 
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to analyze document. Is the server running?");
      }
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Understand your medical reports with <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          MedBrief AI bridges the gap between complex medical jargon and patient understanding.
          Upload your reports, get clear summaries, and communicate effectively with your doctor.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept = ".pdf,.doc,.docx,.txt"
          />
          <button
            onClick={handleUploadClick}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            <Upload className="h-5 w-5 inline-block mr-2" />
            I am a Patient
          </button>

          <Link
            to="/doctor"
            className="rounded-xl bg-gray-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 transition-all"
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
