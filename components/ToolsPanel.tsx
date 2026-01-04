
import React, { useState, useEffect } from 'react';
import { 
  ThemeName, BaseTheme, Language, VisualizerVariant, VisualizerSettings, 
  AmbienceState, PassportData, AlarmConfig, FxSettings, StreamQuality, InterfaceMode
} from '../types';
import { TRANSLATIONS, EQ_PRESETS, INTERFACE_MODES } from '../constants';
import { 
  XMarkIcon, AdjustmentsIcon, MoonIcon, PaletteIcon, 
  SwatchIcon, CloudIcon, MusicNoteIcon, ClockIcon, FireIcon, BellIcon,
  LifeBuoyIcon, ChatBubbleIcon, MaximizeIcon, SparklesIcon, MicrophoneIcon, GitHubIcon, MinusIcon, PlusIcon, ShuffleIcon
} from './Icons';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  eqGains: number[];
  setEqGain: (index: number, value: number) => void;
  onSetEqValues: (values: number[]) => void;
  sleepTimer: number | null;
  setSleepTimer: (seconds: number | null) => void;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  baseTheme: BaseTheme;
  setBaseTheme: (mode: BaseTheme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  visualizerVariant: VisualizerVariant;
  setVisualizerVariant: (v: VisualizerVariant) => void;
  vizSettings: VisualizerSettings;
  setVizSettings: (s: VisualizerSettings) => void;
  onStartTutorial: () => void;
  onOpenManual: () => void;
  onOpenProfile: () => void;
  onOpenGithub?: () => void;
  showDeveloperNews: boolean;
  setShowDeveloperNews: (show: boolean) => void;
  ambience: AmbienceState;
  setAmbience: (a: AmbienceState) => void;
  passport: PassportData;
  alarm: AlarmConfig;
  setAlarm: (a: AlarmConfig) => void;
  onThrowBottle: () => void;
  onCheckBottle: () => void;
  customCardColor: string | null;
  setCustomCardColor: (c: string | null) => void;
  fxSettings: FxSettings;
  setFxSettings: (val: React.SetStateAction<FxSettings>) => void;
  streamQuality: StreamQuality;
  setStreamQuality: (q: StreamQuality) => void;
  autoStart: boolean;
  setAutoStart: (b: boolean) => void;
  onOpenChat?: () => void;
  initialTab?: 'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer' | 'settings';
  fullScreenStyle?: 'player' | 'visualizer';
  setFullScreenStyle?: (style: 'player' | 'visualizer') => void;
  aiSpeechFilter?: boolean;
  setAiSpeechFilter?: (enabled: boolean) => void;
  onOptimizeStations?: () => void;
  onRestartAudio?: () => void;
  isShuffleEnabled?: boolean;
  setIsShuffleEnabled?: (enabled: boolean) => void;
  interfaceMode?: InterfaceMode;
  setInterfaceMode?: (mode: InterfaceMode) => void;
}

const VISUALIZERS: { id: VisualizerVariant; name: string }[] = [
  { id: 'galaxy', name: 'Galaxy' },
  { id: 'stage-dancer', name: 'Stage Dancer' },
  { id: 'viz-journey', name: 'Journey' },
  { id: 'rainbow-lines', name: 'Neon' },
  { id: 'mixed-rings', name: 'Rings' },
  { id: 'bubbles', name: 'Bubbles' },
];

