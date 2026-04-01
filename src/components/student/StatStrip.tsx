// StatStrip — Horizontal stats grid (2-col) or scroll strip
// Replaces stacked stat cards with compact pill-like items

import React from 'react';
import { motion } from 'framer-motion';

export interface StatItem {
  icon: string; // bootstrap icon class (e.g. 'bi-book')
  value: string | number;
  label: string;
  color?: string; // tailwind color class
}

interface StatStripProps {
  stats: StatItem[];
  className?: string;
  columns?: 2 | 3;
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
};

const StatStrip: React.FC<StatStripProps> = ({ stats, className = '', columns = 2 }) => {
  const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-2 ${className}`}>
      {stats.map((stat, index) => {
        const theme = colorMap[stat.color || 'blue'] || colorMap.blue;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`${theme.bg} rounded-xl p-3 flex items-center gap-2.5`}
          >
            <div
              className={`${theme.iconBg} w-9 h-9 rounded-lg flex items-center justify-content-center shrink-0`}
            >
              <i className={`bi ${stat.icon} ${theme.text} text-base`} />
            </div>
            <div className="min-w-0">
              <div className={`font-bold text-base leading-tight ${theme.text}`}>
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-500 leading-tight truncate">
                {stat.label}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatStrip;
