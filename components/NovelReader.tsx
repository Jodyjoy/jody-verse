"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Settings, Type, Moon, Sun, BookOpen,
  AlignJustify, ChevronLeft, ChevronRight, X,
  Minus, Plus, ScrollText, PanelLeft
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import CommentSection from "./CommentSection";
import SocialStats from "./SocialStats";
import BookmarkButton from "./BookmarkButton";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// SMART CONTENT FORMATTER
// Fixes: all-caps text, missing paragraph breaks,
// normalises quotes, removes double spaces,
// auto-detects dialogue and indents it.
// ─────────────────────────────────────────────
function formatChapterContent(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Decode common HTML entities that might come from Supabase
  text = text.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"');

  // 2. Normalise line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 3. Fix ALL-CAPS paragraphs: if a paragraph is >70% uppercase letters, convert to title-case sentence
  const paragraphs = text.split(/\n\n+/);
  const fixed = paragraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return "";

    const letters = trimmed.replace(/[^a-zA-Z]/g, "");
    const upper = trimmed.replace(/[^A-Z]/g, "");
    const capRatio = letters.length > 0 ? upper.length / letters.length : 0;

    if (capRatio > 0.7 && letters.length > 10) {
      // Convert to sentence case (first letter of each sentence capitalised)
      return trimmed.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase());
    }
    return trimmed;
  });

  text = fixed.filter(Boolean).join("\n\n");

  // 4. Smart paragraph detection: if there are very few \n\n but lots of \n,
  //    treat single newlines as paragraph breaks (common in copy-paste scenarios)
  const doubleParagraphs = (text.match(/\n\n/g) || []).length;
  const singleNewlines = (text.match(/\n/g) || []).length;
  if (doubleParagraphs < 3 && singleNewlines > 5) {
    text = text.replace(/\n/g, "\n\n");
  }

  // 5. Normalise multiple blank lines to exactly two
  text = text.replace(/\n{3,}/g, "\n\n");

  // 6. Straighten curly quotes to consistent typographic quotes
  text = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  // 7. Fix double spaces
  text = text.replace(/ {2,}/g, " ");

  return text.trim();
}

// Split formatted text into paragraph array for rendering
function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Theme = "dark" | "light" | "sepia";
type Font  = "serif" | "sans" | "mono";

interface ThemeConfig {
  bg: string;
  text: string;
  subtext: string;
  border: string;
  headerBg: string;
  settingsBg: string;
  accent: string;
  progressBar: string;
}

const THEMES: Record<Theme, ThemeConfig> = {
  dark: {
    bg:          "#06040f",
    text:        "#D4CCEE",
    subtext:     "rgba(179,193,240,0.45)",
    border:      "rgba(139,159,232,0.1)",
    headerBg:    "rgba(6,4,15,0.88)",
    settingsBg:  "rgba(12,9,28,0.96)",
    accent:      "#8B9FE8",
    progressBar: "linear-gradient(90deg, #5546C8, #8B9FE8)",
  },
  light: {
    bg:          "#FAFAF7",
    text:        "#1A1814",
    subtext:     "rgba(26,24,20,0.45)",
    border:      "rgba(26,24,20,0.1)",
    headerBg:    "rgba(250,250,247,0.88)",
    settingsBg:  "rgba(245,244,238,0.97)",
    accent:      "#5546C8",
    progressBar: "linear-gradient(90deg, #3D2FA0, #5546C8)",
  },
  sepia: {
    bg:          "#F2E8D9",
    text:        "#3E2A14",
    subtext:     "rgba(62,42,20,0.5)",
    border:      "rgba(62,42,20,0.12)",
    headerBg:    "rgba(242,232,217,0.9)",
    settingsBg:  "rgba(236,224,205,0.97)",
    accent:      "#9A6B2E",
    progressBar: "linear-gradient(90deg, #C9973A, #F0C060)",
  },
};

const FONTS: Record<Font, string> = {
  serif: "'Georgia', 'Times New Roman', serif",
  sans:  "'DM Sans', 'Helvetica Neue', sans-serif",
  mono:  "'Courier New', 'Courier', monospace",
};

