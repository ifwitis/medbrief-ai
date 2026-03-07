import 'dotenv/config';
import { processMedicalDocument } from "./server/services/gemini";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import cors from "cors";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure multer for file uploads (in-memory for now)
  const upload = multer({ storage: multer.memoryStorage() });

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upload document endpoint
  app.post("/api/documents/upload", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        console.warn("Upload rejected: No file attached to request.");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`\n--- New Document Upload ---`);
      console.log(`File Name: ${req.file.originalname}`);
      console.log(`MIME Type: ${req.file.mimetype}`);
      console.log(`Size: ${req.file.size} bytes`);
      console.log(`Sending to Gemini API...`);

      const analysis = await processMedicalDocument(req.file.buffer, req.file.mimetype, {
        language: "English",
        difficulty: "layman",
        detailLevel: "summary"
      });
      
      console.log("✅ Gemini processing successful!");
      res.json({structuredData: analysis});
      
    } catch (error: any) {
      console.error("\n🔥 CRITICAL UPLOAD ERROR 🔥");
      console.error(error);
      console.error("---------------------------\n");
      
      // Smart Error Handling: Check if we hit the Google API Speed Limit
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "The AI is currently processing too many requests. Please wait 1 minute and try again." 
        });
      }
      
      res.status(500).json({ error: "Failed to process document with AI." });
    }
  });

  // Get patient's documents (Mock)
  app.get("/api/patients/:patientId/documents", (req, res) => {
    res.json({
      documents: [
        { id: "doc1", name: "Blood Test Results.pdf", date: "2023-10-25" },
        { id: "doc2", name: "Annual Physical.docx", date: "2023-11-02" }
      ]
    });
  });

  // Get doctor's patients and recommended actions (Mock)
  app.get("/api/doctors/:doctorId/dashboard", (req, res) => {
    res.json({
      patients: [
        {
          id: "p1",
          name: "John Doe",
          pendingActions: [
            { docId: "doc1", action: "Review blood test results and approve summary" }
          ]
        }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();