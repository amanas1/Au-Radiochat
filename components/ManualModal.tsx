import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon, MusicNoteIcon, UsersIcon, AdjustmentsIcon, PaletteIcon, PlayIcon, CloudIcon, BellIcon, MoonIcon, LifeBuoyIcon } from './Icons';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onShowFeature?: (featureId: string) => void;
}

const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose, language, onShowFeature }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen) return null;

  // Defines the content based on language
  const isRu = language === 'ru';

  const sections = isRu ? [
    { 
        id: 'radio',
        icon: <MusicNoteIcon className="w-6 h-6 text-pink-500" />, 
        title: "Плеер и Избранное",
        content: "Управляйте эфиром: кнопки паузы, переключения станций и громкости всегда под рукой. Нажмите на иконку 'Сердечко' в плеере, чтобы добавить станцию в Избранное. Ваши любимые станции автоматически появятся в первой категории 'ИЗБРАННОЕ' в верхнем меню.",
        image: "/manual_assets/home_screen.png"
    },
    { 
        id: 'settings',
        icon: <AdjustmentsIcon className="w-6 h-6 text-secondary" />, 
        title: "Настройки Качества и Трафика", 
        content: "Выбирайте режим потока: 'Economy' (AAC+) для медленного интернета, 'Standard' (128kbps) или 'Premium' (320kbps) для Hi-Fi звука. Также здесь можно включить 'Автостарт' (музыка заиграет сразу при входе) и 'Новости разработчика'.",
        image: "/manual_assets/settings_main.png"
    },
    { 
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-orange-400" />, 
        title: "Профессиональный Эквалайзер", 
        content: "10-полосный эквалайзер позволяет точно настроить частоты под вашу акустику. Используйте готовые пресеты (Рок, Поп, Джаз, Вокал) или создайте свой уникальный звук, перемещая ползунки вручную.",
        image: "/manual_assets/settings_eq.png"
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Микшер Атмосферы и 8D Audio", 
        content: "Создайте идеальный фон. Смешивайте шум дождя (мягкий или по крыше) с музыкой. Включите режим '8D Audio', чтобы звук начал плавно вращаться вокруг вас в пространстве (эффект погружения лучше всего работает в наушниках).",
        image: "/manual_assets/settings_ambience.png"
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Таймер Сна и Будильник", 
        content: "Настройте автоматическое выключение через 15-120 минут для спокойного сна. В разделе будильника можно установить время и дни недели — приложение разбудит вас любимой волной (просто не закрывайте вкладку).",
        image: "/manual_assets/settings_timer.png"
    },
    {
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-emerald-400" />,
        title: "Визуализаторы и Эффекты",
        content: "Выберите один из 6 вариантов визуализации (Galaxy, Neon, Rings и др.). Настройте яркость, скорость и реакцию на бас. Режим 'Performance' рекомендуется для старых устройств для плавной работы.",
        image: "/manual_assets/settings_viz.png"
    },
    {
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-teal-400" />,
        title: "Темы, Цвета и Интерфейс",
        content: "Меняйте оформление: Светлая или Темная тема, акцентные цвета (Золото, Океан, Сакура) и даже оттенок карточки плеера. Выберите режим интерфейса: от 'Standard' до 'Minimal' или 'Party' для полного погружения.",
        image: "/manual_assets/settings_themes.png"
    },
    {
        id: 'extra',
        icon: <LifeBuoyIcon className="w-6 h-6 text-slate-400" />,
        title: "Авто-скрытие UI",
        content: "Если вы хотите просто наслаждаться визуализацией, включите 'Авто-скрытие UI' в настройках визуала. Через 20 секунд бездействия все кнопки исчезнут, оставив только чистый арт. Движение мыши или касание вернет управление.",
        image: "/manual_assets/settings_autohide.png"
    }
  ] : [
    { 
        id: 'radio',
        icon: <MusicNoteIcon className="w-6 h-6 text-pink-500" />, 
        title: "Player & Favorites",
        content: "Control the broadcast: pause, station switching, and volume are always at hand. Click the 'Heart' icon in the player to add a station to Favorites. Your favorite stations will automatically appear in the 'FAVORITES' category.",
        image: "/manual_assets/home_screen.png"
    },
    { 
        id: 'settings',
        icon: <AdjustmentsIcon className="w-6 h-6 text-secondary" />, 
        title: "Quality & Traffic Settings", 
        content: "Choose stream quality: 'Economy' (AAC+) for slow internet, 'Standard' (128kbps), or 'Premium' (320kbps) for Hi-Fi sound. Toggle 'Autostart' and 'Developer News' here as well.",
        image: "/manual_assets/settings_main.png"
    },
    { 
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-orange-400" />, 
        title: "Pro Equalizer", 
        content: "A 10-band equalizer for precise frequency tuning. Use presets (Rock, Pop, Jazz, Vocal) or create your own sound profile by manually adjusting the sliders.",
        image: "/manual_assets/settings_eq.png"
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Ambience Mixer & 8D Audio", 
        content: "Mix background nature sounds like rain with your music. Enable '8D Audio' to experience sound rotating around your head (best with headphones).",
        image: "/manual_assets/settings_ambience.png"
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Sleep Timer & Alarm", 
        content: "Set an automatic turn-off timer (15-120 min). Use the Smart Alarm to wake up to your favorite station at a scheduled time.",
        image: "/manual_assets/settings_timer.png"
    },
    {
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-emerald-400" />,
        title: "Visualizers & Effects",
        content: "Choose from 6 visual styles. Adjust brightness, speed, and bass reaction. Use 'Performance Mode' on older devices for smoother rendering.",
        image: "/manual_assets/settings_viz.png"
    },
    {
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-teal-400" />,
        title: "Themes & Layouts",
        content: "Switch between Dark/Light modes, pick accent colors, and choose interface layouts from 'Standard' to 'Minimal' or 'Party' mode.",
        image: "/manual_assets/settings_themes.png"
    },
    {
        id: 'extra',
        icon: <LifeBuoyIcon className="w-6 h-6 text-slate-400" />,
        title: "Auto-Hide UI",
        content: "Enable 'Auto-Hide UI' in visualizer settings. After 20 seconds of inactivity, all buttons will disappear, leaving only the beautiful animation.",
        image: "/manual_assets/settings_autohide.png"
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl h-[80vh] glass-panel rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in duration-300 shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-1">{t.manualTitle}</h2>
                <p className="text-sm text-slate-400 font-medium">{t.manualIntro}</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-all">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section: any, idx) => (
                    <div 
                        key={idx} 
                        className="group p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
                        
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                {section.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{section.title}</h3>
                        </div>
                        
                        <p className="text-sm text-slate-400 leading-relaxed relative z-10 font-medium mb-4">
                            {section.content}
                        </p>

                        {section.image && (
                            <div className="relative mt-auto rounded-xl overflow-hidden border border-white/10 shadow-xl aspect-video bg-black/40">
                                <img 
                                    src={section.image} 
                                    alt={section.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                        )}

                        {onShowFeature && (
                            <button 
                                onClick={() => onShowFeature(section.id)}
                                className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors"
                            >
                                {isRu ? 'Показать где' : 'Show me where'} 
                                <span className="text-lg">→</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer Note */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/5 text-center">
                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
                    Au-Radiochat v2.0 • Pure Audio Experience
                </p>
            </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default ManualModal;