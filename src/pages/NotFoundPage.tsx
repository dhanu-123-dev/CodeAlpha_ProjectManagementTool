import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-rose-500 shadow-md">
        <AlertCircle className="w-12 h-12" />
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-6">Page Not Found</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
        The route you are trying to access is missing or has been relocated within the system.
      </p>

      <Link
        to="/dashboard"
        className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
