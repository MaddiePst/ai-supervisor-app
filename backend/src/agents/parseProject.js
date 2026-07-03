import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { embeddings, model } from "../lib/aiConfig.js";

const parser = new JsonOutputParser();

// ─── TASKS PROMPTS ────────────────────────────────────────────────────────────

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

// ─── ROLES PROMPT ─────────────────────────────────────────────────────────────
// Extracts job titles and headcount from the spec.
// If the spec doesn't mention roles explicitly, AI infers them from the tasks.

const rolesPrompt = PromptTemplate.fromTemplate(`
You are a project staffing AI. Based on the project specification below, identify the job roles needed to complete this project.

Rules:
- If the document explicitly mentions roles, positions, or headcount — extract them exactly.
- If the document does not mention roles — infer the most likely roles based on the type of work described.
- Each role must have a realistic position count (how many people are needed for that role).

Return a JSON array with this exact shape:
[
  {{
    "title": "Job Title (e.g. Frontend Developer, DevOps Engineer, UX Designer)",
    "count": 1,
    "skills": ["skill1", "skill2"]
  }}
]

Return only the JSON array, no explanation, no markdown.

Project Spec:
{text}
`);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function generateEmbedding(task) {
  const text = `${task.title} ${task.what} ${task.how} ${task.skills?.join(" ")}`;
  return await embeddings.embedQuery(text);
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

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

// ✅ New — extracts or infers job roles from the project spec
export async function parseProjectRoles(text) {
  const chain = rolesPrompt.pipe(model).pipe(parser);
  const roles = await chain.invoke({ text });

  // Normalize and add unique IDs
  return roles.map((role, i) => ({
    id: `role-${Date.now()}-${i}`,
    title: role.title || "Unnamed Role",
    count: typeof role.count === "number" ? role.count : 1,
    skills: Array.isArray(role.skills) ? role.skills : [],
  }));
}