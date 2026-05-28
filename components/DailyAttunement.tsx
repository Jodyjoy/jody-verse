"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Zap, Check, Flame, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Called after a successful check-in so the parent can sync its own streak display */
  onCheckIn?: (newStreak: number, xpEarned: number) => void;
}

export default function DailyCheckIn({ onCheckIn }: Props) {
  const [loading, setLoading]          = useState(true);
  const [userId, setUserId]            = useState<string | null>(null);
  const [streak, setStreak]            = useState(0);
  const [checkedInToday, setCheckedIn] = useState(false);
  const [showReward, setShowReward]    = useState(false);
  const [lastXP, setLastXP]           = useState(25);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("streak, last_check_in")
        .eq("id", user.id)
        .single();

      if (p) {
        setStreak(p.streak || 0);
        if (p.last_check_in) {
          const same = new Date(p.last_check_in).toDateString() === new Date().toDateString();
          setCheckedIn(same);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleCheckIn = async () => {
    if (!userId || checkedInToday || saving) return;
    setSaving(true);
    setSaveError(false);

    const newStreak = streak + 1;
    const xp        = newStreak % 7 === 0 ? 150 : 25;

    // ── Direct write to profiles (reliable, no RPC dependency) ──────────
    const { error: writeErr } = await supabase
      .from("profiles")
      .update({
        streak:         newStreak,
        last_check_in:  new Date().toISOString(),
      })
      .eq("id", userId);

    if (writeErr) {
      console.error("Check-in write failed:", writeErr);
      setSaveError(true);
      setSaving(false);
      return;
    }

    // ── XP via add_xp RPC (best-effort; won't block the check-in) ───────
    const { error: xpErr } = await supabase.rpc("add_xp", { uid: userId, amount: xp });
    if (xpErr) console.warn("add_xp RPC unavailable; XP not updated:", xpErr.message);

    // ── Update UI ────────────────────────────────────────────────────────
    setCheckedIn(true);
    setStreak(newStreak);
    setLastXP(xp);
    setShowReward(true);
    setSaving(false);
    onCheckIn?.(newStreak, xp);
    setTimeout(() => setShowReward(false), 3500);
  };

  if (loading || !userId) return null;

  const weekPos = streak % 7 === 0 && streak > 0 && checkedInToday ? 7 : streak % 7;

  return (
    <div style={{
      position: "relative", borderRadius: 2, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.02)",
      padding: "22px 20px",
    }}>
      {/* XP reward flash */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 20,
              background: "rgba(3,1,12,0.95)", backdropFilter: "blur(12px)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            <Flame size={32} color="#F59E0B" />
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: "0.06em", color: "#fff" }}>
              +{lastXP} XP
            </div>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
              {lastXP === 150 ? "WEEKLY BONUS" : "DAILY CHECK-IN"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.28)", marginBottom: 4 }}>
            This Week
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={15} color="#F59E0B" />
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: "0.06em", color: "#fff" }}>
              {streak} Day Streak
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Error hint */}
          {saveError && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#EF4444" }}>
              <AlertCircle size={11} /> Save failed
            </div>
          )}

          <button
            disabled={checkedInToday || saving}
            onClick={handleCheckIn}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 2,
              cursor: checkedInToday || saving ? "default" : "pointer",
              fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: "0.18em",
              background: checkedInToday ? "rgba(255,255,255,0.04)"
                        : saving        ? "rgba(255,255,255,0.08)"
                        :                 "#fff",
              color: checkedInToday || saving ? "rgba(255,255,255,0.3)" : "#000",
              border: checkedInToday || saving ? "1px solid rgba(255,255,255,0.08)" : "none",
              boxShadow: checkedInToday || saving ? "none" : "3px 3px 0 rgba(139,92,246,0.6)",
              transition: "all 0.2s",
            }}
          >
            {checkedInToday
              ? <><Check size={11} /> Done Today</>
              : saving
              ? <>Saving…</>
              : <><Zap size={11} fill="black" /> Check In</>}
          </button>
        </div>
      </div>

      {/* 7-day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const pos     = i + 1;
          const done    = pos <= weekPos;
          const active  = pos === weekPos + 1 && !checkedInToday;
          const isFinal = pos === 7;
          return (
            <div key={i} style={{
              height: 42, borderRadius: 2,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              border: done    ? "1px solid rgba(139,92,246,0.45)"
                    : active  ? "1px dashed rgba(245,158,11,0.6)"
                    :           "1px solid rgba(255,255,255,0.06)",
              background: done   ? "rgba(139,92,246,0.12)"
                        : active ? "rgba(245,158,11,0.05)"
                        :          "rgba(255,255,255,0.02)",
              transition: "all 0.3s",
            }}>
              {done
                ? <Check size={12} color="#8B5CF6" strokeWidth={3} />
                : <span style={{
                    fontFamily: "'Bebas Neue'", fontSize: 10, letterSpacing: "0.1em",
                    color: isFinal ? "#F59E0B" : "rgba(255,255,255,0.18)",
                  }}>
                    {isFinal ? "★" : `D${pos}`}
                  </span>
              }
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 8, fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>
        Day 7 gives 150 XP bonus · Check in daily to keep your streak
      </div>
    </div>
  );
}
