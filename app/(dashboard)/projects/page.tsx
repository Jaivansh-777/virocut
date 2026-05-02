"use client";

import { motion } from "framer-motion";
import { FolderOpen, Clock, Scissors, Captions, Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockProjects } from "@/lib/mockApi";
import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">My Projects</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage all your content repurposing projects.
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <FolderOpen className="w-5 h-5" />
            New Project
          </Button>
        </Link>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {mockProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden group">
              <div className="aspect-video bg-white/[0.02] relative overflow-hidden">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold mb-2 text-white">{project.title}</h3>

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-4 h-4" />
                    {project.clipsCount} clips
                  </span>
                  <span className="flex items-center gap-1">
                    <Captions className="w-4 h-4" />
                    {project.captionsCount} captions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {project.createdAt}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
