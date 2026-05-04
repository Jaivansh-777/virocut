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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";
import type { ProcessResult } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const platformIcons: Record<string, typeof Film> = {
  reels: Film,
  tiktok: Film,
  shorts: Film,
  twitter: Share2,
};

function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

export default function ResultsPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const clips = result.clips || [];
  const transcript = result.transcript || (clips[0] as any)?.transcript || "No transcript generated.";

  const copyText = async (index: number, clip: any) => {
    const lines: string[] = [];
    if (clip.titles?.length) {
      lines.push("Titles:");
      clip.titles.forEach((t: string) => lines.push(`- ${t}`));
    }
    if (clip.hooks?.length) {
      lines.push("Hooks:");
      clip.hooks.forEach((h: string) => lines.push(`- ${h}`));
    }
    if (clip.captions?.length) {
      lines.push("Captions:");
      clip.captions.forEach((c: string) => lines.push(`- ${c}`));
    }
    if (transcript && transcript !== "No transcript generated.") {
      lines.push("Transcript:");
      lines.push(transcript);
    }
    const text = lines.join("\n\n") || "No content to copy.";
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    addToast({ type: "success", message: "Copied to clipboard!" });
    setTimeout(() => setCopiedIndex(null), 2000);
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
          Generated Clips ({clips.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {clips.map((clip, index) => {
            const PlatformIcon = platformIcons[clip.platform ?? "reels"] || Film;
            const videoUrl = resolveUrl(clip.url);
            const downloadUrl = resolveUrl((clip as any).download_url || clip.url);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="overflow-hidden bg-slate-900/50 backdrop-blur-xl border-white/10 active:bg-slate-800/50 transition-colors">
                  <div className="relative aspect-[9/16] bg-slate-800/50">
                    {videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover rounded-t-xl"
                        playsInline
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        <Film className="w-16 h-16 text-slate-600" />
                      </div>
                    )}

                    {clip.platform && (
                      <div className="absolute top-3 left-3">
                        <span className="glass-card px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 text-slate-300 bg-slate-900/80 backdrop-blur-xl">
                          <PlatformIcon className="w-3 h-3" />
                          {clip.platform}
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3">
                      <span className="glass-card px-2 py-1 rounded-lg text-xs font-mono text-slate-300 bg-slate-900/80 backdrop-blur-xl">
                        {clip.duration}s
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm sm:text-base">{clip.title ?? `Clip ${index + 1}`}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mb-3">Start: {clip.start}s · Duration: {clip.duration}s</p>

                    {/* Titles */}
                    {clip.titles && clip.titles.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Suggested Titles:</p>
                        {clip.titles.map((title: string, i: number) => (
                          <p key={i} className="text-sm text-indigo-400 mb-1 break-words">{title}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-slate-600 italic">No titles generated.</p>
                      </div>
                    )}

                    {/* Hooks */}
                    {clip.hooks && clip.hooks.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Hooks:</p>
                        {clip.hooks.map((hook: string, i: number) => (
                          <p key={i} className="text-sm text-emerald-400 mb-1 break-words">{hook}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-slate-600 italic">No hooks generated.</p>
                      </div>
                    )}

                    {/* Captions */}
                    {clip.captions && clip.captions.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Caption:</p>
                        <p className="text-sm text-slate-300 break-words">{clip.captions[0]}</p>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-slate-600 italic">No captions generated.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="w-full"
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]"
                          >
                            <Download className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Download</span>
                          </Button>
                        </a>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-slate-800/50 border-white/10 hover:bg-slate-800 touch-manipulation min-h-[44px]"
                        onClick={() => copyText(index, clip)}
                      >
                        {copiedIndex === index ? <Check className="w-4 h-4 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
                        <span className="truncate">{copiedIndex === index ? "Copied!" : "Copy All Content"}</span>
                      </Button>
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
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Captions className="w-5 h-5 text-blue-400" />
          Transcript
        </h2>

        <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-white/10">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
