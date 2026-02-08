"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Lock, Upload, BookOpen, Image as ImageIcon, CheckCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
  // --- AUTH STATE ---
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'novel' | 'manga'>('novel');

  // --- NOVEL STATE ---
  const [novelTitle, setNovelTitle] = useState("");
  const [novelChapter, setNovelChapter] = useState("");
  const [novelContent, setNovelContent] = useState("");
  
  // --- MANGA STATE ---
  const [mangaChapter, setMangaChapter] = useState("");
  const [mangaFiles, setMangaFiles] = useState<FileList | null>(null);

  // --- UI STATE ---
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

  // 2. NOVEL UPLOAD
  const handleNovelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from('novel_chapters')
      .insert([{ 
          title: novelTitle, 
          chapter_number: parseInt(novelChapter), 
          content: novelContent 
      }]);

    if (error) {
      console.error(error);
      setMessage("❌ Error uploading novel. Check console.");
    } else {
      setMessage("✅ Novel Chapter published!");
      setNovelTitle("");
      setNovelChapter("");
      setNovelContent("");
    }
    setLoading(false);
  };

  // 3. MANGA BATCH UPLOAD (The New Logic!)
  const handleMangaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangaFiles || mangaFiles.length === 0) return;

    setLoading(true);
    setMessage("⏳ Uploading pages... please wait.");

    const chapterId = parseInt(mangaChapter);
    let successCount = 0;

    // Loop through every file selected
    for (let i = 0; i < mangaFiles.length; i++) {
        const file = mangaFiles[i];
        const filePath = `ch-${chapterId}/${Date.now()}-${file.name}`; // Unique name

        // A. Upload Image to Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('manga-pages')
            .upload(filePath, file);

        if (uploadError) {
            console.error(`Error uploading ${file.name}`, uploadError);
            continue;
        }

        // B. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('manga-pages')
            .getPublicUrl(filePath);

        // C. Insert into Database
        const { error: dbError } = await supabase
            .from('manga_pages')
            .insert([{
                chapter_id: chapterId,
                page_number: i + 1, // Auto-numbering based on selection order
                image_url: publicUrl
            }]);

        if (!dbError) successCount++;
    }

    setMessage(`✅ Successfully uploaded ${successCount} pages for Chapter ${chapterId}!`);
    setLoading(false);
    setMangaFiles(null);
    setMangaChapter("");
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center shadow-2xl shadow-blue-900/20">
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
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition">Unlock System</button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Admin Dashboard</span>
            </h1>
            <div className="flex bg-gray-900 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('novel')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition ${activeTab === 'novel' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Novel
                </button>
                <button 
                    onClick={() => setActiveTab('manga')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition ${activeTab === 'manga' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Manga
                </button>
            </div>
        </div>

        {/* Feedback Message */}
        {message && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 animate-fade-in ${message.includes("Error") ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"}`}>
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                {message}
            </div>
        )}

        {/* --- TAB 1: NOVEL EDITOR --- */}
        {activeTab === 'novel' && (
            <form onSubmit={handleNovelUpload} className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4 text-blue-400">
                    <BookOpen size={24} /> <h2 className="text-xl font-bold">New Novel Chapter</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Chapter #</label>
                        <input type="number" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                            placeholder="3" value={novelChapter} onChange={(e) => setNovelChapter(e.target.value)} />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Title</label>
                        <input type="text" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                            placeholder="The Hidden Village" value={novelTitle} onChange={(e) => setNovelTitle(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Content</label>
                    <textarea required rows={12} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm leading-relaxed outline-none focus:border-blue-500 transition"
                        placeholder="It was a dark and stormy night..." value={novelContent} onChange={(e) => setNovelContent(e.target.value)} />
                </div>
                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2">
                    {loading ? "Publishing..." : <><Upload size={20} /> Publish Novel Chapter</>}
                </button>
            </form>
        )}

        {/* --- TAB 2: MANGA UPLOADER --- */}
        {activeTab === 'manga' && (
            <form onSubmit={handleMangaUpload} className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4 text-purple-400">
                    <ImageIcon size={24} /> <h2 className="text-xl font-bold">New Manga Release</h2>
                </div>

                <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center">
                    <label className="block text-sm font-bold text-gray-400 mb-4">Select Pages (In Order 1, 2, 3...)</label>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => setMangaFiles(e.target.files)}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-4">Supported: PNG, JPG, WEBP</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Chapter Number</label>
                    <input type="number" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500 transition"
                        placeholder="e.g. 5" value={mangaChapter} onChange={(e) => setMangaChapter(e.target.value)} />
                </div>

                <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2">
                    {loading ? "Uploading Pages..." : <><Upload size={20} /> Upload Manga Chapter</>}
                </button>
            </form>
        )}

      </div>
    </div>
  );
}