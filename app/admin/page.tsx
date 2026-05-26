"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Lock, Upload, Image as ImageIcon, CheckCircle,
  Loader2, Trash2, AlertTriangle, FileBox, Shield,
  UploadCloud, Wand2, Eye, EyeOff, RefreshCw, X, BookOpen
} from "lucide-react";
import * as mammoth from "mammoth";

// ─────────────────────────────────────────────────────────────
// SMART CHAPTER FORMATTER
// Tuned specifically for Jody-Verse chapter format:
//
// Handles:
//  - 📖 CHAPTER X – Scene Y: "Title" headers → clean section break
//  - Location: / Time: metadata lines → styled label
//  - CUT TO: / CUT BACK TO: / --- dividers → scene separators
//  - > quoted/inner-monologue lines → preserved
//  - Stray characters like "B " prefix artefacts
//  - ALL-CAPS body paragraphs → sentence case
//  - Collapsed single-newline paragraphs → proper breaks
//  - Double spaces, trailing whitespace
//  - PDF page number orphan lines
//  - Normalised quotes, em dashes, ellipsis
// ─────────────────────────────────────────────────────────────
function smartFormatChapter(raw: string): { text: string; changes: string[] } {
  if (!raw) return { text: "", changes: [] };
  const changes: string[] = [];
  let text = raw;

  // 1. Normalise line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. HTML entities
  text = text.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
             .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  // 3. Remove lone page-number lines (bare digits on their own line)
  const beforePageNums = text;
  text = text.split("\n").filter(line => !/^\s*\d{1,4}\s*$/.test(line)).join("\n");
  if (text !== beforePageNums) changes.push("Removed PDF page number lines");

  // 4. Clean stray artefact prefixes e.g. "B " at line start (common in mammoth DOCX parse)
  const beforeArtefacts = text;
  text = text.replace(/^B\s+(?=[A-Z"'])/gm, "");
  if (text !== beforeArtefacts) changes.push("Removed stray character artefacts");

  // 5. Normalise SCENE / CHAPTER headers
  //    Matches: "📖 CHAPTER 3 – Scene 1: "Title"" or "CHAPTER 3 - Scene 1" etc.
  const beforeScene = text;
  text = text.replace(
    /[📖\s]*(chapter\s+\d+[\s–\-]+scene\s+\d+[:\s–\-]*["""]?[^"\n]*["""]?)/gi,
    (match) => {
      const clean = match.replace(/^[📖\s]+/, "").trim();
      return `\n\n\n━━━ ${clean.toUpperCase()} ━━━\n\n`;
    }
  );
  if (text !== beforeScene) changes.push("Formatted chapter/scene headers");

  // 6. Normalise Location / Time metadata lines
  const beforeMeta = text;
  text = text.replace(
    /^(Location|Time)\s*:\s*(.+)$/gim,
    (_, label, value) => `[${label.toUpperCase()}: ${value.trim()}]`
  );
  if (text !== beforeMeta) changes.push("Formatted Location/Time metadata labels");

  // 7. Normalise --- dividers and CUT TO markers into clean separators
  const beforeDividers = text;
  text = text.replace(/^---+\s*$/gm, "\n\n—\n\n");
  text = text.replace(/^(CUT TO:|CUT BACK TO:)\s*(📍[^\n]*)?/gim, (match) => {
    return `\n\n— ${match.trim()} —\n\n`;
  });
  if (text !== beforeDividers) changes.push("Normalised scene dividers and CUT TO markers");

  // 8. Handle > inner-monologue / quote lines — preserve them, just clean spacing
  text = text.replace(/^>\s*/gm, "  ❝ ");

  // 9. Smart paragraph recovery: if very few \n\n but many \n, convert
  const doubleBreaks = (text.match(/\n\n/g) || []).length;
  const singleBreaks = (text.match(/(?<!\n)\n(?!\n)/g) || []).length;
  if (doubleBreaks < 5 && singleBreaks > 8) {
    text = text.replace(/(?<!\n)\n(?!\n)/g, "\n\n");
    changes.push("Converted single line breaks to paragraph breaks");
  }

  // 10. Fix ALL-CAPS body paragraphs → sentence case
  //     Skip: short lines (≤6 words, likely headers), lines starting with [, ━, —, ❝
  const paras = text.split(/\n\n+/);
  let capsFixed = 0;
  const fixedParas = paras.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return "";
    if (/^[\[━—❝\-]/.test(trimmed)) return trimmed; // preserve markers
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 6) return trimmed; // short = likely a header, keep
    const letters = trimmed.replace(/[^a-zA-Z]/g, "");
    const uppers  = trimmed.replace(/[^A-Z]/g, "");
    if (letters.length > 0 && uppers.length / letters.length > 0.72 && letters.length > 20) {
      capsFixed++;
      return trimmed.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase());
    }
    return trimmed;
  });
  if (capsFixed > 0) changes.push(`Fixed ${capsFixed} ALL-CAPS paragraph${capsFixed > 1 ? "s" : ""} to sentence case`);
  text = fixedParas.filter(Boolean).join("\n\n");

  // 11. Normalise punctuation
  const beforePunct = text;
  text = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "—")
    .replace(/\u2013/g, "–")
    .replace(/\.{3}/g, "…");
  if (text !== beforePunct) changes.push("Normalised quotes and punctuation");

  // 12. Double spaces + trailing whitespace per line
  text = text.split("\n").map(l => l.replace(/ {2,}/g, " ").trimEnd()).join("\n");

  // 13. Collapse 3+ blank lines to max 2
  text = text.replace(/\n{3,}/g, "\n\n");

  return { text: text.trim(), changes };
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface NovelChapter {
  id: string;
  chapter_number: number;
  title: string;
  created_at: string;
}

