import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 500,
  formatter = (v) => v.toFixed(0),
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const startVal = displayValue;
    const diff = value - startVal;
    if (diff === 0) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + diff * easedProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
};
