"use client";

import { motion } from "framer-motion";
import { Video, Scissors, Captions, TrendingUp, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { mockProjects } from "@/lib/mockApi";

const stats = [
  { icon: Video, label: "Videos Processed", value: "12", change: "+8%", gradient: "from-indigo-500 to-purple-600" },
  { icon: Scissors, label: "Clips Generated", value: "48", change: "+15%", gradient: "from-purple-500 to-pink-600" },
  { icon: TrendingUp, label: "Viral Score Avg", value: "8.2", change: "+5%", gradient: "from-emerald-500 to-teal-600" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Welcome to ViroCut</h1>
          <p className="text-sm text-slate-400 mt-1">
            Turn your long videos into viral-ready clips
          </p>
        </div>
        <Link href="/upload" className="w-full sm:w-auto">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto touch-manipulation min-h-[44px]">
            <Video className="w-4 h-4" />
            Upload Video
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
              <Card className="p-4 sm:p-5 bg-slate-900/50 backdrop-blur-xl border-white/10 active:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">{stat.value}</p>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-8 sm:p-10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-indigo-500/20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Upload Your First Video</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              Drop a long video and let ViroCut find the viral moments, generate clips, and create captions automatically.
            </p>
            <Link href="/upload">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Video className="w-4 h-4" />
                Start Creating Clips
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Recent Projects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {mockProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
            >
              <Card className="overflow-hidden group bg-slate-900/50 backdrop-blur-xl border-white/10">
                <div className="aspect-video bg-slate-800/50 relative overflow-hidden">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.6875rem] font-medium backdrop-blur-md ${
                        project.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : project.status === "processing"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {project.status === "processing" && <Zap className="w-3 h-3 animate-pulse" />}
                      {project.status === "processing" ? "Processing" : project.status}
                    </span>
                  </div>
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold mb-1.5 truncate text-white">{project.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {project.clipsCount} clips
                    </span>
                    <span className="flex items-center gap-1">
                      <Captions className="w-3 h-3" />
                      {project.captionsCount} captions
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[0.6875rem] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {project.createdAt}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
