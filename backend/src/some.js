const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { GoogleGenAI } = require("@google/genai");
const { ChromaClient } = require("chromadb");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
  }),
);

app.use(express.json());

// =========================
// GEMINI
// =========================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =========================
// CHROMA VECTOR DATABASE
// =========================

const chroma = new ChromaClient({
  path: "http://localhost:8000",
});

let collection;

// Connect to ChromaDB
async function start() {
  collection = await chroma.getOrCreateCollection({
    name: "my_data",
  });

  console.log("ChromaDB connected");
}

start();

// =========================
// CREATE EMBEDDING
// =========================

async function createEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return response.embeddings[0].values;
}

// =========================
// SAVE DATA
// =========================

app.post("/api/save", async (req, res) => {
  try {
    const { id, text } = req.body;

    if (!id || !text) {
      return res.status(400).json({
        message: "id and text are required",
      });
    }

    // Convert text → vector

    const embedding = await createEmbedding(text);

    // Save in ChromaDB

    await collection.add({
      ids: [id],

      documents: [text],

      embeddings: [embedding],
    });

    res.json({
      message: "Data saved successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save data",
    });
  }
});

// =========================
// CHAT / RAG
// =========================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // 1. Convert question to vector

    const queryEmbedding = await createEmbedding(message);

    // 2. Search ChromaDB

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],

      nResults: 3,
    });

    // 3. Get relevant documents

    const documents = results.documents[0] || [];

    // 4. Create context

    const context = documents.join("\n\n");

    // 5. Give context to Gemini

    const prompt = `

Context:

${context}


Question:

${message}


Answer the question using the context above.

If the answer is not present in the context,
say "I don't have that information."

`;

    // 6. Gemini generates answer

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: prompt,
    });

    res.json({
      reply: response.text,

      sources: documents,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// =========================
// SERVER
// =========================

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
