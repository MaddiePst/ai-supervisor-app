import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Groq decommissioned llama-3.3-70b-versatile (returns model_not_found as of
// 2026-08-24) — moved to openai/gpt-oss-120b, the closest available tier.
export const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.2,
});

// Low-temperature model for deterministic structured extraction (e.g. matching
// a chat message to a task_id + status), kept separate from the conversational
// `model` above so free-flowing replies don't drift from the structured output.
export const extractionModel = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});
