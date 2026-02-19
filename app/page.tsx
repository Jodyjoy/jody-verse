"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Shield, Zap, Layers, Users } from "lucide-react";
import UserBadge from "../components/UserBadge";
import { motion } from "framer-motion"; 

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        
        {/* Living Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-black animate-pulse-slow z-0" />
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/050505/FFF?text=Spectral+Rift+Art')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto mt-10">
            
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
              className="inline-block"
            >
                <span className="py-1 px-4 rounded-full bg-blue-500/10 text-blue-400 text-xs md:text-sm font-bold tracking-[0.2em] border border-blue-500/20 backdrop-blur-md mb-6 uppercase">
                    Infinite Canvas Platform
                </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl md:text-[10rem] font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 leading-none"
            >
                PROJECT RIFT
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
            >
                The home of Kenya's next-gen stories and Manga,
                <span className="text-purple-500">where the Multiverse meets the Kenyan Pulse.</span>  
                Dive into the <span className="text-violet-500 font-bold">Spectral Rift</span> manga or explore the lore of <span className="text-violet-500 font-bold">Tales of the 47</span>.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-5 justify-center items-center pb-10"
            >
                <Link 
                    href="/read" 
                    className="group relative px-8 py-4 bg-blue-600 rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative flex items-center gap-3">
                       <BookOpen size={20} /> Enter the Library
                    </span>
                </Link>
                
                <Link 
                  href="/wiki" 
                  className="group px-8 py-4 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-bold hover:bg-purple-600 hover:text-white hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 flex items-center gap-2"
                >
                  <Users size={20} className="group-hover:scale-110 transition-transform" />
                  <span>View Characters</span>
                </Link>

                <Link 
                    href="/license" 
                    className="group px-8 py-4 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                    <Shield size={20} className="group-hover:rotate-12 transition-transform" /> 
                    <span>Get License</span>
                </Link>

                <UserBadge />
            </motion.div>
        </div>
      </section>

      {/* 2. MANGA SECTION */}
      <section className="py-12 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-12 border-b border-gray-800 pb-4"
        >
            <Layers className="text-blue-500" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Original Manga</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* CARD 1: SPECTRAL RIFT */}
            {/* 👇 DIRECT LINK TO SPECTRAL RIFT CH 1 */}
            <Link href="/read?manga=1" className="group block relative h-[500px] rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/20 perspective-1000">
                <div className="absolute inset-0 bg-[url('/spectral_rift_cover.jpeg')] bg-cover bg-center opacity-80 group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute top-6 right-6">
                     <span className="inline-block py-1 px-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded shadow-lg animate-pulse">
                        New Chapter
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                        <span className="inline-block py-1 px-3 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3 border border-blue-500/30 rounded-lg">
                            Manga • Supernatural • Action
                        </span>
                        <h3 className="text-4xl font-black mb-3 text-white italic group-hover:text-blue-400 transition-colors uppercase leading-none">
                            SPECTRAL <br/> RIFT
                        </h3>
                        <p className="text-gray-300 text-sm mb-6 line-clamp-2 border-l-2 border-blue-500 pl-3">
                            The barrier is broken. Shadows are leaking into Nairobi. Can Squad 7 close the rift before it's too late?
                        </p>
                        <div className="flex items-center text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                            Read Spectral Rift <ArrowRight size={16} className="ml-2" />
                        </div>
                    </motion.div>
                </div>
            </Link>

            {/* CARD 2: URITHI */}
            {/* 👇 DIRECT LINK TO URITHI CH 1 */}
            <Link href="/read?manga=2" className="group block relative h-[500px] rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/20 perspective-1000">
                {/* ✅ NEW COVER */}
                <div className="absolute inset-0 bg-[url('/urithi_cover.jpeg')] bg-cover bg-center opacity-80 group-hover:scale-110 group-hover:-rotate-1 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute top-6 right-6">
                     <span className="inline-block py-1 px-3 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded shadow-lg animate-pulse">
                        New Release
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                        <span className="inline-block py-1 px-3 bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-3 border border-purple-500/30 rounded-lg">
                            Manga • Fantasy • Heritage
                        </span>
                        <h3 className="text-4xl font-black mb-3 text-white italic group-hover:text-purple-400 transition-colors uppercase leading-none">
                            URITHI
                        </h3>
                        <p className="text-gray-300 text-sm mb-6 line-clamp-2 border-l-2 border-purple-500 pl-3">
                            The new legacy begins. Discover the ancient bloodlines and powers hidden within the modern world.
                        </p>
                        <div className="flex items-center text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                            Read Urithi <ArrowRight size={16} className="ml-2" />
                        </div>
                    </motion.div>
                </div>
            </Link>

             {/* COMING SOON CARD */}
             <div className="group relative h-[500px] rounded-[2rem] overflow-hidden bg-[#0f0f0f] border border-gray-800 border-dashed flex items-center justify-center hover:bg-[#111] transition-colors">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="text-center p-8 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Zap className="mx-auto mb-4 text-gray-600 group-hover:text-blue-500 transition-colors" size={32} />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2 font-mono group-hover:text-white">Coming Soon</h3>
                    <p className="text-gray-600 text-xs uppercase tracking-widest">One-Shot</p>
                </div>
            </div>

        </div>
      </section>

      {/* 3. NOVELS SECTION */}
      <section className="py-12 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-12 border-b border-gray-800 pb-4"
        >
            <Sparkles className="text-yellow-400" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Novels & Folklore</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* CARD 1: TALES OF THE 47 */}
            <Link href="/novel" className="group block relative h-[500px] rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-800 hover:border-yellow-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-900/20">
                <div className="absolute inset-0 bg-[url('https://placehold.co/600x800/1a1a1a/FFF?text=Tales+of+the+47')] bg-cover bg-center opacity-60 group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                        <span className="inline-block py-1 px-3 bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3 border border-yellow-500/30 rounded-lg">
                            Novel • Sci-Fi • Folklore
                        </span>
                        <h3 className="text-4xl font-black mb-3 text-white italic group-hover:text-yellow-400 transition-colors uppercase leading-none">
                            TALES OF <br/> THE 47
                        </h3>
                        <p className="text-gray-300 text-sm mb-6 line-clamp-2 border-l-2 border-yellow-500 pl-3">
                            47 Counties. 47 Legends. One terrifying truth waking up beneath Kenya.
                        </p>
                        <div className="flex items-center text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                            Read Chapter 1 <ArrowRight size={16} className="ml-2" />
                        </div>
                    </motion.div>
                </div>
            </Link>

            {/* COMING SOON */}
            <div className="group relative h-[500px] rounded-[2rem] overflow-hidden bg-[#0f0f0f] border border-gray-800 border-dashed flex items-center justify-center hover:bg-[#111] transition-colors">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="text-center p-8 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Zap className="mx-auto mb-4 text-gray-600 group-hover:text-purple-500 transition-colors" size={32} />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2 font-mono group-hover:text-white">Coming Soon</h3>
                    <p className="text-gray-600 text-xs uppercase tracking-widest">Lore Book</p>
                </div>
            </div>

            <div className="group relative h-[500px] rounded-[2rem] overflow-hidden bg-[#0f0f0f] border border-gray-800 border-dashed flex items-center justify-center hover:bg-[#111] transition-colors">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="text-center p-8 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Zap className="mx-auto mb-4 text-gray-600 group-hover:text-purple-500 transition-colors" size={32} />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2 font-mono group-hover:text-white">Coming Soon</h3>
                    <p className="text-gray-600 text-xs uppercase tracking-widest">Character Stories</p>
                </div>
            </div>

        </div>
      </section>

      <footer className="border-t border-gray-800 py-12 text-center text-gray-600 text-sm relative z-10 bg-[#0a0a0a]">
        <p className="font-mono">&copy; 2026 Jody-verse. Crafted in Kenya. 🇰🇪</p>
      </footer>

    </main>
  );
}