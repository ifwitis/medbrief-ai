export interface Document {
  id: string;
  name: string;
  date: string;
  status: 'processing' | 'ready' | 'needs_review';
}

export interface Patient {
  id: string;
  name: string;
  pendingActions: { docId: string; action: string }[];
}

export interface StructuredData {
  priorityItems: { id: number; text: string; clarity: string }[];
  vagueDetails: { id: number; text: string; clarity: string }[];
}

export interface TranslationOptions {
  language: string; // e.g., 'English', 'Spanish', 'Chinese'
  difficulty: 'layman' | 'medical';
  detailLevel: 'summary' | 'detailed';
}
