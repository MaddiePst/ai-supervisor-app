// Standalone accuracy test for the AI chat task-update feature (aiChat in
// backend/src/Controllers/chatController.js). Exercises the real HTTP API —
// register/login, project + task creation, hiring — exactly as the frontend
// would, then sends a scripted conversation to POST /api/chat/:projectId and
// scores whether the returned taskUpdates match the expected (task, status).
//
// Usage: node scripts/ai-chat-accuracy/run.js
// Requires the backend running locally on PORT (see backend/.env), default http://localhost:3000

import { randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const cases = JSON.parse(readFileSync(path.join(__dirname, "cases.json"), "utf-8"));

async function api(method, endpoint, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TASK_DEFS = [
  { title: "Build login page", what: "Create the login page UI", how: "React + Tailwind form", skills: ["react", "css"] },
  { title: "Build login API", what: "Create the login endpoint", how: "Express + Supabase auth", skills: ["node.js", "express"] },
  { title: "Design login flow", what: "Design the login UX flow", how: "Figma wireframes", skills: ["figma", "ux"] },
  { title: "Build signup page", what: "Create the signup page UI", how: "React + Tailwind form", skills: ["react", "css"] },
  { title: "Build signup API", what: "Create the signup endpoint", how: "Express + Supabase auth", skills: ["node.js", "express"] },
  { title: "Write unit tests for auth module", what: "Cover login/signup with tests", how: "Jest", skills: ["jest", "testing"] },
  { title: "Deploy backend to production", what: "Ship backend to prod", how: "Railway deploy", skills: ["devops"] },
  { title: "Create dashboard UI", what: "Build the main dashboard", how: "React components", skills: ["react"] },
  { title: "Integrate payment gateway", what: "Add payment processing", how: "Stripe API", skills: ["node.js", "stripe"] },
  { title: "Set up CI/CD pipeline", what: "Automate build/deploy", how: "GitHub Actions", skills: ["ci/cd", "docker"] },
];

async function main() {
  const ts = Date.now();
  const log = [];
  const say = (line = "") => { console.log(line); log.push(line); };

  say(`# AI Chat Accuracy Test Run`);
  say(`Run at: ${new Date(ts).toISOString()}`);
  say("");

  // ── 1. Register manager + team member ────────────────────────────────────
  const managerEmail = `ai-chat-test+manager-${ts}@example.com`;
  const teamEmail = `ai-chat-test+team-${ts}@example.com`;
  const password = "TestPass123";

  const manager = await api("POST", "/auth/register", {
    body: { name: "Test Manager", email: managerEmail, password, role: "manager" },
  });
  const team = await api("POST", "/auth/register", {
    body: { name: "Jordan Rivera", email: teamEmail, password, role: "team" },
  });
  say(`Seeded manager: ${managerEmail} / team member: ${teamEmail} (password: ${password})`);

  // ── 2. Create project + role ──────────────────────────────────────────────
  const project = await api("POST", "/projects", {
    token: manager.token,
    body: {
      name: `AI Chat Accuracy Test ${ts}`,
      description: "Disposable test project for AI chat accuracy evaluation. Safe to delete.",
    },
  });

  const role = { id: randomUUID(), title: "Team Member", skills: [], count: 5 };
  await api("PUT", `/projects/${project.id}/roles`, { token: manager.token, body: { roles: [role] } });

  // ── 3. Create tasks with realistic, slightly-similar titles ─────────────
  const taskTitleById = {};
  for (const t of TASK_DEFS) {
    const created = await api("POST", "/tasks", {
      token: manager.token,
      body: {
        project_id: project.id,
        title: t.title,
        what: t.what,
        how: t.how,
        skills: t.skills,
        status: "not_started",
        role_id: role.id,
        role_title: role.title,
      },
    });
    taskTitleById[created.id] = created.title;
  }
  say(`Seeded project "${project.name}" (${project.id}) with ${TASK_DEFS.length} tasks.`);

  // ── 4. Hire team member into the role ─────────────────────────────────────
  await api("POST", `/projects/${project.id}/hire`, {
    token: manager.token,
    body: { user_id: team.user.id, role_id: role.id, role_title: role.title },
  });
  say(`Hired ${team.user.name} into role "${role.title}".`);
  say("");

  // ── 5. Run the scripted conversation ──────────────────────────────────────
  say(`## Conversation (as team member, ${team.user.name})`);
  say("");

  let history = [];
  const results = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    let response;
    try {
      response = await api("POST", `/chat/${project.id}`, {
        token: team.token,
        body: { message: c.message, history },
      });
    } catch (err) {
      results.push({ ...c, actualUpdates: [], pass: false, error: err.message });
      say(`### Case ${i + 1}: ERROR — ${err.message}`);
      say("");
      continue;
    }

    history.push({ role: "user", content: c.message, senderName: team.user.name });
    history.push({ role: "assistant", content: response.response });

    const taskUpdates = response.taskUpdates || [];
    const primary = taskUpdates[0];
    const primaryTitle = primary ? taskTitleById[primary.task_id] || `(unknown task_id ${primary.task_id})` : null;

    const pass =
      taskUpdates.length === 1 &&
      primaryTitle === c.expectedTaskTitle &&
      primary.status === c.expectedStatus;

    results.push({
      ...c,
      actualUpdates: taskUpdates.map((u) => ({ title: taskTitleById[u.task_id] || u.task_id, status: u.status })),
      pass,
    });

    say(`### Case ${i + 1} — ${pass ? "PASS" : "FAIL"}`);
    say(`- Message: "${c.message}"`);
    say(`- Style: ${c.style}`);
    say(`- Expected: **${c.expectedTaskTitle}** -> \`${c.expectedStatus}\``);
    say(
      `- Actual: ${
        taskUpdates.length === 0
          ? "(no task update returned)"
          : taskUpdates.map((u) => `**${taskTitleById[u.task_id] || u.task_id}** -> \`${u.status}\``).join(", ")
      }`
    );
    say(`- AI response: ${response.response.replace(/\n/g, " ").slice(0, 200)}`);
    say("");

    console.log(`[${i + 1}/${cases.length}] ${pass ? "PASS" : "FAIL"} — "${c.message}"`);

    await sleep(400); // be polite to the Groq API
  }

  // ── 6. Score + report ──────────────────────────────────────────────────────
  const passCount = results.filter((r) => r.pass).length;
  const total = results.length;
  const pct = Math.round((passCount / total) * 1000) / 10;

  say(`## Result`);
  say("");
  say(`**correctly matched ${passCount}/${total} cases (${pct}%)**`);
  say("");
  say(`## Test data (not deleted — inspect before cleaning up)`);
  say(`- Project ID: \`${project.id}\``);
  say(`- Manager login: ${managerEmail} / ${password}`);
  say(`- Team member login: ${teamEmail} / ${password}`);
  say("");

  console.log("");
  console.log(`correctly matched ${passCount}/${total} cases (${pct}%)`);
  console.log(`Project ID: ${project.id} (not deleted)`);

  const outPath = path.join(__dirname, `results-${ts}.md`);
  writeFileSync(outPath, log.join("\n"));
  console.log(`Full report saved to ${outPath}`);

  writeFileSync(
    path.join(__dirname, `seed-${ts}.json`),
    JSON.stringify(
      { projectId: project.id, managerEmail, teamEmail, password, roleId: role.id, taskTitleById },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
