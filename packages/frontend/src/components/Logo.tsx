'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = '' }: LogoProps) {
  const id = 'cw' + Math.random().toString(36).slice(2, 6);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Click Win logo"
    >
      <defs>
        <linearGradient id={`${id}g`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="36" y1="4" x2="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
        <radialGradient id={`${id}bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0F0F23" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle background glow */}
      <circle cx="20" cy="20" r="19" fill={`url(#${id}bg)`} />

      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" stroke={`url(#${id}g)`} strokeWidth="1.2" fill="none" />

      {/* Click ripple rings */}
      <circle cx="24" cy="24" r="10" stroke="#00D2FF" strokeWidth="0.6" fill="none" opacity="0.2" />
      <circle cx="24" cy="24" r="6.5" stroke="#6C5CE7" strokeWidth="0.8" fill="none" opacity="0.35" />

      {/* Click target dot */}
      <circle cx="24" cy="24" r="2.5" fill={`url(#${id}g)`} />
      <circle cx="24" cy="24" r="1" fill="#FFD700" opacity="0.9" />

      {/* Cursor arrow */}
      <path
        d="M8 6 L8 26 L13.5 21 L19 30 L22 28.5 L16.5 19.5 L23 18.5 Z"
        fill={`url(#${id}g)`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
