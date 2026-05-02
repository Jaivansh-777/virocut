"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { useAppStore } from "@/store/appStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && !pathname.includes("/login") && !pathname.includes("/signup")) {
      router.push("/login");
    }
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar - fixed on desktop, overlay on mobile */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar />
      </div>

      {/* Main content - full width on mobile, ml-64 on desktop */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <TopNavbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
