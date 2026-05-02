import { create } from "zustand";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    avatar?: string;
    plan: "free" | "pro" | "agency";
  } | null;
  toasts: Toast[];
  login: (email: string, name: string) => void;
  logout: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  toasts: [],
  login: (email: string, name: string) =>
    set({
      isAuthenticated: true,
      user: { name, email, plan: "free" },
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
    }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).substring(2, 9) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
