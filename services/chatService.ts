
import { ChatMessage, ChatRequest, ChatSession, UserProfile } from '../types';

// STORAGE KEYS
const KEY_CHATS = 'streamflow_chats_v1';
const KEY_REQUESTS = 'streamflow_requests_v1';
const KEY_MESSAGES = 'streamflow_messages_v1';

// CONSTANTS
const ONE_HOUR_MS = 60 * 60 * 1000;
const MEDIA_TTL_MS = 10 * 1000; // 10 Seconds

// --- HELPER FUNCTIONS ---

const getStorage = <T>(key: string): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : (Array.isArray(JSON.parse(item || '[]')) ? [] : {});
    } catch {
        return [] as any;
    }
};

const setStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("Storage full or error", e);
    }
};

// --- SERVICE METHODS ---

export const chatService = {
    // 1. AUTHENTICATION (Simulated Google OAuth)
    signInWithGoogle: async (): Promise<Partial<UserProfile>> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockGoogleUser = {
                    id: 'google_user_' + Date.now(),
                    name: 'StreamUser',
                    avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                    email: 'user@gmail.com',
                    isAuthenticated: true,
                    age: 0,
                    country: '',
                    city: '',
                    gender: 'other' as const,
                    status: 'online' as const,
                    safetyLevel: 'green' as const,
                    blockedUsers: [],
                    bio: 'Verified via Google',
                    hasAgreedToRules: false,
                    filters: { minAge: 18, maxAge: 99, countries: [], languages: [], genders: ['any'], soundEnabled: true }
                };
                resolve(mockGoogleUser);
            }, 1500);
        });
    },

    // 2. DISCOVERY & REQUESTS
    sendKnock: (fromUser: UserProfile, toUser: UserProfile): Promise<boolean> => {
        return new Promise((resolve) => {
            const requests = getStorage<ChatRequest[]>(KEY_REQUESTS) || [];
            const existing = requests.find(r => r.fromUserId === fromUser.id && r.toUserId === toUser.id && r.status === 'pending');
            if (existing) {
                resolve(true);
                return;
            }
            const newRequest: ChatRequest = {
                id: `req_${Date.now()}`,
                fromUserId: fromUser.id,
                toUserId: toUser.id,
                status: 'pending',
                timestamp: Date.now()
            };
            setStorage(KEY_REQUESTS, [...requests, newRequest]);
            if (!toUser.id.startsWith('google_user')) {
                setTimeout(() => {
                    chatService.acceptRequest(newRequest.id, toUser.id, fromUser.id);
                }, 5000);
            }
            resolve(true);
        });
    },

    getIncomingKnocks: (userId: string): ChatRequest[] => {
        const requests = getStorage<ChatRequest[]>(KEY_REQUESTS) || [];
        return requests.filter(r => r.toUserId === userId && r.status === 'pending');
    },

    acceptRequest: (requestId: string, currentUserId: string, partnerId: string): ChatSession => {
        const requests = getStorage<ChatRequest[]>(KEY_REQUESTS) || [];
        const updatedRequests = requests.map(r => r.id === requestId ? { ...r, status: 'accepted' as const } : r);
        setStorage(KEY_REQUESTS, updatedRequests);

        const sessions = getStorage<ChatSession[]>(KEY_CHATS) || [];
        const existingSession = sessions.find(s => s.participants.includes(currentUserId) && s.participants.includes(partnerId));
        if (existingSession) return existingSession;

        const newSession: ChatSession = {
            id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            participants: [currentUserId, partnerId],
            lastMessage: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setStorage(KEY_CHATS, [...sessions, newSession]);
        return newSession;
    },

    rejectRequest: (requestId: string) => {
        const requests = getStorage<ChatRequest[]>(KEY_REQUESTS) || [];
        const updated = requests.filter(r => r.id !== requestId);
        setStorage(KEY_REQUESTS, updated);
    },

    getMyChats: (userId: string): ChatSession[] => {
        const sessions = getStorage<ChatSession[]>(KEY_CHATS) || [];
        return sessions
            .filter(s => s.participants.includes(userId))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    // 4. MESSAGING (Optimized with Auto-Delete)
    getMessages: (sessionId: string): ChatMessage[] => {
        let allMessages = getStorage<ChatMessage[]>(KEY_MESSAGES) || [];
        const now = Date.now();
        let hasChanges = false;

        // 1. Filter out messages older than 1 hour completely
        const freshMessages = allMessages.filter(m => {
            if (now - m.timestamp > ONE_HOUR_MS) {
                hasChanges = true;
                return false;
            }
            return true;
        });

        // 2. Remove heavy media data from messages older than 10 seconds (MEDIA_TTL_MS)
        // AND ensure no traces if the message was purely media.
        const processedMessages = freshMessages.filter(m => {
            const age = now - m.timestamp;
            if (age > MEDIA_TTL_MS && (m.image || m.audioBase64)) {
                hasChanges = true;
                
                // If it was purely an image/audio message (no text), REMOVE IT completely from the list (no traces)
                if (!m.text) {
                    return false;
                }
                
                // If mixed (text + image), just strip the image property
                m.image = undefined;
                m.audioBase64 = undefined;
                return true; 
            }
            return true;
        });

        if (hasChanges) {
            setStorage(KEY_MESSAGES, processedMessages);
        }

        return processedMessages
            .filter(m => m.sessionId === sessionId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    sendMessage: (sessionId: string, senderId: string, text?: string, image?: string, audio?: string): ChatMessage => {
        const msg: ChatMessage = {
            id: `msg_${Date.now()}`,
            sessionId,
            senderId,
            text,
            image,
            audioBase64: audio,
            timestamp: Date.now(),
            read: false
        };

        const allMessages = getStorage<ChatMessage[]>(KEY_MESSAGES) || [];
        setStorage(KEY_MESSAGES, [...allMessages, msg]);

        const sessions = getStorage<ChatSession[]>(KEY_CHATS) || [];
        const updatedSessions = sessions.map(s => s.id === sessionId ? { ...s, lastMessage: msg, updatedAt: Date.now() } : s);
        setStorage(KEY_CHATS, updatedSessions);

        return msg;
    },

    simulateIncomingKnock: (botUser: UserProfile, targetUserId: string) => {
        const requests = getStorage<ChatRequest[]>(KEY_REQUESTS) || [];
        if (requests.find(r => r.fromUserId === botUser.id && r.toUserId === targetUserId)) return;

        const newRequest: ChatRequest = {
            id: `req_sim_${Date.now()}`,
            fromUserId: botUser.id,
            toUserId: targetUserId,
            status: 'pending',
            timestamp: Date.now()
        };
        setStorage(KEY_REQUESTS, [...requests, newRequest]);
    }
};
