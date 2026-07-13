import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbStore, User, Project, Board, Task, Comment, Notification } from "../models/dbStore.js";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "codealpha_super_secret_key_9876";

// Helper to populate user details
function populateUser(userId: string | null) {
  if (!userId) return null;
  const user = dbStore.getUsers().find((u) => u.id === userId);
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Helper to check if a user is a member of a project
function isProjectMember(userId: string, project: Project): boolean {
  const user = dbStore.getUsers().find((u) => u.id === userId);
  if (user && user.role === "Admin") return true;
  return project.owner === userId || project.members.includes(userId);
}

// --- AUTHENTICATION ---

// POST /api/auth/register
router.post("/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email and password are required" });
    return;
  }

  const existing = dbStore.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ message: "A user with this email already exists" });
    return;
  }

  const requestedRole = role || "Member";
  const userRole: "Admin" | "Project Manager" | "Member" =
    requestedRole === "Admin" || requestedRole === "Project Manager" ? requestedRole : "Member";

  const passwordHash = bcrypt.hashSync(password, 10);
  const userIndex = dbStore.getUsers().length + 1;
  const newUser: User = {
    id: `usr_${Date.now()}_${userIndex}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    profilePicture: `https://images.unsplash.com/photo-${1500000000000 + userIndex * 150000}?auto=format&fit=crop&w=150&h=150&q=80`,
    role: userRole,
    createdAt: new Date().toISOString(),
  };

  dbStore.addUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, role: newUser.role, email: newUser.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

// POST /api/auth/login
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = dbStore.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const { passwordHash: _, ...safeUser } = user;
  res.status(200).json({ user: safeUser, token });
});

// GET /api/auth/profile
router.get("/auth/profile", authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = dbStore.getUsers().find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/auth/profile
router.put("/auth/profile", authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = dbStore.getUsers().find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { name, profilePicture, password } = req.body;

  if (name) user.name = name;
  if (profilePicture) user.profilePicture = profilePicture;
  if (password) {
    user.passwordHash = bcrypt.hashSync(password, 10);
  }

  dbStore.updateUser(user);

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// --- PROJECTS ---

// GET /api/projects
router.get("/projects", authMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  let projects = dbStore.getProjects();
  if (userRole !== "Admin") {
    projects = projects.filter((p) => p.owner === userId || p.members.includes(userId));
  }

  // Populate owner and members profiles
  const populatedProjects = projects.map((p) => ({
    ...p,
    ownerDetails: populateUser(p.owner),
    memberDetails: p.members.map((mId) => populateUser(mId)).filter(Boolean),
  }));

  res.json(populatedProjects);
});

// GET /api/projects/:id
router.get("/projects/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const project = dbStore.getProjects().find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (!isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied to this project" });
    return;
  }

  res.json({
    ...project,
    ownerDetails: populateUser(project.owner),
    memberDetails: project.members.map((mId) => populateUser(mId)).filter(Boolean),
  });
});

