"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, BookOpen, Flame, Star, Bookmark, ChevronRight, Play, Zap } from "lucide-react";
import Link from "next/link";
import { getRank, getNextRankXP } from "../../lib/gameLogic";
import DailyCheckIn from "../../components/DailyAttunement";
import { motion } from "framer-motion";

/* ─── Squad colours ──────────────────────────────────────────── */
const SQUAD_COLORS: Record<string, { color: string; rgb: string }> = {
  "Squad 7":      { color: "#3B82F6", rgb: "59,130,246" },
  "Thunder Lord": { color: "#F59E0B", rgb: "245,158,11" },
  "Iron Wall":    { color: "#EF4444", rgb: "239,68,68" },
  "Void Walkers": { color: "#8B5CF6", rgb: "139,92,246" },
};

/* ─── Rank colour ────────────────────────────────────────────── */
function rankColor(rank: string) {
  if (rank === "S-RANK") return "#FBBF24";
  if (rank === "A-RANK") return "#F97316";
  if (rank === "B-RANK") return "#8B5CF6";
  if (rank === "C-RANK") return "#3B82F6";
  if (rank === "D-RANK") return "#22C55E";
  if (rank === "E-RANK") return "rgba(255,255,255,0.55)";
  return "rgba(255,255,255,0.28)";
}

