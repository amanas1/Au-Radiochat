
export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  state: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  type?: 'genre' | 'era' | 'mood' | 'effect';
}

// FIX: Added 'viz-journey' to the union type to match its usage in ToolsPanel components
export type VisualizerVariant = 'segmented' | 'rainbow-lines' | 'galaxy' | 'mixed-rings' | 'bubbles' | 'stage-dancer' | 'viz-journey';

export interface VisualizerSettings {
  scaleX: number;
  scaleY: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  opacity: number;
  speed: number;
  autoIdle: boolean;
  performanceMode: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  age: number;
  country: string;
  city: string;
  gender: 'male' | 'female' | 'other';
  status: 'online' | 'offline';
  safetyLevel: 'green' | 'yellow' | 'red';
  blockedUsers: string[];
  bio: string;
  hasAgreedToRules: boolean;
  isAuthenticated?: boolean;
  filters: {
    minAge: number;
    maxAge: number;
    countries: string[];
    languages: string[];
    genders: (string | 'any')[];
    soundEnabled: boolean;
  };
}

export interface AmbienceState {
  rainVolume: number;
  rainVariant: 'soft' | 'roof';
  fireVolume: number;
  cityVolume: number;
  vinylVolume: number;
  is8DEnabled: boolean;
  spatialSpeed: number;
}

export interface AlarmConfig {
  enabled: boolean;
  time: string;
  days: number[];
}

export interface FxSettings {
  reverb: number;
  speed: number;
}

export type ThemeName = 'default' | 'emerald' | 'midnight' | 'cyber' | 'volcano' | 'ocean' | 'sakura' | 'gold' | 'frost' | 'forest';
export type BaseTheme = 'dark' | 'light';
export type Language = 'en' | 'ru';
export type StreamQuality = 'economy' | 'standard' | 'premium';
export type InterfaceMode = 'standard' | 'minimal' | 'classic' | 'focus' | 'party';

export interface PassportData {
  countriesVisited: string[];
  totalListeningMinutes: number;
  nightListeningMinutes: number;
  stationsFavorited: number;
  unlockedAchievements: string[];
  level: number;
}
