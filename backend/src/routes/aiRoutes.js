import "dotenv/config"; // must be the FIRST import
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getUserDocuments,
  searchDocuments,
  sendMessage,
} from "../controllers/aiController.js";

const Airouter = express.Router();

Airouter.use(authMiddleware);

Airouter.post("/message", sendMessage);
Airouter.get("/get/:id", getUserDocuments);
Airouter.post("/search", searchDocuments);

export default Airouter;
