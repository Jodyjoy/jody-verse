"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation"; 
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";

interface MangaPage {
  id: number;
  url: string;
}

export default function MangaReader() {
  const { id } = useParams();
  const router = useRouter();

  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // FETCH DYNAMIC DATA
  useEffect(() => {
    if (!id) return; 

    const fetchPages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('manga_pages')
        .select('*')
        .eq('chapter_id', id)
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

      {/* READER IMAGES */}
      <div className="w-full max-w-2xl mt-14 pb-10 shadow-2xl shadow-black min-h-screen">
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

      {/* SOCIAL & COMMENTS (Bottom Only) */}
      <div className="w-full max-w-2xl px-6 mt-4 mb-10">
         <SocialStats slug={`manga-${id}`} />
         <CommentSection slug={`manga-${id}`} />
      </div>

      {/* FOOTER BUTTONS */}
      <div className="w-full max-w-2xl px-6 py-10 flex justify-between text-white border-t border-gray-800">
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