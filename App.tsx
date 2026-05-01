
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  RadioStation, ThemeName, BaseTheme, Language, 
  VisualizerVariant, VisualizerSettings, AmbienceState, PassportData, 
  AlarmConfig, FxSettings, StreamQuality, CategoryInfo, InterfaceMode
} from './types';
import { 
  DEFAULT_VOLUME, TRANSLATIONS, GENRES, MOODS, ERAS, NEWS_MESSAGES 
} from './constants';
import { fetchStationsByTag, fetchRandomStations } from './services/radioService';
import { detectSpeechFromSpectrum, isAiAvailable, optimizeStationList } from './services/geminiService';
import { 
  MusicNoteIcon, VolumeIcon, PreviousIcon, NextIcon, PlayIcon, PauseIcon, 
  LoadingIcon, AdjustmentsIcon, MenuIcon, ClockIcon, BellIcon, MaximizeIcon, XMarkIcon,
  MinusIcon, PlusIcon, HeartIcon
} from './components/Icons';

import AudioVisualizer from './components/AudioVisualizer';
import DancingAvatar from './components/DancingAvatar';
import CardVisualizer from './components/CardVisualizer';

// Lazy load heavy components
const ToolsPanel = React.lazy(() => import('./components/ToolsPanel'));
const MusicStorm = React.lazy(() => import('./components/MusicStorm'));
const TutorialOverlay = React.lazy(() => import('./components/TutorialOverlay'));
const ManualModal = React.lazy(() => import('./components/ManualModal'));
const DownloadAppModal = React.lazy(() => import('./components/DownloadAppModal'));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal'));
const GitHubModal = React.lazy(() => import('./components/GitHubModal'));

