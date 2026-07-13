import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { User, Notification } from "../types.js";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, profilePicture: string, password?: string) => Promise<void>;
  apiFetch: <T = any>(path: string, options?: RequestInit) => Promise<T>;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  dismissToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 1. Initial State Loading
  useEffect(() => {
    const savedToken = localStorage.getItem("ca_proj_token");
    const savedUser = localStorage.getItem("ca_proj_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // 2. Fetch notifications periodically or when authenticated
  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s for real-time feel
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [token, user]);

  // 3. Lightweight, High-Fidelity Custom Toast system
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 4. Unified apiFetch Helper
  const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
    const activeToken = token || localStorage.getItem("ca_proj_token");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const res = await fetch(path, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Session expired
      logout();
      showToast("Session expired, please login again.", "error");
      throw new Error("Unauthorized");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data as T;
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("ca_proj_token", data.token);
      localStorage.setItem("ca_proj_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to log in", "error");
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });

      localStorage.setItem("ca_proj_token", data.token);
      localStorage.setItem("ca_proj_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(`Account created! Welcome, ${data.user.name}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to register", "error");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("ca_proj_token");
    localStorage.removeItem("ca_proj_user");
    setToken(null);
    setUser(null);
    setNotifications([]);
    showToast("Logged out successfully.", "info");
  };

  const updateProfile = async (name: string, profilePicture: string, password?: string) => {
    try {
      const updated = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, profilePicture, password }),
      });

      localStorage.setItem("ca_proj_user", JSON.stringify(updated));
      setUser(updated);
      showToast("Profile updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
      throw err;
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<Notification[]>("/api/notifications");
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (notifications.length === 0) return;
    try {
      await apiFetch("/api/notifications/read", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to read notifications", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        apiFetch,
        notifications,
        unreadCount,
        fetchNotifications,
        markAllNotificationsRead,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}

      {/* RENDER TOASTS FLOATING TOP RIGHT */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto flex items-center p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 transform translate-y-0 opacity-100 bg-white ${
              toast.type === "success"
                ? "border-emerald-150 bg-emerald-50 text-emerald-800"
                : toast.type === "error"
                  ? "border-rose-150 bg-rose-50 text-rose-800"
                  : "border-sky-150 bg-sky-50 text-sky-800"
            }`}
          >
            <div className="mr-3 font-semibold">
              {toast.type === "success" && (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === "error" && (
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === "info" && (
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 font-medium">{toast.message}</div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
