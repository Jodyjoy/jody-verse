"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation"; 
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import BookmarkButton from "./BookmarkButton"; 
import { motion } from "framer-motion"; 

interface MangaPage {
  id: number | string;
  url: string;
}

export default function MangaReader() {
  const { id } = useParams();
  const router = useRouter();

  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  // FETCH DATA (HYBRID MODE)
  useEffect(() => {
    if (!id) return; 

    const fetchPages = async () => {
      setLoading(true);
      
      let onlineData = null;
      let fetchError = null;

      // 1. TRY ONLINE FETCH
      try {
        const { data, error } = await supabase
          .from('manga_pages')
          .select('*')
          .eq('chapter_id', id)
          .order('page_number', { ascending: true });
        
        if (error) fetchError = error;
        else onlineData = data;
      } catch (err) {
        fetchError = err;
      }

      // 2. DECISION LOGIC
      if (!fetchError && onlineData && onlineData.length > 0) {
        // ✅ ONLINE: Success
        const formattedPages = onlineData.map((page: any) => ({
            id: page.id,
            url: page.image_url
        }));
        setPages(formattedPages);
      } else {
        // ⚠️ OFFLINE FALLBACK: Check Local Storage
        console.log("Supabase unreachable or empty. Checking offline library...");
        
        const offlineData = localStorage.getItem('offline_library');
        if (offlineData) {
            const library = JSON.parse(offlineData);
            
            const savedChapter = library.find((c: any) => String(c.chapter_number) === String(id));

            if (savedChapter && savedChapter.pages) {
                console.log("🎯 Found saved offline map for Chapter", id);
                
                const formattedPages = savedChapter.pages.map((url: string, index: number) => ({
                    id: `offline-${index}`,
                    url: url
                }));
                setPages(formattedPages);
            } else {
                console.error("❌ Chapter not found in offline library.");
            }
        }
      }
      setLoading(false);
    };

    fetchPages();
  }, [id]);

  // XP SYSTEM
  useEffect(() => {
    if (progress > 90 && !xpAwarded) {
        const awardXP = async () => {
            setXpAwarded(true); 
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.rpc('add_xp', { amount: 50 });
                console.log("Create +50 XP!"); 
            }
        };
        awardXP();
    }
  }, [progress, xpAwarded]);

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
        <button onClick={() => router.push('/read')} className="text-white hover:text-blue-500 transition">
            <ArrowLeft size={24} />
        </button>

        <span className="text-white font-bold tracking-widest text-sm md:text-base absolute left-1/2 transform -translate-x-1/2">
            PROJECT RIFT: CH {id}
        </span>

        <div className="flex items-center gap-3">
            <BookmarkButton slug={`manga-${id}`} title={`Chapter ${id}`} type="manga" />
            <button className="text-white hover:text-blue-500 transition">
                <Menu size={24} />
            </button>
        </div>

        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </motion.div>

      {/* READER IMAGES */}
      <div className="w-full max-w-2xl mt-14 pb-10 shadow-2xl shadow-black min-h-screen">
        {pages.length > 0 ? (
            pages.map((page, index) => (
                <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 50, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                >
                    <motion.img 
                      src={page.url} 
                      alt={`Page ${index + 1}`} 
                      className="w-full h-auto block" 
                      crossOrigin="anonymous" // 👈 Helps with Cache/CORS access
                      loading={index < 2 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      whileHover={{ cursor: "pointer" }}
                      onClick={(e) => {
                        const target = e.currentTarget;
                        target.animate([
                            { transform: 'translate(0px, 0px)' },
                            { transform: 'translate(-5px, 5px)' },
                            { transform: 'translate(5px, -5px)' },
                            { transform: 'translate(0px, 0px)' }
                        ], { duration: 200, iterations: 1 });
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

      {/* FOOTER */}
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
          Next Chapter <ArrowLeft size={18} className="rotate-180" />
        </button>
      </div>

    </div>
  );
}