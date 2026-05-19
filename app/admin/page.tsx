"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Lock, Upload, BookOpen, Image as ImageIcon, CheckCircle, Loader2, Trash2, AlertTriangle, FileBox, Shield, UploadCloud } from "lucide-react";
import * as mammoth from "mammoth";
// Notice we removed the top-level PDF.js import to save the server from crashing!

export default function AdminPage() {
  // --- AUTH STATE ---
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'novel' | 'manga'>('novel');

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --- NOVEL STATE ---
  const [novelTitle, setNovelTitle] = useState("");
  const [novelChapter, setNovelChapter] = useState("");
  const [novelContent, setNovelContent] = useState("");
  const [novelChaptersList, setNovelChaptersList] = useState<any[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // --- MANGA UPLOAD STATE ---
  const [selectedMangaId, setSelectedMangaId] = useState("1"); 
  const [mangaChapter, setMangaChapter] = useState("");
  const [mangaFiles, setMangaFiles] = useState<FileList | null>(null);

  // --- MANGA DELETE STATE ---
  const [deleteMangaId, setDeleteMangaId] = useState("1");
  const [deleteChapter, setDeleteChapter] = useState("");

  // ==========================================
  // 1. LIFECYCLE & AUTH
  // ==========================================
  useEffect(() => {
    if (isAuthenticated) {
      fetchNovelChapters();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Wrong password!");
    }
  };

  const fetchNovelChapters = async () => {
    const { data, error } = await supabase
      .from('novel_chapters')
      .select('*')
      .order('chapter_number', { ascending: false });

    if (!error && data) {
      setNovelChaptersList(data);
    }
  };

  // ==========================================
  // 2. NOVEL ENGINE (PARSE, UPLOAD, DELETE)
  // ==========================================
  
  // 📄 OMNI-PARSER (PDF, DOCX, TXT)
  const handleNovelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setMessage("⏳ Parsing document...");
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith(".txt")) {
        const text = await file.text();
        setNovelContent(text);
        setMessage("✅ TXT file parsed successfully!");
      } else if (fileName.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setNovelContent(result.value);
        setMessage("✅ DOCX file parsed successfully!");
      } else if (fileName.endsWith(".pdf")) {
        // 🚀 DYNAMIC IMPORT: This only runs in the browser when a PDF is actually dropped!
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          extractedText += pageText + "\n\n";
        }
        setNovelContent(extractedText);
        setMessage("⚠️ PDF parsed! Check text box for weird line breaks before deploying.");
      } else {
        setMessage("❌ Unsupported format. Use .pdf, .docx, or .txt");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Engine failed to read file. It might be corrupted.");
    }
    
    setIsProcessingFile(false);
  };

  const handleNovelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelChapter || !novelContent) {
        setMessage("❌ Chapter number and content are required.");
        return;
    }

    setLoading(true);
    setMessage("⏳ Publishing Novel Chapter...");

    const { error } = await supabase
      .from('novel_chapters')
      .insert([{ 
          title: novelTitle || `Chapter ${novelChapter}`, 
          chapter_number: parseFloat(novelChapter), 
          content: novelContent 
      }]);

    if (error) {
      console.error(error);
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Chapter ${novelChapter} published!`);
      setNovelTitle("");
      setNovelChapter("");
      setNovelContent("");
      fetchNovelChapters(); // Refresh vault
    }
    setLoading(false);
  };

  const handleDeleteNovelChapter = async (id: string, chapNum: number) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to completely erase Novel Chapter ${chapNum}?`)) return;

    setMessage(`🗑️ Scrubbing Chapter ${chapNum}...`);
    const { error } = await supabase.from("novel_chapters").delete().eq("id", id);
    
    if (error) {
      setMessage(`❌ Failed to delete: ${error.message}`);
    } else {
      setMessage(`✅ Novel Chapter ${chapNum} successfully purged.`);
      setNovelChaptersList(novelChaptersList.filter((c) => c.id !== id));
    }
  };

  // ==========================================
  // 3. MANGA ENGINE (UPLOAD, DELETE)
  // ==========================================
  const handleMangaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangaFiles || mangaFiles.length === 0) return;

    setLoading(true);
    setMessage("⏳ Analyzing database & uploading pages...");

    const chapterId = parseInt(mangaChapter);
    const mangaId = parseInt(selectedMangaId);
    let successCount = 0;

    const { data: existingChapter } = await supabase
        .from('manga_chapters')
        .select('*')
        .eq('manga_id', mangaId)
        .eq('chapter_number', chapterId)
        .single();

    if (!existingChapter) {
        await supabase
            .from('manga_chapters')
            .insert([{ manga_id: mangaId, chapter_number: chapterId, title: `Chapter ${chapterId}` }]);
    }

    const { data: maxPageData } = await supabase
        .from('manga_pages')
        .select('page_number')
        .eq('manga_id', mangaId)
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: false })
        .limit(1);

    const startingOffset = maxPageData && maxPageData.length > 0 ? maxPageData[0].page_number : 0;

    for (let i = 0; i < mangaFiles.length; i++) {
        const file = mangaFiles[i];
        const filePath = `manga-${mangaId}/ch-${chapterId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage.from('manga-pages').upload(filePath, file);

        if (uploadError) {
            console.error(`Error uploading ${file.name}`, uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('manga-pages').getPublicUrl(filePath);
        const exactPageNumber = startingOffset + i + 1;

        const { error: dbError } = await supabase
            .from('manga_pages')
            .insert([{ manga_id: mangaId, chapter_id: chapterId, page_number: exactPageNumber, image_url: publicUrl }]);

        if (!dbError) successCount++;
    }

    const mangaName = mangaId === 1 ? "Spectral Rift" : "Urithi";

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
        } catch (notifyErr) {
          console.error("Failed to send push notifications:", notifyErr);
        }
    }

    setMessage(`✅ Uploaded ${successCount} pages to ${mangaName} Chapter ${chapterId}!`);
    setLoading(false);
    setMangaFiles(null);
    setMangaChapter("");
  };

  const handleDeleteChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const chapId = parseInt(deleteChapter);
    const mId = parseInt(deleteMangaId);
    const mangaName = mId === 1 ? "Spectral Rift" : "Urithi";

    if (!confirm(`⚠️ DANGER: Are you absolutely sure you want to completely erase ${mangaName} Chapter ${chapId}?`)) return;

    setLoading(true);
    setMessage(`🗑️ Scrubbing ${mangaName} Chapter ${chapId} from the servers...`);

    const folderPath = `manga-${mId}/ch-${chapId}`;
    const { data: files } = await supabase.storage.from('manga-pages').list(folderPath);
    
    if (files && files.length > 0) {
        const filePaths = files.map(f => `${folderPath}/${f.name}`);
        await supabase.storage.from('manga-pages').remove(filePaths);
    }

    await supabase.from('manga_pages').delete().match({ manga_id: mId, chapter_id: chapId });
    await supabase.from('manga_chapters').delete().match({ manga_id: mId, chapter_number: chapId });
    await supabase.from('comments').delete().match({ slug: `manga-${mId}-ch-${chapId}` });

    setMessage(`✅ ${mangaName} Chapter ${chapId} has been completely erased.`);
    setLoading(false);
    setDeleteChapter("");
  };

  // ==========================================
  // RENDER: LOGIN GATE
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center shadow-2xl shadow-blue-900/20">
          <Lock className="mx-auto text-blue-500 mb-6" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Jody-Verse Admin</h1>
          <p className="text-gray-400 mb-6 text-sm">Enter the secret key to access the mainframe.</p>
          <input 
            type="password" placeholder="Enter Password..." value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition">Unlock System</button>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER: DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-600">Admin Dashboard</span>
            </h1>
            <div className="flex bg-gray-900 p-1 rounded-lg">
                <button 
                    onClick={() => { setActiveTab('novel'); setMessage(""); }}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition ${activeTab === 'novel' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Novel</button>
                <button 
                    onClick={() => { setActiveTab('manga'); setMessage(""); }}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition ${activeTab === 'manga' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Manga</button>
            </div>
        </div>

        {/* STATUS MESSAGES */}
        {message && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 animate-fade-in ${message.includes("❌") || message.includes("DANGER") ? "bg-red-900/50 text-red-200 border border-red-500/50" : message.includes("⚠️") ? "bg-yellow-900/50 text-yellow-200 border border-yellow-500/50" : "bg-green-900/50 text-green-200 border border-green-500/50"}`}>
                {loading || isProcessingFile ? <Loader2 className="animate-spin" /> : message.includes("❌") ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                {message}
            </div>
        )}

        {/* ========================================================= */}
        {/* TAB: NOVEL OPERATIONS */}
        {/* ========================================================= */}
        {activeTab === 'novel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* LEFT: UPLOAD ENGINE */}
              <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                  <UploadCloud size={20} /> Publish Novel Chapter
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Chapter #</label>
                    <input type="number" required value={novelChapter} onChange={(e) => setNovelChapter(e.target.value)} placeholder="e.g. 12" className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Title (Optional)</label>
                    <input type="text" value={novelTitle} onChange={(e) => setNovelTitle(e.target.value)} placeholder="The Awakening" className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 transition" />
                  </div>
                </div>

                {/* DROPZONE */}
                <div className="mb-6 relative">
                  <input type="file" accept=".txt,.docx,.pdf" onChange={handleNovelFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/80 bg-blue-500/5 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors">
                    {isProcessingFile ? <Loader2 size={32} className="text-blue-500 animate-spin mb-3" /> : <FileBox size={32} className="text-blue-500 mb-3" />}
                    <h3 className="text-sm font-bold text-white mb-1">Upload Manuscript</h3>
                    <p className="text-xs text-gray-500">Drop a <strong className="text-gray-300">.pdf</strong>, <strong className="text-gray-300">.docx</strong>, or <strong className="text-gray-300">.txt</strong> file</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold text-gray-400 mb-2 flex justify-between">
                    <span>Chapter Content Preview</span>
                    <span className="text-blue-400 text-xs">{novelContent.length} chars</span>
                  </label>
                  <textarea value={novelContent} onChange={(e) => setNovelContent(e.target.value)} placeholder="File text will appear here. Edit formatting as needed before deploying..." className="w-full h-64 bg-black border border-gray-700 rounded-xl p-4 font-mono text-sm leading-relaxed outline-none focus:border-blue-500 transition resize-none" />
                </div>

                <button onClick={handleNovelUpload} disabled={loading || isProcessingFile} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2">
                  {loading ? "Deploying..." : "Deploy Novel Chapter"}
                </button>
              </div>

              {/* RIGHT: NOVEL VAULT (DELETION) */}
              <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col">
                <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                  <Shield size={20} /> Chapter Vault
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: "600px" }}>
                  {novelChaptersList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">No novel chapters published yet.</div>
                  ) : (
                    novelChaptersList.map((chapter) => (
                      <div key={chapter.id} className="flex items-center justify-between p-4 rounded-xl bg-black border border-gray-800 hover:border-gray-600 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-white">Chapter {chapter.chapter_number}</h4>
                          <span className="text-xs text-gray-500 block truncate w-40">{chapter.title}</span>
                        </div>
                        <button onClick={() => handleDeleteNovelChapter(chapter.id, chapter.chapter_number)} className="p-2 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white transition-colors" title="Annihilate Chapter">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MANGA OPERATIONS */}
        {/* ========================================================= */}
        {activeTab === 'manga' && (
            <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
                {/* UPLOAD SECTION */}
                <form onSubmit={handleMangaUpload} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-purple-400">
                            <ImageIcon size={24} /> <h2 className="text-xl font-bold">Upload Manga Pages</h2>
                        </div>
                        <select value={selectedMangaId} onChange={(e) => setSelectedMangaId(e.target.value)} className="bg-black border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 outline-none font-bold">
                            <option value="1">📖 Spectral Rift</option>
                            <option value="2">🗡️ Urithi</option>
                        </select>
                    </div>

                    <div className="bg-black border border-dashed border-gray-700 rounded-xl p-8 text-center">
                        <label className="block text-sm font-bold text-gray-400 mb-4">Select Pages (Max 100 per batch)</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => setMangaFiles(e.target.files)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer" />
                        <p className="text-xs text-gray-500 mt-4">Supported: PNG, JPG, WEBP</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Chapter Number</label>
                        <input type="number" required value={mangaChapter} onChange={(e) => setMangaChapter(e.target.value)} placeholder="e.g. 1" className="w-full bg-black border border-gray-700 rounded-lg p-3 outline-none focus:border-purple-500 transition text-white" />
                    </div>

                    <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2">
                        {loading ? "Processing..." : <><Upload size={20} /> Upload Batch</>}
                    </button>
                </form>

                {/* DANGER ZONE - DELETE SECTION */}
                <form onSubmit={handleDeleteChapter} className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 text-red-500 mb-6">
                        <AlertTriangle size={24} /> <h2 className="text-xl font-bold">Danger Zone</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-red-400/80 mb-2">Select Manga</label>
                            <select value={deleteMangaId} onChange={(e) => setDeleteMangaId(e.target.value)} className="w-full bg-black border border-red-900/50 text-white text-sm rounded-lg focus:ring-red-500 outline-none block p-3">
                                <option value="1">Spectral Rift</option>
                                <option value="2">Urithi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-red-400/80 mb-2">Chapter to Delete</label>
                            <input type="number" required value={deleteChapter} onChange={(e) => setDeleteChapter(e.target.value)} placeholder="e.g. 8" className="w-full bg-black border border-red-900/50 rounded-lg p-3 outline-none focus:border-red-500 transition text-white" />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-red-900/80 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-2">
                        {loading ? "Purging..." : <><Trash2 size={20} /> Completely Erase Chapter</>}
                    </button>
                </form>
            </div>
        )}

      </div>
    </div>
  );
}