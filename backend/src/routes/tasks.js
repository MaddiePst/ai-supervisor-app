import { Router } from "express";
import {
  assignTask,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../Controllers/taskController.js";
import { requireAuth } from "../Middleware/requireMiddleware.js";

const router = Router();

router.get("/:projectId", requireAuth, listTasks);
router.post("/", requireAuth, createTask);          // ✅ Create new task
router.patch("/:id/status", requireAuth, updateTaskStatus);
router.patch("/:id/assign", requireAuth, assignTask);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

export default router;