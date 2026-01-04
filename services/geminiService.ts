
import { RadioStation } from '../types';

// AI capabilities have been removed to resolve Vercel deployment issues.
// These are stub functions to maintain type safety in the rest of the application.

export const isAiAvailable = (): boolean => {
  return false;
};

export const detectSpeechFromSpectrum = async (spectrum: number[]): Promise<boolean> => {
  return false;
};

export const optimizeStationList = async (stations: RadioStation[]): Promise<RadioStation[]> => {
  return stations;
};
