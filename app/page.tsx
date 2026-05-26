"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Shield, Zap, Users, ChevronRight, ChevronLeft,
  Play, Menu, X, Sparkles, Clock, Star, Flame,
} from "lucide-react";
import UserBadge from "../components/UserBadge";
import { supabase } from "../lib/supabaseClient";
import { characters } from "../lib/wikiData";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

/* ─── Types ───────────────────────────────────────────────────── */
interface ReadingHistory {
  [key: string]: { chapter: string; page?: number; timestamp: number; title: string };
}
interface Chapter {
  id: string;
  manga_id?: number;
  chapter_number: number;
  title: string;
  created_at: string;
  type: "manga" | "novel";
}

/* ─── Series data ─────────────────────────────────────────────── */
const SERIES = [
  {
    index: 0,
    mangaId: 1,
    title: "SPECTRAL RIFT",
    label: "Manga · Vol. I",
    tagline: "When shadows bleed through",
    genre: ["Supernatural", "Action", "Urban Fantasy"],
    chapters: "20+",
    cover: "/spectral_rift_cover.jpeg",
    description:
      "Shadows leak into Nairobi. Squad 7 races against a growing rift between worlds — and the darkness is learning to hunt.",
    href: "/read?manga=1",
    chapterHref: "/read",
    color: "#8B5CF6",
    colorDeep: "#4C1D95",
    colorAlt: "#2563EB",
    grad: "linear-gradient(135deg, #3B0764 0%, #7C3AED 45%, #1D4ED8 100%)",
    gradCard: "linear-gradient(160deg, rgba(76,29,149,0.5) 0%, rgba(29,78,216,0.2) 100%)",
    gradGlow: "rgba(139,92,246,0.35)",
    accentRgb: "139,92,246",
  },
  {
    index: 1,
    mangaId: 2,
    title: "URITHI",
    label: "Manga · Dark Fantasy",
    tagline: "Blood always remembers",
    genre: ["Dark Fantasy", "Drama", "Heritage"],
    chapters: "15+",
    cover: "/urithi_cover.jpeg",
    description:
      "Ancient bloodlines wake to a modern reckoning. Heritage becomes power. Legacy becomes curse. Some gifts are chains.",
    href: "/read?manga=2",
    chapterHref: "/read",
    color: "#F59E0B",
    colorDeep: "#78350F",
    colorAlt: "#D97706",
    grad: "linear-gradient(135deg, #451A03 0%, #B45309 45%, #D97706 100%)",
    gradCard: "linear-gradient(160deg, rgba(120,53,15,0.5) 0%, rgba(180,83,9,0.2) 100%)",
    gradGlow: "rgba(245,158,11,0.35)",
    accentRgb: "245,158,11",
  },
  {
    index: 2,
    mangaId: 3,
    title: "KATIKATI",
    label: "Manhwa · Supernatural",
    tagline: "They are not alone.",
    genre: ["Supernatural", "Mystery", "Thriller"],
    chapters: "Coming",
    cover: "/katikati_cover.jpeg",
    description:
      "Nine young Kenyans. An endless mall. No memory of how they got there. They must escape Katikati — the in between — without knowing that getting out comes at a cost.",
    href: "/read?manga=3",
    chapterHref: "/read?manga=3",
    color: "#EC4899",
    colorDeep: "#831843",
    colorAlt: "#DB2777",
    grad: "linear-gradient(135deg, #1F0B18 0%, #9D174D 45%, #EC4899 100%)",
    gradCard: "linear-gradient(160deg, rgba(131,24,67,0.5) 0%, rgba(236,72,153,0.2) 100%)",
    gradGlow: "rgba(236,72,153,0.35)",
    accentRgb: "236,72,153",
  },
  {
    index: 3,
    mangaId: 0,
    title: "TALES OF THE 47",
    label: "Light Novel · Folklore",
    tagline: "The untold become legend",
    genre: ["Folklore", "Historical", "Drama"],
    chapters: "12+",
    cover: null,
    description:
      "Forty-seven folk legends reimagined. Voices that history silenced. Stories that were stolen — finally told.",
    href: "/novel",
    chapterHref: "/novel",
    color: "#0EA5E9",
    colorDeep: "#1E3A8A",
    colorAlt: "#7C3AED",
    grad: "linear-gradient(135deg, #0F172A 0%, #1D4ED8 45%, #0EA5E9 100%)",
    gradCard: "linear-gradient(160deg, rgba(30,58,138,0.5) 0%, rgba(14,165,233,0.2) 100%)",
    gradGlow: "rgba(14,165,233,0.35)",
    accentRgb: "14,165,233",
  },
];

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  },
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function seriesNameById(mangaId?: number): string {
  if (mangaId === 1) return "Spectral Rift";
  if (mangaId === 2) return "Urithi";
  if (mangaId === 3) return "Katikati";
  return "Tales of the 47";
}
function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [activeHero, setActiveHero] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [latestChapters, setLatestChapters] = useState<Chapter[]>([]);
  const [history, setHistory] = useState<ReadingHistory | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  /* Auto-advance hero */
  useEffect(() => {
    if (heroPaused) return;
    const t = setTimeout(() => setActiveHero((p) => (p + 1) % SERIES.length), 6000);
    return () => clearTimeout(t);
  }, [activeHero, heroPaused]);

  useEffect(() => {
    const saved = localStorage.getItem("user_reading_history");
    if (saved) setHistory(JSON.parse(saved));

    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);

    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    (async () => {
      const [{ data: manga }, { data: novel }] = await Promise.all([
        supabase
          .from("manga_chapters")
          .select("id, manga_id, chapter_number, title, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("novel_chapters")
          .select("id, chapter_number, title, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      const combined: Chapter[] = [
        ...(manga || []).map((c) => ({ ...c, id: String(c.id), type: "manga" as const })),
        ...(novel || []).map((c) => ({ ...c, id: String(c.id), type: "novel" as const })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);
      setLatestChapters(combined);
    })();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const latestRead = (() => {
    if (!history) return null;
    const items = Object.entries(history).map(([mangaId, d]) => ({ mangaId, ...d }));
    return items.length ? items.sort((a, b) => b.timestamp - a.timestamp)[0] : null;
  })();

  const s = SERIES[activeHero];

  /* ─── Render ────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen text-white overflow-x-hidden relative" style={{ background: "#03010C", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');

        :root {
          --void:     #03010C;
          --purple:   #7C3AED;
          --violet:   #8B5CF6;
          --indigo:   #4F46E5;
          --blue:     #2563EB;
          --blue-lt:  #3B82F6;
          --cyan:     #0EA5E9;
          --gold:     #D97706;
          --gold-lt:  #F59E0B;
          --gold-br:  #FBBF24;
          --s1: rgba(255,255,255,0.035);
          --s2: rgba(255,255,255,0.06);
          --s3: rgba(255,255,255,0.10);
          --border: rgba(255,255,255,0.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--void); }
        a { color: inherit; text-decoration: none; }

        /* Typography */
        .bb   { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .cin  { font-family: 'Cinzel', serif; }
        .dm   { font-family: 'DM Sans', sans-serif; }

        /* Gradient text */
        .grad-text {
          background: linear-gradient(135deg, #A855F7 0%, #60A5FA 50%, #FBBF24 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; display: inline-block;
        }
        .grad-text-gold {
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; display: inline-block;
        }

        /* Halftone dot grid */
        .halftone {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Manga panel border */
        .manga-panel {
          border: 2px solid rgba(255,255,255,0.14);
          box-shadow: 5px 5px 0 rgba(0,0,0,0.55);
        }

        /* Stamp badges */
        .stamp { padding: 4px 11px; font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; }
        .stamp-new { background: #DC2626; color: #fff; box-shadow: 2px 2px 0 rgba(0,0,0,0.4); }
        .stamp-outline { border: 1px solid rgba(255,255,255,0.22); color: rgba(255,255,255,0.5); }

        /* Manga-style offset-shadow buttons */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 32px; border-radius: 2px;
          background: #fff; color: #000;
          font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 0.14em;
          text-transform: uppercase; cursor: pointer;
          box-shadow: 4px 4px 0 rgba(139,92,246,0.7);
          transition: transform 0.14s, box-shadow 0.14s;
        }
        .btn-primary:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 rgba(139,92,246,0.7); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 12px 26px; border-radius: 2px;
          border: 2px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.75);
          font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 0.14em;
          text-transform: uppercase; cursor: pointer; background: transparent;
          box-shadow: 3px 3px 0 rgba(255,255,255,0.07);
          transition: transform 0.14s, box-shadow 0.14s, border-color 0.14s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.65); transform: translate(-2px,-2px); box-shadow: 5px 5px 0 rgba(255,255,255,0.12); color: #fff; }

        /* Divider */
        .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.35) 30%, rgba(37,99,235,0.35) 70%, transparent); }

        /* Scrollable row — hide scrollbar */
        .scroll-row { overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-row::-webkit-scrollbar { display: none; }

        /* Hero progress bar */
        @keyframes hero-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* Grain texture */
        .grain::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
          mix-blend-mode: overlay; border-radius: inherit;
        }

        /* Marquee */
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* The Collection — responsive grid */
        .collection-grid {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .collection-grid::-webkit-scrollbar { display: none; }
        .collection-card {
          flex-shrink: 0;
          width: min(260px, 74vw);
        }
        @media (min-width: 640px) {
          .collection-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
            overflow-x: visible;
          }
          .collection-card { width: auto; flex-shrink: unset; }
        }
        @media (min-width: 1024px) {
          .collection-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }
      `}</style>

      {/* ── Fixed halftone background ── */}
      <div className="pointer-events-none fixed inset-0 halftone" style={{ zIndex: 0 }} />
      {/* Ambient purple glow top */}
      <div className="pointer-events-none fixed inset-0" style={{
        zIndex: 0,
        background: "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(124,58,237,0.09) 0%, transparent 65%)"
      }} />

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, width: "100%", zIndex: 50,
        background: scrolled ? "rgba(3,1,12,0.93)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        padding: scrolled ? "12px 0" : "20px 0",
        transition: "all 0.4s ease",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 60 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 2,
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 16, color: "#fff",
              boxShadow: "3px 3px 0 rgba(124,58,237,0.45)"
            }}>J</div>
            <span className="cin" style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.16em", color: "#fff", textTransform: "uppercase" }}>Jody-Verse</span>
          </Link>

          <div className="hidden md:flex" style={{ gap: "2.2rem", alignItems: "center" }}>
            {[["Manga", "/read"], ["Novels", "/novel"], ["Database", "/wiki"]].map(([label, href]) => (
              <Link key={label} href={href} className="bb" style={{
                fontSize: 13, letterSpacing: "0.18em", color: "rgba(255,255,255,0.42)",
                transition: "color 0.2s"
              }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = "rgba(255,255,255,0.42)")}
              >{label}</Link>
            ))}
          </div>

          <div className="hidden md:block" style={{ zIndex: 60 }}><UserBadge /></div>

          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", zIndex: 60, padding: 8 }}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(3,1,12,0.98)", backdropFilter: "blur(30px)",
              paddingTop: 96, paddingLeft: 24, paddingRight: 24, display: "flex", flexDirection: "column",
            }}>
            <p className="dm" style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 14 }}>Navigation</p>
            {[["Manga", "/read"], ["Novels", "/novel"], ["Wiki Database", "/wiki"], ["Account", "/account"]].map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setIsMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="bb" style={{ fontSize: 30, letterSpacing: "0.06em", color: "#fff" }}>{label}</span>
                <ChevronRight style={{ color: "var(--violet)" }} size={18} />
              </Link>
            ))}
            <div style={{ marginTop: 28 }}><UserBadge /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          HERO — Rotator
      ══════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}
      >
        {/* Parallax background */}
        <motion.div style={{ y: heroBgY, position: "absolute", inset: 0, zIndex: 0 }}>

          {/* Series-matched ambient gradient — shifts per series */}
          <AnimatePresence mode="wait">
            <motion.div key={`grad-${activeHero}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              style={{ position: "absolute", inset: 0, background: s.grad, opacity: 0.18 }}
            />
          </AnimatePresence>

          {/* Mobile: full bleed cover at 30% */}
          <AnimatePresence mode="wait">
            <motion.div key={`mob-cover-${activeHero}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="lg:hidden"
              style={{
                position: "absolute", inset: 0,
                backgroundImage: s.cover ? `url('${s.cover}')` : s.grad,
                backgroundSize: "cover", backgroundPosition: "center top",
                opacity: s.cover ? 0.28 : 0.15,
              }}
            />
          </AnimatePresence>

          {/* Desktop: speed lines behind cover panel */}
          <div className="hidden lg:block" style={{ position: "absolute", right: 0, top: 0, width: "55%", height: "100%", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 700 900" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.045 }}>
              {Array.from({ length: 72 }, (_, i) => {
                const rad = (i / 72) * 2 * Math.PI;
                return <line key={i} x1="350" y1="450" x2={350 + Math.cos(rad) * 1400} y2={450 + Math.sin(rad) * 1400} stroke="white" strokeWidth="1.2" />;
              })}
            </svg>
          </div>

          {/* Desktop: cover art in manga panel */}
          <AnimatePresence mode="wait">
            <motion.div key={`panel-${activeHero}`}
              initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.85, ease: "easeInOut" }}
              className="hidden lg:block manga-panel grain"
              style={{ position: "absolute", right: "4%", top: "7%", bottom: "7%", width: "42%", overflow: "hidden" }}
            >
              {s.cover ? (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url('${s.cover}')`,
                  backgroundSize: "cover", backgroundPosition: "center top",
                  opacity: 0.88,
                }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: s.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={90} style={{ opacity: 0.18, color: "#fff" }} />
                </div>
              )}
              {/* Panel overlays */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to left, transparent 30%, rgba(3,1,12,0.96) 100%)` }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(3,1,12,0.92) 100%)" }} />
              {/* Series color glow at edges */}
              <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 60px rgba(${s.accentRgb},0.18)` }} />
              {/* Panel corner label */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(3,1,12,0.82)", border: `1px solid rgba(${s.accentRgb},0.35)`,
                padding: "3px 10px", fontFamily: "'Bebas Neue'", fontSize: 9, letterSpacing: "0.28em",
                color: s.color,
              }}>PANEL {String(activeHero + 1).padStart(2, "0")}</div>
            </motion.div>
          </AnimatePresence>

          {/* Ink gradient from left */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(3,1,12,1) 0%, rgba(3,1,12,0.9) 38%, rgba(3,1,12,0.15) 62%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(3,1,12,1) 0%, transparent 50%)" }} />
        </motion.div>

        {/* Screentone dots on left */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "52%", zIndex: 1, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, rgba(${s.accentRgb},0.2) 1.5px, transparent 1.5px)`,
          backgroundSize: "16px 16px",
          maskImage: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 70%)",
          transition: "background-image 0.8s",
        }} />

        {/* Panel grid lines */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "7%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.03)" }} />
          <div style={{ position: "absolute", bottom: "12%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.03)" }} />
          <div className="hidden lg:block" style={{ position: "absolute", top: 0, bottom: 0, left: "57%", width: 1, background: "rgba(255,255,255,0.03)" }} />
        </div>

        {/* Spine text */}
        <div className="hidden lg:block" style={{
          position: "absolute", left: "1.6%", top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontFamily: "'Bebas Neue'", fontSize: 8, letterSpacing: "0.48em",
          color: "rgba(255,255,255,0.1)", whiteSpace: "nowrap", zIndex: 5,
        }}>Jody-Verse · Vol. I · Chapter Archives</div>

        {/* ── Hero content ── */}
        <motion.div style={{ y: heroContentY, opacity: heroOpacity, position: "relative", zIndex: 10, width: "100%" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem", paddingTop: 130, paddingBottom: 160, width: "100%" }}>

            <AnimatePresence mode="wait">
              <motion.div key={`content-${activeHero}`}
                variants={STAGGER.container} initial="hidden" animate="show"
                exit={{ opacity: 0, y: -14, transition: { duration: 0.35 } }}
                style={{ maxWidth: 580 }}
              >
                {/* Stamp badges */}
                <motion.div variants={STAGGER.item} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                  <span className="stamp stamp-new"><Flame size={9} style={{ display: "inline", marginRight: 4 }} />New Chapter</span>
                  <span className="stamp stamp-outline">{s.label}</span>
                  {s.genre.slice(0, 1).map(g => (
                    <span key={g} className="stamp stamp-outline">{g}</span>
                  ))}
                </motion.div>

                {/* Tagline */}
                <motion.div variants={STAGGER.item} className="dm" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.38em", textTransform: "uppercase", color: s.color, marginBottom: 10, opacity: 0.85 }}>
                  {s.tagline}
                </motion.div>

                {/* Main title */}
                <motion.div variants={STAGGER.item}>
                  <h1 className="bb" style={{
                    fontSize: "clamp(60px, 12.5vw, 180px)", lineHeight: 0.86, letterSpacing: "0.025em",
                    color: "#fff", textShadow: "4px 4px 0 rgba(0,0,0,0.85)", marginBottom: 0,
                  }}>
                    {s.title.split(" ").length > 2
                      ? <>{s.title.split(" ").slice(0, 2).join(" ")}<br /><span style={{ WebkitTextStroke: `2px rgba(255,255,255,0.8)`, color: "transparent", display: "inline-block", filter: `drop-shadow(0 0 24px rgba(${s.accentRgb},0.5))` }}>{s.title.split(" ").slice(2).join(" ")}</span></>
                      : <>{s.title.split(" ")[0]}<br /><span style={{ WebkitTextStroke: `2px rgba(255,255,255,0.8)`, color: "transparent", display: "inline-block", filter: `drop-shadow(0 0 24px rgba(${s.accentRgb},0.5))` }}>{s.title.split(" ")[1]}</span></>
                    }
                  </h1>
                  {/* Ink bar — series color */}
                  <div style={{ width: 130, height: 3, background: s.color, marginTop: 14, marginBottom: 26, boxShadow: `0 0 14px rgba(${s.accentRgb},0.6)` }} />
                </motion.div>

                {/* Description */}
                <motion.p variants={STAGGER.item} className="dm" style={{
                  fontSize: "clamp(13px, 1.35vw, 16px)", fontWeight: 300,
                  color: "rgba(255,255,255,0.52)", maxWidth: 440, lineHeight: 1.82, marginBottom: 38,
                }}>{s.description}</motion.p>

                {/* CTAs */}
                <motion.div variants={STAGGER.item} style={{ display: "flex", flexWrap: "wrap", gap: 11 }}>
                  <Link href={s.href}><div className="btn-primary"><Play size={13} fill="black" color="black" />Read Now</div></Link>
                  <Link href={s.chapterHref}><div className="btn-outline">All Chapters <ArrowRight size={13} /></div></Link>
                </motion.div>

                {/* Stats strip */}
                <motion.div variants={STAGGER.item} style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap" }}>
                  {[["4", "Series"], ["60+", "Chapters"], ["7", "Characters"]].map(([n, l]) => (
                    <div key={l}>
                      <div className="bb" style={{ fontSize: 34, lineHeight: 1, color: "#fff", letterSpacing: "0.04em" }}>{n}</div>
                      <div className="dm" style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginTop: 3 }}>{l}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Series selector tabs (bottom of hero) ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
          background: "linear-gradient(to top, rgba(3,1,12,0.98) 0%, rgba(3,1,12,0.7) 80%, transparent 100%)",
          padding: "24px 1.5rem 28px",
        }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Prev / Next arrows on mobile */}
            <div className="flex md:hidden" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => setActiveHero(p => (p - 1 + SERIES.length) % SERIES.length)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "8px 16px", cursor: "pointer", borderRadius: 2 }}>
                <ChevronLeft size={16} />
              </button>
              <div className="dm" style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>{activeHero + 1} / {SERIES.length}</div>
              <button onClick={() => setActiveHero(p => (p + 1) % SERIES.length)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "8px 16px", cursor: "pointer", borderRadius: 2 }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Tab row */}
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              {SERIES.map((ser, i) => (
                <button key={ser.index} onClick={() => setActiveHero(i)}
                  style={{
                    flex: 1, border: "none", cursor: "pointer", padding: 0,
                    background: "transparent", textAlign: "left", outline: "none",
                  }}>
                  <div style={{
                    padding: "11px 14px", borderRadius: 2,
                    background: activeHero === i ? `rgba(${ser.accentRgb},0.14)` : "rgba(255,255,255,0.04)",
                    border: activeHero === i ? `1px solid rgba(${ser.accentRgb},0.4)` : "1px solid rgba(255,255,255,0.07)",
                    transition: "all 0.3s",
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Mini cover thumbnail */}
                    {ser.cover && (
                      <div style={{
                        position: "absolute", inset: 0,
                        backgroundImage: `url('${ser.cover}')`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        opacity: activeHero === i ? 0.18 : 0.07,
                        transition: "opacity 0.3s",
                      }} />
                    )}
                    {/* Progress bar on active tab */}
                    {activeHero === i && !heroPaused && (
                      <div key={`prog-${activeHero}`} style={{
                        position: "absolute", bottom: 0, left: 0, height: 2,
                        width: "100%", transformOrigin: "left",
                        background: ser.color,
                        animation: "hero-fill 6s linear forwards",
                      }} />
                    )}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div className="bb" style={{ fontSize: 12, letterSpacing: "0.15em", color: activeHero === i ? "#fff" : "rgba(255,255,255,0.4)", lineHeight: 1.1, transition: "color 0.3s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ser.title}
                      </div>
                      <div className="dm hidden md:block" style={{ fontSize: 9, letterSpacing: "0.15em", color: activeHero === i ? ser.color : "rgba(255,255,255,0.25)", marginTop: 3, transition: "color 0.3s" }}>
                        {ser.label.split("·")[0].trim()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          style={{ position: "absolute", bottom: 120, right: "1.8%", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, zIndex: 10 }}
          className="hidden lg:flex">
          <span className="dm" style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", writingMode: "vertical-rl" }}>scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.9 }}
            style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)" }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          RESUME READING
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {latestRead && (
          <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
            style={{ maxWidth: 1400, margin: "-32px auto 0", padding: "0 1.5rem", position: "relative", zIndex: 20 }}>
            <Link href={`/read/${latestRead.chapter}?manga=${latestRead.mangaId}&page=${latestRead.page || 0}`}>
              <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
                padding: "16px 20px", borderRadius: 2, cursor: "pointer",
                border: "1px solid rgba(139,92,246,0.32)", background: "rgba(139,92,246,0.08)",
                backdropFilter: "blur(20px)", boxShadow: "4px 4px 0 rgba(139,92,246,0.18)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 200, background: "linear-gradient(to left, rgba(139,92,246,0.12), transparent)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                    background: "rgba(139,92,246,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.3)"
                  }}>
                    <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                  </div>
                  <div>
                    <span className="bb" style={{ fontSize: 9, letterSpacing: "0.28em", color: "var(--violet)", display: "block", marginBottom: 3 }}>Continue Reading</span>
                    <span className="bb" style={{ fontSize: 18, letterSpacing: "0.05em", color: "#fff" }}>{latestRead.title}
                      <span className="dm" style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.32)", letterSpacing: 0, marginLeft: 8 }}>Ch. {latestRead.chapter}</span>
                    </span>
                  </div>
                </div>
                <div className="bb" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)" }}>
                  Jump In <ChevronRight size={11} />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          THE COLLECTION
      ══════════════════════════════════════ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "80px 1.5rem 60px" }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
          <div>
            <p className="bb" style={{ fontSize: 10, letterSpacing: "0.4em", color: "var(--violet)", opacity: 0.8, marginBottom: 8 }}>All Series</p>
            <h2 className="bb grad-text" style={{ fontSize: "clamp(38px,5.5vw,72px)", letterSpacing: "0.04em", lineHeight: 0.9 }}>The Collection</h2>
          </div>
          <Link href="/read" className="dm" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
            Browse All <ChevronRight size={13} />
          </Link>
        </div>

        {/* Series cards — scrollable on mobile, 2-col on tablet, 4-col on desktop */}
        <div className="collection-grid">
          {SERIES.map((ser, i) => (
            <motion.div key={ser.index} className="collection-card"
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <Link href={ser.href} style={{ display: "block" }}>
                <div className="grain" style={{
                  position: "relative", borderRadius: 2, overflow: "hidden", cursor: "pointer",
                  border: `2px solid rgba(${ser.accentRgb},0.22)`,
                  boxShadow: `5px 5px 0 rgba(0,0,0,0.5), 0 0 40px rgba(${ser.accentRgb},0.06)`,
                  background: "rgba(255,255,255,0.02)",
                }}>
                  {/* Cover art — top portion */}
                  <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
                    {ser.cover ? (
                      <>
                        <div style={{
                          position: "absolute", inset: 0,
                          backgroundImage: `url('${ser.cover}')`,
                          backgroundSize: "cover", backgroundPosition: "center top",
                          opacity: 0.92, transition: "transform 0.5s ease",
                        }} />
                        {/* Halftone on cover */}
                        <div style={{
                          position: "absolute", inset: 0,
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                          backgroundSize: "10px 10px",
                        }} />
                      </>
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: ser.grad, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                        <BookOpen size={64} style={{ color: "rgba(255,255,255,0.2)" }} />
                        <span className="bb" style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)" }}>Light Novel</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(3,1,12,0.98) 100%)" }} />
                    {/* Type + status badges */}
                    <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <span style={{
                        background: ser.color, padding: "4px 10px", borderRadius: 0,
                        fontFamily: "'Bebas Neue'", fontSize: 10, letterSpacing: "0.18em",
                        color: "#000", boxShadow: "2px 2px 0 rgba(0,0,0,0.5)"
                      }}>{ser.label.split("·")[0].trim()}</span>
                      <span style={{
                        padding: "4px 10px", border: "1px solid rgba(255,255,255,0.2)",
                        fontFamily: "'Bebas Neue'", fontSize: 10, letterSpacing: "0.18em",
                        color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.45)"
                      }}>
                        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22C55E", marginRight: 5, verticalAlign: "middle", boxShadow: "0 0 6px #22C55E" }} />
                        Ongoing
                      </span>
                    </div>
                    {/* Chapter count corner */}
                    <div style={{ position: "absolute", top: 14, right: 14 }}>
                      <span className="bb" style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)" }}>{ser.chapters} CH</span>
                    </div>
                  </div>

                  {/* Info section */}
                  <div style={{ padding: "20px 20px 22px" }}>
                    {/* Genre tags */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {ser.genre.slice(0, 2).map(g => (
                        <span key={g} className="dm" style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: "0.18em",
                          textTransform: "uppercase", color: ser.color, opacity: 0.8,
                          padding: "2px 8px", border: `1px solid rgba(${ser.accentRgb},0.28)`,
                        }}>{g}</span>
                      ))}
                    </div>
                    <h3 className="bb" style={{ fontSize: 28, letterSpacing: "0.04em", color: "#fff", marginBottom: 8, textShadow: "2px 2px 0 rgba(0,0,0,0.7)", lineHeight: 0.95 }}>{ser.title}</h3>
                    <p className="dm" style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.48)", lineHeight: 1.65, marginBottom: 18, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {ser.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="bb" style={{ fontSize: 13, letterSpacing: "0.15em", color: ser.color, display: "flex", alignItems: "center", gap: 5 }}>
                        Read {ser.label.split("·")[0].trim()} <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem" }}><div className="divider" /></div>

      {/* ══════════════════════════════════════
          LATEST DROPS
      ══════════════════════════════════════ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 1.5rem 50px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <p className="bb" style={{ fontSize: 10, letterSpacing: "0.4em", color: "var(--cyan)", opacity: 0.8, marginBottom: 8 }}>Recently Added</p>
            <h2 className="bb" style={{ fontSize: "clamp(32px,4.5vw,62px)", letterSpacing: "0.04em", lineHeight: 0.9, color: "#fff" }}>Latest Drops</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/read" className="bb" style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", gap: 5 }}>
              Manga <ChevronRight size={12} />
            </Link>
            <Link href="/novel" className="bb" style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", gap: 5 }}>
              Novels <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {latestChapters.length > 0 ? (
          <div className="scroll-row" style={{ display: "flex", gap: 14 }}>
            {latestChapters.map((ch) => {
              const ser = SERIES.find(s => s.mangaId === ch.manga_id) || SERIES[2];
              const chapterHref = ch.type === "manga"
                ? `/read/${ch.id}?manga=${ch.manga_id}`
                : `/novel/${ch.id}`;
              return (
                <motion.div key={`${ch.type}-${ch.id}`}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  whileHover={{ y: -4, transition: { duration: 0.16 } }}
                  style={{ flexShrink: 0, width: 170 }}
                >
                  <Link href={chapterHref}>
                    <div style={{ borderRadius: 2, overflow: "hidden", border: `1px solid rgba(${ser.accentRgb},0.2)`, background: "rgba(255,255,255,0.025)", cursor: "pointer" }}>
                      {/* Thumbnail */}
                      <div style={{ height: 110, position: "relative", overflow: "hidden" }}>
                        {ser.cover ? (
                          <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${ser.cover}')`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.8 }} />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, background: ser.grad, opacity: 0.7 }} />
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(3,1,12,0.9) 100%)" }} />
                        {/* New badge */}
                        {isNew(ch.created_at) && (
                          <span className="stamp stamp-new" style={{ position: "absolute", top: 8, left: 8, fontSize: 8, padding: "2px 7px" }}>New</span>
                        )}
                        {/* Type badge */}
                        <span style={{
                          position: "absolute", top: 8, right: 8,
                          fontFamily: "'Bebas Neue'", fontSize: 8, letterSpacing: "0.15em",
                          color: ser.color, padding: "2px 6px", border: `1px solid rgba(${ser.accentRgb},0.4)`,
                          background: "rgba(3,1,12,0.7)"
                        }}>{ch.type === "manga" ? "MANGA" : "NOVEL"}</span>
                        {/* Chapter number on cover */}
                        <div className="bb" style={{ position: "absolute", bottom: 8, left: 8, fontSize: 20, letterSpacing: "0.04em", color: "#fff", textShadow: "2px 2px 0 rgba(0,0,0,0.8)", lineHeight: 1 }}>
                          Ch.{ch.chapter_number}
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: "10px 11px 12px" }}>
                        <p className="dm" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: ser.color, marginBottom: 4 }}>
                          {seriesNameById(ch.manga_id)}
                        </p>
                        <p className="dm line-clamp-2" style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>
                          {ch.title || `Chapter ${ch.chapter_number}`}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                          <Clock size={9} style={{ color: "rgba(255,255,255,0.22)" }} />
                          <span className="dm" style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>
                            {new Date(ch.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div style={{ display: "flex", gap: 14 }}>
            {SERIES.map((ser) => (
              <div key={ser.index} style={{ flex: 1, borderRadius: 2, border: `1px solid rgba(${ser.accentRgb},0.18)`, background: "rgba(255,255,255,0.02)", padding: "24px 20px", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="bb" style={{ fontSize: 14, letterSpacing: "0.15em", color: ser.color, marginBottom: 8 }}>{ser.title}</div>
                <div className="dm" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Chapters loading…</div>
                <Link href={ser.href} className="bb" style={{ fontSize: 11, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                  Browse <ChevronRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem" }}><div className="divider" /></div>

      {/* ══════════════════════════════════════
          THE ROSTER — Character showcase
      ══════════════════════════════════════ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 1.5rem 50px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <p className="bb" style={{ fontSize: 10, letterSpacing: "0.4em", color: "var(--gold-lt)", opacity: 0.85, marginBottom: 8 }}>Spectral Rift Universe</p>
            <h2 className="bb" style={{ fontSize: "clamp(32px,4.5vw,62px)", letterSpacing: "0.04em", lineHeight: 0.9, color: "#fff" }}>The Roster</h2>
          </div>
          <Link href="/wiki" className="bb" style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", gap: 5 }}>
            Full Wiki <ChevronRight size={12} />
          </Link>
        </div>

        <div className="scroll-row" style={{ display: "flex", gap: 14 }}>
          {characters.map((char, i) => (
            <motion.div key={char.id}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -5, transition: { duration: 0.16 } }}
              style={{ flexShrink: 0, width: 160 }}
            >
              <Link href="/wiki">
                <div style={{
                  borderRadius: 2, overflow: "hidden", cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.02)",
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.35)",
                }}>
                  {/* Portrait */}
                  <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url('${char.image}')`,
                      backgroundSize: "cover", backgroundPosition: "center top",
                      opacity: 0.9,
                    }} />
                    {/* Screentone overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
                      backgroundSize: "8px 8px",
                    }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(3,1,12,0.97) 100%)" }} />
                    {/* Character name on portrait */}
                    <div style={{ position: "absolute", bottom: 10, left: 11, right: 11 }}>
                      <div className="bb" style={{ fontSize: 20, letterSpacing: "0.04em", color: "#fff", lineHeight: 0.95, textShadow: "2px 2px 0 rgba(0,0,0,0.85)" }}>{char.name}</div>
                      <div className="dm" style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginTop: 2, letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{char.role.split("/")[0].trim()}</div>
                    </div>
                  </div>
                  {/* Stats mini-bar */}
                  <div style={{ padding: "10px 11px 12px" }}>
                    {[
                      { label: "STR", val: char.stats.strength, color: "#EF4444" },
                      { label: "INT", val: char.stats.intelligence, color: "#8B5CF6" },
                      { label: "SPD", val: char.stats.speed, color: "#0EA5E9" },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span className="bb" style={{ fontSize: 8, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", width: 22 }}>{label}</span>
                        <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 0, overflow: "hidden" }}>
                          <div style={{ width: `${val * 10}%`, height: "100%", background: color, transition: "width 0.6s ease", boxShadow: `0 0 6px ${color}` }} />
                        </div>
                        <span className="bb" style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", width: 12, textAlign: "right" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem" }}><div className="divider" /></div>

      {/* ══════════════════════════════════════
          JOIN THE FACTION — CTA
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {!user && (
          <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 1.5rem" }}
          >
            <div style={{
              position: "relative", borderRadius: 2, overflow: "hidden", padding: "56px 48px",
              background: "linear-gradient(135deg, rgba(76,29,149,0.4) 0%, rgba(29,78,216,0.25) 50%, rgba(14,165,233,0.15) 100%)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "6px 6px 0 rgba(139,92,246,0.18)",
            }}>
              {/* Background halftone */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.12) 1.5px, transparent 1.5px)",
                backgroundSize: "18px 18px", pointerEvents: "none"
              }} />
              <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "50%", height: "160%", background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                <div style={{ maxWidth: 560 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 2, background: "rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 rgba(0,0,0,0.3)" }}>
                      <Sparkles size={16} style={{ color: "var(--violet)" }} />
                    </div>
                    <span className="stamp stamp-outline" style={{ color: "var(--violet)", borderColor: "rgba(139,92,246,0.4)" }}>Exclusive Access</span>
                  </div>
                  <h2 className="bb" style={{ fontSize: "clamp(32px,4vw,58px)", letterSpacing: "0.04em", color: "#fff", lineHeight: 0.9, marginBottom: 16, textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}>
                    Join the Reading<br /><span className="grad-text">Faction</span>
                  </h2>
                  <p className="dm" style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.48)", lineHeight: 1.75, maxWidth: 420 }}>
                    Unlock your rank, track reading progress, earn XP, join a squad, and get notified the moment new chapters drop.
                  </p>
                  {/* Feature list */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", marginTop: 22 }}>
                    {["XP & Rank System", "Reading History", "Chapter Alerts", "Squad Faction", "Bookmarks", "ID Card"].map(f => (
                      <span key={f} className="dm" style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--violet)", display: "inline-block" }} />{f}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 220 }}>
                  <Link href="/login"><div className="btn-primary" style={{ justifyContent: "center", width: "100%" }}>Create Free Account <ArrowRight size={14} /></div></Link>
                  <Link href="/login"><div className="btn-outline" style={{ justifyContent: "center", width: "100%" }}>Sign In</div></Link>
                  <p className="dm" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>Free · No credit card required</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          MARQUEE TICKER
      ══════════════════════════════════════ */}
      <div style={{ overflow: "hidden", padding: "30px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", marginTop: user ? 60 : 0 }}>
        <div style={{ display: "flex", gap: 52, whiteSpace: "nowrap", animation: "marquee 28s linear infinite" }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 52, alignItems: "center" }}>
              {["Spectral Rift", "Urithi", "Katikati", "Tales of the 47", "Supernatural", "Dark Fantasy", "Crafted in Kenya", "New Chapters Out"].map((t) => (
                <span key={t} className="bb" style={{ fontSize: 13, letterSpacing: "0.22em", color: "rgba(255,255,255,0.1)" }}>
                  {t} <span style={{ color: "rgba(139,92,246,0.35)", marginLeft: 16 }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ padding: "56px 1.5rem 36px", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 40, marginBottom: 44 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 2,
                  background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 16, color: "#fff",
                  boxShadow: "3px 3px 0 rgba(124,58,237,0.4)"
                }}>J</div>
                <span className="cin" style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff" }}>Jody-Verse</span>
              </div>
              <p className="dm" style={{ fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,0.28)", maxWidth: 240, lineHeight: 1.72 }}>A world built in Kenya.<br />Stories that transcend borders.</p>
              {/* Series quick links */}
              <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                {SERIES.map(ser => (
                  <Link key={ser.index} href={ser.href} style={{ padding: "4px 10px", border: `1px solid rgba(${ser.accentRgb},0.28)`, fontFamily: "'Bebas Neue'", fontSize: 9, letterSpacing: "0.18em", color: ser.color }}>
                    {ser.title.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
              <div>
                <p className="bb" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.18)", marginBottom: 14 }}>Library</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[["Manga", "/read"], ["Novels", "/novel"], ["Wiki", "/wiki"]].map(([l, h]) => (
                    <Link key={l} href={h} className="dm" style={{ fontSize: 12, color: "rgba(255,255,255,0.36)" }}>{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="bb" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.18)", marginBottom: 14 }}>Account</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[["Command Center", "/account"], ["License", "/license"], ["Admin", "/admin"]].map(([l, h]) => (
                    <Link key={l} href={h} className="dm" style={{ fontSize: 12, color: "rgba(255,255,255,0.36)" }}>{l}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: 24 }} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="dm" style={{ fontSize: 10, color: "rgba(255,255,255,0.16)", letterSpacing: "0.08em" }}>
              &copy; {new Date().getFullYear()} Jody-Verse. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["#7C3AED","#2563EB","#0EA5E9","#F59E0B"].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
                ))}
              </div>
              <p className="dm" style={{ fontSize: 10, color: "rgba(255,255,255,0.16)" }}>Crafted in Kenya 🇰🇪</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
