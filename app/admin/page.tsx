"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Lock, Upload, BookOpen, CheckCircle } from "lucide-react";

export default function AdminPage() {
  // STATE: Login System
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // STATE: Novel Upload Form
  const [title, setTitle] = useState("");
  const [chapterNum, setChapterNum] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. LOGIN FUNCTION
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Wrong password!");
    }
  };

  // 2. UPLOAD FUNCTION
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Send to Supabase
    const { error } = await supabase
      .from('novel_chapters')
      .insert([
        { 
          title: title, 
          chapter_number: parseInt(chapterNum), 
          content: content 
        }
      ]);

    if (error) {
      console.error(error);
      setMessage("❌ Error uploading chapter. Check console.");
    } else {
      setMessage("✅ Chapter published successfully!");
      // Clear form
      setTitle("");
      setChapterNum("");
      setContent("");
    }
    setLoading(false);
  };

  // --- VIEW 1: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center">
          <Lock className="mx-auto text-blue-500 mb-6" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Jody-Verse Admin</h1>
          <p className="text-gray-400 mb-6 text-sm">Enter the secret key to access the mainframe.</p>
          
          <input 
            type="password" 
            placeholder="Enter Password..." 
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition">
            Unlock System
          </button>
        </form>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD ---
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
            <BookOpen className="text-yellow-400" size={32} />
            <h1 className="text-3xl font-bold">Publish New Chapter</h1>
        </div>

        {/* Success Message */}
        {message && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.includes("Error") ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"}`}>
                <CheckCircle size={20} />
                {message}
            </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Row 1: Number & Title */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Chapter #</label>
                    <input 
                        type="number" 
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-blue-500 outline-none transition"
                        placeholder="2"
                        value={chapterNum}
                        onChange={(e) => setChapterNum(e.target.value)}
                    />
                </div>
                <div className="col-span-3">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Chapter Title</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:border-blue-500 outline-none transition"
                        placeholder="e.g. The Shadow Returns"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
            </div>

            {/* Row 2: Content */}
            <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Story Content (Paste here)</label>
                <textarea 
                    required
                    rows={15}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm leading-relaxed focus:border-blue-500 outline-none transition"
                    placeholder="Paste your 3,000 words here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Submit Button */}
            <button 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
            >
                {loading ? "Publishing..." : <><Upload size={20} /> Publish Chapter</>}
            </button>
        </form>

      </div>
    </div>
  );
}