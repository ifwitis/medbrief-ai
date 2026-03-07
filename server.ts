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
  // Expected: multipart/form-data with a file field named "document"
  app.post("/api/documents/upload", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // TODO: Implement Gemini AI processing here
      // 1. Convert file buffer to base64
      // 2. Call Gemini API to parse and summarize the document
      // 3. Return structured data (prioritized items, vague details, etc.)
      
      res.json({
        message: "File uploaded successfully. AI processing pending.",
        fileName: req.file.originalname,
        size: req.file.size,
        // Mock response for now
        structuredData: {
          priorityItems: [
            { id: 1, text: "Elevated blood pressure", clarity: "High" },
            { id: 2, text: "Low Vitamin D levels", clarity: "Medium" }
          ],
          vagueDetails: [
            { id: 3, text: "Patient reports occasional fatigue", clarity: "Low" }
          ]
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process document" });
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
