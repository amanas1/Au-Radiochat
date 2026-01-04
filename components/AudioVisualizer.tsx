
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
  const ringsRef = useRef<any[]>([]);
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
      if (!canvasRef.current) return;
      
      const width = canvas.width / (canvas.width / canvas.getBoundingClientRect().width);
      const height = canvas.height / (canvas.height / canvas.getBoundingClientRect().height);
      
      if (width <= 0 || height <= 0) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      canvas.style.opacity = String(settings.opacity);
      canvas.style.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hue}deg)`;

      const bufferLength = analyserNode?.frequencyBinCount || 128;
      
      if (dataArrayRef.current.length !== bufferLength) {
          dataArrayRef.current = new Uint8Array(bufferLength);
      }
      const dataArray = dataArrayRef.current;
      
      let hasData = false;
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        // Check if we actually have data (CORS check)
        for(let i=0; i<50; i++) { // Check first 50 bins
            if (dataArray[i] > 0) {
                hasData = true;
                break;
            }
        }
      }

      // SIMULATION FALLBACK: If playing but no data (likely CORS block), generate fake visual data
      const animationSpeed = settings.speed;
      const time = Date.now() / 1000 * animationSpeed;

      if (isPlaying && !hasData) {
          const bassSim = Math.abs(Math.sin(time * 4)) * 150 + 50;
          const midSim = Math.abs(Math.cos(time * 2)) * 100 + 20;
          const highSim = Math.abs(Math.sin(time * 8)) * 80;
          
          for(let i=0; i<bufferLength; i++) {
              let val = 0;
              if (i < bufferLength * 0.1) val = bassSim;
              else if (i < bufferLength * 0.5) val = midSim;
              else val = highSim;
              
              // Add noise
              val += Math.random() * 30;
              dataArray[i] = Math.min(255, val);
          }
      } else if (!isPlaying) {
          dataArray.fill(0);
      }

      // Reset state if variant changed
      if (lastVariantRef.current !== variant) {
        starsRef.current = [];
        particlesRef.current = [];
        ringsRef.current = [];
        lastVariantRef.current = variant;
      }

      const effectiveWidth = width * settings.scaleX;
      const offsetX = (width - effectiveWidth) / 2;
      const effectiveHeight = height * settings.scaleY;

      // ------------------------------------------------
      // VISUALIZER: GALAXY / JOURNEY / STAGE DANCER
      // ------------------------------------------------
      if (variant === 'galaxy' || variant === 'viz-journey' || variant === 'stage-dancer') {
          const starCount = isMobile ? 40 : (settings.performanceMode ? 60 : 100);
          
          if (starsRef.current.length === 0) {
             starsRef.current = Array.from({ length: starCount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                phase: Math.random() * Math.PI * 2,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5
             }));
          }

          const beat = dataArray[4] / 255; // Bass kick

          starsRef.current.forEach((s, i) => {
             // Movement
             if (variant === 'viz-journey') {
                 s.x -= (2 + beat * 5) * animationSpeed; // Starfield flight effect
                 if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
             } else {
                 s.x += s.vx * (1 + beat * 2);
                 s.y += s.vy * (1 + beat * 2);
                 // Wrap
                 if (s.x < 0) s.x = width;
                 if (s.x > width) s.x = 0;
                 if (s.y < 0) s.y = height;
                 if (s.y > height) s.y = 0;
             }

             const flicker = Math.sin(time * 5 + s.phase) * 0.5 + 0.5;
             const opacity = 0.2 + 0.8 * flicker + beat * 0.5;
             const freqIndex = Math.floor((i / starCount) * (bufferLength / 2));
             const freqVal = dataArray[freqIndex] / 255;
             
             ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, opacity)})`;
             
             // Galaxy has colorful stars based on frequency
             if (variant === 'galaxy') {
                 const hue = (freqIndex * 5 + time * 20) % 360;
                 ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${opacity})`;
             }

             ctx.beginPath();
             const pulseSize = s.size * (1 + freqVal * 2);
             ctx.arc(s.x, s.y, pulseSize, 0, Math.PI * 2);
             ctx.fill();
          });
      }

      // ------------------------------------------------
      // VISUALIZER: BUBBLES
      // ------------------------------------------------
      if (variant === 'bubbles') {
          const bubbleCount = isMobile ? 20 : 40;
          if (particlesRef.current.length < bubbleCount) {
              for (let i = 0; i < bubbleCount - particlesRef.current.length; i++) {
                  particlesRef.current.push({
                      x: Math.random() * width,
                      y: height + Math.random() * 100,
                      radius: Math.random() * 10 + 5,
                      speed: Math.random() * 2 + 1,
                      freqIndex: Math.floor(Math.random() * (bufferLength / 2))
                  });
              }
          }

          particlesRef.current.forEach(p => {
              const val = dataArray[p.freqIndex] / 255;
              p.y -= p.speed * (1 + val * 2) * animationSpeed;
              
              // Reset if off top
              if (p.y < -50) {
                  p.y = height + 50;
                  p.x = Math.random() * width;
              }

              const currentRadius = p.radius * (1 + val);
              ctx.beginPath();
              ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
              ctx.strokeStyle = `hsla(${p.freqIndex * 2}, 70%, 60%, ${0.3 + val * 0.7})`;
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.fillStyle = `hsla(${p.freqIndex * 2}, 70%, 60%, ${0.1 + val * 0.2})`;
              ctx.fill();
          });
      }

      // ------------------------------------------------
      // VISUALIZER: RINGS (Mixed Rings)
      // ------------------------------------------------
      if (variant === 'mixed-rings') {
          const centerX = width / 2;
          const centerY = height / 2;
          const maxRadius = Math.min(width, height) * 0.4;
          const ringCount = 10;

          ctx.lineWidth = 4 * settings.scaleY;

          for (let i = 0; i < ringCount; i++) {
              // Grab distinct frequencies for each ring
              const index = Math.floor((i / ringCount) * (bufferLength / 3)); 
              const val = dataArray[index] / 255;
              
              const radius = (i + 1) * (maxRadius / ringCount) + (val * 40 * settings.scaleX);
              const hue = (i * 30 + time * 50) % 360;
              const alpha = 0.3 + val * 0.7;

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
              ctx.stroke();
              
              // Optional fill for beat
              if (i === 0 && val > 0.5) {
                  ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.2)`;
                  ctx.fill();
              }
          }
      }

      // ------------------------------------------------
      // VISUALIZER: SEGMENTED & RAINBOW LINES (Bars)
      // ------------------------------------------------
      if (variant === 'segmented' || variant === 'rainbow-lines') {
        const barCount = isMobile ? 30 : (settings.performanceMode ? 64 : 128);
        const barWidth = effectiveWidth / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const percent = i / barCount;
          // Use a logarithmic scale for better frequency distribution
          // or simple linear mapping. Linear is usually enough for simple visuals.
          const index = Math.floor(percent * (bufferLength / 2)); 
          const value = dataArray[index] / 255;
          const barH = value * effectiveHeight;
          const x = offsetX + i * barWidth;
          const hue = (percent * 360 + time * 50) % 360;

          ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
          
          if (variant === 'segmented') {
             const segH = 4;
             const spacing = 2;
             const segs = Math.floor(barH / (segH + spacing));
             const cy = height / 2;
             for(let s=0; s<segs; s++) {
                 const yOffset = s * (segH + spacing);
                 ctx.fillRect(x, cy - yOffset - segH, barWidth - 1, segH);
                 ctx.fillRect(x, cy + yOffset, barWidth - 1, segH);
             }
          } else {
             // Rainbow Lines (Bottom aligned)
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
