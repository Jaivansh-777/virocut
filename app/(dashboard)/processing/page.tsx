"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProcessingSteps } from "@/components/ui/Loader";
import { useAppStore } from "@/store/appStore";
import { pollJobStatus } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "https://virocut.onrender.com";

const steps = ["Queued...", "Transcribing audio with Whisper...", "Detecting viral moments...", "Generating clips with FFmpeg...", "Creating viral content with Groq...", "Uploading clips to Drive..."];

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useAppStore((s) => s.addToast);

  const jobId = searchParams.get("job_id");

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      router.push("/upload");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await pollJobStatus(
          jobId,
          (status) => {
            // Update UI based on status
            if (status.progress > progress) {
              setProgress(status.progress);
            }

            // Map status to step
            const stepIndex = Math.min(
              Math.floor(status.progress / (100 / steps.length)),
              steps.length - 1
            );
            setCurrentStep(stepIndex);
          },
          3000
        );

        if (status.status === "completed" && status.result) {
          // Store results in sessionStorage for the results page
          sessionStorage.setItem("processResult", JSON.stringify(status.result));
          setProgress(100);
          setComplete(true);

          // Wait a moment then redirect to results
          setTimeout(() => {
            if (!cancelled) {
              router.push("/results");
            }
          }, 1500);
        } else if (status.status === "failed") {
          throw new Error(status.error ?? "Processing failed");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          let message = "Processing failed. Please try again.";
          
          if (err instanceof Error) {
            message = err.message;
            // Check if it's a fetch error (network issue)
            if (err.message.includes("fetch")) {
              message = `Cannot connect to server at ${API_BASE}. Please check your internet connection.`;
            }
          }
          
          console.error("Processing error:", err);
          setError(message);
          addToast({ type: "error", message });
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [jobId, router, addToast]);

  if (!jobId) return null;

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 sm:p-10 text-center bg-slate-900/50 backdrop-blur-xl border border-white/10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/[0.12] flex items-center justify-center mx-auto mb-6">
                <Video className="w-7 h-7 shrink-0 text-red-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold mb-1.5 text-white">Processing Failed</h1>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => router.push("/upload")}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 min-h-[44px] touch-manipulation"
              >
                Try Again
              </button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-0">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 sm:p-10 text-center bg-slate-900/50 backdrop-blur-xl border border-white/10">
            <motion.div
              animate={complete ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/[0.12] to-purple-500/[0.12] flex items-center justify-center mx-auto mb-6"
            >
              {complete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Sparkles className="w-7 h-7 shrink-0 text-indigo-400" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Video className="w-7 h-7 shrink-0 text-indigo-400" />
                </motion.div>
              )}
            </motion.div>

            <h1 className="text-lg sm:text-xl font-bold mb-1.5 text-white">
              {complete ? "Your ViroCut Clips Are Ready!" : "Processing Your Video"}
            </h1>
            <p className="text-sm text-slate-400 mb-2">
              {complete
                ? "Your viral clips are ready for Reels, Shorts, and TikTok."
                : "ViroCut is finding your best moments..."}
            </p>
            {!complete && (
              <p className="text-xs text-slate-500 mb-8">
                AI is analyzing and creating viral content
              </p>
            )}

            {!complete && (
              <div className="mb-8">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                    style={{ backgroundSize: "200% 100%" }}
                    animate={{
                      width: `${progress}%`,
                      backgroundPosition: ["0% 0%", "200% 0%"],
                    }}
                    transition={{
                      width: { duration: 0.3 },
                      backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            <ProcessingSteps currentStep={complete ? steps.length - 1 : currentStep} steps={steps} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
