
import React, { useEffect, useState } from 'react';
import { XMarkIcon, AndroidIcon, AppleIcon } from './Icons';
import { Language } from '../types';

interface DownloadAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    installPrompt: any;
}

const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose, language, installPrompt }) => {
    const [qrUrl, setQrUrl] = useState('');
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Generate QR code for current URL
        const url = window.location.href;
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=1e293b&color=ffffff`);
        
        // Simple iOS check
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }, []);

    if (!isOpen) return null;

    const t = language === 'ru' ? {
        title: "Скачайте приложение",
        subtitle: "Слушайте StreamFlow на ходу",
        scan: "Сканируйте камерой телефона",
        install: "ЗАГРУЗИТЬ ПРИЛОЖЕНИЕ",
        android: "Android",
        ios: "iOS",
        desc: "Откройте камеру на телефоне и наведите на QR-код, чтобы открыть приложение.",
        iosInstruct: "Нажмите 'Поделиться' и выберите 'На экран «Домой»'",
        installed: "Приложение установлено"
    } : {
        title: "Get the App",
        subtitle: "Listen to StreamFlow on the go",
        scan: "Scan with phone camera",
        install: "INSTALL APP",
        android: "Android",
        ios: "iOS",
        desc: "Open your phone camera and point it at the QR code to launch the app.",
        iosInstruct: "Tap 'Share' and select 'Add to Home Screen'",
        installed: "App Installed"
    };

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                onClose();
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg glass-panel rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 flex flex-col items-center text-center overflow-hidden border border-white/10">
                
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-primary blur-[60px] opacity-20 animate-pulse"></div>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg relative z-10">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-2">{t.title}</h2>
                <p className="text-slate-400 text-sm mb-8">{t.subtitle}</p>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full mb-8">
                    {/* QR Code Section (Hidden on small mobile screens if install prompt is available to save space) */}
                    <div className={`flex-1 flex flex-col items-center ${installPrompt ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-3 bg-white rounded-2xl shadow-lg mb-4 transform hover:scale-105 transition-transform duration-500">
                             {qrUrl && <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-lg" />}
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{t.scan}</p>
                    </div>

                    <div className={`hidden md:block w-px h-32 bg-white/10 ${installPrompt ? 'hidden' : ''}`}></div>

                    {/* Buttons Section */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                         {installPrompt ? (
                             <button onClick={handleInstallClick} className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 animate-pulse">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                 </svg>
                                 {t.install}
                             </button>
                         ) : isIOS ? (
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                 <p className="text-xs text-white font-bold mb-2">iOS / Safari</p>
                                 <p className="text-[10px] text-slate-400">{t.iosInstruct}</p>
                             </div>
                         ) : (
                             <p className="text-xs text-slate-500 italic">{t.installed}</p>
                         )}
                         
                         <div className="flex gap-2 mt-2">
                             <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group">
                                <AndroidIcon className="w-5 h-5 text-slate-400 group-hover:text-[#3DDC84] transition-colors" />
                                <span className="text-xs font-bold text-slate-300">{t.android}</span>
                             </button>
                             <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group">
                                <AppleIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                <span className="text-xs font-bold text-slate-300">{t.ios}</span>
                             </button>
                         </div>
                         {!installPrompt && <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{t.desc}</p>}
                    </div>
                </div>
                
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <p className="mt-4 text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">StreamFlow Mobile Engine</p>
            </div>
        </div>
    );
};

export default DownloadAppModal;
