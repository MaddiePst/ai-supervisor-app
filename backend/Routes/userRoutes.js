import express from "express";
import { getMe } from "../Controllers/userController.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users/me  — requires a valid JWT
// AuthContext calls this on every page refresh to restore the session
router.get("/me", protect, getMe);

export default router;