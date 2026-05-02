"use client";

import { motion } from "framer-motion";
import { Scissors, Captions, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Scissors,
    title: "Auto Clips",
    description:
      "AI automatically finds the best moments in your video and creates engaging short clips optimized for each platform.",
    gradient: "from-primary-500 to-blue-600",
  },
  {
    icon: Captions,
    title: "AI Captions",
    description:
      "Generate platform-specific captions with perfect hashtags, optimized for maximum reach and engagement on every network.",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: Share2,
    title: "Multi-Platform Posts",
    description:
      "One upload, content everywhere. Automatically format and schedule posts for Instagram, TikTok, YouTube, Twitter, and LinkedIn.",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export function Features() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-white">
            Everything You Need to{" "}
            <span className="gradient-text">Go Viral</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
            Stop spending hours editing and writing. Let AI repurpose your content in minutes.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full p-6 sm:p-7 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500`} />

                <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-all duration-700 group-hover:-top-20 group-hover:-right-20`} />

                <div className="relative z-10">
                  <div className={`inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center mb-5 shadow-lg shadow-primary-500/10`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>

                  <p className="text-sm sm:text-[0.935rem] text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
