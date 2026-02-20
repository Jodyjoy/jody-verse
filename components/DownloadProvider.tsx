'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

type DownloadState = {
  status: 'idle' | 'fetching' | 'downloading' | 'saved' | 'error';
  progress: number;
};

interface DownloadContextType {
  downloads: Record<string, DownloadState>;
  startDownload: (mangaId: number, chapterId: number, chapterNumber: string, title?: string) => Promise<void>;
  deleteDownload: (mangaId: number, chapterNumber: string) => Promise<void>;
  checkStatus: (mangaId: number, chapterNumber: string) => DownloadState;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  const getCacheName = (mangaId: number, chapterNumber: string) => `manga-${mangaId}-chapter-${chapterNumber}`;

  // Initial check of offline library to sync state
  useEffect(() => {
    const syncLibrary = async () => {
      const offlineData = localStorage.getItem('offline_library');
      if (offlineData) {
        const library = JSON.parse(offlineData);
        const initialState: Record<string, DownloadState> = {};
        library.forEach((c: any) => {
          initialState[getCacheName(c.manga_id, c.chapter_number)] = { status: 'saved', progress: 100 };
        });
        setDownloads(initialState);
      }
    };
    syncLibrary();
  }, []);

  const updateDownload = (cacheName: string, state: Partial<DownloadState>) => {
    setDownloads(prev => ({
      ...prev,
      [cacheName]: { ...(prev[cacheName] || { status: 'idle', progress: 0 }), ...state }
    }));
  };

  const deleteDownload = async (mangaId: number, chapterNumber: string) => {
    const cacheName = getCacheName(mangaId, chapterNumber);
    try {
      await window.caches.delete(cacheName);

      const currentLibrary = JSON.parse(localStorage.getItem('offline_library') || '[]');
      const updatedLibrary = currentLibrary.filter((c: any) => 
        !(String(c.chapter_number) === String(chapterNumber) && String(c.manga_id) === String(mangaId))
      );
      localStorage.setItem('offline_library', JSON.stringify(updatedLibrary));

      updateDownload(cacheName, { status: 'idle', progress: 0 });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const startDownload = async (mangaId: number, chapterId: number, chapterNumber: string, title?: string) => {
    const cacheName = getCacheName(mangaId, chapterNumber);
    updateDownload(cacheName, { status: 'fetching', progress: 0 });

    try {
      const { data: pages, error } = await supabase
        .from('manga_pages') 
        .select('image_url')
        .eq('manga_id', mangaId)
        .eq('chapter_id', chapterId);

      if (error || !pages || pages.length === 0) {
        updateDownload(cacheName, { status: 'error' });
        return;
      }

      const imageUrls = pages.map(p => p.image_url);
      updateDownload(cacheName, { status: 'downloading', progress: 0 });
      
      const cache = await window.caches.open(cacheName);
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
          updateDownload(cacheName, { progress: Math.round((count / imageUrls.length) * 100) });
        } catch (err) {
          console.error(`❌ Failed page ${count + 1}:`, err);
          updateDownload(cacheName, { status: 'error' });
          return; 
        }
      }

      const chapterInfo = {
        manga_id: mangaId,
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

      updateDownload(cacheName, { status: 'saved', progress: 100 });
    } catch (error) {
      console.error('Download process crashed:', error);
      updateDownload(cacheName, { status: 'error' });
    }
  };

  const checkStatus = (mangaId: number, chapterNumber: string) => {
    const cacheName = getCacheName(mangaId, chapterNumber);
    return downloads[cacheName] || { status: 'idle', progress: 0 };
  };

  return (
    <DownloadContext.Provider value={{ downloads, startDownload, deleteDownload, checkStatus }}>
      {children}
    </DownloadContext.Provider>
  );
}

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};