const App: React.FC = () => {
  // --- Application State ---

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [stationVersion, setStationVersion] = useState(0);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [favorites, setFavorites] = useState<RadioStation[]>(() => {
    try {
      const saved = localStorage.getItem('streamflow_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('streamflow_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (station: RadioStation) => {
    return station ? favorites.some(s => s.stationuuid === station.stationuuid) : false;
  };

  const toggleFavorite = (station: RadioStation) => {
    if (!station) return;
    
    setFavorites(prev => {
      const exists = prev.find(s => s.stationuuid === station.stationuuid);
      if (exists) {
        return prev.filter(s => s.stationuuid !== station.stationuuid);
      } else {
        return [station, ...prev];
      }
    });

    if (currentCategory?.id === 'favorites') {
        setStations(prev => {
            const indexToRemove = prev.findIndex(s => s.stationuuid === station.stationuuid);
            if (indexToRemove === -1) return prev;
            
            const newStations = prev.filter(s => s.stationuuid !== station.stationuuid);
            
            if (indexToRemove < currentStationIndex) {
                setCurrentStationIndex(prevIndex => Math.max(0, prevIndex - 1));
            } else if (indexToRemove === currentStationIndex) {
                setCurrentStationIndex(prevIndex => Math.min(prevIndex, Math.max(0, newStations.length - 1)));
            }
            
            // If they removed the last station in the favorites list, we should probably stop playing, but we'll leave it as is for now.
            return newStations;
        });
    }
  };
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  
  // --- UI State ---
  const [activeView, setActiveView] = useState<'player' | 'globe' | 'drum' | 'downloader' | 'browser'>('player');
  const [fullScreenStyle, setFullScreenStyle] = useState<'player' | 'visualizer'>('player');
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('standard');
  const [uiVisible, setUiVisible] = useState(true);
  
  // Modals & Panels
  const [toolsOpen, setToolsOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  
  const [initialToolsTab, setInitialToolsTab] = useState<'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer' | 'settings'>('settings');
  
  // Settings & Preferences
  const [theme, setTheme] = useState<ThemeName>('volcano');
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('dark');
  const [language, setLanguage] = useState<Language>('ru');
  const [vizVariant, setVizVariant] = useState<VisualizerVariant>('galaxy');
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>({
    scaleX: 1, scaleY: 1.2, brightness: 160, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 0.5, autoIdle: true, performanceMode: false, showPlanets: false, expandLastRing: false
  });
  const [ambience, setAmbience] = useState<AmbienceState>({
    rainVolume: 0, rainVariant: 'soft', fireVolume: 0, cityVolume: 0, vinylVolume: 0, is8DEnabled: false, spatialSpeed: 1
  });
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [alarm, setAlarm] = useState<AlarmConfig>({ enabled: false, time: '08:00', days: [] });
  const [eqGains, setEqGains] = useState<number[]>([2, 1, 0, -1, -2, -1, 0, 1, 1, 2]);
  const [fxSettings, setFxSettings] = useState<FxSettings>({ reverb: 0, speed: 1.0 });
  const [streamQuality, setStreamQuality] = useState<StreamQuality>('standard');
  const [idleModeEnabled, setIdleModeEnabled] = useState(false);
  
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false); // New Shuffle State
  const [currentCategory, setCurrentCategory] = useState<CategoryInfo | null>(null);

  const [autoStart, setAutoStart] = useState(() => {
      const saved = localStorage.getItem('streamflow_autostart');
      return saved !== null ? JSON.parse(saved) : true; 
  });

  const [showDevNews, setShowDevNews] = useState(false);
  const [customCardColor, setCustomCardColor] = useState<string | null>(null);
  const [aiSpeechFilter, setAiSpeechFilter] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- CROSSFADE AUDIO ENGINE REFS ---
  const audioRefA = useRef<HTMLAudioElement>(new Audio());
  const audioRefB = useRef<HTMLAudioElement>(new Audio());
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

  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const stationsContainerRef = useRef<HTMLDivElement>(null);

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isNewsVisible, setIsNewsVisible] = useState(true);
  const [imgError, setImgError] = useState(false);

  const currentStation = stations[currentStationIndex];
  const t = TRANSLATIONS[language];

  useEffect(() => {
      localStorage.setItem('streamflow_autostart', JSON.stringify(autoStart));
  }, [autoStart]);

  // Reset image error state when station changes
  useEffect(() => {
      setImgError(false);
  }, [currentStationIndex, stations]);

  const playSafe = (audio: HTMLAudioElement) => {
      const p = audio.play();
      if (p !== undefined) {
          p.catch(e => {
              if (e.name !== 'AbortError') console.warn("Audio Play Error:", e);
          });
      }
  };

  const initAudioContext = () => {
    if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    
    if (!sourceARef.current) sourceARef.current = ctx.createMediaElementSource(audioRefA.current);
    if (!sourceBRef.current) sourceBRef.current = ctx.createMediaElementSource(audioRefB.current);

    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    
    gainA.gain.value = 0;
    gainB.gain.value = 0;

    sourceARef.current.connect(gainA);
    sourceBRef.current.connect(gainB);

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

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    pannerRef.current = panner;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    gainA.connect(filters[0]);
    gainB.connect(filters[0]);

    let prevNode: AudioNode = filters[0];
    for (let i = 1; i < filters.length; i++) {
        prevNode.connect(filters[i]);
        prevNode = filters[i];
    }
    
    prevNode.connect(panner);
    panner.connect(analyser);
    analyser.connect(ctx.destination);
    
    audioContextRef.current = ctx;
    gainNodeARef.current = gainA;
    gainNodeBRef.current = gainB;
  };

  useEffect(() => {
      if (baseTheme === 'light') {
          document.body.classList.add('light-mode');
      } else {
          document.body.classList.remove('light-mode');
      }
  }, [baseTheme]);

  useEffect(() => {
      if (eqFiltersRef.current.length > 0 && audioContextRef.current) {
          eqFiltersRef.current.forEach((filter, i) => {
              filter.gain.setTargetAtTime(eqGains[i], audioContextRef.current!.currentTime, 0.1);
          });
      }
  }, [eqGains]);

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
  }, [ambience.is8DEnabled, ambience.spatialSpeed, isPlaying]);

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

  const loadStations = async (tag = 'chill') => {
      setStationsLoading(true);
      try {
        const loaded = await fetchStationsByTag(tag, 60, streamQuality);
        if (loaded && loaded.length > 0) {
            setStations(loaded);
            if (autoStart) {
                setIsPlaying(true);
            }
        } else {
            setStations([]);
        }
      } catch (e) {
        console.error("Failed to load stations", e);
        setStations([]);
      } finally {
        setStationsLoading(false);
      }
  };

  const handleNextStation = (e?: React.MouseEvent | any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (stations.length === 0) return;
    setIsBuffering(true);
    if (stations.length === 1) {
        setStationVersion(v => v + 1);
        return;
    }
    setCurrentStationIndex(prev => (prev + 1) % stations.length);
  };

  const handlePreviousStation = (e?: React.MouseEvent | any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (stations.length === 0) return;
    setIsBuffering(true);
    if (stations.length === 1) {
        setStationVersion(v => v + 1);
        return;
    }
    setCurrentStationIndex(prev => (prev - 1 + stations.length) % stations.length);
  };

  const togglePlay = (e?: React.MouseEvent | any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (stations.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
      let interval: any;
      if (aiSpeechFilter && isPlaying && isAiAvailable() && analyserRef.current && currentStation) {
          interval = setInterval(async () => {
              if (!analyserRef.current) return;
              const tags = (currentStation.tags || '').toLowerCase();
              if (tags.includes('hip hop') || tags.includes('hip-hop') || tags.includes('rap')) return;

              const bufferLength = analyserRef.current.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              analyserRef.current.getByteFrequencyData(dataArray);
              const hasData = dataArray.some(val => val > 0);
              
              if (hasData && !retryWithoutCorsRef.current) { 
                  setAiProcessing(true);
                  const spectrum = Array.from(dataArray);
                  const isSpeech = await detectSpeechFromSpectrum(spectrum);
                  setAiProcessing(false);
                  if (isSpeech) {
                      handleNextStation();
                  }
              }
          }, 10000); 
      }
      return () => clearInterval(interval);
  }, [aiSpeechFilter, isPlaying, currentStation]);

  // --- IDLE MODE LOGIC ---
  useEffect(() => {
      let timeout: number;
      const resetIdle = () => {
          if (!uiVisible) setUiVisible(true);
          clearTimeout(timeout);
          // Auto-hide UI if autoIdle enabled OR visualizer mode selected
          if ((vizSettings.autoIdle || fullScreenStyle === 'visualizer') && !toolsOpen && !tutorialOpen && !manualOpen && !downloadModalOpen && !feedbackModalOpen && !githubModalOpen) {
              timeout = window.setTimeout(() => {
                  setUiVisible(false);
              }, 20000); // 20 seconds
          }
      };
      
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
  }, [vizSettings.autoIdle, fullScreenStyle, toolsOpen, tutorialOpen, manualOpen, downloadModalOpen, feedbackModalOpen, githubModalOpen, uiVisible]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setDownloadModalOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    loadStations();
  }, [streamQuality]);

  useEffect(() => {
    if (!currentStation) return;
    
    const targetSlot = activeSlotRef.current === 'A' ? 'B' : 'A';
    const targetAudio = targetSlot === 'A' ? audioRefA.current : audioRefB.current;
    const currentAudio = targetSlot === 'A' ? audioRefB.current : audioRefA.current;
    
    retryWithoutCorsRef.current = false;
    errorCountRef.current = 0; 
    targetAudio.crossOrigin = "anonymous";
    targetAudio.src = currentStation.url_resolved;
    targetAudio.load();
    
    if (isPlaying) {
        initAudioContext();
        playSafe(targetAudio);

        const ctx = audioContextRef.current;
        const targetGain = targetSlot === 'A' ? gainNodeARef.current : gainNodeBRef.current;
        const currentGain = targetSlot === 'A' ? gainNodeBRef.current : gainNodeARef.current;

        if (ctx && targetGain && currentGain) {
            const now = ctx.currentTime;
            const FADE_DURATION = 2.5; 

            targetGain.gain.cancelScheduledValues(now);
            targetGain.gain.setValueAtTime(0, now); 
            targetGain.gain.linearRampToValueAtTime(1, now + FADE_DURATION); 

            currentGain.gain.cancelScheduledValues(now);
            currentGain.gain.setValueAtTime(1, now);
            currentGain.gain.linearRampToValueAtTime(0, now + FADE_DURATION); 
        }
    }
    
    activeSlotRef.current = targetSlot;

    const FADE_DURATION_MS = 2500;
    const timeoutId = setTimeout(() => {
        const isCurrentActive = (activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current) === currentAudio;
        if (!isCurrentActive) {
            currentAudio.pause();
        }
    }, FADE_DURATION_MS + 200);

    const handleCanPlay = () => {
        setIsBuffering(false);
        errorCountRef.current = 0; 
    };
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
        setIsBuffering(false);
        setIsPlaying(true);
    };
    const handlePause = () => {
        if (activeSlotRef.current === targetSlot) setIsPlaying(false);
    };
    
    const handleError = (e: any) => {
        const el = e.target as HTMLAudioElement;
        const error = el.error;
        const errorMessage = error ? `MediaError code: ${error.code} (${error.message})` : 'Unknown error';

        if (el.crossOrigin === "anonymous" && !retryWithoutCorsRef.current) {
            console.warn(`Audio blocked (CORS likely). Retrying in "No-CORS" mode.`);
            retryWithoutCorsRef.current = true;
            el.removeAttribute('crossOrigin');
            const src = el.src; 
            el.src = src; 
            el.load();
            if (isPlaying) playSafe(el);
            return;
        }
        
        console.error(`Audio Fatal Error on Slot ${targetSlot}: ${errorMessage}`);
        
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
    
    targetAudio.addEventListener('canplay', handleCanPlay);
    targetAudio.addEventListener('waiting', handleWaiting);
    targetAudio.addEventListener('playing', handlePlaying);
    targetAudio.addEventListener('pause', handlePause);
    targetAudio.addEventListener('error', handleError);
    
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
        clearTimeout(timeoutId); 
    };

  }, [currentStationIndex, streamQuality, stationVersion]);

  useEffect(() => {
    const activeAudio = activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current;
    if (isPlaying) {
      initAudioContext();
      if (activeAudio.paused) {
          playSafe(activeAudio);
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

  useEffect(() => {
    audioRefA.current.volume = volume;
    audioRefB.current.volume = volume;
  }, [volume]);

  useEffect(() => {
      let interval: number;
      if (sleepTimer) {
          interval = window.setInterval(() => {
              setSleepTimer(prev => {
                  if (prev && prev > 1) return prev - 1;
                  setIsPlaying(false);
                  return null;
              });
          }, 60000); 
      }
      return () => clearInterval(interval);
  }, [sleepTimer]);

  const handleCategorySelect = async (category: CategoryInfo) => {
    setContextMenuOpen(false);
    setCurrentCategory(category);
    if (category.id === 'favorites') {
        if (favorites.length > 0) {
            setStations(favorites);
            setCurrentStationIndex(0);
            setStationVersion(v => v + 1);
            setIsPlaying(true);
            setAutoStart(true);
        }
        return;
    }

    setIsBuffering(true);
    try {
        const newStations = await fetchStationsByTag(category.id, 60, streamQuality);
        if (newStations.length > 0) {
            setStations(newStations);
            setCurrentStationIndex(0);
            setStationVersion(v => v + 1); 
            setIsPlaying(true);
            setAutoStart(true);
        } else {
            setStations([]);
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
      } catch (e) {
          console.error("Optimization failed", e);
      } finally {
          setIsBuffering(false);
          setToolsOpen(false);
      }
  };

  // Re-creates the Audio Context if output device is lost/switched
  const handleRestartAudio = async () => {
      if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
      }
      
      sourceARef.current = null;
      sourceBRef.current = null;
      gainNodeARef.current = null;
      gainNodeBRef.current = null;
      eqFiltersRef.current = [];
      pannerRef.current = null;
      analyserRef.current = null;

      initAudioContext();

      if (isPlaying && audioContextRef.current && gainNodeARef.current && gainNodeBRef.current) {
           const activeGain = activeSlotRef.current === 'A' ? gainNodeARef.current : gainNodeBRef.current;
           activeGain.gain.setValueAtTime(1, audioContextRef.current.currentTime);
           const activeAudio = activeSlotRef.current === 'A' ? audioRefA.current : audioRefB.current;
           playSafe(activeAudio);
      }
  };

  // --- CURSOR TRACKING FOR NAV (Sensitivity Fix) ---
  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
          const windowWidth = window.innerWidth;
          
          // Only trigger tracking if cursor is in the top 300px (closer to genres & stations)
          if (clientY > 300) return;

          // Calculate percentage of screen width (0 to 1)
          const percentage = Math.max(0, Math.min(1, clientX / windowWidth));
          
          const containers = [categoryContainerRef.current, stationsContainerRef.current];
          let needsAnimation = false;

          containers.forEach(container => {
              if (!container) return;
              const maxScroll = container.scrollWidth - container.clientWidth;
              const targetScroll = maxScroll * percentage;
              
              // Smooth scroll
              const currentScroll = container.scrollLeft;
              const diff = targetScroll - currentScroll;
              
              if (Math.abs(diff) > 1) {
                  container.scrollLeft = currentScroll + diff * 0.1; // Lerp factor
                  needsAnimation = true;
              }
          });

          if (needsAnimation) {
              requestAnimationFrame(() => handleMove(e));
          }
      };

      const onInteraction = (e: MouseEvent | TouchEvent) => {
          requestAnimationFrame(() => handleMove(e));
      };

      window.addEventListener('mousemove', onInteraction);
      window.addEventListener('touchmove', onInteraction);

      return () => {
          window.removeEventListener('mousemove', onInteraction);
          window.removeEventListener('touchmove', onInteraction);
      };
  }, []);

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
    '--player-bar-bg': baseTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'
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

  // Render logic based on Interface Mode
  const isMinimal = interfaceMode === 'minimal' || interfaceMode === 'focus';
  const isFocus = interfaceMode === 'focus';
  const isParty = interfaceMode === 'party';

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden ${baseTheme} font-sans text-[var(--text-base)] select-none`} style={themeStyle}>
        
        <div className="absolute inset-0 z-0 bg-slate-950">
            <AudioVisualizer 
                analyserNode={analyserRef.current} 
                isPlaying={isPlaying} 
                variant={isParty ? 'stage-dancer' : vizVariant}
                settings={{...vizSettings, brightness: isParty ? 150 : vizSettings.brightness, speed: isParty ? 1.5 : vizSettings.speed}}
            />
        </div>

        {vizSettings.showPlanets && (
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen select-none">
                {/* Mercury */}
                <div className="absolute top-[15%] left-[12%] w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 via-gray-500 to-gray-700 opacity-60 blur-[1px] animate-[planet-float_18s_linear_infinite]"></div>
                
                {/* Venus */}
                <div className="absolute top-[55%] left-[8%] w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 via-yellow-500 to-orange-700 opacity-50 blur-[2px] animate-[planet-float_24s_linear_infinite_reverse]"></div>
                
                {/* Earth */}
                <div className="absolute top-[12%] right-[18%] w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-green-400 to-blue-800 opacity-50 blur-[2px] animate-[planet-float_32s_linear_infinite]">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]"></div>
                </div>
                
                {/* Mars */}
                <div className="absolute bottom-[28%] left-[22%] w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-950 opacity-60 blur-[1px] animate-[planet-float_20s_linear_infinite]"></div>
                
                {/* Jupiter */}
                <div className="absolute top-[38%] right-[12%] w-32 h-32 rounded-full bg-gradient-to-br from-orange-200 via-yellow-700 to-orange-900 opacity-40 blur-[3px] animate-[planet-float_45s_linear_infinite]">
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(transparent,transparent_8px,rgba(0,0,0,0.3)_8px,rgba(0,0,0,0.3)_16px)] rounded-full"></div>
                </div>
                
                {/* Saturn */}
                <div className="absolute bottom-[12%] right-[28%] w-28 h-28 flex items-center justify-center animate-[planet-float_38s_linear_infinite_reverse]">
                    {/* Back Ring */}
                    <div className="absolute w-[220%] h-[220%] rounded-full scale-y-[0.25] rotate-[-20deg] opacity-40"
                         style={{ 
                             background: 'radial-gradient(circle, transparent 40%, #e2c07d 41%, #c5a35d 50%, #9a7d44 51%, #c5a35d 65%, transparent 66%)',
                             clipPath: 'inset(0 0 50% 0)'
                         }}>
                    </div>
                    
                    {/* Planet Body */}
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#f4e4bc] via-[#d2b48c] to-[#8b7355] opacity-90 shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(210,180,140,0.3)] border border-white/5"></div>
                    
                    {/* Front Ring */}
                    <div className="absolute w-[220%] h-[220%] rounded-full scale-y-[0.25] rotate-[-20deg] opacity-40"
                         style={{ 
                             background: 'radial-gradient(circle, transparent 40%, #e2c07d 41%, #c5a35d 50%, #9a7d44 51%, #c5a35d 65%, transparent 66%)',
                             clipPath: 'inset(50% 0 0 0)'
                         }}>
                    </div>
                </div>
                
                {/* Uranus */}
                <div className="absolute top-[75%] right-[8%] w-18 h-18 rounded-full bg-gradient-to-br from-cyan-100 via-cyan-400 to-blue-400 opacity-40 blur-[3px] animate-[planet-float_55s_linear_infinite]"></div>
                
                {/* Neptune */}
                <div className="absolute bottom-[22%] left-[6%] w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-700 to-blue-950 opacity-40 blur-[3px] animate-[planet-float_62s_linear_infinite_reverse]"></div>
            </div>
        )}

        <MusicStorm analyserNode={analyserRef.current} isPlaying={isPlaying && ambience.rainVolume > 0} />
        
        <div className={`relative z-10 flex flex-col h-full transition-opacity duration-1000 ease-in-out ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            
            {showDevNews && !isFocus && (
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

            {activeView === 'player' && !isMinimal && (
                <div className="w-full flex flex-col pt-6 pb-2 z-30 shrink-0 animate-in slide-in-from-top-4 duration-700 pointer-events-auto">
                    <div 
                        ref={categoryContainerRef}
                        className="w-full overflow-x-hidden no-scrollbar cursor-none" 
                        style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
                    >
                        <div className="flex gap-3 px-6 w-max">
                             <button
                                onClick={() => handleCategorySelect({ id: 'favorites', name: 'Favorites', color: 'from-rose-500 to-pink-500' })}
                                className="px-5 py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 backdrop-blur-xl transition-all active:scale-95 group flex items-center gap-2 shadow-lg"
                             >
                                 <HeartIcon className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" filled={true} />
                                 <span className="text-xs font-bold text-rose-500 uppercase tracking-wider whitespace-nowrap">
                                     {language === 'ru' ? 'Избранное' : 'Favorites'} {favorites.length > 0 && `(${favorites.length})`}
                                 </span>
                             </button>
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
                    
                    {/* Stations List Row (Only for Favorites) */}
                    {stations.length > 0 && currentCategory?.id === 'favorites' && (
                        <div 
                            ref={stationsContainerRef}
                            className="w-full overflow-x-auto no-scrollbar cursor-pointer mt-4 animate-in slide-in-from-top-2 duration-500" 
                            style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
                        >
                            <div className="flex gap-2 px-6 w-max">
                                {stations.map((station, index) => (
                                    <div
                                        key={station.stationuuid}
                                        className={`px-3 py-1.5 rounded-full border backdrop-blur-xl transition-all flex items-center gap-2 shadow-sm ${currentStationIndex === index ? 'bg-rose-500/20 border-rose-500/50 text-white' : 'bg-black/40 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'}`}
                                    >
                                        <button
                                            onClick={() => {
                                                setCurrentStationIndex(index);
                                                setIsPlaying(true);
                                                setAutoStart(true);
                                            }}
                                            className="flex items-center gap-2 active:scale-95 outline-none"
                                        >
                                            <HeartIcon className={`w-3 h-3 ${currentStationIndex === index ? 'text-rose-500' : 'text-rose-400'}`} filled={true} />
                                            <span className="text-xs font-bold whitespace-nowrap max-w-[120px] truncate">
                                                {station.name}
                                            </span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(station);
                                            }}
                                            className="p-1 hover:bg-white/20 rounded-full transition-colors active:scale-95 ml-1"
                                            title="Remove from favorites"
                                        >
                                            <XMarkIcon className="w-3 h-3 text-slate-400 hover:text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 pointer-events-auto flex flex-col justify-center">
                {activeView === 'player' && (
                    stationsLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
                             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                             <h3 className="text-xl font-bold text-[var(--text-base)] mb-2">{language === 'ru' ? 'Сканирование эфира...' : 'Scanning Frequencies...'}</h3>
                             <p className="text-[var(--text-muted)] text-sm max-w-md">{language === 'ru' ? 'Подключаемся к глобальным серверам.' : 'Connecting to global radio servers.'}</p>
                        </div>
                    ) : stations.length > 0 && currentStation ? (
                        <div className={`flex flex-col ${isMinimal ? 'items-center gap-4' : 'landscape:flex-row items-center justify-center gap-8 landscape:gap-16'} w-full h-full p-4 animate-in fade-in duration-500`}>
                            {/* Card Section */}
                            <div className="relative flex-shrink-0">
                                <div 
                                    className={`${isMinimal ? 'w-[200px] h-[200px] rounded-[2rem]' : 'w-[70vw] h-[70vw] max-w-[320px] max-h-[320px] md:max-w-[400px] md:max-h-[400px] landscape:w-[45vh] landscape:h-[45vh] landscape:max-w-[320px] landscape:max-h-[320px] rounded-[2.5rem]'} relative z-10 transform transition-transform duration-500 hover:scale-[1.02]`}
                                >
                                    <div
                                        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none"
                                        style={{
                                            width: 'min(130vw, 900px)',
                                            height: 'min(130vw, 900px)'
                                        }}
                                    >
                                        {vizVariant !== 'mixed-rings' && (
                                            <CardVisualizer analyserNode={analyserRef.current} isPlaying={isPlaying} color="var(--color-primary)" expandLastRing={vizSettings.expandLastRing !== false} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Controls Section */}
                            <div className={`flex flex-col w-full ${isMinimal ? 'max-w-xs' : 'max-w-2xl landscape:max-w-md'} items-center ${!isMinimal && 'landscape:items-start'} justify-center`}>
                                <div className={`text-center w-full px-8 relative z-10 mx-auto ${!isMinimal && 'landscape:text-left landscape:px-0 landscape:mb-4'}`}>
                                    <h2 className={`${isMinimal ? 'text-xl' : 'text-2xl md:text-3xl'} font-black text-[var(--text-base)] mb-2 line-clamp-2 leading-tight drop-shadow-lg`}>{currentStation.name}</h2>
                                    <p className="text-xs md:text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-70 truncate">
                                        {currentStation.tags || 'Global Radio'}
                                    </p>
                                </div>

                                <div className={`w-full mt-2 bg-[var(--player-bar-bg)] backdrop-blur-2xl border border-white/10 rounded-[3rem] px-4 py-4 md:px-8 md:py-5 grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative z-20`}>
                                    {!isFocus ? (
                                        <div className="flex items-center gap-2 md:gap-3 justify-start min-w-0 pr-2">
                                            <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors shrink-0">
                                                <VolumeIcon className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <div className="h-1 bg-[var(--text-muted)]/20 rounded-full flex-1 min-w-[20px] max-w-[80px] md:max-w-[100px] relative group cursor-pointer">
                                                    <div className="absolute inset-0 bg-[var(--text-base)] origin-left rounded-full transition-all" style={{ width: `${volume * 100}%` }}></div>
                                                    <input 
                                                        type="range" min="0" max="1" step="0.01" 
                                                        value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                            </div>
                                            <button 
                                                onClick={() => toggleFavorite(currentStation)} 
                                                className={`p-1.5 md:p-2 transition-all hover:scale-125 active:scale-90 shrink-0 mr-8 md:mr-14 ${isFavorite(currentStation) ? 'text-rose-500' : 'text-[var(--text-muted)] hover:text-rose-400'}`}
                                            >
                                                <HeartIcon className="w-4 h-4 md:w-6 md:h-6" filled={isFavorite(currentStation)} />
                                            </button>
                                        </div>
                                    ) : <div></div>}

                                    <div className="flex items-center gap-3 md:gap-6 justify-center">
                                        <button onClick={handlePreviousStation} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-all hover:scale-110 active:scale-95"><PreviousIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                                        <button onClick={togglePlay} className="w-12 h-12 md:w-16 md:h-16 bg-[var(--text-base)] text-[var(--base-bg)] rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0">
                                            {isBuffering ? <LoadingIcon className="w-5 h-5 md:w-8 md:h-8 animate-spin" /> : isPlaying ? <PauseIcon className="w-5 h-5 md:w-8 md:h-8" /> : <PlayIcon className="w-5 h-5 md:w-8 md:h-8 ml-1" />}
                                        </button>
                                        <button onClick={handleNextStation} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-all hover:scale-110 active:scale-95"><NextIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                                    </div>

                                    {!isFocus ? (
                                        <div className="flex items-center gap-1 md:gap-4 justify-end min-w-0 pl-2">
                                                <button onClick={() => { setInitialToolsTab('eq'); setToolsOpen(true); }} className="p-1.5 md:p-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors hover:bg-white/10 rounded-full shrink-0" title="Equalizer">
                                                    <AdjustmentsIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                                <button onClick={() => setContextMenuOpen(!contextMenuOpen)} className="p-1.5 md:p-2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors hover:bg-white/10 rounded-full shrink-0">
                                                    <MenuIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                        </div>
                                    ) : <div></div>}
                                </div>
                                
                                {sleepTimer && (
                                    <div className="mt-[-10px] px-4 py-2 bg-[var(--panel-bg)] rounded-full flex items-center gap-2 border border-white/5 backdrop-blur-sm self-center landscape:self-start landscape:mt-2">
                                        <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                        <span className="text-xs font-bold text-[var(--text-base)]">{Math.floor(sleepTimer/60)}:{(sleepTimer%60).toString().padStart(2,'0')} left</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
                             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                 <XMarkIcon className="w-8 h-8 text-slate-500" />
                             </div>
                             <h3 className="text-xl font-bold text-[var(--text-base)] mb-2">{language === 'ru' ? 'Станции не найдены' : 'No Stations Found'}</h3>
                             <p className="text-[var(--text-muted)] text-sm max-w-md mb-6">{language === 'ru' ? 'Попробуйте другую категорию или перезагрузите.' : 'Try a different category or retry connection.'}</p>
                             <button onClick={() => loadStations('chill')} className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-all">
                                {language === 'ru' ? 'Повторить' : 'Retry'}
                             </button>
                        </div>
                    )
                )}
            </div>

            {contextMenuOpen && (
                <div className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-auto">
                    <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-6 max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl relative">
                        <button onClick={() => setContextMenuOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-10">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter sticky top-0 bg-[#0f172a] z-20 pb-2 border-b border-white/5">Select Vibe</h2>
                        
                        <div className="space-y-8">
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
                fullScreenStyle={fullScreenStyle}
                setFullScreenStyle={setFullScreenStyle}
                onOptimizeStations={handleAiOptimization}
                onRestartAudio={handleRestartAudio}
                interfaceMode={interfaceMode}
                setInterfaceMode={setInterfaceMode}
                isShuffleEnabled={isShuffleEnabled}
                setIsShuffleEnabled={setIsShuffleEnabled}
            />

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
