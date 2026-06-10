import express from "express";
import multer from "multer";
import { uploadProjectDoc } from "../controllers/uploads.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

router.post("/:projectId", requireAuth, upload.single("file"), uploadProjectDoc);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only PDF files are allowed") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