const FONT_LABELS: Record<Font, string> = {
  serif: "Serif",
  sans:  "Sans",
  mono:  "Mono",
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function NovelReader() {
  const { id } = useParams();
  const router  = useRouter();

  // — Reading settings —
  const [textSize,    setTextSize]    = useState(18);
  const [lineHeight,  setLineHeight]  = useState(1.9);
  const [theme,       setTheme]       = useState<Theme>("dark");
  const [font,        setFont]        = useState<Font>("serif");
  const [maxWidth,    setMaxWidth]    = useState(680); // px

  // — UI state —
  const [showSettings, setShowSettings] = useState(false);
  const [showHeader,   setShowHeader]   = useState(true);
  const [showTOC,      setShowTOC]      = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // — Data —
  const [chapterTitle, setChapterTitle] = useState("Loading...");
  const [paragraphs,   setParagraphs]   = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [prevChapter,  setPrevChapter]  = useState<number | null>(null);
  const [nextChapter,  setNextChapter]  = useState<number | null>(null);
  const [allChapters,  setAllChapters]  = useState<{ chapter_number: number; title: string }[]>([]);

  const lastScrollY   = useRef(0);
  const contentRef    = useRef<HTMLDivElement>(null);
  const uniqueSlug    = `novel-${id}`;
  const currentNum    = Number(id);
  const tc            = THEMES[theme];

  // ── DATA FETCH ──────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      // Fetch current chapter
      const { data, error } = await supabase
        .from("novel_chapters")
        .select("*")
        .eq("chapter_number", id)
        .single();

      if (error || !data) {
        setChapterTitle("Archive File Disrupted");
        setParagraphs(["This chapter has not been written or broadcast yet."]);
      } else {
        setChapterTitle(data.title);
        const formatted = formatChapterContent(data.content);
        setParagraphs(splitIntoParagraphs(formatted));

        const history = JSON.parse(localStorage.getItem("user_reading_history") || "{}");
        history["novel"] = { chapter: id, timestamp: Date.now(), title: `Tales of the 47: Ch ${id}` };
        localStorage.setItem("user_reading_history", JSON.stringify(history));
      }

      // Fetch all chapters for TOC + prev/next
      const { data: chapters } = await supabase
        .from("novel_chapters")
        .select("chapter_number, title")
        .order("chapter_number", { ascending: true });

      if (chapters) {
        setAllChapters(chapters);
        const idx = chapters.findIndex(c => c.chapter_number === currentNum);
        setPrevChapter(idx > 0 ? chapters[idx - 1].chapter_number : null);
        setNextChapter(idx < chapters.length - 1 ? chapters[idx + 1].chapter_number : null);
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  // ── PERSIST SETTINGS ────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("novel_text_size");
    const t = localStorage.getItem("novel_theme") as Theme | null;
    const f = localStorage.getItem("novel_font") as Font | null;
    const lh = localStorage.getItem("novel_line_height");
    const mw = localStorage.getItem("novel_max_width");
    if (s)  setTextSize(parseInt(s));
    if (lh) setLineHeight(parseFloat(lh));
    if (mw) setMaxWidth(parseInt(mw));
    if (t && THEMES[t])   setTheme(t);
    if (f && FONTS[f])    setFont(f);
  }, []);

  const saveSetting = (key: string, val: string) => localStorage.setItem(key, val);

  // ── SCROLL → HEADER + PROGRESS ─────────────
  useEffect(() => {
    const handleScroll = () => {
      const cy = window.scrollY;
      setShowHeader(cy < lastScrollY.current || cy < 120);
      lastScrollY.current = cy;

      const el = contentRef.current;
      if (el) {
        const { top, height } = el.getBoundingClientRect();
        const visible = Math.min(1, Math.max(0, (-top) / (height - window.innerHeight)));
        setReadProgress(Math.round(visible * 100));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── HELPERS ─────────────────────────────────
  const changeSize = (d: number) => {
    const v = Math.max(14, Math.min(28, textSize + d));
    setTextSize(v); saveSetting("novel_text_size", String(v));
  };
  const changeLineHeight = (d: number) => {
    const v = Math.round(Math.max(1.4, Math.min(2.4, lineHeight + d)) * 10) / 10;
    setLineHeight(v); saveSetting("novel_line_height", String(v));
  };
  const changeMaxWidth = (v: number) => {
    setMaxWidth(v); saveSetting("novel_max_width", String(v));
  };
  const changeTheme = (t: Theme) => { setTheme(t); saveSetting("novel_theme", t); };
  const changeFont  = (f: Font)  => { setFont(f);  saveSetting("novel_font", f); };

  const navigateTo = (num: number) => router.push(`/novel/${num}`);

  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#06040f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=DM+Sans:wght@300;400;600&display=swap');`}</style>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(139,159,232,0.2)", borderTop: "2px solid #8B9FE8", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(139,159,232,0.5)" }}>
          Loading Chapter {id}…
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: tc.bg, color: tc.text, transition: "background 0.4s ease, color 0.4s ease", fontFamily: FONTS[font] }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        /* Progress bar */
        #read-progress-bar {
          position: fixed; top: 0; left: 0; height: 2px; z-index: 100;
          transition: width 0.2s ease;
        }

        /* Selection colour */
        ::selection { background: rgba(139,159,232,0.25); }

        /* Paragraph style */
        .novel-para {
          margin: 0;
          text-indent: 1.8em;
        }
        .novel-para:first-child { text-indent: 0; }

        /* Dialogue paragraph: no indent, slight left padding */
        .novel-dialogue {
          margin: 0;
          padding-left: 0.5em;
          border-left: 2px solid;
          text-indent: 0;
        }

        /* Chapter nav button */
        .nav-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700; font-size: 11px;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s ease;
          border: 1px solid; text-decoration: none;
        }

        /* Settings row */
        .setting-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.3em; text-transform: uppercase;
          margin-bottom: 10px; display: block;
          opacity: 0.5;
        }

        .pill-btn {
          flex: 1; padding: 9px 6px; border-radius: 10px;
          border: 1px solid transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          text-align: center;
        }

        /* TOC item */
        .toc-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px; border-radius: 12px;
          cursor: pointer; transition: background 0.2s ease;
          text-decoration: none;
        }
        .toc-item:hover { background: rgba(139,159,232,0.07); }
        .toc-item.active { background: rgba(139,159,232,0.12); }
      `}</style>

      {/* ── PROGRESS BAR ── */}
      <div
        id="read-progress-bar"
        style={{ width: `${readProgress}%`, background: tc.progressBar }}
      />

      {/* ── HEADER ── */}
      <motion.header
        animate={{ y: showHeader ? 0 : -72 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: 64,
          background: tc.headerBg, borderBottom: `1px solid ${tc.border}`,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          zIndex: 50, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px"
        }}
      >
        <button
          onClick={() => router.push("/novel")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: tc.text, padding: 8, borderRadius: "50%", display: "flex"
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Title — hidden on very small screens */}
        <div style={{ textAlign: "center", flex: 1, padding: "0 12px" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: tc.subtext, marginBottom: 2 }}>
            Tales of the 47 · Ch. {id}
          </p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: tc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, margin: "0 auto" }}>
            {chapterTitle}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <BookmarkButton slug={uniqueSlug} title={`Tales of the 47: Ch ${id}`} type="novel" />

          {/* TOC toggle */}
          <button
            onClick={() => { setShowTOC(!showTOC); setShowSettings(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: tc.text, padding: 8, borderRadius: "50%", display: "flex" }}
            title="Table of Contents"
          >
            <ScrollText size={20} />
          </button>

          {/* Settings toggle */}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowTOC(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: tc.text, padding: 8, borderRadius: "50%", display: "flex" }}
            title="Reading settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </motion.header>

      {/* ── SETTINGS PANEL ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: 72, right: 16,
              width: "min(300px, calc(100vw - 32px))",
              background: tc.settingsBg,
              border: `1px solid ${tc.border}`,
              borderRadius: 20, padding: 22,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              zIndex: 48, backdropFilter: "blur(24px)"
            }}
          >
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 13, color: tc.text }}>Reading Settings</span>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            {/* Font size */}
            <div style={{ marginBottom: 18 }}>
              <span className="setting-label" style={{ color: tc.text }}>Text Size — {textSize}px</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${tc.border}`, borderRadius: 12, padding: "6px 10px", border: `1px solid ${tc.border}` }}>
                <button onClick={() => changeSize(-2)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex", padding: 6 }}><Minus size={14} /></button>
                <div style={{ flex: 1, textAlign: "center", fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, color: tc.text }}>{textSize}px</div>
                <button onClick={() => changeSize(2)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex", padding: 6 }}><Plus size={14} /></button>
              </div>
            </div>

            {/* Line height */}
            <div style={{ marginBottom: 18 }}>
              <span className="setting-label" style={{ color: tc.text }}>Line Spacing — {lineHeight}x</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "6px 10px", border: `1px solid ${tc.border}` }}>
                <button onClick={() => changeLineHeight(-0.1)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex", padding: 6 }}><Minus size={14} /></button>
                <div style={{ flex: 1, textAlign: "center", fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, color: tc.text }}>{lineHeight}×</div>
                <button onClick={() => changeLineHeight(0.1)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex", padding: 6 }}><Plus size={14} /></button>
              </div>
            </div>

            {/* Reading width */}
            <div style={{ marginBottom: 18 }}>
              <span className="setting-label" style={{ color: tc.text }}>Page Width</span>
              <div style={{ display: "flex", gap: 6 }}>
                {([560, 680, 820] as const).map(w => (
                  <button key={w} className="pill-btn"
                    onClick={() => changeMaxWidth(w)}
                    style={{
                      background: maxWidth === w ? tc.accent : "transparent",
                      border: `1px solid ${maxWidth === w ? tc.accent : tc.border}`,
                      color: maxWidth === w ? "#fff" : tc.subtext
                    }}
                  >
                    {w === 560 ? "Narrow" : w === 680 ? "Normal" : "Wide"}
                  </button>
                ))}
              </div>
            </div>

            {/* Font face */}
            <div style={{ marginBottom: 18 }}>
              <span className="setting-label" style={{ color: tc.text }}>Typeface</span>
              <div style={{ display: "flex", gap: 6 }}>
                {(["serif", "sans", "mono"] as Font[]).map(f => (
                  <button key={f} className="pill-btn"
                    onClick={() => changeFont(f)}
                    style={{
                      background: font === f ? tc.accent : "transparent",
                      border: `1px solid ${font === f ? tc.accent : tc.border}`,
                      color: font === f ? "#fff" : tc.subtext,
                      fontFamily: FONTS[f]
                    }}
                  >
                    {FONT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <span className="setting-label" style={{ color: tc.text }}>Theme</span>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { key: "dark",  label: "Dark",  icon: <Moon size={14} /> },
                  { key: "light", label: "Light", icon: <Sun size={14} /> },
                  { key: "sepia", label: "Sepia", icon: <BookOpen size={14} /> },
                ] as { key: Theme; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                  <button key={key} className="pill-btn"
                    onClick={() => changeTheme(key)}
                    style={{
                      background: theme === key ? tc.accent : "transparent",
                      border: `1px solid ${theme === key ? tc.accent : tc.border}`,
                      color: theme === key ? "#fff" : tc.subtext,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4
                    }}
                  >
                    {icon}
                    <span style={{ fontSize: 8 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABLE OF CONTENTS PANEL ── */}
      <AnimatePresence>
        {showTOC && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: 64, left: 0, bottom: 0,
              width: "min(300px, 85vw)",
              background: tc.settingsBg,
              borderRight: `1px solid ${tc.border}`,
              zIndex: 45, overflowY: "auto",
              padding: "20px 12px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", marginBottom: 16 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 13, color: tc.text }}>Chapters</span>
              <button onClick={() => setShowTOC(false)} style={{ background: "none", border: "none", cursor: "pointer", color: tc.subtext, display: "flex" }}>
                <X size={16} />
              </button>
            </div>
            {allChapters.map(ch => (
              <div
                key={ch.chapter_number}
                className={`toc-item ${ch.chapter_number === currentNum ? "active" : ""}`}
                onClick={() => { router.push(`/novel/${ch.chapter_number}`); setShowTOC(false); }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: ch.chapter_number === currentNum ? tc.accent : `${tc.border}`,
                  border: `1px solid ${tc.border}`,
                  fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700,
                  color: ch.chapter_number === currentNum ? "#fff" : tc.subtext
                }}>
                  {ch.chapter_number}
                </span>
                <span style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: ch.chapter_number === currentNum ? 600 : 400, color: tc.text, lineHeight: 1.4 }}>
                  {ch.title}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div
        ref={contentRef}
        style={{ maxWidth: maxWidth, margin: "0 auto", padding: "100px 24px 80px" }}
      >
        {/* Chapter header */}
        <div style={{ marginBottom: 52, borderBottom: `1px solid ${tc.border}`, paddingBottom: 36 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: 9, letterSpacing: "0.38em", textTransform: "uppercase",
            color: tc.accent, marginBottom: 12
          }}>
            Tales of the 47 · Book I
          </p>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontWeight: 900,
            fontSize: "clamp(26px, 5vw, 42px)",
            lineHeight: 1.15, color: tc.text,
            marginBottom: 16, letterSpacing: "0.01em"
          }}>
            {chapterTitle}
          </h1>
          {/* Decorative rule */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, ${tc.accent}, transparent)` }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: tc.accent, opacity: 0.6 }} />
            <div style={{ height: 1, width: 30, background: `linear-gradient(90deg, ${tc.accent}, transparent)`, opacity: 0.4 }} />
          </div>
        </div>

        {/* Paragraphs */}
        <article style={{ fontSize: `${textSize}px`, lineHeight: lineHeight, color: tc.text }}>
          {paragraphs.map((para, i) => {
            // Detect dialogue: starts with a quotation mark or dash
            const isDialogue = /^["'"'—–-]/.test(para);
            return (
              <p
                key={i}
                className={isDialogue ? "novel-dialogue" : "novel-para"}
                style={{
                  marginBottom: `${lineHeight * 0.75}em`,
                  fontFamily: FONTS[font],
                  textAlign: "justify",
                  hyphens: "auto",
                  WebkitHyphens: "auto",
                  borderLeftColor: isDialogue ? tc.accent : undefined,
                  borderLeftWidth: isDialogue ? 2 : undefined,
                  borderLeftStyle: isDialogue ? "solid" : undefined,
                  paddingLeft: isDialogue ? "0.75em" : undefined,
                  opacity: isDialogue ? 0.95 : 1,
                }}
              >
                {para}
              </p>
            );
          })}
        </article>

        {/* ── CHAPTER NAV ── */}
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: `1px solid ${tc.border}`, display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          {prevChapter !== null ? (
            <button
              className="nav-btn"
              onClick={() => navigateTo(prevChapter)}
              style={{ borderColor: tc.border, color: tc.subtext, background: "transparent" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
          ) : <div />}

          {nextChapter !== null && (
            <button
              className="nav-btn"
              onClick={() => navigateTo(nextChapter)}
              style={{
                borderColor: tc.accent,
                color: "#fff",
                background: `linear-gradient(135deg, ${tc.accent}33, ${tc.accent}22)`,
              }}
            >
              Next Chapter <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* ── PROGRESS BADGE ── */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <span style={{
            display: "inline-block", padding: "6px 14px", borderRadius: 100,
            border: `1px solid ${tc.border}`,
            fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: "0.25em",
            textTransform: "uppercase", color: tc.subtext
          }}>
            {readProgress}% read
          </span>
        </div>

        {/* ── SOCIAL ── */}
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: `1px solid ${tc.border}` }}>
          <SocialStats slug={uniqueSlug} />
          <CommentSection slug={uniqueSlug} />
        </div>
      </div>
    </div>
  );
}
