import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, PartyPopper } from 'lucide-react';

const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

const Confetti = ({ delay }) => {
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  const left = Math.random() * 100;
  const size = Math.random() * 10 + 5;
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${left}%`, top: -20, width: size, height: size, backgroundColor: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ 
        y: window.innerHeight + 100, 
        opacity: [1, 1, 0],
        rotate: Math.random() * 720 - 360,
        x: Math.random() * 200 - 100
      }}
      transition={{ duration: 3 + Math.random() * 2, delay, ease: "easeOut" }}
    />
  );
};

export default function CelebrationAnimation({ show, type = 'badge', message, onComplete }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    if (show) {
      // Generate confetti
      const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 0.5 }));
      setConfetti(pieces);
      
      // Auto-close after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  const icons = {
    badge: Trophy,
    milestone: Star,
    complete: PartyPopper
  };
  const Icon = icons[type] || Sparkles;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
        >
          {/* Confetti */}
          {confetti.map(piece => (
            <Confetti key={piece.id} delay={piece.delay} />
          ))}
          
          {/* Central celebration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl text-center pointer-events-auto max-w-sm mx-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-slate-800 dark:text-white mb-2"
            >
              🎉 Congratulations!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 dark:text-slate-300"
            >
              {message || "You've earned a new achievement!"}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 flex justify-center gap-1"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                >
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}