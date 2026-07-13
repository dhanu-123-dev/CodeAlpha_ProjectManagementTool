import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  Trash2,
  Edit2,
  Calendar,
  X,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Project, User, Task } from "../types.js";

export default function ProjectsPage() {
  const { user, apiFetch, showToast } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<"Planning" | "Active" | "Completed" | "On Hold">("Planning");
  const [formMembers, setFormMembers] = useState<string[]>([]);

  useEffect(() => {
    loadProjectsAndUsers();
  }, []);

  async function loadProjectsAndUsers() {
    try {
      setLoading(true);
      const projData = await apiFetch<Project[]>("/api/projects");
      const taskData = await apiFetch<Task[]>("/api/tasks");
      const usersData = await apiFetch<User[]>("/api/users");
      setProjects(projData);
      setTasks(taskData);
      setAllUsers(usersData);
    } catch (err) {
      console.error("Failed to fetch page records", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate project progress
  const getProjectProgress = (projectId: string) => {
    const projTasks = tasks.filter((t) => t.project === projectId);
    if (projTasks.length === 0) return 0;
    const completed = projTasks.filter((t) => t.status === "Completed").length;
    return Math.round((completed / projTasks.length) * 100);
  };

  const getProjectTasksCount = (projectId: string) => {
    return tasks.filter((t) => t.project === projectId).length;
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedProjectId(null);
    setFormTitle("");
    setFormDesc("");
    setFormStatus("Planning");
    setFormMembers([user?.id || ""]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setIsEditing(true);
    setSelectedProjectId(proj.id);
    setFormTitle(proj.title);
    setFormDesc(proj.description);
    setFormStatus(proj.status);
    setFormMembers(proj.members);
    setIsModalOpen(true);
  };

  const handleMemberToggle = (userId: string) => {
    setFormMembers((prev) => {
      if (prev.includes(userId)) {
        // Prevent removing owner of project
        if (isEditing) {
          const originalProj = projects.find((p) => p.id === selectedProjectId);
          if (originalProj && originalProj.owner === userId) return prev;
        } else {
          if (userId === user?.id) return prev; // Don't remove self during creation
        }
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Project title is required", "error");
      return;
    }

    try {
      if (isEditing && selectedProjectId) {
        await apiFetch(`/api/projects/${selectedProjectId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            status: formStatus,
            members: formMembers,
          }),
        });
        showToast("Project updated successfully", "success");
      } else {
        await apiFetch("/api/projects", {
          method: "POST",
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            status: formStatus,
            members: formMembers,
          }),
        });
        showToast("Project created successfully!", "success");
      }
      setIsModalOpen(false);
      loadProjectsAndUsers();
    } catch (err: any) {
      showToast(err.message || "Failed to save project", "error");
    }
  };

  const handleDeleteProject = async (projId: string, title: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${title}"? This will cascadingly delete all tasks, boards, and comments.`)) {
      return;
    }

    try {
      await apiFetch(`/api/projects/${projId}`, { method: "DELETE" });
      showToast("Project and all children deleted successfully.", "info");
      loadProjectsAndUsers();
    } catch (err: any) {
      showToast(err.message || "Failed to delete project", "error");
    }
  };

  // Filter projects by search query and status filter
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || proj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Active":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const isAuthorizedToCreate = user?.role === "Admin" || user?.role === "Project Manager";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Project Workspaces</h2>
          <p className="text-xs text-gray-400">Manage collaborative scopes, team directories, and progress metrics.</p>
        </div>
        {isAuthorizedToCreate ? (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4.5 h-4.5" /> Create Project
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Project Managers only
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Search projects..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* PROJECTS LIST GRID */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-2xl py-16 px-6 text-center max-w-lg mx-auto shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-lg mt-4">No Projects Found</h3>
          <p className="text-gray-400 text-sm mt-1">There are no active workspaces matching your criteria.</p>
          {isAuthorizedToCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700"
            >
              Get Started with First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const progress = getProjectProgress(proj.id);
            const totalTasks = getProjectTasksCount(proj.id);
            const isOwner = proj.owner === user?.id || user?.role === "Admin";

            return (
              <div
                key={proj.id}
                className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-150 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* TOP HEADER */}
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase border ${getStatusStyle(proj.status)}`}>
                      {proj.status}
                    </span>
                    
                    {/* ACTIONS */}
                    {isOwner && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(proj)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded-lg cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.title)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div className="mt-4">
                    <Link
                      to={`/projects/${proj.id}`}
                      className="font-extrabold text-gray-800 text-base hover:text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      {proj.title} <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[2rem]">
                      {proj.description || "No project description declared."}
                    </p>
                  </div>
                </div>

                <div>
                  {/* PROGRESS BAR */}
                  <div className="mt-6">
                    <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                      <span>Agile Progress</span>
                      <span>{progress}% ({totalTasks} tasks)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* MEMBERS & DATE */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-5">
                    {/* AVATAR LIST */}
                    <div className="flex -space-x-2 overflow-hidden" title="Workspace Team">
                      {(proj.memberDetails || []).slice(0, 4).map((member) => (
                        <img
                          key={member.id}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                          src={member.profilePicture}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                      {(proj.memberDetails || []).length > 4 && (
                        <div className="inline-flex h-6 w-6 rounded-full bg-gray-100 text-[9px] font-bold text-gray-600 items-center justify-center ring-2 ring-white font-mono">
                          +{(proj.memberDetails || []).length - 4}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "Modify Project Details" : "Establish New Project"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. AWS Cloud Migration"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-20 resize-none"
                  placeholder="Summarize the core target milestones..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Project Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* TEAM MEMBERS MULTI-SELECT CHECKBOXES */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Invite Team Members
                </label>
                <div className="border border-gray-150 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1.5 bg-gray-50/50">
                  {allUsers.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isChecked = formMembers.includes(u.id);

                    return (
                      <label
                        key={u.id}
                        className="flex items-center justify-between p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.profilePicture}
                            alt={u.name}
                            className="w-6 h-6 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <span className="text-xs font-bold text-gray-700 block">
                              {u.name} {isSelf && <span className="text-blue-500 font-medium text-[10px]">(You)</span>}
                            </span>
                            <span className="text-[9px] text-gray-400 block uppercase font-semibold">{u.role}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSelf && !isEditing} // Owner cannot remove self during create
                          onChange={() => handleMemberToggle(u.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {isEditing ? "Apply Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
