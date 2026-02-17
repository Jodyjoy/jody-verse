'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DownloadButtonProps {
  chapterId: number;
  chapterNumber: string;
  title?: string;
}

export default function DownloadButton({ chapterId, chapterNumber, title }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'downloading' | 'saved' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  // 1. Check if already saved on load
  useEffect(() => {
    const checkCache = async () => {
      const cacheName = `manga-chapter-${chapterNumber}`;
      if (typeof window !== 'undefined' && await window.caches.has(cacheName)) {
        setStatus('saved');
      }
    };
    checkCache();
  }, [chapterNumber]);

  // NEW: Delete functionality to free up space
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent Link from triggering
    if (!confirm(`Remove Chapter ${chapterNumber} from offline?`)) return;

    try {
      // 1. Clear actual images from Browser Cache
      const cacheName = `manga-chapter-${chapterNumber}`;
      await window.caches.delete(cacheName);

      // 2. Remove metadata from LocalStorage
      const currentLibrary = JSON.parse(localStorage.getItem('offline_library') || '[]');
      const updatedLibrary = currentLibrary.filter((c: any) => String(c.chapter_number) !== String(chapterNumber));
      localStorage.setItem('offline_library', JSON.stringify(updatedLibrary));

      setStatus('idle');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

const handleDownload = async () => {
    try {
      setStatus('fetching');

      const { data: pages, error } = await supabase
        .from('manga_pages') 
        .select('image_url')
        .eq('chapter_id', chapterId);

      if (error || !pages || pages.length === 0) {
        alert('No pages found!');
        setStatus('idle');
        return;
      }

      const imageUrls = pages.map(p => p.image_url);
      setStatus('downloading');
      
      const cacheName = `manga-chapter-${chapterNumber}`;
      const cache = await window.caches.open(cacheName);
      
      let count = 0;

      // 🔄 Sequential Download: One by one to prevent missing pages
      for (const url of imageUrls) {
        try {
          // Check if it's already in cache first
          const existing = await cache.match(url);
          if (!existing) {
            const response = await fetch(url, { 
              mode: 'cors',
              cache: 'reload' // Forces a fresh copy from Supabase
            });

            if (!response.ok) throw new Error("Fetch failed");
            await cache.put(url, response);
          }
          
          count++;
          setProgress(Math.round((count / imageUrls.length) * 100));
        } catch (err) {
          console.error(`❌ Failed page ${count + 1}:`, err);
          // If a page fails, we stop and show an error so you know it's not complete
          setStatus('error');
          return; 
        }
      }

      // SAVE THE MAP (Only if all images finished)
      const chapterInfo = {
        id: chapterId,
        chapter_number: chapterNumber,
        title: title || `Chapter ${chapterNumber}`,
        offline: true,
        pages: imageUrls 
      };

      const currentLibrary = JSON.parse(localStorage.getItem('offline_library') || '[]');
      const updatedLibrary = [
        ...currentLibrary.filter((c: any) => String(c.chapter_number) !== String(chapterNumber)),
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
        ${status === 'saved' 
          ? 'bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40' 
          : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
        }
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