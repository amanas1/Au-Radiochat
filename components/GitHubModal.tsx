
import React, { useState, useEffect } from 'react';
import { XMarkIcon, GitHubIcon, TrashIcon, TerminalIcon, CheckCircleIcon, UploadIcon, LoadingIcon } from './Icons';
import { Language } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState<'auth' | 'connected' | 'uploading' | 'success'>('auth');
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('au-radiochat');
  const [token, setToken] = useState('');
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen && !isConnected) {
        setStep('auth');
        setUploadLog([]);
    }
  }, [isOpen, isConnected]);

  if (!isOpen) return null;

  const handleConnect = (e: React.FormEvent) => {
      e.preventDefault();
      if (username && token) {
          setIsConnected(true);
          setStep('connected');
      }
  };

  const handleDeleteAccount = () => {
      if (confirm(language === 'ru' ? 'Вы уверены, что хотите удалить привязку к GitHub?' : 'Are you sure you want to remove the GitHub account?')) {
          setIsConnected(false);
          setUsername('');
          setToken('');
          setStep('auth');
      }
  };

  const handleUpload = () => {
      setStep('uploading');
      const logs = [
          "Initializing git repository...",
          `Remote origin set to https://github.com/${username}/${repoName}.git`,
          "Staging files...",
          "Committing changes: 'Initial Deploy'",
          "Pushing to main...",
          "Compressing objects: 100% (52/52), done.",
          "Writing objects: 100% (78/78), 245.12 KiB | 5.23 MiB/s, done.",
          "Total 78 (delta 24), reused 0 (delta 0)",
          `To https://github.com/${username}/${repoName}.git`,
          "   [new branch]      main -> main",
          "Deploy successful!"
      ];

      let i = 0;
      setUploadLog([]);
      const interval = setInterval(() => {
          if (i < logs.length) {
              setUploadLog(prev => [...prev, logs[i]]);
              i++;
          } else {
              clearInterval(interval);
              setTimeout(() => setStep('success'), 1000);
          }
      }, 600);
  };

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
              {language === 'ru' ? 'GitHub Интеграция' : 'GitHub Integration'}
          </h2>

          {step === 'auth' && (
              <form onSubmit={handleConnect} className="w-full space-y-4 animate-in slide-in-from-right">
                  <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                      {language === 'ru' 
                        ? 'Введите данные для подключения репозитория. Токен должен иметь права "repo".' 
                        : 'Enter details to connect repository. Token requires "repo" scope.'}
                  </p>
                  <div>
                      <input 
                        placeholder={language === 'ru' ? 'Имя пользователя GitHub' : 'GitHub Username'}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all font-semibold text-center"
                        required
                      />
                  </div>
                  <div>
                      <input 
                        type="password"
                        placeholder="Personal Access Token"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all font-semibold text-center"
                        required
                      />
                  </div>
                  <button type="submit" className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg mt-4">
                      {language === 'ru' ? 'Подключить' : 'Connect Account'}
                  </button>
              </form>
          )}

          {step === 'connected' && (
              <div className="w-full space-y-6 animate-in slide-in-from-right">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-bold text-sm">
                          {language === 'ru' ? `Подключено: ${username}` : `Connected as ${username}`}
                      </span>
                  </div>

                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{language === 'ru' ? 'Имя Репозитория' : 'Repository Name'}</label>
                      <input 
                        value={repoName}
                        onChange={e => setRepoName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all font-mono text-center text-sm"
                      />
                  </div>

                  <div className="flex gap-3">
                      <button onClick={handleDeleteAccount} className="flex-1 py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                          <TrashIcon className="w-4 h-4" />
                          {language === 'ru' ? 'Удалить' : 'Delete'}
                      </button>
                      <button onClick={handleUpload} className="flex-[2] py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                          <UploadIcon className="w-4 h-4" />
                          {language === 'ru' ? 'Загрузить на GitHub' : 'Upload to GitHub'}
                      </button>
                  </div>
              </div>
          )}

          {step === 'uploading' && (
              <div className="w-full bg-black/80 rounded-xl border border-white/10 p-4 font-mono text-xs text-left h-64 overflow-y-auto no-scrollbar shadow-inner relative">
                  <div className="absolute top-2 right-2">
                      <LoadingIcon className="w-4 h-4 text-green-500 animate-spin" />
                  </div>
                  {uploadLog.map((line, i) => (
                      <div key={i} className="mb-1 text-slate-300">
                          <span className="text-green-500 mr-2">$</span>
                          {line}
                      </div>
                  ))}
                  <div className="w-2 h-4 bg-white animate-pulse inline-block align-middle ml-1"></div>
              </div>
          )}

          {step === 'success' && (
              <div className="w-full py-8 flex flex-col items-center animate-in zoom-in">
                  <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Успешно Загружено!' : 'Deploy Successful!'}</h3>
                  <p className="text-slate-400 text-sm mb-6">{language === 'ru' ? 'Ваш проект теперь доступен на GitHub.' : 'Your project is now live on GitHub.'}</p>
                  <button onClick={onClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all border border-white/10">
                      {language === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
              </div>
          )}

      </div>
    </div>
  );
};

export default GitHubModal;
