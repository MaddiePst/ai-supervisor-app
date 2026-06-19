import { Router } from "express";
import { chatWithProject } from "../Controllers/chat.controller.js";
import { requireAuth } from "../Middleware/requireMiddleware.js";

const router = Router();

router.post("/:projectId", requireAuth, chatWithProject);

export default router;
