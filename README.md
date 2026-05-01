# Task Manager (Projects + Tasks + RBAC)

Full-stack web app where users can create projects, manage team members, assign tasks, and track progress with role-based access (**Admin / Member**).

## Tech

- **API**: Node.js + Express + Prisma + SQLite
- **Web**: React + Vite + Tailwind
- **Auth**: JWT (access token)
- **Validation**: Zod

## Quick start

### 1) Install

```bash
npm install
```

### 2) Configure env

Copy env files:

```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

### 3) Setup DB

```bash
npm run db:push -w @tm/api
```

### 4) Run dev servers

```bash
npm run dev
```

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

## RBAC rules (summary)

- **Project Admin** can:
  - Update project
  - Add/remove members
  - Create/edit/delete tasks in project
  - Assign tasks
- **Project Member** can:
  - View project + tasks
  - Create tasks (optional; enabled here)
  - Update status of tasks assigned to them

