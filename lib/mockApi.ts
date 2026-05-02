export interface Clip {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  platform: "reels" | "tiktok" | "shorts" | "twitter";
  timestamp: string;
}

export interface Caption {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
}

export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  clipsCount: number;
  captionsCount: number;
  createdAt: string;
  status: "processing" | "completed" | "failed";
}

export const mockClips: Clip[] = [
  {
    id: "clip-1",
    title: "Key Moment: The Hook",
    duration: 32,
    thumbnail: "https://placehold.co/360x640/1a1a2e/6366f1?text=Clip+1",
    platform: "reels",
    timestamp: "0:45 - 1:17",
  },
  {
    id: "clip-2",
    title: "Product Demo Section",
    duration: 45,
    thumbnail: "https://placehold.co/360x640/1a1a2e/a855f7?text=Clip+2",
    platform: "tiktok",
    timestamp: "2:30 - 3:15",
  },
  {
    id: "clip-3",
    title: "Funny Reaction",
    duration: 18,
    thumbnail: "https://placehold.co/360x640/1a1a2e/10b981?text=Clip+3",
    platform: "shorts",
    timestamp: "5:12 - 5:30",
  },
  {
    id: "clip-4",
    title: "Call to Action",
    duration: 25,
    thumbnail: "https://placehold.co/360x640/1a1a2e/f59e0b?text=Clip+4",
    platform: "reels",
    timestamp: "8:00 - 8:25",
  },
  {
    id: "clip-5",
    title: "Behind the Scenes",
    duration: 52,
    thumbnail: "https://placehold.co/360x640/1a1a2e/ef4444?text=Clip+5",
    platform: "tiktok",
    timestamp: "10:15 - 11:07",
  },
  {
    id: "clip-6",
    title: "Expert Tip",
    duration: 28,
    thumbnail: "https://placehold.co/360x640/1a1a2e/3b82f6?text=Clip+6",
    platform: "shorts",
    timestamp: "12:45 - 13:13",
  },
];

export const mockCaptions: Caption[] = [
  {
    id: "caption-1",
    platform: "Instagram",
    content:
      "This changed everything for us. Watch till the end for the secret tip that 99% of people miss.",
    hashtags: ["#growth", "#tips", "#viral", "#content"],
  },
  {
    id: "caption-2",
    platform: "Twitter/X",
    content:
      "Most creators are leaving money on the table. Here is the framework we used to 10x our reach in 30 days.",
    hashtags: ["#CreatorEconomy", "#ContentStrategy"],
  },
  {
    id: "caption-3",
    platform: "LinkedIn",
    content:
      "The biggest mistake I see professionals make is not repurposing their content. One piece of content can become 10+ assets. Here is how we do it.",
    hashtags: ["#ContentMarketing", "#Productivity", "#Growth"],
  },
];

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    title: "Product Launch Video",
    thumbnail: "https://placehold.co/400x225/1a1a2e/6366f1?text=Project+1",
    clipsCount: 6,
    captionsCount: 3,
    createdAt: "2 hours ago",
    status: "completed",
  },
  {
    id: "proj-2",
    title: "Weekly Vlog #42",
    thumbnail: "https://placehold.co/400x225/1a1a2e/a855f7?text=Project+2",
    clipsCount: 4,
    captionsCount: 2,
    createdAt: "1 day ago",
    status: "completed",
  },
  {
    id: "proj-3",
    title: "Tutorial: Advanced Tips",
    thumbnail: "https://placehold.co/400x225/1a1a2e/10b981?text=Project+3",
    clipsCount: 0,
    captionsCount: 0,
    createdAt: "Just now",
    status: "processing",
  },
];

export function mockUploadVideo(file: File): Promise<{ id: string; progress: number }> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        clearInterval(interval);
        resolve({ id: `upload-${Date.now()}`, progress: 100 });
      }
    }, 300);
  });
}

export function mockProcessVideo(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 6000));
}

export function mockGenerateResults(): Promise<{ clips: Clip[]; captions: Caption[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ clips: mockClips, captions: mockCaptions });
    }, 1500);
  });
}

export function mockAuth(email: string, password: string): Promise<{ name: string; email: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password.length >= 4) {
        resolve({ name: email.split("@")[0], email });
      } else {
        reject(new Error("Invalid credentials"));
      }
    }, 800);
  });
}
