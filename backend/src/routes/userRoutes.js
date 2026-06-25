import express from "express";
import { getMe, completeProfile, deleteOAuthUser } from "../Controllers/userController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/me — restore session on page refresh
router.get("/me", protect, getMe);

// POST /api/users/complete-profile — for OAuth users picking a role
router.post("/complete-profile", protect, completeProfile);

// DELETE /api/users/me — used to roll back invalid OAuth login/register attempts
router.delete("/me", protect, deleteOAuthUser);

export default router;