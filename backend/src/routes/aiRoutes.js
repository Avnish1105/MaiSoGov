import "dotenv/config"; // must be the FIRST import
import express from "express";
import { CloudClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { GoogleGenAI } from "@google/genai";
import askGeminiWithRAG from "../Gemini/gemini.js";
import authMiddleware from "../middleware/authMiddleware.js";

const Airouter = express.Router();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Initialize Chroma Embedding Function
const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

// Initialize Chroma Cloud Client
const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

const COLLECTION_NAME = "christ_uni_docs";

async function getCompatibleCollection() {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embedder,
  });
}

async function withCollectionReset(operation) {
  let collection = await getCompatibleCollection();

  try {
    return await operation(collection);
  } catch (error) {
    const message = error?.message || "";

    if (!/dimension|expecting embedding/i.test(message)) {
      throw error;
    }

    console.warn(
      `Resetting Chroma collection "${COLLECTION_NAME}" because the stored embedding dimension no longer matches the Gemini embedder.`,
    );

    await client.deleteCollection({ name: COLLECTION_NAME }).catch(() => {});
    collection = await getCompatibleCollection();
    return await operation(collection);
  }
}

Airouter.use(authMiddleware);

Airouter.post("/message", async (req, res) => {
  try {
    const userId = req.user?.id;
    let { message, metadata } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "Missing authenticated user or 'message'",
      });
    }

    message = message.trim();

    // If message starts with /p, append it as a preference document
    if (message.startsWith("/p ")) {
      const cleanPreference = message.replace("/p ", "").trim();

      // Create a unique document ID for this entry to prevent overwrites
      const docId = `pref_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const prefMetadata = {
        ...(metadata || {}),
        source: "manual",
        category: "Preferences",
        userId: userId,
      };

      // Get or create collection with the attached embedding function
      const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embedder,
      });

      // Append new document to ChromaDB
      await collection.add({
        ids: [docId],
        documents: [cleanPreference],
        metadatas: [prefMetadata],
      });
      res.json({
        success: true,
        reply: "Your Preference was stored Successfully ",
        sources: message,
      });
      return;
    }

    // Call RAG helper to query across all stored preferences for this user
    const result = await askGeminiWithRAG(message, userId, client, ai);
    res.json(result);
  } catch (error) {
    console.error("Router Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// GET /api/chroma/get/:id -> Retrieve documents filtered by userId
Airouter.get("/get/:id", async (req, res) => {
  try {
    const requestedId = req.params.id || req.user?.id;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    if (requestedId && requestedId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only access your own data." });
    }

    const result = await withCollectionReset(async (currentCollection) =>
      currentCollection.get({
        where: { userId: userId },
      }),
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chroma/search -> Vector Similarity Search
Airouter.post("/search", async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const { queryText, limit } = req.body;

    const results = await withCollectionReset(async (currentCollection) =>
      currentCollection.query({
        queryTexts: [queryText],
        nResults: limit || 3,
        where: { userId },
      }),
    );

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default Airouter;
