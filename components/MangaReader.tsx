"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Menu, Zap } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation"; 
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import { motion } from "framer-motion"; // <--- THE MAGIC ENGINE

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

  // FETCH DATA
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

  // SCROLL PROGRESS
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center overflow-x-hidden">
      
      {/* HEADER */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full h-14 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-gray-800"
      >
        <button onClick={() => router.push('/read')} className="text-white hover:text-blue-500 transition"><ArrowLeft size={24} /></button>
        <span className="text-white font-bold tracking-widest text-sm md:text-base">PROJECT RIFT: CH {id}</span>
        <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden md:block">Double-tap art to shake</span>
            <button className="text-white"><Menu size={24} /></button>
        </div>
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </motion.div>

      {/* READER IMAGES (Now with CINEMATIC FX) */}
      <div className="w-full max-w-2xl mt-14 pb-10 shadow-2xl shadow-black min-h-screen">
        {pages.length > 0 ? (
            pages.map((page, index) => (
                <motion.div
                    key={page.id}
                    // 1. SCROLL REVEAL ANIMATION
                    initial={{ opacity: 0, y: 50, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-10%" }} // Triggers when 10% of image is visible
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    
                    // 2. DOUBLE TAP TO SHAKE (Impact Frame Effect)
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                >
                    <motion.img 
                      src={page.url} 
                      alt={`Page ${index + 1}`} 
                      className="w-full h-auto block" 
                      loading={index < 2 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      
                      // The "Shake" Animation Variant
                      variants={{
                        shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.2 } }
                      }}
                      whileHover={{ cursor: "pointer" }}
                      onClick={(e) => {
                        // Advanced: Add a little shake on click
                        const target = e.currentTarget;
                        target.animate([
                            { transform: 'translate(0px, 0px)' },
                            { transform: 'translate(-5px, 5px)' },
                            { transform: 'translate(5px, -5px)' },
                            { transform: 'translate(0px, 0px)' }
                        ], {
                            duration: 200,
                            iterations: 1
                        });
                      }}
                    />
                </motion.div>
            ))
        ) : (
            <div className="text-gray-500 text-center py-20">
                No signals found. <br/> Chapter {id} is offline.
            </div>
        )}
      </div>

      {/* SOCIAL & COMMENTS */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl px-6 mt-4 mb-10"
      >
         <SocialStats slug={`manga-${id}`} />
         <CommentSection slug={`manga-${id}`} />
      </motion.div>

      {/* FOOTER BUTTONS */}
      <div className="w-full max-w-2xl px-6 py-10 flex justify-between text-white border-t border-gray-800">
        <button 
            onClick={() => router.push(`/read/${Number(id) - 1}`)}
            disabled={Number(id) <= 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition"
        >
          <ArrowLeft size={18} /> Prev
        </button>
        <button 
            onClick={() => router.push(`/read/${Number(id) + 1}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/50 transition"
        >
          Next Chapter <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}