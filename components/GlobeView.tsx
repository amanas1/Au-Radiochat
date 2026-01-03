
import React, { useRef, useEffect } from 'react';
import { COUNTRIES_DATA, TRANSLATIONS } from '../constants'; // Import Translations

interface GlobeViewProps {
  onSelectCountry: (country: string) => void;
  primaryColor: string;
  language?: string; // Optional language
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  phase: number;
}

interface Marker2D {
  name: string;
  x: number;
  y: number;
  r: number; // radius for hit testing
}

const GlobeView: React.FC<GlobeViewProps> = ({ onSelectCountry, primaryColor, language = 'en' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  const starsRef = useRef<Star[]>([]);
  const visibleMarkersRef = useRef<Marker2D[]>([]);
  const animationFrameId = useRef<number>(0);
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);
    
    // Init Stars
    if (starsRef.current.length === 0) {
        starsRef.current = Array.from({ length: 200 }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.2 + 0.3,
            opacity: Math.random(),
            speed: 0.005 + Math.random() * 0.015,
            phase: Math.random() * Math.PI * 2
        }));
    }

    // Pre-calculate normalized sphere points (radius 1)
    const points: { x: number, y: number, z: number }[] = [];
    for (let lat = -90; lat <= 90; lat += 6) {
      const phi = (lat * Math.PI) / 180;
      const r = Math.cos(phi);
      const y = Math.sin(phi);
      const circumference = 2 * Math.PI * r;
      const step = 360 / Math.max(1, Math.floor(circumference / 12)); 
      
      for (let lon = 0; lon < 360; lon += step) {
        const theta = (lon * Math.PI) / 180;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        points.push({ x, y, z });
      }
    }

    // Pre-calculate normalized markers
    const normMarkers = COUNTRIES_DATA.map(c => {
        const phi = (c.lat * Math.PI) / 180;
        const theta = ((c.lon - 90) * Math.PI) / 180;
        const y = Math.sin(phi);
        const r = Math.cos(phi);
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        return { x, y, z, name: c.name };
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isMobile = width < 768;
      // Optimize Globe Radius for Mobile
      const globeScale = isMobile ? 0.38 : 0.32; 
      const globeRadius = Math.min(width, height) * globeScale;

      // Auto rotation if not dragging
      if (!isDraggingRef.current) {
          rotationRef.current.y += 0.0015;
      }

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw Background Stars (Twinkling)
      const time = Date.now() * 0.002;
      starsRef.current.forEach(star => {
          // Sine wave for smooth sparkling
          const flicker = Math.sin(time * star.speed * 100 + star.phase);
          const opacity = 0.5 + 0.5 * flicker; 
          
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * star.opacity})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
      });

      // 2. Draw Moon (Optimized & Darkened)
      const moonR = globeRadius * (isMobile ? 0.18 : 0.15);
      // Position Moon based on screen size to keep it visible
      const moonDistX = isMobile ? width * 0.35 : width * 0.4;
      const moonDistY = isMobile ? height * 0.35 : height * 0.15;
      
      const moonX = cx - moonDistX;
      const moonY = cy - moonDistY;
      
      // Moon Glow (Subtle)
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(60, 70, 90, 0.3)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Moon Body (Dark Gradient)
      const moonGrad = ctx.createRadialGradient(moonX - moonR*0.3, moonY - moonR*0.3, moonR*0.1, moonX, moonY, moonR);
      moonGrad.addColorStop(0, '#4a5060'); // Highlight
      moonGrad.addColorStop(1, '#050505'); // Shadow
      
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Moon Landscapes (Craters)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Dark patches
      ctx.beginPath(); 
      ctx.ellipse(moonX - moonR*0.2, moonY + moonR*0.15, moonR*0.2, moonR*0.15, Math.PI/4, 0, Math.PI*2); 
      ctx.fill();
      ctx.beginPath(); 
      ctx.ellipse(moonX + moonR*0.3, moonY - moonR*0.2, moonR*0.15, moonR*0.12, -Math.PI/6, 0, Math.PI*2); 
      ctx.fill();
      ctx.beginPath(); 
      ctx.arc(moonX + moonR*0.1, moonY + moonR*0.4, moonR*0.08, 0, Math.PI*2); 
      ctx.fill();


      // 3. Draw Globe Body (Dark & Glassy)
      // Background fill to block stars behind
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 4, 10, 0.95)'; 
      ctx.fill();

      // Rim Light (No core glow)
      const rimGrad = ctx.createRadialGradient(cx, cy, globeRadius * 0.85, cx, cy, globeRadius);
      rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(1, 'rgba(80, 100, 200, 0.15)'); // Faint blue rim
      
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Edge Line
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // 4. Draw Grid Points
      points.forEach(p => {
        // 3D Rotation
        let x = p.x * Math.cos(rotationRef.current.y) - p.z * Math.sin(rotationRef.current.y);
        let z = p.x * Math.sin(rotationRef.current.y) + p.z * Math.cos(rotationRef.current.y);
        let y = p.y * Math.cos(rotationRef.current.x) - z * Math.sin(rotationRef.current.x);
        z = p.y * Math.sin(rotationRef.current.x) + z * Math.cos(rotationRef.current.x);

        // Scale by radius
        x *= globeRadius;
        y *= globeRadius;
        z *= globeRadius;

        const scale = 300 / (300 - z);
        
        if (z < globeRadius * 0.9) {
            ctx.beginPath();
            const alpha = z < 0 ? 0.3 : 0.05; 
            ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
            ctx.arc(cx + x, cy - y, 0.8 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      // 5. Draw Markers & Text
      visibleMarkersRef.current = []; 

      normMarkers.forEach(m => {
        let x = m.x * Math.cos(rotationRef.current.y) - m.z * Math.sin(rotationRef.current.y);
        let z = m.x * Math.sin(rotationRef.current.y) + m.z * Math.cos(rotationRef.current.y);
        let y = m.y * Math.cos(rotationRef.current.x) - z * Math.sin(rotationRef.current.x);
        z = m.y * Math.sin(rotationRef.current.x) + z * Math.cos(rotationRef.current.x);

        x *= globeRadius;
        y *= globeRadius;
        z *= globeRadius;

        if (z < 0) {
            const scale = 300 / (300 - z);
            const screenX = cx + x;
            const screenY = cy - y;

            visibleMarkersRef.current.push({
                name: m.name,
                x: screenX,
                y: screenY,
                r: 30 * scale 
            });
            
            // Marker
            ctx.beginPath();
            ctx.fillStyle = primaryColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = primaryColor;
            ctx.arc(screenX, screenY, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Stick
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX, screenY - 15 * scale);
            ctx.strokeStyle = `rgba(255,255,255,0.3)`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Text
            const fontSize = Math.max(9, 10 * scale);
            ctx.font = `500 ${fontSize}px "Plus Jakarta Sans"`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'center';
            ctx.fillText(m.name, screenX, screenY - 20 * scale);
        }
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start Loop
    animationFrameId.current = requestAnimationFrame(animate);

    const handleStart = (clientX: number, clientY: number) => {
        lastMouseRef.current = { x: clientX, y: clientY };
        dragStartRef.current = { x: clientX, y: clientY };
        isDraggingRef.current = true;
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDraggingRef.current) return;
        const dx = clientX - lastMouseRef.current.x;
        const dy = clientY - lastMouseRef.current.y;
        rotationRef.current.y += dx * 0.005;
        rotationRef.current.x += dy * 0.005;
        lastMouseRef.current = { x: clientX, y: clientY };
    };

    const handleEnd = (clientX: number, clientY: number) => {
        isDraggingRef.current = false;
        const dist = Math.sqrt(
            Math.pow(clientX - dragStartRef.current.x, 2) + 
            Math.pow(clientY - dragStartRef.current.y, 2)
        );

        if (dist < 5) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (clientX - rect.left) * (canvas.width / rect.width);
            const mouseY = (clientY - rect.top) * (canvas.height / rect.height);

            for (let i = visibleMarkersRef.current.length - 1; i >= 0; i--) {
                const m = visibleMarkersRef.current[i];
                const dx = mouseX - m.x;
                const dy = mouseY - (m.y - 15);
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < 30) { 
                    onSelectCountry(m.name);
                    break;
                }
            }
        }
    };

    // Mouse Events
    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);

    // Touch Events
    const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            e.preventDefault(); // Prevent scrolling
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    const onTouchEnd = (e: TouchEvent) => {
        handleEnd(lastMouseRef.current.x, lastMouseRef.current.y); // Use last known pos
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    const resize = () => {
        width = (canvas.width = canvas.parentElement?.clientWidth || 800);
        height = (canvas.height = canvas.parentElement?.clientHeight || 600);
        starsRef.current = []; // Re-init stars on resize to cover new area
    }
    window.addEventListener('resize', resize);

    return () => {
        // FIX: Correctly cancel the animation loop using ref
        cancelAnimationFrame(animationFrameId.current);
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('resize', resize);
    };
  }, [primaryColor, onSelectCountry]);

  return (
    <div className="w-full h-full relative animate-in fade-in zoom-in duration-700">
        <canvas ref={canvasRef} className="w-full h-full cursor-move" />
        <div className="absolute bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full text-xs text-white/70 pointer-events-none border border-white/10 whitespace-nowrap">
            {t.dragRotate}
        </div>
    </div>
  );
};

export default GlobeView;
