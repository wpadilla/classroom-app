import React from 'react';
import { motion } from 'framer-motion';
import StatStrip, { StatItem } from '../student/StatStrip';

export interface MobileHeroBadge {
  label: string;
  icon?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface MobileHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
  badges?: MobileHeroBadge[];
  stats?: StatItem[];
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

const badgeToneMap: Record<NonNullable<MobileHeroBadge['tone']>, string> = {
  info: 'bg-white/12 text-white border-white/15',
  success: 'bg-emerald-400/15 text-emerald-100 border-emerald-300/20',
  warning: 'bg-amber-300/15 text-amber-100 border-amber-300/20',
  danger: 'bg-rose-400/15 text-rose-100 border-rose-300/20',
  neutral: 'bg-slate-200/10 text-slate-100 border-white/10',
};

const MobileHero: React.FC<MobileHeroProps> = ({
  title,
  description,
  eyebrow,
  backLabel,
  onBack,
  badges = [],
  stats = [],
  actions,
  aside,
  className = '',
}) => {
  return (
    <div className={className}>
      {onBack && backLabel ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <i className="bi bi-arrow-left text-sm" />
          {backLabel}
        </button>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-4 text-white shadow-[0_18px_60px_rgba(15,23,42,0.28)] sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/80">
                {eyebrow}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={`${badge.label}-${badge.icon || 'plain'}`}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    badgeToneMap[badge.tone || 'neutral']
                  }`}
                >
                  {badge.icon ? <i className={`bi ${badge.icon} text-[10px]`} /> : null}
                  {badge.label}
                </span>
              ))}
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {title}
            </h1>

            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200/90 sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>

          {aside ? (
            <div className="self-start rounded-[24px] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              {aside}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/10 p-2 backdrop-blur-sm">
            <StatStrip
              stats={stats}
              columns={stats.length >= 6 ? 3 : 2}
            />
          </div>
        ) : null}

        {actions ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        ) : null}
      </motion.section>
    </div>
  );
};

export default MobileHero;
