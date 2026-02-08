"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { MessageSquare, Send, User } from "lucide-react";

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Comments for this specific chapter
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('chapter_slug', slug) // Only get comments for THIS page
        .order('created_at', { ascending: false }); // Newest first

      if (!error) setComments(data || []);
    };

    fetchComments();
    
    // OPTIONAL: Real-time subscription could go here!
  }, [slug]);

  // 2. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !username.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('comments')
      .insert([
        { chapter_slug: slug, username: username, content: newComment }
      ]);

    if (error) {
      alert("Error posting comment!");
    } else {
      // Add the new comment to the list immediately (Optimistic Update)
      setComments([{ 
          id: Date.now(), 
          username, 
          content: newComment, 
          created_at: new Date().toISOString() 
      }, ...comments]);
      
      setNewComment("");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="text-blue-500" /> Discussion ({comments.length})
      </h3>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="flex gap-4">
            <div className="w-1/3">
                <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div className="w-2/3">
                <input 
                    type="text" 
                    placeholder="Join the conversation..." 
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                />
            </div>
            <button disabled={loading} className="bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500 transition">
                <Send size={18} />
            </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-black rounded-lg border border-gray-800 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-gray-500" />
                    <span className="font-bold text-blue-400 text-sm">{comment.username}</span>
                    <span className="text-xs text-gray-600">
                        {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.content}</p>
            </div>
        ))}
        {comments.length === 0 && (
            <p className="text-gray-600 text-center text-sm py-4">Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}