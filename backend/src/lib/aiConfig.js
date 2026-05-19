import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});