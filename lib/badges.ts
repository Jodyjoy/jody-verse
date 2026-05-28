/**
 * Badge definitions for Jody-Verse
 *
 * SUPABASE: Add a column to your profiles table:
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
 *
 * Each badge has an id (stored in the array), a label, icon (emoji), description,
 * and a color.
 */

export interface BadgeDef {
  id:          string;
  emoji:       string;
  label:       string;
  description: string;
  color:       string;
  rgb:         string;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id:          "day_one",
    emoji:       "⚡",
    label:       "Day One",
    description: "Completed your first daily check-in",
    color:       "#F59E0B",
    rgb:         "245,158,11",
  },
  {
    id:          "streak_7",
    emoji:       "🔥",
    label:       "On Fire",
    description: "Kept a 7-day check-in streak",
    color:       "#EF4444",
    rgb:         "239,68,68",
  },
  {
    id:          "streak_30",
    emoji:       "💎",
    label:       "Dedicated",
    description: "Reached a 30-day check-in streak",
    color:       "#06B6D4",
    rgb:         "6,182,212",
  },
  {
    id:          "first_read",
    emoji:       "📖",
    label:       "First Page",
    description: "Read your first manga chapter",
    color:       "#8B5CF6",
    rgb:         "139,92,246",
  },
  {
    id:          "binge_5",
    emoji:       "🌀",
    label:       "Binge Reader",
    description: "Read 5 different chapters",
    color:       "#3B82F6",
    rgb:         "59,130,246",
  },
  {
    id:          "saved_1",
    emoji:       "🔖",
    label:       "Archivist",
    description: "Saved your first bookmark",
    color:       "#10B981",
    rgb:         "16,185,129",
  },
  {
    id:          "rank_b",
    emoji:       "🥈",
    label:       "Rising",
    description: "Reached B-Rank",
    color:       "#8B5CF6",
    rgb:         "139,92,246",
  },
  {
    id:          "rank_a",
    emoji:       "🥇",
    label:       "Elite",
    description: "Reached A-Rank",
    color:       "#F97316",
    rgb:         "249,115,22",
  },
  {
    id:          "rank_s",
    emoji:       "👑",
    label:       "Apex",
    description: "Reached S-Rank — the top",
    color:       "#FBBF24",
    rgb:         "251,191,36",
  },
];

export const BADGE_MAP = Object.fromEntries(BADGE_DEFS.map(b => [b.id, b]));

/** Returns list of badge IDs that should be awarded given current stats */
export function evaluateBadges(stats: {
  streak:       number;
  chaptersRead: number;
  bookmarks:    number;
  rank:         string;
  existingBadges: string[];
}): string[] {
  const { streak, chaptersRead, bookmarks, rank, existingBadges } = stats;
  const has  = (id: string) => existingBadges.includes(id);
  const earn: string[] = [];

  if (streak >= 1  && !has("day_one"))  earn.push("day_one");
  if (streak >= 7  && !has("streak_7")) earn.push("streak_7");
  if (streak >= 30 && !has("streak_30"))earn.push("streak_30");
  if (chaptersRead >= 1  && !has("first_read")) earn.push("first_read");
  if (chaptersRead >= 5  && !has("binge_5"))    earn.push("binge_5");
  if (bookmarks >= 1     && !has("saved_1"))     earn.push("saved_1");
  if (["B-RANK","A-RANK","S-RANK"].includes(rank) && !has("rank_b")) earn.push("rank_b");
  if (["A-RANK","S-RANK"].includes(rank)         && !has("rank_a")) earn.push("rank_a");
  if (rank === "S-RANK"                          && !has("rank_s")) earn.push("rank_s");

  return earn;
}
