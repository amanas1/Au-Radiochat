
import { RadioStation, StreamQuality } from '../types';
import { RADIO_BROWSER_MIRRORS } from '../constants';

const CACHE_KEY_PREFIX = 'streamflow_station_cache_v3_'; // Bumped version to invalidate old caches
const CACHE_TTL_MINUTES = 60; // 1 hour cache

interface CacheEntry {
    data: RadioStation[];
    timestamp: number;
}

const getFromCache = (key: string): RadioStation[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();
            if (now - entry.timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
                return entry.data;
            } else {
                localStorage.removeItem(CACHE_KEY_PREFIX + key);
            }
        }
    } catch (e) {
        console.error("Error reading from cache:", e);
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
    }
    return null;
};

const setToCache = (key: string, data: RadioStation[]) => {
    try {
        const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn("Error writing to cache:", e);
    }
};

const getShuffledMirrors = () => {
    const mirrors = [...RADIO_BROWSER_MIRRORS];
    for (let i = mirrors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mirrors[i], mirrors[j]] = [mirrors[j], mirrors[i]];
    }
    return mirrors;
};

const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { 
            method: 'GET',
            // Removed 'mode: cors' and 'cache: no-store' to prevent issues on some networks
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal 
        });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

const fetchAcrossMirrorsWithRetries = async (path: string, urlParams: string): Promise<RadioStation[]> => {
    const mirrors = getShuffledMirrors();
    if (!mirrors.some(m => m.includes('all.api'))) {
        mirrors.push('https://all.api.radio-browser.info/json/stations');
    }
    
    let lastError: any = null;

    for (const baseUrl of mirrors) {
        const fullUrl = `${baseUrl}/${path}?${urlParams}`;
        try {
            const response = await fetchWithTimeout(fullUrl, 8000);
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    return data; 
                } else {
                    console.warn(`Mirror ${baseUrl} returned non-array data.`);
                }
            }
        } catch (error: any) {
            console.warn(`Failed to fetch from mirror ${baseUrl}: ${error.message || error}.`);
            lastError = error;
        }
    }
    
    console.error("All mirrors failed. Last error:", lastError);
    // Return empty array instead of throwing to allow UI to handle empty state gracefully
    return [];
};


const filterStations = (data: RadioStation[], quality: StreamQuality = 'standard') => {
    const uniqueStations = new Map();
    const blacklistTags = ['news', 'talk', 'speech', 'sport', 'sports', 'politics', 'education', 'debate', 'conversation', 'business', 'comedy', 'scanner', 'weather', 'traffic', 'police'];
    
    let filtered = data.filter(station => {
      if (!station.url_resolved) return false;
      
      const tags = (station.tags || '').toLowerCase();
      if (blacklistTags.some(t => tags.includes(t))) return false;

      const codec = (station.codec || '').toLowerCase();
      const url = station.url_resolved.toLowerCase();

      // Ensure format is browser playable
      const isBrowserCompatible = (
          codec.includes('mp3') || 
          codec.includes('aac') || 
          codec.includes('ogg') ||
          url.endsWith('.mp3') ||
          url.endsWith('.aac')
      );
      
      const bitrate = station.bitrate || 0;
      
      let qualityCheck = true;
      if (quality === 'economy') {
          qualityCheck = bitrate <= 96 || codec.includes('aac'); 
      } else if (quality === 'premium') {
          qualityCheck = bitrate >= 128; 
      } else {
          qualityCheck = bitrate >= 64; 
      }
      
      // Strict Playlist Filter to prevent MediaError Code 4
      const isPlaylist = /\.(m3u|pls|ashx|m3u8|xspf|asx|wax|wvx|ram|smil)(\?.*)?$/i.test(url);
      const isHtml = /\.(html|htm)(\?.*)?$/i.test(url);

      // HTTPS is mandatory for Vercel/PWA
      const isSslSafe = station.url_resolved.startsWith('https');

      const isBlacklisted = station.name === 'Спокойное радио';

      return isBrowserCompatible && qualityCheck && !isPlaylist && !isHtml && isSslSafe && !isBlacklisted;
    });

    filtered.sort((a, b) => {
        if (quality === 'premium') {
            const bitrateA = a.bitrate || 0;
            const bitrateB = b.bitrate || 0;
            const bitDiff = bitrateB - bitrateA;
            if (Math.abs(bitDiff) >= 32) return bitDiff;
            return b.votes - a.votes;
        }
        const voteDiff = b.votes - a.votes;
        if (Math.abs(voteDiff) > 500) return voteDiff;
        if (quality === 'economy') {
            return (a.bitrate || 128) - (b.bitrate || 128);
        }
        return voteDiff;
    });

    filtered.forEach(station => {
        if (!uniqueStations.has(station.name)) {
            uniqueStations.set(station.name, station);
        }
    });

    return Array.from(uniqueStations.values());
};

