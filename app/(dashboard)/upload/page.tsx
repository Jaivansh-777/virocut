"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Play, FileVideo, Trash2, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";
import { formatFileSize } from "@/lib/utils";
import { uploadVideo } from "@/lib/api";

interface UploadedFile {
  file: File;
  progress: number;
  preview: string;
  id: string;
}

export default function UploadPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const videoFiles = Array.from(fileList).filter(
        (f) => f.type.startsWith("video/") || f.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)
      );

      if (videoFiles.length === 0) {
        addToast({ type: "error", message: "Please upload video files only." });
        return;
      }

      const newFiles: UploadedFile[] = videoFiles.map((file) => ({
        file,
        progress: 0,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(2, 9),
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [addToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      addToast({ type: "warning", message: "Please select a video first." });
      return;
    }

    setUploading(true);

    try {
      const uploadedFile = files[0];

      // Upload and get job_id (non-blocking)
      const result = await uploadVideo(uploadedFile.file, (percent) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: percent } : f))
        );
      });

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: 100 } : f))
      );

      addToast({ type: "success", message: "Video queued! Processing started..." });

      // Navigate to processing page with job_id
      router.push(`/processing?job_id=${encodeURIComponent(result.job_id)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      addToast({ type: "error", message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Upload Video</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your video and let AI do the magic.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 sm:p-8 active:bg-slate-800/50 transition-colors">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 touch-manipulation min-h-[200px] sm:min-h-[300px] flex flex-col items-center justify-center ${
              isDragging
                ? "border-indigo-500/50 bg-indigo-500/[0.06]"
                : "border-white/[0.08] hover:border-indigo-400/30 hover:bg-indigo-500/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
              onChange={handleFileInput}
              className="hidden"
              multiple
            />

            <motion.div
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/[0.12] to-purple-500/[0.12] flex items-center justify-center mx-auto mb-5"
            >
              <Upload className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${isDragging ? "text-indigo-400" : "text-slate-500"}`} />
            </motion.div>

            <h3 className="text-base sm:text-lg font-semibold mb-1.5 text-white">
              {isDragging ? "Drop your video here" : "Tap or drag to upload"}
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              or click to browse from your device
            </p>
            <p className="text-xs text-slate-500">
              MP4, MOV, AVI, MKV, WebM (max 500MB)
            </p>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
              <FileVideo className="w-4 h-4" />
              Uploaded Files ({files.length})
            </h2>

            {files.map((file) => (
              <Card key={file.id} className="p-4 active:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative w-16 sm:w-20 h-12 sm:h-14 rounded-xl overflow-hidden bg-white/[0.03] flex-shrink-0">
                    <video src={file.preview} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm text-white">{file.file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatFileSize(file.file.size)}
                      {uploading && file.progress > 0 && file.progress < 100 && (
                        <span className="ml-2 text-indigo-400">Uploading... {file.progress}%</span>
                      )}
                    </p>

                    {uploading || file.progress > 0 ? (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="flex-shrink-0 p-1.5 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-400 transition-colors" />
                  </Button>
                </div>
              </Card>
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={handleUpload} loading={uploading} size="md" className="min-h-[44px] touch-manipulation">
                <Wand2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Generate Content</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
