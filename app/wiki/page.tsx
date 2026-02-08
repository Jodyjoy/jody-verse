"use client";

import Link from "next/link";
import { ArrowLeft, User, Zap, X, Shield, Activity } from "lucide-react"; // Added Icons
import { characters } from "../../lib/wikiData";
import { useState } from "react";

export default function WikiPage() {
  // We store the ENTIRE selected character object here, not just the ID
  const [activeChar, setActiveChar] = useState<typeof characters[0] | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 uppercase tracking-tighter">
                    Rift Archives
                </h1>
                <p className="text-gray-500 mt-2 font-mono">CLASSIFIED CHARACTER DATABASE</p>
            </div>
        </div>
      </div>

      {/* CHARACTER GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {characters.map((char) => (
            <div 
                key={char.id}
                onClick={() => setActiveChar(char)} // <--- CLICK TO OPEN MODAL
                className="group relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 cursor-pointer"
            >
                {/* CARD IMAGE */}
                <div className="h-80 bg-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"/>
                    <img 
                        src={char.image} 
                        alt={char.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                        <h2 className="text-3xl font-black uppercase italic text-white drop-shadow-lg">{char.name}</h2>
                        <p className="text-blue-400 text-xs font-bold tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded w-fit mt-1">{char.role}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* 🌟 THE LIGHTBOX MODAL (Hidden by default) 🌟 */}
      {activeChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setActiveChar(null)}></div>

            <div className="relative bg-gray-900 w-full max-w-5xl rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                
                {/* CLOSE BUTTON */}
                <button 
                    onClick={() => setActiveChar(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-red-600 transition text-white"
                >
                    <X size={24} />
                </button>

                {/* LEFT SIDE: FULL IMAGE */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                    <img 
                        src={activeChar.image} 
                        className="w-full h-full object-cover" 
                        alt={activeChar.fullName} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent md:bg-gradient-to-r md:from-transparent md:to-gray-900" />
                </div>

                {/* RIGHT SIDE: DETAILED STATS */}
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-2">{activeChar.fullName}</h2>
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            {activeChar.role}
                        </span>
                        <span className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            Age: {activeChar.age}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                                <Zap size={16} className="text-yellow-500" /> Ability
                            </h3>
                            <p className="text-xl font-bold text-white">{activeChar.ability}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Biography</h3>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base border-l-2 border-blue-500 pl-4">
                                {activeChar.bio}
                            </p>
                        </div>

                        {/* RADAR STATS */}
                        <div className="bg-black/40 p-6 rounded-xl border border-gray-800">
                             <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                                <Activity size={16} className="text-green-500" /> Combat Data
                            </h3>
                            
                            {/* Strength */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-red-400">STRENGTH</span>
                                    <span className="text-gray-400">{activeChar.stats.strength}/10</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${activeChar.stats.strength * 10}%` }}></div>
                                </div>
                            </div>

                            {/* Intelligence */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-blue-400">INTELLIGENCE</span>
                                    <span className="text-gray-400">{activeChar.stats.intelligence}/10</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${activeChar.stats.intelligence * 10}%` }}></div>
                                </div>
                            </div>

                             {/* Speed */}
                             <div>
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-green-400">SPEED</span>
                                    <span className="text-gray-400">{activeChar.stats.speed}/10</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: `${activeChar.stats.speed * 10}%` }}></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}