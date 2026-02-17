"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react"; // Added Trash icon
import { supabase } from "../../lib/supabaseClient";
import DownloadButton from "../../components/DownloadButton"; 

export default function MangaIndex() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- THE NUCLEAR OPTION: CLEAR ALL OFFLINE DATA ---
  const clearAllOffline = async () => {
    if (!confirm("This will delete ALL downloaded chapters from your device. Proceed?")) return;

    // 1. Clear LocalStorage metadata
    localStorage.removeItem('offline_library');

    // 2. Clear Browser Cache Storage for all manga chapters
    const cacheNames = await window.caches.keys();
    for (const name of cacheNames) {
        if (name.startsWith('manga-chapter-')) {
            await window.caches.delete(name);
        }
    }

    // 3. Refresh the page to reset all button states
    window.location.reload();
  };

  useEffect(() => {
    const fetchChapters = async () => {
      console.log("🚀 STARTING FETCH...");

      const { data, error } = await supabase
        .from('manga_chapters')
        .select('*')
        .order('chapter_number', { ascending: true });

      if (error) {
        console.error("❌ SUPABASE ERROR:", error.message);
      } else {
        console.log("✅ SUPABASE DATA:", data);
      }

      if (!error && data && data.length > 0) {
        setChapters(data); 
      } else {
        console.log("⚠️ Online data empty or failed. Checking offline backup...");
        const offlineData = localStorage.getItem('offline_library');
        
        if (offlineData) {
            console.log("📦 Found offline data:", offlineData);
            const parsedData = JSON.parse(offlineData);
            parsedData.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
            setChapters(parsedData);
        } else {
            console.log("💀 No offline data found either.");
        }
      }
      
      setLoading(false);
    };

    fetchChapters();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                    SPECTRAL RIFT
                </h1>
                <p className="text-gray-400 mt-2">Manga Index</p>
            </div>
        </div>

        {/* --- CLEAR ALL BUTTON --- */}
        <button 
            onClick={clearAllOffline}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded-lg transition-all bg-gray-900/30"
        >
            <Trash2 size={14} />
            Clear Library
        </button>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {loading ? (
             <div className="text-gray-500 animate-pulse">Loading library...</div>
        ) : chapters.map((chapter) => (
            <div 
                key={chapter.id || chapter.chapter_number} 
                className="group flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300"
            >
                <Link 
                    href={`/read/${chapter.chapter_number}`}
                    className="flex items-center gap-4 flex-grow cursor-pointer"
                >
                    <span className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                        {chapter.chapter_number}
                    </span>
                    <span className="text-xl font-medium group-hover:text-blue-400 transition">
                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                    </span>
                </Link>

                <div className="flex items-center gap-4 z-10" onClick={(e) => e.stopPropagation()}>
                   <DownloadButton 
    chapterId={chapter.chapter_number} // ✅ This sends "1", matching your database
    chapterNumber={chapter.chapter_number} 
    title={chapter.title} 
/>
                </div>
            </div>
        ))}
        
        {!loading && chapters.length === 0 && (
            <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                <p>No chapters found.</p>
                <p className="text-xs mt-2 text-gray-600">Check Console (F12) for error details.</p>
            </div>
        )}
      </div>
    </div>
  );
}