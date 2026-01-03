
import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, LoadingIcon, MusicNoteIcon, PlayIcon, PauseIcon } from './Icons';
import { Track, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { fetchTracks } from '../services/musicService';

interface MusicDownloaderProps {
  language: Language;
}

const MusicDownloader: React.FC<MusicDownloaderProps> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const searchManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchStatus(t.searching);
    setTracks([]);
    
    try {
        const results = await fetchTracks(query);
        setTracks(results);
        if (results.length === 0) setSearchStatus(t.noTracks);
    } catch (e) {
        setSearchStatus(t.errorTracks);
    } finally {
        setIsSearching(false);
    }
  };

  const togglePreview = (track: Track) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setPlayingTrackId(null);
      }
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      setPlayingTrackId(track.id);
    }
  };

  const downloadTrack = async (track: Track) => {
    setDownloadingIds(prev => new Set(prev).add(track.id));
    
    try {
        // Create a temporary link to trigger download
        const response = await fetch(track.audioUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${track.artist} - ${track.title}.mp3`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: open in new tab
      window.open(track.audioUrl, '_blank');
    } finally {
      setTimeout(() => {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }, 1000);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-32">
      <div className="mb-8 p-10 rounded-[3rem] glass-panel relative overflow-hidden group shadow-2xl shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-30"></div>
        
        <h2 className="text-4xl font-black mb-6 relative z-10 text-white tracking-tighter uppercase">
          {t.downloader}
        </h2>
        
        <form onSubmit={searchManual} className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchTracks}
              className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-6 py-5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-white shadow-2xl"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isSearching ? <LoadingIcon className="animate-spin w-4 h-4" /> : <SearchIcon className="w-4 h-4" />}
            {t.search}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="grid gap-3">
            {isSearching && (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                    <LoadingIcon className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">{searchStatus}</p>
                </div>
            )}

            {!isSearching && tracks.length === 0 && query && (
                <div className="text-center py-20 opacity-50">
                    <MusicNoteIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">{searchStatus || t.noTracks}</p>
                </div>
            )}

            {!isSearching && tracks.map((track, idx) => (
                <div 
                    key={track.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all animate-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
                        <img src={track.coverUrl} className="w-full h-full object-cover" />
                        <button 
                            onClick={() => togglePreview(track)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {playingTrackId === track.id ? <PauseIcon className="w-6 h-6 text-white" /> : <PlayIcon className="w-6 h-6 text-white" />}
                        </button>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                        <p className="text-xs text-slate-400 truncate font-medium">{track.artist}</p>
                        <div className="flex gap-2 mt-1">
                            {track.tags.map(tag => (
                                <span key={tag} className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase font-bold">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-slate-500">{formatDuration(track.duration)}</span>
                        <button 
                            onClick={() => downloadTrack(track)}
                            disabled={downloadingIds.has(track.id)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${downloadingIds.has(track.id) ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'}`}
                        >
                            {downloadingIds.has(track.id) ? (
                                <>{t.loading}</>
                            ) : (
                                <>{t.download}</>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MusicDownloader;
