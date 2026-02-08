"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import SocialStats from "./SocialStats";
import CommentSection from "./CommentSection"; // 1. Import tools

interface MangaPage {
  id: number;
  url: string;
}

export default function MangaReader() {
  const { id } = useParams(); // 2. Get the ID (e.g. "2")
  const router = useRouter();

  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // 3. FETCH DYNAMIC DATA
  useEffect(() => {
    if (!id) return; // Wait for URL

    const fetchPages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('manga_pages')
        .select('*')
        .eq('chapter_id', id) // <--- DYNAMIC ID!
        .order('page_number', { ascending: true });

      if (error) {
        console.error('Error fetching pages:', error);
      } else {
        const formattedPages = data.map((page: any) => ({
            id: page.id,
            url: page.image_url
        }));
        setPages(formattedPages);
      }
      setLoading(false);
    };

    fetchPages();
  }, [id]);

  // SCROLL LOGIC
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalHeight > 0) {
        setProgress((currentScroll / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 animate-pulse">Loading Chapter {id}...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center">
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full h-14 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-gray-800">
        <button onClick={() => router.push('/read')} className="text-white"><ArrowLeft size={24} /></button>
        <span className="text-white font-bold tracking-widest">PROJECT RIFT: CH {id}</span>
        <button className="text-white"><Menu size={24} /></button>
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full max-w-2xl px-6 mt-10">
     <SocialStats slug={`manga-${id}`} /> {/* <--- ADD THIS */}
     <CommentSection slug={`manga-${id}`} />
</div>

return (
  <div className="min-h-screen ...">
      {/* ... Header ... */}
      {/* ... Reader Images ... */}

      {/* 2. PASTE THIS RIGHT HERE (Above the footer buttons) */}
      <div className="w-full max-w-2xl px-6 mt-10">
         <CommentSection slug={`manga-${id}`} />
      </div>

      {/* Footer Buttons */}
      <div className="w-full max-w-2xl px-6 py-10 flex justify-between text-white">
        {/* ... buttons ... */}
      </div>

  </div>
);
      {/* READER */}
      <div className="w-full max-w-2xl mt-14 pb-20 shadow-2xl shadow-black min-h-screen">
        {pages.length > 0 ? (
            pages.map((page) => (
                <img 
                  key={page.id}
                  src={page.url} 
                  alt={`Page`} 
                  className="w-full h-auto block" 
                  loading="lazy"
                />
            ))
        ) : (
            <div className="text-gray-500 text-center py-20">
                Page blank. <br/> No art found for Chapter {id}.
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-2xl px-6 py-10 flex justify-between text-white">
        <button 
            onClick={() => router.push(`/read/${Number(id) - 1}`)}
            disabled={Number(id) <= 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={18} /> Prev
        </button>
        <button 
            onClick={() => router.push(`/read/${Number(id) + 1}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition"
        >
          Next Chapter <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}