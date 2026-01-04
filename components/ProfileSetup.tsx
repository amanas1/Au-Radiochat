
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS, COUNTRIES_DATA } from '../constants';
import { PhotoIcon, XMarkIcon } from './Icons';

const AGES = Array.from({ length: 63 }, (_, i) => (i + 18).toString()); 

interface DrumPickerProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  label: string;
}

const DrumPicker: React.FC<DrumPickerProps> = ({ options, value, onChange, label }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; 
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (options[index] && options[index] !== value) {
      onChange(options[index]);
    }
  };
  useEffect(() => {
    if (!scrollRef.current) return;
    const index = options.indexOf(value);
    if (index !== -1) {
      scrollRef.current.scrollTop = index * itemHeight;
    }
  }, [value, options]);
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <div className="relative h-[132px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-inner">
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-[44px] bg-primary/30 rounded-xl border border-primary/40 pointer-events-none shadow-[0_0_15px_rgba(139,92,246,0.2)]"></div>
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[44px]" style={{ scrollBehavior: 'smooth' }}>
          {options.map((opt, i) => (
            <div key={i} className={`h-[44px] flex items-center justify-center snap-center transition-all duration-300 text-lg font-bold ${value === opt ? 'text-primary scale-125' : 'text-slate-500 opacity-30'}`}>
              {opt}
            </div>
          ))}
          <div className="h-[44px]"></div>
        </div>
      </div>
    </div>
  );
};

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  language: Language;
  initialProfile?: UserProfile;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, language, initialProfile, onCancel }) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState(initialProfile?.age?.toString() || '25');
  const [country, setCountry] = useState(initialProfile?.country || 'Russia');
  const [city, setCity] = useState(initialProfile?.city || 'Moscow');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialProfile?.gender || 'male');
  const [avatar, setAvatar] = useState<string | null>(initialProfile?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCities = useMemo(() => {
    const found = COUNTRIES_DATA.find(c => c.name === country);
    return found ? found.cities : ['Other'];
  }, [country]);

  useEffect(() => {
    if (!availableCities.includes(city)) setCity(availableCities[0]);
  }, [availableCities, city]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete({
      ...initialProfile,
      id: initialProfile?.id || `user-${Date.now()}`,
      name,
      avatar,
      age: parseInt(age) || 18,
      country,
      city,
      gender,
      status: 'online',
      safetyLevel: initialProfile?.safetyLevel || 'green',
      blockedUsers: initialProfile?.blockedUsers || [],
      bio: initialProfile?.bio || `Listening from ${city}, ${country}!`,
      hasAgreedToRules: true,
      filters: initialProfile?.filters || {
        minAge: 18,
        maxAge: 99,
        countries: [],
        languages: [],
        genders: ['any'],
        soundEnabled: true
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-y-auto p-4 md:p-10 no-scrollbar">
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary blur-[150px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-3xl p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col gap-8 border-white/5"
      >
        <div className="text-center relative">
            {initialProfile && onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="absolute right-0 top-0 p-2 text-slate-500 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{initialProfile ? t.editProfile : t.whoAreYou}</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">{t.createProfile}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4 w-full md:w-56 shrink-0">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-48 h-48 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex items-center justify-center relative group shadow-2xl"
                >
                    {avatar ? (
                        <img src={avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-primary transition-colors">
                            <PhotoIcon className="w-12 h-12 mb-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t.uploadPhoto}</span>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                <div className="w-full">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-2 tracking-widest">{t.gender}</label>
                  <div className="flex bg-black/40 rounded-2xl p-1 border border-white/10">
                    {(['male', 'female'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${gender === g ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                      >
                        {t[g]}
                      </button>
                    ))}
                  </div>
                </div>
            </div>

            <div className="flex-1 w-full space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-2 tracking-widest">{t.displayName}</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 font-semibold text-white"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DrumPicker label={t.age} options={AGES} value={age} onChange={setAge} />
                    <DrumPicker label={t.country} options={COUNTRIES_DATA.map(c => c.name)} value={country} onChange={setCountry} />
                    <DrumPicker label={t.city} options={availableCities} value={city} onChange={setCity} />
                </div>
            </div>
        </div>
        <button 
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all mt-2 uppercase tracking-wider"
        >
            {initialProfile ? t.saveProfile : t.joinCommunity}
        </button>
      </form>
      <style>{` .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
    </div>
  );
};

export default ProfileSetup;
