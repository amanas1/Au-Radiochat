
import { RadioStation, StreamQuality } from '../types';
import { RADIO_BROWSER_MIRRORS } from '../constants';

const CACHE_KEY_PREFIX = 'streamflow_station_cache_v2_'; // Bumped version to invalidate old caches containing bad formats
const CACHE_TTL_MINUTES = 60; // Increased cache duration to 1 hour to reduce API load

interface CacheEntry {
    data: RadioStation[];
    timestamp: number; // Unix timestamp when cached
}

const getFromCache = (key: string): RadioStation[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();
            if (now - entry.timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
                // console.log(`Cache hit for ${key}`);
                return entry.data;
            } else {
                localStorage.removeItem(CACHE_KEY_PREFIX + key); // Clean up expired cache
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

// Helper to shuffle array to distribute load and avoid sticking to a broken first mirror
const getShuffledMirrors = () => {
    const mirrors = [...RADIO_BROWSER_MIRRORS];
    // Fisher-Yates shuffle
    for (let i = mirrors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mirrors[i], mirrors[j]] = [mirrors[j], mirrors[i]];
    }
    return mirrors;
};

// Fetch with timeout to prevent hanging requests
const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { 
            method: 'GET',
            // Removed 'mode: cors' and 'cache: no-store' to let browser handle defaults and caching optimization
            // This improves success rate on some networks/browsers
            credentials: 'omit', 
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

// Main function to fetch data across multiple API mirrors with a fail-fast strategy
const fetchAcrossMirrorsWithRetries = async (path: string, urlParams: string): Promise<RadioStation[]> => {
    const mirrors = getShuffledMirrors();
    // Add the main load balancer as a backup if not present
    if (!mirrors.some(m => m.includes('all.api'))) {
        mirrors.push('https://all.api.radio-browser.info/json/stations');
    }
    
    let lastError: any = null;

    for (const baseUrl of mirrors) {
        const fullUrl = `${baseUrl}/${path}?${urlParams}`;
        try {
            const response = await fetchWithTimeout(fullUrl, 8000); // 8s timeout
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    return data; 
                } else {
                    console.warn(`Mirror ${baseUrl} returned non-array data.`);
                }
            } else {
                console.warn(`Mirror ${baseUrl} returned ${response.status}. Trying next...`);
            }
        } catch (error: any) {
            console.warn(`Failed to fetch from mirror ${baseUrl}: ${error.message || error}.`);
            lastError = error;
        }
    }
    
    console.error("All mirrors failed. Last error:", lastError);
    throw new Error(`Failed to fetch from all available RadioBrowser mirrors. Please check your connection.`);
};


