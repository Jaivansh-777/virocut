"use client";

import { motion } from "framer-motion";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const floatingOrbs = [
  { color: "bg-primary-500", x: "12%", y: "20%", size: "w-72 h-72", opacity: "opacity-[0.08]", delay: 0 },
  { color: "bg-purple-500", x: "70%", y: "15%", size: "w-96 h-96", opacity: "opacity-[0.07]", delay: 2 },
  { color: "bg-emerald-500", x: "80%", y: "55%", size: "w-64 h-64", opacity: "opacity-[0.06]", delay: 4 },
];

export function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute ${orb.color} ${orb.size} ${orb.opacity} rounded-full blur-[120px]`}
            style={{ left: orb.x, top: orb.y }}
            animate={{ y: [0, -40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          />
        ))}

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 sm:pt-36 sm:pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 mb-6 sm:mb-8 bg-slate-900/50 border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">
              AI-Powered by Groq & Whisper
            </span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6 text-white max-w-4xl mx-auto">
            Turn Long Videos into{" "}
            <span className="gradient-text">Viral Shorts</span>{" "}
            Automatically
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed text-balance">
            Upload once. Get viral clips for Reels, TikTok & YouTube Shorts with AI-generated captions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group bg-indigo-600 hover:bg-indigo-700 min-h-[48px] touch-manipulation">
                <span className="truncate">Start Free</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto group bg-slate-800/50 border-white/10 hover:bg-slate-800 min-h-[48px] touch-manipulation">
              <Play className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="truncate">Watch Demo</span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-12 sm:mt-20"
        >
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/[0.1] via-purple-500/[0.1] to-indigo-500/[0.1] rounded-3xl blur-2xl" />

            <div className="relative glass-card rounded-2xl p-1.5 sm:p-2 bg-slate-900/50 border border-white/10">
              <div className="aspect-video rounded-xl bg-slate-800/50 flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-500/25"
                  >
                    <Play className="w-7 h-7 text-white ml-0.5" />
                  </motion.button>
                  <p className="text-sm text-slate-400 font-medium">
                    See ViroCut in action
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
