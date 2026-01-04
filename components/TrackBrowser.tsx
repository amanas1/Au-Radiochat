
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { PlayIcon, PauseIcon, MusicNoteIcon, SearchIcon, HeartIcon, PlusIcon, LoadingIcon } from './Icons';
import { fetchTracks } from '../services/musicService';
import { TRANSLATIONS } from '../constants'; // Import TRANSLATIONS

interface TrackBrowserProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, playlist: Track[]) => void;
  onTogglePlay: () => void;
  language?: string; // Optional language prop
}

const MOOD_FILTERS = [
  { id: 'chill', label: 'Chill', color: 'from-blue-500 to-indigo-500' },
  { id: 'energy', label: 'Energy', color: 'from-yellow-400 to-orange-500' },
  { id: 'phonk', label: 'Phonk', color: 'from-red-600 to-purple-600' },
  { id: 'focus', label: 'Focus', color: 'from-emerald-400 to-teal-500' },
  { id: 'jazz', label: 'Jazz', color: 'from-amber-500 to-orange-700' },
  { id: 'party', label: 'Party', color: 'from-purple-500 to-pink-500' },
];

const TrackBrowser: React.FC<TrackBrowserProps> = ({ currentTrack, isPlaying, onPlayTrack, onTogglePlay, language = 'en' }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Initial Load
  useEffect(() => {
    loadTracks(activeFilter || searchQuery, true);
  }, [activeFilter]);

  const loadTracks = async (query: string, reset: boolean = false) => {
    setIsLoading(true);
    const newOffset = reset ? 0 : offset;
    
    try {
        const newTracks = await fetchTracks(query, newOffset);
        
        if (reset) {
            setTracks(newTracks);
            setOffset(newTracks.length);
        } else {
            setTracks(prev => [...prev, ...newTracks]);
            setOffset(prev => prev + newTracks.length);
        }
    } catch (e) {
        console.error("Failed to load tracks");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveFilter(''); // Clear preset filter
      loadTracks(searchQuery, true);
    }
  };

  const handleLoadMore = () => {
      loadTracks(activeFilter || searchQuery, false);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-32">
      {/* Header & Search */}
      <div className="mb-6 p-6 rounded-[2.5rem] glass-panel relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <MusicNoteIcon className="w-6 h-6 text-primary" />
                  {t.infiniteTracks}
              </h2>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-400 font-bold uppercase">{t.noAuth}</span>
          </div>
          
          <form onSubmit={handleSearch} className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchLib}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white outline-none focus:border-primary transition-all font-semibold text-sm shadow-inner"
            />
          </form>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
                onClick={() => { setActiveFilter(''); setSearchQuery(''); }}
                className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === '' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
                {t.all}
            </button>
            {MOOD_FILTERS.map(f => (
              <button 
                key={f.id}
                onClick={() => { setActiveFilter(f.id); setSearchQuery(''); }}
                className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === f.id ? `bg-gradient-to-r ${f.color} text-white shadow-lg` : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                {t[`mood${f.label}`] || f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="grid gap-2 overflow-y-auto no-scrollbar pr-1 pb-10">
        {tracks.map((track, idx) => {
            const isCurrent = currentTrack?.title === track.title; // Match by title since IDs might be randomized
            return (
              <div 
                key={track.id}
                onClick={() => isCurrent ? onTogglePlay() : onPlayTrack(track, tracks)}
                className={`group flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border border-transparent ${isCurrent ? 'bg-white/10 border-primary/30' : 'hover:bg-white/5 hover:border-white/5 bg-white/[0.02]'}`}
                style={{ animationDelay: `${(idx % 10) * 50}ms` }}
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg">
                  <img src={track.coverUrl} className={`w-full h-full object-cover transition-transform duration-700 ${isCurrent && isPlaying ? 'scale-110' : 'scale-100'}`} />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isCurrent && isPlaying ? <PauseIcon className="w-5 h-5 text-white" /> : <PlayIcon className="w-5 h-5 text-white ml-0.5" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{track.title}</h4>
                  <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400 truncate font-bold">{track.artist}</p>
                      {track.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 uppercase">{tag}</span>
                      ))}
                  </div>
                </div>

                <div className="text-[10px] font-bold text-slate-500 tabular-nums">{formatDuration(track.duration)}</div>
                
                <button className="p-2 text-slate-500 hover:text-secondary transition-colors">
                  <HeartIcon className="w-4 h-4" />
                </button>
              </div>
            );
        })}
        
        {/* Load More Trigger */}
        <div className="py-6 text-center">
            {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                    <LoadingIcon className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.loading}</span>
                </div>
            ) : (
                <button 
                    onClick={handleLoadMore}
                    className="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all border border-white/5"
                >
                    {t.loadMore}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrackBrowser;
