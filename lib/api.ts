/** Real API client for the FastAPI backend. */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "https://virocut.onrender.com";
console.log("[API] Base URL:", API_BASE);

// Validate API URL
if (!API_BASE || API_BASE === "undefined") {
  console.error("[API] ERROR: NEXT_PUBLIC_BACKEND_URL is not set!");
}

/* ------------------------------------------------------------------ */
/* Upload a video file → returns job_id (non-blocking)                */
/* Accepts an optional onProgress callback for upload progress           */
/* ------------------------------------------------------------------ */
export interface UploadResult {
  job_id: string;
  status: string;
  filename: string;
  size_bytes: number;
}

export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    // 120s timeout for upload connection
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    const xhr = new XMLHttpRequest();
    const uploadUrl = `${API_BASE}/upload/`;
    console.log("[API] Uploading to:", uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      clearTimeout(timeoutId);
      console.log("[API] Upload response status:", xhr.status);

      // Ignore non-final responses
      if (xhr.status === 0) return;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: UploadResult = JSON.parse(xhr.responseText);
          console.log("[API] Upload success, job_id:", data.job_id);
          resolve(data);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          console.error("[API] Upload failed:", body);
          reject(new Error(body.detail ?? `Upload failed (${xhr.status})`));
        } catch {
          console.error("[API] Upload failed with status:", xhr.status);
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      clearTimeout(timeoutId);
      console.error("[API] Network error connecting to:", uploadUrl);
      reject(new Error(`Cannot connect to server at ${API_BASE}. Please check your internet and try again.`));
    };

    xhr.ontimeout = () => {
      console.error("[API] Upload timed out after 120s");
      reject(new Error("Upload timed out. The server may be starting up (free tier) — please try again in a moment."));
    };

    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

/* ------------------------------------------------------------------ */
/* Health check - wake up sleeping backend (Render free tier)       */
/* ------------------------------------------------------------------ */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const healthUrl = `${API_BASE}/health`;
    console.log("[API] Health check:", healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s timeout for health check

    const res = await fetch(healthUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log("[API] Health check status:", res.status);
    return res.ok;
  } catch (err) {
    console.error("[API] Health check failed:", err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Poll job status until completed or failed                        */
/* ------------------------------------------------------------------ */
export interface JobStatus {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  filename: string;
  result?: ProcessResult | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export async function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs = 3000
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/status/${jobId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail ?? `Status check failed (${res.status})`);
        }

        const status: JobStatus = await res.json();
        onUpdate(status);

        if (status.status === "completed") {
          resolve(status);
        } else if (status.status === "failed") {
          reject(new Error(status.error ?? "Processing failed"));
        } else {
          // queued or processing → keep polling
          setTimeout(poll, intervalMs);
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    poll();
  });
}

/* ------------------------------------------------------------------ */
/* (Legacy) Process a previously uploaded video → clips, captions, hooks */
/* ------------------------------------------------------------------ */
export interface ProcessResult {
  transcript: string;
  clips: {
    url: string;
    start: number;
    duration: number;
    title?: string;
    platform?: string;
    transcript?: string;
    titles?: string[];
    hooks?: string[];
    captions?: string[];
    view_url?: string;
    file_id?: string;
  }[];
}

export async function processVideo(filename: string): Promise<ProcessResult> {
  const res = await fetch(`${API_BASE}/process/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });

  if (!res.ok) {
    let message = `Processing failed (${res.status})`;

    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      // ignore invalid JSON
    }

    throw new Error(message);
  }

  return res.json();
}
