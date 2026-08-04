<div align="center">

# 🧠 AI Supervisor Assistant

### An AI-powered project management platform that turns a project idea into a staffed, tracked, and executing team — in seconds.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_App-06b6d4?style=for-the-badge)](https://ai-supervisor-app.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Groq-1C3C3C?style=flat-square)

</div>

---

## 📖 Overview

**AI Supervisor Assistant** eliminates the friction between having a project idea and having a team executing it.

Upload a project spec PDF — or just type a description — and the platform's AI pipeline automatically generates a complete task breakdown, defines the staffing roles you'll need, and assigns every task to the right role. From there, an algorithmic scoring engine ranks available team members by skill match, so hiring becomes a data-driven decision instead of guesswork.

Once your team is staffed, everyone works inside a single unified workspace: task tracking with granular role-based permissions, an AI assistant that updates project state from natural conversation, real-time team messaging, a shared calendar, and an automated notification system — all available in **four languages**.

---

## 🎯 Objectives

| Objective | How It's Achieved |
|---|---|
| **Eliminate manual project breakdown** | AI (Groq llama-3.3-70b via LangChain) parses a PDF or description and generates structured tasks with `what`, `how`, and required skills |
| **Make hiring data-driven** | Candidate scoring algorithm matches team member profiles against a 15-skill role map, ranking by percentage fit |
| **Give every user only what they need** | Role-based access control enforced at three layers — route guards, API middleware, and conditional UI rendering |
| **Reduce status-update friction** | AI chat parses natural language ("I finished the login page") and silently updates the corresponding task in the database |
| **Keep teams informed without noise** | Opt-in email alerts for task/project changes, plus automated weekly summaries delivered in each user's local timezone |
| **Serve a global team** | Full internationalization across English, Spanish, French, and German with database-persisted preferences |

---

## ✨ Key Features

### 🤖 AI-Powered Project Generation
Upload a PDF spec or write a description. A two-stage AI pipeline first extracts the staffing roles your project needs, then generates tasks — each one pre-assigned to the appropriate role. Updating a project later? The AI merges new requirements with existing tasks instead of overwriting your work.

### 🎯 Intelligent Candidate Matching
Every team member is scored against the role you're hiring for. The algorithm builds a skill pool from assigned tasks, role definitions, and a curated 15-skill map per role type, then calculates match percentage. Candidates sort highest-fit-first, with hired members pinned to the top.

### 📊 Role-Scoped Task Management
Four status states — Not Started, In Progress, Delayed, Complete. Managers control everything. Team members can only update tasks belonging to the role they were hired into, enforced on both the client and the API. Inline editing for task details keeps everyone in context.

### 💬 AI Assistant + Team Chat
A single chat panel with two modes. The **AI tab** knows your entire project context and can answer questions, give guidance, or update task progress from conversation. The **Messages tab** handles direct messages and group channels with any project coworker.

### 📅 Shared Project Calendar
Create meetings with time slots and invited participants, or deadlines linked to specific tasks. Everyone involved gets an email — no configuration needed.

### 🔔 Smart Notifications
Instant email alerts on task updates, project changes, and calendar events — respecting each user's opt-in preference. Plus automated weekly project summaries delivered every Monday at 6:00 AM in the recipient's own timezone.

### 🌍 Four-Language Support
English, Spanish, French, and German. Switch instantly from Settings; your choice persists across devices via the database.

---

## 🛠️ Technology Stack

<table>
<tr><th align="left">Layer</th><th align="left">Technologies</th></tr>
<tr>
<td><b>Frontend</b></td>
<td>
React 18 · Vite 5 · Tailwind CSS 4 · React Router v6<br>
i18next + react-i18next · Recharts · Lucide React · React Markdown
</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>
Node.js · Express · Multer (file uploads) · node-cron
</td>
</tr>
<tr>
<td><b>Database & Auth</b></td>
<td>
Supabase — PostgreSQL, Row Level Security, Auth (email + Google OAuth), Storage
</td>
</tr>
<tr>
<td><b>AI</b></td>
<td>
LangChain · Groq (llama-3.3-70b-versatile) · Google Generative AI Embeddings
</td>
</tr>
<tr>
<td><b>Email</b></td>
<td>
Resend — transactional alerts and scheduled weekly reports
</td>
</tr>
<tr>
<td><b>Deployment</b></td>
<td>
Vercel (frontend) · Render (backend) · Supabase Cloud (database)
</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                     │
│         React SPA · Vite · Tailwind · Vercel          │
└────────────────────────┬─────────────────────────────┘
                         │  REST API (JSON + JWT)
┌────────────────────────▼─────────────────────────────┐
│               APPLICATION LAYER                       │
│           Express.js REST API · Render                │
│                                                       │
│  /api/auth   /api/users    /api/projects   /api/tasks │
│  /api/uploads  /api/calendar  /api/chat               │
└──┬──────────────┬──────────────┬──────────────┬───────┘
   │              │              │              │
