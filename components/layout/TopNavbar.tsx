"use client";

import { Sun, Moon, Bell, User } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function TopNavbar() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="lg:ml-0 ml-10" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2.5 relative hover:bg-white/5 rounded-xl transition-colors">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-950" />
          </Button>

          <div className="relative group ml-1">
            <button className="flex items-center gap-2.5 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 hover:bg-slate-800 hover:border-indigo-500/30 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium hidden sm:block text-slate-300">{user?.name || "User"}</span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                <div className="px-3 py-2.5 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/billing"
                  className="block px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  Billing
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
