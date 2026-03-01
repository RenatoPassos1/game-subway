'use client';

import React, { useMemo } from 'react';
import { useAuction } from '../hooks/useAuction';

// Compact SVG circular progress
const SIZE = 100;
const STROKE_WIDTH = 4;
const RADIUS = (SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer() {
  const { auction, timeLeft, timeLeftFormatted, isActive, isClosing } = useAuction();

  const timerDurationSec = auction ? auction.timerDuration / 1000 : 30;
  const progress = timerDurationSec > 0 ? timeLeft / timerDurationSec : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Demo mode
  const showDemo = !auction;
  const displayTime = showDemo ? '15.0' : timeLeftFormatted;
  const displayDashOffset = showDemo ? CIRCUMFERENCE * 0.5 : dashOffset;
  const displayTimeLeft = showDemo ? 15 : timeLeft;

  const timerColor = useMemo(() => {
    if (displayTimeLeft > 10) return '#14F195';
    if (displayTimeLeft > 5) return '#FFD700';
    return '#FF3B30';
  }, [displayTimeLeft]);

  const secondaryColor = useMemo(() => {
    if (displayTimeLeft > 10) return '#9945FF';
    if (displayTimeLeft > 5) return '#FF8C00';
    return '#FF7A18';
  }, [displayTimeLeft]);

  const shouldPulse = displayTimeLeft > 0 && displayTimeLeft <= 5 && (showDemo || isActive || isClosing);

  const glowColor = useMemo(() => {
    if (displayTimeLeft > 10) return 'rgba(20, 241, 149, 0.3)';
    if (displayTimeLeft > 5) return 'rgba(255, 215, 0, 0.4)';
    return 'rgba(255, 59, 48, 0.5)';
  }, [displayTimeLeft]);

  return (
    <div className="flex items-center justify-center">
      <div
        className={`relative flex items-center justify-center ${shouldPulse ? 'animate-urgency-pulse' : ''}`}
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
        }}
      >
        {/* Background track + tick marks */}
        <svg width={SIZE} height={SIZE} className="absolute transform -rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Compact tick marks - 12 major only */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const outerR = RADIUS + 1;
            const innerR = RADIUS - 4;
            return (
              <line
                key={i}
                x1={SIZE / 2 + Math.cos(angle) * innerR}
                y1={SIZE / 2 + Math.sin(angle) * innerR}
                x2={SIZE / 2 + Math.cos(angle) * outerR}
                y2={SIZE / 2 + Math.sin(angle) * outerR}
                stroke="rgba(153, 69, 255, 0.15)"
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {/* Progress ring */}
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        >
          <defs>
            <linearGradient id="timer-grad-sm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={timerColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#timer-grad-sm)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={displayDashOffset}
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center">
          <span
            className={`text-2xl font-black tabular-nums font-mono transition-colors duration-300 ${
              shouldPulse ? 'animate-pulse' : ''
            }`}
            style={{
              color: timerColor,
              textShadow: `0 0 10px ${glowColor}`,
            }}
          >
            {displayTime}
          </span>
          <span
            className="text-[8px] uppercase tracking-[0.15em] font-mono transition-colors duration-300"
            style={{ color: displayTimeLeft <= 5 ? 'rgba(255,59,48,0.6)' : 'rgba(153, 69, 255, 0.5)' }}
          >
            seconds
          </span>
        </div>
      </div>
    </div>
  );
}
