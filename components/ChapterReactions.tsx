"use client";

/**
 * ChapterReactions
 *
 * SUPABASE: Run this once in your SQL editor to create the table:
 *
 *   CREATE TABLE IF NOT EXISTS chapter_reactions (
 *     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     manga_id   INT NOT NULL,
 *     chapter_id INT NOT NULL,
 *     emoji      TEXT NOT NULL,
 *     count      INT NOT NULL DEFAULT 0,
 *     UNIQUE(manga_id, chapter_id, emoji)
 *   );
 *   ALTER TABLE chapter_reactions ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Anyone can read" ON chapter_reactions FOR SELECT USING (true);
 *   CREATE POLICY "Anyone can upsert" ON chapter_reactions FOR INSERT WITH CHECK (true);
 *   CREATE POLICY "Anyone can update" ON chapter_reactions FOR UPDATE USING (true);
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";

const EMOJIS = ["🔥", "💯", "😭", "🤯", "💀"] as const;
type Emoji = typeof EMOJIS[number];

interface Props {
  mangaId: number;
  chapterId: number;
  accentColor?: string;
  accentRgb?: string;
}

interface ReactionRow {
  emoji: Emoji;
  count: number;
}

export default function ChapterReactions({ mangaId, chapterId, accentColor = "#8B5CF6", accentRgb = "139,92,246" }: Props) {
  const [reactions, setReactions] = useState<Record<Emoji, number>>({} as any);
  const [myReactions, setMyReactions] = useState<Set<Emoji>>(new Set());
  const [bouncing, setBouncing] = useState<Emoji | null>(null);
  const [loaded, setLoaded] = useState(false);

  const lsKey = `jv_rxn_${mangaId}_${chapterId}`;

  // ── Load counts from Supabase + my reactions from localStorage ─────────────
  useEffect(() => {
    const mine = JSON.parse(localStorage.getItem(lsKey) || "[]") as Emoji[];
    setMyReactions(new Set(mine));

    supabase
      .from("chapter_reactions")
      .select("emoji, count")
      .eq("manga_id", mangaId)
      .eq("chapter_id", chapterId)
      .then(({ data }) => {
        const map = {} as Record<Emoji, number>;
        EMOJIS.forEach(e => { map[e] = 0; });
        (data as ReactionRow[] | null)?.forEach(r => { map[r.emoji as Emoji] = r.count; });
        setReactions(map);
        setLoaded(true);
      });
  }, [mangaId, chapterId, lsKey]);

  const handleReact = async (emoji: Emoji) => {
    if (myReactions.has(emoji)) return; // already reacted

    // Optimistic update
    setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    setBouncing(emoji);
    setTimeout(() => setBouncing(null), 400);

    // Persist to localStorage
    const updated = [...myReactions, emoji];
    setMyReactions(new Set(updated));
    localStorage.setItem(lsKey, JSON.stringify(updated));

    // Upsert to Supabase — try increment first, insert if not exists
    const current = reactions[emoji] || 0;
    await supabase
      .from("chapter_reactions")
      .upsert(
        { manga_id: mangaId, chapter_id: chapterId, emoji, count: current + 1 },
        { onConflict: "manga_id,chapter_id,emoji" }
      );
  };

  if (!loaded) return null;

  return (
    <div style={{
      padding: "20px 0 4px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      marginTop: 24,
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 10,
        letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)", marginBottom: 12,
      }}>
        Reactions
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {EMOJIS.map(emoji => {
          const count   = reactions[emoji] || 0;
          const reacted = myReactions.has(emoji);
          return (
            <motion.button
              key={emoji}
              onClick={() => handleReact(emoji)}
              animate={bouncing === emoji ? { scale: [1, 1.35, 1] } : {}}
              transition={{ duration: 0.35 }}
              disabled={reacted}
              title={reacted ? "Already reacted" : "React"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 2,
                border: reacted
                  ? `1px solid rgba(${accentRgb},0.45)`
                  : "1px solid rgba(255,255,255,0.1)",
                background: reacted
                  ? `rgba(${accentRgb},0.12)`
                  : "rgba(255,255,255,0.03)",
                cursor: reacted ? "default" : "pointer",
                transition: "all 0.18s",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: reacted ? accentColor : "rgba(255,255,255,0.4)",
                  minWidth: 12,
                }}>
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
