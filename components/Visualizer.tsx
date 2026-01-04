import React from 'react';

interface VisualizerProps {
  inputVolume: number; // 0-255
  outputVolume: number; // 0-255
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ inputVolume, outputVolume, isActive }) => {
  // Normalize volumes to 0-1 range for styling
  const inVol = Math.min(1, inputVolume / 50);
  const outVol = Math.min(1, outputVolume / 50);
  
  // Dynamic glow color based on who is talking
  const glowColor = outVol > 0.1 ? 'rgba(64, 224, 208, 0.8)' : 'rgba(255, 255, 255, 0.5)';
  const scale = 1 + (outVol * 0.5) + (inVol * 0.2);

  return (
    <div className={`relative flex items-center justify-center transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          boxShadow: `0 0 ${20 + outVol * 40}px ${glowColor}, inset 0 0 ${10 + inVol * 20}px ${glowColor}`,
          borderColor: outVol > 0.1 ? 'rgba(64, 224, 208, 0.8)' : 'rgba(255, 255, 255, 0.3)',
          transform: `scale(${scale})`
        }}
      >
        <div className="text-center">
          {outVol > 0.1 ? (
             <i className="fas fa-wave-square text-teal-400 text-2xl animate-pulse"></i>
          ) : (
             <i className="fas fa-microphone text-white/50 text-xl"></i>
          )}
        </div>
      </div>
      
      {/* Decorative orbital rings */}
      <div className="absolute w-40 h-40 rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
      <div className="absolute w-48 h-48 rounded-full border border-dashed border-white/5 animate-[spin_15s_linear_infinite_reverse]" />
    </div>
  );
};

export default Visualizer;
