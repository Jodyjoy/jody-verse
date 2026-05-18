"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Menu, LayoutList, BookOpen, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation"; 
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import BookmarkButton from "./BookmarkButton"; 
import SubscribeButton from "./SubscribeButton"; 
import { motion, AnimatePresence } from "framer-motion"; 

interface MangaPage {
  id: number | string;
  url: string;
}

export default function MangaReader() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mangaId = searchParams.get('manga') || "1"; 
  const targetPageParam = searchParams.get('page');

  // --- PLATFORM ENGINE STATES ---
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  
  const [readingMode, setReadingMode] = useState<'webtoon' | 'manga'>('webtoon');
  const [currentPage, setCurrentPage] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [hasScrolledToTarget, setHasScrolledToTarget] = useState(false);

  const lastScrollY = useRef(0);
  const pageRefs = useRef<HTMLDivElement[]>([]);
  const mangaTitle = mangaId === "1" ? "SPECTRAL RIFT" : "URITHI";
  const uniqueSlug = `manga-${mangaId}-ch-${id}`;

  // 1. DATA HYDRATION
  useEffect(() => {
    if (!id) return; 

    const fetchPages = async () => {
      setLoading(true);
      let onlineData = null;
      let fetchError = null;

      try {
        const { data, error } = await supabase
          .from('manga_pages')
          .select('*')
          .eq('manga_id', mangaId) 
          .eq('chapter_id', id)
          .order('page_number', { ascending: true });
        
        if (error) fetchError = error;
        else onlineData = data;
      } catch (err) {
        fetchError = err;
      }

      if (!fetchError && onlineData && onlineData.length > 0) {
        const formattedPages = onlineData.map((page: any) => ({
            id: page.id,
            url: page.image_url
        }));
        setPages(formattedPages);
      } else {
        const offlineData = localStorage.getItem('offline_library');
        if (offlineData) {
            const library = JSON.parse(offlineData);
            const savedChapter = library.find((c: any) => 
                String(c.chapter_number) === String(id) && String(c.manga_id) === String(mangaId)
            );

            if (savedChapter && savedChapter.pages) {
                const formattedPages = savedChapter.pages.map((url: string, index: number) => ({
                    id: `offline-${index}`,
                    url: url
                }));
                setPages(formattedPages);
            }
        }
      }
      setLoading(false);
    };

    fetchPages();
  }, [id, mangaId]);

  // 2. INITIALIZE READING MODE & TARGET ENTRY PAGE
  useEffect(() => {
    const savedMode = localStorage.getItem("preferred_reading_mode");
    if (savedMode === "webtoon" || savedMode === "manga") {
      setReadingMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (!loading && pages.length > 0 && targetPageParam) {
      const parsedPage = parseInt(targetPageParam);
      if (parsedPage >= 0 && parsedPage < pages.length) {
        setCurrentPage(parsedPage);
        
        // If webtoon mode, trigger scroll target positioning mechanics
        if (readingMode === 'webtoon' && !hasScrolledToTarget) {
          setTimeout(() => {
            const targetEl = pageRefs.current[parsedPage];
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
              setHasScrolledToTarget(true);
            }
          }, 400); // Small buffer to ensure browser layout mapping is stable
        }
      }
    }
  }, [loading, pages, targetPageParam, readingMode, hasScrolledToTarget]);

  // 3. PERSIST ACTIVE TRACKING CHECKPOINTS TO MATRIX LOCALSTORAGE
  useEffect(() => {
    if (!loading && pages.length > 0) {
      const readingHistory = JSON.parse(localStorage.getItem("user_reading_history") || "{}");
      readingHistory[mangaId] = {
        chapter: id,
        page: currentPage, // 👈 Stores exact page coordinates dynamically
        timestamp: Date.now(),
        title: mangaTitle
      };
      localStorage.setItem("user_reading_history", JSON.stringify(readingHistory));
    }
  }, [currentPage, loading, pages, id, mangaId, mangaTitle]);

  // 4. SCROLL PROGRESS
  useEffect(() => {
    if (readingMode !== 'webtoon') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (totalHeight > 0) {
        setProgress((currentScrollY / totalHeight) * 100);
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowHeader(false); 
      } else {
        setShowHeader(true);  
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingMode]);

  useEffect(() => {
    if (readingMode === 'manga' && pages.length > 0) {
      setProgress(((currentPage + 1) / pages.length) * 100);
    }
  }, [currentPage, readingMode, pages]);

  // 5. BACKEND XP SYSTEM
  useEffect(() => {
    if (progress > 90 && !xpAwarded) {
        const awardXP = async () => {
            setXpAwarded(true); 
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.rpc('add_xp', { amount: 50 });
            }
        };
        awardXP();
    }
  }, [progress, xpAwarded]);

  const handleModeChange = (mode: 'webtoon' | 'manga') => {
    setReadingMode(mode);
    localStorage.setItem("preferred_reading_mode", mode);
    setShowSettingsDrawer(false);
    setHasScrolledToTarget(false);
    setCurrentPage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center font-mono tracking-widest text-rift-primary animate-pulse">
        LOADING RIFT ENGINE // {mangaTitle} CH {id}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col items-center overflow-x-hidden select-none relative">
      
      {/* --- HUD HEADER --- */}
      <motion.div 
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 w-full h-16 bg-void/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 border-b border-void-border"
      >
        <button onClick={() => router.push(`/read?manga=${mangaId}`)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={22} />
        </button>

        <div className="text-center cursor-pointer" onClick={() => setShowHeader(true)}>
          <span className="text-white font-black tracking-widest text-xs md:text-sm uppercase block">
            {mangaTitle}
          </span>
          <span className="text-[10px] font-bold text-rift-primary tracking-widest uppercase">
            Chapter {id} • Page {currentPage + 1}/{pages.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <BookmarkButton slug={uniqueSlug} title={`${mangaTitle} Ch ${id}`} type="manga" />
          <button onClick={() => setShowSettingsDrawer(!showSettingsDrawer)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Settings size={22} />
          </button>
        </div>

        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-rift-primary to-tech-cyan transition-all duration-150 ease-out shadow-[0_0_10px_rgba(139,92,246,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </motion.div>

      {/* --- PREMIUM CONFIG DRAWER --- */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 w-72 bg-void-surface border border-void-border p-5 rounded-2xl shadow-2xl z-50 backdrop-blur-xl"
          >
            <h4 className="text-xs font-black tracking-widest uppercase text-gray-500 mb-4">Reading Parameters</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleModeChange('webtoon')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border font-bold text-xs gap-2 cursor-pointer transition-all ${readingMode === 'webtoon' ? 'bg-rift-primary/10 border-rift-primary text-white' : 'bg-void border-void-border text-gray-400 hover:text-white'}`}
              >
                <LayoutList size={20} /> Vertical Scroll
              </button>
              <button 
                onClick={() => handleModeChange('manga')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border font-bold text-xs gap-2 cursor-pointer transition-all ${readingMode === 'manga' ? 'bg-rift-primary/10 border-rift-primary text-white' : 'bg-void border-void-border text-gray-400 hover:text-white'}`}
              >
                <BookOpen size={20} /> Frame Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- THE THEATER RECEPTACLE --- */}
      <div 
        className={`w-full max-w-2xl min-h-screen ${readingMode === 'webtoon' ? 'mt-16 pb-12' : 'flex items-center justify-center pt-16'}`}
        onClick={() => readingMode === 'webtoon' && setShowHeader(!showHeader)}
      >
        {pages.length > 0 ? (
          readingMode === 'webtoon' ? (
            /* --- WEBTOON MODE --- */
            <div className="flex flex-col w-full">
              {pages.map((page, index) => (
                <motion.div
                  key={page.id}
                  ref={(el) => { if (el) pageRefs.current[index] = el; }}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  // 📢 Dynamic Checkpoint Capture: Updates current page coordinates seamlessly as you scroll down
                  onViewportEnter={() => { if (readingMode === 'webtoon') setCurrentPage(index); }}
                  viewport={{ once: true, margin: "-20% 0px -60% 0px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full relative overflow-hidden"
                >
                  <img 
                    src={page.url} 
                    alt={`Panel ${index + 1}`} 
                    className="w-full h-auto block no-save" 
                    crossOrigin="anonymous" 
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            /* --- MANGA MODE --- */
            <div className="w-full h-[calc(100vh-8rem)] flex flex-col justify-between px-4 relative">
              <div className="absolute inset-y-0 left-0 w-1/4 z-30 cursor-w-resize" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} />
              <div className="absolute inset-y-0 right-0 w-1/4 z-30 cursor-e-resize" onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} />

              <div className="flex-1 flex items-center justify-center relative overflow-hidden py-4">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPage}
                    src={pages[currentPage]?.url}
                    alt={`Frame ${currentPage + 1}`}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl shadow-black/80 no-save select-none pointer-events-none"
                    crossOrigin="anonymous"
                  />
                </AnimatePresence>
              </div>

              <div className="h-16 flex items-center justify-between border border-void-border bg-void-surface/50 backdrop-blur-md rounded-2xl px-4 z-40 relative">
                <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-widest disabled:opacity-20 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <span className="text-[11px] font-mono font-bold text-gray-500 tracking-[0.2em]">
                  {currentPage + 1} / {pages.length}
                </span>
                <button 
                  disabled={currentPage === pages.length - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-widest disabled:opacity-20 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="text-gray-500 text-center font-mono py-20 uppercase tracking-wider">
            No active frequencies found. <br/> {mangaTitle} Ch {id} is offline.
          </div>
        )}
      </div>

      {/* --- SOCIAL CHANNELS --- */}
      <motion.div 
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="w-full max-w-2xl px-6 mt-8 mb-12 relative z-20"
      >
         <SocialStats slug={uniqueSlug} />
         <CommentSection slug={uniqueSlug} />
      </motion.div>

      {/* --- FOOTER NAVIGATION --- */}
      <div className="w-full max-w-2xl px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-void-border bg-void/50 backdrop-blur-md relative z-20">
        <button 
          onClick={() => {
            router.push(`/read/${Number(id) - 1}?manga=${mangaId}`);
            setCurrentPage(0);
          }}
          disabled={Number(id) <= 1}
          className="flex items-center gap-2 px-6 py-3 border border-void-border bg-void-surface text-gray-300 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed hover:bg-void hover:text-white transition-all w-full sm:w-auto justify-center cursor-pointer"
        >
          <ArrowLeft size={16} /> Prev Ch
        </button>

        <div className="w-full sm:w-auto flex justify-center">
          <SubscribeButton />
        </div>

        <button 
          onClick={() => {
            router.push(`/read/${Number(id) + 1}?manga=${mangaId}`);
            setCurrentPage(0);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-xl text-sm uppercase tracking-widest hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all w-full sm:w-auto justify-center cursor-pointer"
        >
          Next Ch <ArrowLeft size={16} className="rotate-180" />
        </button>
      </div>

    </div>
  );
}