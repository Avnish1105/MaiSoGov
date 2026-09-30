import "dotenv/config";
import { CloudClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { GoogleGenAI } from "@google/genai";
import askGeminiWithRAG from "../Gemini/gemini.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
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
      const docId = `pref_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const prefMetadata = {
        ...(metadata || {}),
        source: "manual",
        category: "Preferences",
        userId,
      };

      const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: embedder,
      });

      await collection.add({
        ids: [docId],
        documents: [cleanPreference],
        metadatas: [prefMetadata],
      });

      return res.json({
        success: true,
        reply: "Your Preference was stored Successfully ",
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

    const result = await withCollectionReset((collection) =>
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
    const results = await withCollectionReset((collection) =>
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
