import "dotenv/config";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";

export const chromaEmbedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: process.env.CHROMA_EMBEDDING_MODEL || "gemini-embedding-001",
});
