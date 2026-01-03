
import React, { useState, useEffect, useRef } from 'react';
import { 
  RadioStation, UserProfile, ThemeName, BaseTheme, Language, 
  VisualizerVariant, VisualizerSettings, AmbienceState, PassportData, 
  AlarmConfig, FxSettings, StreamQuality, CategoryInfo
} from './types';
import { 
  DEFAULT_VOLUME, TRANSLATIONS, GENRES, MOODS, ERAS, NEWS_MESSAGES 
} from './constants';
import { fetchStationsByTag } from './services/radioService';
import { detectSpeechFromSpectrum, isAiAvailable, optimizeStationList } from './services/geminiService';
import { 
  MusicNoteIcon, VolumeIcon, PreviousIcon, NextIcon, PlayIcon, PauseIcon, 
  LoadingIcon, AdjustmentsIcon, MenuIcon, ClockIcon, XMarkIcon, BellIcon, SparklesIcon, MaximizeIcon
} from './components/Icons';

import AudioVisualizer from './components/AudioVisualizer';
import ToolsPanel from './components/ToolsPanel';
import ChatPanel from './components/ChatPanel';
import MusicStorm from './components/MusicStorm';
import ProfileSetup from './components/ProfileSetup';
import TutorialOverlay from './components/TutorialOverlay';
import ManualModal from './components/ManualModal';
import DownloadAppModal from './components/DownloadAppModal';
import FeedbackModal from './components/FeedbackModal';
import GitHubModal from './components/GitHubModal';

