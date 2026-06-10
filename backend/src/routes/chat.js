import { Router } from "express";
import { chatWithProject } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:projectId", requireAuth, chatWithProject);

export default router;
