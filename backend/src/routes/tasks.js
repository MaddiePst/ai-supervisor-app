import { Router } from "express";
import {
  assignTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../Controllers/tasks.controller.js";
import { requireAuth } from "../Middleware/requireMiddleware.js";

const router = Router();

router.get("/:projectId", requireAuth, listTasks);
router.patch("/:id/status", requireAuth, updateTaskStatus);
router.patch("/:id/assign", requireAuth, assignTask);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

export default router;
