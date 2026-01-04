
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon } from './Icons';
import { chatService } from '../services/chatService';

/**
 * FIX: Updated DEMO_USERS to include missing properties required by the UserProfile interface
 */
const DEMO_USERS: UserProfile[] = [
    { id: 'd1', name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=11', age: 22, country: 'Kazakhstan', city: 'Almaty', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd2', name: 'Marcus', avatar: 'https://i.pravatar.cc/150?u=12', age: 28, country: 'Germany', city: 'Berlin', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd3', name: 'Sofia', avatar: 'https://i.pravatar.cc/150?u=13', age: 24, country: 'France', city: 'Paris', status: 'offline', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd4', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=14', age: 31, country: 'USA', city: 'New York', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd5', name: 'Aisha', avatar: 'https://i.pravatar.cc/150?u=15', age: 20, country: 'Kazakhstan', city: 'Astana', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd6', name: 'Liam', avatar: 'https://i.pravatar.cc/150?u=16', age: 26, country: 'UK', city: 'London', status: 'offline', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd7', name: 'Mika', avatar: 'https://i.pravatar.cc/150?u=17', age: 23, country: 'Japan', city: 'Tokyo', status: 'online', safetyLevel: 'green', bio: '', gender: 'female', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
    { id: 'd8', name: 'Kaan', avatar: 'https://i.pravatar.cc/150?u=18', age: 29, country: 'Turkey', city: 'Istanbul', status: 'online', safetyLevel: 'green', bio: '', gender: 'male', blockedUsers: [], hasAgreedToRules: true, filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true } },
];

interface FlyingInstance {
    instanceId: string;
    user: UserProfile;
    startTime: number;
    angle: number;
    speedMod: number;
}

interface DiscoveryDrumProps {
  users: UserProfile[];
  onAgree: (user: UserProfile) => void;
  language: Language;
  currentUser: UserProfile;
}

