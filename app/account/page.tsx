"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, ShieldCheck, Bookmark, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 2. Get Bookmarks
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setBookmarks(data);
      setLoading(false);
    };
    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const removeBookmark = async (id: number) => {
    // Optimistic delete
    setBookmarks(bookmarks.filter(b => b.id !== id));
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 animate-pulse">Accessing Database...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <Link href="/" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition">
            <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-widest text-gray-500">Command Center</h1>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card (Left Col) */}
        <div className="md:col-span-1 bg-gray-900 border border-gray-800 p-6 rounded-3xl h-fit">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                    {user.email[0].toUpperCase()}
                </div>
                <h2 className="text-lg font-bold">Contractor</h2>
                <p className="text-gray-400 text-xs font-mono">{user.email}</p>
            </div>

            <button 
                onClick={handleLogout}
                className="w-full py-3 bg-red-900/20 border border-red-900/50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2 font-bold text-sm"
            >
                <LogOut size={16} /> Disconnect
            </button>
        </div>

        {/* Bookmarks List (Right Col - Spans 2) */}
        <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bookmark className="text-blue-500" /> Saved Archives
            </h3>

            {bookmarks.length === 0 ? (
                <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl p-10 text-center text-gray-500">
                    <p>No data found in memory.</p>
                    <Link href="/read" className="text-blue-400 hover:underline mt-2 inline-block">Start Reading</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookmarks.map((b) => (
                        <div key={b.id} className="group flex items-center justify-between bg-gray-900 border border-gray-800 p-4 rounded-xl hover:border-blue-500/50 transition">
                            <Link 
                                href={b.type === 'manga' ? `/read/${b.slug.replace('manga-', '')}` : `/novel/${b.slug.replace('novel-', '')}`}
                                className="flex items-center gap-4 flex-1"
                            >
                                <div className={`p-3 rounded-lg ${b.type === 'manga' ? 'bg-purple-900/20 text-purple-400' : 'bg-green-900/20 text-green-400'}`}>
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition">{b.title}</h4>
                                    <span className="text-xs text-gray-500 font-mono uppercase">{b.type} • {new Date(b.created_at).toLocaleDateString()}</span>
                                </div>
                            </Link>

                            <button 
                                onClick={() => removeBookmark(b.id)}
                                className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}