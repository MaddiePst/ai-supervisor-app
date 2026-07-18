import { Router } from "express";
import {
  listEvents,
  createEvent,
  deleteEvent,
  listColleagues,
} from "../Controllers/calendarEventsController.js";
import { requireAuth } from "../Middleware/requireMiddleware.js";

const router = Router();

router.get("/", requireAuth, listEvents);
router.post("/", requireAuth, createEvent);
router.delete("/:id", requireAuth, deleteEvent);
router.get("/colleagues", requireAuth, listColleagues);

export default router;