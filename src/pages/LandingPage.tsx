import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useNavigate, Navigate } from "react-router-dom";
import {
  FolderDot,
  CheckCircle,
  Users,
  KanbanSquare,
  Lock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Member",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirection if already authenticated
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemoLogin = async (email: string) => {
    setSubmitLoading(true);
    setErrorMsg("");
    try {
      await login(email, "password123");
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in with demo account");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.role);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during submission");
    } finally {
      setSubmitLoading(false);
    }
  };

  const features = [
    {
      title: "Custom Kanban Boards",
      desc: "Drag-and-drop workflow tracking across customized project columns.",
      icon: KanbanSquare,
      color: "text-blue-500 bg-blue-50",
    },
    {
      title: "Granular Team Assignment",
      desc: "Assign members to tasks, set labels, due dates, and priority indicators.",
      icon: Users,
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      title: "Real-time Notifications",
      desc: "Stay notified of critical updates, comment tags, and approaching deadlines.",
      icon: Zap,
      color: "text-amber-500 bg-amber-50",
    },
    {
      title: "Role-Based Permissions",
      desc: "Admin control centers, Project Manager creation powers, and Member scopes.",
      icon: ShieldCheck,
      color: "text-rose-500 bg-rose-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* HEADER BAR */}
      <header className="py-5 px-6 md:px-12 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <FolderDot className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            CodeAlpha <span className="text-blue-600">Core</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Features</a>
          <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-slate-900">About Internship</a>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            {isLogin ? "Sign Up Free" : "Sign In"}
          </button>
        </div>
      </header>

      {/* HERO & PORTAL LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* HERO LEFT BLOCK */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100/60 rounded-full text-blue-700 text-xs font-bold w-fit">
            <Lock className="w-3.5 h-3.5" /> Full-Stack MVC Implementation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
            Collaborative Agile Project Boards for <span className="text-blue-600">Modern Teams</span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl leading-relaxed">
            A complete collaborative board system developed as a showcase project for the
            CodeAlpha Full Stack Internship. Empowering managers to build projects, allocate tasks,
            distribute responsibilities, and analyze metrics instantly.
          </p>

          {/* QUICK DEMO ACCOUNTS DRAWER */}
          <div className="mt-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              🚀 1-Click Interactive Demo Portals:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin("alex.morgan@codealpha.com")}
                className="flex flex-col items-start p-3 rounded-xl border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-left transition-all"
                disabled={submitLoading}
              >
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Admin Scope</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 truncate w-full">Alex Morgan</span>
                <span className="text-[9px] text-slate-400 font-mono">1-click Login</span>
              </button>
              
              <button
                onClick={() => handleDemoLogin("sarah.connor@codealpha.com")}
                className="flex flex-col items-start p-3 rounded-xl border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left transition-all"
                disabled={submitLoading}
              >
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Proj Manager</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 truncate w-full">Sarah Connor</span>
                <span className="text-[9px] text-slate-400 font-mono">1-click Login</span>
              </button>

              <button
                onClick={() => handleDemoLogin("emily.watson@codealpha.com")}
                className="flex flex-col items-start p-3 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all"
                disabled={submitLoading}
              >
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Member Scope</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 truncate w-full">Emily Watson</span>
                <span className="text-[9px] text-slate-400 font-mono">1-click Login</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 text-center">
              All accounts share password: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">password123</code>
            </p>
          </div>
        </div>

        {/* INTERACTIVE FORM PORTAL RIGHT BLOCK */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-xl">
            <div className="flex border-b border-gray-100 pb-4 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg("");
                }}
                className={`flex-1 text-center pb-2 text-sm font-bold transition-all ${
                  isLogin ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg("");
                }}
                className={`flex-1 text-center pb-2 text-sm font-bold transition-all ${
                  !isLogin ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 font-semibold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    User Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Member">Team Member</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Admin">System Admin</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/10 hover:shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5"
              >
                {submitLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  <>Sign In <ChevronRight className="w-4 h-4" /></>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* FEATURES SECTION */}
      <section id="features" className="bg-white border-y border-gray-150 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Enterprise Capabilities</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            Powerful features, clean execution.
          </h2>
          <p className="text-slate-500 text-sm mt-3 max-w-xl mx-auto">
            Everything your team needs to plan, track, and complete software milestones successfully.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="p-6 border border-gray-100 rounded-2xl text-left bg-slate-50/50 hover:bg-white hover:border-blue-150 transition-all">
                  <div className={`p-3 rounded-xl w-fit ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mt-4">{feat.title}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="bg-slate-900 text-slate-300 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-lg font-bold text-white">CodeAlpha Full-Stack Internship Showcase</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              This system is fully deployed with real database simulation, JWT middleware security, role-based controllers, and a polished responsive dashboard. Built by Google AI Studio agent.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed Project Spec v1.0
          </div>
        </div>
      </section>
    </div>
  );
}
