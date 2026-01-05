
import React, { useEffect, useRef } from 'react';
import { VisualizerVariant, VisualizerSettings } from '../types';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  variant?: VisualizerVariant;
  settings?: VisualizerSettings;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyserNode, 
  isPlaying, 
  variant = 'galaxy',
  settings
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      if (analyserNode) {
        if (!dataArrayRef.current) dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArrayRef.current);
      }

      const data = dataArrayRef.current || new Uint8Array(128).fill(0);
      const intensity = isPlaying ? 1 : 0.2;
      const time = Date.now() * 0.001;

      if (variant === 'galaxy') {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        for (let i = 0; i < 80; i++) {
          const val = data[i % 32] / 255;
          const angle = (i / 80) * Math.PI * 2 + time * 0.2;
          const r = (h * 0.2) + (val * 100 * intensity);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(i * 10 + time * 20) % 360}, 70%, 70%, ${0.3 * intensity})`;
          ctx.fill();
        }
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyserNode, isPlaying, variant, settings]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default AudioVisualizer;
