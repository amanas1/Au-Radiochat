
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
        const maxRadius = Math.min(w, h) * 0.45;

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

        // Draw Concentric Rings (Screenshot Style)
        if (isPlaying) {
            const rings = 12;
            const time = Date.now() * 0.002;

            for (let i = 0; i < rings; i++) {
                // Map ring index to frequency data (low freqs in center, high outer)
                const dataIndex = Math.floor((i / rings) * (bufferLength / 2));
                const value = dataArray[dataIndex] / 255.0; // 0 to 1

                // Dynamic Radius
                const baseR = (i + 1) * (maxRadius / rings);
                const r = baseR + (value * 20); // Expand on beat

                // Dynamic Color
                const hue = (i * 20 - time * 50) % 360;
                const alpha = 0.3 + (value * 0.7);

                ctx.beginPath();
                ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
                
                // Stroke
                ctx.lineWidth = 2 + value * 3;
                ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
                ctx.stroke();

                // Subtle Fill for active rings
                if (value > 0.3) {
                    ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.1)`;
                    ctx.fill();
                }
            }

            // Central Core Pulse
            const bass = dataArray[2] / 255.0;
            ctx.beginPath();
            ctx.arc(cx, cy, maxRadius * 0.15 * (1 + bass), 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;

        } else {
            // Idle State - Subtle Breathing Rings
            const time = Date.now() * 0.002;
            for(let i=0; i<3; i++) {
                const r = (maxRadius * 0.3) + (i * 20) + Math.sin(time + i) * 5;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = color + '40';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
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
