import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploads.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({ origin: "http://localhost:5173"}));
app.use(express.json());


app.use("/api/uploads", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});