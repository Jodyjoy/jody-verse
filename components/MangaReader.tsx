"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Menu, LayoutList, BookOpen,
  ChevronLeft, ChevronRight, Settings, ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import BookmarkButton from "./BookmarkButton";
import SubscribeButton from "./SubscribeButton";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Series branding lookup ─────────────────────────────────── */
const SERIES_META: Record<string, { color: string; accentRgb: string; cover: string | null; label: string }> = {
  "1": { color: "#8B5CF6", accentRgb: "139,92,246", cover: "/spectral_rift_cover.jpeg", label: "Spectral Rift" },
  "2": { color: "#F59E0B", accentRgb: "245,158,11", cover: "/urithi_cover.jpeg",         label: "Urithi" },
  "3": { color: "#EC4899", accentRgb: "236,72,153", cover: "/katikati_cover.jpeg",         label: "Katikati" },
};

interface MangaPage { id: number | string; url: string; }

export default function MangaReader() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mangaId = searchParams.get("manga") || "1";
  const targetPageParam = searchParams.get("page");

  const meta = SERIES_META[mangaId] || SERIES_META["1"];
  const mangaTitle = mangaId === "1" ? "SPECTRAL RIFT" : mangaId === "2" ? "URITHI" : "KATIKATI";
  const uniqueSlug = `manga-${mangaId}-ch-${id}`;

  /* ─── State ─────────────────────────────────────────────────── */
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [readingMode, setReadingMode] = useState<"webtoon" | "manga">("webtoon");
  const [currentPage, setCurrentPage] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [hasScrolledToTarget, setHasScrolledToTarget] = useState(false);

  const lastScrollY  = useRef(0);
  const pageRefs     = useRef<HTMLDivElement[]>([]);
  const touchStartX  = useRef<number | null>(null);

  /* ─── Touch swipe + keyboard (frame mode only) ───────────────── */
  useEffect(() => {
    if (readingMode !== "manga") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  setCurrentPage(p => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(pages.length - 1, p + 1));
    };

    const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd   = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) < 50) return; // ignore tiny taps
      if (delta > 0) setCurrentPage(p => Math.min(pages.length - 1, p + 1)); // swipe left → next
      else            setCurrentPage(p => Math.max(0, p - 1));               // swipe right → prev
      touchStartX.current = null;
    };

    window.addEventListener("keydown",     onKeyDown);
    window.addEventListener("touchstart",  onTouchStart, { passive: true });
    window.addEventListener("touchend",    onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("keydown",    onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [readingMode, pages.length]);

  /* ─── 1. Data hydration ──────────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    const fetchPages = async () => {
      setLoading(true);
      let onlineData = null;
      let fetchError = null;
      try {
        const { data, error } = await supabase
          .from("manga_pages")
          .select("*")
          .eq("manga_id", mangaId)
          .eq("chapter_id", id)
          .order("page_number", { ascending: true });
        if (error) fetchError = error;
        else onlineData = data;
      } catch (err) {
        fetchError = err;
      }
      if (!fetchError && onlineData && onlineData.length > 0) {
        setPages(onlineData.map((p: any) => ({ id: p.id, url: p.image_url })));
      } else {
        const offlineData = localStorage.getItem("offline_library");
        if (offlineData) {
          const library = JSON.parse(offlineData);
          const saved = library.find(
            (c: any) => String(c.chapter_number) === String(id) && String(c.manga_id) === String(mangaId)
          );
          if (saved?.pages) {
            setPages(saved.pages.map((url: string, i: number) => ({ id: `offline-${i}`, url })));
          }
        }
      }
      setLoading(false);
    };
    fetchPages();
  }, [id, mangaId]);

  /* ─── 2. Reading mode init ───────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem("preferred_reading_mode");
    if (saved === "webtoon" || saved === "manga") setReadingMode(saved);
  }, []);

  /* ─── 3. Target page scroll ──────────────────────────────────── */
  useEffect(() => {
    if (!loading && pages.length > 0 && targetPageParam) {
      const parsed = parseInt(targetPageParam);
      if (parsed >= 0 && parsed < pages.length) {
        setCurrentPage(parsed);
        if (readingMode === "webtoon" && !hasScrolledToTarget) {
          setTimeout(() => {
            const el = pageRefs.current[parsed];
            if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setHasScrolledToTarget(true); }
          }, 400);
        }
      }
    }
  }, [loading, pages, targetPageParam, readingMode, hasScrolledToTarget]);

  /* ─── 4. Reading history persistence ────────────────────────── */
  useEffect(() => {
    if (!loading && pages.length > 0) {
      const hist = JSON.parse(localStorage.getItem("user_reading_history") || "{}");
      hist[mangaId] = { chapter: id, page: currentPage, timestamp: Date.now(), title: mangaTitle };
      localStorage.setItem("user_reading_history", JSON.stringify(hist));
    }
  }, [currentPage, loading, pages, id, mangaId, mangaTitle]);

  /* ─── 5. Scroll progress + HUD hide/show ────────────────────── */
  useEffect(() => {
    if (readingMode !== "webtoon") return;
    const onScroll = () => {
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) setProgress((y / total) * 100);
      setShowHeader(y <= lastScrollY.current || y <= 80);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [readingMode]);

  useEffect(() => {
    if (readingMode === "manga" && pages.length > 0) {
      setProgress(((currentPage + 1) / pages.length) * 100);
    }
  }, [currentPage, readingMode, pages]);

  /* ─── 6. XP award ───────────────────────────────────────────── */
  useEffect(() => {
    if (progress > 90 && !xpAwarded) {
      setXpAwarded(true);
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.rpc("add_xp", { amount: 50 });
      })();
    }
  }, [progress, xpAwarded]);

  const handleModeChange = (mode: "webtoon" | "manga") => {
    setReadingMode(mode);
    localStorage.setItem("preferred_reading_mode", mode);
    setShowSettingsDrawer(false);
    setHasScrolledToTarget(false);
    setCurrentPage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ─── Loading screen ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#03010C",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        fontFamily: "'Bebas Neue', sans-serif",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600&display=swap');`}</style>
        {/* Cover art background */}
        {meta.cover && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url('${meta.cover}')`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.12,
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${meta.accentRgb},0.18) 0%, transparent 70%)`,
        }} />
        {/* Halftone */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.5em", color: meta.color, marginBottom: 8, opacity: 0.9 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 22, letterSpacing: "0.15em", color: "#fff", marginBottom: 6 }}>
            {mangaTitle}
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)", marginBottom: 36, textTransform: "uppercase" }}>
            Chapter {id} · Preparing
          </div>
          {/* Animated loading bar */}
          <div style={{ width: 180, height: 2, background: "rgba(255,255,255,0.07)", margin: "0 auto", overflow: "hidden", position: "relative" }}>
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60%", background: meta.color, boxShadow: `0 0 12px rgba(${meta.accentRgb},0.8)` }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main reader ────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh", background: "#03010C",
      display: "flex", flexDirection: "column", alignItems: "center",
      overflow: "hidden", position: "relative",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .no-save { user-select: none; -webkit-user-select: none; pointer-events: none; }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 28px; border-radius: 2px; cursor: pointer;
          font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.14em;
          text-transform: uppercase; transition: transform 0.12s, box-shadow 0.12s;
        }
        .nav-btn:hover { transform: translate(-2px,-2px); }
        .nav-btn:disabled { opacity: 0.28; cursor: not-allowed; transform: none; }
        .btn-white {
          background: #fff; color: #000;
          box-shadow: 3px 3px 0 rgba(255,255,255,0.2);
        }
        .btn-white:hover:not(:disabled) { box-shadow: 5px 5px 0 rgba(255,255,255,0.2); }
        .btn-ghost {
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 3px 3px 0 rgba(0,0,0,0.3);
        }
        .btn-ghost:hover:not(:disabled) { box-shadow: 5px 5px 0 rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.25); color: #fff; }
      `}</style>

      {/* ── HUD Header ── */}
      <motion.div
        animate={{ y: showHeader ? 0 : -72 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", zIndex: 50,
          height: 60, background: "rgba(3,1,12,0.88)", backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push(`/read?manga=${mangaId}`)}
          style={{
            width: 36, height: 36, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", borderRadius: 2,
            color: "rgba(255,255,255,0.55)", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>

        {/* Center info */}
        <div
          style={{ textAlign: "center", flex: 1, padding: "0 16px", cursor: "pointer" }}
          onClick={() => setShowHeader(true)}
        >
          <div className="bb" style={{ fontSize: 9, letterSpacing: "0.4em", color: meta.color, lineHeight: 1 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
            Chapter {id} · {currentPage + 1} / {pages.length}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <BookmarkButton slug={uniqueSlug} title={`${mangaTitle} Ch ${id}`} type="manga" />
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            style={{
              width: 36, height: 36,
              border: showSettingsDrawer ? `1px solid rgba(${meta.accentRgb},0.5)` : "1px solid rgba(255,255,255,0.1)",
              background: showSettingsDrawer ? `rgba(${meta.accentRgb},0.18)` : "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", borderRadius: 2, color: "rgba(255,255,255,0.6)",
              transition: "all 0.2s",
            }}
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 2,
          width: `${progress}%`, background: meta.color,
          transition: "width 0.15s ease-out",
          boxShadow: `0 0 12px rgba(${meta.accentRgb},0.8)`,
        }} />
      </motion.div>

      {/* ── Settings drawer ── */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed", top: 68, right: 14, width: 232, zIndex: 50,
              background: "rgba(6,3,18,0.96)", backdropFilter: "blur(28px)",
              border: `1px solid rgba(${meta.accentRgb},0.25)`,
              boxShadow: `4px 4px 0 rgba(${meta.accentRgb},0.14)`,
              padding: "16px 14px", borderRadius: 2,
            }}
          >
            <div className="bb" style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>Reading Mode</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {([
                { mode: "webtoon", label: "Vertical", Icon: LayoutList, desc: "Scroll down" },
                { mode: "manga",   label: "Frame",    Icon: BookOpen,   desc: "Page-by-page" },
              ] as const).map(({ mode, label, Icon, desc }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  style={{
                    padding: "12px 8px", cursor: "pointer", borderRadius: 2,
                    border: readingMode === mode
                      ? `1px solid rgba(${meta.accentRgb},0.65)`
                      : "1px solid rgba(255,255,255,0.08)",
                    background: readingMode === mode
                      ? `rgba(${meta.accentRgb},0.15)`
                      : "rgba(255,255,255,0.03)",
                    color: readingMode === mode ? "#fff" : "rgba(255,255,255,0.4)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={18} />
                  <div>
                    <div className="bb" style={{ fontSize: 11, letterSpacing: "0.14em" }}>{label}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {/* Keyboard hint */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="bb" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Frame mode shortcuts</div>
              {[["← →", "Navigate"], ["Tap left/right", "Mobile"]].map(([key, action]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: meta.color, fontFamily: "monospace" }}>{key}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{action}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content area ── */}
      <div
        style={{
          width: "100%", maxWidth: 800, minHeight: "100vh",
          marginTop: readingMode === "webtoon" ? 60 : 0,
          paddingBottom: readingMode === "webtoon" ? 48 : 0,
        }}
        onClick={() => readingMode === "webtoon" && setShowHeader(!showHeader)}
      >
        {pages.length > 0 ? (
          readingMode === "webtoon" ? (
            /* ── Webtoon mode ── */
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              {pages.map((page, index) => (
                <motion.div
                  key={page.id}
                  ref={(el) => { if (el) pageRefs.current[index] = el; }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  onViewportEnter={() => { if (readingMode === "webtoon") setCurrentPage(index); }}
                  viewport={{ once: true, margin: "-20% 0px -60% 0px" }}
                  transition={{ duration: 0.5 }}
                  style={{ width: "100%", position: "relative" }}
                >
                  <img
                    src={page.url}
                    alt={`Panel ${index + 1}`}
                    className="no-save"
                    style={{ width: "100%", height: "auto", display: "block" }}
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                  {/* Thin separator between pages */}
                  {index < pages.length - 1 && (
                    <div style={{ height: 2, background: "#03010C" }} />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            /* ── Manga / frame mode ── */
            <div style={{
              width: "100%", height: "100vh",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              paddingTop: 60,
            }}>
              {/* Tap zones */}
              <div
                style={{ position: "absolute", top: 60, bottom: 80, left: 0, width: "35%", zIndex: 10, cursor: "w-resize" }}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              />
              <div
                style={{ position: "absolute", top: 60, bottom: 80, right: 0, width: "35%", zIndex: 10, cursor: "e-resize" }}
                onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              />

              {/* Page display */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "8px 16px" }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPage}
                    src={pages[currentPage]?.url}
                    alt={`Frame ${currentPage + 1}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="no-save"
                    style={{ maxWidth: "100%", maxHeight: "calc(100vh - 148px)", objectFit: "contain", display: "block" }}
                  />
                </AnimatePresence>
              </div>

              {/* Frame controls */}
              <div style={{
                height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 20px", position: "relative", zIndex: 20,
                background: "rgba(3,1,12,0.8)", backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}>
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="nav-btn btn-ghost"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <div style={{ textAlign: "center" }}>
                  <div className="bb" style={{ fontSize: 18, letterSpacing: "0.06em", color: "#fff", lineHeight: 1 }}>
                    {currentPage + 1}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}>
                    of {pages.length}
                  </div>
                </div>
                <button
                  disabled={currentPage === pages.length - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="nav-btn btn-white"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "100vh", gap: 14, color: "rgba(255,255,255,0.25)", textAlign: "center",
          }}>
            <BookOpen size={36} style={{ opacity: 0.3 }} />
            <div className="bb" style={{ fontSize: 13, letterSpacing: "0.22em" }}>
              No pages found.
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>
              {mangaTitle} · Ch {id} is offline or empty.
            </div>
          </div>
        )}
      </div>

      {/* ── Social stats + comments ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ width: "100%", maxWidth: 720, padding: "40px 20px 48px", position: "relative", zIndex: 20 }}
      >
        <SocialStats slug={uniqueSlug} />
        <CommentSection slug={uniqueSlug} />
      </motion.div>

      {/* ── Chapter navigation footer ── */}
      <div style={{
        width: "100%", maxWidth: 720, padding: "20px 20px 36px",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(3,1,12,0.7)", backdropFilter: "blur(20px)",
        position: "relative", zIndex: 20,
      }}>
        <button
          onClick={() => { router.push(`/read/${Number(id) - 1}?manga=${mangaId}`); setCurrentPage(0); }}
          disabled={Number(id) <= 1}
          className="nav-btn btn-ghost"
          style={{ flex: 1, justifyContent: "center", minWidth: 120 }}
        >
          <ArrowLeft size={14} /> Prev Chapter
        </button>

        <div style={{ flexShrink: 0, order: 0 }}>
          <SubscribeButton />
        </div>

        <button
          onClick={() => { router.push(`/read/${Number(id) + 1}?manga=${mangaId}`); setCurrentPage(0); }}
          className="nav-btn btn-white"
          style={{
            flex: 1, justifyContent: "center", minWidth: 120,
            boxShadow: `3px 3px 0 rgba(${meta.accentRgb},0.5)`,
          }}
        >
          Next Chapter <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
