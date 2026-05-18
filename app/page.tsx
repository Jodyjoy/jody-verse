"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Shield, Zap, Layers, Users, ChevronRight, Crown, Play } from "lucide-react";
import UserBadge from "../components/UserBadge";
import { motion, AnimatePresence } from "framer-motion"; 

interface ReadingHistory {
  [key: string]: {
    chapter: string;
    page: number; // Captured page index
    timestamp: number;
    title: string;
  };
}

export default function Home() {
  const [history, setHistory] = useState<ReadingHistory | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("user_reading_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const getLatestRead = () => {
    if (!history) return null;
    const items = Object.entries(history).map(([mangaId, data]) => ({ mangaId, ...data }));
    if (items.length === 0) return null;
    return items.sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const latestRead = getLatestRead();

  return (
    <main className="min-h-screen bg-[#06040A] text-white selection:bg-violet-600/40 overflow-hidden font-sans relative">
      
      {/* --- THE SOUL: DEEP VIOLET & BLUE AMBIENCE --- */}
      <div className="absolute top-[-20%] left-[-10%] w-250 h-200 bg-violet-900/20 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-200 h-200 bg-blue-900/15 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay z-0 pointer-events-none"></div>

      {/* --- 1. THE HERO: EDITORIAL LAYOUT --- */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-6 lg:px-12 z-10 max-w-400 mx-auto pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-linear-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-xs font-black text-amber-400 mb-8 tracking-[0.2em] uppercase"
                >
                    <Crown size={14} className="text-amber-400" />
                    Premium Multiverse Access
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-6xl sm:text-8xl lg:text-[9rem] font-black tracking-tighter mb-6 leading-[0.9] text-white"
                >
                    PROJECT <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-blue-500 to-cyan-300 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                        RIFT.
                    </span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-lg md:text-2xl text-violet-100/70 mb-12 max-w-2xl leading-relaxed font-light"
                >
                    The home of Kenya's next-gen graphic storytelling. 
                    Where raw grit meets ancient bloodlines. <br className="hidden md:block"/>
                    <strong className="text-white font-medium">Read. Immerse. Survive.</strong>
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex flex-wrap items-center gap-5"
                >
                    <Link 
                        href="/read" 
                        className="group relative px-8 py-4 bg-white text-black rounded-full font-black text-sm tracking-widest uppercase overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-3"
                    >
                        Enter Library <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link 
                      href="/wiki" 
                      className="px-8 py-4 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 font-bold text-sm tracking-widest uppercase hover:bg-violet-500 hover:text-white transition-all duration-300"
                    >
                      Characters
                    </Link>

                    <div className="ml-2 border-l border-white/10 pl-6 hidden sm:block">
                        <UserBadge />
                    </div>
                </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.4 }}
                    className="relative w-full aspect-square rounded-full border border-white/5 bg-linear-to-tr from-violet-900/20 to-blue-900/20 flex items-center justify-center overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://placehold.co/800x800/050505/FFF?text=Abstract+Ink')] bg-cover bg-center opacity-30 mix-blend-overlay animate-pulse-slow" />
                    <div className="w-[60%] h-[60%] rounded-full border border-violet-500/30 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute w-[40%] h-[40%] rounded-full border border-blue-500/30 animate-[spin_15s_linear_infinite_reverse]" />
                </motion.div>
            </div>
        </div>
      </section>

      {/* --- RESUME MISSION WIDGET (With Precise Frame Coordinates) --- */}
      <AnimatePresence>
        {latestRead && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-400 mx-auto px-6 lg:px-12 mb-12 relative z-20"
          >
            {/* 📢 Deep Link Upgrade: Appends page parameter seamlessly */}
            <Link 
              href={`/read/${latestRead.chapter}?manga=${latestRead.mangaId}&page=${latestRead.page || 0}`}
              className="group block relative rounded-2xl overflow-hidden border border-rift-primary/20 bg-void-surface/40 backdrop-blur-xl p-6 hover:border-rift-primary/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-rift-primary/10 to-transparent blur-xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-rift-deep to-void border border-void-border flex items-center justify-center text-rift-primary group-hover:scale-110 transition-transform duration-300">
                    <Play size={18} fill="currentColor" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500 block mb-0.5">Resume Mission</span>
                    <h4 className="text-lg font-black tracking-tight text-white group-hover:text-rift-glow transition-colors">
                      {latestRead.title} 
                      <span className="text-gray-400 font-normal text-sm ml-2">
                        Chapter {latestRead.chapter} • Panel {Number(latestRead.page || 0) + 1}
                      </span>
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rift-primary group-hover:text-white transition-colors self-end sm:self-center">
                  Jump Back In <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2. BENTO BOX VAULT --- */}
      <section className="py-12 px-6 lg:px-12 max-w-400 mx-auto relative z-10 border-t border-void-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">The Archives</h2>
                <p className="text-violet-300/60 tracking-widest uppercase text-sm font-bold">Manga • Novels • Lore</p>
            </div>
            <Link href="/license" className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest">
                <Shield size={16} /> View License
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[400px] md:auto-rows-[450px]">
            {/* URITHI CARD */}
            <Link href="/read?manga=2" className="md:col-span-8 group relative rounded-[2.5rem] overflow-hidden bg-[#0A0710] border border-white/5 hover:border-violet-500/50 transition-all duration-700">
                <div className="absolute inset-0 bg-[url('/urithi_cover.jpeg')] bg-cover bg-center opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-1000 ease-out" />
                <div className="absolute inset-0 bg-linear-to-t from-[#06040A] via-[#06040A]/50 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-[#06040A]/80 to-transparent" />
                <div className="absolute top-8 left-8">
                     <span className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md">
                        Featured Release
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 p-10 w-full md:w-2/3">
                    <span className="text-violet-400 text-xs font-black uppercase tracking-widest mb-3 block">ID: 02 • Dark Fantasy</span>
                    <h3 className="text-5xl md:text-7xl font-black mb-4 text-white group-hover:text-violet-300 transition-colors tracking-tighter leading-none italic">URITHI</h3>
                    <p className="text-violet-100/70 text-base mb-8 line-clamp-2 font-light">The new legacy begins. Discover ancient bloodlines hidden within the modern world.</p>
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full text-sm font-black uppercase tracking-widest hover:bg-violet-100 transition-colors">
                        Read Now <ArrowRight size={16} />
                    </div>
                </div>
            </Link>

            {/* TALES OF 47 CARD */}
            <Link href="/novel" className="md:col-span-4 group relative rounded-[2.5rem] overflow-hidden bg-[#0A0710] border border-white/5 hover:border-amber-500/50 transition-all duration-700">
                <div className="absolute inset-0 bg-[url('https://placehold.co/600x800/1a1a1a/FFF?text=Tales+of+the+47')] bg-cover bg-center opacity-30 group-hover:scale-105 group-hover:opacity-50 transition-all duration-1000 ease-out" />
                <div className="absolute inset-0 bg-linear-to-t from-[#06040A] to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <BookOpen className="text-amber-400 mb-6" size={32} />
                    <span className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2 block">Novel Series</span>
                    <h3 className="text-3xl font-black mb-3 text-white tracking-tight leading-none uppercase">Tales of <br/> the 47</h3>
                    <div className="flex items-center text-xs font-bold text-white/50 group-hover:text-amber-400 transition-colors uppercase tracking-widest mt-6">
                        Explore Folklore <ChevronRight size={14} className="ml-1" />
                    </div>
                </div>
            </Link>

            {/* SPECTRAL RIFT CARD */}
            <Link href="/read?manga=1" className="md:col-span-5 group relative rounded-[2.5rem] overflow-hidden bg-[#0A0710] border border-white/5 hover:border-blue-500/50 transition-all duration-700">
                <div className="absolute inset-0 bg-[url('/spectral_rift_cover.jpeg')] bg-cover bg-center opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-1000 ease-out" />
                <div className="absolute inset-0 bg-linear-to-t from-[#06040A] to-transparent" />
                <div className="absolute top-8 right-8">
                     <span className="h-3 w-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)] block" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2 block">ID: 01 • Supernatural</span>
                    <h3 className="text-4xl font-black mb-3 text-white tracking-tighter leading-none italic uppercase">Spectral Rift</h3>
                    <p className="text-blue-100/50 text-sm mb-6 line-clamp-2">Shadows leak into Nairobi. Squad 7 is out of time.</p>
                    <div className="flex items-center text-xs font-bold text-white/50 group-hover:text-blue-400 transition-colors uppercase tracking-widest">Read Manga <ChevronRight size={14} className="ml-1" /></div>
                </div>
            </Link>

            {/* INFO BLOCKS */}
            <div className="md:col-span-7 grid grid-cols-2 gap-6">
                <div className="col-span-1 group relative rounded-[2.5rem] overflow-hidden bg-linear-to-br from-[#110B1F] to-[#0A0710] border border-white/5 flex flex-col items-center justify-center text-center p-8 hover:border-violet-500/30 transition-colors">
                    <Users className="text-violet-500/50 mb-4 group-hover:text-violet-400 transition-colors" size={40} />
                    <h4 className="text-xl font-bold text-white mb-1">World Bible</h4>
                    <p className="text-xs text-violet-300/50 uppercase tracking-widest font-black">Coming Soon</p>
                </div>
                <div className="col-span-1 group relative rounded-[2.5rem] overflow-hidden bg-linear-to-br from-[#0B111F] to-[#0A0710] border border-white/5 flex flex-col items-center justify-center text-center p-8 hover:border-blue-500/30 transition-colors">
                    <Zap className="text-blue-500/50 mb-4 group-hover:text-blue-400 transition-colors" size={40} />
                    <h4 className="text-xl font-bold text-white mb-1">One-Shots</h4>
                    <p className="text-xs text-blue-300/50 uppercase tracking-widest font-black">In Production</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 mt-12 py-16 text-center relative z-10 bg-[#06040A]">
        <h2 className="text-3xl font-black tracking-tighter text-white mb-6">JODY-VERSE</h2>
        <div className="flex items-center justify-center gap-6 text-sm font-bold text-violet-300/50 tracking-widest uppercase mb-12">
            <Link href="/manga" className="hover:text-white transition-colors">Manga</Link>
            <Link href="/novel" className="hover:text-white transition-colors">Novels</Link>
            <Link href="/wiki" className="hover:text-white transition-colors">Wiki</Link>
        </div>
        <p className="font-bold tracking-[0.3em] uppercase text-[10px] text-white/30">&copy; 2026 Jody-verse. Crafted in Kenya. 🇰🇪</p>
      </footer>

    </main>
  );
}