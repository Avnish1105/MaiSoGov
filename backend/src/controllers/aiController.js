import "dotenv/config";
import { CloudClient } from "chromadb";
import { GoogleGenAI } from "@google/genai";
import { chromaEmbedder } from "../config/chromaEmbedder.js";
import askGeminiWithRAG, {
  generatePreferenceQuestion,
} from "../Gemini/gemini.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

const COLLECTION_NAME = "christ_uni_docs";

async function getCompatibleCollection() {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: chromaEmbedder,
  });
}

async function withCompatibleCollection(operation) {
  return operation(await getCompatibleCollection());
}

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    let { message, metadata } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "Missing authenticated user or 'message'",
      });
    }

    message = message.trim();

    if (message.startsWith("/p ")) {
      const cleanPreference = message.replace("/p ", "").trim();
      if (!cleanPreference) {
        return res.status(400).json({
          error: "Please provide a preference after '/p'.",
        });
      }

      const question = await generatePreferenceQuestion(cleanPreference);
      const answer = cleanPreference;
      const document = `Question: ${question}\nAnswer: ${answer}`;
      const docId = `${userId}-preference-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const prefMetadata = {
        ...(metadata || {}),
        userId: String(userId),
        type: "preference",
        questionId: String(docId),
        source: "manual",
        category: "Preferences",
        question,
        answer,
      };

      const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: chromaEmbedder,
      });

      await collection.add({
        ids: [docId],
        documents: [document],
        metadatas: [prefMetadata],
      });

      return res.json({
        success: true,
        reply: `Preference saved. Question: ${question}`,
        question,
        sources: message,
      });
    }

    const result = await askGeminiWithRAG(message, userId, client, ai);
    return res.json(result);
  } catch (error) {
    console.error("Router Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getUserDocuments = async (req, res) => {
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

    const result = await withCompatibleCollection((collection) =>
      collection.get({ where: { userId } }),
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const { queryText, limit } = req.body;
    const results = await withCompatibleCollection((collection) =>
      collection.query({
        queryTexts: [queryText],
        nResults: limit || 3,
        where: { userId },
      }),
    );

    return res.json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
