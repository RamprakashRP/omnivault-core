"use client";
import { X, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

export type NotificationType = "moderate" | "important" | "critical";

interface Props {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export default function VaultNotification({ message, type, onClose }: Props) {
  useEffect(() => {
    if (type !== "critical") {
      const timer = setTimeout(onClose, 5000); // Auto-vanish after 5s
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const styles = {
    moderate: "bg-slate-900 border-slate-800 text-slate-300",
    important: "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20",
    critical: "bg-red-900 border-red-600 text-white shadow-lg shadow-red-500/20"
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 p-5 rounded-2xl border-2 animate-in slide-in-from-right-10 duration-300 ${styles[type]}`}>
      <div className="shrink-0">
        {type === "critical" ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
      </div>
      <p className="text-xs font-black uppercase tracking-tight pr-6">{message}</p>
      <button onClick={onClose} className="absolute right-3 p-1 hover:bg-black/20 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}