// --- Other Domain Types ---
enum DOC_TYPE {

};

export interface Patient {
  id: string;
  name: string;
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
