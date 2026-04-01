// GradeRing — SVG donut chart for displaying grades inline
// Pure SVG, no external library dependency

import React from 'react';

interface GradeRingProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const GRADE_COLORS = {
  excellent: { stroke: '#10b981', bg: '#d1fae5' }, // green
  good: { stroke: '#3b82f6', bg: '#dbeafe' },      // blue
  warning: { stroke: '#f59e0b', bg: '#fef3c7' },    // amber
  danger: { stroke: '#ef4444', bg: '#fee2e2' },      // red
};

const getGradeTheme = (value: number) => {
  if (value >= 90) return GRADE_COLORS.excellent;
  if (value >= 80) return GRADE_COLORS.good;
  if (value >= 70) return GRADE_COLORS.warning;
  return GRADE_COLORS.danger;
};

const GradeRing: React.FC<GradeRingProps> = ({
  value,
  size = 48,
  strokeWidth = 4,
  label,
  showValue = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const theme = getGradeTheme(value);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {showValue && (
        <span
          className="absolute font-bold"
          style={{
            fontSize: size * 0.28,
            color: theme.stroke,
            transform: 'translateY(0)',
            lineHeight: `${size}px`,
            width: size,
            textAlign: 'center',
          }}
        >
          {value.toFixed(0)}
        </span>
      )}
      {label && (
        <span className="text-xs text-gray-500 mt-0.5 text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
};

export default GradeRing;
