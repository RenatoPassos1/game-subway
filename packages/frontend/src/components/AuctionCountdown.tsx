'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuctionCountdownProps {
  targetDate: string | Date;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export default function AuctionCountdown({ targetDate, onComplete, size = 'md' }: AuctionCountdownProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(target));
  const [completed, setCompleted] = useState(false);

  const handleComplete = useCallback(() => {
    if (!completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [completed, onComplete]);

  useEffect(() => {
    const id = setInterval(() => {
      const tl = calcTimeLeft(target);
      setTimeLeft(tl);
      if (tl.total <= 0) {
        clearInterval(id);
        handleComplete();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, handleComplete]);

  if (completed || timeLeft.total <= 0) {
    const liveStyle = size === 'sm'
      ? 'text-xs px-2 py-0.5'
      : size === 'lg'
        ? 'text-lg px-4 py-2'
        : 'text-sm px-3 py-1';
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono font-bold text-[#14F195] ${liveStyle}`}>
        <span className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
        LIVE NOW!
      </span>
    );
  }

  // Size presets
  if (size === 'sm') {
    const parts: string[] = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
    parts.push(`${timeLeft.minutes}m`);
    parts.push(`${timeLeft.seconds}s`);
    return (
      <span className="font-mono text-xs text-secondary tabular-nums">
        {parts.join(' ')}
      </span>
    );
  }

  if (size === 'lg') {
    const units = [
      { value: timeLeft.days, label: 'DAYS' },
      { value: timeLeft.hours, label: 'HRS' },
      { value: timeLeft.minutes, label: 'MIN' },
      { value: timeLeft.seconds, label: 'SEC' },
    ];
    return (
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="bg-surface/80 border border-white/10 rounded-lg px-3 py-2 min-w-[52px] text-center">
                <span className="font-mono text-xl font-bold text-text tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[9px] font-mono text-text-dim mt-1 tracking-wider">{u.label}</span>
            </div>
            {i < units.length - 1 && (
              <span className={`text-text-dim text-lg font-bold -mt-4 ${u.label === 'SEC' ? '' : 'animate-pulse'}`}>:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // md (default)
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${String(timeLeft.hours).padStart(2, '0')}h`);
  parts.push(`${String(timeLeft.minutes).padStart(2, '0')}m`);
  parts.push(`${String(timeLeft.seconds).padStart(2, '0')}s`);

  return (
    <div className="flex items-center gap-1.5">
      {parts.map((p, i) => (
        <span
          key={i}
          className={`font-mono text-sm tabular-nums ${
            p.endsWith('s') ? 'text-secondary animate-pulse' : 'text-text'
          }`}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
