import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  ArrowLeft,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit,
  UserPlus,
  Tag,
  AlertCircle,
  X,
  FileText,
  Calendar,
  Layers,
  Send,
  MoreVertical,
} from "lucide-react";
import { Project, Board, Task, User, Comment } from "../types.js";

export default function ProjectDetails() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, apiFetch, showToast } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invitation Panel / Dropdown Toggle
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");

  // Board Modal Form
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardFormTitle, setBoardFormTitle] = useState("");

  // Task Modal Form (Create/Edit)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormEditing, setTaskFormEditing] = useState(false);
  const [taskFormId, setTaskFormId] = useState<string | null>(null);
  const [taskFormBoardId, setTaskFormBoardId] = useState("");
  const [taskFormTitle, setTaskFormTitle] = useState("");
  const [taskFormDesc, setTaskFormDesc] = useState("");
  const [taskFormAssign, setTaskFormAssign] = useState("");
  const [taskFormPriority, setTaskFormPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [taskFormDueDate, setTaskFormDueDate] = useState("");
  const [taskFormLabels, setTaskFormLabels] = useState("");
  const [taskFormAttachmentName, setTaskFormAttachmentName] = useState("");
  const [taskFormAttachmentUrl, setTaskFormAttachmentUrl] = useState("");

  // Task Detail Modal (Active)
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeTaskComments, setActiveTaskComments] = useState<Comment[]>([]);
  const [newCommentMessage, setNewCommentMessage] = useState("");

  useEffect(() => {
    if (projectId) {
      loadProjectWorkspace();
    }
  }, [projectId]);

  async function loadProjectWorkspace() {
    try {
      setLoading(true);
      const projData = await apiFetch<Project>(`/api/projects/${projectId}`);
      const boardsData = await apiFetch<Board[]>(`/api/boards/${projectId}`);
      const tasksData = await apiFetch<Task[]>(`/api/tasks?projectId=${projectId}`);
      const usersData = await apiFetch<User[]>("/api/users");

      setProject(projData);
      setBoards(boardsData);
      setTasks(tasksData);
      setAllUsers(usersData);
    } catch (err: any) {
      showToast(err.message || "Failed to load project details", "error");
    } finally {
      setLoading(false);
    }
  }

  // Reload only tasks
  async function reloadTasks() {
    try {
      const tasksData = await apiFetch<Task[]>(`/api/tasks?projectId=${projectId}`);
      setTasks(tasksData);
      
      // Update active task view if open
      if (activeTask) {
        const updatedActive = tasksData.find((t) => t.id === activeTask.id);
        if (updatedActive) {
          setActiveTask(updatedActive);
        }
      }
    } catch (err) {
      console.error("Failed to reload tasks", err);
    }
  }

  // Invite member
  const handleInviteMember = async () => {
    if (!inviteUserId) {
      showToast("Select a user to invite", "error");
      return;
    }
    if (!project) return;

    if (project.members.includes(inviteUserId)) {
      showToast("This user is already a member of this project", "info");
      return;
    }

    const updatedMembers = [...project.members, inviteUserId];
    try {
      await apiFetch(`/api/projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ members: updatedMembers }),
      });
      showToast("Team member added successfully", "success");
      setShowInvitePanel(false);
      setInviteUserId("");
      loadProjectWorkspace();
    } catch (err: any) {
      showToast(err.message || "Failed to add member", "error");
    }
  };

  // Create board column
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardFormTitle.trim() || !project) return;

    try {
      await apiFetch("/api/boards", {
        method: "POST",
        body: JSON.stringify({
          project: project.id,
          title: boardFormTitle,
        }),
      });
      showToast("New board column added", "success");
      setBoardFormTitle("");
      setShowBoardModal(false);
      loadProjectWorkspace();
    } catch (err: any) {
      showToast(err.message || "Failed to create board column", "error");
    }
  };

  // Delete Board Column
  const handleDeleteBoard = async (boardId: string, title: string) => {
    if (!window.confirm(`Delete board column "${title}"? This will cascadingly delete all tasks under it.`)) return;
    try {
      await apiFetch(`/api/boards/${boardId}`, { method: "DELETE" });
      showToast("Column deleted successfully", "info");
      loadProjectWorkspace();
    } catch (err: any) {
      showToast(err.message || "Failed to delete board column", "error");
    }
  };

  // Open Task Create Modal
  const handleOpenTaskCreate = (boardId: string) => {
    setTaskFormEditing(false);
    setTaskFormId(null);
    setTaskFormBoardId(boardId);
    setTaskFormTitle("");
    setTaskFormDesc("");
    setTaskFormAssign("");
    setTaskFormPriority("Medium");
    setTaskFormDueDate(new Date().toISOString().split("T")[0]);
    setTaskFormLabels("");
    setTaskFormAttachmentName("");
    setTaskFormAttachmentUrl("");
    setShowTaskModal(true);
  };

  // Open Task Edit Modal
  const handleOpenTaskEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskFormEditing(true);
    setTaskFormId(task.id);
    setTaskFormBoardId(task.board);
    setTaskFormTitle(task.title);
    setTaskFormDesc(task.description);
    setTaskFormAssign(task.assignedTo || "");
    setTaskFormPriority(task.priority);
    setTaskFormDueDate(task.dueDate);
    setTaskFormLabels(task.labels.join(", "));
    setTaskFormAttachmentName(task.attachments[0]?.name || "");
    setTaskFormAttachmentUrl(task.attachments[0]?.url || "");
    setShowTaskModal(true);
  };

  // Save Task (Create/Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim() || !project) return;

    const labelsArray = taskFormLabels
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const attachmentsArray = taskFormAttachmentName.trim()
      ? [{ name: taskFormAttachmentName, url: taskFormAttachmentUrl || "#" }]
      : [];

    const payload = {
      project: project.id,
      board: taskFormBoardId,
      title: taskFormTitle,
      description: taskFormDesc,
      assignedTo: taskFormAssign || null,
      priority: taskFormPriority,
      dueDate: taskFormDueDate,
      labels: labelsArray,
      attachments: attachmentsArray,
    };

    try {
      if (taskFormEditing && taskFormId) {
        await apiFetch(`/api/tasks/${taskFormId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Task updated successfully", "success");
      } else {
        await apiFetch("/api/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Task created successfully", "success");
      }
      setShowTaskModal(false);
      reloadTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to save task", "error");
    }
  };

  // Move task left or right between columns
  const handleMoveTask = async (task: Task, direction: "left" | "right") => {
    const currentIdx = boards.findIndex((b) => b.id === task.board);
    if (currentIdx === -1) return;

    let targetIdx = direction === "left" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= boards.length) return;

    const targetBoard = boards[targetIdx];

    try {
      await apiFetch(`/api/tasks/${task.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ boardId: targetBoard.id }),
      });
      reloadTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to shift task board", "error");
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;

    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      showToast("Task deleted successfully", "info");
      setShowTaskModal(false);
      setActiveTask(null);
      reloadTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to delete task", "error");
    }
  };

  // Open Task Details view
  const handleOpenTaskDetails = async (task: Task) => {
    try {
      const details = await apiFetch<Task & { comments: Comment[] }>(`/api/tasks/${task.id}`);
      setActiveTask(details);
      setActiveTaskComments(details.comments || []);
    } catch (err: any) {
      showToast(err.message || "Failed to pull task comments", "error");
    }
  };

  // Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentMessage.trim() || !activeTask) return;

    try {
      const addedComment = await apiFetch<Comment>(`/api/comments/${activeTask.id}`, {
        method: "POST",
        body: JSON.stringify({ message: newCommentMessage }),
      });

      setActiveTaskComments((prev) => [...prev, addedComment]);
      setNewCommentMessage("");
      reloadTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to post comment", "error");
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete your comment?")) return;

    try {
      await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      setActiveTaskComments((prev) => prev.filter((c) => c.id !== commentId));
      reloadTasks();
    } catch (err: any) {
      showToast(err.message || "Failed to delete comment", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-xl w-1/12"></div>
        <div className="h-20 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-800 mt-4">Workspace Not Found</h3>
        <p className="text-gray-400 mt-1 text-sm">This project doesn't exist or you don't have permission to view it.</p>
        <Link to="/projects" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Return to projects
        </Link>
      </div>
    );
  }

  // Calculate progress
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const projectProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const isOwner = project.owner === user?.id || user?.role === "Admin";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* HEADER NAVIGATION */}
      <div className="flex items-center gap-2">
        <Link to="/projects" className="p-2 bg-white hover:bg-slate-50 border border-gray-150 rounded-xl text-gray-500 hover:text-gray-700 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-semibold text-gray-400 font-mono">Workspace Details / Board</span>
      </div>

      {/* PROJECT INFOBAR SUMMARY BANNER */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight">{project.title}</h2>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase border ${
              project.status === "Active"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : project.status === "Completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-slate-50 text-slate-700 border-slate-200"
            }`}>
              {project.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
            {project.description || "No project description declared. Manage board columns and task assignments."}
          </p>
        </div>

        {/* PROGRESS METER */}
        <div className="flex items-center gap-4 border-l border-gray-100 pl-0 md:pl-6">
          <div className="w-32 shrink-0">
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
              <span>Agile Completion</span>
              <span>{projectProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${projectProgress}%` }}
              />
            </div>
          </div>

          {/* MEMBER INVITATION TRIGGER */}
          <div className="relative">
            <button
              onClick={() => setShowInvitePanel(!showInvitePanel)}
              className="px-3.5 py-2 border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Team ({project.memberDetails?.length || 0})
            </button>

            {showInvitePanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowInvitePanel(false)} />
                <div className="absolute right-0 mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl p-4 shadow-xl">
                  <h4 className="text-xs font-bold text-gray-800 mb-2.5">Add Member to Project</h4>
                  <div className="space-y-3">
                    <select
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Select teammate...</option>
                      {allUsers
                        .filter((u) => !project.members.includes(u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => setShowInvitePanel(false)}
                        className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleInviteMember}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QUICK BOARDS HEADER & ADD COLUMN TRIGGER */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
          <Layers className="w-4.5 h-4.5 text-blue-500" />
          <span>Agile Boards</span>
        </div>
        
        {isOwner && (
          <button
            onClick={() => setShowBoardModal(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>
        )}
      </div>

      {/* KANBAN SCROLL CONTAINER */}
      <div className="overflow-x-auto flex gap-6 pb-6 select-none">
        {boards.map((board, idx) => {
          const boardTasks = tasks.filter((t) => t.board === board.id);

          return (
            <div
              key={board.id}
              className="w-72 shrink-0 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col max-h-[600px]"
            >
              {/* BOARD COLUMN HEADER */}
              <div className="p-3.5 border-b border-slate-150 flex items-center justify-between bg-slate-100/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{board.title}</h3>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {boardTasks.length}
                  </span>
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteBoard(board.id, board.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 cursor-pointer"
                    title="Delete Board Column"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* TASKS CONTAINER */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[250px] max-h-[500px]">
                {boardTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTaskDetails(task)}
                    className="p-4 bg-white border border-gray-150 rounded-xl shadow-sm hover:shadow-md hover:border-blue-150 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between text-left"
                  >
                    <div>
                      {/* CARD LABELS & PRIORITY */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-slate-100 text-slate-600 rounded">
                              {label}
                            </span>
                          ))}
                        </div>
                        
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                          task.priority === "High"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : task.priority === "Medium"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* TASK TITLE & DESC */}
                      <h4 className="font-bold text-gray-800 text-xs leading-tight group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                        {task.description || "No description provided"}
                      </p>
                    </div>

                    {/* ACTIONS & INFO BOTTOM */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 mt-3">
                      <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {task.dueDate}
                      </span>

                      {/* ASSIGNEE & METRICS ROW */}
                      <div className="flex items-center gap-2.5">
                        {/* ATTACHMENT/COMMENT BADGES */}
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono">
                          {task.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5" title="Has attachments">
                              <Paperclip className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-0.5" title="Comments count">
                              <MessageSquare className="w-2.5 h-2.5" /> {task.comments.length}
                            </span>
                          )}
                        </div>

                        {task.assignedToDetails ? (
                          <img
                            src={task.assignedToDetails.profilePicture}
                            alt={task.assignedToDetails.name}
                            className="w-5 h-5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                            title={`Assigned to ${task.assignedToDetails.name}`}
                          />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 text-[8px] font-bold text-slate-400 flex items-center justify-center font-mono" title="Unassigned">
                            Ø
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD QUICK COLUMN SHIFTERS */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTask(task, "left");
                        }}
                        disabled={idx === 0}
                        className="p-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-blue-600 rounded text-gray-400 shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Shift Left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleOpenTaskEdit(task, e)}
                          className="p-1 hover:bg-slate-100 text-gray-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                          className="p-1 hover:bg-slate-100 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveTask(task, "right");
                        }}
                        disabled={idx === boards.length - 1}
                        className="p-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-blue-600 rounded text-gray-400 shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Shift Right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ADD TASK BLOCK */}
                <button
                  onClick={() => handleOpenTaskCreate(board.id)}
                  className="w-full py-2.5 border border-dashed border-slate-200 hover:border-blue-300 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task Card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE COLUMN MODAL */}
      {showBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setShowBoardModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-800 mb-4">Establish New Column</h3>
            <form onSubmit={handleCreateBoard} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Column Title *
                </label>
                <input
                  type="text"
                  required
                  value={boardFormTitle}
                  onChange={(e) => setBoardFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. In Review"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBoardModal(false)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Create Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL FORM (CREATE / EDIT) */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setShowTaskModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {taskFormEditing ? "Modify Task Card" : "Initialize Task Card"}
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Code auth router integration"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormDesc}
                  onChange={(e) => setTaskFormDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-20 resize-none"
                  placeholder="Elaborate on core criteria or goals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign Teammate
                  </label>
                  <select
                    value={taskFormAssign}
                    onChange={(e) => setTaskFormAssign(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {project.memberDetails?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Hazard Priority
                  </label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskFormDueDate}
                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Comma-Separated Labels
                  </label>
                  <input
                    type="text"
                    value={taskFormLabels}
                    onChange={(e) => setTaskFormLabels(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Frontend, Bug, Design"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Add Document Attachment (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={taskFormAttachmentName}
                    onChange={(e) => setTaskFormAttachmentName(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2"
                    placeholder="File label (e.g. Spec PDF)"
                  />
                  <input
                    type="text"
                    value={taskFormAttachmentUrl}
                    onChange={(e) => setTaskFormAttachmentUrl(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2"
                    placeholder="URL (e.g. https://spec.doc)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {taskFormEditing ? "Save Changes" : "Create Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS & COMMENTS PORTAL POPUP */}
      {activeTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setActiveTask(null)} />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 animate-in zoom-in-95 duration-150">
            {/* CLOSE ACTION BUTTON */}
            <button
              onClick={() => setActiveTask(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* LEFT BLOCK: TITLE, DESC, COMMENTS (COL-8) */}
            <div className="md:col-span-8 space-y-5 text-left flex flex-col justify-between max-h-[85vh]">
              <div className="overflow-y-auto pr-1 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 font-mono block">
                    Task Details
                  </span>
                  <h3 className="text-lg font-extrabold text-gray-800 tracking-tight leading-tight mt-1">
                    {activeTask.title}
                  </h3>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Description
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {activeTask.description || "No project description declared."}
                  </p>
                </div>

                {/* ATTACHMENT SHOWCASE */}
                {activeTask.attachments.length > 0 && (
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Attachments ({activeTask.attachments.length})
                    </span>
                    <div className="space-y-1.5">
                      {activeTask.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-blue-50/50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-[10px] text-blue-600 font-bold hover:underline shrink-0 font-mono">
                            Open
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMMENTS BLOCK */}
                <div className="border-t border-gray-100 pt-4">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Agile Commentary ({activeTaskComments.length})
                  </span>

                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {activeTaskComments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">No comments posted yet. Start the thread!</p>
                    ) : (
                      activeTaskComments.map((cmt) => {
                        const isOwnComment = cmt.user === user?.id || user?.role === "Admin";
                        return (
                          <div key={cmt.id} className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={cmt.userDetails?.profilePicture}
                                  alt={cmt.userDetails?.name}
                                  className="w-4.5 h-4.5 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="font-bold text-gray-700">{cmt.userDetails?.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono">
                                  {new Date(cmt.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </div>
                              {isOwnComment && (
                                <button
                                  onClick={() => handleDeleteComment(cmt.id)}
                                  className="text-[10px] text-gray-400 hover:text-rose-600 focus:outline-none cursor-pointer"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-600 pl-6 leading-relaxed whitespace-pre-wrap">{cmt.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* POST COMMENT FORM */}
              <form onSubmit={handleSubmitComment} className="flex gap-2 border-t border-gray-100 pt-3 mt-auto shrink-0">
                <input
                  type="text"
                  required
                  value={newCommentMessage}
                  onChange={(e) => setNewCommentMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  placeholder="Ask a question or report progress..."
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* RIGHT BLOCK: METADATA & ASSIGNEE (COL-4) */}
            <div className="md:col-span-4 border-l border-gray-100 pl-0 md:pl-6 space-y-5 text-left text-xs shrink-0 bg-slate-50/20 p-4 md:p-0 rounded-2xl md:rounded-none">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Assigned Team
                </span>
                {activeTask.assignedToDetails ? (
                  <div className="flex items-center gap-2.5 p-2 bg-white border border-gray-100 rounded-xl">
                    <img
                      src={activeTask.assignedToDetails.profilePicture}
                      alt={activeTask.assignedToDetails.name}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-700 truncate leading-none">{activeTask.assignedToDetails.name}</p>
                      <span className="text-[9px] text-gray-400 block font-semibold mt-1 uppercase leading-none">
                        {activeTask.assignedToDetails.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No teammate assigned.</p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Priority</span>
                  <span className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase rounded ${
                    activeTask.priority === "High"
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : activeTask.priority === "Medium"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  }`}>
                    {activeTask.priority}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Due Date</span>
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {activeTask.dueDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Column status</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-semibold text-[10px]">
                    {activeTask.status}
                  </span>
                </div>
              </div>

              {/* TIMELINE SIMULATED METADATA */}
              <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 space-y-1">
                <span className="block font-bold text-gray-500 uppercase tracking-wider mb-2">History</span>
                <p>• Task created: {new Date(activeTask.createdAt).toLocaleDateString()}</p>
                {activeTaskComments.length > 0 && (
                  <p>• Last commented: {new Date(activeTaskComments[activeTaskComments.length - 1].createdAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
