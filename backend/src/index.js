import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import Airouter from "./routes/aiRoutes.js";
import Quizrouter from "./routes/quiz.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const corsMiddleware = cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});
// Middlewares
app.use(cookieParser());
app.use(corsMiddleware);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/quiz", Quizrouter);

// Healthcheck endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/ai", Airouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
