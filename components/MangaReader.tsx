"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // Import the connection!

interface MangaPage {
  id: number;
  url: string;
}

export default function MangaReader() {
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // 1. FETCH DATA FROM SUPABASE
  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('manga_pages') // The table we just made
        .select('*')
        .eq('chapter_id', 1) // Get Chapter 1
        .order('page_number', { ascending: true }); // Ensure correct order

      if (error) {
        console.error('Error fetching pages:', error);
      } else {
        // Map the database columns to our frontend format
        const formattedPages = data.map((page: any) => ({
            id: page.id,
            url: page.image_url
        }));
        setPages(formattedPages);
      }
      setLoading(false);
    };

    fetchPages();
  }, []);

  // 2. SCROLL LOGIC
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
    return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 animate-pulse">Loading Chapter...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center">
      
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full h-14 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-gray-800">
        <button className="text-white"><ArrowLeft size={24} /></button>
        <span className="text-white font-bold tracking-widest">PROJECT RIFT</span>
        <button className="text-white"><Menu size={24} /></button>
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* READER */}
      <div className="w-full max-w-2xl mt-14 pb-20 shadow-2xl shadow-black">
        {pages.map((page) => (
            <img 
              key={page.id}
              src={page.url} 
              alt={`Page`} 
              className="w-full h-auto block" 
              loading="lazy"
            />
        ))}
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-2xl px-6 py-10 flex justify-between text-white">
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-700 rounded-lg">
          <ArrowLeft size={18} /> Prev
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg font-bold">
          Next Chapter <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}