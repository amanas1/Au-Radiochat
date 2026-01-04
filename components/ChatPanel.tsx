
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    XMarkIcon, PaperAirplaneIcon, UsersIcon, 
    MicrophoneIcon, FaceSmileIcon, PaperClipIcon, 
    PlayIcon, PauseIcon, CameraIcon, SearchIcon, NoSymbolIcon,
    NextIcon, PreviousIcon, VolumeIcon, ChevronDownIcon, ChevronUpIcon,
    HeartIcon, PhoneIcon, VideoCameraIcon, ArrowLeftIcon
} from './Icons';
import { ChatMessage, UserProfile, Language, RadioStation, ChatSession, ChatRequest } from '../types';
import AudioVisualizer from './AudioVisualizer';
import { chatService } from '../services/chatService';
import { TRANSLATIONS, COUNTRIES_DATA, DEMO_USERS } from '../constants';
import DiscoveryDrum from './DiscoveryDrum';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (user: UserProfile) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStation: () => void;
  onPrevStation: () => void;
  currentStation: RadioStation | null;
  analyserNode: AnalyserNode | null;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🧠', '🦴', '👀', '👁', '👄', '💋', '👅', '👂', '👃', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
];

const AGES = Array.from({ length: 63 }, (_, i) => (i + 18).toString()); 

// MOCK DATA FOR REPLACING AI
const FAKE_GREETINGS = ["Hello!", "Hi there!", "Hey!", "Greetings!", "Yo!"];
const FAKE_RESPONSES = [
    "That's cool!", "I see.", "Tell me more.", "Really?", "I love this music.",
    "Nice to meet you.", "How are you?", "Interesting.", "Haha!", "Wow."
];
const FAKE_FOLLOWUPS = ["Are you there?", "Hello?", "You went quiet."];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Helper to compress image
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Limit width for performance
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
                canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Compress to JPEG with 0.6 quality
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Component to handle auto-dissolving of media
const EphemeralMedia = ({ timestamp, onExpire, children }: React.PropsWithChildren<{ timestamp: number; onExpire?: () => void }>) => {
    const [isVisible, setIsVisible] = useState(true);
    const [opacity, setOpacity] = useState(1);
    
    useEffect(() => {
        const now = Date.now();
        const age = now - timestamp;
        const remaining = Math.max(0, 10000 - age);

        // Start fading at 7 seconds (3 seconds left)
        const fadeStart = Math.max(0, 7000 - age);
        
        const fadeTimer = setTimeout(() => {
            setOpacity(0);
        }, fadeStart);

        const expireTimer = setTimeout(() => {
            setIsVisible(false);
            if (onExpire) onExpire();
        }, remaining);
        
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(expireTimer);
        };
    }, [timestamp, onExpire]);

    if (!isVisible) return null;

    return (
        <div 
            className="transition-opacity duration-[3000ms] ease-linear"
            style={{ opacity: opacity }}
        >
            {children}
        </div>
    );
};

