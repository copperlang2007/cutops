import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedNumber({ 
  value, 
  duration = 1,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration: duration * 1000
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [spring]);

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <motion.span 
      className={`metric-value ${className}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
}

export function AnimatedPercentage({ value, className = '', showSign = true }) {
  const isPositive = value >= 0;
  
  return (
    <motion.span
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center gap-1 ${className} ${
        isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      <motion.span
        initial={{ rotate: 0 }}
        animate={{ rotate: isPositive ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        ↑
      </motion.span>
      <AnimatedNumber 
        value={Math.abs(value)} 
        decimals={1} 
        suffix="%" 
      />
    </motion.span>
  );
}