import React, { useState, useEffect, useRef } from 'react';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  // Extract the numeric part of the value (handles strings like '₹500' or '87.5%')
  const parseNumber = (val) => {
    if (val === undefined || val === null) return 0;
    const cleanStr = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const getPrefixAndSuffix = (val) => {
    if (val === undefined || val === null) return { prefix: '', suffix: '' };
    const str = String(val);
    const cleanStr = str.replace(/[^0-9.]/g, '');
    if (!cleanStr) return { prefix: str, suffix: '' };
    const cleanIndex = str.indexOf(cleanStr);
    if (cleanIndex === -1) return { prefix: '', suffix: '' };
    
    const prefix = str.substring(0, cleanIndex);
    const suffix = str.substring(cleanIndex + cleanStr.length);
    return { prefix, suffix };
  };

  const target = parseNumber(value);
  const { prefix, suffix } = getPrefixAndSuffix(value);

  useEffect(() => {
    let start = prevValueRef.current;
    const end = target;
    
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 500; // ms
    let animationFrameId;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = start + (end - start) * easeProgress;
      
      // Check if original value was a decimal
      const isFloat = String(value).includes('.') || String(displayValue).includes('.');
      const formattedVal = isFloat ? parseFloat(current.toFixed(1)) : Math.round(current);
      
      setDisplayValue(formattedVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = end;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, value]);

  // Keep track of the last target value to use as the starting point for the next animation
  useEffect(() => {
    prevValueRef.current = target;
  }, [target]);

  const isFloat = String(value).includes('.');
  const formattedOutput = isFloat ? displayValue.toFixed(1) : displayValue;

  return <span>{prefix}{formattedOutput}{suffix}</span>;
};

export default AnimatedNumber;
