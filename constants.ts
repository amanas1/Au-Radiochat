
import { CategoryInfo, UserProfile, Achievement, PassportData } from './types';
import { CloudIcon, FireIcon, MusicNoteIcon, GlobeIcon, MoonIcon, HeartIcon } from './components/Icons';
import React from 'react';

// Radio browser API mirrors
export const RADIO_BROWSER_MIRRORS = [
    'https://all.api.radio-browser.info/json/stations',
    'https://de1.api.radio-browser.info/json/stations',
    'https://at1.api.radio-browser.info/json/stations',
    'https://nl1.api.radio-browser.info/json/stations',
    'https://fr1.api.radio-browser.info/json/stations',
    'https://uk1.api.radio-browser.info/json/stations'
];

export const DEFAULT_VOLUME = 0.5;

export const GENRES: CategoryInfo[] = [
    { id: 'jazz', name: 'Jazz', color: 'from-amber-400 to-orange-600', description: 'Smooth rhythms and improvisations.' },
    { id: 'blues', name: 'Blues', color: 'from-blue-600 to-indigo-800', description: 'Soulful rhythms and melancholic melodies.' },
    { id: 'rock', name: 'Rock', color: 'from-red-600 to-purple-900', description: 'Energetic beats and powerful guitars.' },
    { id: 'modern_hits', name: 'New 2020-2025', color: 'from-sky-400 to-indigo-500', description: 'Modern hits from 2020 to 2025.' },
    { id: 'electronic', name: 'Electronic', color: 'from-cyan-400 to-blue-600', description: 'Synthesized sounds and modern beats.' },
    { id: 'hiphop', name: 'Hip Hop', color: 'from-green-400 to-yellow-600', description: 'Rhythmic speech and street culture.' },
    { id: 'pop', name: 'Pop', color: 'from-pink-400 to-rose-600', description: 'Catchy melodies and chart-topping hits.' },
    { id: 'islamic', name: 'Faith & Religion', color: 'from-emerald-600 to-teal-900', description: 'Spiritual readings, prayers, and religious texts.' }
];

export const ERAS: CategoryInfo[] = [
    { id: '60s', name: '60s', color: 'from-yellow-300 to-orange-500', description: 'The era of peace, love, and rock & roll.' },
    { id: '70s', name: '70s', color: 'from-orange-500 to-red-600', description: 'Disco, funk, and the rise of stadium rock.' },
    { id: '80s', name: '80s', color: 'from-fuchsia-500 to-indigo-600', description: 'Synth-pop, big hair, and MTV classics.' },
    { id: '90s', name: '90s', color: 'from-teal-400 to-blue-500', description: 'Grunge, rave culture, and the golden age of R&B.' },
    { id: '00s', name: '00s', color: 'from-slate-400 to-slate-600', description: 'The digital revolution and fusion genres.' },
    { id: '2010', name: '2010', color: 'from-purple-500 to-pink-500', description: 'Songs from 2001 to 2010.' },
    { id: '2025', name: '2025', color: 'from-rose-500 to-orange-500', description: 'Modern hits from 2011 to 2025.' }
];

export const MOODS: CategoryInfo[] = [
    { id: 'chill', name: 'Chill', type: 'mood', color: 'from-blue-400 to-indigo-500', description: 'Relaxing tunes for a peaceful mind.' },
    { id: 'energy', name: 'Energy', type: 'mood', color: 'from-yellow-400 to-orange-500', description: 'Upbeat tracks to get you moving.' },
    { id: 'focus', name: 'Focus', type: 'mood', color: 'from-emerald-400 to-teal-600', description: 'Background music for work and study.' },
    { id: 'romantic', name: 'Romantic', type: 'mood', color: 'from-rose-400 to-pink-600', description: 'Melodies for special moments.' },
    { id: 'dark', name: 'Club', type: 'mood', color: 'from-slate-800 to-black', description: 'Powerful beats for club enthusiasts.' }
];