/* ─── Reading history type ───────────────────────────────────── */
interface HistEntry { mangaId: string; chapter: string; page?: number; timestamp: number; title: string; }

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory]     = useState<HistEntry[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const [{ data: prof }, { data: bm }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (prof) setProfile(prof);
      if (bm)   setBookmarks(bm);

      /* reading history from localStorage */
      const raw = localStorage.getItem("user_reading_history");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, any>;
        const entries: HistEntry[] = Object.entries(parsed)
          .map(([mangaId, d]: [string, any]) => ({ mangaId, ...d }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setHistory(entries);
      }

      setLoading(false);
    })();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#03010C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: "0.35em", color: "#8B5CF6" }}>Loading…</div>
    </div>
  );

  const xp            = profile?.xp || 0;
  const rank          = getRank(xp);
  const nextGoal      = getNextRankXP(xp);
  const prevGoal      = (() => {
    if (xp >= 5000) return 2500; if (xp >= 2500) return 1000;
    if (xp >= 1000) return 400;  if (xp >= 400)  return 150;
    if (xp >= 150)  return 50;   if (xp >= 50)   return 0;
    return 0;
  })();
  const pct           = Math.min(100, ((xp - prevGoal) / (nextGoal - prevGoal)) * 100);
  const squad         = profile?.squad || "Squad 7";
  const sqCol         = SQUAD_COLORS[squad] || SQUAD_COLORS["Squad 7"];
  const handle        = user.email.split("@")[0];
  const rCol          = rankColor(rank);

  return (
    <main style={{ minHeight: "100vh", background: "#03010C", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .halftone { background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 20px 20px; }
        .bm-card:hover { background: rgba(255,255,255,0.045) !important; border-color: rgba(255,255,255,0.14) !important; }
        .hist-card:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Background */}
      <div className="halftone" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${sqCol.rgb},0.07) 0%, transparent 60%)`, transition: "background 0.5s" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1.5rem 80px", position: "relative", zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 36 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <ArrowLeft size={15} /> Back
          </Link>
          <span className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.2)" }}>Your Profile</span>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)", cursor: "pointer", borderRadius: 2, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.5)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.6)"; }}
          >
            <LogOut size={11} /> Sign Out
          </button>
        </div>

        {/* ── Identity card + stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 28 }}>

          {/* Profile strip */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20,
              padding: "24px 24px", borderRadius: 2,
              border: `1px solid rgba(${sqCol.rgb},0.25)`,
              background: `rgba(${sqCol.rgb},0.05)`,
              boxShadow: `5px 5px 0 rgba(${sqCol.rgb},0.1)`,
              position: "relative", overflow: "hidden",
            }}>
            {/* Halftone bg */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(${sqCol.rgb},0.1) 1px, transparent 1px)`, backgroundSize: "14px 14px", pointerEvents: "none" }} />

            {/* Avatar */}
            <div style={{
              width: 72, height: 72, flexShrink: 0, borderRadius: 2,
              background: sqCol.color, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Bebas Neue'", fontSize: 38, color: "#000",
              boxShadow: `4px 4px 0 rgba(0,0,0,0.4)`,
            }}>
              {handle[0].toUpperCase()}
            </div>

            {/* Name + squad */}
            <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 9, letterSpacing: "0.4em", color: sqCol.color, marginBottom: 4, opacity: 0.85 }}>
                {squad}
              </div>
              <div className="bb" style={{ fontSize: "clamp(28px,5vw,44px)", lineHeight: 0.9, color: "#fff", marginBottom: 12 }}>
                {handle}
              </div>
              {/* Rank badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 2,
                border: `1px solid ${rCol}`,
                background: `${rCol}18`,
                fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.18em",
                color: rCol,
              }}>
                <Star size={9} fill={rCol} color={rCol} /> {rank}
              </span>
            </div>

            {/* XP block */}
            <div style={{ minWidth: 200, flex: 1, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)" }}>Experience</span>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)" }}>{xp} / {nextGoal} XP</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 0, overflow: "hidden", position: "relative" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ height: "100%", background: rCol, boxShadow: `0 0 12px ${rCol}` }} />
              </div>
              <div style={{ marginTop: 5, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
                {rank === "S-RANK" ? "Maximum rank reached" : `${nextGoal - xp} XP to next rank`}
              </div>
            </div>
          </motion.div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Total XP",   value: xp.toLocaleString(),   icon: <Zap size={14} /> },
              { label: "Streak",     value: `${profile?.streak ?? 0}d`,  icon: <Flame size={14} /> },
              { label: "Saved",      value: bookmarks.length,       icon: <Bookmark size={14} /> },
              { label: "Reading",    value: history.length,         icon: <BookOpen size={14} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: "16px 14px", borderRadius: 2, textAlign: "center",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ color: sqCol.color, marginBottom: 6, display: "flex", justifyContent: "center" }}>{icon}</div>
                <div className="bb" style={{ fontSize: 22, letterSpacing: "0.04em", color: "#fff", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Daily check-in ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>Daily Check-In</div>
          <DailyCheckIn />
        </div>

        {/* ── Reading history ── */}
        {history.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)" }}>Recently Read</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(0, 5).map((entry) => {
                const seriesColor = entry.mangaId === "1" ? "#8B5CF6" : entry.mangaId === "2" ? "#F59E0B" : entry.mangaId === "3" ? "#EC4899" : "#0EA5E9";
                const seriesName  = entry.mangaId === "1" ? "Spectral Rift" : entry.mangaId === "2" ? "Urithi" : entry.mangaId === "3" ? "Katikati" : "Tales of the 47";
                const href = entry.mangaId === "0" ? `/novel/${entry.chapter}` : `/read/${entry.chapter}?manga=${entry.mangaId}`;
                return (
                  <Link key={entry.mangaId} href={href} className="hist-card" style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ width: 4, height: 36, background: seriesColor, borderRadius: 0, flexShrink: 0, boxShadow: `0 0 8px ${seriesColor}` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: seriesColor, marginBottom: 3 }}>{seriesName}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Chapter {entry.chapter}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.15em", fontFamily: "'Bebas Neue'" }}>
                      <Play size={8} fill="currentColor" /> Resume
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bookmarks / Saved ── */}
        <div>
          <div className="bb" style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>Saved</div>
          {bookmarks.length === 0 ? (
            <div style={{
              padding: "48px 24px", textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 2,
            }}>
              <Bookmark size={28} style={{ color: "rgba(255,255,255,0.14)", marginBottom: 12 }} />
              <p className="bb" style={{ fontSize: 12, letterSpacing: "0.22em", color: "rgba(255,255,255,0.2)" }}>Nothing saved yet</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>Bookmark chapters while reading to find them here.</p>
              <Link href="/read" style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 18,
                padding: "8px 20px", borderRadius: 2,
                background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)",
                fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.18em", color: "#8B5CF6",
              }}>
                Browse Manga <ChevronRight size={11} />
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bookmarks.map((b, idx) => {
                const isManga = b.type === "manga";
                const href = isManga
                  ? `/read/${b.slug.replace(/manga-\d+-ch-/, "")}?manga=${b.slug.match(/manga-(\d+)/)?.[1] || 1}`
                  : `/novel/${b.slug.replace("novel-", "")}`;
                return (
                  <motion.div key={b.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="bm-card"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px", borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.02)",
                      transition: "all 0.2s", cursor: "pointer",
                    }}
                  >
                    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 42, height: 42, flexShrink: 0, borderRadius: 2,
                        background: isManga ? "rgba(139,92,246,0.15)" : "rgba(14,165,233,0.15)",
                        border: isManga ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(14,165,233,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <BookOpen size={16} color={isManga ? "#8B5CF6" : "#0EA5E9"} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: isManga ? "#8B5CF6" : "#0EA5E9", marginBottom: 3 }}>
                          {isManga ? "Manga" : "Novel"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>
                          {new Date(b.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={async () => {
                        await supabase.from("bookmarks").delete().eq("id", b.id);
                        setBookmarks(bookmarks.filter(i => i.id !== b.id));
                      }}
                      style={{
                        padding: "8px 10px", background: "transparent",
                        border: "1px solid transparent", color: "rgba(255,255,255,0.2)",
                        cursor: "pointer", borderRadius: 2, transition: "all 0.18s", flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                      title="Remove"
                    >
                      <LogOut size={13} style={{ transform: "rotate(180deg)" }} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

