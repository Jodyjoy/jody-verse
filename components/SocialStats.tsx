"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Eye, Heart } from "lucide-react";

export default function SocialStats({ slug }: { slug: string }) {
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    // 1. Fetch current stats
    const fetchStats = async () => {
      const { data } = await supabase
        .from('chapter_stats')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (data) {
        setViews(data.views);
        setLikes(data.likes);
      }
    };

    // 2. Increment View (Only once per session)
    const viewKey = `viewed_${slug}`;
    if (!sessionStorage.getItem(viewKey)) {
        supabase.rpc('increment_view', { page_slug: slug }).then(() => {
            setViews(v => v + 1); // Optimistic update
            sessionStorage.setItem(viewKey, 'true');
        });
    }

    // 3. Check if user already liked
    const likeKey = `liked_${slug}`;
    if (localStorage.getItem(likeKey)) {
        setHasLiked(true);
    }

    fetchStats();
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked) return; // Prevent spamming

    // Optimistic Update (Update UI instantly)
    setLikes(l => l + 1);
    setHasLiked(true);
    localStorage.setItem(`liked_${slug}`, 'true');

    // Send to DB
    await supabase.rpc('increment_like', { page_slug: slug });
  };

  return (
    <div className="flex items-center gap-6 text-gray-400 font-mono text-sm py-4">
      {/* View Counter */}
      <div className="flex items-center gap-2" title="Total Reads">
        <Eye size={18} className="text-blue-500" />
        <span>{views.toLocaleString()}</span>
      </div>

      {/* Like Button */}
      <button 
        onClick={handleLike}
        disabled={hasLiked}
        className={`flex items-center gap-2 transition-all duration-300 ${hasLiked ? 'text-red-500' : 'hover:text-red-400'}`}
        title={hasLiked ? "You liked this!" : "Leave a like"}
      >
        <Heart size={18} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "animate-pulse" : ""} />
        <span>{likes.toLocaleString()}</span>
      </button>
    </div>
  );
}