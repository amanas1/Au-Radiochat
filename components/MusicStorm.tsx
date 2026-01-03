import React, { useRef, useEffect } from 'react';

interface MusicStormProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const MusicStorm: React.FC<MusicStormProps> = ({ analyserNode, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const particles = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const createParticle = () => {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 - 1.5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      };
    };

    const initParticles = () => {
      for (let i = 0; i < 100; i++) {
        particles.current.push(createParticle());
      }
    };
    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      
      let bassBoost = 0;
      if (analyserNode && isPlaying) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        const bassValue = (dataArray[2] + dataArray[3] + dataArray[4]) / 3;
        bassBoost = bassValue / 255;
      }

      particles.current.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.size = Math.max(0.1, p.size - 0.01);

        if (p.x > w || p.x < 0) p.speedX *= -1;
        if (p.y > h || p.y < 0) p.speedY *= -1;
        if (p.size <= 0.1) {
          Object.assign(p, createParticle());
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + bassBoost * 2), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [analyserNode, isPlaying]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20" />;
};

export default MusicStorm;