const TAG_MAPPINGS: Record<string, string> = {
    '60s': '60s',
    '70s': '70s',
    '80s': '80s',
    '90s': '90s',
    '00s': '2000s',
    '2010': '2000s',
    '2025': 'hits',
    'modern_hits': 'hits',
    'energy': 'dance',
    'dark': 'techno',
    'chill': 'chillout',
    'focus': 'ambient',
    'romantic': 'love songs',
    'hiphop': 'hip hop'
};

export const fetchStationsByTag = async (tag: string, limit: number = 40, quality: StreamQuality = 'standard'): Promise<RadioStation[]> => {
  const cacheKey = `tag_${tag}_${limit}_${quality}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  const searchTag = TAG_MAPPINGS[tag] || tag;
  const encodedTag = encodeURIComponent(searchTag);

  try {
    // Fetch more candidates to ensure enough pass the strict filters
    const fetchLimit = Math.max(100, limit * 5); 
    const urlParams = `limit=${fetchLimit}&order=votes&reverse=true&hidebroken=true&https=true`;
    const data = await fetchAcrossMirrorsWithRetries(`bytag/${encodedTag}`, urlParams);
    
    const filteredAndSliced = filterStations(data, quality).slice(0, limit);
    
    if (filteredAndSliced.length > 0) {
        setToCache(cacheKey, filteredAndSliced);
    }
    return filteredAndSliced;
  } catch (error) {
    console.error("Error fetching radio stations by tag:", error);
    return [];
  }
};

export const fetchRandomStations = async (limit: number = 20, quality: StreamQuality = 'standard'): Promise<RadioStation[]> => {
    try {
        const fetchLimit = limit * 5; 
        const urlParams = `limit=${fetchLimit}&hidebroken=true&https=true`;
        
        const data = await fetchAcrossMirrorsWithRetries(`random`, urlParams);
        
        const filteredAndSliced = filterStations(data, quality).slice(0, limit);
        
        return filteredAndSliced;
    } catch (error) {
        console.error("Error fetching random stations:", error);
        return [];
    }
};

export const fetchStationsByUuids = async (uuids: string[]): Promise<RadioStation[]> => {
    if (uuids.length === 0) return [];
    
    const sortedUuids = [...uuids].sort();
    const cacheKey = `uuids_${sortedUuids.join('_')}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        const fetchPromises = sortedUuids.slice(0, 15).map(uuid => 
            fetchAcrossMirrorsWithRetries(`byuuid/${uuid}`, '')
        );
        
        const results = await Promise.allSettled(fetchPromises);
        const flatResults: RadioStation[] = [];
        
        results.forEach(res => {
            if (res.status === 'fulfilled') {
                flatResults.push(...res.value);
            }
        });
        
        const processedResults = filterStations(flatResults, 'standard');
        if (processedResults.length > 0) {
             setToCache(cacheKey, processedResults);
        }
        return processedResults;
    } catch (error) {
        console.error("Error fetching favorite stations by UUIDs:", error);
        return [];
    }
}

export const fetchStationsByGenre = fetchStationsByTag;
