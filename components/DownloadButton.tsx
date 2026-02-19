'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DownloadButtonProps {
  mangaId: number; // 👈 NEW: We now require the Manga ID
  chapterId: number;
  chapterNumber: string;
  title?: string;
}

export default function DownloadButton({ mangaId, chapterId, chapterNumber, title }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'downloading' | 'saved' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  // 👉 NEW CACHE NAME: Includes mangaId to prevent overwriting
  const getCacheName = () => `manga-${mangaId}-chapter-${chapterNumber}`;

  useEffect(() => {
    const checkCache = async () => {
      if (typeof window !== 'undefined' && await window.caches.has(getCacheName())) {
        setStatus('saved');
      }
    };
    checkCache();
  }, [mangaId, chapterNumber]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove Chapter ${chapterNumber} from offline?`)) return;

    try {
      await window.caches.delete(getCacheName());

      const currentLibrary = JSON.parse(localStorage.getItem('offline_library') || '[]');
      // Filter out this specific manga's chapter
      const updatedLibrary = currentLibrary.filter((c: any) => 
        !(String(c.chapter_number) === String(chapterNumber) && String(c.manga_id) === String(mangaId))
      );
      localStorage.setItem('offline_library', JSON.stringify(updatedLibrary));

      setStatus('idle');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleDownload = async () => {
    try {
      setStatus('fetching');

      // 👈 NEW: Fetch pages using BOTH manga_id and chapter_id
      const { data: pages, error } = await supabase
        .from('manga_pages') 
        .select('image_url')
        .eq('manga_id', mangaId)
        .eq('chapter_id', chapterId);

      if (error || !pages || pages.length === 0) {
        alert('No pages found for this specific manga!');
        setStatus('idle');
        return;
      }

      const imageUrls = pages.map(p => p.image_url);
      setStatus('downloading');
      
      const cache = await window.caches.open(getCacheName());
      let count = 0;

      for (const url of imageUrls) {
        try {
          const existing = await cache.match(url);
          if (!existing) {
            const response = await fetch(url, { mode: 'cors', cache: 'reload' });
            if (!response.ok) throw new Error("Fetch failed");
            await cache.put(url, response);
          }
          count++;
          setProgress(Math.round((count / imageUrls.length) * 100));
        } catch (err) {
          console.error(`❌ Failed page ${count + 1}:`, err);
          setStatus('error');
          return; 
        }
      }

      const chapterInfo = {
        manga_id: mangaId, // 👈 NEW: Save manga ID to local storage
        id: chapterId,
        chapter_number: chapterNumber,
        title: title || `Chapter ${chapterNumber}`,
        offline: true,
        pages: imageUrls 
      };

      const currentLibrary = JSON.parse(localStorage.getItem('offline_library') || '[]');
      const updatedLibrary = [
        ...currentLibrary.filter((c: any) => 
          !(String(c.chapter_number) === String(chapterNumber) && String(c.manga_id) === String(mangaId))
        ),
        chapterInfo
      ];
      localStorage.setItem('offline_library', JSON.stringify(updatedLibrary));

      setStatus('saved');
    } catch (error) {
      console.error('Download process crashed:', error);
      setStatus('error');
    }
  };

  return (
    <button 
      onClick={status === 'saved' ? handleDelete : handleDownload}
      disabled={status === 'downloading' || status === 'fetching'} 
      className={`
        px-3 py-1.5 rounded-lg font-bold text-xs transition-all z-20
        ${status === 'saved' ? 'bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40' : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'}
        ${status === 'fetching' || status === 'downloading' ? 'opacity-75 cursor-wait' : ''}
      `}
    >
      {status === 'idle' && '⬇ Offline'}
      {status === 'fetching' && '🔍 Finding...'}
      {status === 'downloading' && `${progress}%`}
      {status === 'saved' && '🗑️ Remove'}
      {status === 'error' && '❌ Retry'}
    </button>
  );
}