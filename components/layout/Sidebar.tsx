"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  CreditCard,
  Video,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Upload, label: "Upload", href: "/upload" },
  { icon: FolderOpen, label: "My Projects", href: "/projects" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2.5 rounded-xl shadow-sm hover:scale-105 transition-transform touch-manipulation"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        className={cn(
          "fixed left-0 top-0 lg:relative lg:translate-x-0 z-40 h-screen w-64 flex flex-col transition-transform lg:transition-none",
          "bg-slate-900/95 backdrop-blur-xl border-r border-white/10",
          { "translate-x-0": isOpen }
        )}
      >
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-purple-600 flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">ViroCut</h1>
              <p className="text-[0.7rem] text-slate-400">Turn Long Videos into Viral Shorts</p>
            </div>
          </Link>
        </div>

          <nav className="flex-1 px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px]",
                    {
                      "bg-indigo-500/[0.12] text-indigo-400": isActive,
                      "text-slate-400 hover:bg-white/5 hover:text-white":
                        !isActive,
                    }
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "")} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-indigo-500"
                    />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="p-4">
          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 text-center shadow-sm hover:border-[#6366f1]/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-purple-600/50 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#6366f1]/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold mb-1 text-white">Upgrade to Pro</p>
            <p className="text-xs text-slate-400 mb-4">
              Unlimited clips & priority AI processing
            </p>
            <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-purple-600 text-white text-xs font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all duration-200">
              Upgrade Now
            </button>
          </div>
        </div>
      </motion.aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