const filterStations = (data: RadioStation[], quality: StreamQuality = 'standard') => {
    const uniqueStations = new Map();
    const blacklistTags = ['news', 'talk', 'speech', 'sport', 'sports', 'politics', 'education', 'debate', 'conversation', 'business', 'comedy', 'scanner', 'weather', 'traffic', 'police'];
    
    // Filter logic - OPTIMIZED FOR TRAFFIC ECONOMY & SPEED
    let filtered = data.filter(station => {
      if (!station.url_resolved) return false;
      
      // Strict Text Filter for non-music
      const tags = (station.tags || '').toLowerCase();
      if (blacklistTags.some(t => tags.includes(t))) return false;

      const codec = (station.codec || '').toLowerCase();
      const url = station.url_resolved.toLowerCase();

      // Browsers love MP3 and AAC best.
      // OGG is widely supported but sometimes iffy on older Safari (though mostly fine now).
      // We explicitly exclude 'UNKNOWN' if we can to avoid bad streams.
      const isBrowserCompatible = (
          codec.includes('mp3') || 
          codec.includes('aac') || 
          codec.includes('ogg') ||
          url.endsWith('.mp3') ||
          url.endsWith('.aac')
      );
      
      const bitrate = station.bitrate || 0;
      
      // TRAFFIC OPTIMIZATION LOGIC
      let qualityCheck = true;
      if (quality === 'economy') {
          // In Economy: Prefer AAC+ (HE-AAC) or low bitrate MP3 (< 96)
          // Allows play even at 28kbps if codec is efficient
          qualityCheck = bitrate <= 96 || codec.includes('aac'); 
      } else if (quality === 'premium') {
          // In Premium: STRICTLY High Bitrate (>= 128) to avoid distortion/artifacts.
          // We strictly exclude anything below 128kbps.
          // We also exclude 0 (unknown) to guarantee quality.
          qualityCheck = bitrate >= 128; 
      } else {
          // Standard: Avoid extremely low quality unless it's AAC, avoid massive streams
          qualityCheck = bitrate >= 64; 
      }
      
      // Strict Playlist Filter
      // Code 4 errors often come from trying to play .m3u, .pls, .m3u8 (without HLS.js), .asx directly
      // Check both URL extension and common query params
      const isPlaylist = /\.(m3u|pls|ashx|m3u8|xspf|asx|wax|wvx|ram|smil)(\?.*)?$/i.test(url);
      
      // Exclude HTML pages masquerading as streams
      const isHtml = /\.(html|htm)(\?.*)?$/i.test(url);

      // Prefer HTTPS to avoid Mixed Content errors which slow down or block loading
      const isSslSafe = station.url_resolved.startsWith('https');

      // Specific blacklist
      const isBlacklisted = station.name === 'Спокойное радио';

      return isBrowserCompatible && qualityCheck && !isPlaylist && !isHtml && isSslSafe && !isBlacklisted;
    });

    // Sort based on quality preference and reliability
    filtered.sort((a, b) => {
        // Special sorting for PREMIUM: Bitrate is Priority #1
        if (quality === 'premium') {
            const bitrateA = a.bitrate || 0;
            const bitrateB = b.bitrate || 0;
            const bitDiff = bitrateB - bitrateA;
            
            // If significant difference (e.g. 128 vs 320), prefer bitrate immediately
            if (Math.abs(bitDiff) >= 32) return bitDiff;
            
            // Otherwise use votes as tie breaker
            return b.votes - a.votes;
        }

        // Standard/Economy Sorting: Reliability (Votes) is Priority #1
        const voteDiff = b.votes - a.votes;
        if (Math.abs(voteDiff) > 500) return voteDiff;
        
        // Priority 2: Bitrate optimization
        if (quality === 'economy') {
            // Lower bitrate is better (but not 0)
            return (a.bitrate || 128) - (b.bitrate || 128);
        }
        
        // Fallback
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
    '2010': '2000s', // User specific: 2001-2010 era
    '2025': 'hits',  // User specific: 2011-2025 modern era
    'modern_hits': 'hits', // User requested Genre 'New 2020-2025'
    'energy': 'dance', // 'Energy' mood -> Dance (includes house, techno, club)
    'dark': 'techno',  // 'Club' mood -> Techno
    'chill': 'chillout', // 'Chill' mood -> Chillout
    'focus': 'ambient',  // 'Focus' mood -> Ambient
    'romantic': 'love songs', // 'Romantic' mood -> Love Songs
    'hiphop': 'hip hop'
};

export const fetchStationsByTag = async (tag: string, limit: number = 40, quality: StreamQuality = 'standard'): Promise<RadioStation[]> => {
  const cacheKey = `tag_${tag}_${limit}_${quality}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  // Use mapped tag if available, otherwise use original
  const searchTag = TAG_MAPPINGS[tag] || tag;
  const encodedTag = encodeURIComponent(searchTag);

  try {
    // Increased limit to get more candidates before filtering
    const fetchLimit = Math.max(100, limit * 4); // Fetch way more to ensure we find enough matching the quality
    const urlParams = `limit=${fetchLimit}&order=votes&reverse=true&hidebroken=true&https=true`;
    const data = await fetchAcrossMirrorsWithRetries(`bytag/${encodedTag}`, urlParams);
    
    const filteredAndSliced = filterStations(data, quality).slice(0, limit);
    
    if (filteredAndSliced.length > 0) {
        setToCache(cacheKey, filteredAndSliced);
    }
    return filteredAndSliced;
  } catch (error) {
    console.error("Error fetching radio stations by tag:", error);
    throw error; 
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
        
        // Default standard filter for favorites
        const processedResults = filterStations(flatResults, 'standard');
        if (processedResults.length > 0) {
             setToCache(cacheKey, processedResults);
        }
        return processedResults;
    } catch (error) {
        console.error("Error fetching favorite stations by UUIDs:", error);
        throw error; 
    }
}

export const fetchStationsByGenre = fetchStationsByTag;
