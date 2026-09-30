import Groq from "groq-sdk";
import { chromaEmbedder } from "../config/chromaEmbedder.js";

// Groq is used for generating the answer
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const RETRIEVAL_LIMIT = 3;
const MAX_DOCUMENT_CHARS = 2000;
const MAX_CONTEXT_CHARS = 10000;

export async function generatePreferenceQuestion(answer) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_completion_tokens: 512,
    messages: [
      {
        role: "system",
        content:
          "Write exactly one concise, natural question that the user's answer directly answers. Do not add assumptions or provide an answer. Return only the question, ending with a question mark.",
      },
      {
        role: "user",
        content: answer,
      },
    ],
  });

  const choice = completion.choices[0];
  const question = choice?.message?.content
    ?.trim()
    .split(/\r?\n/, 1)[0]
    .replace(/^['\"]|['\"]$/g, "")
    .trim();

  if (!question) {
    throw new Error(
      `Groq returned no preference question (finish reason: ${choice?.finish_reason || "unknown"}).`,
    );
  }

  return question.endsWith("?") ? question : `${question}?`;
}

async function getCollection(client, collectionName = "christ_uni_docs") {
  return client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: chromaEmbedder,
  });
}

async function withCompatibleCollection(
  client,
  operation,
  collectionName = "christ_uni_docs",
) {
  const collection = await getCollection(client, collectionName);
  return operation(collection);
}

export default async function askGeminiWithRAG(question, id, client) {
  try {
    // 1. Get relevant documents from ChromaDB
    const results = await withCompatibleCollection(client, async (collection) =>
      collection.query({
        queryTexts: [question],
        nResults: RETRIEVAL_LIMIT,
        where: {
          userId: id,
        },
      }),
    );

    // 2. Extract documents
    const documents = (results.documents[0] || [])
      .filter((document) => typeof document === "string" && document.trim())
      .map((document) => document.trim().slice(0, MAX_DOCUMENT_CHARS));

    if (documents.length === 0) {
      return {
        success: false,
        reply: "I don't know your preference. Please /p and insert preference.",
        sources: [],
      };
    }

    // 3. Build context
    const context = documents.join("\n\n").slice(0, MAX_CONTEXT_CHARS);

    // 4. Ask Groq
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are a personal AI assistant called HumanTwin.

Use the provided user information to answer the question.

Rules:
- Answer based on persons context taste and preference
-keep it small and aligned
-after all ask a simple question to user 

            `.trim(),
        },
        {
          role: "user",
          content: `
VECTOR DATABASE DATA:

${context}

USER QUESTION:

${question}
            `.trim(),
        },
      ],
    });

    // 5. Get Groq response
    const reply =
      completion.choices[0]?.message?.content ||
      "I couldn't generate a response.";

    return {
      success: true,
      reply,
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
