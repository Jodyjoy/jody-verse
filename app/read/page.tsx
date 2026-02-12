"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function MangaIndex() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DYNAMIC CHAPTERS
  useEffect(() => {
    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from('manga_chapters')
        .select('*')
        .order('chapter_number', { ascending: true });

      if (error) console.error("Error fetching chapters:", error);
      else setChapters(data || []);
      
      setLoading(false);
    };

    fetchChapters();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-12 flex items-center gap-4">
        <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                SPECTRAL RIFT: MANGA
            </h1>
            <p className="text-gray-400 mt-2">Visualizing the flow.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {loading ? (
             <div className="text-gray-500 animate-pulse">Loading manga library...</div>
        ) : chapters.map((chapter) => (
            <Link 
                key={chapter.id} 
                href={`/read/${chapter.chapter_number}`} // Uses the real number
                className="group flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300"
            >
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                        {chapter.chapter_number}
                    </span>
                    <span className="text-xl font-medium group-hover:text-blue-400 transition">
                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                    </span>
                </div>
                <ImageIcon size={20} className="text-gray-600 group-hover:text-white transition" />
            </Link>
        ))}
        
        {!loading && chapters.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                No manga chapters found. Go to Admin to upload!
            </div>
        )}
      </div>
    </div>
  );
}