// POST /api/projects
router.post("/projects", authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, description, status, members } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  if (userRole === "Member") {
    res.status(403).json({ message: "Only managers and admins can create projects" });
    return;
  }

  if (!title) {
    res.status(400).json({ message: "Project title is required" });
    return;
  }

  const projId = `proj_${Date.now()}`;
  const membersList: string[] = Array.isArray(members) ? members : [];
  if (!membersList.includes(userId)) {
    membersList.push(userId);
  }

  const newProject: Project = {
    id: projId,
    title,
    description: description || "",
    owner: userId,
    members: membersList,
    status: status || "Planning",
    createdAt: new Date().toISOString(),
  };

  dbStore.addProject(newProject);

  // Auto-create default boards for new project: Todo, In Progress, Review, Completed
  const defaultBoards = ["Todo", "In Progress", "Review", "Completed"];
  defaultBoards.forEach((title, order) => {
    dbStore.addBoard({
      id: `brd_${Date.now()}_${order}`,
      project: projId,
      title,
      order,
    });
  });

  // Create system notification for all invited members
  membersList.forEach((mId) => {
    if (mId !== userId) {
      dbStore.addNotification({
        id: `ntf_${Date.now()}_${mId}`,
        user: mId,
        message: `${populateUser(userId)?.name || "A project manager"} invited you to join the project: "${title}"`,
        type: "system",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  res.status(201).json(newProject);
});

// PUT /api/projects/:id
router.put("/projects/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const project = dbStore.getProjects().find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const userId = req.user!.id;
  const userRole = req.user!.role;

  if (project.owner !== userId && userRole !== "Admin") {
    res.status(403).json({ message: "Only the project owner or admins can modify the project" });
    return;
  }

  const { title, description, status, members } = req.body;

  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (status) project.status = status;
  if (Array.isArray(members)) {
    const oldMembers = [...project.members];
    project.members = members;
    if (!project.members.includes(project.owner)) {
      project.members.push(project.owner);
    }

    // Alert newly added members
    project.members.forEach((mId) => {
      if (!oldMembers.includes(mId) && mId !== userId) {
        dbStore.addNotification({
          id: `ntf_${Date.now()}_${mId}`,
          user: mId,
          message: `${populateUser(userId)?.name} added you to the project: "${project.title}"`,
          type: "system",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  dbStore.updateProject(project);
  res.json(project);
});

// DELETE /api/projects/:id
router.delete("/projects/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const project = dbStore.getProjects().find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const userId = req.user!.id;
  const userRole = req.user!.role;

  if (project.owner !== userId && userRole !== "Admin") {
    res.status(403).json({ message: "Only the project owner or admins can delete this project" });
    return;
  }

  dbStore.deleteProject(project.id);
  res.json({ message: "Project deleted successfully", id: project.id });
});

// --- BOARDS ---

// GET /api/boards/:projectId
router.get("/boards/:projectId", authMiddleware, (req: AuthenticatedRequest, res) => {
  const project = dbStore.getProjects().find((p) => p.id === req.params.projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (!isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const boards = dbStore.getBoards()
    .filter((b) => b.project === req.params.projectId)
    .sort((a, b) => a.order - b.order);

  res.json(boards);
});

// POST /api/boards
router.post("/boards", authMiddleware, (req: AuthenticatedRequest, res) => {
  const { project: projectId, title, order } = req.body;

  const project = dbStore.getProjects().find((p) => p.id === projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (!isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  if (!title) {
    res.status(400).json({ message: "Board title is required" });
    return;
  }

  const newBoard: Board = {
    id: `brd_${Date.now()}`,
    project: projectId,
    title,
    order: typeof order === "number" ? order : dbStore.getBoards().filter((b) => b.project === projectId).length,
  };

  dbStore.addBoard(newBoard);
  res.status(201).json(newBoard);
});

// PUT /api/boards/:id
router.put("/boards/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const board = dbStore.getBoards().find((b) => b.id === req.params.id);
  if (!board) {
    res.status(404).json({ message: "Board not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === board.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { title, order } = req.body;
  if (title) board.title = title;
  if (typeof order === "number") board.order = order;

  dbStore.updateBoard(board);
  res.json(board);
});

// DELETE /api/boards/:id
router.delete("/boards/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const board = dbStore.getBoards().find((b) => b.id === req.params.id);
  if (!board) {
    res.status(404).json({ message: "Board not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === board.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  dbStore.deleteBoard(board.id);
  res.json({ message: "Board deleted successfully", id: board.id });
});

// --- TASKS ---

// GET /api/tasks
router.get("/tasks", authMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { projectId, assignedTo, search } = req.query;

  let tasks = dbStore.getTasks();

  // If a projectId is provided, filter tasks by project
  if (projectId) {
    const project = dbStore.getProjects().find((p) => p.id === projectId);
    if (!project || !isProjectMember(userId, project)) {
      res.status(403).json({ message: "Access denied to project tasks" });
      return;
    }
    tasks = tasks.filter((t) => t.project === projectId);
  } else {
    // If no project specified, only return tasks from projects the user is a member of
    const userProjects = dbStore.getProjects().filter((p) => isProjectMember(userId, p)).map((p) => p.id);
    tasks = tasks.filter((t) => userProjects.includes(t.project));
  }

  if (assignedTo) {
    tasks = tasks.filter((t) => t.assignedTo === assignedTo);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  const populatedTasks = tasks.map((t) => ({
    ...t,
    assignedToDetails: populateUser(t.assignedTo),
  }));

  res.json(populatedTasks);
});

// GET /api/tasks/:id
router.get("/tasks/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const comments = dbStore.getComments()
    .filter((c) => c.task === task.id)
    .map((c) => ({
      ...c,
      userDetails: populateUser(c.user),
    }));

  res.json({
    ...task,
    assignedToDetails: populateUser(task.assignedTo),
    comments,
  });
});

// POST /api/tasks
router.post("/tasks", authMiddleware, (req: AuthenticatedRequest, res) => {
  const { project: projectId, board: boardId, title, description, assignedTo, priority, dueDate, labels, attachments } = req.body;
  const userId = req.user!.id;

  const project = dbStore.getProjects().find((p) => p.id === projectId);
  if (!project || !isProjectMember(userId, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  if (!title) {
    res.status(400).json({ message: "Task title is required" });
    return;
  }

  const board = dbStore.getBoards().find((b) => b.id === boardId);
  if (!board || board.project !== projectId) {
    res.status(400).json({ message: "Invalid board specified" });
    return;
  }

  const newTask: Task = {
    id: `tsk_${Date.now()}`,
    project: projectId,
    board: boardId,
    title,
    description: description || "",
    assignedTo: assignedTo || null,
    priority: priority || "Medium",
    dueDate: dueDate || new Date().toISOString().split("T")[0],
    labels: Array.isArray(labels) ? labels : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    status: board.title as ("Todo" | "In Progress" | "Review" | "Completed"),
    createdAt: new Date().toISOString(),
  };

  dbStore.addTask(newTask);

  // Send assignment notification
  if (assignedTo && assignedTo !== userId) {
    dbStore.addNotification({
      id: `ntf_${Date.now()}`,
      user: assignedTo,
      message: `${populateUser(userId)?.name} assigned you a task: "${title}" in "${project.title}"`,
      type: "assignment",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json(newTask);
});

// PUT /api/tasks/:id
router.put("/tasks/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const userId = req.user!.id;
  const { title, description, assignedTo, priority, dueDate, labels, attachments } = req.body;

  const prevAssigned = task.assignedTo;

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = dueDate;
  if (Array.isArray(labels)) task.labels = labels;
  if (Array.isArray(attachments)) task.attachments = attachments;

  dbStore.updateTask(task);

  // Notify if assignment changed
  if (assignedTo && assignedTo !== prevAssigned && assignedTo !== userId) {
    dbStore.addNotification({
      id: `ntf_${Date.now()}`,
      user: assignedTo,
      message: `${populateUser(userId)?.name} assigned you the task: "${task.title}"`,
      type: "assignment",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json(task);
});

// DELETE /api/tasks/:id
router.delete("/tasks/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  dbStore.deleteTask(task.id);
  res.json({ message: "Task deleted successfully", id: task.id });
});

// PUT /api/tasks/:id/status
router.put("/tasks/:id/status", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const { boardId } = req.body;
  const board = dbStore.getBoards().find((b) => b.id === boardId);
  if (!board || board.project !== task.project) {
    res.status(400).json({ message: "Invalid board specified" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const prevStatus = task.status;
  task.board = boardId;
  task.status = board.title as ("Todo" | "In Progress" | "Review" | "Completed");

  dbStore.updateTask(task);

  // Send completed notification if moved to Completed board
  if (task.status === "Completed" && prevStatus !== "Completed" && task.assignedTo && task.assignedTo !== req.user!.id) {
    dbStore.addNotification({
      id: `ntf_${Date.now()}`,
      user: task.assignedTo,
      message: `Your task "${task.title}" was marked as Completed by ${populateUser(req.user!.id)?.name}.`,
      type: "status",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Also notify project owner
    if (project.owner !== task.assignedTo && project.owner !== req.user!.id) {
      dbStore.addNotification({
        id: `ntf_${Date.now()}_owner`,
        user: project.owner,
        message: `Task "${task.title}" was marked as Completed by ${populateUser(req.user!.id)?.name}.`,
        type: "status",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json(task);
});

// PUT /api/tasks/:id/assign
router.put("/tasks/:id/assign", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { assignedTo } = req.body;
  if (assignedTo !== undefined) {
    task.assignedTo = assignedTo;
    dbStore.updateTask(task);

    if (assignedTo && assignedTo !== req.user!.id) {
      dbStore.addNotification({
        id: `ntf_${Date.now()}`,
        user: assignedTo,
        message: `${populateUser(req.user!.id)?.name} assigned you the task: "${task.title}"`,
        type: "assignment",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json(task);
});

// --- COMMENTS ---

// GET /api/comments/:taskId
router.get("/comments/:taskId", authMiddleware, (req: AuthenticatedRequest, res) => {
  const task = dbStore.getTasks().find((t) => t.id === req.params.taskId);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(req.user!.id, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const comments = dbStore.getComments()
    .filter((c) => c.task === req.params.taskId)
    .map((c) => ({
      ...c,
      userDetails: populateUser(c.user),
    }));

  res.json(comments);
});

// POST /api/comments/:taskId
router.post("/comments/:taskId", authMiddleware, (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  const userId = req.user!.id;

  if (!message) {
    res.status(400).json({ message: "Comment message is required" });
    return;
  }

  const task = dbStore.getTasks().find((t) => t.id === req.params.taskId);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  const project = dbStore.getProjects().find((p) => p.id === task.project);
  if (!project || !isProjectMember(userId, project)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const newComment: Comment = {
    id: `cmt_${Date.now()}`,
    task: task.id,
    user: userId,
    message,
    createdAt: new Date().toISOString(),
  };

  dbStore.addComment(newComment);

  // Send notification to task assignee if someone else comments
  if (task.assignedTo && task.assignedTo !== userId) {
    dbStore.addNotification({
      id: `ntf_${Date.now()}`,
      user: task.assignedTo,
      message: `${populateUser(userId)?.name} commented on your task "${task.title}": "${message.substring(0, 30)}..."`,
      type: "comment",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({
    ...newComment,
    userDetails: populateUser(userId),
  });
});

// DELETE /api/comments/:id
router.delete("/comments/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
  const comment = dbStore.getComments().find((c) => c.id === req.params.id);
  if (!comment) {
    res.status(404).json({ message: "Comment not found" });
    return;
  }

  const task = dbStore.getTasks().find((t) => t.id === comment.task);
  const project = dbStore.getProjects().find((p) => p.id === task?.project);

  if (!task || !project) {
    res.status(400).json({ message: "Associated task or project not found" });
    return;
  }

  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Comment owner, project owner, or Admin can delete comments
  if (comment.user !== userId && project.owner !== userId && userRole !== "Admin") {
    res.status(403).json({ message: "You are not authorized to delete this comment" });
    return;
  }

  dbStore.deleteComment(comment.id);
  res.json({ message: "Comment deleted successfully", id: comment.id });
});

// --- NOTIFICATIONS ---

// GET /api/notifications
router.get("/notifications", authMiddleware, (req: AuthenticatedRequest, res) => {
  const notifications = dbStore.getNotifications()
    .filter((n) => n.user === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(notifications);
});

// PUT /api/notifications/read
router.put("/notifications/read", authMiddleware, (req: AuthenticatedRequest, res) => {
  dbStore.markNotificationsRead(req.user!.id);
  res.json({ message: "All notifications marked as read" });
});

// --- ADMIN SYSTEM STATISTICS ---
router.get("/admin/statistics", authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== "Admin") {
    res.status(403).json({ message: "Admin access only" });
    return;
  }

  const users = dbStore.getUsers();
  const projects = dbStore.getProjects();
  const tasks = dbStore.getTasks();

  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  const planningProjects = projects.filter((p) => p.status === "Planning").length;

  const lowTasks = tasks.filter((t) => t.priority === "Low").length;
  const medTasks = tasks.filter((t) => t.priority === "Medium").length;
  const highTasks = tasks.filter((t) => t.priority === "High").length;

  const todoTasks = tasks.filter((t) => t.status === "Todo").length;
  const progressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const reviewTasks = tasks.filter((t) => t.status === "Review").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;

  res.json({
    totalUsers: users.length,
    totalProjects: projects.length,
    totalTasks: tasks.length,
    roleCounts: {
      Admin: users.filter((u) => u.role === "Admin").length,
      ProjectManager: users.filter((u) => u.role === "Project Manager").length,
      Member: users.filter((u) => u.role === "Member").length,
    },
    projectStats: {
      active: activeProjects,
      completed: completedProjects,
      planning: planningProjects,
      onHold: projects.filter((p) => p.status === "On Hold").length,
    },
    taskPriorityStats: {
      low: lowTasks,
      medium: medTasks,
      high: highTasks,
    },
    taskStatusStats: {
      todo: todoTasks,
      inProgress: progressTasks,
      review: reviewTasks,
      completed: completedTasks,
    },
  });
});

// GET /api/users - returns list of all users (safe details) for member assignments / dropdowns
router.get("/users", authMiddleware, (req: AuthenticatedRequest, res) => {
  const users = dbStore.getUsers().map((u) => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json(users);
});

export default router;
