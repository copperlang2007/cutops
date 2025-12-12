import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressRing({ progress, size = 120, strokeWidth = 8, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 100) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
    if (progress >= 75) return { stroke: '#0d9488', glow: 'rgba(13, 148, 136, 0.3)' };
    if (progress >= 50) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' };
    if (progress >= 25) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' };
    return { stroke: '#94a3b8', glow: 'rgba(148, 163, 184, 0.2)' };
  };

  const colors = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${colors.glow})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}