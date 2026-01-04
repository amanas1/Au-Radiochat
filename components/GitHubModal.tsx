
import React, { useState } from 'react';
import { XMarkIcon, GitHubIcon, CheckCircleIcon, UploadIcon, TerminalIcon } from './Icons';
import { Language } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState<'info' | 'deploy'>('info');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass-panel rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10 flex flex-col items-center text-center overflow-hidden">
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <XMarkIcon className="w-6 h-6" />
          </button>

          <div className="mb-6 relative">
              <div className="absolute inset-0 bg-white/10 blur-[40px] rounded-full"></div>
              <div className="relative z-10 w-20 h-20 bg-black/50 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                  <GitHubIcon className="w-12 h-12 text-white" />
              </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
              {language === 'ru' ? 'Развертывание & Деплой' : 'Deployment Center'}
          </h2>

          {step === 'info' && (
              <div className="w-full space-y-6 animate-in slide-in-from-right">
                  <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">
                      {language === 'ru' 
                        ? 'Чтобы сделать приложение доступным для всех, нужно загрузить код на GitHub и подключить Vercel.' 
                        : 'To make your app public, you need to push the code to GitHub and connect it to Vercel.'}
                  </p>

                  <div className="space-y-3">
                      <a 
                        href="https://github.com/new" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                      >
                          <GitHubIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                          <span>{language === 'ru' ? '1. Создать Репозиторий' : '1. Create Repository'}</span>
                      </a>

                      <a 
                        href="https://vercel.com/new" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                      >
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>
                          <span>{language === 'ru' ? '2. Импорт в Vercel' : '2. Import to Vercel'}</span>
                      </a>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 text-left border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                          <TerminalIcon className="w-4 h-4" />
                          {language === 'ru' ? 'Команды для терминала' : 'Terminal Commands'}
                      </div>
                      <code className="text-[10px] text-slate-400 font-mono block whitespace-pre-wrap">
                          git init<br/>
                          git add .<br/>
                          git commit -m "Initial commit"<br/>
                          git branch -M main<br/>
                          git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git<br/>
                          git push -u origin main
                      </code>
                  </div>

                  <button 
                    onClick={() => setStep('deploy')}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                      {language === 'ru' ? 'Готово / Инструкция' : 'Next Steps'}
                  </button>
              </div>
          )}

          {step === 'deploy' && (
              <div className="w-full space-y-6 animate-in slide-in-from-right">
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                          <CheckCircleIcon className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="text-center">
                          <h3 className="font-bold text-white mb-1">{language === 'ru' ? 'Приложение оптимизировано' : 'App Optimized'}</h3>
                          <p className="text-xs text-slate-400">
                              {language === 'ru' 
                                ? 'Конфигурация vercel.json добавлена. Сборка настроена.' 
                                : 'vercel.json added. Build output split for performance.'}
                          </p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="block text-xs font-bold text-slate-500 mb-1 uppercase">Build Command</span>
                          <code className="text-sm font-mono text-primary">npm run build</code>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="block text-xs font-bold text-slate-500 mb-1 uppercase">Output Directory</span>
                          <code className="text-sm font-mono text-primary">dist</code>
                      </div>
                  </div>

                  <button 
                    onClick={onClose} 
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all border border-white/10"
                  >
                      {language === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
                  
                  <button 
                    onClick={() => setStep('info')} 
                    className="text-xs text-slate-500 hover:text-white underline"
                  >
                      {language === 'ru' ? 'Назад' : 'Back'}
                  </button>
              </div>
          )}

      </div>
    </div>
  );
};

export default GitHubModal;