export const EFFECTS: CategoryInfo[] = [
    { id: 'nature', name: 'Nature', type: 'effect', color: 'from-green-400 to-emerald-600', description: 'Pure sounds of the wild.' },
    { id: 'rain', name: 'Rain', type: 'effect', color: 'from-blue-400 to-slate-600', description: 'Soothing rain and storms.' },
    { id: 'ocean', name: 'Ocean', type: 'effect', color: 'from-cyan-400 to-blue-600', description: 'Waves and sea breeze.' },
    { id: 'forest', name: 'Forest', type: 'effect', color: 'from-emerald-600 to-green-800', description: 'Woodland ambience.' },
    { id: 'storm', name: 'Storm', type: 'effect', color: 'from-slate-600 to-purple-900', description: 'Thunder and heavy rain.' },
];

export const COUNTRIES_DATA = [
  { name: 'Argentina', lat: -38.41, lon: -63.61, cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'] },
  { name: 'Australia', lat: -25.27, lon: 133.77, cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'Austria', lat: 47.51, lon: 14.55, cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'] },
  { name: 'Belgium', lat: 50.50, lon: 4.46, cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'] },
  { name: 'Brazil', lat: -14.23, lon: -51.92, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
  { name: 'Canada', lat: 56.13, lon: -106.34, cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'] },
  { name: 'China', lat: 35.86, lon: 104.19, cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
  { name: 'Denmark', lat: 56.26, lon: 9.50, cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'] },
  { name: 'Egypt', lat: 26.82, lon: 30.80, cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'] },
  { name: 'Finland', lat: 61.92, lon: 25.74, cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'] },
  { name: 'France', lat: 46.22, lon: 2.21, cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
  { name: 'Germany', lat: 51.16, lon: 10.45, cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'] },
  { name: 'Greece', lat: 39.07, lon: 21.82, cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'] },
  { name: 'India', lat: 20.59, lon: 78.96, cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'] },
  { name: 'Italy', lat: 41.87, lon: 12.56, cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'] },
  { name: 'Japan', lat: 36.20, lon: 138.25, cities: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka'] },
  { name: 'Kazakhstan', lat: 48.01, lon: 66.92, cities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe'] },
  { name: 'Kyrgyzstan', lat: 41.20, lon: 74.76, cities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Naryn'] },
  { name: 'Mexico', lat: 23.63, lon: -102.55, cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Toluca'] },
  { name: 'Netherlands', lat: 52.13, lon: 5.29, cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'] },
  { name: 'Norway', lat: 60.47, lon: 8.46, cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum'] },
  { name: 'Poland', lat: 51.91, lon: 19.14, cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'] },
  { name: 'Portugal', lat: 39.39, lon: -8.22, cities: ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga'] },
  { name: 'Russia', lat: 61.52, lon: 105.31, cities: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Yekaterinburg'] },
  { name: 'Saudi Arabia', lat: 23.88, lon: 45.07, cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
  { name: 'South Korea', lat: 35.90, lon: 127.76, cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
  { name: 'Spain', lat: 40.46, lon: -3.74, cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'] },
  { name: 'Sweden', lat: 60.12, lon: 18.64, cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'] },
  { name: 'Switzerland', lat: 46.81, lon: 8.22, cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'] },
  { name: 'Turkey', lat: 38.96, lon: 35.24, cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya'] },
  { name: 'UAE', lat: 23.42, lon: 53.84, cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman'] },
  { name: 'UK', lat: 55.37, lon: -3.43, cities: ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Manchester'] },
  { name: 'Ukraine', lat: 48.37, lon: 31.16, cities: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk'] },
  { name: 'USA', lat: 37.09, lon: -95.71, cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { name: 'Uzbekistan', lat: 41.37, lon: 64.58, cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'] },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEMO_USERS: UserProfile[] = [
    // 1. Nurlan - Animated Emoji (Smiley)
    { id: 'd15', name: 'Nurlan', avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Nurlan', age: 24, country: 'Kazakhstan', city: 'Shymkent', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    
    // 2. Ivan - Retro Object (Not face)
    { id: 'd13', name: 'Ivan', avatar: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&q=80', age: 33, country: 'Russia', city: 'Moscow', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },

    // 3. Aigul - Real Face
    { id: 'd1', name: 'Aigul', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80', age: 22, country: 'Kazakhstan', city: 'Almaty', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },

    // 4. Vibe - Abstract Art
    { id: 'd23', name: 'Vibe', avatar: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=150&q=80', age: 100, country: 'USA', city: 'LA', status: 'online', safetyLevel: 'green', bio: 'Abstract art lover', gender: 'other', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },

    // 5. Rose - Flower
    { id: 'd25', name: 'Rose', avatar: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=150&q=80', age: 28, country: 'France', city: 'Lyon', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },

    // 6. Aybek - Robot Avatar
    { id: 'd5', name: 'Aybek', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aybek', age: 25, country: 'Kyrgyzstan', city: 'Bishkek', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },

    // Other varied users
    { id: 'd2', name: 'Marcus', avatar: 'https://i.pravatar.cc/150?img=11', age: 28, country: 'Germany', city: 'Berlin', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd3', name: 'Sofia', avatar: 'https://i.pravatar.cc/150?img=5', age: 24, country: 'France', city: 'Paris', status: 'offline', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd4', name: 'Alex', avatar: 'https://i.pravatar.cc/150?img=13', age: 31, country: 'USA', city: 'New York', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd6', name: 'Liam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', age: 26, country: 'UK', city: 'London', status: 'offline', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd7', name: 'Mika', avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&q=80', age: 23, country: 'Japan', city: 'Tokyo', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd8', name: 'Kaan', avatar: 'https://i.pravatar.cc/150?img=33', age: 29, country: 'Turkey', city: 'Istanbul', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    
    // Abstract / Nature Avatars
    { id: 'd9', name: 'Sakura', avatar: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=150&q=80', age: 21, country: 'Japan', city: 'Kyoto', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd10', name: 'Lotus', avatar: 'https://images.unsplash.com/photo-1563205764-699245af37a4?w=150&q=80', age: 27, country: 'India', city: 'Delhi', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd11', name: 'Cosmos', avatar: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=150&q=80', age: 99, country: 'USA', city: 'Houston', status: 'online', safetyLevel: 'green', bio: 'Stargazer', gender: 'other', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd12', name: 'Neon', avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80', age: 30, country: 'South Korea', city: 'Seoul', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    
    // Russian & Central Asian Names
    { id: 'd14', name: 'Olga', avatar: 'https://i.pravatar.cc/150?img=20', age: 26, country: 'Russia', city: 'St. Petersburg', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd16', name: 'Cholpon', avatar: 'https://i.pravatar.cc/150?img=26', age: 22, country: 'Kyrgyzstan', city: 'Osh', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd17', name: 'Dmitry', avatar: 'https://i.pravatar.cc/150?img=55', age: 35, country: 'Russia', city: 'Kazan', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    
    // International
    { id: 'd18', name: 'Wei', avatar: 'https://i.pravatar.cc/150?img=52', age: 29, country: 'China', city: 'Shanghai', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd19', name: 'Kenji', avatar: 'https://i.pravatar.cc/150?img=56', age: 31, country: 'Japan', city: 'Osaka', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd20', name: 'Maria', avatar: 'https://i.pravatar.cc/150?img=45', age: 25, country: 'Spain', city: 'Madrid', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd21', name: 'Hans', avatar: 'https://i.pravatar.cc/150?img=57', age: 40, country: 'Germany', city: 'Munich', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd22', name: 'Yara', avatar: 'https://i.pravatar.cc/150?img=36', age: 23, country: 'Brazil', city: 'Rio', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    
    // Symbols/Art
    { id: 'd24', name: 'Echo', avatar: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&q=80', age: 25, country: 'UK', city: 'Bristol', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
    {
        id: 'explorer',
        icon: '🌍',
        titleKey: 'Globetrotter',
        descKey: 'Visit 5 different countries',
        condition: (data: PassportData) => data.countriesVisited.length >= 5
    },
    {
        id: 'night_owl',
        icon: '🦉',
        titleKey: 'Night Owl',
        descKey: 'Listen for 60 minutes at night',
        condition: (data: PassportData) => data.nightListeningMinutes >= 60
    },
    {
        id: 'audiophile',
        icon: '🎧',
        titleKey: 'Audiophile',
        descKey: 'Listen for 1000 total minutes',
        condition: (data: PassportData) => data.totalListeningMinutes >= 1000
    },
    {
        id: 'curator',
        icon: '❤️',
        titleKey: 'Curator',
        descKey: 'Favorite 10 stations',
        condition: (data: PassportData) => data.stationsFavorited >= 10
    }
];

export const NEWS_MESSAGES: Record<string, string[]> = {
    en: [
        "Welcome to StreamFlow V2.0! Enjoy pure radio. • Administration",
        "Tip: Use the Tools panel (bottom right) to set a Sleep Timer or Alarm.",
        "Try the 8D Audio mode in the Ambience tab (Headphones recommended).",
        "Join the Global Chat to find friends from around the world!",
        "Customize your experience: Visualizers, EQ, and Themes are available in Settings."
    ],
    ru: [
        "Добро пожаловать в StreamFlow V2.0! Наслаждайтесь эфиром. • Администрация",
        "Совет: В панели инструментов можно настроить Таймер сна и Будильник.",
        "Попробуйте режим 8D звука во вкладке Атмосфера (рекомендуются наушники).",
        "Заходите в Глобальный чат для поиска друзей по всему миру!",
        "Настройте под себя: Визуализаторы, Эквалайзер и Темы доступны в настройках."
    ]
};

export const TRANSLATIONS: Record<string, any> = {
    en: {
        genres: 'Genres', eras: 'Eras', moods: 'Moods', effects: 'Effects', favorites: 'Favorites',
        listeningTo: 'Listening to', loadMore: 'Load More',
        visualizer: 'Visualizer', eq: 'Equalizer', look: 'Appearance', ambience: 'Ambience', fx: 'Effects FX', sleep: 'Sleep Timer',
        vizGalaxy: 'Galaxy', resetFlat: 'Reset Flat', sleepTimer: 'Sleep Timer', turnOffTimer: 'Turn Off', alarm: 'Alarm', on: 'On', off: 'Off', alarm_set: 'Alarm set to', cardColor: 'Card Tint', developerNews: 'Developer News', interfaceLanguage: 'Language',
        findFriends: 'Find Friends', completeProfile: 'Complete Profile', displayName: 'Display Name', gender: 'Gender', male: 'Male', female: 'Female', other: 'Other', age: 'Age', country: 'Country', city: 'City', saveAndEnter: 'Save & Enter', login: 'Login', any: 'Any', search: 'Search', knock: 'Knock',
        tutorialWelcome: 'Welcome to StreamFlow', manualSection2: 'Radio Stream: The Core', manualSection3: 'Sleep Timer: Rest Easy', manualSection5: 'Ambience: Create Atmosphere', manualSection4: 'Chat: Connect Safely',
        tutorialStep1: 'Choose your vibe from Genres, Eras, or Moods.', tutorialStep2: 'Tap any station card to start listening immediately.', tutorialStep3: 'Set a sleep timer or alarm here.', tutorialStep4: 'Mix ambient sounds like rain or fire.', tutorialStep5: 'Chat securely with others listening now.',
        next: 'Next', gotIt: 'Got it', manualTitle: 'User Manual', manualIntro: 'Welcome to StreamFlow, your ultimate radio experience.', whoAreYou: 'Who are you?', createProfile: 'Create your profile to connect.', uploadPhoto: 'Upload Photo', saveProfile: 'Save Profile', joinCommunity: 'Join Community',
        downloader: 'Music Downloader', rain: 'Rain', spatialAudio: '8D Audio', spatialHint: 'Use headphones for best effect', editProfile: 'Edit Profile',
        vizStageDancer: 'Stage Dancer', vizTrioDancers: 'Trio Dancers', vizJourney: 'Journey', vizDigital: 'Digital', vizNeon: 'Neon', vizRings: 'Rings', vizBubbles: 'Bubbles',
        spatialMixer: 'Spatial Mixer',
        // Category Translations
        jazz: 'Jazz', blues: 'Blues', rock: 'Rock', modern_hits: 'New 2020-2025', electronic: 'Electronic', hiphop: 'Hip Hop', pop: 'Pop', islamic: 'Faith & Religion',
        '60s': '60s', '70s': '70s', '80s': '80s', '90s': '90s', '00s': '00s', '2010': '2010', '2025': '2025',
        chill: 'Chill', energy: 'Energy', focus: 'Focus', romantic: 'Romantic', dark: 'Club',
        nature: 'Nature', storm: 'Storm', ocean: 'Ocean', forest: 'Forest',
        // Missing Translations Added
        speed: 'Speed', react: 'React', bright: 'Bright', performanceMode: 'Performance Mode', accentColor: 'Accent Color', reset: 'Reset',
        privateChat: 'PRIVATE CHAT', authTitle: 'Private Space', authDesc: 'Connect to your personal secure hub. Chat 1-on-1 with mutual consent only. No spam, no noise.', signInGoogle: 'Sign in with Google', online: 'Online', today: 'Today', recording: 'Recording...', send: 'SEND', noUsers: 'No users found', showAll: 'Show All', knocking: 'Knocking', wantsToConnect: 'wants to connect', myDialogs: 'My Dialogs', noChats: 'No chats yet', useDiscovery: "Use 'Discovery Drum' to find people or wait for the Welcome Bot.", photoExpired: '📸 Photo expired', audioExpired: '🎤 Audio expired',
        knockSent: 'Knock Sent!', signInAlert: 'Please sign in via the Chat Panel first.',
        searching: 'Searching databases...', noTracks: 'No tracks found.', errorTracks: 'Error fetching tracks.', loading: 'Loading...', download: 'Download', searchTracks: 'Search tracks...',
        infiniteTracks: 'Infinite Tracks', noAuth: 'No Auth Required', searchLib: 'Search infinite library...', all: 'All', moodChill: 'Chill', moodEnergy: 'Energy', moodPhonk: 'Phonk', moodFocus: 'Focus', moodJazz: 'Jazz', moodParty: 'Party',
        dragRotate: 'Drag to rotate • Click name to play',
        // Feedback
        feedbackTitle: "Feedback",
        writeDev: "Write to Developer",
        rating: "Rate App",
        tellUs: "Tell us what to improve...",
        sendSuccess: "Message sent!",
        manualTooltip: "User Manual",
        showWhere: "Show location",
        helpImprove: "Help us improve StreamFlow."
    },
    ru: {
        genres: 'Жанры', eras: 'Эпохи', moods: 'Настроение', effects: 'Эффекты', favorites: 'Избранное',
        listeningTo: 'В эфире', loadMore: 'Загрузить еще',
        visualizer: 'Визуал', eq: 'Звук', look: 'Стиль', ambience: 'Атмосфера', fx: 'Эффекты', sleep: 'Сон',
        vizGalaxy: 'Космос', resetFlat: 'Сброс', sleepTimer: 'Режим сна', turnOffTimer: 'Отключить', alarm: 'Будильник', on: 'Вкл', off: 'Выкл', alarm_set: 'Разбудить в', cardColor: 'Оттенок блоков', developerNews: 'Новости', interfaceLanguage: 'Язык',
        findFriends: 'Поиск людей', completeProfile: 'Ваш профиль', displayName: 'Ваше имя', gender: 'Пол', male: 'Мужской', female: 'Женский', other: 'Другой', age: 'Возраст', country: 'Страна', city: 'Город', saveAndEnter: 'Войти', login: 'Логин', any: 'Неважно', search: 'Найти', knock: 'Постучаться',
        tutorialWelcome: 'Добро пожаловать', manualSection2: 'Радио: Сердце Эфира', manualSection3: 'Таймер Сна: Отдыхайте', manualSection5: 'Атмосфера: Создайте Уют', manualSection4: 'Чат: Общайтесь Безопасно',
        tutorialStep1: 'Выберите настроение, жанр или эпоху.', tutorialStep2: 'Нажмите на любую станцию, чтобы начать.', tutorialStep3: 'Здесь можно поставить таймер или будильник.', tutorialStep4: 'Смешивайте звуки дождя или огня.', tutorialStep5: 'Безопасный чат с другими слушателями.',
        next: 'Далее', gotIt: 'Понятно', manualTitle: 'Руководство', manualIntro: 'Добро пожаловать в StreamFlow — ваш идеальный радио-опыт.', whoAreYou: 'Кто вы?', createProfile: 'Создайте профиль для общения.', uploadPhoto: 'Загрузить фото', saveProfile: 'Сохранить', joinCommunity: 'Присоединиться',
        downloader: 'Загрузчик Музыки', rain: 'Дождь', spatialAudio: '8D Звук', spatialHint: 'В наушниках лучше', editProfile: 'Ред. Профиль',
        vizStageDancer: 'Танцор', vizTrioDancers: 'Трио', vizJourney: 'Полет', vizDigital: 'Цифра', vizNeon: 'Неон', vizRings: 'Кольца', vizBubbles: 'Пузыри',
        spatialMixer: 'Звуковая Сцена',
        // Category Translations
        jazz: 'Джаз', blues: 'Блюз', rock: 'Рок', modern_hits: 'Новые 2020-2025', electronic: 'Электроника', hiphop: 'Хип-хоп', pop: 'Поп', islamic: 'Религия',
        '60s': '60-е', '70s': '70-е', '80s': '80-е', '90s': '90-е', '00s': '00-е', '2010': '2010', '2025': '2025',
        chill: 'Чилл', energy: 'Энергия', focus: 'Фокус', romantic: 'Романтика', dark: 'Клуб',
        nature: 'Природа', storm: 'Шторм', ocean: 'Океан', forest: 'Лес',
        // Missing Translations Added
        speed: 'Скорость', react: 'Реакция', bright: 'Яркость', performanceMode: 'Режим', accentColor: 'Акцент', reset: 'Сброс',
        privateChat: 'ЛИЧНЫЙ ЧАТ', authTitle: 'Личное Пространство', authDesc: 'Ваш безопасный хаб. Общение 1-на-1 только по взаимному согласию. Без спама и шума.', signInGoogle: 'Войти через Google', online: 'Онлайн', сегодня: 'Сегодня', recording: 'Запись...', send: 'ОТПРАВИТЬ', noUsers: 'Никого не найдено', showAll: 'Показать всех', knocking: 'Стучится', wantsToConnect: 'хочет общаться', myDialogs: 'Мои Диалоги', noChats: 'Пока нет чатов', useDiscovery: "Используйте 'Барабан Открытий' или ждите приветствия.", photoExpired: '📸 Фото истекло', audioExpired: '🎤 Аудио истекло',
        knockSent: 'Отправлено!', signInAlert: 'Пожалуйста, сначала войдите через панель чата.',
        searching: 'Поиск в базах...', noTracks: 'Треки не найдены.', errorTracks: 'Ошибка загрузки.', loading: 'Загрузка...', download: 'Скачать', searchTracks: 'Поиск треков...',
        infiniteTracks: 'Бесконечные Треки', noAuth: 'Без регистрации', searchLib: 'Поиск в библиотеке...', all: 'Все', moodChill: 'Чилл', moodEnergy: 'Энергия', moodPhonk: 'Фонк', moodFocus: 'Фокус', moodJazz: 'Джаз', moodParty: 'Вечеринка',
        dragRotate: 'Тяни для вращения • Клик для игры',
        // Feedback
        feedbackTitle: "Отзывы",
        writeDev: "Написать разработчику",
        rating: "Рейтинг",
        tellUs: "Ваши пожелания и замечания...",
        sendSuccess: "Сообщение отправлено!",
        manualTooltip: "Мануал",
        showWhere: "Показать где",
        helpImprove: "Помогите нам улучшить StreamFlow."
    }
};
