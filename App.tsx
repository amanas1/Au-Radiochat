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

import {
  MusicNoteIcon, VolumeIcon, PreviousIcon, NextIcon, PlayIcon, PauseIcon,
  LoadingIcon, AdjustmentsIcon, MenuIcon, ClockIcon, XMarkIcon, BellIcon,
  SparklesIcon
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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('streamflow_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [stationVersion, setStationVersion] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const [activeView, setActiveView] = useState<'player' | 'globe' | 'drum' | 'downloader' | 'browser'>('player');
  const [fullScreenStyle, setFullScreenStyle] = useState<'player' | 'visualizer'>('player');
  const [uiVisible, setUiVisible] = useState(true);

  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  const [initialToolsTab, setInitialToolsTab] =
    useState<'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer' | 'settings'>('settings');

  const [theme, setTheme] = useState<ThemeName>('default');
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [vizVariant, setVizVariant] = useState<VisualizerVariant>('galaxy');
  const [vizSettings, setVizSettings] = useState<VisualizerSettings>({
    scaleX: 1, scaleY: 1, brightness: 100, contrast: 100,
    saturation: 100, hue: 0, opacity: 1, speed: 1,
    autoIdle: true, performanceMode: false
  });

  const [ambience, setAmbience] = useState<AmbienceState>({
    rainVolume: 0, rainVariant: 'soft', fireVolume: 0,
    cityVolume: 0, vinylVolume: 0,
    is8DEnabled: false, spatialSpeed: 1
  });

  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [alarm, setAlarm] = useState<AlarmConfig>({ enabled: false, time: '08:00', days: [] });
  const [eqGains, setEqGains] = useState<number[]>(new Array(10).fill(0));
  const [fxSettings, setFxSettings] = useState<FxSettings>({ reverb: 0, speed: 1.0 });
  const [streamQuality, setStreamQuality] = useState<StreamQuality>('standard');

  const [autoStart, setAutoStart] = useState(true);
  const [showDevNews, setShowDevNews] = useState(false);
  const [customCardColor, setCustomCardColor] = useState<string | null>(null);

  const audioRefA = useRef(new Audio());
  const audioRefB = useRef(new Audio());
  const activeSlotRef = useRef<'A' | 'B'>('B');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeARef = useRef<GainNode | null>(null);
  const gainNodeBRef = useRef<GainNode | null>(null);

  const currentStation = stations[currentStationIndex];
  const t = TRANSLATIONS[language];

  // ===== ЗАГЛУШКА AI (чтобы UI не ломался) =====
  const handleAiOptimization = async () => {
    console.warn('AI optimization disabled (frontend only)');
    setToolsOpen(false);
  };

  // ===== ЗАГРУЗКА СТАНЦИЙ =====
  useEffect(() => {
    const loadStations = async () => {
      try {
        const loaded = await fetchStationsByTag('chill', 60, streamQuality);
        if (loaded.length > 0) {
          setStations(loaded);
          if (autoStart) setIsPlaying(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStations();
  }, [streamQuality]);

  if (!userProfile) {
    return <ProfileSetup onComplete={setUserProfile} language={language} />;
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden">
      <AudioVisualizer analyserNode={analyserRef.current} isPlaying={isPlaying} variant={vizVariant} settings={vizSettings} />
      <MusicStorm analyserNode={analyserRef.current} isPlaying={isPlaying && ambience.rainVolume > 0} />

      <ToolsPanel
        isOpen={toolsOpen}
        onClose={() => setToolsOpen(false)}
        initialTab={initialToolsTab}
        language={language}
        setLanguage={setLanguage}
        eqGains={eqGains}
        setEqGain={(i, v) => {
          const n = [...eqGains];
          n[i] = v;
          setEqGains(n);
        }}
        onSetEqValues={setEqGains}
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
        showDeveloperNews={showDevNews}
        setShowDeveloperNews={setShowDevNews}
        ambience={ambience}
        setAmbience={setAmbience}
        alarm={alarm}
        setAlarm={setAlarm}
        customCardColor={customCardColor}
        setCustomCardColor={setCustomCardColor}
        fxSettings={fxSettings}
        setFxSettings={setFxSettings}
        streamQuality={streamQuality}
        setStreamQuality={setStreamQuality}
        autoStart={autoStart}
        setAutoStart={setAutoStart}
        onOptimizeStations={handleAiOptimization}
        fullScreenStyle={fullScreenStyle}
        setFullScreenStyle={setFullScreenStyle}
        onOpenChat={() => setChatOpen(true)}
      />

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        currentUser={userProfile}
        onUpdateCurrentUser={setUserProfile}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNextStation={() => setCurrentStationIndex(i => (i + 1) % stations.length)}
        onPrevStation={() => setCurrentStationIndex(i => (i - 1 + stations.length) % stations.length)}
        currentStation={currentStation || null}
        analyserNode={analyserRef.current}
        volume={volume}
        onVolumeChange={setVolume}
      />

      <TutorialOverlay isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} language={language} />
      <ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} language={language} />
      <DownloadAppModal isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} language={language} installPrompt={null} />
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} language={language} />
      <GitHubModal isOpen={githubModalOpen} onClose={() => setGithubModalOpen(false)} language={language} />
    </div>
  );
};

export default App;
