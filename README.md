# Agile Sprint Board — Frontend

Angular 19 frontend for the BiCXO Sprint Board. A Kanban-style task board with drag & drop, infinite scroll, and team task assignment.

**Backend Repo:** https://github.com/Keertan-Lashkare/Agile-Sprint-Board-Api

---

## Prerequisites

Make sure these are installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher

---

## Step 1 — Install Dependencies

```bash
npm install
```

---

## Step 2 — Configure API URL

Open `src/environments/environment.ts` and make sure the API URL points to your backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

> Make sure the backend server is running before starting the frontend.

---

## Step 3 — Start the App

```bash
npm run dev
```

App runs at → **http://localhost:4200**

---

## Step 4 — Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

---

## How to Use

1. **Register** a new account on the register page
2. **Login** with your credentials
3. **Create tasks** using the `+ Add Task` button
4. **Assign** tasks to teammates from the task form
5. **Drag and drop** tasks between columns
6. **Search** tasks using the search bar
7. **Filter** by priority or "Assigned to Me"
8. **Scroll down** in any column to load more tasks

---

## Features

| Feature | Details |
|---------|---------|
| Authentication | Register, Login, JWT-based sessions |
| Kanban Board | To Do, In Progress, Done columns |
| Drag & Drop | Move tasks between columns |
| Task Labels | "My Task" (blue) / "Assigned by Name" (amber) |
| Permissions | Only creators can delete; assignees can edit & drag |
| Search | Live search across title and description |
| Filters | Filter by priority or assigned user |
| Infinite Scroll | Scroll to bottom of column to load more |

---

## Running Tests

```bash
npm run test
```

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── board/          # Kanban board (main page)
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   └── task-modal/     # Create / Edit task modal
│   ├── guards/             # Route protection (auth guard)
│   └── services/           # API service calls (auth, tasks)
├── environments/           # API URL config
└── styles.css              # Global styles
```

---

## Tech Stack

- **Framework:** Angular 19
- **Language:** TypeScript
- **Drag & Drop:** Angular CDK
- **Styling:** Vanilla CSS (Inter font)
- **Testing:** Vitest
