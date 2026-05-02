"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProcessingSteps } from "@/components/ui/Loader";
import { useAppStore } from "@/store/appStore";
import { processVideo } from "@/lib/api";

const steps = ["Uploading video...", "Transcribing audio with Whisper...", "Detecting viral moments...", "Generating clips with FFmpeg...", "Creating viral content with Groq...", "Uploading clips to Drive..."];

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useAppStore((s) => s.addToast);

  const filename = searchParams.get("filename");

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processStartedRef = useRef(false); // Guard against duplicate calls

  useEffect(() => {
    if (!filename) {
      router.push("/upload");
      return;
    }

    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    const process = async () => {
      if (processStartedRef.current) {
        console.log("Processing already started, skipping duplicate call");
        return;
      }
      processStartedRef.current = true;

      try {
        // Animate steps while API call runs in background
        const animateSteps = async () => {
          const totalSteps = steps.length;
          const stepDuration = 2000; // 2 seconds per step for better UX

          for (let i = 0; i < totalSteps; i++) {
            if (cancelled) return;

            setCurrentStep(i);
            setProgress(((i + 1) / totalSteps) * 100);

            // Wait for step duration
            await new Promise<void>((resolve) => {
              const t = setTimeout(resolve, stepDuration);
              timeouts.push(t);
            });
          }
        };

        // Run API call and animation in parallel
        const [result] = await Promise.all([
          processVideo(filename),
          animateSteps(),
        ]);

        // Store results in sessionStorage for the results page
        sessionStorage.setItem("processResult", JSON.stringify(result));

        setProgress(100);
        setComplete(true);

        // Wait a moment then redirect to results
        const t = setTimeout(() => {
          if (!cancelled) {
            router.push("/results");
          }
        }, 1500);
        timeouts.push(t);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Processing failed. Please try again.";
          setError(message);
          addToast({ type: "error", message });
        }
      }
    };

    process();

    return () => {
      cancelled = true;
      processStartedRef.current = false; // Reset guard on cleanup
      timeouts.forEach(clearTimeout);
    };
  }, [filename, router, addToast]);

  if (!filename) return null;

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/[0.12] flex items-center justify-center mx-auto mb-6">
                <Video className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold mb-1.5 text-white">Processing Failed</h1>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => router.push("/upload")}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white transition-colors"
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
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Video className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
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
