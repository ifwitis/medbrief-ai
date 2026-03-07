// --- Upload / Input Types ---

export interface Document {
  id: string;
  name: string;
  date: string;
  status: 'processing' | 'ready';
}

export interface TranslationConfig {
  language: string; // e.g., 'English', 'Spanish', 'Chinese'
  difficulty: 'layman' | 'medical';
  detailLevel: 'summary' | 'detailed';
}

// --- AI Response Types ---

/**
 * Priority Item to be listed for each client's document
 *  Represented by unique id, subject title, and description summary of item
 *  Keep source text for accuracy
 *  Rank by severity/priority (0 = highest)
 *  Clarity represents how understandable the original text was
 */
export interface PriorityItem {
  id: number;
  title: string;
  description: string;
  source: string;
  rank: number;
  clarity: 'High' | 'Medium' | 'Low';
}

export interface Translation {
  language: string;
  content: string;
}

export interface Action {
  id: number;
  title: string;
  description: string;
  source: string;
  urgency: 'High' | 'Medium' | 'Low';
  approved: boolean;
}

/**
 * Full Document Result to be returned to the client (patient or doctor)
 */
export interface DocumentResult {
  summary: string;
  priorityItems: PriorityItem[];
  translations: Translation[];
  actions: Action[];
}

