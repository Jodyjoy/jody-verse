"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Send, User as UserIcon, Loader2 } from "lucide-react";

interface Comment {
  id: number;
  user_email: string; // We now track WHO sent it
  content: string;
  created_at: string;
}

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // STORE LOGGED IN USER

  // 1. Fetch Comments & User Info
  useEffect(() => {
    const getData = async () => {
      // Get Comments
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('slug', slug)
        .order('created_at', { ascending: false });
      if (data) setComments(data);

      // Get User
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user); // If null, they are anonymous
      
      setLoading(false);
    };
    getData();
  }, [slug]);

  // 2. Post Comment (With Identity)
  const handlePost = async () => {
    if (!newComment.trim()) return;

    // Use logged-in email OR "Anonymous"
    const authorName = user ? user.email.split('@')[0] : "Anonymous";

    const { data, error } = await supabase
        .from('comments')
        .insert([{ 
            slug, 
            content: newComment, 
            user_email: authorName // Save their actual name/email fragment
        }])
        .select();

    if (!error && data) {
      setComments([data[0], ...comments]);
      setNewComment("");
    }
  };

  return (
    <div className="mt-10 border-t border-gray-800 pt-6">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="bg-blue-600 w-2 h-6 rounded-full"></span>
        Comms Channel ({comments.length})
      </h3>

      {/* INPUT AREA */}
      <div className="flex gap-4 mb-8">
        {/* Avatar: Show First Letter if logged in, else User Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
            {user ? (
                <span className="text-blue-500 font-bold text-lg">{user.email[0].toUpperCase()}</span>
            ) : (
                <UserIcon size={20} className="text-gray-500" />
            )}
        </div>

        <div className="flex-1 relative">
            <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? `Speak your mind, ${user.email.split('@')[0]}...` : "Login to join the discussion..."}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none pr-12 transition"
                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                disabled={!user} // OPTIONAL: Force login to comment?
            />
            <button 
                onClick={handlePost}
                disabled={!user || !newComment.trim()}
                className="absolute right-2 top-2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 transition"
            >
                <Send size={18} />
            </button>
        </div>
      </div>

      {/* LOGIN PROMPT (If not logged in) */}
      {!user && (
          <div className="mb-6 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg text-center">
              <p className="text-blue-400 text-sm">
                  <a href="/login" className="font-bold underline">Login</a> to leave a comment.
              </p>
          </div>
      )}

      {/* COMMENT LIST */}
      <div className="space-y-4">
        {loading ? (
            <div className="text-gray-600 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Loading comms...</div>
        ) : comments.length > 0 ? (
            comments.map((c) => (
                <div key={c.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-800 flex items-center justify-center shrink-0">
                         <span className="text-gray-400 font-bold text-sm">{c.user_email[0].toUpperCase()}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-bold text-sm">{c.user_email}</span>
                            <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 group-hover:text-white transition">{c.content}</p>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-gray-600 italic text-sm">No signals detected yet. Be the first.</div>
        )}
      </div>
    </div>
  );
}