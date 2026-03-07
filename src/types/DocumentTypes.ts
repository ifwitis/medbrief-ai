// src/types/index.ts

export type DocumentStatus = "processing" | "ready" | "failed";
export type UserRole = "patient" | "doctor";
export type AudienceDifficulty = "layman" | "medical";
export type DetailLevel = "summary" | "detailed";
export type Clarity = "High" | "Medium" | "Low";
export type Urgency = "High" | "Medium" | "Low";

export interface TranslationConfig {
  language: string;
  difficulty: AudienceDifficulty;
  detailLevel: DetailLevel;
}

export interface PriorityItem {
  id: number;
  title: string;
  description: string;
  source: string;
  rank: number;
  clarity: Clarity;
  category?: string;
}

export interface VagueDetail {
  id: number;
  text: string;
  source: string;
  clarity: Clarity;
}

export interface Translation {
  language: string;
  content: string;
}

export interface ActionItem {
  id: number;
  title: string;
  description: string;
  source: string;
  urgency: Urgency;
  approved: boolean;
}

export interface CaregiverMedication {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
}

export interface CaregiverAppointment {
  provider: string;
  purpose: string;
  date: string;
}

export interface CaregiverSummary {
  medications: CaregiverMedication[];
  lifestyle: string[];
  appointments: CaregiverAppointment[];
}

export interface DocumentResult {
  summary: string;
  originalLanguage?: string;
  priorityItems: PriorityItem[];
  vagueDetails: VagueDetail[];
  caregiverSummary: CaregiverSummary;
  translations: Translation[];
  actions: ActionItem[];
  processedAt?: string;
}

export interface MedicalDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  uploadedBy: UserRole;
  createdAt?: any; // Firestore Timestamp
  patientId: string;
  patientName: string;
  doctorId: string | null;

  aiResult: DocumentResult | null;
  processingOptions: TranslationConfig;

  fileMeta: {
    mimeType: string;
    size: number;
    originalName: string;
    storagePath?: string;
    downloadURL?: string;
  };
}

export interface UploadDocumentParams {
  file: File;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  uploadedBy: UserRole;
  options: TranslationConfig;
}
