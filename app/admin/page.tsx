"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Lock, Upload, BookOpen, Image as ImageIcon, CheckCircle, Loader2, Trash2, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  // --- AUTH STATE ---
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'novel' | 'manga'>('novel');

  // --- NOVEL STATE ---
  const [novelTitle, setNovelTitle] = useState("");
  const [novelChapter, setNovelChapter] = useState("");
  const [novelContent, setNovelContent] = useState("");
  
  // --- MANGA UPLOAD STATE ---
  const [selectedMangaId, setSelectedMangaId] = useState("1"); 
  const [mangaChapter, setMangaChapter] = useState("");
  const [mangaFiles, setMangaFiles] = useState<FileList | null>(null);

  // --- MANGA DELETE STATE ---
  const [deleteMangaId, setDeleteMangaId] = useState("1");
  const [deleteChapter, setDeleteChapter] = useState("");

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

  // 3. SMART MANGA BATCH UPLOAD (Fixes the >100 pages scrambling)
  const handleMangaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangaFiles || mangaFiles.length === 0) return;

    setLoading(true);
    setMessage("⏳ Analyzing database & uploading pages...");

    const chapterId = parseInt(mangaChapter);
    const mangaId = parseInt(selectedMangaId);
    let successCount = 0;

    // A. CHECK IF CHAPTER ALREADY EXISTS
    const { data: existingChapter } = await supabase
        .from('manga_chapters')
        .select('*')
        .eq('manga_id', mangaId)
        .eq('chapter_number', chapterId)
        .single();

    // Only create it if it doesn't exist yet
    if (!existingChapter) {
        await supabase
            .from('manga_chapters')
            .insert([{ 
                manga_id: mangaId, 
                chapter_number: chapterId, 
                title: `Chapter ${chapterId}` 
            }]);
    }

    // B. FIND THE LAST PAGE NUMBER (To prevent scrambling on batch 2)
    const { data: maxPageData } = await supabase
        .from('manga_pages')
        .select('page_number')
        .eq('manga_id', mangaId)
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: false })
        .limit(1);

    const startingOffset = maxPageData && maxPageData.length > 0 ? maxPageData[0].page_number : 0;

    // C. UPLOAD PAGES WITH CORRECT ORDER
    for (let i = 0; i < mangaFiles.length; i++) {
        const file = mangaFiles[i];
        const filePath = `manga-${mangaId}/ch-${chapterId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from('manga-pages')
            .upload(filePath, file);

        if (uploadError) {
            console.error(`Error uploading ${file.name}`, uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('manga-pages')
            .getPublicUrl(filePath);

        // Calculate exact page number based on existing pages
        const exactPageNumber = startingOffset + i + 1;

        const { error: dbError } = await supabase
            .from('manga_pages')
            .insert([{
                manga_id: mangaId, 
                chapter_id: chapterId, 
                page_number: exactPageNumber, // Assigns 101, 102, etc.
                image_url: publicUrl
            }]);

        if (!dbError) successCount++;
    }

    const mangaName = mangaId === 1 ? "Spectral Rift" : "Urithi";

    // 📢 D. BLAST NOTIFICATION (ONLY if it's the very first batch)
    if (startingOffset === 0) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `🗡️ New ${mangaName} Drop!`,
              body: `Chapter ${chapterId} has officially been uploaded. Read it now!`,
              url: `/read/${chapterId}?manga=${mangaId}`
            })
          });
          console.log("Notification broadcast sent!");
        } catch (notifyErr) {
          console.error("Failed to send push notifications:", notifyErr);
        }
    }

    setMessage(`✅ Uploaded ${successCount} pages to ${mangaName} Chapter ${chapterId}!`);
    setLoading(false);
    setMangaFiles(null);
    setMangaChapter("");
  };

  // 4. SMART DELETE SCRIPT
  const handleDeleteChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const chapId = parseInt(deleteChapter);
    const mId = parseInt(deleteMangaId);
    const mangaName = mId === 1 ? "Spectral Rift" : "Urithi";

    if (!confirm(`⚠️ DANGER: Are you absolutely sure you want to completely erase ${mangaName} Chapter ${chapId}? This cannot be undone.`)) {
        return;
    }

    setLoading(true);
    setMessage(`🗑️ Scrubbing ${mangaName} Chapter ${chapId} from the servers...`);

    // A. FIND AND DELETE ALL STORAGE FILES
    const folderPath = `manga-${mId}/ch-${chapId}`;
    const { data: files } = await supabase.storage.from('manga-pages').list(folderPath);
    
    if (files && files.length > 0) {
        // Map out the exact paths to tell Supabase what to delete
        const filePaths = files.map(f => `${folderPath}/${f.name}`);
        await supabase.storage.from('manga-pages').remove(filePaths);
    }

    // B. DELETE DATABASE RECORDS
    await supabase.from('manga_pages').delete().match({ manga_id: mId, chapter_id: chapId });
    await supabase.from('manga_chapters').delete().match({ manga_id: mId, chapter_number: chapId });
    // Optional cleanup of comments
    await supabase.from('comments').delete().match({ slug: `manga-${mId}-ch-${chapId}` });

    setMessage(`✅ ${mangaName} Chapter ${chapId} has been completely erased.`);
    setLoading(false);
    setDeleteChapter("");
  };

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

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-600">Admin Dashboard</span>
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

        {message && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 animate-fade-in ${message.includes("Error") ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"}`}>
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                {message}
            </div>
        )}

        {/* --- NOVEL TAB --- */}
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

        {/* --- MANGA TAB --- */}
        {activeTab === 'manga' && (
            <div className="space-y-12 animate-fade-in">
                {/* UPLOAD SECTION */}
                <form onSubmit={handleMangaUpload} className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-purple-400">
                            <ImageIcon size={24} /> <h2 className="text-xl font-bold">Upload Manga Pages</h2>
                        </div>
                        
                        <select 
                            value={selectedMangaId}
                            onChange={(e) => setSelectedMangaId(e.target.value)}
                            className="bg-gray-800 border border-purple-500 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none font-bold"
                        >
                            <option value="1">📖 Spectral Rift</option>
                            <option value="2">🗡️ Urithi</option>
                        </select>
                    </div>

                    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center">
                        <label className="block text-sm font-bold text-gray-400 mb-4">Select Pages (Max 100 per batch)</label>
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
                            placeholder="e.g. 1" value={mangaChapter} onChange={(e) => setMangaChapter(e.target.value)} />
                    </div>

                    <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2">
                        {loading ? "Processing..." : <><Upload size={20} /> Upload Batch</>}
                    </button>
                </form>

                {/* DANGER ZONE - DELETE SECTION */}
                <form onSubmit={handleDeleteChapter} className="pt-8 border-t border-red-900/30">
                    <div className="flex items-center gap-3 text-red-500 mb-6">
                        <AlertTriangle size={24} /> <h2 className="text-xl font-bold">Danger Zone</h2>
                    </div>
                    
                    <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-bold text-red-400/80 mb-2">Select Manga</label>
                                <select 
                                    value={deleteMangaId}
                                    onChange={(e) => setDeleteMangaId(e.target.value)}
                                    className="w-full bg-black border border-red-900/50 text-white text-sm rounded-lg focus:ring-red-500 outline-none block p-3"
                                >
                                    <option value="1">Spectral Rift</option>
                                    <option value="2">Urithi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-red-400/80 mb-2">Chapter to Delete</label>
                                <input type="number" required className="w-full bg-black border border-red-900/50 rounded-lg p-3 outline-none focus:border-red-500 transition text-white"
                                    placeholder="e.g. 8" value={deleteChapter} onChange={(e) => setDeleteChapter(e.target.value)} />
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-red-900/80 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
                            {loading ? "Purging..." : <><Trash2 size={20} /> Completely Erase Chapter</>}
                        </button>
                    </div>
                </form>
            </div>
        )}

      </div>
    </div>
  );
}