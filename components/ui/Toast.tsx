"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useAppStore } from "@/store/appStore";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "border-emerald-500/50 bg-emerald-500/[0.08] text-emerald-400",
  error: "border-red-500/50 bg-red-500/[0.08] text-red-400",
  warning: "border-amber-500/50 bg-amber-500/[0.08] text-amber-400",
  info: "border-blue-500/50 bg-blue-500/[0.08] text-blue-400",
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: { id: string; type: string; message: string }; onDismiss: () => void }) {
  const Icon = icons[toast.type as keyof typeof icons] || Info;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={`bg-[#0c0e14]/90 backdrop-blur-xl border-l-4 ${colors[toast.type as keyof typeof colors]} rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px]`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
