import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { embeddings, model } from "../lib/aiConfig.js";

const parser = new JsonOutputParser();

const newProjectPrompt = PromptTemplate.fromTemplate(`
You are a project manager AI. Parse the following project spec and break it into clear actionable tasks.
You are also given a list of roles for this project. Assign each task to the most appropriate role based on required skills.

Return a JSON array of tasks with this exact shape:
[
  {{
    "title": "short task title",
    "what": "clear description of what needs to be done",
    "how": "how to approach and implement it",
    "skills": ["skill1", "skill2"],
    "status": "not_started",
    "role_id": "the id of the matching role from the roles list, or null if no match",
    "role_title": "the title of the matching role, or null if no match"
  }}
]

Return only the JSON array, no explanation, no markdown.

Roles available:
{roles}

Project Spec:
{text}
`);

const updateProjectPrompt = PromptTemplate.fromTemplate(`
You are a project manager AI. You are given existing tasks and a new update document.
You are also given the current roles for this project. Assign or re-assign each task to the most appropriate role.

Return a JSON array. Each item should either overwrite an existing task or be a new task.

Return this exact shape:
[
  {{
    "task_id": "existing task id if overwriting, null if new",
    "title": "task title",
    "what": "clear description",
    "how": "how to implement it",
    "skills": ["skill1", "skill2"],
    "status": "not_started | in_progress | complete",
    "role_id": "matching role id or null",
    "role_title": "matching role title or null"
  }}
]

Return only the JSON array, no explanation, no markdown.

Roles available:
{roles}

Existing Tasks:
{tasks}

Update Document:
{text}
`);

const rolesPrompt = PromptTemplate.fromTemplate(`
You are a project staffing AI. Based on the project specification below, identify the job roles needed.

Rules:
- If the document explicitly mentions roles or headcount — extract them exactly.
- If not — infer the most likely roles based on the work described.
- Each role must have a realistic position count.
- Use sequential IDs: role-1, role-2, role-3, etc.

Return a JSON array with this exact shape:
[
  {{
    "id": "role-1",
    "title": "Job Title",
    "count": 1,
    "skills": ["skill1", "skill2"]
  }}
]

Return only the JSON array, no explanation, no markdown.

Project Spec:
{text}
`);

async function generateEmbedding(task) {
  const text = `${task.title} ${task.what} ${task.how} ${task.skills?.join(" ")}`;
  return await embeddings.embedQuery(text);
}

export async function parseNewProject(text, roles = []) {
  const chain = newProjectPrompt.pipe(model).pipe(parser);
  const tasks = await chain.invoke({
    text,
    roles: roles.length > 0
      ? JSON.stringify(roles)
      : "No roles defined yet — set role_id and role_title to null",
  });

  return await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      embedding: await generateEmbedding(task),
    }))
  );
}

export async function parseProjectUpdate(text, existingTasks, roles = []) {
  const chain = updateProjectPrompt.pipe(model).pipe(parser);
  const changes = await chain.invoke({
    text,
    tasks: JSON.stringify(existingTasks),
    roles: roles.length > 0
      ? JSON.stringify(roles)
      : "No roles defined yet — set role_id and role_title to null",
  });

  return await Promise.all(
    changes.map(async (task) => ({
      ...task,
      embedding: await generateEmbedding(task),
    }))
  );
}

export async function parseProjectRoles(text) {
  const chain = rolesPrompt.pipe(model).pipe(parser);
  const roles = await chain.invoke({ text });

  return roles.map((role, i) => ({
    id: role.id || `role-${i + 1}`,
    title: role.title || "Unnamed Role",
    count: typeof role.count === "number" ? role.count : 1,
    skills: Array.isArray(role.skills) ? role.skills : [],
  }));
}