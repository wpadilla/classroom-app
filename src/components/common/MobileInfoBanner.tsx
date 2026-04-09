import React from 'react';
import { motion } from 'framer-motion';

export interface MobileInfoBannerProps {
  icon: string;
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  action?: React.ReactNode;
  className?: string;
}

const toneMap: Record<NonNullable<MobileInfoBannerProps['tone']>, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
};

const iconToneMap: Record<NonNullable<MobileInfoBannerProps['tone']>, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

const MobileInfoBanner: React.FC<MobileInfoBannerProps> = ({
  icon,
  title,
  description,
  tone = 'info',
  action,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`rounded-2xl border p-3 shadow-sm ${toneMap[tone]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconToneMap[tone]}`}>
          <i className={`bi ${icon} text-base`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold">{title}</p>
          {description ? (
            <p className="mb-0 text-sm leading-5 opacity-85">{description}</p>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileInfoBanner;
