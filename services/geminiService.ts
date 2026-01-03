
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RadioStation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const isAiAvailable = (): boolean => {
  return !!process.env.API_KEY;
};

export const detectSpeechFromSpectrum = async (spectrum: number[]): Promise<boolean> => {
  if (!isAiAvailable()) return false;

  // Reduce data size for API call (take every 4th bin, limit to first 100 bins which cover most speech freqs)
  // Spectrum usually 128 or 256 bins.
  const sampledData = spectrum.slice(0, 100).filter((_, i) => i % 4 === 0);
  const dataStr = JSON.stringify(sampledData);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this audio spectrum array (0-255 amplitude values for frequency bands): ${dataStr}. 
      Detect if this pattern likely represents spoken word (Human Speech, News, Ads) vs Music.
      Speech usually has dynamic range in mid-freqs and pauses. Music is often more continuous or rhythmic.
      Return JSON: { "isSpeech": boolean }`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
        const result = JSON.parse(response.text);
        return result.isSpeech === true;
    }
    return false;
  } catch (e) {
    console.error("Gemini Speech Detection Failed:", e);
    return false;
  }
};

export const optimizeStationList = async (stations: RadioStation[]): Promise<RadioStation[]> => {
  if (!isAiAvailable() || stations.length === 0) return stations;

  // Prepare a lightweight representation of stations
  const inputList = stations.slice(0, 50).map(s => ({
      id: s.stationuuid,
      name: s.name,
      tags: s.tags,
      votes: s.votes
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Radio Curator. 
      Reorder this list of radio stations to create an optimal listening flow.
      Rules:
      1. Prioritize high-quality stations (votes).
      2. Ensure good variety in genres/tags flow.
      3. Remove duplicates or stations that look broken/test based on metadata.
      
      Input: ${JSON.stringify(inputList)}
      
      Return a JSON object with the ordered list of IDs: { "orderedIds": ["id1", "id2", ...] }`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
        const result = JSON.parse(response.text);
        if (result.orderedIds && Array.isArray(result.orderedIds)) {
            const optimized: RadioStation[] = [];
            const stationMap = new Map(stations.map(s => [s.stationuuid, s]));
            
            result.orderedIds.forEach((id: string) => {
                const s = stationMap.get(id);
                if (s) optimized.push(s);
            });
            
            return optimized.length > 0 ? optimized : stations;
        }
    }
    return stations;
  } catch (e) {
    console.error("Gemini Station Optimization Failed:", e);
    return stations;
  }
};
