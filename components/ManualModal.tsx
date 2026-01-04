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
        title: "Глобальное Радио",
        content: "Это сердце приложения. В вашем распоряжении тысячи станций со всей планеты. Используйте меню слева, чтобы выбрать то, что нужно именно сейчас: 'Жанры' для стиля, 'Эпохи' для ностальгии или 'Настроение' для фона. Нашли что-то стоящее? Жмите сердечко, чтобы сохранить в Избранное." 
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Таймер Сна", 
        content: "Любите засыпать под музыку? Зайдите в панель инструментов (иконка настроек внизу), выберите вкладку с часами и установите таймер. Музыка плавно выключится сама, когда вы уже будете видеть сны." 
    },
    { 
        id: 'alarm',
        icon: <BellIcon className="w-6 h-6 text-red-400" />, 
        title: "Умный Будильник", 
        content: "Просыпайтесь правильно. Там же, где и таймер, можно настроить будильник. Выберите время и дни недели, и приложение включит вашу любимую станцию в назначенный час. Главное — оставьте вкладку открытой (даже в фоновом режиме)." 
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Атмосфера и Фокус", 
        content: "Хотите больше уюта? Иконка облака открывает микшер фоновых звуков. Добавьте шум дождя к джазу или треск костра к эмбиенту. А функция '8D Audio' заставит звук вращаться вокруг вас (обязательно наденьте наушники!)." 
    },
    { 
        id: 'chat',
        icon: <UsersIcon className="w-6 h-6 text-purple-500" />, 
        title: "Приватный Чат",
        content: "Хочется общения? Панель чата справа — это ваш безопасный шлюз. Найдите собеседника по интересам или городу. Система 'Постучаться' гарантирует, что диалог начнется только по взаимному согласию. Обменивайтесь текстовыми и голосовыми сообщениями, а также фото." 
    },
    {
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-emerald-400" />,
        title: "Визуализация",
        content: "Музыка — это не только звук. Во вкладке 'Визуал' выберите стиль: от космической 'Галактики' до танцующего аватара. Включите режим 'Performance', если нужно сэкономить заряд батареи."
    },
    {
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-orange-400" />,
        title: "Эквалайзер",
        content: "Настройте звук под себя. 10-полосный эквалайзер с пресетами (Рок, Поп, Джаз и др.) поможет выжать максимум из ваших динамиков или наушников."
    },
    {
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-teal-400" />,
        title: "Стиль и Темы",
        content: "Надоела темнота? Переключитесь на Светлую тему или выберите акцентный цвет (Розовый, Неоновый, Золотой). Можно даже изменить оттенок прозрачных блоков интерфейса."
    }
  ] : [
    { 
        id: 'radio',
        icon: <MusicNoteIcon className="w-6 h-6 text-pink-500" />, 
        title: "Global Radio Engine",
        content: "The core of Au-Radiochat. Access thousands of stations worldwide. Use the sidebar to filter by Genre, Era, or Mood. Found a gem? Hit the heart icon to save it to Favorites." 
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Sleep Timer", 
        content: "Drift off to music. Open the Tools panel, go to the Clock tab, and set a timer. The audio will gently fade out as you fall asleep." 
    },
    { 
        id: 'alarm',
        icon: <BellIcon className="w-6 h-6 text-red-400" />, 
        title: "Smart Alarm", 
        content: "Wake up your way. Set an alarm in the Clock tab with your favorite station. Just keep the tab open (even in background) for it to trigger." 
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Ambience Mixer", 
        content: "Enhance your focus. The Cloud tab lets you mix rain, fire, or city sounds over your music. Try '8D Audio' with headphones for a surround sound experience." 
    },
    { 
        id: 'chat',
        icon: <UsersIcon className="w-6 h-6 text-purple-500" />, 
        title: "Private Lounge",
        content: "Connect safely. The Chat panel allows you to find peers. The 'Knock' system ensures mutual consent before chatting. Share voice notes and photos securely." 
    },
    {
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-emerald-400" />,
        title: "Visualizer",
        content: "See the beat. Choose from styles like 'Galaxy' or 'Stage Dancer' in the Visualizer tab. Use 'Performance Mode' to save battery."
    },
    {
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-orange-400" />,
        title: "Pro Equalizer",
        content: "Fine-tune the audio. A 10-band EQ with presets like Rock, Pop, and Jazz ensures the perfect sound for your device."
    },
    {
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-teal-400" />,
        title: "Themes & Style",
        content: "Make it yours. Switch between Dark/Light modes or pick an accent color. You can even tint the glass panels to match your vibe."
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
                {sections.map((section, idx) => (
                    <div 
                        key={idx} 
                        className="group p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"></div>
                        
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                {section.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{section.title}</h3>
                        </div>
                        
                        <p className="text-sm text-slate-400 leading-relaxed relative z-10 font-medium">
                            {section.content}
                        </p>

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