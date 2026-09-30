import "dotenv/config";
import Groq from "groq-sdk";
import { CloudClient } from "chromadb";
import { chromaEmbedder } from "../config/chromaEmbedder.js";

const COLLECTION_NAME = "christ_uni_docs";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

export const generateQuizQuestions = async (req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.7,
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Create neutral, generic onboarding questions for a personal planning assistant. Do not access or refer to user records, food preferences, or any database. Return only a JSON object with a questions array. Each question must have a question string and exactly four concise answer options.",
        },
        {
          role: "user",
          content:
            'Generate exactly five distinct, broadly applicable questions about routines, focus, priorities, decision-making, or motivation. Avoid sensitive personal, medical, or demographic questions. Return JSON shaped like {"questions":[{"question":"...","options":["...","...","...","..."]}]} .',
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned an empty question set.");
    }

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
      throw new Error("Groq did not return exactly five questions.");
    }

    const questions = parsed.questions.map((item, index) => {
      const question = item?.question?.trim();
      const options = Array.isArray(item?.options)
        ? item.options
            .filter((option) => typeof option === "string" && option.trim())
            .map((option) => option.trim())
        : [];

      if (!question || options.length !== 4) {
        throw new Error("Groq returned a question with an invalid shape.");
      }

      return { id: index + 1, question, options };
    });

    return res.json({ success: true, questions });
  } catch (error) {
    console.error("Quiz question generation error:", error);
    return res.status(502).json({
      success: false,
      error: "Could not generate quiz questions. Please try again.",
    });
  }
};

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
      embeddingFunction: chromaEmbedder,
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
