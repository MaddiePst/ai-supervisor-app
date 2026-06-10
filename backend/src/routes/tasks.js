import { Router } from "express";
import {
  assignTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/tasks.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:projectId", requireAuth, listTasks);
router.patch("/:id/status", requireAuth, updateTaskStatus);
router.patch("/:id/assign", requireAuth, assignTask);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

export default router;