┌──▼────────┐ ┌───▼────────┐ ┌───▼───────┐ ┌────▼──────┐
│ Supabase  │ │   Groq     │ │  Resend   │ │  Google   │
│ Postgres  │ │ llama-3.3  │ │  Email    │ │  OAuth    │
│ Auth      │ │ LangChain  │ │  API      │ │           │
│ Storage   │ │            │ │           │ │           │
└───────────┘ └────────────┘ └───────────┘ └───────────┘
```

---

## 📁 Project Structure

```
ai-supervisor-assistant/
│
├── Frontend/
│   ├── src/
│   │   ├── i18n.js                  # Translations (EN · ES · FR · DE)
│   │   ├── main.jsx                 # Entry point
│   │   ├── App.jsx                  # Route definitions
│   │   ├── Context/                 # AuthProvider · AppSettingsProvider
│   │   ├── Pages/                   # Dashboard · AddProject · Candidates · Settings
│   │   └── Components/
│   │       ├── Sidebar.jsx
│   │       ├── FloatingChat.jsx
│   │       ├── Dashboard/           # StatsCards · DonutChart · ProjectList · Calendar
│   │       ├── Project/             # ProjectView · TaskItem · ProjectChat
│   │       ├── Candidate/           # CandidateCard
│   │       └── Settings/            # Profile · Notifications · Appearance
│   └── vercel.json
│
└── backend/
    └── src/
        ├── index.js                 # Express entry point
        ├── agents/
        │   └── parseProject.js      # AI task & role generation
        ├── Controllers/             # auth · user · project · task · members · calendar · chat
        ├── Routes/                  # REST route definitions
        ├── Middleware/              # JWT auth guard · role checks
        ├── lib/                     # aiConfig.js · supabaseClient.js
        └── Utils/
            ├── NotificationService.js
            ├── WeeklyReportJob.js
            └── *EmailTemplate.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A [Supabase](https://supabase.com) project
- API keys: [Groq](https://console.groq.com) · [Google AI](https://aistudio.google.com) · [Resend](https://resend.com)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-supervisor-assistant.git
cd ai-supervisor-assistant
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 3. Configure environment variables

<details>
<summary><b>backend/.env</b></summary>

```env
PORT=5000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=...
RESEND_API_KEY=re_...
```
</details>

<details>
<summary><b>Frontend/.env</b></summary>

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
</details>

### 4. Set up the database

Run the SQL scripts in your Supabase SQL Editor to create the eight core tables:

`profiles` · `projects` · `tasks` · `project_members` · `uploads` · `calendar_events` · `chat_messages` · `chat_channels`

Then create two Storage buckets: **`project_docs`** and **`avatars`**.

### 5. Run the app

```bash
# Terminal 1 — Backend  →  http://localhost:5000
cd backend && npm run dev

# Terminal 2 — Frontend →  http://localhost:5173
cd Frontend && npm run dev
```

---

## 👥 User Roles

<table>
<tr><th align="left" width="50%">👔 Manager</th><th align="left" width="50%">💻 Team Member</th></tr>
<tr valign="top">
<td>

- Create & update projects with AI generation
- Browse and hire candidates by match score
- Full task control — edit, assign, set any status
- Create calendar meetings & deadlines
- Access to all project analytics

</td>
<td>

- View only projects they're hired into
- Update status on tasks for their role
- Edit task details within their scope
- Full chat access — AI + team messaging
- Personal dashboard & settings

</td>
</tr>
</table>

---

## 📡 API Overview

| Group | Base Path | Key Endpoints |
|---|---|---|
| **Auth** | `/api/auth` | `POST /register` · `POST /login` |
| **Users** | `/api/users` | `GET /me` · `GET|PUT /profile` · `PUT /preferences` |
| **Projects** | `/api/projects` | `GET /` · `GET /:id` · `POST /` · `PUT /:id/roles` · `DELETE /:id` |
| **Tasks** | `/api/tasks` | `GET /:projectId` · `PATCH /:id/status` · `PATCH /:id/assign` · `POST /assign-roles/:projectId` |
| **Members** | `/api/projects` | `GET /:id/candidates` · `POST /:id/hire` · `DELETE /:id/fire/:userId` |
| **Uploads** | `/api/uploads` | `POST /:projectId` *(multipart PDF)* |
| **Calendar** | `/api/calendar` | `GET /` · `POST /` · `DELETE /:id` · `GET /colleagues` |
| **Chat** | `/api/chat` | `POST /:projectId` *(AI)* · `GET|POST /:projectId/channels` · `POST /channels/:id/messages` |

> All protected routes require an `Authorization: Bearer <token>` header.

---

## 🔐 Security

- **JWT authentication** on every protected endpoint via Supabase Auth
- **Row Level Security** enabled on all database tables
- **Service role key** used only server-side — never exposed to the client
- **Three-layer RBAC** — route guards, API middleware, and conditional UI
- **Scoped mutations** — team members can only modify tasks matching their hired role

---

## 📧 Notification Matrix

| Trigger | Recipients | Respects Opt-In |
|---|---|:---:|
| Task status changed | Manager + hired members | ✅ |
| New tasks/roles added | Hired members | ✅ |
| Deadline created | All project members | — |
| Meeting created | Invited participants | — |
| Candidate hired | The hired candidate | — |
| Weekly summary | Users with reports enabled | 📅 Mon 6AM |

---

## 🗺️ Roadmap

- [ ] WebSocket-based real-time chat (replacing 3s polling)
- [ ] Optimistic UI updates for instant status feedback
- [ ] Skeleton loading states for improved perceived performance
- [ ] Task dependency graph & critical path visualization
- [ ] Time tracking and burndown charts
- [ ] Mobile-responsive layout refinements
- [ ] Additional language support

---

## 📄 License

This project is available under the MIT License.

---

<div align="center">

**Built with React, Node.js, Supabase, and a lot of AI**

[⬆ Back to top](#-ai-supervisor-assistant)

</div>
