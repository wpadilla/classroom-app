import React from 'react';

type ManagementTone = 'primary' | 'whatsapp' | 'analytics';

interface TopProgressBarProps {
  active: boolean;
  label?: string;
  tone?: ManagementTone;
}

export const TopProgressBar: React.FC<TopProgressBarProps> = ({
  active,
  label = 'Actualizando…',
  tone = 'primary',
}) => {
  if (!active) return null;

  return (
    <div
      className={`management-top-progress management-top-progress--${tone}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="management-top-progress__track" aria-hidden="true">
        <span className="management-top-progress__bar" />
      </div>
      <span className="management-top-progress__label">{label}</span>
    </div>
  );
};

interface ManagementHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  tone?: ManagementTone;
  backLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export const ManagementHero: React.FC<ManagementHeroProps> = ({
  eyebrow,
  title,
  description,
  icon,
  tone = 'primary',
  backLabel,
  onBack,
  actions,
  meta,
}) => (
  <header className={`management-hero management-hero--${tone}`}>
    <div className="management-hero__content">
      {onBack && backLabel ? (
        <button type="button" className="management-hero__back" onClick={onBack}>
          <i className="bi bi-arrow-left" aria-hidden="true" />
          {backLabel}
        </button>
      ) : null}

      <div className="management-hero__heading">
        <span className="management-hero__icon" aria-hidden="true">
          <i className={`bi ${icon}`} />
        </span>
        <div className="management-hero__copy">
          <p className="management-hero__eyebrow">{eyebrow}</p>
          <h1 className="management-hero__title">{title}</h1>
          <p className="management-hero__description">{description}</p>
          {meta ? <div className="management-hero__meta">{meta}</div> : null}
        </div>
      </div>
    </div>

    {actions ? <div className="management-hero__actions">{actions}</div> : null}
  </header>
);

export const ManagementSkeleton: React.FC<{ rows?: number; compact?: boolean }> = ({
  rows = 3,
  compact = false,
}) => (
  <div className={`management-skeleton ${compact ? 'management-skeleton--compact' : ''}`} aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <span key={index} className="management-skeleton__row" />
    ))}
  </div>
);

