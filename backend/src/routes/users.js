import { Router } from "express";
import { getMe, listUsers } from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.get("/", requireAuth, requireRole("manager"), listUsers);

export default router;