const THEMES: ThemeName[] = ['default', 'emerald', 'midnight', 'cyber', 'volcano', 'ocean', 'sakura', 'gold', 'frost', 'forest'];

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  isOpen, onClose,
  eqGains, setEqGain, onSetEqValues,
  sleepTimer, setSleepTimer,
  currentTheme, setTheme, baseTheme, setBaseTheme,
  language, setLanguage,
  visualizerVariant, setVisualizerVariant, vizSettings, setVizSettings,
  onStartTutorial, onOpenManual, onOpenProfile, onOpenGithub,
  showDeveloperNews, setShowDeveloperNews,
  ambience, setAmbience, passport, alarm, setAlarm, onThrowBottle, onCheckBottle,
  customCardColor, setCustomCardColor,
  fxSettings, setFxSettings,
  streamQuality, setStreamQuality,
  autoStart, setAutoStart,
  onOpenChat,
  initialTab = 'settings',
  fullScreenStyle, setFullScreenStyle,
  aiSpeechFilter, setAiSpeechFilter, onOptimizeStations, onRestartAudio,
  isShuffleEnabled, setIsShuffleEnabled,
  interfaceMode = 'standard', setInterfaceMode
}) => {
  const [activeTab, setActiveTab] = useState<'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer' | 'settings'>('settings');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const updateAmbience = (key: keyof AmbienceState, value: any) => {
    setAmbience({ ...ambience, [key]: value });
  };

  const updateAlarm = (key: keyof AlarmConfig, value: any) => {
      setAlarm({ ...alarm, [key]: value });
  };

  const toggleAlarmDay = (dayIndex: number) => {
      const newDays = alarm.days.includes(dayIndex)
          ? alarm.days.filter(d => d !== dayIndex)
          : [...alarm.days, dayIndex].sort();
      updateAlarm('days', newDays);
  };

  // Modified Tabs List based on user request
  const tabs = [
    { id: 'chat_360', icon: ChatBubbleIcon, label: 'Chat 360', action: onOpenChat },
    { id: 'settings', icon: LifeBuoyIcon, label: language === 'ru' ? 'Настройки' : 'Settings' },
    { id: 'look', icon: PaletteIcon, label: language === 'ru' ? 'Темы' : 'Themes' },
    { id: 'viz', icon: SwatchIcon, label: language === 'ru' ? 'Визуализатор' : 'Visualizer' },
    { id: 'manual', icon: LifeBuoyIcon, label: language === 'ru' ? 'Мануал' : 'Manual', action: onOpenManual },
  ];

  const handleTabClick = (tabId: string, action?: () => void) => {
      if (action) {
          action();
      } else {
          setActiveTab(tabId as any);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative w-full max-w-4xl bg-[var(--panel-bg)] glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-in zoom-in duration-300 border border-[var(--panel-border)]">
          
          {/* Sidebar */}
          <div className="w-full md:w-32 bg-black/20 md:border-r border-b md:border-b-0 border-white/5 p-4 flex md:flex-col items-center justify-center md:justify-start gap-4 overflow-x-auto md:overflow-visible shrink-0 no-scrollbar">
             {tabs.map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => handleTabClick(tab.id, tab.action)}
                   className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-24 md:w-full ${activeTab === tab.id && !tab.action ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                   title={tab.label}
                 >
                   <tab.icon className="w-6 h-6" />
                   <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight">{tab.label}</span>
                 </button>
             ))}

             <div className="hidden md:block flex-1"></div>
             <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-red-500/20 transition-all w-24 md:w-full flex justify-center">
                <XMarkIcon className="w-6 h-6" />
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar bg-gradient-to-br from-white/[0.02] to-transparent">
             <div className="flex justify-between items-center mb-8 md:hidden">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{tabs.find(t => t.id === activeTab)?.label}</h2>
                 <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
             </div>

            {/* SETTINGS TAB (Combined with EQ/Ambience/Timer access) */}
            {activeTab === 'settings' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Full Screen Mode Toggle */}
                    {setFullScreenStyle && (
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4 flex items-center gap-2">
                               <MaximizeIcon className="w-4 h-4" /> 
                               {language === 'ru' ? 'Режим полного экрана' : 'Full Screen Mode'}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setFullScreenStyle('player')}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${fullScreenStyle === 'player' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'}`}
                                >
                                    {language === 'ru' ? 'Плеер (Карточка)' : 'Player Card'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setFullScreenStyle('visualizer');
                                        onClose(); // Auto close panel when selecting visualizer only
                                    }}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${fullScreenStyle === 'visualizer' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'}`}
                                >
                                    {language === 'ru' ? 'Визуализатор' : 'Visualizer Only'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Audio Tools Access */}
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => setActiveTab('eq')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 transition-all">
                            <AdjustmentsIcon className="w-6 h-6 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t.eq}</span>
                        </button>
                        <button onClick={() => setActiveTab('ambience')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 transition-all">
                            <CloudIcon className="w-6 h-6 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t.ambience}</span>
                        </button>
                        <button onClick={() => setActiveTab('timer')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 transition-all">
                            <ClockIcon className="w-6 h-6 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t.sleep}</span>
                        </button>
                    </div>

                    {/* Shuffle Toggle */}
                    {setIsShuffleEnabled && (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-2xl">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-white/10 rounded-lg">
                                     <ShuffleIcon className="w-5 h-5 text-secondary" />
                                 </div>
                                 <div>
                                     <span className="font-bold text-sm text-white block">{language === 'ru' ? 'Играть беспорядочно' : 'Play Randomly (Shuffle)'}</span>
                                     <span className="text-[9px] text-slate-400 block">{language === 'ru' ? 'Микс жанров (без религии)' : 'Mix genres (excludes Religion)'}</span>
                                 </div>
                             </div>
                             <button onClick={() => setIsShuffleEnabled(!isShuffleEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${isShuffleEnabled ? 'bg-secondary' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isShuffleEnabled ? 'left-7' : 'left-1'}`}></div>
                             </button>
                        </div>
                    )}

                    {/* Quality Selector */}
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                           <MusicNoteIcon className="w-4 h-4" /> 
                           {language === 'ru' ? 'Качество Потока (Трафик)' : 'Stream Quality (Traffic)'}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {(['economy', 'standard', 'premium'] as const).map(q => (
                                <button 
                                    key={q}
                                    onClick={() => setStreamQuality(q)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${streamQuality === q ? 'bg-secondary/20 border-secondary text-white' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'}`}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-sm uppercase">{q}</div>
                                        <div className="text-[10px] opacity-70">
                                            {q === 'economy' ? (language === 'ru' ? 'Экономия трафика (AAC+). Идеально для 3G/EDGE.' : 'Save Data. Works on 28kbps.') : 
                                             q === 'standard' ? (language === 'ru' ? 'Баланс (128kbps). Оптимально.' : 'Balanced quality.') : 
                                             (language === 'ru' ? 'Высокое (128-320kbps). Без искажений.' : 'High Bitrate. No distortion.')}
                                        </div>
                                    </div>
                                    {streamQuality === q && <div className="w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_rgba(255,0,124,0.8)]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                             <span className="font-bold text-sm text-slate-200">{language === 'ru' ? 'Автостарт Станции' : 'Station Autostart'}</span>
                             <button onClick={() => setAutoStart(!autoStart)} className={`w-12 h-6 rounded-full relative transition-colors ${autoStart ? 'bg-green-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoStart ? 'left-7' : 'left-1'}`}></div>
                             </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                             <span className="font-bold text-sm text-slate-200">{t.developerNews}</span>
                             <button onClick={() => setShowDeveloperNews(!showDeveloperNews)} className={`w-12 h-6 rounded-full relative transition-colors ${showDeveloperNews ? 'bg-green-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showDeveloperNews ? 'left-7' : 'left-1'}`}></div>
                             </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="font-bold text-sm text-slate-200">{t.interfaceLanguage}</span>
                            <div className="flex bg-black/40 rounded-lg p-1">
                                {['en', 'ru'].map((l) => (
                                    <button key={l} onClick={() => setLanguage(l as Language)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${language === l ? 'bg-white text-black' : 'text-slate-400'}`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            )}

             {/* VISUALIZER TAB */}
             {activeTab === 'viz' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {VISUALIZERS.map(v => (
                            <button 
                                key={v.id} 
                                onClick={() => setVisualizerVariant(v.id)}
                                className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${visualizerVariant === v.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                            >
                                {t[`viz${v.name.replace(/\s/g,'')}`] || t[v.id.replace('-','')] || v.name}
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Settings</h4>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.speed}</span>
                                <input type="range" min="0.1" max="3" step="0.1" 
                                    value={vizSettings.speed} 
                                    onChange={(e) => setVizSettings({...vizSettings, speed: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.react}</span>
                                <input type="range" min="0.5" max="3" step="0.1" 
                                    value={vizSettings.scaleY} 
                                    onChange={(e) => setVizSettings({...vizSettings, scaleY: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                             <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.bright}</span>
                                <input type="range" min="50" max="200" step="10" 
                                    value={vizSettings.brightness} 
                                    onChange={(e) => setVizSettings({...vizSettings, brightness: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.performanceMode}</label>
                            <button onClick={() => setVizSettings({...vizSettings, performanceMode: !vizSettings.performanceMode})} className={`w-12 h-6 rounded-full relative transition-colors ${vizSettings.performanceMode ? 'bg-green-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${vizSettings.performanceMode ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* EQ TAB */}
             {activeTab === 'eq' && (
                 <div className="h-full flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                     <button onClick={() => setActiveTab('settings')} className="self-start mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1">← Back</button>
                     <div className="flex justify-between items-end mb-8 h-56 px-2 pb-8">
                         {eqGains.map((gain, i) => (
                             <div key={i} className="relative flex flex-col items-center h-full w-8 group">
                                 <div className="relative flex-1 w-1.5 bg-white/10 rounded-full overflow-visible group-hover:bg-white/20 transition-colors">
                                     <div 
                                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-secondary rounded-full transition-all duration-75"
                                        style={{ height: `${((gain + 12) / 24) * 100}%` }}
                                     >
                                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform pointer-events-none"></div>
                                     </div>
                                     <input 
                                       type="range" min="-12" max="12" step="1" 
                                       value={gain} 
                                       onChange={(e) => setEqGain(i, parseFloat(e.target.value))}
                                       className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-20"
                                       style={{ writingMode: 'vertical-lr', direction: 'rtl', appearance: 'slider-vertical' as any, WebkitAppearance: 'slider-vertical' }}
                                       title={`${gain}dB`}
                                     />
                                 </div>
                                 <span className="absolute -bottom-6 text-[9px] font-bold text-slate-500 w-full text-center">{[32,64,125,250,500,'1k','2k','4k','8k','16k'][i]}</span>
                             </div>
                         ))}
                     </div>
                     <div className="grid grid-cols-4 gap-2 px-2 mt-2">
                         {EQ_PRESETS.map(preset => (
                             <button 
                                key={preset.id}
                                onClick={() => onSetEqValues(preset.values)}
                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                    JSON.stringify(eqGains) === JSON.stringify(preset.values) 
                                    ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/20' 
                                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                             >
                                 {language === 'ru' && preset.ru ? preset.ru : preset.name}
                             </button>
                         ))}
                     </div>
                 </div>
             )}

             {/* LOOK TAB */}
             {activeTab === 'look' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setBaseTheme('dark')} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 ${baseTheme === 'dark' ? 'bg-slate-800 border-white text-white' : 'bg-white/5 border-transparent text-slate-400'}`}>
                            <MoonIcon className="w-5 h-5" /> <span>Dark</span>
                        </button>
                        <button onClick={() => setBaseTheme('light')} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 ${baseTheme === 'light' ? 'bg-white border-slate-200 text-black' : 'bg-white/5 border-transparent text-slate-400'}`}>
                            <div className="w-5 h-5 rounded-full border-2 border-current"></div> <span>Light</span>
                        </button>
                     </div>

                     <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.interfaceMode || "Interface Layout"}</h4>
                         <div className="grid grid-cols-3 gap-2">
                             {INTERFACE_MODES.map(mode => (
                                 <button 
                                    key={mode.id}
                                    onClick={() => setInterfaceMode && setInterfaceMode(mode.id)}
                                    className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase transition-all border ${interfaceMode === mode.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                                 >
                                     {mode.name}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.accentColor}</h4>
                         <div className="flex flex-wrap gap-3">
                             {THEMES.map(theme => (
                                 <button 
                                    key={theme}
                                    onClick={() => setTheme(theme)}
                                    className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${currentTheme === theme ? 'ring-2 ring-white scale-110' : ''}`}
                                    style={{ background: theme === 'default' ? '#bc6ff1' : `var(--color-primary)` }}
                                 >
                                    <div className={`w-full h-full rounded-full ${theme === 'default' ? 'bg-[#bc6ff1]' : ''} ${theme === 'emerald' ? 'bg-[#00ff9f]' : ''} ${theme === 'midnight' ? 'bg-[#4d4dff]' : ''} ${theme === 'cyber' ? 'bg-[#ff00ff]' : ''} ${theme === 'volcano' ? 'bg-[#ff3c00]' : ''} ${theme === 'ocean' ? 'bg-[#00d2ff]' : ''} ${theme === 'sakura' ? 'bg-[#ff758c]' : ''} ${theme === 'gold' ? 'bg-[#ffcc33]' : ''} ${theme === 'frost' ? 'bg-[#74ebd5]' : ''} ${theme === 'forest' ? 'bg-[#a8ff78]' : ''}`}></div>
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.cardColor || 'Card Color Tint'}</h4>
                         <div className="flex gap-4 items-center">
                             <input 
                                type="color" 
                                value={customCardColor ? `rgb(${customCardColor})` : '#000000'}
                                onChange={(e) => {
                                    const hex = e.target.value;
                                    const r = parseInt(hex.slice(1, 3), 16);
                                    const g = parseInt(hex.slice(3, 5), 16);
                                    const b = parseInt(hex.slice(5, 7), 16);
                                    setCustomCardColor(`${r}, ${g}, ${b}`);
                                }}
                                className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                             />
                             <button onClick={() => setCustomCardColor(null)} className="text-xs text-slate-400 underline hover:text-white">{t.resetFlat || 'Reset'}</button>
                         </div>
                     </div>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ToolsPanel;
