import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { Task } from "../types.js";

export default function ProfilePage() {
  const { user, updateProfile, apiFetch, showToast } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [profilePic, setProfilePic] = useState(user?.profilePicture || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    async function loadUserTasks() {
      try {
        setLoading(true);
        if (user) {
          const tasksData = await apiFetch<Task[]>(`/api/tasks?assignedTo=${user.id}`);
          setMyTasks(tasksData);
        }
      } catch (err) {
        console.error("Failed to load user tasks", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserTasks();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    if (password) {
      if (password.length < 6) {
        showToast("Password must be at least 6 characters long", "error");
        return;
      }
      if (password !== confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }
    }

    try {
      setSubmitLoading(true);
      await updateProfile(name, profilePic, password || undefined);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      // already caught by context
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Project Manager":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const pendingCount = myTasks.filter((t) => t.status !== "Completed").length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT FORM BOX: UPDATE INFO (COL-7) */}
      <div className="lg:col-span-7 bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Account Profile Settings</h2>
          <p className="text-xs text-gray-400">Update your identification assets, passwords, and security options.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Primary Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Email Address (Immutable)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-300" />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 select-none focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Profile Avatar URL
            </label>
            <input
              type="url"
              value={profilePic}
              onChange={(e) => setProfilePic(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="https://images.unsplash.com..."
            />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              🔒 Reset Account Password
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {submitLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Apply Profile Updates"
            )}
          </button>
        </form>
      </div>

      {/* RIGHT PREVIEW BOX: TEAM STATS & SCOPE (COL-5) */}
      <div className="lg:col-span-5 space-y-6 text-left">
        {/* AVATAR BIG PROFILE CARD */}
        {user && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md border ${getRoleStyle(user.role)}`}>
                {user.role}
              </span>
            </div>

            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-slate-100 shadow-md"
              referrerPolicy="no-referrer"
            />
            <h3 className="text-base font-extrabold text-gray-800 mt-4">{user.name}</h3>
            <p className="text-xs text-gray-400 font-mono">{user.email}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-150 pt-5 mt-5 text-center">
              <div>
                <span className="text-2xl font-extrabold text-gray-800 block">{myTasks.length}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Total tasks</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-blue-600 block">{pendingCount}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">In progress</span>
              </div>
            </div>
          </div>
        )}

        {/* LIST OF ASSIGNED TASKS */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
          <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2.5 mb-3">
            Tasks Assigned to Me ({pendingCount})
          </h4>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-400">Loading your backlog...</p>
            ) : myTasks.filter((t) => t.status !== "Completed").length === 0 ? (
              <p className="text-xs text-gray-400 italic">No pending tasks found. All caught up!</p>
            ) : (
              myTasks
                .filter((t) => t.status !== "Completed")
                .map((task) => (
                  <Link
                    key={task.id}
                    to={`/projects/${task.project}`}
                    className="p-3 border border-gray-100 hover:border-blue-150 rounded-xl hover:bg-slate-50/50 flex items-center justify-between gap-4 transition-all block"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-blue-600 font-mono block">
                        {task.status}
                      </span>
                      <h5 className="font-bold text-gray-700 text-xs truncate mt-0.5">{task.title}</h5>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded shrink-0 uppercase ${
                      task.priority === "High"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {task.priority}
                    </span>
                  </Link>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
