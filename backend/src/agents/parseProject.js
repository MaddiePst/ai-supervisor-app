import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { model, embeddings } from "../lib/aiConfig.js";

const parser = new JsonOutputParser();

const newProjectPrompt = PromptTemplate.fromTemplate(`
You are a project manager AI. Parse the following project spec and break it into clear actionable tasks.

Return a JSON array of tasks with this exact shape:
[
  {{
    "title": "short task title",
    "what": "clear, well written description of what needs to be done including any relevant context",
    "how": "how to approach and implement it",
    "skills": ["skill1", "skill2", "skillN"],
    "status": "not_started"
  }}
]

Return only the JSON array, no explanation, no markdown.

Project Spec:
{text}
`);

const updateProjectPrompt = PromptTemplate.fromTemplate(`
You are a project manager AI. You are given existing tasks and a new update document.

Analyze the update and return a JSON array. Each item should be either an overwrite of an existing task or a brand new task.

Return this exact shape:
[
  {{
    "task_id": "existing task id if overwriting, null if new",
    "title": "task title",
    "what": "clear, well written description of what needs to be done including any relevant context from the update",
    "how": "how to approach and implement it",
    "skills": ["skill1", "skill2"],
    "status": "not_started | in_progress | complete"
  }}
]

Return only the JSON array, no explanation, no markdown.

Existing Tasks:
{tasks}

Update Document:
{text}
`);

async function generateEmbedding(task) {
  const text = `${task.title} ${task.what} ${task.how} ${task.skills?.join(" ")}`;
  return await embeddings.embedQuery(text);
}

export async function parseNewProject(text) {
  const chain = newProjectPrompt.pipe(model).pipe(parser);
  const tasks = await chain.invoke({ text });

  return await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      embedding: await generateEmbedding(task),
    }))
  );
}

export async function parseProjectUpdate(text, existingTasks) {
  const chain = updateProjectPrompt.pipe(model).pipe(parser);
  const changes = await chain.invoke({
    text,
    tasks: JSON.stringify(existingTasks),
  });

  return await Promise.all(
    changes.map(async (task) => ({
      ...task,
      embedding: await generateEmbedding(task),
    }))
  );
}