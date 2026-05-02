"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Download,
  Copy,
  Check,
  Scissors,
  Captions,
  Share2,
  Film,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";
import type { ProcessResult } from "@/lib/api";

const platformIcons: Record<string, typeof Film> = {
  reels: Film,
  tiktok: Film,
  shorts: Film,
  twitter: Share2,
};

export default function ResultsPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("processResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      addToast({ type: "warning", message: "No results found. Please process a video first." });
      router.push("/upload");
    }
  }, [router, addToast]);

  if (!result) return null;

  // Sort clips by viral_score descending (best clip first)
  const sortedClips = [...result.clips].sort((a, b) => (b.viral_score ?? 0) - (a.viral_score ?? 0));
  const bestClipScore = sortedClips[0]?.viral_score ?? 0;

  const copyText = async (index: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCaption(index);
    addToast({ type: "success", message: "Copied to clipboard!" });
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  const downloadClip = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = title || "clip.mp4";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast({ type: "info", message: `Downloading "${title}"...` });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Your ViroCut Clips Are Ready!</h1>
          <p className="text-sm text-slate-400 mt-1">
            Optimized for Reels, Shorts, and TikTok
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" className="bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]">
            <Share2 className="w-4 h-4" />
            Share All
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 touch-manipulation min-h-[44px]">
            <Download className="w-4 h-4" />
            Download All
          </Button>
        </div>
      </motion.div>

      {/* ---------- Clips ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Scissors className="w-5 h-5 text-indigo-400" />
          Generated Clips ({result.clips.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {sortedClips.map((clip, index) => {
            const PlatformIcon = platformIcons[clip.platform ?? "reels"] || Film;
            const isBestClip = clip.viral_score === bestClipScore && index === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border-white/10 active:bg-slate-800/50 transition-colors">
                  <div className="relative aspect-[9/16] bg-slate-800/50">
                    <video
                      src={clip.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
                      >
                        <Play className="w-7 h-7 text-indigo-500 ml-1" />
                      </motion.div>
                    </div>

                    {clip.platform && (
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="glass-card px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 text-slate-300 bg-slate-900/80 backdrop-blur-xl">
                          <PlatformIcon className="w-3 h-3" />
                          {clip.platform}
                        </span>
                        {isBestClip && (
                          <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg">
                            🏆 Best Clip
                          </span>
                        )}
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3">
                        <span className="glass-card px-2 py-1 rounded-lg text-xs font-mono text-slate-300 bg-slate-900/80 backdrop-blur-xl">
                          {clip.duration}s
                        </span>
                      </div>

                      {clip.viral_score !== undefined && (
                        <div className="absolute top-3 right-3">
                          <span className="glass-card px-2 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 bg-slate-900/80 backdrop-blur-xl">
                            Score: {clip.viral_score}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm sm:text-base">{clip.title ?? `Clip ${index + 1}`}</h3>
                      {isBestClip && (
                        <span className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-2 py-0.5 rounded-md">
                          #1 VIRAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mb-1">Start: {clip.start}s · Duration: {clip.duration}s</p>
                    {clip.reason && (
                      <p className="text-xs text-indigo-400 mb-3">🎯 {clip.reason}</p>
                    )}

                    {/* Clip-specific titles */}
                    {clip.titles && clip.titles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Suggested Titles:</p>
                        {clip.titles.map((title: string, i: number) => (
                          <p key={i} className="text-sm text-indigo-400 mb-1 break-words">{title}</p>
                        ))}
                      </div>
                    )}

                    {/* Clip-specific hooks */}
                    {clip.hooks && clip.hooks.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Hooks:</p>
                        {clip.hooks.map((hook: string, i: number) => (
                          <p key={i} className="text-sm text-emerald-400 mb-1 break-words">{hook}</p>
                        ))}
                      </div>
                    )}

                    {/* Clip-specific caption */}
                    {clip.captions && clip.captions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Caption:</p>
                        <p className="text-sm text-slate-300 break-words">{clip.captions[0]}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]"
                        onClick={() => downloadClip(clip.url, clip.title ?? `clip-${index + 1}`)}
                      >
                        <Download className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Download</span>
                      </Button>

                      {clip.view_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]"
                          onClick={() => window.open(clip.view_url, '_blank')}
                        >
                          <Share2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Open in Drive</span>
                        </Button>
                      )}

                      {(clip.titles?.[0] || clip.hooks?.[0] || clip.captions?.[0]) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]"
                          onClick={() => {
                            const text = [clip.titles?.[0], clip.hooks?.[0], clip.captions?.[0]].filter(Boolean).join('\n\n');
                            copyText(index, text);
                          }}
                        >
                          {copiedCaption === index ? <Check className="w-4 h-4 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{copiedCaption === index ? "Copied!" : "Copy Content"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ---------- Transcript ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Captions className="w-5 h-5 text-blue-400" />
          Transcript
        </h2>

        <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-white/10">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {result.transcript || "No transcript available."}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
