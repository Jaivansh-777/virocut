/** Real API client for the FastAPI backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/* ------------------------------------------------------------------ */
/* Upload a video file → returns the stored filename                  */
/* Accepts an optional onProgress callback for upload progress        */
/* ------------------------------------------------------------------ */
export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      // Only handle final POST response (status 200-299)
      // Ignore preflight OPTIONS responses or intermediate statuses
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: { filename: string } = JSON.parse(xhr.responseText);
          resolve(data.filename);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else if (xhr.status === 0) {
        // Status 0 usually means CORS preflight issue or network error before upload
        // Don't reject here - let onerror handle actual network errors
      } else {
        // Actual error from POST request
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.detail ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.open("POST", `${API_BASE}/upload/`);
    xhr.send(formData);
  });
}

/* ------------------------------------------------------------------ */
/* Process a previously uploaded video → clips, captions, hooks       */
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
