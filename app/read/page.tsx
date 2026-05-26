"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, BookOpen, ChevronRight, Check, Play } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import DownloadButton from "../../components/DownloadButton";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Series meta ────────────────────────────────────────────── */
const MANGA_META = [
  {
    id: 1,
    title: "SPECTRAL RIFT",
    cover: "/spectral_rift_cover.jpeg",
    description:
      "Shadows leak into Nairobi. Squad 7 races against a growing rift between worlds — and the darkness is learning to hunt.",
    genre: ["Supernatural", "Action", "Urban Fantasy"],
    status: "Ongoing",
    color: "#8B5CF6",
    accentRgb: "139,92,246",
  },
  {
    id: 2,
    title: "URITHI",
    cover: "/urithi_cover.jpeg",
    description:
      "Ancient bloodlines wake to a modern reckoning. Heritage becomes power. Legacy becomes curse. Some gifts are chains.",
    genre: ["Dark Fantasy", "Drama", "Heritage"],
    status: "Ongoing",
    color: "#F59E0B",
    accentRgb: "245,158,11",
  },
];

/* ═══════════════════════════════════════════════════════════════ */
function LibraryContent() {
  const searchParams = useSearchParams();
  const urlMangaId = searchParams.get("manga");

  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeManga, setActiveManga] = useState<number>(
    urlMangaId ? parseInt(urlMangaId) : 1
  );
  const [readingHistory, setReadingHistory] = useState<Record<string, any>>({});

  const series = MANGA_META.find((s) => s.id === activeManga) || MANGA_META[0];

  useEffect(() => {
    const hist = localStorage.getItem("user_reading_history");
    if (hist) setReadingHistory(JSON.parse(hist));
  }, []);

  const clearAllOffline = async () => {
    if (!confirm("This will delete ALL downloaded chapters from your device. Proceed?")) return;
    localStorage.removeItem("offline_library");
    const cacheNames = await window.caches.keys();
    for (const name of cacheNames) {
      if (name.startsWith("manga-")) await window.caches.delete(name);
    }
    window.location.reload();
  };

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("manga_chapters")
        .select("*")
        .eq("manga_id", activeManga)
        .order("chapter_number", { ascending: true });

      if (!error && data && data.length > 0) {
        setChapters(data);
      } else {
        const offlineData = localStorage.getItem("offline_library");
        if (offlineData) {
          const parsedData = JSON.parse(offlineData);
          const filtered = parsedData
            .filter((c: any) => String(c.manga_id) === String(activeManga))
            .sort((a: any, b: any) => a.chapter_number - b.chapter_number);
          setChapters(filtered);
        } else {
          setChapters([]);
        }
      }
      setLoading(false);
    };
    fetchChapters();
  }, [activeManga]);

  const lastReadChapter = readingHistory[String(activeManga)]?.chapter;

  return (
    <div style={{ minHeight: "100vh", background: "#03010C", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .halftone { background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px; }
        .ch-card { transition: background 0.18s, border-color 0.18s; }
        .ch-card:hover { background: rgba(255,255,255,0.045) !important; }
        .series-tab:hover .tab-cover { opacity: 0.45 !important; }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .skeleton::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          animation: shimmer 1.6s infinite;
        }
      `}</style>

      {/* Fixed halftone background */}
      <div className="halftone" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      {/* Series ambient glow */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${series.accentRgb},0.07) 0%, transparent 60%)`,
        transition: "background 0.6s ease",
      }} />

      {/* ── Sticky top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(3,1,12,0.94)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "13px 0",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/" style={{
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
              borderRadius: 2, color: "rgba(255,255,255,0.55)", transition: "all 0.2s",
            }}>
              <ArrowLeft size={17} />
            </Link>
            <div>
              <div className="bb" style={{ fontSize: 19, letterSpacing: "0.08em", color: "#fff", lineHeight: 1 }}>Manga Library</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.26)", marginTop: 2 }}>Jody-Verse · Choose your universe</div>
            </div>
          </div>
          <button onClick={clearAllOffline} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.28)", cursor: "pointer", borderRadius: 2,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
          }}>
            <Trash2 size={11} /> Clear Offline
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "44px 1.5rem 80px", position: "relative", zIndex: 1 }}>

        {/* ── Series switcher ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
          {MANGA_META.map((ser) => (
            <button
              key={ser.id}
              onClick={() => setActiveManga(ser.id)}
              className="series-tab"
              style={{ border: "none", cursor: "pointer", padding: 0, background: "transparent", textAlign: "left" }}
            >
              <div style={{
                position: "relative", borderRadius: 2, overflow: "hidden",
                border: activeManga === ser.id
                  ? `2px solid rgba(${ser.accentRgb},0.65)`
                  : "2px solid rgba(255,255,255,0.06)",
                boxShadow: activeManga === ser.id
                  ? `4px 4px 0 rgba(${ser.accentRgb},0.22)`
                  : "4px 4px 0 rgba(0,0,0,0.3)",
                transition: "all 0.3s",
              }}>
                {/* Cover thumbnail */}
                <div style={{ height: 120, position: "relative", overflow: "hidden" }}>
                  <div
                    className="tab-cover"
                    style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url('${ser.cover}')`,
                      backgroundSize: "cover", backgroundPosition: "center top",
                      opacity: activeManga === ser.id ? 0.7 : 0.22,
                      transition: "opacity 0.3s",
                    }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 20%, rgba(3,1,12,0.92) 100%)" }} />
                  {activeManga === ser.id && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      width: 22, height: 22, borderRadius: "50%",
                      background: ser.color, display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 12px rgba(${ser.accentRgb},0.8)`,
                    }}>
                      <Check size={11} color="#000" strokeWidth={3} />
                    </div>
                  )}
                  {/* Series number */}
                  <div className="bb" style={{
                    position: "absolute", bottom: 10, left: 14,
                    fontSize: 11, letterSpacing: "0.25em",
                    color: activeManga === ser.id ? ser.color : "rgba(255,255,255,0.25)",
                    transition: "color 0.3s",
                  }}>ID: 0{ser.id}</div>
                </div>
                {/* Label */}
                <div style={{
                  padding: "13px 14px",
                  background: activeManga === ser.id
                    ? `rgba(${ser.accentRgb},0.07)`
                    : "rgba(255,255,255,0.02)",
                  transition: "background 0.3s",
                }}>
                  <div className="bb" style={{
                    fontSize: 17, letterSpacing: "0.06em",
                    color: activeManga === ser.id ? "#fff" : "rgba(255,255,255,0.4)",
                    marginBottom: 5, transition: "color 0.3s",
                  }}>{ser.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ser.genre.slice(0, 2).map((g) => (
                      <span key={g} style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: activeManga === ser.id ? ser.color : "rgba(255,255,255,0.22)",
                        transition: "color 0.3s",
                      }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Active series hero panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeManga}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{
              display: "flex", gap: 24, marginBottom: 36,
              padding: "22px", borderRadius: 2,
              border: `1px solid rgba(${series.accentRgb},0.22)`,
              background: `rgba(${series.accentRgb},0.05)`,
              boxShadow: `5px 5px 0 rgba(${series.accentRgb},0.12)`,
              position: "relative", overflow: "hidden",
              flexWrap: "wrap",
            }}
          >
            {/* Cover art */}
            <div style={{
              width: 100, flexShrink: 0, borderRadius: 2,
              overflow: "hidden", border: `1px solid rgba(${series.accentRgb},0.35)`,
              height: 145, position: "relative",
              boxShadow: `3px 3px 0 rgba(0,0,0,0.5)`,
            }}>
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url('${series.cover}')`,
                backgroundSize: "cover", backgroundPosition: "center top",
              }} />
            </div>

            {/* Series info */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="bb" style={{ fontSize: 9, letterSpacing: "0.35em", color: series.color, marginBottom: 7, opacity: 0.9 }}>Now Active</div>
              <h2 className="bb" style={{
                fontSize: "clamp(26px,5vw,46px)", letterSpacing: "0.04em",
                color: "#fff", lineHeight: 0.9, marginBottom: 10,
                textShadow: "3px 3px 0 rgba(0,0,0,0.7)",
              }}>{series.title}</h2>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {series.genre.map((g) => (
                  <span key={g} style={{
                    padding: "3px 9px",
                    border: `1px solid rgba(${series.accentRgb},0.3)`,
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.14em",
                    color: series.color, textTransform: "uppercase",
                  }}>{g}</span>
                ))}
                <span style={{
                  padding: "3px 9px", border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 5px #22C55E" }} />
                  {series.status}
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.72, maxWidth: 440 }}>
                {series.description}
              </p>
              {lastReadChapter && (
                <Link href={`/read/${lastReadChapter}?manga=${activeManga}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
                    padding: "7px 16px",
                    background: `rgba(${series.accentRgb},0.15)`,
                    border: `1px solid rgba(${series.accentRgb},0.4)`,
                    boxShadow: `2px 2px 0 rgba(${series.accentRgb},0.18)`,
                    fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.18em",
                    color: series.color,
                  }}>
                  <Play size={10} fill="currentColor" /> Resume Ch. {lastReadChapter}
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Chapter list header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="bb" style={{ fontSize: 12, letterSpacing: "0.3em", color: "rgba(255,255,255,0.28)" }}>
            {loading ? "Loading…" : `${chapters.length} Chapter${chapters.length !== 1 ? "s" : ""}`}
          </div>
          {!loading && chapters.length > 0 && (
            <div className="bb" style={{ fontSize: 10, letterSpacing: "0.2em", color: `rgba(${series.accentRgb},0.6)` }}>
              {series.title}
            </div>
          )}
        </div>

        {/* ── Chapter cards ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{
                height: 72, borderRadius: 2,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.04)",
                position: "relative", overflow: "hidden",
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chapters.map((chapter, idx) => {
              const isLastRead = String(chapter.chapter_number) === String(lastReadChapter);
              return (
                <motion.div
                  key={chapter.id || chapter.chapter_number}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="ch-card"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 2,
                    border: isLastRead
                      ? `1px solid rgba(${series.accentRgb},0.45)`
                      : "1px solid rgba(255,255,255,0.06)",
                    background: isLastRead
                      ? `rgba(${series.accentRgb},0.07)`
                      : "rgba(255,255,255,0.02)",
                    position: "relative", cursor: "pointer",
                  }}
                >
                  {/* Left accent bar for last read */}
                  {isLastRead && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: series.color,
                      boxShadow: `0 0 10px rgba(${series.accentRgb},0.7)`,
                    }} />
                  )}

                  <Link
                    href={`/read/${chapter.chapter_number}?manga=${activeManga}`}
                    style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}
                  >
                    {/* Chapter number */}
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 2,
                      background: isLastRead ? `rgba(${series.accentRgb},0.2)` : "rgba(255,255,255,0.04)",
                      border: isLastRead ? `1px solid rgba(${series.accentRgb},0.5)` : "1px solid rgba(255,255,255,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="bb" style={{
                        fontSize: 18, letterSpacing: "0.04em",
                        color: isLastRead ? series.color : "rgba(255,255,255,0.42)",
                      }}>{chapter.chapter_number}</span>
                    </div>

                    {/* Title + meta */}
                    <div style={{ minWidth: 0 }}>
                      {isLastRead && (
                        <span style={{
                          display: "inline-block", marginBottom: 4,
                          padding: "2px 8px",
                          fontFamily: "'Bebas Neue'", fontSize: 8, letterSpacing: "0.2em",
                          background: series.color, color: "#000",
                          boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                        }}>Last Read</span>
                      )}
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: isLastRead ? "#fff" : "rgba(255,255,255,0.68)",
                        lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                      </div>
                      {chapter.created_at && (
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>
                          {new Date(chapter.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Download button */}
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, marginLeft: 12 }}>
                    <DownloadButton
                      mangaId={activeManga}
                      chapterId={chapter.chapter_number}
                      chapterNumber={chapter.chapter_number}
                      title={chapter.title}
                    />
                  </div>
                </motion.div>
              );
            })}

            {chapters.length === 0 && (
              <div style={{
                textAlign: "center", padding: "56px 20px",
                border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 2,
              }}>
                <BookOpen size={30} style={{ color: "rgba(255,255,255,0.18)", marginBottom: 14 }} />
                <p className="bb" style={{ fontSize: 13, letterSpacing: "0.22em", color: "rgba(255,255,255,0.22)" }}>
                  No chapters yet in this universe.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MangaIndex() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", background: "#03010C",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: "0.35em", color: "#8B5CF6" }}>
          Loading Library…
        </span>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
