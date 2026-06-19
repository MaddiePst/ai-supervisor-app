import { Router } from "express";
import { getMe, listUsers } from "../Controllers/users.controller.js";
import { requireAuth, requireRole } from "../Middleware/requireMiddleware.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.get("/", requireAuth, requireRole("manager"), listUsers);

export default router;
