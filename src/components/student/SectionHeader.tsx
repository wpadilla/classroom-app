// SectionHeader — Collapsible section with icon, title, badge, and chevron
// Replaces tab navigation with scrollable sections

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionHeaderProps {
  icon: string;
  title: string;
  badge?: string | number;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** If true, section is always open and not collapsible */
  alwaysOpen?: boolean;
  rightAction?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  badge,
  badgeColor = 'bg-gray-100 text-gray-600',
  children,
  defaultOpen = true,
  className = '',
  alwaysOpen = false,
  rightAction,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = alwaysOpen || isOpen;

  return (
    <div className={`mb-4 ${className}`}>
      <button
        type="button"
        onClick={() => !alwaysOpen && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-3 px-1 ${
          alwaysOpen ? 'cursor-default' : 'cursor-pointer active:bg-gray-50'
        } rounded-lg transition-colors`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <i className={`bi ${icon} text-primary-600 text-sm`} />
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">{title}</span>
          {badge !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          {!alwaysOpen && (
            <motion.i
              className="bi bi-chevron-down text-gray-400 text-sm"
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectionHeader;
