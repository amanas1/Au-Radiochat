
import React, { useEffect, useRef } from 'react';

interface CardVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  color?: string;
}

const CardVisualizer: React.FC<CardVisualizerProps> = ({ analyserNode, isPlaying, color = '#bc6ff1' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        if(canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
        if (!ctx || !canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.35;

        // Visual simulation data if no real audio
        let bufferLength = 64;
        let dataArray = new Uint8Array(bufferLength);
        
        if (analyserNode && isPlaying) {
            bufferLength = analyserNode.frequencyBinCount;
            const fullData = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(fullData);
            
            // Downsample for visual clarity in small card
            const step = Math.floor(bufferLength / 64);
            dataArray = new Uint8Array(64);
            for(let i=0; i<64; i++) {
                dataArray[i] = fullData[i * step];
            }
            bufferLength = 64;
        } else if (isPlaying) {
            // Simulated data
            const time = Date.now() * 0.005;
            for(let i=0; i<bufferLength; i++) {
                const val = Math.abs(Math.sin(time + i * 0.2)) * 150 + 50;
                dataArray[i] = val;
            }
        }

        // Draw Circular Wave
        if (isPlaying) {
            ctx.beginPath();
            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i] / 255.0;
                const angle = (i / bufferLength) * Math.PI * 2;
                // Double mirrored loop
                const r = radius + (value * radius * 0.5);
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color;
            ctx.stroke();
            
            // Inner Fill
            ctx.fillStyle = color + '33'; // 20% opacity
            ctx.fill();
            
            // Central Pulse
            const bass = dataArray[4] / 255.0;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.5 * (1 + bass * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            // Idle State - Pulsing Circle
            const time = Date.now() * 0.002;
            const pulse = 1 + Math.sin(time) * 0.05;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = color + '80';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [analyserNode, isPlaying, color]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default CardVisualizer;
