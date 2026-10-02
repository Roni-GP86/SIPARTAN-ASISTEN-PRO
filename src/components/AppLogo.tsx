import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/40 via-amber-300/30 to-emerald-500/30 rounded-2xl blur-md opacity-80 animate-pulse" />
      
      {/* Outer Shield/Container */}
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#0B1528] via-[#0E2040] to-[#070e1c] border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)] flex items-center justify-center p-2 backdrop-blur-md overflow-hidden">
        {/* Subtle background radial shine */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />
        
        {/* High Precision Vector SVG: Harmony of Open Book & Golden Fountain Pen */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        >
          <defs>
            {/* Gold Gradients */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="80%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient id="bookPageLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="85%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <linearGradient id="bookPageRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="15%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            <linearGradient id="penGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
            
            <linearGradient id="wingGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Under-book stylized wings / laurel arches */}
          <path
            d="M18 68 C 24 78, 38 84, 50 85 C 62 84, 76 78, 82 68"
            stroke="url(#goldGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* Book Bottom Cover Spine */}
          <path
            d="M16 63 Q 50 76 84 63 L 84 67 Q 50 80 16 67 Z"
            fill="#0F172A"
            stroke="#D97706"
            strokeWidth="1.2"
          />

          {/* Book Base Pages Stack (Thickness) */}
          <path
            d="M18 60 Q 50 72 82 60 L 82 63 Q 50 75 18 63 Z"
            fill="#94A3B8"
            opacity="0.7"
          />

          {/* Open Book Left Page */}
          <path
            d="M50 71 Q 34 67 18 57 L 18 43 Q 34 53 50 58 Z"
            fill="url(#bookPageLeft)"
            stroke="#64748B"
            strokeWidth="0.8"
          />

          {/* Text lines on Left Page */}
          <path d="M24 48 Q 35 55 46 59" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <path d="M25 52 Q 35 59 45 62" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <path d="M27 56 Q 35 62 44 65" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* Open Book Right Page */}
          <path
            d="M50 71 Q 66 67 82 57 L 82 43 Q 66 53 50 58 Z"
            fill="url(#bookPageRight)"
            stroke="#64748B"
            strokeWidth="0.8"
          />

          {/* Text lines on Right Page */}
          <path d="M54 59 Q 65 55 76 48" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <path d="M55 62 Q 65 59 75 52" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <path d="M56 65 Q 65 62 73 56" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* Book Center Fold Shadow */}
          <path d="M50 58 L 50 71" stroke="#475569" strokeWidth="1.5" />

          {/* Central Fountain Quill Pen Rising Upwards */}
          {/* Pen Feather Flanges / Wing Aura */}
          <path
            d="M50 48 Q 42 34 38 22 Q 44 26 48 34 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />
          <path
            d="M50 48 Q 58 34 62 22 Q 56 26 52 34 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />

          {/* Pen Barrel Body */}
          <path
            d="M48 22 L 52 22 L 53 48 L 47 48 Z"
            fill="url(#penGlow)"
            stroke="#B45309"
            strokeWidth="0.8"
          />

          {/* Pen Grip Ring */}
          <rect x="46.5" y="47" width="7" height="3" rx="1" fill="#F59E0B" stroke="#78350F" strokeWidth="0.6" />

          {/* Pen Golden Nib */}
          <path
            d="M47 50 L 53 50 L 51 64 L 50 67 L 49 64 Z"
            fill="url(#goldGradient)"
            stroke="#78350F"
            strokeWidth="0.6"
          />

          {/* Nib Vent Hole & Slit */}
          <circle cx="50" cy="56" r="1" fill="#0F172A" />
          <line x1="50" y1="57" x2="50" y2="67" stroke="#0F172A" strokeWidth="0.8" />

          {/* Top Star Sparkle from Pen Tip */}
          <g style={{ transformOrigin: '50px 18.5px' }} className="animate-pulse">
            <path
              d="M50 11 L 51.5 17 L 57.5 18.5 L 51.5 20 L 50 26 L 48.5 20 L 42.5 18.5 L 48.5 17 Z"
              fill="#FEF08A"
            />
            <circle cx="50" cy="18.5" r="1.5" fill="#FFFFFF" />
          </g>

          {/* Small Sparkles */}
          <circle cx="34" cy="30" r="1" fill="#FDE68A" opacity="0.8" />
          <circle cx="66" cy="30" r="1" fill="#FDE68A" opacity="0.8" />
          <circle cx="28" cy="42" r="0.8" fill="#34D399" opacity="0.7" />
          <circle cx="72" cy="42" r="0.8" fill="#34D399" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
};
