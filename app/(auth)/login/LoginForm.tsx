"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Video, Mail, Lock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";
import { mockAuth } from "@/lib/mockApi";

export default function LoginForm() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const addToast = useAppStore((s) => s.addToast);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await mockAuth(email, password);
      login(user.email, user.name);
      addToast({ type: "success", message: "Welcome back! Logged in successfully." });
      router.push("/dashboard");
    } catch {
      addToast({ type: "error", message: "Invalid credentials. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md p-6 sm:p-8 bg-slate-900/50 backdrop-blur-xl border-white/10">
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1.5 text-white">Welcome to ViroCut</h1>
          <p className="text-sm text-slate-400">Sign in to create viral clips</p>
        </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 touch-manipulation"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 touch-manipulation"
                  placeholder="Enter your password"
                  required
                  minLength={4}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                <input type="checkbox" className="rounded border-slate-600 bg-transparent text-indigo-500 w-4 h-4" />
                <span className="text-slate-400 text-xs">Remember me</span>
              </label>
              <Link href="#" className="text-indigo-400 hover:text-indigo-300 font-medium text-xs">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full text-sm min-h-[44px] touch-manipulation" loading={loading}>
              {!loading && <ArrowRight className="w-4 h-4" />}
              Sign In
            </Button>
          </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Create one
          </Link>
        </div>

        {/* TODO: Add real Google OAuth integration */}
        <div className="mt-5 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-950 px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="w-full text-xs bg-slate-800/50 border-white/10 hover:bg-slate-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>
          <Button variant="secondary" className="w-full text-xs bg-slate-800/50 border-white/10 hover:bg-slate-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.207.958.797-.224 1.678-.345 2.589-.353.91.008 1.794.129 2.59.353 1.61-1.28 3.207-.958 3.207-.958.654 1.652.242 3.872.118 4.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 6.624-5.479 6.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 9.199-6.086 9.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            className="w-full text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 min-h-[44px] touch-manipulation"
            onClick={() => {
              // TODO: Replace with real auth
              login("demo@viroc.io", "Demo User");
              addToast({ type: "success", message: "Welcome to ViroCut!" });
              router.push("/dashboard");
            }}
          >
            Continue as Demo User
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
