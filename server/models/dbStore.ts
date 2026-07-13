import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  profilePicture: string;
  role: "Admin" | "Project Manager" | "Member";
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  owner: string; // User ID
  members: string[]; // User IDs
  status: "Planning" | "Active" | "Completed" | "On Hold";
  createdAt: string;
}

export interface Board {
  id: string;
  project: string; // Project ID
  title: string;
  order: number;
}

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface Task {
  id: string;
  project: string; // Project ID
  board: string; // Board ID
  title: string;
  description: string;
  assignedTo: string | null; // User ID or null
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  labels: string[];
  attachments: TaskAttachment[];
  status: "Todo" | "In Progress" | "Review" | "Completed";
  createdAt: string;
}

export interface Comment {
  id: string;
  task: string; // Task ID
  user: string; // User ID
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  user: string; // User ID
  message: string;
  type: "assignment" | "status" | "comment" | "deadline" | "system";
  isRead: boolean;
  createdAt: string;
}

interface DBStructure {
  users: User[];
  projects: Project[];
  boards: Board[];
  tasks: Task[];
  comments: Comment[];
  notifications: Notification[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

class DatabaseStore {
  private db: DBStructure = {
    users: [],
    projects: [],
    boards: [],
    tasks: [],
    comments: [],
    notifications: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.db = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.db.users) this.db.users = [];
        if (!this.db.projects) this.db.projects = [];
        if (!this.db.boards) this.db.boards = [];
        if (!this.db.tasks) this.db.tasks = [];
        if (!this.db.comments) this.db.comments = [];
        if (!this.db.notifications) this.db.notifications = [];
      } catch (e) {
        console.error("Error reading database file, resetting to empty", e);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to database file", e);
    }
  }

