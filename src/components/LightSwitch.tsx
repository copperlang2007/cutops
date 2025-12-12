import { motion } from 'motion/react';

interface LightSwitchProps {
  isDark: boolean;
  onToggle: () => void;
}

export function LightSwitch({ isDark, onToggle }: LightSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-6 right-8 z-50 group"
      style={{
        width: '80px',
        height: '120px'
      }}
    >
      {/* Switch plate background */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300"
        style={{
          background: isDark
            ? `linear-gradient(135deg, rgba(30, 30, 35, 0.9) 0%, rgba(20, 20, 25, 0.95) 100%)`
            : `linear-gradient(135deg, rgba(245, 242, 238, 0.95) 0%, rgba(235, 232, 228, 1) 100%)`,
          border: isDark
            ? '2px solid rgba(60, 60, 70, 0.8)'
            : '2px solid rgba(255, 255, 255, 0.9)',
          boxShadow: isDark
            ? `
              0 8px 32px rgba(0, 0, 0, 0.8),
              inset 0 1px 2px rgba(255, 255, 255, 0.1),
              inset 0 -2px 4px rgba(0, 0, 0, 0.4),
              0 0 40px rgba(139, 92, 246, 0.3)
            `
            : `
              0 8px 32px rgba(163, 177, 198, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 1),
              inset 0 -2px 4px rgba(163, 177, 198, 0.3),
              0 0 40px rgba(120, 113, 108, 0.2)
            `
        }}
      />

      {/* Switch toggle slot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg transition-all duration-300"
        style={{
          width: '36px',
          height: '70px',
          background: isDark
            ? 'linear-gradient(180deg, rgba(10, 10, 15, 1) 0%, rgba(20, 20, 25, 1) 100%)'
            : 'linear-gradient(180deg, rgba(220, 217, 213, 1) 0%, rgba(235, 232, 228, 1) 100%)',
          boxShadow: isDark
            ? `
              inset 0 4px 8px rgba(0, 0, 0, 0.9),
              inset 0 -2px 4px rgba(255, 255, 255, 0.05)
            `
            : `
              inset 0 4px 8px rgba(163, 177, 198, 0.4),
              inset 0 -2px 4px rgba(255, 255, 255, 0.6)
            `
        }}
      />

      {/* Switch toggle (flippable) */}
      <motion.div
        animate={{
          rotateX: isDark ? 15 : -15,
          y: isDark ? 15 : -15
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg"
        style={{
          width: '32px',
          height: '42px',
          transformStyle: 'preserve-3d',
          background: isDark
            ? `
              linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.3) 100%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)
            `
            : `
              linear-gradient(135deg, rgba(120, 113, 108, 0.3) 0%, rgba(68, 64, 60, 0.25) 100%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)
            `,
          border: isDark
            ? '2px solid rgba(255, 255, 255, 0.2)'
            : '2px solid rgba(255, 255, 255, 0.9)',
          borderTop: isDark
            ? '2px solid rgba(255, 255, 255, 0.3)'
            : '2px solid rgba(255, 255, 255, 1)',
          boxShadow: isDark
            ? `
              0 4px 16px rgba(139, 92, 246, 0.6),
              0 8px 32px rgba(236, 72, 153, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.3),
              inset 0 -1px 2px rgba(0, 0, 0, 0.3),
              0 0 30px rgba(139, 92, 246, 0.5)
            `
            : `
              0 4px 16px rgba(120, 113, 108, 0.4),
              0 8px 32px rgba(163, 177, 198, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 1),
              inset 0 -1px 2px rgba(163, 177, 198, 0.2),
              0 0 30px rgba(163, 177, 198, 0.3)
            `
        }}
      >
        {/* Liquid glass shine effect on toggle */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, ${isDark ? '0.4' : '0.8'}) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(163, 177, 198, 0.4)'} 0%, transparent 60%)
            `
          }}
        />

        {/* Glossy highlight bar on toggle */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[25%] rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255, 255, 255, ${isDark ? '0.5' : '1'}) 0%, transparent 100%)`,
            filter: 'blur(3px)'
          }}
        />

        {/* Toggle indicator line */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '16px',
            height: '3px',
            background: isDark
              ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))'
              : 'linear-gradient(90deg, rgba(120, 113, 108, 0.6), rgba(163, 177, 198, 0.6))',
            boxShadow: isDark
              ? '0 0 8px rgba(139, 92, 246, 0.8)'
              : '0 1px 2px rgba(255, 255, 255, 0.8)'
          }}
        />
      </motion.div>

      {/* Screw details (top and bottom) */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: '8px',
          height: '8px',
          background: isDark
            ? 'radial-gradient(circle, rgba(60, 60, 70, 1) 0%, rgba(40, 40, 50, 1) 100%)'
            : 'radial-gradient(circle, rgba(200, 197, 193, 1) 0%, rgba(180, 177, 173, 1) 100%)',
          boxShadow: isDark
            ? 'inset 0 1px 2px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 2px rgba(120, 113, 108, 0.3), 0 1px 2px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Screw slot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '5px',
            height: '1px',
            background: isDark ? 'rgba(20, 20, 25, 0.8)' : 'rgba(140, 137, 133, 0.6)',
            boxShadow: isDark
              ? '0 1px 0 rgba(80, 80, 90, 0.4)'
              : '0 1px 0 rgba(200, 197, 193, 0.5)'
          }}
        />
      </div>

      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: '8px',
          height: '8px',
          background: isDark
            ? 'radial-gradient(circle, rgba(60, 60, 70, 1) 0%, rgba(40, 40, 50, 1) 100%)'
            : 'radial-gradient(circle, rgba(200, 197, 193, 1) 0%, rgba(180, 177, 173, 1) 100%)',
          boxShadow: isDark
            ? 'inset 0 1px 2px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 2px rgba(120, 113, 108, 0.3), 0 1px 2px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Screw slot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '5px',
            height: '1px',
            background: isDark ? 'rgba(20, 20, 25, 0.8)' : 'rgba(140, 137, 133, 0.6)',
            boxShadow: isDark
              ? '0 1px 0 rgba(80, 80, 90, 0.4)'
              : '0 1px 0 rgba(200, 197, 193, 0.5)'
          }}
        />
      </div>
    </button>
  );
}
