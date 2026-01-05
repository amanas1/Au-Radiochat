
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
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const scale = Math.min(w, h) / 200;
      const cx = w / 2;
      const cy = h / 2 + (15 * scale);

      let bass = 0;
      if (analyserNode && isPlaying) {
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(data);
        bass = (data[0] + data[1] + data[2]) / (3 * 255);
      }

      const time = Date.now() * 0.005;
      const bounce = isPlaying ? Math.sin(time * 5) * bass * 15 * scale : 0;
      const bodyY = cy + bounce;

      ctx.lineCap = 'round';
      ctx.lineWidth = 6 * scale;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Stickman Skeleton
      // Head
      ctx.beginPath();
      ctx.arc(cx, bodyY - 60 * scale, 12 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.moveTo(cx, bodyY - 48 * scale);
      ctx.lineTo(cx, bodyY);
      ctx.stroke();

      // Arms
      const armWave = isPlaying ? Math.sin(time * 3) * bass * 40 * scale : 0;
      ctx.beginPath();
      ctx.moveTo(cx, bodyY - 40 * scale);
      ctx.lineTo(cx - 30 * scale, bodyY - 20 * scale - armWave);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, bodyY - 40 * scale);
      ctx.lineTo(cx + 30 * scale, bodyY - 20 * scale + armWave);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(cx, bodyY);
      ctx.lineTo(cx - 15 * scale, bodyY + 35 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, bodyY);
      ctx.lineTo(cx + 15 * scale, bodyY + 35 * scale);
      ctx.stroke();

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
