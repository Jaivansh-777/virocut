"use client";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Video } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06070a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-sm shadow-primary-500/20">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold gradient-text">RePurpose</span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
