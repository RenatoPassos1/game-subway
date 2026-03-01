'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  /** Stagger delay in ms (e.g. 0, 100, 200…) */
  delay?: number;
  /** Extra CSS classes on the wrapper */
  className?: string;
  /** Direction: 'up' (default) slides from bottom, 'left' slides from right */
  direction?: 'up' | 'left';
}

export default function RevealOnScroll({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform = direction === 'left' ? 'translateX(32px)' : 'translateY(28px)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0,0)' : hiddenTransform,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)`,
        transitionDelay: visible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
}
