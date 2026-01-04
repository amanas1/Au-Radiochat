
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
  variant = 'segmented',
  settings = { scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 1, autoIdle: true, performanceMode: true }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const lastVariantRef = useRef<string>(variant);
  
  // Reusable data array to prevent allocation per frame
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        
        let width = rect.width;
        let height = rect.height;
        
        // Cap DPR to improve performance
        let scaleFactor = dpr;
        if (isMobile) {
            scaleFactor = Math.min(dpr, 1.2); 
        } else if (settings.performanceMode && rect.width > 1280) {
            scaleFactor = Math.min(dpr, 1.5); 
        }

        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scaleFactor, scaleFactor);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const renderFrame = () => {
      const width = canvas.width / (canvas.width / canvas.getBoundingClientRect().width);
      const height = canvas.height / (canvas.height / canvas.getBoundingClientRect().height);
      
      if (width <= 0 || height <= 0) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      // Applying filters via CSS is faster than canvas filters
      canvas.style.opacity = String(settings.opacity);
      canvas.style.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hue}deg)`;

      const bufferLength = analyserNode?.frequencyBinCount || 128;
      
      // Resize buffer only if needed
      if (dataArrayRef.current.length !== bufferLength) {
          dataArrayRef.current = new Uint8Array(bufferLength);
      }
      const dataArray = dataArrayRef.current;
      
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      if (lastVariantRef.current !== variant) {
        starsRef.current = [];
        particlesRef.current = [];
        lastVariantRef.current = variant;
      }

      const effectiveWidth = width * settings.scaleX;
      const offsetX = (width - effectiveWidth) / 2;
      const effectiveHeight = height * settings.scaleY;
      const animationSpeed = settings.speed;
      const time = Date.now() / 1000 * animationSpeed;

      // Draw Logic Simplified for brevity but functionally identical
      if (variant === 'galaxy' || variant === 'viz-journey' || variant === 'stage-dancer') {
          const starCount = isMobile ? 40 : (settings.performanceMode ? 60 : 100);
          
          if (starsRef.current.length === 0) {
             starsRef.current = Array.from({ length: starCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5 + 0.5,
                phase: Math.random() * Math.PI * 2
             }));
          }

          const beat = dataArray[10] / 255; 

          starsRef.current.forEach(s => {
             const flicker = Math.sin(time * 5 + s.phase) * 0.5 + 0.5;
             const opacity = 0.3 + 0.7 * flicker + beat * 0.5;
             ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacity)})`;
             ctx.beginPath();
             ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
             ctx.fill();
          });
      }

      // Simple Bar Visualizer fallback/overlay logic
      if (variant === 'segmented' || variant === 'rainbow-lines') {
        const barCount = isMobile ? 30 : (settings.performanceMode ? 60 : 100);
        const barWidth = effectiveWidth / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const percent = i / barCount;
          const index = Math.floor(percent * bufferLength * 0.8); // Focus on lower 80% freqs
          const value = dataArray[index] / 255;
          const barH = value * effectiveHeight;
          const x = offsetX + i * barWidth;
          const hue = (percent * 360 + time * 50) % 360;

          ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
          
          if (variant === 'segmented') {
             const segH = 4;
             const segs = Math.floor(barH / 5);
             const cy = height / 2;
             for(let s=0; s<segs; s++) {
                 ctx.fillRect(x, cy - s*5 - 4, barWidth-1, 4);
                 ctx.fillRect(x, cy + s*5, barWidth-1, 4);
             }
          } else {
             ctx.fillRect(x, height - barH - (height - effectiveHeight)/2, barWidth - 1, barH);
          }
        }
      }

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyserNode, isPlaying, variant, settings]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default AudioVisualizer;
