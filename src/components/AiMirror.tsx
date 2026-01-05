
import React, { useEffect, useRef, useState } from 'react';

interface AiMirrorProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const AiMirror: React.FC<AiMirrorProps> = ({ analyserNode, isPlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [bass, setBass] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, 
            audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied');
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!analyserNode || !isPlaying) {
      setBass(0);
      return;
    }

    let animationFrame: number;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const update = () => {
      analyserNode.getByteFrequencyData(dataArray);
      const bassVal = (dataArray[0] + dataArray[1] + dataArray[2]) / (3 * 255);
      setBass(bassVal);
      animationFrame = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [analyserNode, isPlaying]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Mirror Feed with AI Effects */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1] transition-all duration-300"
        style={{
          filter: `
            grayscale(0.5) 
            contrast(1.2) 
            brightness(${0.8 + bass * 0.4}) 
            hue-rotate(${bass * 50}deg)
            blur(${isPlaying ? 0.5 : 2}px)
          `,
          opacity: 0.8
        }}
      />
      
      {/* AI Grid/Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full opacity-30" style={{ 
            backgroundImage: 'radial-gradient(circle, #bc6ff1 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
        }}></div>
        
        {/* Dynamic Scanning Line */}
        <div className="absolute left-0 right-0 h-[2px] bg-primary/50 shadow-[0_0_15px_#bc6ff1] animate-[scan_3s_linear_infinite]" 
             style={{ top: '0%' }}></div>
             
        {/* AI Branding */}
        <div className="absolute top-6 left-6 flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI Clone Active</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter tabular-nums">
                Neural Link: {Math.floor(85 + bass * 15)}% STABLE
            </span>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(340px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AiMirror;
