"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function NovelIndex() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from('novel_chapters')
        .select('id, title, chapter_number, created_at')
        .order('chapter_number', { ascending: true });

      if (error) console.error(error);
      else setChapters(data || []);
      setLoading(false);
    };

    fetchChapters();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-12 flex items-center gap-4">
        <Link href="/" className="p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                TALES OF THE 47: BOOK I
            </h1>
            <p className="text-gray-400 mt-2">Select a chapter to begin reading.</p>
        </div>
      </div>

      {/* CHAPTER GRID */}
      <div className="max-w-4xl mx-auto grid gap-4">
        {loading ? (
            <div className="text-gray-500 animate-pulse">Loading library...</div>
        ) : chapters.map((chapter) => (
            <Link 
                key={chapter.id} 
                href={`/novel/${chapter.chapter_number}`}
                className="group flex items-center justify-between p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-yellow-500/50 hover:bg-gray-800 transition-all duration-300"
            >
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full font-mono text-yellow-500 font-bold group-hover:bg-yellow-500 group-hover:text-black transition">
                        {chapter.chapter_number}
                    </span>
                    <span className="text-xl font-medium group-hover:text-yellow-400 transition">
                        {chapter.title}
                    </span>
                </div>
                <BookOpen size={20} className="text-gray-600 group-hover:text-white transition" />
            </Link>
        ))}
        
        {/* Empty State */}
        {!loading && chapters.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                No chapters found. Time to write! ✍️
            </div>
        )}
      </div>
    </div>
  );
}