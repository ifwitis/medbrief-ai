import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/routes/firebase";
import type {
  MedicalDocument,
  UploadDocumentParams,
  DocumentResult,
} from "../../src/types";

interface ProcessUploadApiResponse {
  success: boolean;
  data: {
    name: string;
    status: "ready" | "processing" | "failed";
    aiResult: DocumentResult;
    fileMeta?: {
      mimeType?: string;
      size?: number;
      originalName?: string;
      storagePath?: string;
      downloadURL?: string;
    };
  };
  error?: string;
}

export async function uploadDocument(params: UploadDocumentParams): Promise<string> {
  const {
    file,
    patientId,
    patientName,
    doctorId,
    uploadedBy,
    options,
  } = params;

  const formData = new FormData();
  formData.append("document", file);
  formData.append("patientId", patientId);
  formData.append("patientName", patientName);
  formData.append("doctorId", doctorId ?? "");
  formData.append("uploadedBy", uploadedBy);
  formData.append("language", options.language);
  formData.append("difficulty", options.difficulty);
  formData.append("detailLevel", options.detailLevel);

  const res = await fetch("/api/documents/process-upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  const payload = (await res.json()) as ProcessUploadApiResponse;

  if (!payload.success) {
    throw new Error(payload.error || "Document processing failed");
  }

  const { data } = payload;

  const docRecord: Omit<MedicalDocument, "id"> = {
    name: data.name || file.name,
    status: data.status,
    uploadedBy,
    createdAt: serverTimestamp(),
    patientId,
    patientName,
    doctorId,
    aiResult: data.aiResult,
    processingOptions: options,
    fileMeta: {
      mimeType: data.fileMeta?.mimeType || file.type || "application/octet-stream",
      size: data.fileMeta?.size ?? file.size,
      originalName: data.fileMeta?.originalName || file.name,
      storagePath: data.fileMeta?.storagePath,
      downloadURL: data.fileMeta?.downloadURL,
    },
  };

  const docRef = await addDoc(collection(db, "documents"), docRecord);
  return docRef.id;
}
