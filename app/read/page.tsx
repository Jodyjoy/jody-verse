"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, BookOpen } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import DownloadButton from "../../components/DownloadButton"; 
import { useSearchParams, useRouter } from "next/navigation"; // 👈 Added navigation hooks

export default function MangaIndex() {
  const searchParams = useSearchParams();
  const urlMangaId = searchParams.get('manga');
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 👈 NEW: Default to the URL parameter if it exists, otherwise Spectral Rift (1)
  const [activeManga, setActiveManga] = useState<number>(urlMangaId ? parseInt(urlMangaId) : 1); 

  const clearAllOffline = async () => {
    if (!confirm("This will delete ALL downloaded chapters from your device. Proceed?")) return;
    localStorage.removeItem('offline_library');
    const cacheNames = await window.caches.keys();
    for (const name of cacheNames) {
        if (name.startsWith('manga-')) {
            await window.caches.delete(name);
        }
    }
    window.location.reload();
  };

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('manga_chapters')
        .select('*')
        .eq('manga_id', activeManga) 
        .order('chapter_number', { ascending: true });

      if (!error && data && data.length > 0) {
        setChapters(data); 
      } else {
        const offlineData = localStorage.getItem('offline_library');
        if (offlineData) {
            const parsedData = JSON.parse(offlineData);
            const mangaChapters = parsedData.filter((c: any) => String(c.manga_id) === String(activeManga));
            mangaChapters.sort((a: any, b: any) => a.chapter_number - b.chapter_number);
            setChapters(mangaChapters);
        } else {
            setChapters([]);
        }
      }
      setLoading(false);
    };

    fetchChapters();
  }, [activeManga]); 

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            {/* 👈 Back arrow returns to Home */}
            <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 uppercase">
                    Jody-Verse Library
                </h1>
                <p className="text-gray-400 mt-2">Choose your universe</p>
            </div>
        </div>

        <button 
            onClick={clearAllOffline}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded-lg transition-all bg-gray-900/30"
        >
            <Trash2 size={14} />
            Clear Offline
        </button>
      </div>

      <div className="max-w-4xl mx-auto flex gap-4 mb-8 bg-gray-900 p-2 rounded-xl">
         <button 
            onClick={() => setActiveManga(1)}
            className={`flex-1 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeManga === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
         >
            <BookOpen size={18} /> Spectral Rift
         </button>
         <button 
            onClick={() => setActiveManga(2)}
            className={`flex-1 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeManga === 2 ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
         >
            <BookOpen size={18} /> Urithi
         </button>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {loading ? (
             <div className="text-gray-500 animate-pulse text-center py-10">Loading library...</div>
        ) : chapters.map((chapter) => (
            <div 
                key={chapter.id || chapter.chapter_number} 
                className={`group flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-xl transition-all duration-300 ${activeManga === 1 ? 'hover:border-blue-500/50' : 'hover:border-purple-500/50'}`}
            >
                <Link 
                    href={`/read/${chapter.chapter_number}?manga=${activeManga}`}
                    className="flex items-center gap-4 flex-grow cursor-pointer"
                >
                    <span className={`flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full font-bold transition text-white ${activeManga === 1 ? 'group-hover:bg-blue-600' : 'group-hover:bg-purple-600'}`}>
                        {chapter.chapter_number}
                    </span>
                    <span className={`text-xl font-medium transition ${activeManga === 1 ? 'group-hover:text-blue-400' : 'group-hover:text-purple-400'}`}>
                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                    </span>
                </Link>

                <div className="flex items-center gap-4 z-10" onClick={(e) => e.stopPropagation()}>
                    <DownloadButton 
                        mangaId={activeManga} 
                        chapterId={chapter.chapter_number} 
                        chapterNumber={chapter.chapter_number} 
                        title={chapter.title} 
                    />
                </div>
            </div>
        ))}
        
        {!loading && chapters.length === 0 && (
            <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                <p>No chapters found in this universe yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}