  private seedInitialData() {
    console.log("Seeding database with default data...");
    const pwHash = bcrypt.hashSync("password123", 10);

    // 1. Seed 10 Users
    const roles: ("Admin" | "Project Manager" | "Member")[] = [
      "Admin",
      "Project Manager",
      "Project Manager",
      "Member",
      "Member",
      "Member",
      "Member",
      "Member",
      "Member",
      "Member",
    ];

    const names = [
      "Alex Morgan",
      "Sarah Connor",
      "David Chen",
      "Emily Watson",
      "Marcus Aurelius",
      "Elena Rostova",
      "James Smith",
      "Chloe Jenkins",
      "Ryan Reynolds",
      "Sophia Loren",
    ];

    const emails = [
      "alex.morgan@codealpha.com",
      "sarah.connor@codealpha.com",
      "david.chen@codealpha.com",
      "emily.watson@codealpha.com",
      "marcus.aurelius@codealpha.com",
      "elena.rostova@codealpha.com",
      "james.smith@codealpha.com",
      "chloe.jenkins@codealpha.com",
      "ryan.reynolds@codealpha.com",
      "sophia.loren@codealpha.com",
    ];

    const users: User[] = names.map((name, i) => ({
      id: `usr_${i + 1}`,
      name,
      email: emails[i],
      passwordHash: pwHash,
      profilePicture: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=150&h=150&q=80`,
      role: roles[i],
      createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    this.db.users = users;

    // 2. Seed 5 Projects
    const projectDetails = [
      {
        id: "proj_1",
        title: "E-Commerce Redesign",
        description: "Overhaul the entire checkout, listing, and payment flow of the retail web app.",
        owner: "usr_2", // Sarah Connor
        members: ["usr_2", "usr_4", "usr_5", "usr_6", "usr_1"],
        status: "Active" as const,
      },
      {
        id: "proj_2",
        title: "Mobile Health Tracker App",
        description: "Develop a native iOS and Android application with steps tracking, caloric log, and vital monitors.",
        owner: "usr_3", // David Chen
        members: ["usr_3", "usr_7", "usr_8", "usr_9", "usr_1"],
        status: "Active" as const,
      },
      {
        id: "proj_3",
        title: "AI Workspace Core",
        description: "Integrate large language model workflows for automatic meeting summaries and document tagging.",
        owner: "usr_1", // Alex Morgan
        members: ["usr_1", "usr_2", "usr_3", "usr_4", "usr_10"],
        status: "Active" as const,
      },
      {
        id: "proj_4",
        title: "AWS Cloud Migration",
        description: "Migrate legacy on-premise relational database systems to fully scalable AWS RDS clusters.",
        owner: "usr_2", // Sarah Connor
        members: ["usr_2", "usr_5", "usr_9"],
        status: "Planning" as const,
      },
      {
        id: "proj_5",
        title: "Q3 Global Marketing Strategy",
        description: "Inbound and outbound marketing drive targeting tech developers and software leads.",
        owner: "usr_3", // David Chen
        members: ["usr_3", "usr_8", "usr_10"],
        status: "Completed" as const,
      },
    ];

    this.db.projects = projectDetails.map((p) => ({
      ...p,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // 3. Seed 4 Boards per Project
    const boardTitles = ["Todo", "In Progress", "Review", "Completed"];
    const boards: Board[] = [];
    let boardIdCounter = 1;

    projectDetails.forEach((proj) => {
      boardTitles.forEach((title, idx) => {
        boards.push({
          id: `brd_${boardIdCounter++}`,
          project: proj.id,
          title,
          order: idx,
        });
      });
    });

    this.db.boards = boards;

    // 4. Seed 50 Tasks (approx 10 per project)
    const tasks: Task[] = [];
    let taskIdCounter = 1;

    const taskLabels = [
      ["Frontend", "Design"],
      ["Backend", "Database"],
      ["Bug", "Hotfix"],
      ["Documentation"],
      ["Research", "Spike"],
      ["Testing", "QA"],
    ];

    const priorities: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];

    const taskTemplates = [
      { title: "Define design system and color palette", desc: "Create a Figma space detailing tokens, text styles, and component boundaries." },
      { title: "Database schema migration setup", desc: "Write sql migrations or schema files for entities including tables and relations." },
      { title: "Configure JWT and middleware", desc: "Set up login route, password validation, session keys, and authenticated route guards." },
      { title: "Write user testing documentation", desc: "Prepare detailed document covering registration flow and validation test scripts." },
      { title: "Perform benchmark on Redis cache", desc: "Evaluate transaction throughput across different caching layers and key policies." },
      { title: "Fix session logout cookie bug", desc: "Correct secure-cookie headers causing occasional early session drops on browser restart." },
      { title: "Create analytical report template", desc: "Code interactive responsive components with clean data visualizers using d3 or recharts." },
      { title: "Conduct code quality audit", desc: "Perform deep linting across modules, clean imports, and refactor code to increase modularity." },
      { title: "Set up CI/CD pipeline", desc: "Build action configurations for compiling, testing, and triggering deployment on staging." },
      { title: "Integrate third-party mailing service", desc: "Establish communication templates for user activation, invitations, and resets." },
    ];

    projectDetails.forEach((proj) => {
      // Find boards for this project
      const projBoards = boards.filter((b) => b.project === proj.id);

      for (let i = 0; i < 10; i++) {
        const boardIdx = Math.floor(Math.random() * projBoards.length);
        const board = projBoards[boardIdx];
        const template = taskTemplates[i % taskTemplates.length];
        const assignedMember = proj.members[i % proj.members.length];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const labels = taskLabels[i % taskLabels.length];

        const daysOffset = Math.floor(Math.random() * 20) - 5; // -5 to +15 days from now
        const dueDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const attachments = i % 3 === 0 ? [{ name: "specifications_doc.pdf", url: "https://pdfobject.com/pdf/sample.pdf" }] : [];

        tasks.push({
          id: `tsk_${taskIdCounter++}`,
          project: proj.id,
          board: board.id,
          title: `${proj.title.split(" ")[0]}: ${template.title}`,
          description: template.desc,
          assignedTo: assignedMember,
          priority,
          dueDate,
          labels,
          attachments,
          status: board.title as ("Todo" | "In Progress" | "Review" | "Completed"),
          createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    });

    this.db.tasks = tasks;

    // 5. Seed Comments
    const comments: Comment[] = [];
    let commentIdCounter = 1;

    for (let i = 1; i <= 20; i++) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      // find members of this project
      const proj = projectDetails.find((p) => p.id === task.project);
      const commenter = proj ? proj.members[Math.floor(Math.random() * proj.members.length)] : "usr_1";

      const commentMessages = [
        "I've made good progress on this. Frontend elements are mostly in place.",
        "Could someone review my PR on this module? Looking for comments.",
        "We might need to clarify requirements with the client before moving on.",
        "Due date is approaching, let's prioritize wrapping this up.",
        "Completed the backend API integration for this feature. Works perfectly!",
      ];

      comments.push({
        id: `cmt_${commentIdCounter++}`,
        task: task.id,
        user: commenter,
        message: commentMessages[i % commentMessages.length],
        createdAt: new Date(Date.now() - (10 - i) * 60 * 60 * 1000).toISOString(),
      });
    }

    this.db.comments = comments;

    // 6. Seed Notifications
    const notifications: Notification[] = [
      {
        id: "ntf_1",
        user: "usr_1",
        message: "Sarah Connor assigned you to the task 'E-Commerce: Configure JWT and middleware'.",
        type: "assignment",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ntf_2",
        user: "usr_1",
        message: "The deadline for 'E-Commerce: Define design system' is tomorrow.",
        type: "deadline",
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ntf_3",
        user: "usr_2",
        message: "David Chen commented on your task 'E-Commerce Redesign: Fix session logout'.",
        type: "comment",
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.db.notifications = notifications;

    this.save();
    console.log("Database seeded successfully with all mock collections!");
  }

  // --- QUERY APIS ---

  public getUsers(): User[] {
    return this.db.users;
  }

  public addUser(user: User) {
    this.db.users.push(user);
    this.save();
  }

  public updateUser(user: User) {
    const idx = this.db.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.db.users[idx] = user;
      this.save();
    }
  }

  public getProjects(): Project[] {
    return this.db.projects;
  }

  public addProject(project: Project) {
    this.db.projects.push(project);
    this.save();
  }

  public updateProject(project: Project) {
    const idx = this.db.projects.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      this.db.projects[idx] = project;
      this.save();
    }
  }

  public deleteProject(projectId: string) {
    this.db.projects = this.db.projects.filter((p) => p.id !== projectId);
    // Cascade delete boards, tasks, comments
    const projectBoards = this.db.boards.filter((b) => b.project === projectId).map((b) => b.id);
    this.db.boards = this.db.boards.filter((b) => b.project !== projectId);
    const projectTasks = this.db.tasks.filter((t) => t.project === projectId).map((t) => t.id);
    this.db.tasks = this.db.tasks.filter((t) => t.project !== projectId);
    this.db.comments = this.db.comments.filter((c) => !projectTasks.includes(c.task));
    this.save();
  }

  public getBoards(): Board[] {
    return this.db.boards;
  }

  public addBoard(board: Board) {
    this.db.boards.push(board);
    this.save();
  }

  public updateBoard(board: Board) {
    const idx = this.db.boards.findIndex((b) => b.id === board.id);
    if (idx !== -1) {
      this.db.boards[idx] = board;
      this.save();
    }
  }

  public deleteBoard(boardId: string) {
    this.db.boards = this.db.boards.filter((b) => b.id !== boardId);
    // Cascade delete tasks
    const boardTasks = this.db.tasks.filter((t) => t.board === boardId).map((t) => t.id);
    this.db.tasks = this.db.tasks.filter((t) => t.board !== boardId);
    this.db.comments = this.db.comments.filter((c) => !boardTasks.includes(c.task));
    this.save();
  }

  public getTasks(): Task[] {
    return this.db.tasks;
  }

  public addTask(task: Task) {
    this.db.tasks.push(task);
    this.save();
  }

  public updateTask(task: Task) {
    const idx = this.db.tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      this.db.tasks[idx] = task;
      this.save();
    }
  }

  public deleteTask(taskId: string) {
    this.db.tasks = this.db.tasks.filter((t) => t.id !== taskId);
    this.db.comments = this.db.comments.filter((c) => c.task !== taskId);
    this.save();
  }

  public getComments(): Comment[] {
    return this.db.comments;
  }

  public addComment(comment: Comment) {
    this.db.comments.push(comment);
    this.save();
  }

  public deleteComment(commentId: string) {
    this.db.comments = this.db.comments.filter((c) => c.id !== commentId);
    this.save();
  }

  public getNotifications(): Notification[] {
    return this.db.notifications;
  }

  public addNotification(notification: Notification) {
    this.db.notifications.push(notification);
    this.save();
  }

  public markNotificationsRead(userId: string) {
    this.db.notifications = this.db.notifications.map((n) =>
      n.user === userId ? { ...n, isRead: true } : n
    );
    this.save();
  }
}

export const dbStore = new DatabaseStore();
