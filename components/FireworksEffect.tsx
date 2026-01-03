
import React, { useRef, useEffect } from 'react';

interface FireworksEffectProps {
  isActive: boolean;
}

const FireworksEffect: React.FC<FireworksEffectProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const particles = useRef<any[]>([]);
  const fireworks = useRef<any[]>([]);

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

    const hue = 120;
    const gravity = 0.05;

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function createParticle(x: number, y: number) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1, 10);
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        friction: 0.99,
        decay: random(0.015, 0.03),
        hue: random(hue - 20, hue + 20),
      };
    }

    function createFirework(sx: number, sy: number, tx: number, ty: number) {
      const x = sx;
      const y = sy;
      const distance = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
      const angle = Math.atan2(ty - sy, tx - sx);
      const trail: any[] = [];
      return {
        x,
        y,
        sx,
        sy,
        tx,
        ty,
        distance,
        speed: 2,
        angle,
        trail,
        traveled: 0,
        hue: random(hue - 20, hue + 20),
        brightness: random(50, 70),
        update: function (index: number) {
          this.trail.push({ x: this.x, y: this.y });
          if (this.trail.length > 5) this.trail.shift();

          this.traveled = Math.sqrt(Math.pow(this.x - this.sx, 2) + Math.pow(this.y - this.sy, 2));
          if (this.traveled >= this.distance) {
            fireworks.current.splice(index, 1);
            for (let i = 0; i < 30; i++) {
              particles.current.push(createParticle(this.tx, this.ty));
            }
          } else {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
          }
        },
        draw: function () {
          ctx.beginPath();
          if (this.trail[0]) {
             ctx.moveTo(this.trail[0].x, this.trail[0].y);
             ctx.lineTo(this.x, this.y);
             ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
             ctx.stroke();
          }
        },
      };
    }

    const loop = () => {
      animationFrameId.current = requestAnimationFrame(loop);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      fireworks.current.forEach((f, i) => {
        f.draw();
        f.update(i);
      });
      particles.current.forEach((p, i) => {
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= p.decay) {
          particles.current.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
          ctx.fill();
        }
      });
    };

    // FIX: Use any to support both NodeJS.Timeout and number depending on env.
    let launchInterval: any;
    if (isActive) {
      loop();
      launchInterval = setInterval(() => {
        fireworks.current.push(createFirework(w / 2, h, random(0, w), random(0, h / 2)));
      }, 800);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (launchInterval) clearInterval(launchInterval);
    };
  }, [isActive]);

  return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />;
};

export default FireworksEffect;
