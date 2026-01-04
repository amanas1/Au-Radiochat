
import { Track } from '../types';

// Expanded Library of Royalty-Free Music (No API Key required)
const MUSIC_LIBRARY: Track[] = [
  // --- LOFI / CHILL ---
  {
    id: 'lofi_1',
    title: 'Study Session',
    artist: 'Lofi Geek',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&q=80',
    duration: 145,
    tags: ['chill', 'lofi', 'focus']
  },
  {
    id: 'lofi_2',
    title: 'Midnight Rain',
    artist: 'Purrple Cat',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_65b327b87c.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?w=400&q=80',
    duration: 160,
    tags: ['chill', 'sleep', 'ambient']
  },
  {
    id: 'lofi_3',
    title: 'Empty Street',
    artist: 'Ghostdrifter',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_199327f524.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1555685812-4b943f3e99a0?w=400&q=80',
    duration: 210,
    tags: ['chill', 'sad']
  },
  {
    id: 'lofi_4',
    title: 'Coffee Break',
    artist: 'FASSounds',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_22396b2707.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80',
    duration: 130,
    tags: ['chill', 'morning']
  },

  // --- ENERGY / ROCK / PHONK ---
  {
    id: 'rock_1',
    title: 'Cyberpunk City',
    artist: 'Scanner',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_5b353a290d.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400&q=80',
    duration: 180,
    tags: ['energy', 'electronic', 'rock']
  },
  {
    id: 'phonk_1',
    title: 'Drift King',
    artist: 'PhonkMaster',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2023/04/12/audio_3a93a6d95b.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1605218427360-6961d90784d8?w=400&q=80',
    duration: 145,
    tags: ['energy', 'phonk', 'gym']
  },
  {
    id: 'rock_2',
    title: 'Hard Metal',
    artist: 'Strength',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    duration: 200,
    tags: ['rock', 'energy', 'workout']
  },
  {
    id: 'energy_2',
    title: 'Summer Party',
    artist: 'Alisis',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/05/audio_13b47f4350.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&q=80',
    duration: 130,
    tags: ['pop', 'energy', 'party']
  },

  // --- AMBIENT / CINEMATIC ---
  {
    id: 'amb_1',
    title: 'Mountain Path',
    artist: 'Magnetic',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_9e33df569b.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    duration: 180,
    tags: ['acoustic', 'folk', 'calm']
  },
  {
    id: 'amb_2',
    title: 'Deep Space',
    artist: 'Cosmos',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_a7e2392746.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    duration: 300,
    tags: ['ambient', 'space', 'focus']
  },
  {
    id: 'cin_1',
    title: 'Epic Trailer',
    artist: 'Hans',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
    duration: 150,
    tags: ['cinematic', 'epic']
  },
  
  // --- JAZZ / CLASSIC ---
  {
    id: 'jazz_1',
    title: 'Smooth Sax',
    artist: 'Noir',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/31/audio_0f865f6534.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&q=80',
    duration: 190,
    tags: ['jazz', 'relax']
  },
  {
    id: 'piano_1',
    title: 'Emotional Piano',
    artist: 'Keys',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/22/audio_9678125699.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80',
    duration: 240,
    tags: ['classical', 'sad', 'piano']
  },
  {
    id: 'jazz_2',
    title: 'Night Club',
    artist: 'Quartet',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/06/15/audio_2013e6e66f.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&q=80',
    duration: 210,
    tags: ['jazz', 'party']
  }
];

// Helper to shuffle array
const shuffle = (array: Track[]) => {
    return array.sort(() => Math.random() - 0.5);
};

export const fetchTracks = async (query: string = '', offset: number = 0): Promise<Track[]> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 300));

  const lowerQuery = query.toLowerCase().trim();
  let results = MUSIC_LIBRARY;

  // Filter
  if (lowerQuery) {
      results = MUSIC_LIBRARY.filter(t => 
          t.title.toLowerCase().includes(lowerQuery) || 
          t.artist.toLowerCase().includes(lowerQuery) ||
          t.tags.some(tag => tag.includes(lowerQuery))
      );
  }

  // Infinite Scroll Simulation:
  // If we run out of tracks in the base library, we "generate" new ones by 
  // shuffling the existing ones and giving them unique IDs.
  if (results.length > 0) {
      // Return a chunk based on offset
      // Since we want "infinite", if the offset exceeds library length, we wrap around with new IDs
      
      const pageSize = 10;
      const startIndex = offset % results.length;
      
      // Get base tracks
      let chunk = results.slice(startIndex, startIndex + pageSize);
      
      // If chunk is smaller than page size (wrapped around), fill from beginning
      if (chunk.length < pageSize) {
          chunk = [...chunk, ...results.slice(0, pageSize - chunk.length)];
      }

      // Add Salt to ID to make them unique keys in React list
      return chunk.map(t => ({
          ...t,
          id: `${t.id}_${Date.now()}_${Math.random().toString(36).substr(2,5)}`
      }));
  }

  return [];
};
