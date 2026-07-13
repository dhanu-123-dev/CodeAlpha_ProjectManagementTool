import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Users,
  Briefcase,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Project, Task } from "../types.js";

export default function Dashboard() {
  const { user, apiFetch } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setStatsLoading(true);
        const projectsData = await apiFetch<Project[]>("/api/projects");
        const tasksData = await apiFetch<Task[]>("/api/tasks");
        setProjects(projectsData);
        setTasks(tasksData);
      } catch (err) {
        console.error("Error loading dashboard metrics", err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // 1. Calculate stats metrics
  const myProjectsCount = projects.length;
  const myAssignedTasks = tasks.filter((t) => t.assignedTo === user?.id);
  const pendingTasksCount = myAssignedTasks.filter((t) => t.status !== "Completed").length;
  const completedTasksCount = myAssignedTasks.filter((t) => t.status === "Completed").length;

  // Overdue tasks
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasksCount = myAssignedTasks.filter(
    (t) => t.status !== "Completed" && t.dueDate < todayStr
  ).length;

  // 2. Charts Data
  // Task Status distribution for chart
  const statusCounts = { Todo: 0, "In Progress": 0, Review: 0, Completed: 0 };
  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });

  const statusChartData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key as keyof typeof statusCounts],
  }));

  const STATUS_COLORS = ["#94a3b8", "#3b82f6", "#eab308", "#10b981"];

  // Priority distribution for chart
  const priorityCounts = { Low: 0, Medium: 0, High: 0 };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });

  const priorityChartData = Object.keys(priorityCounts).map((key) => ({
    name: key,
    value: priorityCounts[key as keyof typeof priorityCounts],
  }));

  const PRIORITY_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  // 3. Upcoming deadlines (non-completed tasks, sorted by nearest due date)
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getDeadlineBadge = (dueDate: string) => {
    if (dueDate < todayStr) {
      return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
    }
    if (dueDate === todayStr) {
      return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">Today</span>;
    }
    const diffTime = Math.abs(new Date(dueDate).getTime() - new Date(todayStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) {
      return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 rounded-full">{diffDays}d left</span>;
    }
    return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">{diffDays}d left</span>;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (statsLoading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-200 rounded-2xl lg:col-span-2"></div>
          <div className="h-80 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* WELCOME BACK HERO BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-100/80">Internship Project Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {getGreeting()}, {user?.name}!
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            You have <strong className="font-semibold text-white">{pendingTasksCount} pending tasks</strong> assigned to you. Let's keep the momentum going!
          </p>
        </div>
        <Link
          to="/projects"
          className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          View Workspaces <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* STATS COUNT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">My Projects</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{myProjectsCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Collaborating</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Assigned Tasks</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{myAssignedTasks.length}</span>
            <span className="text-[10px] text-blue-500 font-semibold mt-1 block">{pendingTasksCount} in progress</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Completed tasks</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{completedTasksCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
              {myAssignedTasks.length > 0 ? Math.round((completedTasksCount / myAssignedTasks.length) * 100) : 0}% success rate
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Overdue Deadlines</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{overdueTasksCount}</span>
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">Requires action</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CHARTS METRICS DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RECHARTS STATUS BLOCK */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Global Team Workloads</h3>
              <p className="text-xs text-gray-400">Total metrics distribution by task column status</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PRIORITY PIE CHART BLOCK */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Priority Breakdown</h3>
            <p className="text-xs text-gray-400">Current allocation of project hazards</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-gray-800">{tasks.length}</span>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Tasks</span>
            </div>
          </div>

          {/* COLOR LEGENDS */}
          <div className="grid grid-cols-3 gap-1 pt-4 border-t border-gray-100 text-center">
            {priorityChartData.map((item, idx) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-semibold">{item.name}</span>
                <span className="text-xs font-bold mt-0.5 flex items-center gap-1.5 text-gray-800">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: PRIORITY_COLORS[idx] }}></span>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MY ASSIGNED TASKS & UPCOMING DEADLINES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSIGNED TASKS */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Assigned Tasks ({pendingTasksCount})</h3>
              <Link to="/projects" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
                Go to Boards <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {myAssignedTasks.filter((t) => t.status !== "Completed").length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-sm font-semibold">All caught up!</p>
                  <p className="text-xs mt-1">No pending tasks are allocated to you right now.</p>
                </div>
              ) : (
                myAssignedTasks
                  .filter((t) => t.status !== "Completed")
                  .map((task) => (
                    <Link
                      key={task.id}
                      to={`/projects/${task.project}`}
                      className="p-3.5 border border-gray-100 rounded-xl hover:border-blue-150 hover:bg-slate-50/50 flex items-center justify-between gap-4 transition-all block group"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1.5 inline-block">
                          {task.status}
                        </span>
                        <h4 className="font-bold text-gray-700 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                          {task.description || "No description provided"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          task.priority === "High"
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : task.priority === "Medium"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </Link>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* UPCOMING DEADLINES */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-800 text-base">Upcoming Deadlines</h3>
            <span className="text-xs text-gray-400 font-mono">Sorted by urgency</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm font-semibold">No deadlines ahead</p>
                <p className="text-xs mt-1">There are no outstanding pending deadlines across your projects.</p>
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.project}`}
                  className="p-3.5 border border-gray-150 rounded-xl hover:border-blue-150 hover:bg-slate-50/50 flex items-center justify-between gap-4 transition-all block"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-700 text-sm truncate">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-semibold font-mono">
                        Due: {task.dueDate}
                      </span>
                      {task.assignedToDetails && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          • Assigned to {task.assignedToDetails.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>{getDeadlineBadge(task.dueDate)}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
