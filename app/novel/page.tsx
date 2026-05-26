"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Play, Clock, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

const SERIES = {
  title:       "TALES OF THE 47",
  label:       "Light Novel · Folklore",
  tagline:     "The untold become legend",
  description: "Forty-seven folk legends reimagined. Voices that history silenced. Stories that were stolen — finally told.",
  genre:       ["Folklore", "Historical", "Drama"],
  color:       "#0EA5E9",
  accentRgb:   "14,165,233",
  grad:        "linear-gradient(135deg, #0F172A 0%, #1D4ED8 45%, #0EA5E9 100%)",
};

function estimateReadTime(title: string, chapterNum: number): string {
  // Rough estimate — real word count would need fetching the body
  const base = 8 + (chapterNum % 3) * 3; // 8–14 min range
  return `~${base} min`;
}

export default function NovelIndex() {
  const [chapters, setChapters]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRead, setLastRead]   = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("novel_chapters")
      .select("id, title, chapter_number, created_at")
      .order("chapter_number", { ascending: true })
      .then(({ data }) => { setChapters(data || []); setLoading(false); });

    const hist = localStorage.getItem("user_reading_history");
    if (hist) {
      const parsed = JSON.parse(hist);
      // key "0" = novel (mangaId 0)
      const novelEntry = parsed["0"];
      if (novelEntry) setLastRead(novelEntry.chapter);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#03010C", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .halftone { background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px; }
        .ch-row { transition: background 0.18s, border-color 0.18s; }
        .ch-row:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(14,165,233,0.3) !important; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .skeleton::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          animation: shimmer 1.6s infinite;
        }
      `}</style>

      {/* Backgrounds */}
      <div className="halftone" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${SERIES.accentRgb},0.07) 0%, transparent 60%)` }} />

      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(3,1,12,0.94)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "13px 0",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
            borderRadius: 2, color: "rgba(255,255,255,0.55)", transition: "all 0.2s",
          }}>
            <ArrowLeft size={17} />
          </Link>
          <div>
            <div className="bb" style={{ fontSize: 19, letterSpacing: "0.08em", color: "#fff", lineHeight: 1 }}>Novel Library</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.26)", marginTop: 2 }}>Jody-Verse · Tales of the 47</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "44px 1.5rem 80px", position: "relative", zIndex: 1 }}>

        {/* ── Hero panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
            position: "relative", borderRadius: 2, overflow: "hidden",
            border: `1px solid rgba(${SERIES.accentRgb},0.25)`,
            background: `rgba(${SERIES.accentRgb},0.05)`,
            boxShadow: `5px 5px 0 rgba(${SERIES.accentRgb},0.1)`,
            padding: "28px 28px 24px",
            marginBottom: 36,
          }}
        >
          {/* Halftone on hero */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(${SERIES.accentRgb},0.12) 1px, transparent 1px)`, backgroundSize: "16px 16px", pointerEvents: "none" }} />

          {/* Gradient panel fill */}
          <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: `linear-gradient(to left, rgba(${SERIES.accentRgb},0.06), transparent)`, pointerEvents: "none" }} />

          {/* BookOpen icon as "cover" */}
          <div style={{
            position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
            width: 88, height: 120, borderRadius: 2,
            background: SERIES.grad,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid rgba(${SERIES.accentRgb},0.4)`,
            boxShadow: `4px 4px 0 rgba(0,0,0,0.5)`,
            opacity: 0.75,
          }}>
            <BookOpen size={34} color="rgba(255,255,255,0.3)" />
          </div>

          <div style={{ position: "relative", zIndex: 1, maxWidth: "calc(100% - 130px)" }}>
            <div className="bb" style={{ fontSize: 9, letterSpacing: "0.4em", color: SERIES.color, marginBottom: 8, opacity: 0.85 }}>Light Novel</div>
            <h1 className="bb" style={{ fontSize: "clamp(28px,6vw,52px)", letterSpacing: "0.04em", color: "#fff", lineHeight: 0.9, marginBottom: 6 }}>
              {SERIES.title}
            </h1>
            <div style={{ width: 80, height: 2, background: SERIES.color, marginBottom: 14, boxShadow: `0 0 12px rgba(${SERIES.accentRgb},0.7)` }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {SERIES.genre.map(g => (
                <span key={g} style={{
                  padding: "3px 9px", border: `1px solid rgba(${SERIES.accentRgb},0.3)`,
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", color: SERIES.color, textTransform: "uppercase",
                }}>{g}</span>
              ))}
              <span style={{
                padding: "3px 9px", border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 9, fontWeight: 600, letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 5px #22C55E" }} />
                Ongoing
              </span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.72, maxWidth: 440 }}>
              {SERIES.description}
            </p>

            {/* Resume reading if history exists */}
            <AnimatePresence>
              {lastRead && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Link href={`/novel/${lastRead}`} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
                    padding: "8px 18px", borderRadius: 2,
                    background: `rgba(${SERIES.accentRgb},0.15)`,
                    border: `1px solid rgba(${SERIES.accentRgb},0.4)`,
                    boxShadow: `2px 2px 0 rgba(${SERIES.accentRgb},0.2)`,
                    fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.18em",
                    color: SERIES.color,
                  }}>
                    <Play size={10} fill="currentColor" /> Resume Ch. {lastRead}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Chapter count header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="bb" style={{ fontSize: 12, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)" }}>
            {loading ? "Loading…" : `${chapters.length} Chapter${chapters.length !== 1 ? "s" : ""}`}
          </div>
          {!loading && chapters.length > 0 && (
            <div className="bb" style={{ fontSize: 10, letterSpacing: "0.2em", color: `rgba(${SERIES.accentRgb},0.6)` }}>
              {SERIES.title}
            </div>
          )}
        </div>

        {/* ── Chapter list ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{
                height: 72, borderRadius: 2,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)",
                position: "relative", overflow: "hidden",
              }} />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "56px 20px",
            border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 2,
          }}>
            <BookOpen size={30} style={{ color: "rgba(255,255,255,0.18)", marginBottom: 14 }} />
            <p className="bb" style={{ fontSize: 13, letterSpacing: "0.22em", color: "rgba(255,255,255,0.22)" }}>
              No chapters yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chapters.map((ch, idx) => {
              const isLastRead  = String(ch.chapter_number) === String(lastRead);
              const readTime    = estimateReadTime(ch.title, ch.chapter_number);
              return (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="ch-row"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 2, cursor: "pointer",
                    border: isLastRead
                      ? `1px solid rgba(${SERIES.accentRgb},0.45)`
                      : "1px solid rgba(255,255,255,0.06)",
                    background: isLastRead
                      ? `rgba(${SERIES.accentRgb},0.07)`
                      : "rgba(255,255,255,0.02)",
                    position: "relative",
                    transition: "all 0.18s",
                  }}
                >
                  {/* Left accent bar */}
                  {isLastRead && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: SERIES.color, boxShadow: `0 0 10px rgba(${SERIES.accentRgb},0.7)`,
                    }} />
                  )}

                  <Link href={`/novel/${ch.chapter_number}`}
                    style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>

                    {/* Chapter number */}
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 2,
                      background: isLastRead ? `rgba(${SERIES.accentRgb},0.2)` : "rgba(255,255,255,0.04)",
                      border: isLastRead ? `1px solid rgba(${SERIES.accentRgb},0.5)` : "1px solid rgba(255,255,255,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isLastRead
                        ? <Check size={16} color={SERIES.color} strokeWidth={2.5} />
                        : <span className="bb" style={{ fontSize: 18, letterSpacing: "0.04em", color: "rgba(255,255,255,0.42)" }}>{ch.chapter_number}</span>
                      }
                    </div>

                    {/* Title + meta */}
                    <div style={{ minWidth: 0 }}>
                      {isLastRead && (
                        <span style={{
                          display: "inline-block", marginBottom: 4,
                          padding: "2px 8px",
                          fontFamily: "'Bebas Neue'", fontSize: 8, letterSpacing: "0.2em",
                          background: SERIES.color, color: "#000",
                          boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                        }}>Last Read</span>
                      )}
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: isLastRead ? "#fff" : "rgba(255,255,255,0.68)",
                        lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ch.title || `Chapter ${ch.chapter_number}`}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 3, alignItems: "center" }}>
                        {ch.created_at && (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                            {new Date(ch.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: `rgba(${SERIES.accentRgb},0.5)` }}>
                          <Clock size={9} /> {readTime}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Read arrow */}
                  <Link href={`/novel/${ch.chapter_number}`}
                    style={{ flexShrink: 0, marginLeft: 12, color: isLastRead ? SERIES.color : "rgba(255,255,255,0.22)", transition: "color 0.18s" }}>
                    <ChevronRight size={18} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
