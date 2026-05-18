"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Settings, Type, Moon, Sun, BookOpen, Sliders } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import BookmarkButton from "./BookmarkButton";
import { motion, AnimatePresence } from "framer-motion";

export default function NovelReader() {
  const { id } = useParams();
  const router = useRouter();
  
  // --- PARAMS & CONTROL ENGINE ---
  const [textSize, setTextSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  
  const [chapterTitle, setChapterTitle] = useState("Loading...");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const lastScrollY = useRef(0);
  const uniqueSlug = `novel-${id}`;

  // 1. DATA HYDRATION ENGINE
  useEffect(() => {
    if (!id) return;

    const fetchChapter = async () => {
      const { data, error } = await supabase
        .from('novel_chapters')
        .select('*')
        .eq('chapter_number', id)
        .single();

      if (error) {
        console.error('Error fetching novel:', error);
        setChapterTitle("Archive File Disrupted");
        setContent("This dynamic frequency has not been written or broadcast yet!");
      } else if (data) {
        setChapterTitle(data.title);
        setContent(data.content);
        
        // Push to reading history layout map
        const readingHistory = JSON.parse(localStorage.getItem("user_reading_history") || "{}");
        readingHistory["novel"] = {
          chapter: id,
          timestamp: Date.now(),
          title: `Tales of the 47: Ch ${id}`
        };
        localStorage.setItem("user_reading_history", JSON.stringify(readingHistory));
      }
      setLoading(false);
    };

    fetchChapter();
  }, [id]);

  // 2. CONFIG PERSISTENCE HYDRATION
  useEffect(() => {
    const savedTextSize = localStorage.getItem("novel_text_size");
    const savedTheme = localStorage.getItem("novel_theme");
    if (savedTextSize) setTextSize(parseInt(savedTextSize));
    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'sepia') setTheme(savedTheme);
  }, []);

  // 3. MOTION HUD INTERACTIONS (Scroll Mapping)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setShowHeader(false); // Hide HUD on downscroll
      } else {
        setShowHeader(true);  // Show HUD on upscroll
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeSize = (amount: number) => {
    const newSize = Math.max(14, Math.min(26, textSize + amount));
    setTextSize(newSize);
    localStorage.setItem("novel_text_size", String(newSize));
  };

  const changeTheme = (newTheme: 'dark' | 'light' | 'sepia') => {
    setTheme(newTheme);
    localStorage.setItem("novel_theme", newTheme);
  };

  // Modern Book Theme Mapping Matrices
  const themes = {
    dark: "bg-void text-gray-300 border-void-border",
    light: "bg-[#FBF9F4] text-[#1A1A1A] border-[#EADFC9]",
    sepia: "bg-[#EFE6D5] text-[#3E2A14] border-[#D6C5A9]",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center text-heritage-gold font-mono tracking-widest animate-pulse">
        SYNCING CHRONICLES // LOADING CHAPTER {id}...
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-heritage-gold/30 selection:text-white ${themes[theme]}`}>
      
      {/* --- HUD TOP BANNER --- */}
      <motion.div 
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 w-full h-16 border-b backdrop-blur-xl z-50 flex items-center justify-between px-6 ${
          theme === 'dark' ? 'bg-void/80 border-void-border' : theme === 'light' ? 'bg-[#FBF9F4]/80 border-[#EADFC9]' : 'bg-[#EFE6D5]/80 border-[#D6C5A9]'
        }`}
      >
        <button onClick={() => router.push('/novel')} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
          <ArrowLeft size={22} />
        </button>
        
        <span className="font-black text-xs tracking-[0.3em] uppercase opacity-60">
          Chapter {id}
        </span>
        
        <div className="flex items-center gap-3">
          <BookmarkButton slug={uniqueSlug} title={`Tales of the 47: Ch ${id}`} type="novel" />
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <Settings size={22} />
          </button>
        </div>
      </motion.div>

      {/* --- SETTINGS DRAWER OVERLAY --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="fixed top-20 right-6 w-72 bg-void-surface border border-void-border text-white p-5 rounded-2xl shadow-2xl z-50 backdrop-blur-md"
          >
            <div className="mb-5">
              <p className="text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                <Type size={12} /> Dimension Scaling
              </p>
              <div className="flex items-center justify-between bg-void border border-void-border rounded-xl p-2">
                <button onClick={() => changeSize(-2)} className="p-2.5 hover:bg-void-surface text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"><Type size={14} /></button>
                <span className="text-xs font-mono font-bold">{textSize}px</span>
                <button onClick={() => changeSize(2)} className="p-2.5 hover:bg-void-surface text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"><Type size={18} /></button>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders size={12} /> Environment Matrix
              </p>
              <div className="flex gap-2 bg-void border border-void-border p-1.5 rounded-xl">
                <button title="Void Dark" onClick={() => changeTheme('dark')} className={`flex-1 py-2.5 rounded-lg border transition-all cursor-pointer ${theme === 'dark' ? 'bg-rift-primary border-rift-glow text-white' : 'border-transparent text-gray-500 hover:text-white'}`}><Moon size={16} className="mx-auto"/></button>
                <button title="Studio Light" onClick={() => changeTheme('light')} className={`flex-1 py-2.5 rounded-lg border transition-all cursor-pointer ${theme === 'light' ? 'bg-amber-500 border-amber-400 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}><Sun size={16} className="mx-auto"/></button>
                <button title="Ancient Sepia" onClick={() => changeTheme('sepia')} className={`flex-1 py-2.5 rounded-lg border transition-all cursor-pointer ${theme === 'sepia' ? 'bg-heritage-gold border-amber-400 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}><BookOpen size={16} className="mx-auto"/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- EDITORIAL MANUSCRIPT CONTENT --- */}
      <div className="max-w-prose mx-auto pt-32 pb-20 px-6">
        <span className="text-xs font-black tracking-[0.3em] uppercase text-heritage-gold mb-3 block">
          Tales of the 47 // Book I
        </span>
        <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tight leading-tight uppercase">
          {chapterTitle}
        </h1>
        
        <article 
          style={{ fontSize: `${textSize}px`, lineHeight: '1.9' }} 
          className="font-serif space-y-8 whitespace-pre-wrap font-light tracking-wide md:text-justify antialiased selection:bg-amber-500/20"
        >
          {content}
        </article>

        {/* --- SOCIAL CHANNELS & FEEDS --- */}
        <div className="mt-24 border-t border-current border-opacity-10 pt-8">
          <SocialStats slug={uniqueSlug} />
          <CommentSection slug={uniqueSlug} />
        </div>
      </div>

    </div>
  );
}