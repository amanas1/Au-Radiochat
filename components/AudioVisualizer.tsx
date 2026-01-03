
import React, { useEffect, useRef } from 'react';
import { VisualizerVariant, VisualizerSettings } from '../types';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  variant?: VisualizerVariant;
  settings?: VisualizerSettings;
}

interface CelestialObject {
  id: number;
  type: 'planet' | 'star' | 'nebula' | 'galaxy';
  name?: string;
  x: number;
  y: number;
  z: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  angle: number;
  rotationSpeed: number;
  hasRings?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyserNode, 
  isPlaying, 
  variant = 'segmented',
  settings = { scaleX: 1, scaleY: 1, brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 1, speed: 1, autoIdle: true, performanceMode: true }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const starsRef = useRef<any[]>([]);
  const journeyObjectsRef = useRef<CelestialObject[]>([]);
  const lastVariantRef = useRef<string>(variant);
  
  const smoothedLowRef = useRef(0);
  const smoothedMidRef = useRef(0);
  const smoothedHighRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // --- OPTIMIZATION: Mobile Detection ---
    const isMobile = window.innerWidth < 768;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        
        let width = rect.width;
        let height = rect.height;
        
        // --- CRITICAL OPTIMIZATION FOR CRACKLING ---
        // On mobile, high DPR (3x) kills performance causing audio glitches.
        // We cap DPR to 1.2 on mobile to free up CPU for the Audio Thread.
        let scaleFactor = dpr;
        if (isMobile) {
            scaleFactor = Math.min(dpr, 1.2); 
        } else if (settings.performanceMode && rect.width > 1280) {
            scaleFactor = Math.min(dpr, 1.25); 
        }

        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scaleFactor, scaleFactor);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const renderFrame = () => {
      // Use client dimensions to ensure we draw correctly regardless of internal resolution
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
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      }

      if (lastVariantRef.current !== variant) {
        particlesRef.current = [];
        starsRef.current = [];
        journeyObjectsRef.current = [];
        lastVariantRef.current = variant;
      }

      const effectiveWidth = width * settings.scaleX;
      const offsetX = (width - effectiveWidth) / 2;
      const effectiveHeight = height * settings.scaleY;
      const offsetY = (height - effectiveHeight) / 2;
      const animationSpeed = settings.speed;

      const low = isPlaying ? (dataArray[4] || 0) : 0; 
      const mid = isPlaying ? (dataArray[25] || 0) : 0; 
      const high = isPlaying ? (dataArray[120] || 0) : 0;
      
      const lerpFactor = 0.12;
      smoothedLowRef.current += (low - smoothedLowRef.current) * lerpFactor;
      smoothedMidRef.current += (mid - smoothedMidRef.current) * lerpFactor;
      smoothedHighRef.current += (high - smoothedHighRef.current) * lerpFactor;
      
      const sLow = smoothedLowRef.current;
      const sMid = smoothedMidRef.current;
      const sHigh = smoothedHighRef.current;
      
      const beatVal = sLow / 255;
      const intensity = dataArray.reduce((a,b)=>a+b,0) / (bufferLength || 1); 
      const time = Date.now() / 1000 * animationSpeed;

      const drawStars = (count: number, syncToBeat: boolean) => {
        // Reduce star count on mobile to save CPU cycles
        const finalCount = isMobile ? Math.floor(count * 0.5) : count;

        if (starsRef.current.length === 0) {
          starsRef.current = Array.from({ length: finalCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2.0 + 0.5,
            phase: Math.random() * Math.PI * 2,
            isBeacon: Math.random() > 0.85
          }));
        }
        starsRef.current.forEach(s => {
          // Enhanced twinkling: faster and more contrasty
          const flicker = Math.sin(time * 6 + s.phase) * 0.5 + 0.5;
          let musicBoost = syncToBeat ? beatVal * 2.5 : beatVal * 0.5;
          if (s.isBeacon && isPlaying) musicBoost *= 3.0;
          
          const finalOpacity = Math.min(1, (0.1 + musicBoost) * flicker);
          const finalSize = s.size * (1 + beatVal * (s.isBeacon ? 2.0 : 1.2));

          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, finalSize, 0, Math.PI * 2);
          ctx.fill();
          
          if (s.isBeacon && finalOpacity > 0.3 && !isMobile) {
             ctx.shadowBlur = 15 * beatVal;
             ctx.shadowColor = 'white';
             ctx.fill();
             ctx.shadowBlur = 0;
          }
        });
      };

      const drawDancer = (x: number, y: number, dancerScale: number, style: number, settings: VisualizerSettings) => {
        const armIntensity = settings.danceArmIntensity ?? 1.0;
        const legIntensity = settings.danceLegIntensity ?? 1.0;
        const headIntensity = settings.danceHeadIntensity ?? 1.0;

        let bounce = 0;
        let hipSway = 0;
        let headWobble = 0;
        let shoulderXMod = 0;
        let armWaveL = 0;
        let armWaveR = 0;
        let stompL = 0;
        let stompR = 0;

        if (style === 1) { 
          // Smoother Main Dancer
          bounce = (sLow / 255) * 30 * dancerScale; // Reduced bounce amplitude slightly
          hipSway = Math.sin(time * 4) * 25 * dancerScale; // Slower sway, slightly wider
          
          // Head wobbles less violently. 
          // Use sMid for a more rhythmic head nod rather than sHigh jitter
          headWobble = Math.sin(time * 4) * (sMid / 255) * 10 * dancerScale; 
          
          armWaveL = Math.sin(time * 6) * (sMid / 255) * 80 * dancerScale; // Slower arms
          armWaveR = Math.sin(time * 6 + Math.PI) * (sMid / 255) * 80 * dancerScale;
          
          stompL = Math.max(0, Math.sin(time * 4)) * (sLow / 255) * 35 * dancerScale;
          stompR = Math.max(0, Math.sin(time * 4 + Math.PI)) * (sLow / 255) * 35 * dancerScale;
        } else if (style === 2) {
          bounce = (sMid / 255) * 30 * dancerScale;
          hipSway = Math.sin(time * 2) * 40 * dancerScale;
          headWobble = Math.sin(time * 4) * 15 * dancerScale;
          shoulderXMod = Math.sin(time * 3) * 15 * dancerScale;
          armWaveL = Math.sin(time * 4) * 60 * dancerScale;
          armWaveR = Math.sin(time * 4 + Math.PI) * 60 * dancerScale;
          stompL = Math.abs(Math.sin(time * 2)) * 20 * dancerScale;
          stompR = Math.abs(Math.cos(time * 2)) * 20 * dancerScale;
        } else {
          const stepTime = Math.floor(time * 4) % 4;
          bounce = stepTime % 2 === 0 ? 15 * dancerScale : 0;
          hipSway = stepTime === 1 ? 20 * dancerScale : stepTime === 3 ? -20 * dancerScale : 0;
          headWobble = (sHigh / 255) > 0.5 ? (Math.random()-0.5)*20*dancerScale : 0;
          armWaveL = stepTime === 0 ? -60 * dancerScale : 0;
          armWaveR = stepTime === 2 ? 60 * dancerScale : 0;
          stompL = stepTime === 1 ? 30 * dancerScale : 0;
          stompR = stepTime === 3 ? 30 * dancerScale : 0;
        }

        bounce *= legIntensity;
        stompL *= legIntensity;
        stompR *= legIntensity;
        armWaveL *= armIntensity;
        armWaveR *= armIntensity;
        headWobble *= headIntensity;

        const hipY = y - 100 * dancerScale - bounce;
        const hipX = x + hipSway;
        const shoulderY = hipY - 80 * dancerScale;
        const shoulderX = hipX + shoulderXMod;
        const headY = shoulderY - 30 * dancerScale;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8 * dancerScale;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x - 30 * dancerScale, y - stompL);
        ctx.lineTo(hipX - 20 * dancerScale, y - 50 * dancerScale - bounce * 0.5);
        ctx.lineTo(hipX, hipY);
        ctx.lineTo(hipX + 20 * dancerScale, y - 50 * dancerScale - bounce * 0.5);
        ctx.lineTo(x + 30 * dancerScale, y - stompR);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(shoulderX, shoulderY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        const lElbowX = shoulderX - 50 * dancerScale;
        const lElbowY = shoulderY + armWaveL;
        ctx.lineTo(lElbowX, lElbowY);
        ctx.lineTo(lElbowX - 30 * dancerScale, lElbowY - 20 * dancerScale);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        const rElbowX = shoulderX + 50 * dancerScale;
        const rElbowY = shoulderY + armWaveR;
        ctx.lineTo(rElbowX, rElbowY);
        ctx.lineTo(rElbowX + 30 * dancerScale, rElbowY - 20 * dancerScale);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(shoulderX + headWobble, headY, 25 * dancerScale, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(shoulderX + headWobble - 8*dancerScale, headY - 4*dancerScale, 3*dancerScale, 0, Math.PI*2);
        ctx.arc(shoulderX + headWobble + 8*dancerScale, headY - 4*dancerScale, 3*dancerScale, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(shoulderX + headWobble - 8*dancerScale, headY + 8*dancerScale);
        ctx.lineTo(shoulderX + headWobble + 8*dancerScale, headY + 8*dancerScale);
        ctx.stroke();
      };

      if (variant === 'stage-dancer') {
        drawStars(settings.performanceMode ? 60 : 120, true);
        
        // Floor moved up to 85% for visibility on mobile
        const floorY = height * 0.85; 
        const grd = ctx.createLinearGradient(0, height, 0, floorY);
        grd.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        // Fill from floor down
        ctx.fillRect(0, floorY, width, height - floorY);
        
        drawDancer(width/2, floorY, Math.min(width, height)/450, 1, settings);

      } else if (variant === 'trio-dancers') {
        drawStars(settings.performanceMode ? 80 : 160, true);
        
        // Floor moved up to 85% for visibility on mobile
        const floorY = height * 0.85;
        const grd = ctx.createLinearGradient(0, height, 0, floorY);
        grd.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, floorY, width, height - floorY);

        const dScale = Math.min(width, height) / 550;
        const spacing = width * 0.25;
        
        drawDancer(width/2 - spacing, floorY, dScale, 3, settings);
        drawDancer(width/2 + spacing, floorY, dScale, 2, settings);
        drawDancer(width/2, floorY, dScale * 1.1, 1, settings);

      } else if (variant === 'galaxy') {
        const centerX = width / 2;
        const centerY = height / 2;
        const bass = (dataArray[10] || 0) / 255;
        const treble = (dataArray[200] || 0) / 255;
        
        // REDUCE COUNTS FOR MOBILE
        let starCount = settings.performanceMode ? 80 : 150;
        let particleCount = settings.performanceMode ? 60 : 100;
        if (isMobile) {
            starCount = 50;
            particleCount = 40;
        }

        if (starsRef.current.length === 0) {
          starsRef.current = Array.from({ length: starCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.5,
          }));
        }
        starsRef.current.forEach(s => {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        if (particlesRef.current.length === 0) {
            particlesRef.current = Array.from({ length: particleCount }, () => ({
              angle: Math.random() * Math.PI * 2,
              distance: Math.random() * 500,
              speed: 0.5 + Math.random() * 2,
              size: 2 + Math.random() * 4,
              hue: Math.random() * 360
            }));
        }
        particlesRef.current.forEach(p => {
          if (isPlaying) {
             p.distance += p.speed * (1 + bass * 2) * animationSpeed;
             if (p.distance > 800) p.distance = 0;
          }
          const px = centerX + Math.cos(p.angle) * p.distance * settings.scaleX;
          const py = centerY + Math.sin(p.angle) * p.distance * settings.scaleY;
          ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${1 - p.distance/800})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 + treble), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (variant === 'viz-journey') {
        // --- ENHANCED UNIVERSAL JOURNEY VISUALIZER ---
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Dynamic deep field twinkling stars
        drawStars(settings.performanceMode ? 60 : 120, true);

        if (journeyObjectsRef.current.length === 0) {
          // Reduce objects on mobile
          const objCount = isMobile ? 15 : (settings.performanceMode ? 20 : 35);
          
          const createObj = (index: number): CelestialObject => {
            const isSolar = index < 10;
            const types: ('planet' | 'star' | 'nebula' | 'galaxy')[] = ['planet', 'star', 'nebula', 'galaxy'];
            const type = isSolar ? 'planet' : types[Math.floor(Math.random() * types.length)];
            
            return {
              id: index,
              type,
              x: (Math.random() - 0.5) * 120,
              y: (Math.random() - 0.5) * 120,
              z: 1 + Math.random() * 4,
              size: type === 'galaxy' || type === 'nebula' ? 50 + Math.random() * 50 : 15 + Math.random() * 25,
              hue: Math.random() * 360,
              saturation: 80 + Math.random() * 20, // Higher saturation for "vividness"
              lightness: 50 + Math.random() * 20,
              angle: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.03,
              hasRings: type === 'planet' && Math.random() > 0.6
            };
          };
          journeyObjectsRef.current = Array.from({ length: objCount }, (_, i) => createObj(i));
        }

        journeyObjectsRef.current.forEach(obj => {
          if (isPlaying) {
            obj.z -= 0.012 * animationSpeed * (1 + beatVal * 2.5);
            if (obj.z < 0.05) {
              obj.z = 4.5;
              obj.x = (Math.random() - 0.5) * 120;
              obj.y = (Math.random() - 0.5) * 120;
              obj.hue = Math.random() * 360;
            }
          }

          const perspectiveScale = 1 / obj.z;
          const drawX = centerX + obj.x * perspectiveScale * settings.scaleX * 12;
          const drawY = centerY + obj.y * perspectiveScale * settings.scaleY * 12;
          const drawSize = obj.size * perspectiveScale;
          const opacity = Math.min(1, perspectiveScale * 0.8);

          if (drawX < -drawSize * 3 || drawX > width + drawSize * 3 || drawY < -drawSize * 3 || drawY > height + drawSize * 3) return;

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(time * obj.rotationSpeed);
          ctx.globalAlpha = opacity;

          if (obj.type === 'planet') {
            // Enhanced planet rendering with sharper contrast
            const grd = ctx.createRadialGradient(-drawSize*0.4, -drawSize*0.4, 0, 0, 0, drawSize);
            grd.addColorStop(0, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness + 30}%, 1)`);
            grd.addColorStop(0.5, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness}%, 1)`);
            grd.addColorStop(0.8, `hsla(${obj.hue}, ${obj.saturation}%, ${obj.lightness - 30}%, 1)`);
            grd.addColorStop(1, '#000'); // Deeper shadows for contrast
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
            ctx.fill();

            if (obj.hasRings) {
               ctx.strokeStyle = `hsla(${obj.hue}, 60%, 75%, 0.5)`;
               ctx.lineWidth = drawSize * 0.18;
               ctx.beginPath();
               ctx.ellipse(0, 0, drawSize * 2.0, drawSize * 0.5, Math.PI/6, 0, Math.PI * 2);
               ctx.stroke();
            }
          } else if (obj.type === 'star') {
            // Enhanced star flickering and glow
            const flicker = Math.sin(time * 12 + obj.id) * 0.4 + 0.6;
            const starFlare = (beatVal * 3 + flicker) * drawSize * 1.0;
            
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, drawSize + starFlare);
            grd.addColorStop(0, '#fff');
            grd.addColorStop(0.1, `hsla(${obj.hue}, 100%, 85%, 0.9)`);
            grd.addColorStop(0.4, `hsla(${obj.hue}, 100%, 70%, 0.4)`);
            grd.addColorStop(1, 'transparent');
            
            if (!isMobile) {
                ctx.shadowBlur = 20 * beatVal * flicker;
                ctx.shadowColor = `hsla(${obj.hue}, 100%, 70%, 1)`;
            }
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize + starFlare, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (obj.type === 'nebula') {
            // Enhanced nebula saturation
            const glow = (intensity / 255) * drawSize * 1.5;
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, drawSize + glow);
            grd.addColorStop(0, `hsla(${obj.hue}, 90%, 50%, 0.5)`);
            grd.addColorStop(0.7, `hsla(${(obj.hue + 60)%360}, 80%, 40%, 0.2)`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize + glow, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.type === 'galaxy') {
            // Enhanced galaxy vividness
            const armCount = isMobile ? 3 : 6; // Less drawing on mobile
            for (let j = 0; j < armCount; j++) {
              ctx.rotate(Math.PI / (armCount/2));
              const armLen = drawSize * (1 + beatVal * 1.2);
              const grd = ctx.createRadialGradient(armLen, 0, 0, armLen, 0, drawSize * 0.6);
              grd.addColorStop(0, `hsla(${(obj.hue + j * 30)%360}, 90%, 65%, 0.7)`);
              grd.addColorStop(1, 'transparent');
              ctx.fillStyle = grd;
              ctx.beginPath();
              ctx.ellipse(armLen, 0, drawSize * 1.2, drawSize * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        });

      } else if (variant === 'mixed-rings') {
        const ringCount = isMobile ? 5 : (settings.performanceMode ? 6 : 10);
        const centerX = width / 2;
        const centerY = height / 2;
        const timeShift = Date.now() / 1000 * animationSpeed;
        for (let i = 0; i < ringCount; i++) {
          const val = (dataArray[i * 20] || 0) / 255;
          const pulse = isPlaying ? Math.sin(timeShift + i) * 10 : 0;
          const radius = (40 + i * 30 + pulse) * (1 + val * 0.5);
          ctx.strokeStyle = `hsla(${(i/ringCount)*360 + (isPlaying ? timeShift * 20 : 0)}, 70%, 50%, 0.6)`;
          ctx.lineWidth = settings.performanceMode ? (3 + val * 6) : (4 + val * 10);
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radius * settings.scaleX, radius * settings.scaleY, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (variant === 'bubbles') {
        const bubbleCount = isMobile ? 15 : (settings.performanceMode ? 25 : 50);
        if (particlesRef.current.length === 0) {
          particlesRef.current = Array.from({ length: bubbleCount }, () => ({
            x: Math.random() * width,
            y: height + Math.random() * 100,
            radius: 5 + Math.random() * 15,
            speed: 1 + Math.random() * 3
          }));
        }
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        particlesRef.current.forEach(p => {
          if (isPlaying) {
             p.y -= p.speed * (1 + avg/100) * animationSpeed;
             if (p.y < -50) p.y = height + 50;
          }
          ctx.fillStyle = `hsla(${(p.x/width)*360}, 60%, 70%, 0.4)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (1 + avg/150), 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        const barCount = isMobile ? 40 : (settings.performanceMode ? 80 : 120);
        const barWidth = effectiveWidth / barCount;
        const timeShift = Date.now() / 100 * animationSpeed;
        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor((i / barCount) * bufferLength * 0.8);
          const intensityVal = (dataArray[freqIndex] || 0) / 255;
          const barHeight = intensityVal * effectiveHeight;
          const x = offsetX + (i * barWidth);
          const hue = (i / barCount) * 360 + (isPlaying ? timeShift : 0);
          if (variant === 'segmented') {
            const centerY = height / 2;
            const segH = 4;
            const segG = 1;
            const count = Math.floor(barHeight / (segH + segG));
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 1)`;
            for(let s=0; s<count; s++) {
              ctx.fillRect(x, centerY - s*(segH+segG) - segH, barWidth - 1, segH);
              ctx.fillRect(x, centerY + s*(segH+segG), barWidth - 1, segH);
            }
          } else {
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
            ctx.fillRect(x, height - barHeight - (height - effectiveHeight)/2, barWidth - 1, barHeight);
          }
        }
      }

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
    };
  }, [analyserNode, isPlaying, variant, settings]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default AudioVisualizer;
