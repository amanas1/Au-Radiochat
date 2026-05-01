import React, { useEffect, useRef } from 'react';

interface CardVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  color?: string;
  expandLastRing?: boolean;
}

const RING_COUNT = 18;

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
};

const CardVisualizer: React.FC<CardVisualizerProps> = ({ analyserNode, isPlaying, color = '#bc6ff1', expandLastRing = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.22;
      const burstRadius = Math.min(width, height) * 0.58;
      const baseRadius = Math.min(width, height) * 0.035;
      const time = performance.now() * 0.001;
      const resolvedColor = color.startsWith('var(')
        ? getComputedStyle(canvas).getPropertyValue('--color-primary').trim() || '#bc6ff1'
        : color;
      const safeColor = resolvedColor.startsWith('var(') ? '#bc6ff1' : resolvedColor;

      ctx.clearRect(0, 0, width, height);

      let bands = new Array<number>(RING_COUNT).fill(0);

      if (analyserNode && isPlaying) {
        const freqData = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(freqData);

        bands = bands.map((_, i) => {
          const start = Math.floor((i / RING_COUNT) * (freqData.length * 0.55));
          const end = Math.max(start + 1, Math.floor(((i + 1) / RING_COUNT) * (freqData.length * 0.55)));
          let sum = 0;
          for (let j = start; j < end; j++) sum += freqData[j];
          return (sum / (end - start)) / 255;
        });
      } else {
        bands = bands.map((_, i) => {
          const wave = Math.sin(time * 2.2 + i * 0.45);
          const pulse = Math.cos(time * 1.7 + i * 0.35);
          return isPlaying ? 0.2 + (wave + 1) * 0.18 + (pulse + 1) * 0.08 : 0.05 + (wave + 1) * 0.03;
        });
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

	      for (let i = 0; i < RING_COUNT; i++) {
	        const energy = bands[i];
	        const radiusStep = (maxRadius - baseRadius) / RING_COUNT;
	        const idleBreath = Math.sin(time * 1.5 + i * 0.32) * 0.012;
	        const wave = isPlaying ? (time * 0.22 + i / RING_COUNT) % 1 : (i + 1) / (RING_COUNT + 2) + idleBreath;
	        const radius = baseRadius + wave * (maxRadius - baseRadius) + energy * radiusStep * 0.9;
	        const hue = ((isPlaying ? time * 40 : 210) + i * 24) % 360;
	        const fadeIn = isPlaying ? smoothstep(0.02, 0.18, wave) : 1;
	        const fadeOut = isPlaying ? 1 - smoothstep(0.62, 0.98, wave) : 0.86 + Math.sin(time * 1.2 + i * 0.4) * 0.08;
	        const opacity = Math.min(0.95, (isPlaying ? 0.48 + energy * 0.78 : 0.24 + energy * 0.35) * fadeOut * fadeIn);
	        const lineWidth = Math.max(2.2, 2.8 + energy * 4.4) * (isPlaying ? 0.55 + fadeOut * 0.45 : 0.58);

        if (opacity <= 0.01) continue;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 90%, 68%, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = 5 + energy * 12;
        ctx.shadowColor = `hsla(${hue}, 95%, 70%, 0.35)`;
        ctx.stroke();
      }

	      if (isPlaying && expandLastRing) {
	        const burstWave = (time * 0.16) % 1;
	        const burstFadeIn = smoothstep(0.05, 0.22, burstWave);
	        const burstFadeOut = 1 - smoothstep(0.48, 1, burstWave);
	        const burstOpacity = burstFadeIn * burstFadeOut * 0.82;
	        if (burstOpacity > 0.01) {
	        const burstEnergy = Math.max(...bands);
	        const burstHue = (time * 55 + 220) % 360;
	        const burstSize = maxRadius + smoothstep(0, 1, burstWave) * (burstRadius - maxRadius);

        ctx.beginPath();
        ctx.arc(centerX, centerY, burstSize + burstEnergy * 22, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${burstHue}, 95%, 72%, ${burstOpacity})`;
        ctx.lineWidth = 2.5 + burstEnergy * 4;
        ctx.shadowBlur = 12 + burstEnergy * 18;
	        ctx.shadowColor = `hsla(${burstHue}, 95%, 72%, ${burstOpacity * 0.7})`;
	        ctx.stroke();
	        }
	      }

	      const idleCorePulse = isPlaying ? 0 : (Math.sin(time * 2.4) + 1) * 0.12;
	      const coreRadius = baseRadius * (0.6 + bands[0] * 0.65 + idleCorePulse);
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2.4);
      coreGradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      coreGradient.addColorStop(0.18, safeColor);
      coreGradient.addColorStop(0.55, 'rgba(123, 92, 255, 0.28)');
      coreGradient.addColorStop(1, 'rgba(123, 92, 255, 0)');
      ctx.fillStyle = coreGradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = safeColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyserNode, color, isPlaying, expandLastRing]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default CardVisualizer;
