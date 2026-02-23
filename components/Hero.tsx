"use client";

import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none delay-700" />

      <div className={cn("relative z-10 flex flex-col items-center gap-6 max-w-3xl")}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Gemini Wrapper Service</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          Intelligence, <span className="text-blue-400">Simplified.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          Unlock the full potential of Gemini&apos;s advanced AI with our minimal wrapper.
          Fast, secure, and built for your productivity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <Link href="/login" className="h-12 px-8 rounded-full bg-white text-black font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            *Get Started ** <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="h-12 px-8 rounded-full border border-white/10 hover:bg-white/5 font-medium transition-colors text-white">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};
