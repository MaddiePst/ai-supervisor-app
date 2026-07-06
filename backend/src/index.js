process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

import cors from "cors";
import "dotenv/config";
import express from "express";
import authRoutes from "./Routes/authRoutes.js";
import chatRoutes from "./Routes/chat.js";
import projectRoutes from "./Routes/projects.js";
import taskRoutes from "./Routes/tasks.js";
import uploadRoutes from "./Routes/uploads.js";
import userRoutes from "./Routes/userRoutes.js";
import projectMembersRoutes from "./Routes/projectMembersRoutes.js";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/projects", projectMembersRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
