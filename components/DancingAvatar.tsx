
import React from 'react';

interface DancingAvatarProps {
  isPlaying: boolean;
  className?: string;
  variant?: 'simple' | 'complex';
}

const DancingAvatar: React.FC<DancingAvatarProps> = ({ isPlaying, className = '', variant = 'simple' }) => {
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      <style>
        {`
          /* Blinking Eyes */
          @keyframes blink {
            0%, 96%, 100% { transform: scaleY(1); }
            98% { transform: scaleY(0.1); }
          }
          .animate-blink {
            animation: blink 4s infinite ease-in-out;
            transform-origin: center;
          }
          
          /* Simple Dance Animations */
          @keyframes simpleBodyMain {
            0% { transform: translateY(0); }
            50% { transform: translateY(2px) scaleY(1.01); }
            100% { transform: translateY(0); }
          }
          .animate-simple-body-main {
            animation: simpleBodyMain 1s ease-in-out infinite alternate;
            transform-origin: center 65px; 
          }

          @keyframes simpleArmSwingLeft {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-20deg); }
          }
          .animate-simple-arm-left {
            animation: simpleArmSwingLeft 0.8s ease-in-out infinite alternate;
            transform-origin: 5px 5px; 
          }

          @keyframes simpleArmSwingRight {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(20deg); }
          }
          .animate-simple-arm-right {
            animation: simpleArmSwingRight 0.8s ease-in-out infinite alternate;
            transform-origin: 5px 5px; 
          }

          /* Complex Dance Animations */
          @keyframes complexBodyMain {
            0% { transform: translateY(0) scale(1); }
            15% { transform: translateY(-5px) scaleY(1.05); } 
            30% { transform: translateY(0) scale(1); }
            45% { transform: translateY(-8px) rotate(-5deg); } 
            60% { transform: translateY(0) rotate(5deg); } 
            75% { transform: translateY(-3px) scale(0.98); } 
            100% { transform: translateY(0) scale(1); }
          }
          .animate-complex-body-main {
            animation: complexBodyMain 4s ease-in-out infinite;
            transform-origin: center 65px; 
          }

          @keyframes noteFloatInner {
            0% { transform: translate(0, 0) opacity(0); }
            20% { opacity: 0.8; }
            100% { transform: translate(10px, -20px) opacity(0); }
          }
          .animate-note-inner {
            animation: noteFloatInner 2s ease-in-out infinite;
          }
        `}
      </style>
      
      {isPlaying && (
        <>
          <div className="absolute top-2 right-2 z-10">
            <svg width="10" height="10" viewBox="0 0 24 24" className="text-secondary animate-note-inner">
              <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </>
      )}

      <svg 
        viewBox="0 0 100 150" 
        className="w-full h-full drop-shadow-lg transition-transform duration-300"
      >
        <defs>
          <radialGradient id="faceGradient" cx="30%" cy="30%" r="80%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
          <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
        </defs>

        <g className={isPlaying ? (variant === 'complex' ? 'animate-complex-body-main' : 'animate-simple-body-main') : ''}>
          <circle cx="50" cy="65" r="45" fill="url(#faceGradient)" /> 

          <ellipse cx="35" cy="45" rx="15" ry="8" fill="white" opacity="0.3" transform="rotate(-45, 35, 45)" />

          <g className={`${isPlaying && variant === 'complex' ? 'animate-complex-eyes' : 'animate-blink'}`} transform-origin="50 55">
              <g transform="translate(32, 52)">
                  <ellipse cx="0" cy="0" rx="8" ry="10" fill="white" />
                  <circle cx="0" cy="2" r="4.5" fill="url(#eyeGradient)" />
                  <circle cx="0" cy="2" r="2" fill="black" />
              </g>
              <g transform="translate(68, 52)">
                  <ellipse cx="0" cy="0" rx="8" ry="10" fill="white" />
                  <circle cx="0" cy="2" r="4.5" fill="url(#eyeGradient)" />
                  <circle cx="0" cy="2" r="2" fill="black" />
              </g>
          </g>

          <g className={isPlaying && variant === 'complex' ? 'animate-complex-mouth' : ''}>
            {isPlaying ? (
                <path d="M38,75 Q50,85 62,75 Q50,90 38,75" fill="#991b1b" />
            ) : (
                <path d="M38,78 Q50,85 62,78" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
            )}
          </g>

          <rect x="2" y="55" width="12" height="25" rx="4" fill="#334155" />
          <rect x="86" y="55" width="12" height="25" rx="4" fill="#334155" />
        </g>
      </svg>
    </div>
  );
};

export default DancingAvatar;
