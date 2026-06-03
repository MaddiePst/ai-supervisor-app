import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { embeddings, model } from '../lib/aiConfig.js'
import { PromptTemplate } from '@langchain/core/prompts';

const router = Router();

// POST /api/chat/:projectId
router.post("/:projectId", async (req, res) => {
  const { projectId } =req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const queryEmbedding = await embeddings.embedQuery(message);

    const { data: similarTasks, error: searchError } = await supabase.rpc('match_tasks', {
      query_embedding: queryEmbedding,
      match_project_id: projectId,
      match_count: 5,
    });

    if (searchError) throw searchError;

    const context = similarTasks
      .map((t) => `Task: ${t.title}\nWhat: ${t.what}\nHow: ${t.how}\nSkills: ${t.skills?.join(", ")}\nStatus: ${t.status}`)
      .join("\n\n");
    

    const chatPrompt = PromptTemplate.fromTemplate(`
      You are a project assistant. Answer questions about this project based on thefollowing tasks.

      Project Tasks: {context}
      Question: {message}
      `)
    
    const chain = chatPrompt.pipe(model);
    const response= await chain.invoke({ context, message})

    res.json({ response: response.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
  