// Typing Animation Component
const TypingIndicator = () => (
    <div className="flex items-center gap-1 p-3 bg-white/5 border border-white/5 rounded-2xl w-fit animate-in slide-in-from-bottom-2 duration-300">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        <div className="ml-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-pulse">
                 <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                 <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                 <path d="M2 2l7.586 7.586"></path>
                 <circle cx="11" cy="11" r="2"></circle>
             </svg>
        </div>
    </div>
);

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    isOpen, onClose, language, onLanguageChange,
    currentUser, onUpdateCurrentUser,
    isPlaying, onTogglePlay, onNextStation, onPrevStation, currentStation, analyserNode,
    volume, onVolumeChange
}) => {
  const [view, setView] = useState<'auth' | 'register' | 'search' | 'inbox' | 'chat'>('auth');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('25');
  const [regCountry, setRegCountry] = useState(COUNTRIES_DATA[0].name);
  const [regCity, setRegCity] = useState(COUNTRIES_DATA[0].cities[0]);
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  
  // Search Form State
  const [searchAge, setSearchAge] = useState('Any');
  const [searchCountry, setSearchCountry] = useState('Any');
  const [searchCity, setSearchCity] = useState('Any');
  const [searchResults, setSearchResults] = useState<UserProfile[]>(DEMO_USERS);
  const [sentKnocks, setSentKnocks] = useState<Set<string>>(new Set());
  const [onlineCount, setOnlineCount] = useState(283);

  const [inputText, setInputText] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(true);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [customStatus, setCustomStatus] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const inactivityTimerRef = useRef<number | null>(null);
  const knockTimeoutRef = useRef<number | null>(null);
  const onlineIntervalRef = useRef<number | null>(null);
  const churnIntervalRef = useRef<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  useEffect(() => {
      // Online Count Simulation
      onlineIntervalRef.current = window.setInterval(() => {
          setOnlineCount(prev => {
              const change = Math.floor(Math.random() * 21) - 8; // -8 to +12
              let next = prev + change;
              if (next < 250) next = 250 + Math.floor(Math.random() * 20);
              if (next > 1500) next = 1500 - Math.floor(Math.random() * 20);
              return next;
          });
      }, 4000);

      // User Churn Simulation in Search View
      churnIntervalRef.current = window.setInterval(() => {
          if (view === 'search' && searchAge === 'Any' && searchCountry === 'Any') {
              setSearchResults(prev => {
                  const copy = [...prev];
                  // Remove random one if too many
                  if (copy.length > 5) {
                      const removeIdx = Math.floor(Math.random() * copy.length);
                      copy.splice(removeIdx, 1);
                  }
                  // Add random one from DEMO_USERS
                  const randomUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
                  if (!copy.find(u => u.id === randomUser.id)) {
                      copy.unshift(randomUser);
                  }
                  return copy;
              });
          }
      }, 3000);

      return () => {
          if (onlineIntervalRef.current) clearInterval(onlineIntervalRef.current);
          if (churnIntervalRef.current) clearInterval(churnIntervalRef.current);
      };
  }, [view, searchAge, searchCountry]);

  useEffect(() => {
      if (currentUser.isAuthenticated) {
          if (!currentUser.country || !currentUser.age) {
              setRegName(currentUser.name);
              setView('register');
          } else {
              setView('search');
              // Initialize with a subset of demo users to allow room for "churn"
              setSearchResults(DEMO_USERS.slice(0, 8)); 
              loadData();
              startPolling();
          }
      } else {
          setView('auth');
      }
      return () => stopPolling();
  }, [currentUser.isAuthenticated]);

  const availableCitiesReg = useMemo(() => {
      return COUNTRIES_DATA.find(c => c.name === regCountry)?.cities || [];
  }, [regCountry]);

  const availableCitiesSearch = useMemo(() => {
      return COUNTRIES_DATA.find(c => c.name === searchCountry)?.cities || [];
  }, [searchCountry]);

  useEffect(() => {
      setRegCity(availableCitiesReg[0]);
  }, [availableCitiesReg]);

  useEffect(() => {
      if (activeSession) {
          loadMessages(activeSession.id);
          setIsBlocked(false); // Reset blocked state on new session
          setTimeout(scrollToBottom, 100);
      }
  }, [activeSession]);

  useEffect(() => {
      scrollToBottom();
  }, [messages, view, isPartnerTyping]);

  const loadData = () => {
      if (!currentUser.id) return;
      setChats(chatService.getMyChats(currentUser.id));
      setRequests(chatService.getIncomingKnocks(currentUser.id));
  };

  const loadMessages = (sessionId: string) => {
      setMessages(chatService.getMessages(sessionId));
  };

  const startPolling = () => {
      stopPolling();
      pollingInterval.current = window.setInterval(() => {
          if (currentUser.id) {
              const newRequests = chatService.getIncomingKnocks(currentUser.id);
              if (JSON.stringify(newRequests) !== JSON.stringify(requests)) setRequests(newRequests);
              
              const newChats = chatService.getMyChats(currentUser.id);
              if (newChats.length !== chats.length || newChats[0]?.updatedAt !== chats[0]?.updatedAt) {
                  setChats(newChats);
              }

              if (activeSession) {
                  const msgs = chatService.getMessages(activeSession.id);
                  // Update only if there are new messages or changes to sync potential deletions
                  if (msgs.length !== messages.length || msgs.some((m, i) => m.image !== messages[i]?.image)) {
                      setMessages(msgs);
                  }
              }
          }
      }, 1500); // Polling every 1.5s
  };

  const stopPolling = () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
  };

  const handleLogin = async () => {
      const partialUser = await chatService.signInWithGoogle();
      onUpdateCurrentUser({ ...currentUser, ...partialUser } as UserProfile);
  };

  const handleRegistrationComplete = () => {
      const updatedUser: UserProfile = {
          ...currentUser,
          name: regName,
          age: parseInt(regAge),
          country: regCountry,
          city: regCity,
          gender: regGender,
          hasAgreedToRules: true
      };
      
      onUpdateCurrentUser(updatedUser);
      localStorage.setItem('streamflow_user_profile', JSON.stringify(updatedUser));
      setView('search');
      setSearchResults(DEMO_USERS.slice(0, 10));
      loadData();
      startPolling();
  };

  const handleSearch = () => {
      const results = DEMO_USERS.filter(u => {
          const matchAge = searchAge === 'Any' || u.age.toString() === searchAge;
          const matchCountry = searchCountry === 'Any' || u.country === searchCountry;
          const matchCity = searchCity === 'Any' || u.city === searchCity;
          return matchAge && matchCountry && matchCity;
      });
      setSearchResults(results);
  };

  const handleKnock = async (targetUser: UserProfile) => {
      if (!currentUser.id) return;
      if (knockTimeoutRef.current) clearTimeout(knockTimeoutRef.current);

      setSentKnocks(prev => new Set(prev).add(targetUser.id));
      await chatService.sendKnock(currentUser, targetUser);
      
      // REALISTIC KNOCK BEHAVIOR:
      // 1. Immediately enter chat "waiting room"
      const session = chatService.acceptRequest(`req_demo_${Date.now()}`, currentUser.id, targetUser.id);
      setChats(chatService.getMyChats(currentUser.id));
      setActiveSession(session);
      setView('chat');
      
      // 2. Set Status "Viewing Profile..."
      setCustomStatus(language === 'ru' ? 'Смотрит профиль...' : 'Viewing profile...');

      // 3. Random Delay (5s to 60s) simulating human review
      const delay = Math.floor(Math.random() * (60000 - 5000 + 1)) + 5000;

      knockTimeoutRef.current = window.setTimeout(async () => {
          if (!currentUser.id) return;

          // 4. Change status to Typing
          setCustomStatus(language === 'ru' ? 'Печатает...' : 'Typing...');
          setIsPartnerTyping(true);

          // 5. Generate varied greeting
          const greeting = getRandomElement(FAKE_GREETINGS);

          // 6. Simulate typing time based on length
          const typingTime = Math.max(1500, greeting.length * 60);

          setTimeout(() => {
              // 7. Send message and clear status
              setIsPartnerTyping(false);
              setCustomStatus(null);
              chatService.sendMessage(session.id, targetUser.id, greeting);
              loadMessages(session.id);
          }, typingTime);

      }, delay);
  };

  const handleAcceptRequest = (req: ChatRequest) => {
      if (!currentUser.id) return;
      const session = chatService.acceptRequest(req.id, currentUser.id, req.fromUserId);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setChats(prev => [session, ...prev]);
      setActiveSession(session);
      setView('chat');
  };

  const handleRejectRequest = (req: ChatRequest) => {
      chatService.rejectRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleAutoReply = async (userMsg: string, sessionId: string, partnerId: string) => {
      if (!activeSession) return;
      if (isBlocked) return;
      
      const partnerProfile = getPartnerDetails(partnerId);
      
      // REALISTIC DELAY LOGIC (5-10 Seconds as requested)
      const thinkingDelay = Math.random() * 5000 + 5000; // 5000ms to 10000ms
      
      setTimeout(async () => {
          if (isBlocked) return;
          
          // 2. Start Typing Animation (Writing)
          setIsPartnerTyping(true);
          setCustomStatus(language === 'ru' ? 'Пишет...' : 'Writing...');
          
          // Generate response (MOCKED)
          const replyText = getRandomElement(FAKE_RESPONSES);
          
          // 3. Typing duration (based on length, e.g. 50ms per char, min 2s)
          const typingDuration = Math.max(2000, replyText.length * 50);
          
          setTimeout(() => {
              if (isBlocked) { setIsPartnerTyping(false); setCustomStatus(null); return; }
              
              // 4. Send Message
              setIsPartnerTyping(false);
              setCustomStatus(null);
              chatService.sendMessage(sessionId, partnerId, replyText);
              loadMessages(sessionId);
              
          }, typingDuration);
      }, thinkingDelay);
  };

  // Follow-up logic for inactivity
  useEffect(() => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (!activeSession || isBlocked || !currentUser.id) return;

      const lastMsg = messages[messages.length - 1];
      
      const partnerId = getPartnerId(activeSession);
      const isDemoPartner = !!DEMO_USERS.find(u => u.id === partnerId);

      if (isDemoPartner && lastMsg && lastMsg.senderId === partnerId) {
          inactivityTimerRef.current = window.setTimeout(async () => {
              if (!activeSession || isBlocked) return;
              
              const partnerProfile = getPartnerDetails(partnerId);
              
              setIsPartnerTyping(true);
              const followUpText = getRandomElement(FAKE_FOLLOWUPS);
              
              setTimeout(() => {
                  if (!isBlocked) {
                      chatService.sendMessage(activeSession.id, partnerId, followUpText);
                      setIsPartnerTyping(false);
                      loadMessages(activeSession.id);
                  }
              }, 2000); 
          }, 30000); // 30 seconds inactivity
      }
      return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); };
  }, [messages, activeSession, isBlocked, currentUser.id]);

  const handleSendMessage = () => {
      if (!inputText.trim() || !activeSession || !currentUser.id || isBlocked) return;
      
      const msgText = inputText;
      chatService.sendMessage(activeSession.id, currentUser.id, msgText);
      setInputText('');
      loadMessages(activeSession.id);

      // Trigger AI Response if simulating a chat with a demo user
      const partnerId = getPartnerId(activeSession);
      if (DEMO_USERS.find(u => u.id === partnerId)) {
          handleAutoReply(msgText, activeSession.id, partnerId);
      }
  };
  
  // OPTIMIZED FILE UPLOAD
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (!file || !activeSession || !currentUser.id || isBlocked) return; 
      
      // 1. SIZE LIMIT CHECK (2MB) - Updated from 300KB
      if (file.size > 2 * 1024 * 1024) {
          alert(language === 'ru' ? 'Фото не больше 2 МБ' : 'Photo must be under 2MB');
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          return;
      }

      // 2. COMPRESSION
      try {
          const compressedBase64 = await compressImage(file);
          chatService.sendMessage(activeSession.id, currentUser.id, undefined, compressedBase64, undefined);
          loadMessages(activeSession.id); // Immediate update
      } catch (err) {
          console.error("Image compression failed", err);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleMediaExpire = (msgId: string) => {
      // Logic to clear the image content from the state
      // In a real app this would call an API. Here we update the local message state.
      setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
              return { ...m, image: undefined, audioBase64: undefined, text: m.text ? m.text : '📸 [Media Deleted]' };
          }
          return m;
      }));
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPartnerId = (session: ChatSession) => {
      return session.participants.find(id => id !== currentUser.id) || 'unknown';
  };

  const getPartnerDetails = (partnerId: string) => {
      const demoUser = DEMO_USERS.find(u => u.id === partnerId);
      if (demoUser) return demoUser;
      return {
          id: partnerId,
          name: partnerId.includes('bot') ? 'Auto Assistant' : `User ${partnerId.substr(0,4)}`,
          avatar: partnerId.includes('bot') ? 'https://api.dicebear.com/7.x/bottts/svg?seed=streamflow' : `https://i.pravatar.cc/100?u=${partnerId}`
      } as any;
  };

  if (!isOpen) return null;

  const partnerDetails = activeSession ? getPartnerDetails(getPartnerId(activeSession)) : null;

  return (
    <aside className="w-full md:w-[420px] landscape:w-full landscape:md:w-[550px] flex flex-col glass-panel border-l border-[var(--panel-border)] shadow-2xl animate-in slide-in-from-right duration-500 bg-[var(--panel-bg)] z-[60] h-full fixed right-0 top-0 bottom-0">
        
        {/* HEADER SECTION */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-transparent shrink-0 relative z-50">
            {view === 'chat' && partnerDetails ? (
                <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => {
                            setActiveSession(null); 
                            setView('inbox');
                            setMessages([]);
                        }} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/10">
                            <img src={partnerDetails.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <h3 className="text-sm font-bold text-white truncate leading-tight">{partnerDetails.name}</h3>
                            <p className="text-[10px] text-primary truncate leading-tight font-medium">
                                {customStatus ? customStatus : (isPartnerTyping ? (language === 'ru' ? 'Печатает...' : 'Typing...') : partnerDetails.status)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors"><PhoneIcon className="w-5 h-5" /></button>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors"><VideoCameraIcon className="w-5 h-5" /></button>
                        <button onClick={() => setIsBlocked(!isBlocked)} className={`p-2 transition-colors ${isBlocked ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}>
                            <NoSymbolIcon className="w-5 h-5" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h2 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                        {view === 'inbox' && (
                            <button onClick={() => setView('search')} className="mr-2 text-slate-400 hover:text-white"><SearchIcon className="w-5 h-5" /></button>
                        )}
                        {view === 'auth' ? t.authTitle : view === 'register' ? t.completeProfile : view === 'search' ? t.findFriends : view === 'inbox' ? t.myDialogs : 'Chat'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {view === 'inbox' && <button onClick={() => setView('search')} className="p-2 bg-primary/20 text-primary rounded-full hover:bg-primary hover:text-white transition-all"><UsersIcon className="w-5 h-5" /></button>}
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                </>
            )}
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {view === 'auth' && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl animate-float">
                        <UsersIcon className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">{t.authTitle}</h3>
                    <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">{t.authDesc}</p>
                    <button 
                        onClick={handleLogin}
                        className="w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
                        {t.signInGoogle}
                    </button>
                </div>
            )}

            {view === 'register' && (
                <div className="h-full flex flex-col p-6 animate-in fade-in">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">{t.completeProfile}</h3>
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">{t.displayName}</label>
                            <input value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-primary transition-all mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-2">{t.age}</label>
                                <select value={regAge} onChange={e => setRegAge(e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none appearance-none mt-1">
                                    {AGES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-2">{t.gender}</label>
                                <select value={regGender} onChange={e => setRegGender(e.target.value as any)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none appearance-none mt-1">
                                    <option value="male">{t.male}</option>
                                    <option value="female">{t.female}</option>
                                    <option value="other">{t.other}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">{t.country}</label>
                            <select value={regCountry} onChange={e => setRegCountry(e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none appearance-none mt-1">
                                {COUNTRIES_DATA.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleRegistrationComplete} className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest mt-6 shadow-lg hover:scale-105 active:scale-95 transition-all">
                        {t.saveAndEnter}
                    </button>
                </div>
            )}

            {view === 'search' && (
                <div className="h-full flex flex-col relative">
                    <div className="p-4 border-b border-white/5 space-y-4 bg-white/[0.02]">
                        <div className="flex gap-2">
                            <select value={searchAge} onChange={e => setSearchAge(e.target.value)} className="flex-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none">
                                <option value="Any">{t.age}: {t.any}</option>
                                {AGES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select value={searchCountry} onChange={e => setSearchCountry(e.target.value)} className="flex-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none">
                                <option value="Any">{t.country}: {t.any}</option>
                                {COUNTRIES_DATA.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleSearch} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                            {t.search}
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {/* Use DiscoveryDrum for cool 3D search effect if available, or just list */}
                        <div className="absolute inset-0 z-0 opacity-100">
                             <DiscoveryDrum 
                                users={searchResults} 
                                onAgree={(user) => handleKnock(user)} 
                                language={language}
                                currentUser={currentUser}
                             />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-black/40 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span>{onlineCount} {t.online}</span>
                        <button onClick={() => setView('inbox')} className="text-white hover:underline">{t.myDialogs}</button>
                    </div>
                </div>
            )}

            {view === 'inbox' && (
                <div className="h-full flex flex-col">
                    {requests.length > 0 && (
                        <div className="p-4 border-b border-white/5 bg-primary/10">
                            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                {t.knocking}
                            </h4>
                            <div className="space-y-2">
                                {requests.map(req => {
                                    const sender = DEMO_USERS.find(u => u.id === req.fromUserId) || { name: 'Unknown', avatar: '', id: req.fromUserId };
                                    return (
                                        <div key={req.id} className="bg-black/40 p-3 rounded-2xl flex items-center gap-3 border border-primary/30">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                                <img src={sender.avatar || ''} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm">{sender.name}</div>
                                                <div className="text-[10px] text-primary">{t.wantsToConnect}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleAcceptRequest(req)} className="p-2 bg-green-500 text-white rounded-xl hover:scale-110 transition-transform">✓</button>
                                                <button onClick={() => handleRejectRequest(req)} className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform">✕</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {chats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <UsersIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-white">{t.noChats}</p>
                                <p className="text-xs text-slate-500 mt-2 max-w-[200px]">{t.useDiscovery}</p>
                            </div>
                        ) : (
                            chats.map(chat => {
                                const partnerId = getPartnerId(chat);
                                const partner = getPartnerDetails(partnerId);
                                const lastMsg = chat.lastMessage;
                                return (
                                    <button 
                                        key={chat.id} 
                                        onClick={() => { setActiveSession(chat); setView('chat'); }}
                                        className="w-full p-3 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-3 group text-left border border-transparent hover:border-white/5"
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                                                <img src={partner.avatar || ''} className="w-full h-full object-cover" />
                                            </div>
                                            {partner.status === 'online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--panel-bg)]"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-white text-sm">{partner.name}</span>
                                                <span className="text-[9px] text-slate-500 font-bold">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate group-hover:text-white transition-colors">
                                                {lastMsg?.text || (lastMsg?.image ? '📸 Photo' : (lastMsg?.audioBase64 ? '🎤 Voice' : 'No messages'))}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {view === 'chat' && activeSession && (
                <div className="h-full flex flex-col bg-black/20">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div className="text-center py-4">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t.today}</p>
                        </div>
                        
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === currentUser.id;
                            const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== msg.senderId);
                            
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    {!isMe && (
                                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-1 opacity-0" style={{ opacity: showAvatar ? 1 : 0 }}>
                                            <img src={partnerDetails?.avatar} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm relative group ${
                                        isMe 
                                        ? 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/20' 
                                        : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                                    }`}>
                                        {msg.image && (
                                            <EphemeralMedia timestamp={msg.timestamp} onExpire={() => handleMediaExpire(msg.id)}>
                                                <img src={msg.image} className="rounded-lg mb-2 max-h-48 object-cover w-full" />
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[9px] font-bold backdrop-blur-sm">10s</div>
                                            </EphemeralMedia>
                                        )}
                                        {msg.audioBase64 && (
                                            <div className="flex items-center gap-2 min-w-[120px]">
                                                <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                                    <PlayIcon className="w-4 h-4" />
                                                </button>
                                                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/3 bg-white"></div>
                                                </div>
                                            </div>
                                        )}
                                        {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                        <div className={`text-[9px] font-bold mt-1 text-right opacity-50 ${isMe ? 'text-white' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isPartnerTyping && !isBlocked && (
                            <div className="flex items-end gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-1">
                                    <img src={partnerDetails?.avatar} className="w-full h-full object-cover" />
                                </div>
                                <TypingIndicator />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {!isBlocked && (
                        <div className="p-3 bg-[var(--panel-bg)] border-t border-white/5 shrink-0 backdrop-blur-xl">
                            {/* Input Area */}
                            <div className="flex items-end gap-2 bg-black/40 border border-white/10 rounded-[1.5rem] p-1.5 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                                <div className="flex gap-0.5 pb-1 pl-1">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><PaperClipIcon className="w-5 h-5" /></button>
                                    <button onClick={() => cameraInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"><CameraIcon className="w-5 h-5" /></button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                    <input type="file" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
                                </div>
                                <textarea 
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Message..."
                                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm p-2.5 max-h-32 min-h-[44px] outline-none resize-none custom-scrollbar"
                                    rows={1}
                                />
                                {inputText.trim() ? (
                                    <button 
                                        onClick={handleSendMessage}
                                        className="p-2.5 bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 mb-0.5 mr-0.5"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button 
                                        className={`p-2.5 rounded-full transition-all mb-0.5 mr-0.5 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                        onMouseDown={() => setIsRecording(true)}
                                        onMouseUp={() => setIsRecording(false)}
                                        onTouchStart={() => setIsRecording(true)}
                                        onTouchEnd={() => setIsRecording(false)}
                                    >
                                        <MicrophoneIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {isBlocked && (
                        <div className="p-4 text-center bg-red-500/10 border-t border-red-500/20">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">You blocked this user</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </aside>
  );
};

export default ChatPanel;
