"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, Shield, Zap, BookOpen, Activity, Cpu } from "lucide-react";
import Link from "next/link";
import { getRank, getNextRankXP } from "../../lib/gameLogic"; // Import your game logic

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // SQUAD THEMES (Dynamic Colors)
  const squadColors: Record<string, string> = {
    "Squad 7": "text-blue-500 border-blue-500/50 shadow-blue-900/20",
    "Thunder Lord": "text-yellow-500 border-yellow-500/50 shadow-yellow-900/20",
    "Iron Wall": "text-red-500 border-red-500/50 shadow-red-900/20",
    "Void Walkers": "text-purple-500 border-purple-500/50 shadow-purple-900/20",
  };
  
  const squadBg: Record<string, string> = {
    "Squad 7": "bg-blue-500",
    "Thunder Lord": "bg-yellow-500",
    "Iron Wall": "bg-red-500",
    "Void Walkers": "bg-purple-500",
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 1. Get Profile (XP & Squad)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // 2. Get Bookmarks
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (bookmarkData) setBookmarks(bookmarkData);
      setLoading(false);
    };
    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-mono animate-pulse">INITIALIZING HUD...</div>;

  // CALCULATE STATS
  const currentXP = profile?.xp || 0;
  const currentRank = getRank(currentXP);
  const nextRankGoal = getNextRankXP(currentXP);
  // Calculate percentage for the progress bar (safe math)
  const progressPercent = Math.min(100, (currentXP / nextRankGoal) * 100);
  
  const userSquad = profile?.squad || "Squad 7";
  const themeClass = squadColors[userSquad] || squadColors["Squad 7"];
  const barColor = squadBg[userSquad] || squadBg["Squad 7"];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* BACKGROUND GRID (Tech Vibe) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 relative z-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            <span className="font-mono hidden md:inline">EXIT_TERMINAL</span>
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
            Command Center
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* --- LEFT COLUMN: ID CARD & STATS --- */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* 1. IDENTITY CARD */}
            <div className={`bg-gray-900/80 backdrop-blur-md border border-gray-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden group`}>
                {/* Glowing Squad Border */}
                <div className={`absolute top-0 left-0 w-full h-1 ${barColor} shadow-[0_0_20px_currentColor] opacity-50`}></div>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center text-4xl font-bold mb-4 shadow-lg ${barColor} text-white`}>
                        {user.email[0].toUpperCase()}
                    </div>
                    
                    <h2 className="text-2xl font-black uppercase tracking-wider">{user.email.split('@')[0]}</h2>
                    <p className={`text-xs font-mono uppercase mt-1 px-3 py-1 rounded-full border bg-black/50 ${themeClass}`}>
                        {userSquad} Operative
                    </p>
                </div>

                {/* RANK PROGRESS */}
                <div className="mt-8">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase">
                        <span>Rank: <span className="text-white">{currentRank}</span></span>
                        <span>{currentXP} / {nextRankGoal} XP</span>
                    </div>
                    {/* The Bar */}
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div 
                            className={`h-full ${barColor} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-right">NEXT RANK: {currentRank === 'S-RANK' ? 'MAX' : 'IN PROGRESS...'}</p>
                </div>
            </div>

            {/* 2. MINI STATS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500/50 transition">
                    <BookOpen className="text-blue-500 mb-2" size={20} />
                    <span className="text-2xl font-bold">{bookmarks.length}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Archives</span>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center hover:border-green-500/50 transition">
                    <Activity className="text-green-500 mb-2" size={20} />
                    <span className="text-2xl font-bold">{currentRank === 'F-RANK' ? '1' : 'Active'}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Streak</span>
                </div>
            </div>

            {/* LOGOUT BUTTON */}
            <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-900/10 border border-red-900/30 text-red-500 rounded-xl hover:bg-red-900/30 hover:text-white transition flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider group"
            >
                <LogOut size={16} className="group-hover:-translate-x-1 transition" /> Disconnect System
            </button>
        </div>

        {/* --- RIGHT COLUMN: MISSION DATA (BOOKMARKS) --- */}
        <div className="lg:col-span-2">
            <div className="bg-black/40 border border-gray-800 rounded-3xl p-6 h-full min-h-[400px]">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-300">
                    <Cpu className="text-blue-500" size={18} /> 
                    SAVED ARCHIVES
                </h3>

                {bookmarks.length === 0 ? (
                    <div className="h-64 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <Shield size={48} className="text-gray-600 mb-4" />
                        <p className="text-gray-400 font-bold">Memory Empty</p>
                        <p className="text-sm text-gray-600 mb-4">No mission data recorded.</p>
                        <Link href="/read" className="px-6 py-2 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-500 transition">
                            Start Reading
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookmarks.map((b) => (
                            <div key={b.id} className="group flex items-center justify-between bg-gray-900 border border-gray-800 p-4 rounded-xl hover:border-blue-500/50 hover:bg-gray-800 transition cursor-pointer relative overflow-hidden">
                                {/* Hover Glow */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition"></div>

                                <Link 
                                    href={b.type === 'manga' ? `/read/${b.slug.replace('manga-', '')}` : `/novel/${b.slug.replace('novel-', '')}`}
                                    className="flex items-center gap-4 flex-1 z-10"
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${b.type === 'manga' ? 'bg-purple-900/20 text-purple-400' : 'bg-green-900/20 text-green-400'}`}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition">{b.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono uppercase mt-1">
                                            <span>{b.type} FILE</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                            <span>{new Date(b.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>

                                {/* DELETE BUTTON (Only appears on hover) */}
                                <button 
                                    className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Delete Archive"
                                    onClick={async () => {
                                         // Quick delete logic directly here for simplicity
                                         const { error } = await supabase.from('bookmarks').delete().eq('id', b.id);
                                         if(!error) setBookmarks(bookmarks.filter(i => i.id !== b.id));
                                    }}
                                >
                                    <LogOut size={18} className="rotate-180" /> {/* Using LogOut as a generic 'Eject' icon looks cool here */}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}