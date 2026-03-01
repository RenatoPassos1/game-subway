'use client';

import React, { useMemo } from 'react';
import { useAuction } from '../hooks/useAuction';

// SVG circular progress constants
const SIZE = 160;
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer() {
  const { auction, timeLeft, timeLeftFormatted, isActive, isClosing } = useAuction();

  const timerDurationSec = auction ? auction.timerDuration / 1000 : 30;

  // Progress fraction (1 = full, 0 = expired)
  const progress = timerDurationSec > 0 ? timeLeft / timerDurationSec : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Color based on time remaining
  const timerColor = useMemo(() => {
    if (timeLeft > 15) return '#22C55E'; // green
    if (timeLeft > 5) return '#EAB308'; // yellow
    return '#EF4444'; // red
  }, [timeLeft]);

  // Pulse when under 5 seconds
  const shouldPulse = timeLeft > 0 && timeLeft <= 5 && (isActive || isClosing);

  // Glow shadow color
  const glowColor = useMemo(() => {
    if (timeLeft > 15) return 'rgba(34, 197, 94, 0.3)';
    if (timeLeft > 5) return 'rgba(234, 179, 8, 0.3)';
    return 'rgba(239, 68, 68, 0.4)';
  }, [timeLeft]);

  if (!auction) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{ width: SIZE, height: SIZE }}
        >
          <svg width={SIZE} height={SIZE} className="transform -rotate-90">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={STROKE_WIDTH}
            />
          </svg>
          <span className="absolute text-3xl font-bold text-text/30 tabular-nums font-mono">
            --.-
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`relative flex items-center justify-center ${
          shouldPulse ? 'animate-pulse' : ''
        }`}
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Background ring */}
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute transform -rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />
        </svg>

        {/* Progress ring */}
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute transform -rotate-90"
          style={{
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={timerColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-4xl font-black tabular-nums font-mono"
            style={{ color: timerColor }}
          >
            {timeLeftFormatted}
          </span>
          <span className="text-xs text-text-dim uppercase tracking-widest mt-1 font-mono">
            seconds
          </span>
        </div>
      </div>
    </div>
  );
}