type MsgType = "success" | "error" | "warn" | "info";
interface Msg { text: string; type: MsgType; }

// ─────────────────────────────────────────────────────────────
// COLOUR TOKENS  — blue / purple / violet / white palette
// ─────────────────────────────────────────────────────────────
const C = {
  bg:           "#06040f",
  surface:      "rgba(20,14,50,0.7)",
  border:       "rgba(139,159,232,0.12)",
  borderHover:  "rgba(139,159,232,0.28)",
  accent:       "#7C6FE8",       // violet
  accentMid:    "#5546C8",       // indigo
  accentDark:   "#3D2FA0",       // deep indigo
  accentBlue:   "#4F8EF7",       // bright blue
  gold:         "#C9973A",
  text:         "#D4CCEE",
  subtext:      "rgba(179,193,240,0.45)",
  danger:       "rgba(239,68,68,0.8)",
  dangerBorder: "rgba(239,68,68,0.2)",
  dangerBg:     "rgba(239,68,68,0.05)",
  purple:       "#9B6FE8",
};

const MSG_STYLES: Record<MsgType, { bg: string; border: string; text: string }> = {
  success: { bg: "rgba(79,142,247,0.07)", border: "rgba(79,142,247,0.25)", text: "#93C5FD" },
  error:   { bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.28)",  text: "#FCA5A5" },
  warn:    { bg: "rgba(155,111,232,0.09)",border: "rgba(155,111,232,0.3)", text: "#C4B5FD" },
  info:    { bg: "rgba(139,159,232,0.07)",border: "rgba(139,159,232,0.2)", text: "#A5B4FC" },
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword]           = useState("");
  const [isAuthenticated, setIsAuth]      = useState(false);
  const [activeTab, setActiveTab]         = useState<"novel" | "manga">("novel");
  const [loading, setLoading]             = useState(false);
  const [msg, setMsg]                     = useState<Msg | null>(null);

  // Novel
  const [novelTitle, setNovelTitle]       = useState("");
  const [novelChapter, setNovelChapter]   = useState("");
  const [novelContent, setNovelContent]   = useState("");
  const [chaptersList, setChaptersList]   = useState<NovelChapter[]>([]);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [isFormatting, setIsFormatting]   = useState(false);
  const [formatChanges, setFormatChanges] = useState<string[]>([]);
  const [showPreview, setShowPreview]     = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // Manga
  const [selectedMangaId, setMangaId]     = useState("1");
  const [mangaChapter, setMangaChapter]   = useState("");
  const [mangaFiles, setMangaFiles]       = useState<FileList | null>(null);
  const [deleteMangaId, setDelMangaId]    = useState("1");
  const [deleteChapter, setDeleteChapter] = useState("");

  // ── AUTH ──────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuth(true);
    } else {
      setMsg({ text: "Wrong password. Access denied.", type: "error" });
    }
  };

  // ── FETCH CHAPTERS ────────────────────────
  const fetchChapters = useCallback(async () => {
    const { data, error } = await supabase
      .from("novel_chapters")
      .select("id, chapter_number, title, created_at")
      .order("chapter_number", { ascending: false });
    if (error) {
      setMsg({ text: `Could not load chapters: ${error.message}`, type: "error" });
    } else {
      setChaptersList(data || []);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchChapters(); }, [isAuthenticated, fetchChapters]);

  // ── FILE PARSER ───────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setFormatChanges([]);
    setMsg({ text: "Parsing document…", type: "info" });

    const ext = file.name.toLowerCase();
    let rawText = "";

    try {
      if (ext.endsWith(".txt")) {
        rawText = await file.text();
      } else if (ext.endsWith(".docx")) {
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        rawText = result.value;
      } else if (ext.endsWith(".pdf")) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          rawText += tc.items.map((it: any) => it.str).join(" ") + "\n\n";
        }
      } else {
        setMsg({ text: "Unsupported format. Use .pdf, .docx, or .txt", type: "error" });
        setIsProcessing(false);
        return;
      }

      // Auto-format immediately
      setIsFormatting(true);
      const { text: formatted, changes } = smartFormatChapter(rawText);
      setNovelContent(formatted);
      setFormatChanges(changes);
      setIsFormatting(false);

      setMsg({
        text: changes.length > 0
          ? `Parsed & formatted — ${changes.length} fix${changes.length > 1 ? "es" : ""} applied.`
          : "Parsed successfully. Content looks clean.",
        type: "success"
      });
    } catch (err) {
      console.error(err);
      setMsg({ text: "Failed to read file. It may be corrupted.", type: "error" });
    }
    setIsProcessing(false);
  };

  // ── MANUAL FORMAT ─────────────────────────
  const handleManualFormat = () => {
    if (!novelContent.trim()) return;
    setIsFormatting(true);
    setFormatChanges([]);
    setTimeout(() => {
      const { text, changes } = smartFormatChapter(novelContent);
      setNovelContent(text);
      setFormatChanges(changes);
      setIsFormatting(false);
      setMsg({
        text: changes.length > 0
          ? `${changes.length} fix${changes.length > 1 ? "es" : ""} applied.`
          : "Content already looks clean.",
        type: changes.length > 0 ? "success" : "info"
      });
    }, 80);
  };

  // ── NOVEL UPLOAD ──────────────────────────
  const handleNovelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelChapter || !novelContent.trim()) {
      setMsg({ text: "Chapter number and content are required.", type: "error" });
      return;
    }

    const chapNum = parseFloat(novelChapter);

    // Guard: check if chapter already exists
    const { data: existing } = await supabase
      .from("novel_chapters")
      .select("id")
      .eq("chapter_number", chapNum)
      .maybeSingle();

    if (existing) {
      setMsg({ text: `Chapter ${chapNum} already exists. Delete it first or use a different number.`, type: "warn" });
      return;
    }

    setLoading(true);
    setMsg({ text: "Publishing…", type: "info" });

    const { error } = await supabase.from("novel_chapters").insert([{
      title: novelTitle.trim() || `Chapter ${chapNum}`,
      chapter_number: chapNum,
      content: novelContent.trim(),
    }]);

    if (error) {
      setMsg({ text: `Upload failed: ${error.message}`, type: "error" });
    } else {
      setMsg({ text: `Chapter ${chapNum} published!`, type: "success" });
      setNovelTitle(""); setNovelChapter(""); setNovelContent(""); setFormatChanges([]);
      await fetchChapters(); // always re-fetch from DB
    }
    setLoading(false);
  };

  // ── NOVEL DELETE — FIXED ──────────────────
  // Root cause of the ghost-chapter bug:
  // The anon key may have RLS that silently returns success but deletes 0 rows.
  // Fix: after delete, verify by trying to fetch the row. If it still exists → show real error.
  const handleDeleteNovel = async (id: string, chapNum: number) => {
    if (!window.confirm(`Delete Novel Chapter ${chapNum}? This cannot be undone.`)) return;

    setDeletingId(id);
    setMsg({ text: `Deleting chapter ${chapNum}…`, type: "info" });

    // Step 1: attempt delete
    const { error: delError } = await supabase
      .from("novel_chapters")
      .delete()
      .eq("id", id);

    if (delError) {
      setMsg({ text: `Delete failed: ${delError.message}`, type: "error" });
      setDeletingId(null);
      return;
    }

    // Step 2: verify it's actually gone (catches silent RLS failures)
    const { data: stillExists } = await supabase
      .from("novel_chapters")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (stillExists) {
      // Row is still there — RLS blocked the delete silently
      setMsg({
        text: `Chapter ${chapNum} was not deleted. This is likely a Supabase RLS (Row Level Security) policy issue. Go to your Supabase dashboard → Table Editor → novel_chapters → Policies, and add a DELETE policy allowing the anon role, or use the service_role key for admin operations.`,
        type: "error"
      });
      setDeletingId(null);
      // Still re-fetch so UI matches DB truth
      await fetchChapters();
      return;
    }

    // Step 3: success — re-fetch from DB (never trust local filter alone)
    setMsg({ text: `Chapter ${chapNum} deleted successfully.`, type: "success" });
    await fetchChapters();
    setDeletingId(null);
  };

  // ── MANGA UPLOAD ──────────────────────────
  const handleMangaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangaFiles || mangaFiles.length === 0 || !mangaChapter) return;
    setLoading(true);
    setMsg({ text: "Uploading pages to Cloudflare R2…", type: "info" });

    const chapterId = parseInt(mangaChapter);
    const mangaId   = parseInt(selectedMangaId);
    let successCount = 0;

    const { data: existing } = await supabase.from("manga_chapters").select("*")
      .eq("manga_id", mangaId).eq("chapter_number", chapterId).single();
    if (!existing) {
      await supabase.from("manga_chapters").insert([{
        manga_id: mangaId, chapter_number: chapterId, title: `Chapter ${chapterId}`
      }]);
    }

    const { data: maxPageData } = await supabase.from("manga_pages").select("page_number")
      .eq("manga_id", mangaId).eq("chapter_id", chapterId)
      .order("page_number", { ascending: false }).limit(1);
    const offset = maxPageData?.length ? maxPageData[0].page_number : 0;

    for (let i = 0; i < mangaFiles.length; i++) {
      const file = mangaFiles[i];
      const r2Path = `manga-${mangaId}/ch-${chapterId}/${Date.now()}-${mangaId}-${file.name}`;

      // Upload to Cloudflare R2 via server API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", r2Path);

      let publicUrl = "";
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        publicUrl = json.url;
      } catch (err) {
        console.error("R2 upload failed:", err);
        setMsg({ text: `Page ${i + 1} upload failed. Check console.`, type: "error" });
        continue;
      }

      const { error: dbErr } = await supabase.from("manga_pages").insert([{
        manga_id: mangaId, chapter_id: chapterId,
        page_number: offset + i + 1, image_url: publicUrl
      }]);
      if (!dbErr) successCount++;
    }

    const mangaName = mangaId === 1 ? "Spectral Rift" : mangaId === 2 ? "Urithi" : "Katikati";
    if (offset === 0) {
      try {
        await fetch("/api/notify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `🗡️ New ${mangaName} Drop!`,
            body: `Chapter ${chapterId} is live. Read it now!`,
            url: `/read/${chapterId}?manga=${mangaId}`
          })
        });
      } catch {}
    }

    setMsg({ text: `Uploaded ${successCount}/${mangaFiles.length} pages to ${mangaName} Ch. ${chapterId}.`, type: "success" });
    setMangaFiles(null); setMangaChapter("");
    setLoading(false);
  };

  // ── MANGA DELETE ──────────────────────────
  const handleMangaDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const chapId    = parseInt(deleteChapter);
    const mId       = parseInt(deleteMangaId);
    const mangaName = mId === 1 ? "Spectral Rift" : mId === 2 ? "Urithi" : "Katikati";
    if (!confirm(`Delete ${mangaName} Chapter ${chapId}? This is permanent.`)) return;

    setLoading(true);
    setMsg({ text: `Deleting ${mangaName} Ch. ${chapId}…`, type: "info" });

    // Delete from Cloudflare R2
    const r2Prefix = `manga-${mId}/ch-${chapId}/`;
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: r2Prefix }),
      });
    } catch (err) {
      console.warn("R2 delete warning:", err);
    }

    // Delete database records
    await supabase.from("manga_pages").delete().match({ manga_id: mId, chapter_id: chapId });
    await supabase.from("manga_chapters").delete().match({ manga_id: mId, chapter_number: chapId });
    await supabase.from("comments").delete().match({ slug: `manga-${mId}-ch-${chapId}` });

    setMsg({ text: `${mangaName} Chapter ${chapId} erased.`, type: "success" });
    setDeleteChapter(""); setLoading(false);
  };

  // ─────────────────────────────────────────────
  // RENDER: LOGIN
  // ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=DM+Sans:wght@400;600;700&display=swap');`}</style>
        <form onSubmit={handleLogin} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 24, padding: "48px 36px", width: "100%", maxWidth: 400,
          textAlign: "center", boxShadow: `0 24px 80px rgba(85,70,200,0.25)`
        }}>
          {/* Glow icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: "0 auto 24px",
            background: `linear-gradient(135deg, ${C.accentMid}, ${C.accentDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 32px rgba(85,70,200,0.5)`
          }}>
            <Lock size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#fff", marginBottom: 8 }}>
            Jody-Verse Admin
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: C.subtext, marginBottom: 28 }}>
            Enter the secret key to access the dashboard.
          </p>
          {msg && <p style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 14 }}>{msg.text}</p>}
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: "100%", background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.border}`, borderRadius: 12,
              padding: "13px 16px", color: "#fff", fontFamily: "'DM Sans'",
              fontSize: 14, outline: "none", marginBottom: 14
            }}
          />
          <button type="submit" style={{
            width: "100%",
            background: `linear-gradient(135deg, ${C.accentMid}, ${C.accentDark})`,
            border: `1px solid rgba(179,193,240,0.18)`, borderRadius: 12,
            padding: 14, color: "#fff", fontFamily: "'DM Sans'",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer"
          }}>
            Unlock System
          </button>
        </form>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: DASHBOARD
  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=DM+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { color: #D4CCEE !important; }
        input::placeholder, textarea::placeholder { color: rgba(179,193,240,0.28) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,111,232,0.3); border-radius: 2px; }
        .field { 
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(139,159,232,0.12); border-radius: 12px;
          padding: 12px 14px; font-family: 'DM Sans',sans-serif;
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .field:focus { border-color: rgba(124,111,232,0.45); }
        select.field option { background: #0e0a20; }
        .pill-btn {
          display:flex; align-items:center; justify-content:center; gap:7px;
          padding: 13px 20px; border-radius: 12px;
          font-family:'DM Sans'; font-weight:700; font-size:12px;
          letter-spacing:0.06em; cursor:pointer; border:none;
          transition: all 0.2s ease;
        }
        .card {
          background: rgba(14,10,36,0.6);
          border: 1px solid rgba(139,159,232,0.1);
          border-radius: 20px; padding: 26px;
        }
        .lbl {
          display: block; font-size: 10px; font-weight: 700;
          letter-spacing: 0.25em; text-transform: uppercase;
          color: rgba(179,193,240,0.45); margin-bottom: 8px;
        }
        .vault-row {
          display:flex; align-items:center; justify-content:space-between;
          padding: 13px 14px; border-radius:12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(139,159,232,0.07);
          transition: border-color 0.2s;
        }
        .vault-row:hover { border-color: rgba(139,159,232,0.2); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 24px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo mark */}
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${C.accentMid}, ${C.accentDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 20px rgba(85,70,200,0.4)`
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L14.5 9.5H21L15.5 13.5L17.5 20L12 16L6.5 20L8.5 13.5L3 9.5H9.5L12 3Z" fill="rgba(255,255,255,0.95)" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 18, color: "#fff", lineHeight: 1 }}>Admin Dashboard</h1>
              <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: C.subtext, marginTop: 3 }}>Jody-Verse Control Centre</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, gap: 4
          }}>
            {(["novel", "manga"] as const).map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setMsg(null); }}
                style={{
                  padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: activeTab === tab
                    ? tab === "novel"
                      ? `linear-gradient(135deg, ${C.accentMid}, ${C.accentDark})`
                      : `linear-gradient(135deg, ${C.purple}, #6B21A8)`
                    : "transparent",
                  color: activeTab === tab ? "#fff" : C.subtext,
                  fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 11,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  boxShadow: activeTab === tab ? `0 0 16px rgba(85,70,200,0.4)` : "none",
                  transition: "all 0.2s"
                }}
              >
                {tab === "novel" ? "📖 Novel" : "🖼️ Manga"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── STATUS MESSAGE ── */}
        {msg && (
          <div className="fade-in" style={{
            display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between",
            padding: "13px 16px", borderRadius: 14, marginBottom: 24,
            background: MSG_STYLES[msg.type].bg, border: `1px solid ${MSG_STYLES[msg.type].border}`
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {(loading || isProcessing || isFormatting)
                ? <Loader2 size={15} style={{ color: MSG_STYLES[msg.type].text, animation: "spin 1s linear infinite", marginTop: 1, flexShrink: 0 }} />
                : msg.type === "error" || msg.type === "warn"
                  ? <AlertTriangle size={15} style={{ color: MSG_STYLES[msg.type].text, marginTop: 1, flexShrink: 0 }} />
                  : <CheckCircle size={15} style={{ color: MSG_STYLES[msg.type].text, marginTop: 1, flexShrink: 0 }} />}
              <span style={{ fontSize: 12, color: MSG_STYLES[msg.type].text, lineHeight: 1.6 }}>{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MSG_STYLES[msg.type].text, opacity: 0.5, padding: 2, flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            NOVEL TAB
        ════════════════════════════════ */}
        {activeTab === "novel" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>

            {/* LEFT — UPLOAD */}
            <div className="card">
              <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: C.accentBlue, marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
                <UploadCloud size={17} /> Publish Chapter
              </h2>

              {/* Chapter # + Title */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="lbl">Chapter #</label>
                  <input type="number" value={novelChapter} onChange={e => setNovelChapter(e.target.value)} placeholder="e.g. 3" className="field" />
                </div>
                <div>
                  <label className="lbl">Title</label>
                  <input type="text" value={novelTitle} onChange={e => setNovelTitle(e.target.value)} placeholder="Optional" className="field" />
                </div>
              </div>

              {/* Dropzone */}
              <div style={{ marginBottom: 14, position: "relative" }}>
                <input type="file" accept=".txt,.docx,.pdf" onChange={handleFileUpload}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 10 }} />
                <div style={{
                  border: `2px dashed rgba(79,142,247,0.2)`, borderRadius: 14,
                  padding: "22px 16px", textAlign: "center",
                  background: "rgba(79,142,247,0.03)", transition: "border-color 0.2s"
                }}>
                  {isProcessing
                    ? <Loader2 size={26} style={{ color: C.accentBlue, margin: "0 auto 8px", display: "block", animation: "spin 1s linear infinite" }} />
                    : <FileBox size={26} style={{ color: C.accentBlue, margin: "0 auto 8px", display: "block" }} />}
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
                    {isProcessing ? "Parsing & formatting…" : "Upload Manuscript"}
                  </p>
                  <p style={{ fontSize: 10, color: C.subtext }}>
                    .pdf · .docx · .txt — auto-formatted on load
                  </p>
                </div>
              </div>

              {/* Format changes log */}
              {formatChanges.length > 0 && (
                <div className="fade-in" style={{
                  marginBottom: 14, padding: "11px 14px", borderRadius: 10,
                  background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.2)"
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#93C5FD", marginBottom: 6 }}>Auto-fixes applied</p>
                  {formatChanges.map((c, i) => (
                    <p key={i} style={{ fontSize: 11, color: "rgba(147,197,253,0.7)", marginBottom: 2 }}>✓ {c}</p>
                  ))}
                </div>
              )}

              {/* Content editor */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="lbl" style={{ marginBottom: 0 }}>Content</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: C.subtext }}>{novelContent.length} chars</span>
                    {/* Format btn */}
                    <button type="button" onClick={handleManualFormat}
                      disabled={!novelContent.trim() || isFormatting}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 11px", borderRadius: 8,
                        background: `rgba(124,111,232,0.12)`, border: `1px solid rgba(124,111,232,0.25)`,
                        color: C.accent, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        cursor: "pointer", textTransform: "uppercase"
                      }}
                    >
                      {isFormatting
                        ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                        : <Wand2 size={10} />}
                      Format
                    </button>
                    {/* Preview toggle */}
                    <button type="button" onClick={() => setShowPreview(!showPreview)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 11px", borderRadius: 8,
                        background: "rgba(139,159,232,0.07)", border: `1px solid ${C.border}`,
                        color: C.subtext, fontSize: 9, fontWeight: 700,
                        cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em"
                      }}
                    >
                      {showPreview ? <EyeOff size={10} /> : <Eye size={10} />}
                      {showPreview ? "Edit" : "Preview"}
                    </button>
                  </div>
                </div>

                {showPreview ? (
                  <div style={{
                    height: 280, overflowY: "auto", borderRadius: 12,
                    padding: "16px 18px", background: "rgba(6,4,15,0.8)",
                    border: `1px solid ${C.border}`,
                    fontSize: 14, lineHeight: 1.8, color: C.text,
                    fontFamily: "Georgia, serif"
                  }}>
                    {novelContent.split(/\n\n+/).map((para, i) => {
                      const trimmed = para.trim();
                      // Scene headers
                      if (trimmed.startsWith("━━━")) {
                        return <p key={i} style={{ fontFamily: "'DM Sans'", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", color: C.accent, textAlign: "center", margin: "20px 0 12px" }}>{trimmed}</p>;
                      }
                      // Meta labels
                      if (trimmed.startsWith("[LOCATION:") || trimmed.startsWith("[TIME:")) {
                        return <p key={i} style={{ fontFamily: "'DM Sans'", fontSize: 10, color: C.subtext, fontStyle: "italic", marginBottom: "0.6em" }}>{trimmed}</p>;
                      }
                      // Dividers
                      if (trimmed === "—") {
                        return <hr key={i} style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />;
                      }
                      // Quote lines
                      if (trimmed.startsWith("❝")) {
                        return <p key={i} style={{ paddingLeft: "1em", borderLeft: `2px solid ${C.accent}`, color: "rgba(179,193,240,0.8)", marginBottom: "1em", fontStyle: "italic" }}>{trimmed}</p>;
                      }
                      return <p key={i} style={{ marginBottom: "1.1em", textIndent: i === 0 ? 0 : "1.8em" }}>{trimmed}</p>;
                    })}
                  </div>
                ) : (
                  <textarea
                    value={novelContent}
                    onChange={e => setNovelContent(e.target.value)}
                    placeholder="File content appears here. Paste directly or upload a file."
                    className="field"
                    style={{ height: 280, fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, resize: "vertical" }}
                  />
                )}
              </div>

              <button onClick={handleNovelUpload}
                disabled={loading || isProcessing || !novelContent.trim() || !novelChapter}
                className="pill-btn"
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, ${C.accentMid}, ${C.accentDark})`,
                  color: "#fff",
                  boxShadow: `0 0 24px rgba(85,70,200,0.35)`,
                  opacity: (loading || isProcessing || !novelContent.trim() || !novelChapter) ? 0.55 : 1
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Deploying…</>
                  : <><UploadCloud size={15} /> Deploy Chapter</>}
              </button>
            </div>

            {/* RIGHT — VAULT */}
            <div className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: "#F87171", display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={17} /> Chapter Vault
                </h2>
                <button onClick={fetchChapters} title="Refresh from database"
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.subtext, display: "flex", padding: 6, borderRadius: 8, transition: "color 0.2s" }}>
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* RLS warning tip */}
              <div style={{
                padding: "10px 13px", borderRadius: 10, marginBottom: 16,
                background: "rgba(124,111,232,0.06)", border: `1px solid rgba(124,111,232,0.18)`
              }}>
                <p style={{ fontSize: 10, color: "rgba(196,181,253,0.7)", lineHeight: 1.6 }}>
                  <strong style={{ color: "#C4B5FD" }}>If delete seems stuck:</strong> Go to Supabase → Authentication → Policies → novel_chapters and ensure the anon role has a DELETE policy enabled.
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", maxHeight: 500, display: "flex", flexDirection: "column", gap: 8 }}>
                {chaptersList.length === 0
                  ? <p style={{ textAlign: "center", padding: "36px 0", fontSize: 13, color: C.subtext }}>No chapters published yet.</p>
                  : chaptersList.map(ch => (
                    <div key={ch.id} className="vault-row">
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Ch. {ch.chapter_number}</p>
                        <p style={{ fontSize: 11, color: C.subtext, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNovel(ch.id, ch.chapter_number)}
                        disabled={deletingId === ch.id}
                        style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: C.dangerBg, border: `1px solid ${C.dangerBorder}`,
                          color: "#F87171", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                        }}
                      >
                        {deletingId === ch.id
                          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            MANGA TAB
        ════════════════════════════════ */}
        {activeTab === "manga" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, maxWidth: 820, margin: "0 auto" }}>

            {/* Upload */}
            <div className="card">
              <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: C.purple, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <ImageIcon size={17} /> Upload Pages
              </h2>

              <div style={{ marginBottom: 14 }}>
                <label className="lbl">Series</label>
                <select value={selectedMangaId} onChange={e => setMangaId(e.target.value)} className="field">
                  <option value="1">Spectral Rift</option>
                  <option value="2">Urithi</option>
                  <option value="3">Katikati</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="lbl">Chapter #</label>
                <input type="number" value={mangaChapter} onChange={e => setMangaChapter(e.target.value)} placeholder="e.g. 5" className="field" />
              </div>

              <div style={{
                marginBottom: 20, border: "2px dashed rgba(155,111,232,0.18)",
                borderRadius: 14, padding: "22px 16px", textAlign: "center",
                background: "rgba(155,111,232,0.03)"
              }}>
                <input type="file" multiple accept="image/*" onChange={e => setMangaFiles(e.target.files)}
                  style={{ display: "block", width: "100%", cursor: "pointer", color: C.subtext, fontSize: 12 }} />
                {mangaFiles && (
                  <p style={{ fontSize: 11, color: C.purple, marginTop: 10, fontWeight: 700 }}>
                    {mangaFiles.length} file{mangaFiles.length !== 1 ? "s" : ""} selected
                  </p>
                )}
                <p style={{ fontSize: 10, color: C.subtext, marginTop: 6 }}>PNG · JPG · WEBP · max 100/batch</p>
              </div>

              <button onClick={handleMangaUpload}
                disabled={loading || !mangaFiles || !mangaChapter}
                className="pill-btn"
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, ${C.purple}, #6B21A8)`,
                  color: "#fff",
                  boxShadow: "0 0 24px rgba(155,111,232,0.3)",
                  opacity: (loading || !mangaFiles || !mangaChapter) ? 0.55 : 1
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
                  : <><Upload size={15} /> Upload Batch</>}
              </button>
            </div>

            {/* Danger zone */}
            <div className="card" style={{ border: `1px solid ${C.dangerBorder}`, background: C.dangerBg }}>
              <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: "#F87171", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={17} /> Danger Zone
              </h2>

              <div style={{ marginBottom: 14 }}>
                <label className="lbl" style={{ color: "rgba(248,113,113,0.5)" }}>Series</label>
                <select value={deleteMangaId} onChange={e => setDelMangaId(e.target.value)}
                  className="field" style={{ borderColor: C.dangerBorder }}>
                  <option value="1">Spectral Rift</option>
                  <option value="2">Urithi</option>
                  <option value="3">Katikati</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="lbl" style={{ color: "rgba(248,113,113,0.5)" }}>Chapter to Delete</label>
                <input type="number" value={deleteChapter} onChange={e => setDeleteChapter(e.target.value)}
                  placeholder="e.g. 8" className="field" style={{ borderColor: C.dangerBorder }} />
              </div>

              <button onClick={handleMangaDelete}
                disabled={loading || !deleteChapter}
                className="pill-btn"
                style={{
                  width: "100%",
                  background: "rgba(239,68,68,0.12)", border: `1px solid ${C.dangerBorder}`,
                  color: "#F87171",
                  opacity: (loading || !deleteChapter) ? 0.5 : 1
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Deleting…</>
                  : <><Trash2 size={15} /> Erase Chapter</>}
              </button>
              <p style={{ fontSize: 10, color: "rgba(248,113,113,0.35)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                Removes all pages from storage and the database. Cannot be undone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}