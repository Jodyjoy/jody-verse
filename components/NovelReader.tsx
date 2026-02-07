"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings, Type, Moon, Sun, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation"; // New imports!

export default function NovelReader() {
  const { id } = useParams(); // Grab the ID from the URL (e.g., "2")
  const router = useRouter();
  
  const [textSize, setTextSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [showSettings, setShowSettings] = useState(false);
  
  const [chapterTitle, setChapterTitle] = useState("Loading...");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // FETCH DATA BASED ON URL ID
  useEffect(() => {
    if (!id) return; // Wait until we have the ID

    const fetchChapter = async () => {
      const { data, error } = await supabase
        .from('novel_chapters')
        .select('*')
        .eq('chapter_number', id) // <--- DYNAMIC NOW! (Not hardcoded to 1)
        .single();

      if (error) {
        console.error('Error fetching novel:', error);
        setChapterTitle("Chapter not found");
        setContent("This chapter hasn't been written yet!");
      } else if (data) {
        setChapterTitle(data.title);
        setContent(data.content);
      }
      setLoading(false);
    };

    fetchChapter();
  }, [id]);

  const themes = {
    dark: "bg-[#121212] text-gray-300",
    light: "bg-white text-gray-900",
    sepia: "bg-[#e8dcc5] text-[#433422]",
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading Chapter {id}...</div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themes[theme]}`}>
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full h-16 border-b border-opacity-10 border-gray-500 backdrop-blur-sm z-50 flex items-center justify-between px-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-white/10 transition">
            <ArrowLeft size={24} />
        </button>
        <span className="font-bold tracking-wider opacity-80">CHAPTER {id}</span>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/10 transition"><Settings size={24} /></button>
      </div>

      {/* SETTINGS DRAWER */}
      {showSettings && (
        <div className="fixed top-16 right-4 w-64 bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-800 z-50">
            <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Font Size</p>
                <div className="flex items-center gap-3">
                    <button onClick={() => setTextSize(s => Math.max(14, s - 2))} className="p-2 bg-gray-800 rounded"><Type size={14} /></button>
                    <span className="text-sm font-mono">{textSize}px</span>
                    <button onClick={() => setTextSize(s => Math.min(26, s + 2))} className="p-2 bg-gray-800 rounded"><Type size={20} /></button>
                </div>
            </div>
            <div>
                <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Theme</p>
                <div className="flex gap-2">
                    <button onClick={() => setTheme('dark')} className={`flex-1 p-2 rounded border border-gray-700 ${theme === 'dark' ? 'bg-blue-600' : ''}`}><Moon size={16} className="mx-auto"/></button>
                    <button onClick={() => setTheme('light')} className={`flex-1 p-2 rounded border border-gray-700 ${theme === 'light' ? 'bg-blue-600' : ''}`}><Sun size={16} className="mx-auto"/></button>
                    <button onClick={() => setTheme('sepia')} className={`flex-1 p-2 rounded border border-gray-700 ${theme === 'sepia' ? 'bg-blue-600' : ''}`}><BookOpen size={16} className="mx-auto"/></button>
                </div>
            </div>
        </div>
      )}

      {/* NOVEL CONTENT */}
      <div className="max-w-prose mx-auto pt-28 pb-20 px-6">
        <h1 className="text-4xl font-bold mb-8 leading-tight">{chapterTitle}</h1>
        <article style={{ fontSize: `${textSize}px`, lineHeight: '1.8' }} className="font-serif space-y-6 whitespace-pre-wrap">
            {content}
        </article>
      </div>

    </div>
  );
}