const App: React.FC = () => {
  // --- Application State ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('streamflow_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  // Used to force effect re-run even if index stays same (e.g. single station reload)
  const [stationVersion, setStationVersion] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  
  // --- UI State ---
  const [activeView, setActiveView] = useState<'player' | 'globe' | 'drum' | 'downloader' | 'browser'>('player');
  const [fullScreenStyle, setFullScreenStyle] = useState<'player' | 'visualizer'>('player');
  const [uiVisible, setUiVisible] = useState(true);
  
  // Modals & Panels
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  
  const [initialToolsTab, setInitialToolsTab] = useState<'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer' | 'settings'>('settings');
  
  // Settings & Preferences
  const [theme, setTheme] = useState<ThemeName>('default');
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [vizVariant, setVizVariant] = useState<VisualizerVariant>('galaxy');
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>({
    scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 1, autoIdle: true, performanceMode: false
  });
  const [ambience, setAmbience] = useState<AmbienceState>({
    rainVolume: 0, rainVariant: 'soft', fireVolume: 0, cityVolume: 0, vinylVolume: 0, is8DEnabled: false, spatialSpeed: 1
  });
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [alarm, setAlarm] = useState<AlarmConfig>({ enabled: false, time: '08:00', days: [] });
  const [eqGains, setEqGains] = useState<number[]>(new Array(10).fill(0));
  const [fxSettings, setFxSettings] = useState<FxSettings>({ reverb: 0, speed: 1.0 });
  const [streamQuality, setStreamQuality] = useState<StreamQuality>('standard');
  
  // AutoStart defaults to TRUE for first-time engagement
  const [autoStart, setAutoStart] = useState(() => {
      const saved = localStorage.getItem('streamflow_autostart');
      return saved !== null ? JSON.parse(saved) : true; 
  });

  const [showDevNews, setShowDevNews] = useState(false);
  const [customCardColor, setCustomCardColor] = useState<string | null>(null);
  const [aiSpeechFilter, setAiSpeechFilter] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // Install Prompt Logic
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- CROSSFADE AUDIO ENGINE REFS ---
  const audioRefA = useRef<HTMLAudioElement>(new Audio());
  const audioRefB = useRef<HTMLAudioElement>(new Audio());
  // Tracks which audio element is the "Target" / "Active" one
  const activeSlotRef = useRef<'A' | 'B'>('B'); 

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeARef = useRef<GainNode | null>(null);
  const gainNodeBRef = useRef<GainNode | null>(null);
  
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null);

  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const pannerRef = useRef<PannerNode | null>(null);
  const pannerIntervalRef = useRef<number | null>(null);
  const retryWithoutCorsRef = useRef(false);
  const errorCountRef = useRef(0);

  // News State
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isNewsVisible, setIsNewsVisible] = useState(true);

  // Idle Timer
  const idleTimerRef = useRef<number | null>(null);

  const currentStation = stations[currentStationIndex];
  const t = TRANSLATIONS[language];

  // Persist AutoStart
  useEffect(() => {
      localStorage.setItem('streamflow_autostart', JSON.stringify(autoStart));
  }, [autoStart]);

  // Helper for safe playback
  const playSafe = (audio: HTMLAudioElement) => {
      const p = audio.play();
      if (p !== undefined) {
          p.catch(e => {
              // Ignore AbortError (happens if pause() is called immediately after play)
              if (e.name !== 'AbortError') console.warn("Audio Play Error:", e);
          });
      }
  };

  // --- Audio Initialization (Dual Source Mixer) ---
  const initAudioContext = () => {
    if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    
    // 1. Create Sources & Input Gains
    // We create sources only ONCE per audio element
    if (!sourceARef.current) sourceARef.current = ctx.createMediaElementSource(audioRefA.current);
    if (!sourceBRef.current) sourceBRef.current = ctx.createMediaElementSource(audioRefB.current);

    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    
    // Initial state: Both silent until loaded
    gainA.gain.value = 0;
    gainB.gain.value = 0;

    sourceARef.current.connect(gainA);
    sourceBRef.current.connect(gainB);

    // 2. Create EQ Chain
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const filters = frequencies.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) filter.type = 'lowshelf';
        else if (i === frequencies.length - 1) filter.type = 'highshelf';
        else filter.type = 'peaking';
        
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = eqGains[i] || 0;
        return filter;
    });
    eqFiltersRef.current = filters;

    // 3. 8D Panner
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    pannerRef.current = panner;

    // 4. Analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Connect Graph: 
    // [SourceA->GainA] --\
    //                     --> [EQ 0] -> ... -> [EQ 9] -> [Panner] -> [Analyser] -> [Dest]
    // [SourceB->GainB] --/
    
    gainA.connect(filters[0]);
    gainB.connect(filters[0]);

    let prevNode: AudioNode = filters[0];
    for (let i = 1; i < filters.length; i++) {
        prevNode.connect(filters[i]);
        prevNode = filters[i];
    }
    
    // Correct Audio Graph Connection: EQ -> Panner -> Analyser -> Destination
    prevNode.connect(panner);
    panner.connect(analyser);
    analyser.connect(ctx.destination);
    
    audioContextRef.current = ctx;
    gainNodeARef.current = gainA;
    gainNodeBRef.current = gainB;
  };

  // --- Effects ---

  // Handle Theme Sync with DOM for Light Mode CSS Variables
  useEffect(() => {
      if (baseTheme === 'light') {
          document.body.classList.add('light-mode');
      } else {
          document.body.classList.remove('light-mode');
      }
  }, [baseTheme]);

  // Handle EQ Changes
  useEffect(() => {
      if (eqFiltersRef.current.length > 0 && audioContextRef.current) {
          eqFiltersRef.current.forEach((filter, i) => {
              filter.gain.setTargetAtTime(eqGains[i], audioContextRef.current!.currentTime, 0.1);
          });
      }
  }, [eqGains]);

  // Handle 8D Audio
  useEffect(() => {
      if (ambience.is8DEnabled && isPlaying) {
          let angle = 0;
          const animatePanner = () => {
              if (pannerRef.current && audioContextRef.current) {
                  angle += 0.01 * (ambience.spatialSpeed || 1);
                  const x = Math.sin(angle) * 3; 
                  const z = Math.cos(angle) * 3;
                  pannerRef.current.positionX.value = x;
                  pannerRef.current.positionZ.value = z;
                  pannerRef.current.positionY.value = 0; 
                  pannerIntervalRef.current = requestAnimationFrame(animatePanner);
              }
          };
          pannerIntervalRef.current = requestAnimationFrame(animatePanner);
      } else {
          if (pannerIntervalRef.current) cancelAnimationFrame(pannerIntervalRef.current);
          if (pannerRef.current && audioContextRef.current) {
              pannerRef.current.positionX.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
              pannerRef.current.positionZ.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
              pannerRef.current.positionY.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
          }
      }
      return () => {
          if (pannerIntervalRef.current) cancelAnimationFrame(pannerIntervalRef.current);
      };
  }, [ambience.is8DEnabled, isPlaying]);

  // Handle News Rotation
  useEffect(() => {
      if (!showDevNews) return;
      const news = NEWS_MESSAGES[language] || NEWS_MESSAGES.en;
      const interval = setInterval(() => {
          setIsNewsVisible(false); 
          setTimeout(() => {
              setCurrentNewsIndex(prev => (prev + 1) % news.length);
              setIsNewsVisible(true); 
          }, 1000); 
      }, 5000 + 1000);
      return () => clearInterval(interval);
  }, [showDevNews, language]);

  // Handle AI Speech Filter Monitoring
  useEffect(() => {
      let interval: any;
      
      if (aiSpeechFilter && isPlaying && isAiAvailable() && analyserRef.current && currentStation) {
          interval = setInterval(async () => {
              if (!analyserRef.current) return;
              
              // HIP-HOP EXCEPTION:
              // If genre implies speech is part of the music (Hip Hop, Rap), skip detection.
              const tags = (currentStation.tags || '').toLowerCase();
              if (tags.includes('hip hop') || tags.includes('hip-hop') || tags.includes('rap')) {
                  return;
              }

              // Only process if we have data (CORS allows it)
              const bufferLength = analyserRef.current.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              analyserRef.current.getByteFrequencyData(dataArray);
              
              // Check if array is not all zeros (CORS blocked streams return silence to analyser)
              const hasData = dataArray.some(val => val > 0);
              
              if (hasData && !retryWithoutCorsRef.current) { // Only run if CORS is working and data is real
                  setAiProcessing(true);
                  const spectrum = Array.from(dataArray);
                  
                  // Run detection (Uses FREE Gemini 2.5 Flash)
                  const isSpeech = await detectSpeechFromSpectrum(spectrum);
                  
                  setAiProcessing(false);
                  
                  if (isSpeech) {
                      console.log("AI Speech Detected (Filter Active). Skipping station...");
                      handleNextStation();
                  }
              }
          }, 10000); // Check every 10 seconds to save tokens/bandwidth
      }

      return () => clearInterval(interval);
  }, [aiSpeechFilter, isPlaying, currentStation]);

  // Handle Idle (Auto-Hide UI in Visualizer Mode)
  useEffect(() => {
      let timeout: number;
      const resetIdle = () => {
          // Always show UI on interaction
          setUiVisible(true);
          clearTimeout(timeout);
          
          // Only start auto-hide timer if in Visualizer Mode AND no blocking panels are open
          if (fullScreenStyle === 'visualizer' && !toolsOpen && !chatOpen && !tutorialOpen && !manualOpen && !downloadModalOpen && !feedbackModalOpen && !githubModalOpen) {
              timeout = window.setTimeout(() => {
                  setUiVisible(false);
              }, 30000); // 30 seconds
          }
      };
      
      // If switching TO visualizer mode, trigger logic immediately
      resetIdle();

      window.addEventListener('mousemove', resetIdle);
      window.addEventListener('mousedown', resetIdle);
      window.addEventListener('touchstart', resetIdle);
      window.addEventListener('keydown', resetIdle);
      
      return () => {
          clearTimeout(timeout);
          window.removeEventListener('mousemove', resetIdle);
          window.removeEventListener('mousedown', resetIdle);
          window.removeEventListener('touchstart', resetIdle);
          window.removeEventListener('keydown', resetIdle);
      };
  }, [fullScreenStyle, toolsOpen, chatOpen, tutorialOpen, manualOpen, downloadModalOpen, feedbackModalOpen, githubModalOpen]);

  // Capture Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setDownloadModalOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load Stations
  useEffect(() => {
    const loadStations = async () => {
      try {
        const loaded = await fetchStationsByTag('chill', 60, streamQuality);
        if (loaded && loaded.length > 0) {
            setStations(loaded);
            // REQUIREMENT 1: Autostart on first load if enabled
            if (autoStart) {
                setIsPlaying(true);
            }
        }
      } catch (e) {
        console.error("Failed to load stations", e);
      }
    };
    loadStations();
  }, [streamQuality]);

  // --- CROSSFADE & PLAYBACK LOGIC ---
  useEffect(() => {
    if (!currentStation) return;
    
    // 1. Determine Slots
    // If active is A, we want to load into B, then fade B in and A out.
    // However, on first load (activeSlotRef defaults to 'B'), we load into A.
    const targetSlot = activeSlotRef.current === 'A' ? 'B' : 'A';
    
    const targetAudio = targetSlot === 'A' ? audioRefA.current : audioRefB.current;
    const currentAudio = targetSlot === 'A' ? audioRefB.current : audioRefA.current;
    
    // 2. Setup New Stream
    retryWithoutCorsRef.current = false;
    errorCountRef.current = 0; // Reset error count on new station
    targetAudio.crossOrigin = "anonymous";
    targetAudio.src = currentStation.url_resolved;
    targetAudio.load();
    
    // 3. Play & Crossfade
    if (isPlaying) {
        // Ensure context is ready
        initAudioContext();
        playSafe(targetAudio);

        const ctx = audioContextRef.current;
        const targetGain = targetSlot === 'A' ? gainNodeARef.current : gainNodeBRef.current;
        const currentGain = targetSlot === 'A' ? gainNodeBRef.current : gainNodeARef.current;

        if (ctx && targetGain && currentGain) {
            const now = ctx.currentTime;
            const FADE_DURATION = 2.5; // Smooth 2.5s crossfade for "radio" feel

            // Fade In Target
            targetGain.gain.cancelScheduledValues(now);
            targetGain.gain.setValueAtTime(0, now); // Start silent
            targetGain.gain.linearRampToValueAtTime(1, now + FADE_DURATION); // Ramp up

            // Fade Out Current (if it was playing)
            currentGain.gain.cancelScheduledValues(now);
            currentGain.gain.setValueAtTime(1, now);
            currentGain.gain.linearRampToValueAtTime(0, now + FADE_DURATION); // Ramp down
        }
    }
    
    // 4. Update Active Reference
    activeSlotRef.current = targetSlot;

    // 5. Schedule Cleanup for Old Audio
    const FADE_DURATION_MS = 2500;
    const timeoutId = setTimeout(() => {
        // Only pause if this element isn't active anymore (user hasn't switched back quickly)
        const isCurrentActive = (activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current) === currentAudio;
        if (!isCurrentActive) {
            currentAudio.pause();
        }
    }, FADE_DURATION_MS + 200);

    // 6. Event Listeners (Attach to NEW active audio only)
    const handleCanPlay = () => {
        setIsBuffering(false);
        errorCountRef.current = 0; // Reset error count on successful load
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
        setIsBuffering(false);
        setIsPlaying(true);
    };
    const handlePause = () => {
        // Only set playing false if this is the ACTIVE player pausing (not the one fading out)
        if (activeSlotRef.current === targetSlot) setIsPlaying(false);
    };
    
    const handleError = (e: any) => {
        const el = e.target as HTMLAudioElement;
        const error = el.error;
        const errorMessage = error ? `MediaError code: ${error.code} (${error.message})` : 'Unknown error';

        // Log detailed error but check for CORS issues
        if (el.crossOrigin === "anonymous" && !retryWithoutCorsRef.current) {
            console.warn(`Audio blocked (CORS likely). Retrying in "No-CORS" mode. Error: ${errorMessage}`);
            retryWithoutCorsRef.current = true;
            el.removeAttribute('crossOrigin');
            const src = el.src; // Force reload logic
            el.src = src; 
            el.load();
            if (isPlaying) playSafe(el);
            return;
        }
        
        console.error(`Audio Fatal Error on Slot ${targetSlot}: ${errorMessage}`);
        
        // Auto-Skip broken stations (up to 3 times to prevent infinite loop)
        if (activeSlotRef.current === targetSlot) {
            if (errorCountRef.current < 3) {
                console.warn("Skipping broken station...");
                errorCountRef.current++;
                handleNextStation();
            } else {
                setIsBuffering(false);
                setIsPlaying(false);
                errorCountRef.current = 0;
            }
        }
    };
    
    // Bind to target
    targetAudio.addEventListener('canplay', handleCanPlay);
    targetAudio.addEventListener('waiting', handleWaiting);
    targetAudio.addEventListener('playing', handlePlaying);
    targetAudio.addEventListener('pause', handlePause);
    targetAudio.addEventListener('error', handleError);
    
    // Unbind from current (old) to avoid ghost state updates
    currentAudio.oncanplay = null;
    currentAudio.onwaiting = null;
    currentAudio.onplaying = null;
    currentAudio.onpause = null;
    currentAudio.onerror = null;

    return () => {
        targetAudio.removeEventListener('canplay', handleCanPlay);
        targetAudio.removeEventListener('waiting', handleWaiting);
        targetAudio.removeEventListener('playing', handlePlaying);
        targetAudio.removeEventListener('pause', handlePause);
        targetAudio.removeEventListener('error', handleError);
        clearTimeout(timeoutId); // Cancel the pause timeout if we switch again quickly
    };

  }, [currentStationIndex, streamQuality, stationVersion]); // Added stationVersion dependency to force reload if index stays same

  // Handle Global Play/Pause Toggle
  useEffect(() => {
    // Determine current active player
    const activeAudio = activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current;
    
    if (isPlaying) {
      initAudioContext();
      // Ensure current is playing
      if (activeAudio.paused) {
          playSafe(activeAudio);
          // Ensure gain is up (in case we paused mid-fade)
          const ctx = audioContextRef.current;
          const activeGain = activeSlotRef.current === 'A' ? gainNodeARef.current : gainNodeBRef.current;
          if (ctx && activeGain) {
              activeGain.gain.cancelScheduledValues(ctx.currentTime);
              activeGain.gain.setValueAtTime(1, ctx.currentTime);
          }
      }
    } else {
      activeAudio.pause();
    }
  }, [isPlaying]);

  // Handle Volume (Apply to BOTH elements)
  useEffect(() => {
    // GainNodes control the mixing, but Audio.volume controls the hardware output level relative to system.
    // Setting both ensures consistency.
    audioRefA.current.volume = volume;
    audioRefB.current.volume = volume;
  }, [volume]);

  // Sleep Timer
  useEffect(() => {
      let interval: number;
      if (sleepTimer) {
          interval = window.setInterval(() => {
              setSleepTimer(prev => {
                  if (prev && prev > 1) return prev - 1;
                  // Timer finished
                  setIsPlaying(false);
                  return null;
              });
          }, 60000); // 1 minute
      }
      return () => clearInterval(interval);
  }, [sleepTimer]);

  // --- Handlers ---

  const handleNextStation = () => {
    if (stations.length === 0) return;
    // Calculate next index
    const nextIndex = (currentStationIndex + 1) % stations.length;
    // If only 1 station, forcing reload by updating version
    if (stations.length === 1 || nextIndex === currentStationIndex) {
        setStationVersion(v => v + 1);
    }
    setCurrentStationIndex(nextIndex);
    setIsBuffering(true);
  };

  const handlePreviousStation = () => {
    if (stations.length === 0) return;
    const prevIndex = (currentStationIndex - 1 + stations.length) % stations.length;
    if (stations.length === 1 || prevIndex === currentStationIndex) {
        setStationVersion(v => v + 1);
    }
    setCurrentStationIndex(prevIndex);
    setIsBuffering(true);
  };

  const togglePlay = () => {
    if (stations.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('streamflow_user_profile', JSON.stringify(profile));
  };

  const handleCategorySelect = async (category: CategoryInfo) => {
    setContextMenuOpen(false);
    setIsBuffering(true);
    try {
        const newStations = await fetchStationsByTag(category.id, 60, streamQuality);
        if (newStations.length > 0) {
            setStations(newStations);
            setCurrentStationIndex(0);
            setStationVersion(v => v + 1); // Ensure fresh start
            setIsPlaying(true);
            // Also enable autostart logic for next time
            setAutoStart(true);
        }
    } catch (e) {
        console.error("Failed to change category", e);
        setIsBuffering(false);
    }
  };

  const handleAiOptimization = async () => {
      setIsBuffering(true);
      try {
          const optimized = await optimizeStationList(stations);
          setStations(optimized);
          setCurrentStationIndex(0);
          setStationVersion(v => v + 1);
          console.log("Stations optimized by AI");
      } catch (e) {
          console.error("Optimization failed", e);
      } finally {
          setIsBuffering(false);
          setToolsOpen(false);
      }
  };

  // --- Render ---

  if (!userProfile) {
    return (
      <ProfileSetup 
        onComplete={handleProfileUpdate} 
        language={language}
      />
    );
  }

  const themeStyle = {
    '--color-primary': theme === 'default' ? '#bc6ff1' : 
                       theme === 'emerald' ? '#00ff9f' : 
                       theme === 'midnight' ? '#4d4dff' : 
                       theme === 'cyber' ? '#ff00ff' : 
                       theme === 'volcano' ? '#ff3c00' : 
                       theme === 'ocean' ? '#00d2ff' : 
                       theme === 'sakura' ? '#ff758c' : 
                       theme === 'gold' ? '#ffcc33' : 
                       theme === 'frost' ? '#74ebd5' : 
                       theme === 'forest' ? '#a8ff78' : '#bc6ff1',
    '--panel-bg': baseTheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
    '--panel-border': baseTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    '--text-base': baseTheme === 'dark' ? '#fff' : '#0f172a',
    '--player-bar-bg': baseTheme === 'dark' ? '#0f172a' : '#ffffff'
  } as React.CSSProperties;

  const dummyPassport: PassportData = {
      countriesVisited: [],
      totalListeningMinutes: 120,
      nightListeningMinutes: 45,
      stationsFavorited: 3,
      unlockedAchievements: [],
      level: 2
  };

  const newsMessages = NEWS_MESSAGES[language] || NEWS_MESSAGES.en;

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden ${baseTheme} font-sans text-[var(--text-base)] select-none`} style={themeStyle}>
        
        {/* Background Visualizer - Always visible in background */}
        <div className="absolute inset-0 z-0 bg-slate-950">
            <AudioVisualizer 
                analyserNode={analyserRef.current} 
                isPlaying={isPlaying} 
                variant={vizVariant}
                settings={vizSettings}
            />
        </div>

        {/* Overlays / Effects - Rain etc. */}
        <MusicStorm analyserNode={analyserRef.current} isPlaying={isPlaying && ambience.rainVolume > 0} />
        
        {/* Main UI Container - Controls opacity for Visualizer Mode Auto-Hide */}
        <div className={`relative z-10 flex flex-col h-full transition-opacity duration-1000 ease-in-out ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            
            {/* News Ticker - Just Text */}
            {showDevNews && (
                <div className="absolute top-20 md:top-24 left-0 right-0 z-[120] h-12 flex items-center justify-center pointer-events-none px-4 text-center">
                    <div 
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-base)] transition-opacity duration-1000 ${isNewsVisible ? 'opacity-100' : 'opacity-0'}`}
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        <BellIcon className="w-3 h-3 text-primary" />
                        {newsMessages[currentNewsIndex]}
                    </div>
                </div>
            )}

            {/* Quick Genre/Mood Selector Bar (New) */}
            {activeView === 'player' && (
                <div className="w-full flex flex-col pt-6 pb-2 z-30 shrink-0 animate-in slide-in-from-top-4 duration-700 pointer-events-auto">
                    <div className="w-full overflow-x-auto no-scrollbar" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
                        <div className="flex gap-3 px-6 w-max">
                             {[...MOODS, ...GENRES, ...ERAS].map(cat => (
                                 <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="px-5 py-3 rounded-full bg-black/30 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all active:scale-95 group flex items-center gap-2 shadow-lg hover:border-white/30 hover:shadow-primary/20"
                                 >
                                     <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${cat.color} group-hover:scale-125 transition-transform shadow-[0_0_10px_currentColor]`}></div>
                                     <span className="text-xs font-bold text-white/90 group-hover:text-white uppercase tracking-wider whitespace-nowrap">
                                         {t[cat.id] || cat.name}
                                     </span>
                                 </button>
                             ))}
                             <button 
                                onClick={() => setContextMenuOpen(true)}
                                className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-xl transition-all active:scale-95 text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-wider whitespace-nowrap flex items-center gap-2 hover:border-white/20"
                             >
                                 <span>{language === 'ru' ? 'Еще' : 'More'}</span>
                                 <MenuIcon className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Stage: Player */}
            <div className="flex-1 pointer-events-auto flex flex-col">
                {activeView === 'player' && currentStation && (
                    <div className="flex-1 flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-16 w-full h-full p-4 animate-in fade-in duration-500">
                        {/* Levitating Card */}
                        <div className="relative group perspective-1000 flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000 animate-gradient-xy"></div>
                            <div 
                                className="w-[70vw] h-[70vw] max-w-[320px] max-h-[320px] md:max-w-[400px] md:max-h-[400px] landscape:w-[45vh] landscape:h-[45vh] landscape:max-w-[320px] landscape:max-h-[320px] rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl border border-white/10 bg-black transform transition-transform duration-500 hover:scale-[1.02]"
                                style={{ borderColor: customCardColor ? `rgb(${customCardColor})` : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-20 pointer-events-none"></div>
                                {currentStation.favicon ? (
                                    <img src={currentStation.favicon} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80'; }} />
                                ) : (
                                    <MusicNoteIcon className="w-32 h-32 text-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                            </div>
                        </div>

                        {/* Controls Wrapper */}
                        <div className="flex flex-col w-full max-w-2xl landscape:max-w-md items-center landscape:items-start justify-center">
                            <div className="text-center w-full px-8 relative z-10 mx-auto landscape:text-left landscape:px-0 landscape:mb-4">
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-base)] mb-2 line-clamp-2 leading-tight drop-shadow-lg">{currentStation.name}</h2>
                                <p className="text-xs md:text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-70 truncate">
                                    {currentStation.tags || 'Global Radio'}
                                </p>
                            </div>

                            {/* Unified Player Bar */}
                            <div className="w-full mt-2 bg-[var(--player-bar-bg)]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] px-6 py-4 md:px-8 md:py-5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative z-20">
                                {/* Left: Volume */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors shrink-0">
                                        <VolumeIcon className="w-5 h-5" />
                                    </button>
                                    <div className="h-1 bg-[var(--text-muted)]/20 rounded-full flex-1 max-w-[60px] md:max-w-[100px] relative group cursor-pointer">
                                            <div className="absolute inset-0 bg-[var(--text-base)] origin-left rounded-full transition-all" style={{ width: `${volume * 100}%` }}></div>
                                            <input 
                                                type="range" min="0" max="1" step="0.01" 
                                                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                    </div>
                                </div>

                                {/* Center: Controls */}
                                <div className="flex items-center gap-4 md:gap-6 justify-center flex-1 shrink-0">
                                    <button onClick={handlePreviousStation} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-all hover:scale-110 active:scale-95"><PreviousIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                                    <button onClick={togglePlay} className="w-12 h-12 md:w-16 md:h-16 bg-[var(--text-base)] text-[var(--base-bg)] rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                        {isBuffering ? <LoadingIcon className="w-5 h-5 md:w-8 md:h-8 animate-spin" /> : isPlaying ? <PauseIcon className="w-5 h-5 md:w-8 md:h-8" /> : <PlayIcon className="w-5 h-5 md:w-8 md:h-8 ml-1" />}
                                    </button>
                                    <button onClick={handleNextStation} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-all hover:scale-110 active:scale-95"><NextIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end min-w-0">
                                        {/* Visualizer Mode Toggle Button */}
                                        <button onClick={() => setFullScreenStyle('visualizer')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors hover:bg-white/10 rounded-full" title="Visualizer Mode">
                                            <SparklesIcon className="w-5 h-5" /> 
                                        </button>
                                        <button onClick={() => { setInitialToolsTab('eq'); setToolsOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors hover:bg-white/10 rounded-full" title="Equalizer">
                                            <AdjustmentsIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setContextMenuOpen(!contextMenuOpen)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors hover:bg-white/10 rounded-full">
                                            <MenuIcon className="w-5 h-5" />
                                        </button>
                                </div>
                            </div>
                            
                            {/* Sleep Timer Indicator */}
                            {sleepTimer && (
                                <div className="mt-[-10px] px-4 py-2 bg-[var(--panel-bg)] rounded-full flex items-center gap-2 border border-white/5 backdrop-blur-sm self-center landscape:self-start landscape:mt-2">
                                    <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                    <span className="text-xs font-bold text-[var(--text-base)]">{Math.floor(sleepTimer/60)}:{(sleepTimer%60).toString().padStart(2,'0')} left</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Category Selector (Genres/Moods/Eras) */}
            {contextMenuOpen && (
                <div className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-auto">
                    <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-6 max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl relative">
                        <button onClick={() => setContextMenuOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-10">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter sticky top-0 bg-[#0f172a] z-20 pb-2 border-b border-white/5">Select Vibe</h2>
                        
                        <div className="space-y-8">
                            {/* Moods */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Moods</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {MOODS.map(m => (
                                        <button key={m.id} onClick={() => handleCategorySelect(m)} className={`p-4 rounded-2xl bg-gradient-to-br ${m.color} relative overflow-hidden group hover:scale-[1.02] transition-all shadow-lg`}>
                                            <div className="relative z-10 font-black text-white uppercase tracking-wider text-sm">{t[m.id] || m.name}</div>
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Genres */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Genres</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {GENRES.map(g => (
                                        <button key={g.id} onClick={() => handleCategorySelect(g)} className={`p-4 rounded-2xl bg-gradient-to-br ${g.color} relative overflow-hidden group hover:scale-[1.02] transition-all shadow-lg`}>
                                            <div className="relative z-10 font-black text-white uppercase tracking-wider text-sm">{t[g.id] || g.name}</div>
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Eras */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Eras</h3>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {ERAS.map(e => (
                                        <button key={e.id} onClick={() => handleCategorySelect(e)} className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group`}>
                                            <div className="font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-xs">{t[e.id] || e.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Tools & Settings */}
            {/* Note: Modals are part of the UI container so they fade out too if idle in Vis Mode. This is consistent with 'pure visualizer'. */}
            {/* To prevent fading while using tools, resetIdle is called on interaction. */}
            <ToolsPanel 
                isOpen={toolsOpen} 
                onClose={() => setToolsOpen(false)}
                initialTab={initialToolsTab}
                language={language}
                setLanguage={setLanguage}
                eqGains={eqGains}
                setEqGain={(idx, val) => { const n = [...eqGains]; n[idx] = val; setEqGains(n); }} 
                onSetEqValues={(vals) => setEqGains(vals)}
                sleepTimer={sleepTimer}
                setSleepTimer={setSleepTimer}
                currentTheme={theme}
                setTheme={setTheme}
                baseTheme={baseTheme}
                setBaseTheme={setBaseTheme}
                visualizerVariant={vizVariant}
                setVisualizerVariant={setVizVariant}
                vizSettings={vizSettings}
                setVizSettings={setVizSettings}
                onStartTutorial={() => { setToolsOpen(false); setTutorialOpen(true); }}
                onOpenManual={() => { setToolsOpen(false); setManualOpen(true); }}
                onOpenProfile={() => { setToolsOpen(false); setUserProfile(null); }}
                showDeveloperNews={showDevNews}
                setShowDeveloperNews={setShowDevNews}
                ambience={ambience}
                setAmbience={setAmbience}
                passport={dummyPassport}
                alarm={alarm}
                setAlarm={setAlarm}
                onThrowBottle={() => {}}
                onCheckBottle={() => {}}
                customCardColor={customCardColor}
                setCustomCardColor={setCustomCardColor}
                fxSettings={fxSettings}
                setFxSettings={setFxSettings}
                streamQuality={streamQuality}
                setStreamQuality={setStreamQuality}
                autoStart={autoStart}
                setAutoStart={setAutoStart}
                aiSpeechFilter={aiSpeechFilter}
                setAiSpeechFilter={setAiSpeechFilter}
                onOpenChat={() => { setToolsOpen(false); setChatOpen(true); }}
                fullScreenStyle={fullScreenStyle}
                setFullScreenStyle={setFullScreenStyle}
                onOptimizeStations={handleAiOptimization}
            />

            {/* Side Panel: Chat */}
            <ChatPanel 
                isOpen={chatOpen} 
                onClose={() => setChatOpen(false)} 
                language={language}
                onLanguageChange={setLanguage}
                currentUser={userProfile}
                onUpdateCurrentUser={handleProfileUpdate}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onNextStation={handleNextStation}
                onPrevStation={handlePreviousStation}
                currentStation={currentStation || null}
                analyserNode={analyserRef.current}
                volume={volume}
                onVolumeChange={setVolume}
            />

            {/* Other Modals */}
            <TutorialOverlay isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} language={language} />
            <ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} language={language} />
            <DownloadAppModal isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} language={language} installPrompt={installPrompt} />
            <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} language={language} />
            <GitHubModal isOpen={githubModalOpen} onClose={() => setGithubModalOpen(false)} language={language} />
        </div>

    </div>
  );
};

export default App;
