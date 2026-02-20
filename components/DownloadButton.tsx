'use client';

import { useDownload } from './DownloadProvider'; // 👈 Connect to the global engine

interface DownloadButtonProps {
  mangaId: number;
  chapterId: number;
  chapterNumber: string;
  title?: string;
}

export default function DownloadButton({ mangaId, chapterId, chapterNumber, title }: DownloadButtonProps) {
  // Pull the engine controls from context
  const { startDownload, deleteDownload, checkStatus } = useDownload();
  
  // Get the current status for THIS specific chapter
  const { status, progress } = checkStatus(mangaId, chapterNumber);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (status === 'saved') {
      if (confirm(`Remove Chapter ${chapterNumber} from offline?`)) {
        deleteDownload(mangaId, chapterNumber);
      }
    } else if (status === 'idle' || status === 'error') {
      startDownload(mangaId, chapterId, chapterNumber, title);
    }
  };

  return (
    <button 
      onClick={handleAction}
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