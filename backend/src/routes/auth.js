import { Router } from "express";
import { completeProfile } from "../controllers/auth.controller.js";
import { requireSupabaseAuth } from "../middleware/auth.js";

const router = Router();

router.post("/complete-profile", requireSupabaseAuth, completeProfile);

export default router;
