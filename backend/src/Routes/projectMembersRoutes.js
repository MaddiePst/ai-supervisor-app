import { Router } from "express";
import {
  listCandidates,
  hireCandidate,
  fireCandidate,
  listMembers,
} from "../Controllers/projectMembersController.js";
import { requireAuth, requireRole } from "../Middleware/requireMiddleware.js";

const router = Router();

// GET  /api/projects/:projectId/candidates?role_id=xxx — list scored candidates
router.get("/:projectId/candidates", requireAuth, requireRole("manager"), listCandidates);

// GET  /api/projects/:projectId/members — list hired members
router.get("/:projectId/members", requireAuth, listMembers);

// POST /api/projects/:projectId/hire — hire a team member into a role
router.post("/:projectId/hire", requireAuth, requireRole("manager"), hireCandidate);

// DELETE /api/projects/:projectId/fire/:userId — remove a hired member
router.delete("/:projectId/fire/:userId", requireAuth, requireRole("manager"), fireCandidate);

export default router;