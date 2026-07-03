// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import authRoutes from "./Routes/authRoutes.js";
// import userRoutes from "./Routes/userRoutes.js";

// dotenv.config();

// const app = express();

// app.use(express.json());

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   }),
// );

// // ─── ROUTES ───────────────────────────────────────────────────────────────────
// app.use("/api/auth", authRoutes); // /api/auth/login  /api/auth/register
// app.use("/api/users", userRoutes); // /api/users/me

// // ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err.message);
//   res.status(500).json({ message: "Internal server error." });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT}`);
// });
