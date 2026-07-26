import { Router } from "express";
import {
  assignTask,
  assignRolesToTasks,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../Controllers/taskController.js";
import { requireAuth, requireRole } from "../Middleware/requireMiddleware.js";

const router = Router();

// ✅ Specific routes MUST come before /:projectId to avoid being swallowed by it
// POST /api/tasks/assign-roles/:projectId — AI assigns role_id to unassigned tasks
router.post("/assign-roles/:projectId", requireAuth, requireRole("manager"), assignRolesToTasks);

router.get("/:projectId", requireAuth, listTasks);
router.post("/", requireAuth, createTask);
router.patch("/:id/status", requireAuth, updateTaskStatus);
router.patch("/:id/assign", requireAuth, assignTask);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

export default router;