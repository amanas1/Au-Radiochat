
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

        // Responsive Scaling
        const minDim = Math.min(w, h);
        const scale = minDim / 200; 
        const cx = w / 2;
        const cy = h / 2 + (20 * scale); // Shift down slightly to center the figure

        // Audio Data Processing
        let bufferLength = 32;
        let dataArray = new Uint8Array(bufferLength);
        let bass = 0, mid = 0, high = 0;

        if (analyserNode && isPlaying) {
            bufferLength = analyserNode.frequencyBinCount;
            const fullData = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(fullData);
            
            // Calculate bands
            const bassEnd = Math.floor(bufferLength * 0.1);
            const midEnd = Math.floor(bufferLength * 0.4);
            
            let bSum = 0; for(let i=0; i<bassEnd; i++) bSum += fullData[i];
            bass = (bSum / bassEnd) / 255; // 0.0 - 1.0

            let mSum = 0; for(let i=bassEnd; i<midEnd; i++) mSum += fullData[i];
            mid = (mSum / (midEnd - bassEnd)) / 255;

            let hSum = 0; for(let i=midEnd; i<bufferLength; i++) hSum += fullData[i];
            high = (hSum / (bufferLength - midEnd)) / 255;
        } else if (isPlaying) {
            // Simulated audio if no analyser (e.g. CORS)
            const t = Date.now() * 0.005;
            bass = (Math.sin(t * 2) + 1) * 0.4;
            mid = (Math.cos(t * 3) + 1) * 0.3;
            high = (Math.sin(t * 5) + 1) * 0.2;
        }

        const time = Date.now() * 0.008; // Animation time

        // --- POSE CALCULATIONS ---
        
        // Base Positions (Idle)
        // Y-axis bounce driven by Bass
        const bounce = isPlaying ? -Math.abs(Math.sin(time * 4)) * bass * 20 * scale : 0;
        const breathe = isPlaying ? 0 : Math.sin(time) * 2 * scale; // Idle breathing
        
        const bodyY = cy + bounce + breathe; 
        const spineLen = 45 * scale;
        const shoulderY = bodyY - spineLen;
        const hipY = bodyY;

        // Head
        const headX = cx;
        const headY = shoulderY - (15 * scale); // Neck gap
        const headR = 12 * scale;

        // Limbs Lengths
        const armLen = 25 * scale;
        const forearmLen = 25 * scale;
        const thighLen = 30 * scale;
        const shinLen = 30 * scale;

        // Angles (Radians)
        let lArmAngle = Math.PI * 0.7; // Resting down-ish
        let rArmAngle = Math.PI * 0.3; 
        let lLegAngle = Math.PI * 0.6;
        let rLegAngle = Math.PI * 0.4;
        let lKneeBend = 0.2;
        let rKneeBend = 0.2;
        let lElbowBend = 0.5;
        let rElbowBend = 0.5;

        if (isPlaying) {
            // Dancing Logic
            // Arms wave with Mid/High frequencies
            lArmAngle = Math.PI + Math.sin(time * 2 + mid * 5) * (1 + mid); 
            rArmAngle = 0 - Math.sin(time * 2 + mid * 5) * (1 + mid);
            
            // Elbows bend with energy
            lElbowBend = Math.PI / 2 + Math.sin(time * 4) * 0.5 * high;
            rElbowBend = -(Math.PI / 2 + Math.sin(time * 4) * 0.5 * high);

            // Legs step/kick with Bass
            const step = Math.sin(time * 3);
            lLegAngle = Math.PI * 0.5 + 0.3 + (step * 0.5 * bass);
            rLegAngle = Math.PI * 0.5 - 0.3 - (step * 0.5 * bass);
            
            lKneeBend = -Math.abs(Math.sin(time * 3 + Math.PI)) * bass;
            rKneeBend = Math.abs(Math.sin(time * 3)) * bass;
        }

        // --- JOINT COMPUTATIONS ---

        // Shoulders
        const shoulderW = 10 * scale;
        const lShoulderX = cx - shoulderW;
        const rShoulderX = cx + shoulderW;

        // Arms
        const lElbowX = lShoulderX + Math.cos(lArmAngle) * armLen;
        const lElbowY = shoulderY + Math.sin(lArmAngle) * armLen;
        const lHandX = lElbowX + Math.cos(lArmAngle + lElbowBend) * forearmLen;
        const lHandY = lElbowY + Math.sin(lArmAngle + lElbowBend) * forearmLen;

        const rElbowX = rShoulderX + Math.cos(rArmAngle) * armLen;
        const rElbowY = shoulderY + Math.sin(rArmAngle) * armLen;
        const rHandX = rElbowX + Math.cos(rArmAngle + rElbowBend) * forearmLen;
        const rHandY = rElbowY + Math.sin(rArmAngle + rElbowBend) * forearmLen;

        // Hips
        const hipW = 8 * scale;
        const lHipX = cx - hipW;
        const rHipX = cx + hipW;

        // Legs
        const lKneeX = lHipX + Math.cos(lLegAngle) * thighLen;
        const lKneeY = hipY + Math.sin(lLegAngle) * thighLen;
        const lFootX = lKneeX + Math.cos(lLegAngle + lKneeBend) * shinLen;
        const lFootY = lKneeY + Math.sin(lLegAngle + lKneeBend) * shinLen;

        const rKneeX = rHipX + Math.cos(rLegAngle) * thighLen;
        const rKneeY = hipY + Math.sin(rLegAngle) * thighLen;
        const rFootX = rKneeX + Math.cos(rLegAngle + rKneeBend) * shinLen;
        const rFootY = rKneeY + Math.sin(rLegAngle + rKneeBend) * shinLen;


        // --- RENDERING ---
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6 * scale;
        
        // Dynamic Glow
        const glowIntensity = isPlaying ? 10 + bass * 20 : 5;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // Draw Skeleton
        
        // 1. Torso
        ctx.beginPath();
        ctx.moveTo(cx, shoulderY);
        ctx.lineTo(cx, hipY);
        ctx.stroke();

        // 2. Shoulders (Line)
        ctx.beginPath();
        ctx.moveTo(lShoulderX, shoulderY);
        ctx.lineTo(rShoulderX, shoulderY);
        ctx.stroke();

        // 3. Hips (Line)
        ctx.beginPath();
        ctx.moveTo(lHipX, hipY);
        ctx.lineTo(rHipX, hipY);
        ctx.stroke();

        // 4. Head
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.fill(); 
        // Eyes (Clone AI look)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(headX - 4*scale, headY, 2*scale, 0, Math.PI*2);
        ctx.arc(headX + 4*scale, headY, 2*scale, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = color; // Reset fill

        // 5. Arms
        // Left
        ctx.beginPath();
        ctx.moveTo(lShoulderX, shoulderY);
        ctx.lineTo(lElbowX, lElbowY);
        ctx.lineTo(lHandX, lHandY);
        ctx.stroke();
        // Right
        ctx.beginPath();
        ctx.moveTo(rShoulderX, shoulderY);
        ctx.lineTo(rElbowX, rElbowY);
        ctx.lineTo(rHandX, rHandY);
        ctx.stroke();

        // 6. Legs
        // Left
        ctx.beginPath();
        ctx.moveTo(lHipX, hipY);
        ctx.lineTo(lKneeX, lKneeY);
        ctx.lineTo(lFootX, lFootY);
        ctx.stroke();
        // Right
        ctx.beginPath();
        ctx.moveTo(rHipX, hipY);
        ctx.lineTo(rKneeX, rKneeY);
        ctx.lineTo(rFootX, rFootY);
        ctx.stroke();

        // Joints (Circles)
        const drawJoint = (jx: number, jy: number) => {
            ctx.beginPath();
            ctx.arc(jx, jy, 3 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        drawJoint(lShoulderX, shoulderY);
        drawJoint(rShoulderX, shoulderY);
        drawJoint(lElbowX, lElbowY);
        drawJoint(rElbowX, rElbowY);
        drawJoint(lHandX, lHandY);
        drawJoint(rHandX, rHandY);
        
        drawJoint(lHipX, hipY);
        drawJoint(rHipX, hipY);
        drawJoint(lKneeX, lKneeY);
        drawJoint(rKneeX, rKneeY);
        drawJoint(lFootX, lFootY);
        drawJoint(rFootX, rFootY);

        ctx.shadowBlur = 0; // Reset for next frame

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
