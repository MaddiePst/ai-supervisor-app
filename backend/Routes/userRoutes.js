import express from "express";
import { getMe, completeProfile } from "../Controllers/userController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/me — restore session on page refresh
router.get("/me", protect, getMe);

// POST /api/users/complete-profile — for OAuth users picking a role
router.post("/complete-profile", protect, completeProfile);

export default router;