import { GoogleGenAI } from "@google/genai";

import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";

// Initialize the embedder once
const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-2",
});

// Initialize the SDK client instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

async function getCompatibleCollection(
  client,
  collectionName = "christ_uni_docs",
) {
  return client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });
}

async function withCollectionReset(
  client,
  operation,
  collectionName = "christ_uni_docs",
) {
  let collection = await getCompatibleCollection(client, collectionName);

  try {
    return await operation(collection);
  } catch (error) {
    const message = error?.message || "";

    if (!/dimension|expecting embedding/i.test(message)) {
      throw error;
    }

    console.warn(
      `Resetting Chroma collection "${collectionName}" because the stored embedding dimension no longer matches the Gemini embedder.`,
    );

    await client.deleteCollection({ name: collectionName }).catch(() => {});
    collection = await getCompatibleCollection(client, collectionName);
    return await operation(collection);
  }
}

export default async function askGeminiWithRAG(question, id, client) {
  try {
    // 1. Get collection with the embedding function attached
    const results = await withCollectionReset(client, async (collection) =>
      collection.query({
        queryTexts: [question],
        nResults: 5,
        where: {
          userId: id,
        },
      }),
    );

    const documents = results.documents[0] || [];

    if (documents.length === 0) {
      return {
        success: false,
        reply: "I don't know your preference please /p and insert preference.",
        sources: [],
      };
    }

    const context = documents.join("\n\n");

    // 3. Generate response using Gemini
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `VECTOR DATABASE DATA:\n${context}\n\nUSER QUESTION:\n${question}`,
      config: {
        systemInstruction: `You are a personal AI assistant.
Rules:
- Use the provided database information.
- Respond based on database preference.
- If the information is not present, say: "I don't know your preference please /p and insert preference."
- Keep the answer based on context.`,
      },
    });

    return {
      success: true,
      reply: response.text,
      sources: documents,
    };
  } catch (error) {
    console.error("RAG Error:", error);

    return {
      success: false,
      reply: "Something went wrong while processing the question.",
      error: error.message,
    };
  }
}
