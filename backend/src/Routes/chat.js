import { Router } from "express";
import {
  aiChat,
  getAiHistory,
  listChannels,
  createChannel,
  getChannelMessages,
  sendChannelMessage,
  getProjectCoworkers,
  deleteMessage,
  deleteChannel,
} from "../Controllers/chatController.js";
import { requireAuth } from "../Middleware/requireMiddleware.js";

const router = Router();

// AI
router.post("/:projectId", requireAuth, aiChat);
router.get("/:projectId/history", requireAuth, getAiHistory);

// Channels
router.get("/:projectId/channels", requireAuth, listChannels);
router.post("/:projectId/channels", requireAuth, createChannel);
router.delete("/channels/:channelId", requireAuth, deleteChannel);

// Messages
router.get("/channels/:channelId/messages", requireAuth, getChannelMessages);
router.post("/channels/:channelId/messages", requireAuth, sendChannelMessage);
router.delete("/messages/:messageId", requireAuth, deleteMessage);

// Coworkers
router.get("/:projectId/coworkers", requireAuth, getProjectCoworkers);

export default router;