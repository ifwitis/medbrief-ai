import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processMedicalDocument } from "../../server/services/gemini";
import type { TranslationConfig } from "../../src/types";

const router = express.Router();

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

router.post("/process-upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No document uploaded" });
    }

    const options: TranslationConfig = {
      language: String(req.body.language || "English"),
      difficulty: (req.body.difficulty || "layman") as "layman" | "medical",
      detailLevel: (req.body.detailLevel || "summary") as "summary" | "detailed",
    };

    const fileBuffer = fs.readFileSync(req.file.path);
    const aiResult = await processMedicalDocument(fileBuffer, req.file.mimetype, options);

    return res.json({
      success: true,
      data: {
        name: req.file.originalname,
        status: "ready",
        aiResult,
        fileMeta: {
          mimeType: req.file.mimetype,
          size: req.file.size,
          originalName: req.file.originalname,
          storagePath: req.file.path,
          downloadURL: `/uploads/${path.basename(req.file.path)}`,
        },
      },
    });
  } catch (error) {
    console.error("process-upload failed", error);
    return res.status(500).json({
      success: false,
      error: "Document processing failed",
    });
  }
});

router.get("/:id/process", async (req, res) => {
  try {
    const fileUrl = String(req.query.fileUrl || "");
    if (!fileUrl) {
      return res.status(400).json({ success: false, error: "Missing fileUrl" });
    }

    const options: TranslationConfig = {
      language: String(req.query.language || "English"),
      difficulty: (req.query.difficulty || "layman") as "layman" | "medical",
      detailLevel: (req.query.detailLevel || "summary") as "summary" | "detailed",
    };

    const localPath = path.resolve(fileUrl.startsWith("/") ? `.${fileUrl}` : fileUrl);

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const fileBuffer = fs.readFileSync(localPath);

    let mimeType = "application/pdf";
    if (localPath.endsWith(".png")) mimeType = "image/png";
    if (localPath.endsWith(".jpg") || localPath.endsWith(".jpeg")) mimeType = "image/jpeg";
    if (localPath.endsWith(".pdf")) mimeType = "application/pdf";

    const aiResult = await processMedicalDocument(fileBuffer, mimeType, options);

    return res.json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    console.error("Document processing error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process document",
    });
  }
});

export default router;
