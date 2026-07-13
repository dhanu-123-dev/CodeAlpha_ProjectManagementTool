import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  LayoutDashboard,
  FolderKanban,
  User,
  ShieldAlert,
  LogOut,
  FolderDot,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: FolderKanban },
    { name: "My Profile", path: "/profile", icon: User },
  ];

  // If user is Admin, add Admin page
  if (user?.role === "Admin") {
    menuItems.push({
      name: "Admin Control",
      path: "/admin",
      icon: ShieldAlert,
    });
  }

  return (
    <aside
      id="sidebar_nav"
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col flex-1 py-6 px-4">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <FolderDot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CodeAlpha</h1>
            <p className="text-xs text-slate-400 font-mono">Project Core v1.2</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE INFO SECTION */}
        {user && (
          <div className="mt-auto border-t border-slate-800 pt-6 px-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user.profilePicture}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-slate-700 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            
            {/* ROLE BADGE */}
            <div className="mb-4">
              <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                user.role === "Admin"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : user.role === "Project Manager"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}>
                {user.role}
              </span>
            </div>
            
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
