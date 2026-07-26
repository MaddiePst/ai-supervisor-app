import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  updateProjectRoles,
} from "../Controllers/projectController.js";
import { requireAuth, requireRole } from "../Middleware/requireMiddleware.js";

const router = Router();

router.get("/", requireAuth, listProjects);
router.get("/:id", requireAuth, getProject);
router.post("/", requireAuth, requireRole("manager"), createProject);
router.patch("/:id", requireAuth, updateProject);
router.put("/:id/roles", requireAuth, updateProjectRoles); // ✅ Save edited roles
router.delete("/:id", requireAuth, requireRole("manager"), deleteProject);

export default router;