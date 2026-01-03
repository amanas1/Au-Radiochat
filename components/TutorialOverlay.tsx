
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon } from './Icons';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  highlightFeature?: string | null;
}

const TutorialArrow = ({ className, rotation }: { className?: string; rotation: string }) => (
    <div className={`absolute ${className} pointer-events-none`} style={{ transform: `rotate(${rotation})` }}>
        <svg 
            width="60" 
            height="60" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white drop-shadow-[0_0_10px_rgba(188,111,241,0.8)] animate-pulse"
        >
            <path d="M19.5 12h-15m0 0l7.5 7.5M4.5 12l7.5-7.5" />
        </svg>
    </div>
);

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, language, highlightFeature }) => {
  const [step, setStep] = useState(0);
  const t = TRANSLATIONS[language];

  // Specific Feature Configurations with Arrow positioning
  // pos: Tailwind class for the Card position
  // arrowClass: Tailwind class for Arrow wrapper position relative to Card
  // arrowRot: Rotation in degrees (0 = Pointing Left)
  const FEATURES: Record<string, { title: string; content: string; pos: string; arrowClass: string; arrowRot: string }> = {
      'radio': { 
          title: t.manualSection2?.split(':')[0] || 'Radio', 
          content: t.tutorialStep1, 
          pos: 'top-24 left-20 md:left-80', // Moved slightly right to make room for arrow
          arrowClass: '-left-20 top-8 animate-bounce-left', // Points to sidebar
          arrowRot: '0deg'
      },
      'timer': { 
          title: t.sleepTimer, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с часами.' : 'Open Tools and go to the Clock tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce', // Points to tools button
          arrowRot: '-90deg'
      },
      'alarm': { 
          title: t.alarm, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с часами.' : 'Open Tools and go to the Clock tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce',
          arrowRot: '-90deg'
      },
      'ambience': { 
          title: t.ambience, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с облаком.' : 'Open Tools and go to the Cloud tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce',
          arrowRot: '-90deg'
      },
      'chat': { 
          title: t.privateChat, 
          content: t.tutorialStep5, 
          pos: 'top-24 right-16',
          arrowClass: '-top-12 -right-6 animate-bounce', // Points to chat button
          arrowRot: '90deg'
      },
      'visualizer': { 
          title: t.visualizer, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с кисточкой.' : 'Open Tools and go to the Swatch tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce',
          arrowRot: '-90deg'
      },
      'eq': { 
          title: t.eq, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с настройками.' : 'Open Tools and go to the Sliders tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce',
          arrowRot: '-90deg'
      },
      'appearance': { 
          title: t.look, 
          content: language === 'ru' ? 'Откройте инструменты и перейдите во вкладку с палитрой.' : 'Open Tools and go to the Palette tab.', 
          pos: 'bottom-32 right-6 md:right-12',
          arrowClass: '-bottom-16 -right-4 animate-bounce',
          arrowRot: '-90deg'
      },
  };

  // Full Tutorial Steps
  const steps = [
    { title: t.tutorialWelcome, content: t.tutorialStep1, pos: 'top-20 left-72' },
    { title: t.manualSection2?.split(':')[0], content: t.tutorialStep2, pos: 'top-1/3 left-1/2 -translate-x-1/2' },
    { title: t.manualSection3?.split(':')[0], content: t.tutorialStep3, pos: 'bottom-28 left-1/2 -translate-x-1/2' },
    { title: t.manualSection5?.split(':')[0], content: t.tutorialStep4, pos: 'bottom-28 right-10' },
    { title: t.manualSection4?.split(':')[0], content: t.tutorialStep5, pos: 'top-20 right-10' },
  ];

  if (!isOpen) return null;

  // If a specific feature is highlighted, show that one
  if (highlightFeature && FEATURES[highlightFeature]) {
      const current = FEATURES[highlightFeature];
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
            <div className={`absolute pointer-events-auto transition-all duration-500 ${current.pos}`}>
                <div className="w-80 glass-panel p-6 rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-in zoom-in duration-300 border-2 border-primary relative">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.manualTooltip}</span>
                        <button onClick={onClose} className="p-1 text-slate-500 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{current.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{current.content}</p>
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        {t.gotIt}
                    </button>
                    
                    {/* The Pointing Arrow */}
                    <TutorialArrow className={current.arrowClass} rotation={current.arrowRot} />
                </div>
            </div>
            {/* Custom Animation Style for Left Bounce */}
            <style>{`
                @keyframes bounce-left {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-25%); }
                }
                .animate-bounce-left {
                    animation: bounce-left 1s infinite;
                }
            `}</style>
        </div>
      );
  }

  // Standard Tutorial Flow
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      
      <div className={`absolute pointer-events-auto transition-all duration-500 ${current.pos}`}>
        <div className="w-80 glass-panel p-6 rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Step {step + 1} / {steps.length}</span>
                <button onClick={onClose} className="p-1 text-slate-500 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
            </div>
            
            <h4 className="text-xl font-bold text-white mb-2">{current.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">{current.content}</p>
            
            <div className="flex gap-2">
                {step > 0 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setStep(s => s - 1); }} 
                        className="flex-1 py-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all text-xs font-bold"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); if (step < steps.length - 1) setStep(s => s + 1); else onClose(); }} 
                    className="flex-[2] py-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all text-xs font-bold"
                >
                    {step < steps.length - 1 ? t.next : t.gotIt}
                </button>
            </div>
        </div>
        
        {/* Pointer Triangle */}
        <div className={`absolute w-4 h-4 bg-[var(--panel-bg)] rotate-45 border border-white/10 ${step === 0 ? '-left-2 top-10' : step === 4 ? '-right-2 top-10' : '-bottom-2 left-1/2 -translate-x-1/2'}`}></div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
