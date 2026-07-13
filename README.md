# CodeAlpha_ProjectManagementTool

A complete, collaborative full-stack Agile Project Management platform developed as a showcase project for the **CodeAlpha Full Stack Development Internship**. Inspired by platforms like Trello and Asana, it allows users to organize project boards, assign tasks to members, set due dates and priorities, write comments, track team progress via real-time feel notifications, and monitor system metrics in an administrative panel.

---

## 🚀 Key Features

* **Secure Authentication & Roles Matrix**: Fully-featured registration and login routes guarded by bcrypt password hashing and JWT token states.
* **Role-Based Access Control (RBAC)**:
  * **Admin**: Oversees global system statistics, user directories, and possesses editing capabilities across all scopes.
  * **Project Manager**: Authorized to establish workspaces, invite team members, design custom board columns, and assign tasks.
  * **Member**: Authorized to move task cards, comment on threads, modify passwords, and receive tailored task assignments.
* **Agile Kanban Boards**: Create customizable columns (e.g., Todo, In Progress, In Review, Completed) and easily shift task cards with responsive column controls.
* **Fine-Grained Task Management**:
  * Set titles, descriptions, and labels.
  * Assign project members to tasks.
  * Set HTML5 due dates and priority indicators (*Low, Medium, High*).
  * Attach files/external documents.
* **Interactive Comments Feed**: Threads on task cards with individual comment delete permissions.
* **Responsive Bento Dashboard**: Features real-time countdown deadlines, upcoming assignment logs, and visual **Recharts analytics** summarizing global team task allocations.
* **Tailored Notification Center**: Automatic inbox notifications for task assignments, comment postings, and completed milestones with a 10-click polling cycle for live feel.
* **Admin Control Center**: Visual system metrics counters, user registry listings, and database status monitors.

---

## 🛠️ Technology Stack

### Frontend
* **Framework**: React 19 (Vite, TypeScript)
* **Routing**: React Router DOM (HashRouter for iframe/deployment safety)
* **Charts & Metrics**: Recharts
* **Icons**: Lucide React
* **Styling**: Tailwind CSS
* **Session Core**: Context API + Unified apiFetch Helper

### Backend & Database
* **Runtime**: Node.js & Express.js
* **Middleware**: JWT Verification, bcryptjs, CORS, JSON Parsers
* **Database Layer**: Clean file-backed `db.json` persistence engine simulating MongoDB Atlas Collections (Users, Projects, Boards, Tasks, Comments, Notifications) out of the box with zero setup keys required, fully supporting external MongoDB configurations.

---

## 📂 Production Folder Structure

```text
CodeAlpha_ProjectManagementTool/
├── db.json                     # Local JSON database storage file
├── metadata.json               # AI Studio application metadata
├── package.json                # Project configurations & scripts
├── server.ts                   # Custom Express Entry Point
├── vite.config.ts              # Vite configuration
├── server/                     # MVC Backend Modules
│   ├── middleware/
│   │   └── auth.ts             # JWT authentication middleware & roles guard
│   ├── models/
│   │   └── dbStore.ts          # Database schema layer and 10-user demo seeder
│   └── routes/
│       └── api.ts              # API Controller routing endpoints
└── src/                        # React Frontend Core
    ├── App.tsx                 # Root router shell
    ├── main.tsx                # Entry point
    ├── index.css               # Tailwind CSS styles
    ├── types.ts                # Shared TypeScript models
    ├── components/
    │   ├── Header.tsx          # Top nav & notification center dropdown
    │   └── Sidebar.tsx         # Left panel navigation links & user info
    ├── context/
    │   └── AuthContext.tsx     # Session management and toast manager
    └── pages/
        ├── AdminPage.tsx       # Admin statistics and registry grid
        ├── Dashboard.tsx       # Personal bento overview and recharts analytics
        ├── LandingPage.tsx     # Hero page with 1-click Demo portals
        ├── NotFoundPage.tsx    # Custom 404 page
        ├── ProfilePage.tsx     # Avatar & password manager
        ├── ProjectDetails.tsx  # Collaborative board columns and comments
        └── ProjectsPage.tsx    # Projects grid and invitations form
```

---

## 🔑 REST API Endpoints

### Authentication
* `POST /api/auth/register` — Create custom profile and return JWT token.
* `POST /api/auth/login` — Validate password hashes and return session token.
* `GET /api/auth/profile` — Fetch logged-in user profile attributes.
* `PUT /api/auth/profile` — Update name, profile picture, or reset password.

### Projects
* `GET /api/projects` — Fetch collaborative projects (guarded).
* `GET /api/projects/:id` — Fetch detailed project with populating owners.
* `POST /api/projects` — Build new project and auto-create default boards (*Project Manager / Admin only*).
* `PUT /api/projects/:id` — Edit titles, status, or invite members.
* `DELETE /api/projects/:id` — Delete project and cascade-remove tasks.

### Boards
* `GET /api/boards/:projectId` — Fetch columns for project.
* `POST /api/boards` — Create board column.
* `DELETE /api/boards/:id` — Delete column and cascade tasks.

### Tasks
* `GET /api/tasks` — Fetch global or project tasks.
* `POST /api/tasks` — Create task card and dispatch assignment notification.
* `PUT /api/tasks/:id` — Modify description, assignedTo, priority, or due date.
* `PUT /api/tasks/:id/status` — Move task between board columns.
* `DELETE /api/tasks/:id` — Delete task card.

### Comments & Notifications
* `POST /api/comments/:taskId` — Post text comment to task thread.
* `GET /api/comments/:taskId` — Load comment thread with populating user details.
* `DELETE /api/comments/:id` — Delete comment.
* `GET /api/notifications` — Retrieve tailored notifications inbox.
* `PUT /api/notifications/read` — Mark all alerts as read.

---

## 🏃 Local Installation Guide

### Prerequisites
* [Node.js](https://nodejs.org) (v18.0 or higher recommended)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/yourusername/CodeAlpha_ProjectManagementTool.git
cd CodeAlpha_ProjectManagementTool
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Development Server
```bash
npm run dev
```
The server will start on [http://localhost:3000](http://localhost:3000), mounting both the backend REST APIs and the front-end Vite HMR.

---

## ⚡ 1-Click Sandbox Credentials
To review different user perspective roles seamlessly, the platform pre-seeds **10 active team accounts** with **5 projects, board columns, and 50 tasks**. 

Use the quick-click buttons on the landing page, or login manually using password `password123`:

| Role | Email | Name |
| :--- | :--- | :--- |
| **System Admin** | `alex.morgan@codealpha.com` | Alex Morgan |
| **Project Manager** | `sarah.connor@codealpha.com` | Sarah Connor |
| **Team Member** | `emily.watson@codealpha.com` | Emily Watson |

---

## 🌐 Production Deployment

### Option A: Server + Client Unified (Render / Heroku)
The repository is bundled to compile both backend and frontend together for single-host ease (e.g. Render Web Services):
1. Configure Environment Variable `NODE_ENV=production`.
2. Set Build Command: `npm run build`
3. Set Start Command: `npm run start`

### Option B: Split Decoupled (Vercel + Render)
* **Frontend**: Deploy the static `dist/` directory to Vercel. Ensure client-side SPA fallback points to `index.html`.
* **Backend**: Build and run the `server.ts` Express file with a real `MONGODB_URI` environment variable set in production.
