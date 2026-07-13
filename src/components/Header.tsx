import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Bell, Menu, X, CheckSquare, Calendar, UserPlus, Info } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function Header({ onMenuToggle, title }: HeaderProps) {
  const { notifications, unreadCount, markAllNotificationsRead, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case "deadline":
        return <Calendar className="w-4 h-4 text-rose-500" />;
      case "system":
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  return (
    <header
      id="header_top"
      className="sticky top-0 z-30 h-16 bg-white border-b border-gray-150 px-4 md:px-8 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger toggle button */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        {title && <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* BELL NOTIFICATIONS TOGGLER */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
        >
          <Bell className="w-5.5 h-5.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* NOTIFICATIONS DROPDOWN BAR */}
        {showNotifications && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            
            <div className="absolute right-0 top-12 z-50 w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <span className="font-bold text-gray-800 text-sm">Notifications ({unreadCount} new)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      markAllNotificationsRead();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm font-medium">Inbox is empty</p>
                    <p className="text-xs mt-1">You will receive logs when tasks get updated or assigned.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors ${
                        !n.isRead ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm self-start">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-gray-700 leading-relaxed ${!n.isRead ? "font-medium" : ""}`}>
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-gray-100 text-center bg-gray-50/30">
                <span className="text-[10px] text-gray-400 font-medium">Auto-refreshing every 10 seconds</span>
              </div>
            </div>
          </>
        )}

        {/* LOGGED-IN AVATAR CLIPPED PREVIEW */}
        {user && (
          <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-gray-150">
            <img
              src={user.profilePicture}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            />
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">{user.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-wider uppercase leading-none">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
