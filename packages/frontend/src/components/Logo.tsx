'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Primary gradient: purple to cyan */}
        <linearGradient id="cwGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>

        {/* Reverse glow gradient */}
        <linearGradient id="cwGlow" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>

        {/* Subtle radial background fill */}
        <radialGradient id="cwBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0F0F23" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="20" cy="20" r="19" fill="url(#cwBg)" />

      {/* Outer hexagon frame */}
      <path
        d="M20 1.5L36.5 11v18L20 38.5 3.5 29V11L20 1.5Z"
        stroke="url(#cwGrad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner hexagon for depth */}
      <path
        d="M20 5.5L33 13v14L20 34.5 7 27V13L20 5.5Z"
        stroke="url(#cwGlow)"
        strokeWidth="0.6"
        strokeLinejoin="round"
        fill="none"
        opacity="0.35"
      />

      {/* Circuit-board vertex nodes */}
      <circle cx="20" cy="1.5" r="1.2" fill="#6C5CE7" />
      <circle cx="36.5" cy="11" r="1.2" fill="#8B7CF0" />
      <circle cx="36.5" cy="29" r="1.2" fill="#00D2FF" />
      <circle cx="20" cy="38.5" r="1.2" fill="#00D2FF" />
      <circle cx="3.5" cy="29" r="1.2" fill="#33DBFF" />
      <circle cx="3.5" cy="11" r="1.2" fill="#6C5CE7" />

      {/* Horizontal circuit traces */}
      <line x1="5.5" y1="20" x2="10" y2="20" stroke="url(#cwGrad)" strokeWidth="0.5" opacity="0.45" />
      <line x1="30" y1="20" x2="34.5" y2="20" stroke="url(#cwGlow)" strokeWidth="0.5" opacity="0.45" />

      {/* "C" - geometric angular letter */}
      <path
        d="M11 14h7v2.2h-4.6v7.6H18v2.2h-7V14Z"
        fill="url(#cwGrad)"
      />

      {/* "W" - sharp angular letter */}
      <path
        d="M20.5 14h2.4l2 6.8L27 14h2.4l-3.6 12h-1.9l-1.7-5.8L20.5 26h-1.9L15.2 14h2.4l2 6.8L21.7 14h-1.2Z"
        fill="url(#cwGrad)"
      />

      {/* Accent dot - gold, bottom center */}
      <circle cx="20" cy="32" r="0.7" fill="#FFD700" opacity="0.85" />
    </svg>
  );
}
