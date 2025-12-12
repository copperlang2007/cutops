import React from 'react';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, color = "teal", subtitle }) {
  const colorConfig = {
    teal: { bg: "bg-gradient-to-br from-teal-50 to-teal-100/50", text: "text-teal-600", border: "border-teal-100" },
    navy: { bg: "bg-gradient-to-br from-slate-100 to-slate-200/50", text: "text-slate-700", border: "border-slate-200" },
    amber: { bg: "bg-gradient-to-br from-amber-50 to-amber-100/50", text: "text-amber-600", border: "border-amber-100" },
    red: { bg: "bg-gradient-to-br from-red-50 to-red-100/50", text: "text-red-600", border: "border-red-100" },
    green: { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50", text: "text-emerald-600", border: "border-emerald-100" },
    blue: { bg: "bg-gradient-to-br from-blue-50 to-blue-100/50", text: "text-blue-600", border: "border-blue-100" },
    purple: { bg: "bg-gradient-to-br from-purple-50 to-purple-100/50", text: "text-purple-600", border: "border-purple-100" }
  };

  const colors = colorConfig[color] || colorConfig.teal;

  return (
    <Card className="clay-subtle relative overflow-hidden group border-0">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-teal-50/30 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-2">{title}</p>
            <motion.p 
              className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.p>
            {trend && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </motion.div>
            )}
            {subtitle && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
            )}
            </div>
            <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-xl ${colors.bg} dark:bg-opacity-20 border ${colors.border} dark:border-opacity-30 shadow-sm`}
          >
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </motion.div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <motion.div 
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${
          color === 'teal' ? 'from-teal-400 to-emerald-400' :
          color === 'green' ? 'from-emerald-400 to-green-400' :
          color === 'red' ? 'from-red-400 to-rose-400' :
          color === 'blue' ? 'from-blue-400 to-indigo-400' :
          color === 'purple' ? 'from-purple-400 to-violet-400' :
          'from-slate-400 to-slate-500'
        }`}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </Card>
  );
}