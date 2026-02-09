"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bookmark } from "lucide-react";

interface Props {
  slug: string;  // "manga-1"
  title: string; // "Chapter 1"
  type: "manga" | "novel";
}

export default function BookmarkButton({ slug, title, type }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // 2. Check if already bookmarked
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('slug', slug)
        .single();

      if (data) setSaved(true);
      setLoading(false);
    };

    checkStatus();
  }, [slug]);

  const toggleBookmark = async () => {
    if (!userId) {
      alert("Login to save bookmarks!"); // Simple alert for now
      return;
    }

    // Optimistic UI Update (Instant feel)
    const newState = !saved;
    setSaved(newState);

    if (newState) {
      // SAVE
      await supabase.from('bookmarks').insert({
        user_id: userId,
        slug,
        title,
        type
      });
    } else {
      // REMOVE
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('slug', slug);
    }
  };

  if (loading) return <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse" />;

  return (
    <button 
      onClick={toggleBookmark}
      className={`p-3 rounded-full border transition-all duration-300 group ${
        saved 
          ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
          : "bg-gray-900/80 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
      }`}
      title={saved ? "Remove Bookmark" : "Save Chapter"}
    >
      <Bookmark 
        size={20} 
        fill={saved ? "currentColor" : "none"} 
        className={`transition-transform duration-300 ${saved ? "scale-110" : "group-hover:scale-110"}`} 
      />
    </button>
  );
}