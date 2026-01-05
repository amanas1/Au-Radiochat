
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  RadioStation, UserProfile, ThemeName, BaseTheme, Language, 
  VisualizerVariant, VisualizerSettings, AmbienceState, PassportData, 
  AlarmConfig, FxSettings, StreamQuality, CategoryInfo, InterfaceMode,
  PlayerState
} from './types';
import { 
  DEFAULT_VOLUME, TRANSLATIONS, GENRES, MOODS, ERAS 
} from './constants';
import { fetchStationsByTag } from './services/radioService';
import { 
  VolumeIcon, PreviousIcon, NextIcon, PlayIcon, PauseIcon, 
  LoadingIcon, AdjustmentsIcon, MenuIcon, XMarkIcon
} from './components/Icons';

import AudioVisualizer from './components/AudioVisualizer';
import CardVisualizer from './components/CardVisualizer';
import AiMirror from './components/AiMirror';

const ToolsPanel = React.lazy(() => import('./components/ToolsPanel'));
const ChatPanel = React.lazy(() => import('./components/ChatPanel'));
const ProfileSetup = React.lazy(() => import('./components/ProfileSetup'));

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('streamflow_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [activeMood, setActiveMood] = useState('chill');
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMirrorActive, setIsMirrorActive] = useState(false);
  
  const [theme, setTheme] = useState<ThemeName>('default');
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [vizVariant, setVizVariant] = useState<VisualizerVariant>('galaxy');
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>({
    scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 1, autoIdle: true, performanceMode: false
  });
  
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudioEngine = useCallback(() => {
    if (audioContextRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    const gain = ctx.createGain();
    
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    gainNodeRef.current = gain;
  }, []);

  const loadStations = useCallback(async (tag: string) => {
    setPlayerState('loading');
    setActiveMood(tag);
    try {
      const data = await fetchStationsByTag(tag, 30);
      setStations(data);
      setCurrentStationIndex(0);
      if (data.length === 0) setPlayerState('error');
    } catch {
      setPlayerState('error');
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!stations[currentStationIndex]) return;

    if (!audioContextRef.current) initAudioEngine();
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (playerState === 'playing') {
      audioRef.current.pause();
      setPlayerState('paused');
    } else {
      setPlayerState('loading');
      try {
        await audioRef.current.play();
        setPlayerState('playing');
      } catch {
        setPlayerState('error');
      }
    }
  }, [stations, currentStationIndex, playerState, initAudioEngine]);

  const handleNext = useCallback(() => {
    if (stations.length === 0) return;
    setCurrentStationIndex(prev => (prev + 1) % stations.length);
  }, [stations.length]);

  const handlePrev = useCallback(() => {
    if (stations.length === 0) return;
    setCurrentStationIndex(prev => (prev - 1 + stations.length) % stations.length);
  }, [stations.length]);

  useEffect(() => {
    loadStations('chill');
  }, [loadStations]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!stations[currentStationIndex]) return;

    audio.src = stations[currentStationIndex].url_resolved;
    audio.crossOrigin = "anonymous";
    
    if (playerState === 'playing' || playerState === 'loading') {
      setPlayerState('loading');
      audio.play().then(() => setPlayerState('playing')).catch(() => setPlayerState('error'));
    }
  }, [currentStationIndex, stations]);

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
    }
  }, [volume]);

  if (!userProfile) return <ProfileSetup onComplete={setUserProfile} language={language} />;

  const currentStation = stations[currentStationIndex];
  const t = TRANSLATIONS[language];

  const themeStyle = {
    '--color-primary': theme === 'default' ? '#bc6ff1' : 'var(--color-primary)',
    '--panel-bg': baseTheme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    '--text-base': baseTheme === 'dark' ? '#f8fafc' : '#0f172a',
  } as React.CSSProperties;

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden ${baseTheme} select-none transition-colors duration-500`} style={themeStyle}>
      <div className="absolute inset-0 z-0 bg-slate-950">
        <AudioVisualizer 
          analyserNode={analyserRef.current} 
          isPlaying={playerState === 'playing'} 
          variant={vizVariant}
          settings={vizSettings}
        />
      </div>

      <div className={`relative z-10 flex flex-col h-full transition-opacity duration-1000 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full flex flex-col pt-8 pb-4 shrink-0 pointer-events-auto overflow-hidden">
          <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar pb-2">
            {[...MOODS, ...GENRES].map(cat => (
              <button
                key={cat.id}
                onClick={() => loadStations(cat.id)}
                className={`px-5 py-2.5 rounded-full backdrop-blur-xl border transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeMood === cat.id 
                  ? 'bg-primary/20 border-primary text-white scale-105 shadow-lg' 
                  : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                }`}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${cat.color}`}></div>
                <span className="text-xs font-bold uppercase tracking-widest">{t[cat.id] || cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 pointer-events-auto">
          {currentStation && (
            <div className="w-full max-w-lg flex flex-col items-center gap-10">
              <div 
                onClick={() => setIsMirrorActive(!isMirrorActive)}
                className="relative group w-[75vw] h-[75vw] max-w-[340px] max-h-[340px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isMirrorActive ? (
                  <AiMirror analyserNode={analyserRef.current} isPlaying={playerState === 'playing'} />
                ) : (
                  <CardVisualizer 
                    analyserNode={analyserRef.current} 
                    isPlaying={playerState === 'playing'} 
                    color="var(--color-primary)" 
                  />
                )}
                
                {playerState === 'loading' && !isMirrorActive && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <LoadingIcon className="w-16 h-16 text-primary animate-spin" />
                  </div>
                )}
                
                <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                        {isMirrorActive ? (language === 'ru' ? 'Выключить зеркало' : 'Turn off Mirror') : (language === 'ru' ? 'AI Зеркало' : 'AI Mirror')}
                    </span>
                </div>
              </div>

              <div className="text-center px-4">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight line-clamp-1">{currentStation.name}</h2>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 opacity-80">{currentStation.tags || 'Global Radio'}</p>
              </div>

              <div className="w-full bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3 flex-1">
                  <VolumeIcon className="w-5 h-5 text-slate-500" />
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-primary h-1 bg-white/10 rounded-full"
                  />
                </div>

                <div className="flex items-center gap-8">
                  <button onClick={handlePrev} className="text-slate-400 hover:text-white transition-colors active:scale-90"><PreviousIcon className="w-7 h-7" /></button>
                  <button 
                    onClick={togglePlay} 
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {playerState === 'loading' ? <LoadingIcon className="w-10 h-10 animate-spin" /> : playerState === 'playing' ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 ml-1" />}
                  </button>
                  <button onClick={handleNext} className="text-slate-400 hover:text-white transition-colors active:scale-90"><NextIcon className="w-7 h-7" /></button>
                </div>

                <div className="flex justify-end flex-1">
                  <button onClick={() => setToolsOpen(true)} className="p-3 text-slate-500 hover:text-white transition-all"><AdjustmentsIcon className="w-6 h-6" /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20 shrink-0"></div>
      </div>

      <Suspense fallback={null}>
        <ToolsPanel 
          isOpen={toolsOpen} 
          onClose={() => setToolsOpen(false)}
          language={language}
          setLanguage={setLanguage}
          currentTheme={theme}
          setTheme={setTheme}
          baseTheme={baseTheme}
          setBaseTheme={setBaseTheme}
          visualizerVariant={vizVariant}
          setVisualizerVariant={setVizVariant}
          vizSettings={vizSettings}
          setVizSettings={setVizSettings}
          onOpenChat={() => setChatOpen(true)}
          eqGains={[]} setEqGain={()=>{}} onSetEqValues={()=>{}} sleepTimer={null} setSleepTimer={()=>{}}
          onStartTutorial={()=>{}} onOpenManual={()=>{}} onOpenProfile={()=>{}} showDeveloperNews={false}
          setShowDeveloperNews={()=>{}} ambience={{} as any} setAmbience={()=>{}} passport={{} as any}
          alarm={{} as any} setAlarm={()=>{}} onThrowBottle={()=>{}} onCheckBottle={()=>{}}
          customCardColor={null} setCustomCardColor={()=>{}} fxSettings={{} as any} setFxSettings={()=>{}}
          streamQuality="standard" setStreamQuality={()=>{}} autoStart={false} setAutoStart={()=>{}}
        />
      </Suspense>
    </div>
  );
};

export default App;
