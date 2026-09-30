import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  generateQuizQuestions,
  saveQuizAnswers,
} from "../controllers/quizController.js";

const Quizrouter = express.Router();

Quizrouter.get("/questions", authMiddleware, generateQuizQuestions);
Quizrouter.post("/post", authMiddleware, saveQuizAnswers);

export default Quizrouter;
