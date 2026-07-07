import express from "express";
import {
  getMe,
  getProfile,
  updateProfile,
  completeProfile,
  deleteOAuthUser,
} from "../Controllers/userController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// GET  /api/users/me — restore session (used by AuthContext)
router.get("/me", protect, getMe);

// GET  /api/users/profile — full profile for Settings page
router.get("/profile", protect, getProfile);

// PUT  /api/users/profile — update profile from Settings page
router.put("/profile", protect, updateProfile);

// POST /api/users/complete-profile — OAuth users picking a role
router.post("/complete-profile", protect, completeProfile);

// DELETE /api/users/me — roll back invalid OAuth attempts
router.delete("/me", protect, deleteOAuthUser);

export default router;