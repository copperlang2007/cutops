import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PremiumCard({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  glow = false,
  delay = 0,
  ...props 
}) {
  const variants = {
    default: 'bg-white border border-slate-200/80',
    glass: 'glass-card',
    gradient: 'gradient-border bg-white',
    elevated: 'bg-white shadow-elevated',
    dark: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={hover ? { 
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      className={cn(
        'rounded-2xl shadow-premium transition-all duration-300',
        variants[variant],
        hover && 'hover:shadow-card-hover hover:border-teal-200/50',
        glow && 'alert-pulse',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PremiumCardHeader({ children, className, icon: Icon, iconColor = 'text-teal-600', action }) {
  return (
    <div className={cn('p-6 pb-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-teal-50 to-teal-100/50'
              )}
            >
              <Icon className={cn('w-5 h-5', iconColor)} />
            </motion.div>
          )}
          <div>{children}</div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

export function PremiumCardTitle({ children, subtitle, className }) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{children}</h3>
      {subtitle && (
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export function PremiumCardContent({ children, className }) {
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  );
}