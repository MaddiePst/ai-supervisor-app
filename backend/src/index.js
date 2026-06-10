process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

import cors from "cors";
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import uploadRoutes from "./routes/uploads.js";
import userRoutes from "./routes/users.js";

const PORT = process.env.PORT || 3000;
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
