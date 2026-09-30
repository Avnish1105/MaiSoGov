import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { saveQuizAnswers } from "../controllers/quizController.js";

const Quizrouter = express.Router();

Quizrouter.post("/post", authMiddleware, saveQuizAnswers);

export default Quizrouter;
