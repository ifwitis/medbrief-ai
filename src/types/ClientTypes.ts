// --- Other Domain Types ---
enum DOC_TYPE {

};

export interface Patient {
  id: string;
  name: string;
  requestedDoctorIds?: string[]; // Array of doctors the patient has requested
  assignedDoctorId?: string | null; // The doctor who claimed them
  assignedDoctorName?: string | null;
  doctors: {
    docType:
    string[];
  }
}

export interface Doctor {
    id: string;
    name: string;
    patients: string[];
}
