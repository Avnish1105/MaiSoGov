import "dotenv/config";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import { CloudClient } from "chromadb";

const COLLECTION_NAME = "christ_uni_docs";

const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

export const saveQuizAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user?.id;

    if (
      !userId ||
      !answers ||
      !Array.isArray(answers) ||
      answers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing userId or answers array",
      });
    }

    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: embedder,
    });

    const ids = [];
    const documents = [];
    const metadatas = [];

    for (const answer of answers) {
      const doc =
        `Question: ${answer.question}\nAnswer: ${answer.selectedOption}`.trim();
      const documentId = `${userId}-quiz-${answer.questionId}-${Date.now()}`;

      ids.push(documentId);
      documents.push(doc);
      metadatas.push({
        userId: String(userId),
        type: "quiz",
        questionId: String(answer.questionId),
      });
    }

    await collection.add({
      ids,
      documents,
      metadatas,
    });

    return res.json({
      success: true,
      message: "Quiz answers stored successfully",
    });
  } catch (error) {
    console.error("Quiz storage error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