const DiscoveryDrum: React.FC<DiscoveryDrumProps> = ({ users, onAgree, language, currentUser }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [instances, setInstances] = useState<FlyingInstance[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSpinning, setIsSpinning] = useState(true);
  const [knockSent, setKnockSent] = useState(false);
  
  const pool = useMemo(() => (users.length > 0 ? users : DEMO_USERS), [users]);
  const FLIGHT_DURATION = 14000; 
  const SPAWN_INTERVAL = 1800; 
  const maxRadius = 800;

  useEffect(() => {
    if (!isSpinning) return;
    const spawn = () => {
        setInstances(prev => {
            const nextUser = pool[Math.floor(Math.random() * pool.length)];
            const newInstance: FlyingInstance = {
                instanceId: Math.random().toString(36).substr(2, 9),
                user: nextUser,
                startTime: Date.now(),
                angle: Math.random() * Math.PI * 2,
                speedMod: 0.6 + Math.random() * 0.8
            };
            return [...prev.slice(-25), newInstance];
        });
    };
    const timer = setInterval(spawn, SPAWN_INTERVAL);
    spawn();
    return () => clearInterval(timer);
  }, [isSpinning, pool]);

  useEffect(() => {
    const cleaner = setInterval(() => {
        const now = Date.now();
        setInstances(prev => prev.filter(inst => now - inst.startTime < (FLIGHT_DURATION / inst.speedMod)));
    }, 1000);
    return () => clearInterval(cleaner);
  }, []);

  const handleKnock = async () => {
      if (!selectedUser || !currentUser.id) {
          if (!currentUser.id) alert(t.signInAlert);
          return;
      }
      setKnockSent(true);
      await chatService.sendKnock(currentUser, selectedUser);
      // Calls parent callback just to open the chat panel, but actual chat creation is via service
      setTimeout(() => {
          onAgree(selectedUser); 
          setSelectedUser(null);
          setIsSpinning(true);
          setKnockSent(false);
      }, 1000);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-[#01040a]">
      
      {/* SPACE DECORATIONS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-20 animate-[spin_240s_linear_infinite]">
            <div className="w-full h-full bg-[radial-gradient(circle,rgba(139,92,246,0.3)_0%,transparent_70%)] blur-[100px]"></div>
        </div>
        <div className="absolute top-[10%] left-[-10%] w-40 h-40 bg-gradient-to-tr from-indigo-900 to-blue-500 rounded-full opacity-20 blur-sm animate-[planet-float_45s_linear_infinite]"></div>
        <div className="absolute bottom-[20%] right-[-15%] w-64 h-64 bg-gradient-to-br from-purple-900 to-pink-600 rounded-full opacity-10 blur-md animate-[planet-float_60s_linear_infinite_reverse]"></div>
        {[...Array(80)].map((_, i) => (
            <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, opacity: Math.random(), animationDelay: `${Math.random()*5}s` }}></div>
        ))}
      </div>

      <div className="relative flex items-center justify-center w-full h-full">
        {/* CORE */}
        <div className="relative z-[50] pointer-events-none">
            <div className={`w-32 h-32 rounded-full bg-blue-600/10 blur-[80px] animate-pulse transition-transform duration-1000 ${isSpinning ? 'scale-100' : 'scale-150'}`}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 blur-2xl opacity-10"></div>
        </div>

        {instances.map((inst) => (
            <FlyingPhoto 
                key={inst.instanceId} 
                instance={inst} 
                duration={FLIGHT_DURATION} 
                maxRadius={maxRadius}
                onClick={() => { setSelectedUser(inst.user); setIsSpinning(false); setKnockSent(false); }}
            />
        ))}
      </div>

      {selectedUser && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500 pointer-events-auto">
          <div className="glass-panel w-full max-w-[320px] p-10 rounded-[4rem] border-blue-500/30 flex flex-col items-center text-center animate-in zoom-in duration-300 relative">
              <button onClick={() => { setSelectedUser(null); setIsSpinning(true); }} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><XMarkIcon className="w-8 h-8" /></button>
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 overflow-hidden border-2 border-blue-600 shadow-2xl mb-6 ring-8 ring-blue-600/10">
                  <img src={selectedUser.avatar || ''} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{selectedUser.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-10">{selectedUser.age} • {selectedUser.city}</p>
              
              {knockSent ? (
                  <div className="w-full py-5 bg-green-500/20 text-green-500 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                      <span>{t.knockSent}</span>
                  </div>
              ) : (
                  <button 
                    onClick={handleKnock}
                    className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/30"
                  >
                    {t.knock}
                  </button>
              )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes planet-float {
            from { transform: translateX(0) translateY(0); }
            to { transform: translateX(120vw) translateY(50vh); }
        }
      `}</style>
    </div>
  );
};

const FlyingPhoto: React.FC<{ instance: FlyingInstance, duration: number, maxRadius: number, onClick: () => void }> = ({ instance, duration, maxRadius, onClick }) => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let animFrame: number;
        const update = () => {
            const p = (Date.now() - instance.startTime) / (duration / instance.speedMod);
            if (p <= 1) {
                setProgress(p);
                animFrame = requestAnimationFrame(update);
            }
        };
        update();
        return () => cancelAnimationFrame(animFrame);
    }, [instance, duration]);

    const radius = Math.pow(progress, 1.8) * maxRadius;
    const x = Math.cos(instance.angle) * radius;
    const y = Math.sin(instance.angle) * radius;
    const scale = 0.01 + Math.pow(progress, 1.5) * 8.0;
    
    let opacity = 0;
    if (progress < 0.15) opacity = progress / 0.15;
    else if (progress > 0.8) opacity = (1 - progress) / 0.2;
    else opacity = 1;

    return (
        <div 
            className="absolute cursor-pointer transition-shadow"
            style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                opacity: opacity,
                zIndex: Math.floor(progress * 300),
                willChange: 'transform, opacity'
            }}
            onClick={onClick}
        >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/20 overflow-hidden shadow-2xl hover:border-blue-500 transition-colors">
                <img src={instance.user.avatar || ''} className="w-full h-full object-cover" />
            </div>
        </div>
    );
};

export default DiscoveryDrum;
