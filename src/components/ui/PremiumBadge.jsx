import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200',
  info: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200',
  premium: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-400 shadow-lg shadow-teal-500/25',
  gold: 'badge-gold border-amber-400 shadow-lg shadow-amber-500/25',
  purple: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200'
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5'
};

export default function PremiumBadge({ 
  children, 
  variant = 'default',
  size = 'md',
  icon: Icon,
  pulse = false,
  className,
  ...props 
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border',
        'tracking-wide uppercase',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </motion.span>
  );
}

export function StatusIndicator({ status, label, className }) {
  const statusColors = {
    active: 'bg-emerald-500',
    pending: 'bg-amber-500',
    inactive: 'bg-slate-400',
    error: 'bg-red-500',
    processing: 'bg-blue-500'
  };

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2 w-2">
        <span className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          statusColors[status]
        )} />
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          statusColors[status]
        )} />
      </span>
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </span>
  );
}