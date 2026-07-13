import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Navigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  CheckSquare,
  ShieldAlert,
  BarChart2,
  Calendar,
  Layers,
  ArrowRight,
  Database,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { SystemStats, User } from "../types.js";

export default function AdminPage() {
  const { user, apiFetch, showToast } = useAuth();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard access
  if (user?.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  async function loadAdminMetrics() {
    try {
      setLoading(true);
      const statsData = await apiFetch<SystemStats>("/api/admin/statistics");
      const accountsData = await apiFetch<User[]>("/api/users");
      setStats(statsData);
      setAccounts(accountsData);
    } catch (err: any) {
      showToast(err.message || "Failed to load admin logs", "error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Pie chart roles data
  const roleChartData = [
    { name: "System Admins", value: stats.roleCounts.Admin, color: "#ef4444" },
    { name: "Project Managers", value: stats.roleCounts.ProjectManager, color: "#f59e0b" },
    { name: "Team Members", value: stats.roleCounts.Member, color: "#3b82f6" },
  ];

  // Projects statuses data
  const projectChartData = [
    { name: "Planning", value: stats.projectStats.planning, color: "#94a3b8" },
    { name: "Active", value: stats.projectStats.active, color: "#3b82f6" },
    { name: "Completed", value: stats.projectStats.completed, color: "#10b981" },
    { name: "On Hold", value: stats.projectStats.onHold, color: "#eab308" },
  ];

  // Tasks priority distribution data
  const priorityBarData = [
    { name: "Low", Tasks: stats.taskPriorityStats.low },
    { name: "Medium", Tasks: stats.taskPriorityStats.medium },
    { name: "High", Tasks: stats.taskPriorityStats.high },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* HEADER ROW */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-4">
        <div className="text-left">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" /> Admin Control Terminal
          </h2>
          <p className="text-xs text-gray-400">Review system stats metrics, database registries, and global directories.</p>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-mono text-xs font-bold">
          <Database className="w-4 h-4 text-rose-500 animate-pulse" /> Live DB Sync: Online
        </div>
      </div>

      {/* CORE STATS BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Global Registered Users</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{stats.totalUsers}</span>
            <p className="text-[10px] text-gray-400 mt-1">
              Admins: <strong className="text-rose-500">{stats.roleCounts.Admin}</strong> • Managers: <strong className="text-amber-500">{stats.roleCounts.ProjectManager}</strong>
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Global Projects</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{stats.totalProjects}</span>
            <p className="text-[10px] text-gray-400 mt-1">
              Active scopes: <strong className="text-blue-500">{stats.projectStats.active}</strong> • Done: <strong className="text-emerald-500">{stats.projectStats.completed}</strong>
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Global Active Tasks</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{stats.totalTasks}</span>
            <p className="text-[10px] text-gray-400 mt-1">
              In Progress: <strong className="text-blue-500">{stats.taskStatusStats.inProgress}</strong> • Finished: <strong className="text-emerald-500">{stats.taskStatusStats.completed}</strong>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROLE SPLIT PIE CHART (COL-4) */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div className="text-left">
            <h3 className="font-extrabold text-gray-800 text-sm">Account Roles Split</h3>
            <p className="text-[10px] text-gray-400">Total system users broken down by authority</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-gray-800">{stats.totalUsers}</span>
              <span className="text-[9px] text-gray-400 block font-semibold uppercase">Accounts</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-gray-50 pt-4">
            {roleChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-gray-800">{item.value} users</span>
              </div>
            ))}
          </div>
        </div>

        {/* WORKSPACE STATUSES BAR CHART (COL-8) */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div className="text-left mb-4">
            <h3 className="font-extrabold text-gray-800 text-sm">Project Lifecycle Ratios</h3>
            <p className="text-[10px] text-gray-400">State distribution of collaborative scopes</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-4 border-t border-gray-50">
            {projectChartData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.name}</span>
                <span className="text-sm font-extrabold text-gray-800 mt-0.5">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SYSTEM USERS DIRECTORY TABLE */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="text-left">
            <h3 className="font-extrabold text-gray-800 text-sm">System Registry Accounts</h3>
            <p className="text-[10px] text-gray-400">Complete listing of team identifiers across CodeAlpha</p>
          </div>
          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-500 font-mono">
            {accounts.length} active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="pb-3 pl-2">User Avatar / Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Assigned Role</th>
                <th className="pb-3 pr-2 text-right">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pl-2 flex items-center gap-3">
                    <img
                      src={acc.profilePicture}
                      alt={acc.name}
                      className="w-7 h-7 rounded-full object-cover border"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-gray-700">{acc.name}</span>
                  </td>
                  <td className="py-3.5 text-gray-500 font-mono">{acc.email}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                      acc.role === "Admin"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : acc.role === "Project Manager"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}>
                      {acc.role}
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-right text-gray-400 font-mono">
                    {new Date(acc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
