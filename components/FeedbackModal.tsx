
import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon } from './Icons';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, language }) => {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && rating === 0) return;

    setIsSending(true);
    
    // Simulate sending email
    setTimeout(() => {
        setIsSending(false);
        setSent(true);
        console.log(`Sending feedback to amanas5535332@gmail.com:\nRating: ${rating}\nMessage: ${message}`);
        
        // Actually trigger mailto as a fallback/real action for client-side
        const subject = encodeURIComponent(`StreamFlow Feedback - Rating: ${rating}/5`);
        const body = encodeURIComponent(message);
        window.location.href = `mailto:amanas5535332@gmail.com?subject=${subject}&body=${body}`;

        setTimeout(() => {
            setSent(false);
            setMessage('');
            setRating(0);
            onClose();
        }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass-panel rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-black text-white mb-2">{t.feedbackTitle}</h2>
        <p className="text-slate-400 text-sm mb-8">{t.helpImprove || "Help us improve StreamFlow."}</p>

        {sent ? (
            <div className="py-10 text-center animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{t.sendSuccess}</h3>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2 mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.rating}</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-slate-700'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t.tellUs}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all resize-none placeholder:text-slate-600 font-medium"
                    />
                </div>

                {/* Submit */}
                <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <EnvelopeIcon className="w-5 h-5" />
                            {t.writeDev}
                        </>
                    )}
                </button>
            </form>
        )}
        
      </div>
    </div>
  );
};

export default FeedbackModal;
