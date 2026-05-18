"use client";

import Link from "next/link";
import { ArrowLeft, Zap, X, Shield, Activity, Target, Cpu, ChevronRight } from "lucide-react"; 
import { characters } from "../../lib/wikiData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WikiPage() {
  const [activeChar, setActiveChar] = useState<typeof characters[0] | null>(null);

  return (
    <div className="min-h-screen bg-void text-white p-6 md:p-12 font-sans relative">
      
      {/* --- BACKGROUND ATMOSPHERE GRID --- */}
      <div className="absolute top-[-10%] left-[-10%] w-250 h-200 bg-linear-to-br from-rift-primary/10 to-transparent blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-200 h-200 bg-linear-to-tl from-tech-cyan/5 to-transparent blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,24,45,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(30,24,45,0.15)_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 pointer-events-none z-0"></div>

      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto mb-16 flex items-center gap-6 relative z-10">
        <Link href="/" className="p-3.5 bg-void-surface border border-void-border rounded-full hover:border-rift-primary/50 text-gray-400 hover:text-white transition-all duration-300 shadow-xl cursor-pointer group">
          <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-[0.25em] text-rift-primary uppercase mb-1">
            <Cpu size={12} /> Sector 4 Mainframe
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
            Rift Archives
          </h1>
        </div>
      </div>

      {/* --- CHARACTER ASYMMETRICAL PORTFOLIO GRID --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {characters.map((char) => (
          <motion.div 
            key={char.id}
            onClick={() => setActiveChar(char)}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="group relative bg-void-surface border border-void-border rounded-2xl overflow-hidden hover:border-rift-primary/40 shadow-2xl transition-all duration-500 cursor-pointer h-96"
          >
            {/* Subtle Gradient Backlight on Hover */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-void/40 to-void z-10" />
            <div className="absolute inset-0 bg-linear-to-t from-void via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500 z-10" />

            {/* CHARACTER IMAGE ART */}
            <img 
              src={char.image} 
              alt={char.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />

            {/* TEXT DETAILS */}
            <div className="absolute bottom-0 left-0 p-6 w-full z-20">
              <span className="text-[10px] font-black tracking-widest text-tech-cyan bg-tech-cyan/10 border border-tech-cyan/20 px-2.5 py-1 rounded-md uppercase mb-3 inline-block backdrop-blur-md">
                {char.role.split('/')[0].trim()}
              </span>
              <h2 className="text-3xl font-black uppercase text-white tracking-tight leading-none drop-shadow-md">
                {char.name}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Open Tactical Dossier <ChevronRight size={14} className="text-rift-primary" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- 🎯 THE TACTICAL LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {activeChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/95 backdrop-blur-xl">
            
            {/* Click outside backdrop to close */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setActiveChar(null)}></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-void-surface w-full max-w-5xl rounded-3xl overflow-hidden border border-void-border shadow-2xl flex flex-col md:flex-row max-h-[90vh] z-10"
            >
                {/* CLOSE BUTTON */}
                <button 
                  onClick={() => setActiveChar(null)}
                  className="absolute top-5 right-5 z-50 p-2.5 bg-void/60 border border-void-border rounded-full hover:bg-red-600 hover:text-white transition-all text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>

                {/* LEFT SIDE: DOSSIER IMAGE ART */}
                <div className="w-full md:w-1/2 h-72 md:h-auto relative bg-void">
                  <img src={activeChar.image} className="w-full h-full object-cover" alt={activeChar.fullName} />
                  <div className="absolute inset-0 bg-linear-to-t from-void-surface via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:to-void-surface" />
                </div>

                {/* RIGHT SIDE: PROFILE CRITERIA DATA */}
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-rift-primary uppercase mb-2">
                    <Shield size={14} /> Encrypted Operator File
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 text-white leading-none">
                    {activeChar.fullName}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    <span className="px-3 py-1 bg-rift-primary/10 border border-rift-primary/20 text-rift-primary rounded-full text-xs font-bold uppercase tracking-wider">
                      {activeChar.role}
                    </span>
                    <span className="px-3 py-1 bg-void border border-void-border text-gray-400 rounded-full text-xs font-bold uppercase tracking-wider">
                      Age Parameter: {activeChar.age}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* Unique Ability */}
                    <div className="border border-void-border bg-void/30 p-4 rounded-xl">
                      <h3 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                        <Zap size={14} className="text-heritage-gold" /> Core Trait // Ability
                      </h3>
                      <p className="text-lg font-black text-white tracking-tight">{activeChar.ability}</p>
                    </div>

                    {/* Biography Description */}
                    <div>
                      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Biography Data</h3>
                      <p className="text-gray-300 leading-relaxed text-sm md:text-base border-l-2 border-rift-primary pl-4 font-light">
                        {activeChar.bio}
                      </p>
                    </div>

                    {/* Combat Capability Metrics */}
                    <div className="bg-void/50 p-6 rounded-xl border border-void-border">
                      <h3 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5">
                        <Activity size={14} className="text-tech-cyan" /> Combat Efficiency Analytics
                      </h3>
                      
                      {/* Strength */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5 font-bold tracking-wide">
                          <span className="text-red-400 flex items-center gap-1"><Target size={12} /> STRENGTH</span>
                          <span className="text-gray-400 font-mono">{activeChar.stats.strength} / 10</span>
                        </div>
                        <div className="h-1.5 bg-void rounded-full overflow-hidden border border-void-border">
                          <div className="h-full bg-linear-to-r from-red-600 to-red-400" style={{ width: `${activeChar.stats.strength * 10}%` }}></div>
                        </div>
                      </div>

                      {/* Intelligence */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5 font-bold tracking-wide">
                          <span className="text-tech-cyan flex items-center gap-1"><Target size={12} /> INTELLIGENCE</span>
                          <span className="text-gray-400 font-mono">{activeChar.stats.intelligence} / 10</span>
                        </div>
                        <div className="h-1.5 bg-void rounded-full overflow-hidden border border-void-border">
                          <div className="h-full bg-linear-to-r from-tech-cyan to-cyan-400" style={{ width: `${activeChar.stats.intelligence * 10}%` }}></div>
                        </div>
                      </div>

                      {/* Speed */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-bold tracking-wide">
                          <span className="text-rift-primary flex items-center gap-1"><Target size={12} /> SPEED / AGILITY</span>
                          <span className="text-gray-400 font-mono">{activeChar.stats.speed} / 10</span>
                        </div>
                        <div className="h-1.5 bg-void rounded-full overflow-hidden border border-void-border">
                          <div className="h-full bg-linear-to-r from-rift-primary to-purple-400" style={{ width: `${activeChar.stats.speed * 10}%` }}></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}