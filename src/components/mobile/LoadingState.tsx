/**
 * LoadingState Component (Skeleton Screens)
 * 
 * Skeleton screens reduce perceived load time by 20-30% vs spinners.
 * Matches layout of loaded content to avoid layout shift.
 * 
 * Variants:
 * - studentCards: Student list skeleton
 * - table: Table rows skeleton
 * - form: Form fields skeleton
 * - stats: Dashboard stats cards skeleton
 * 
 * Usage:
 *   {loading ? (
 *     <LoadingState variant="studentCards" count={5} />
 *   ) : (
 *     students.map(s => <StudentCard student={s} />)
 *   )}
 */

import React from 'react';

export type LoadingStateVariant = 'studentCards' | 'table' | 'form' | 'stats';

export interface LoadingStateProps {
  variant?: LoadingStateVariant;
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'studentCards',
  count = 3,
  className = '',
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderVariant = () => {
    switch (variant) {
      case 'studentCards':
        return items.map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              {/* Avatar skeleton */}
              <div className="w-12 h-12 rounded-full bg-neutral-200"></div>

              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>

              {/* Badge skeleton */}
              <div className="w-20 h-6 bg-neutral-200 rounded"></div>
            </div>
          </div>
        ));

      case 'table':
        return (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {items.map((i) => (
              <div
                key={i}
                className="border-b border-neutral-200 p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
                <div className="h-12 bg-neutral-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {renderVariant()}
    </div>
  );
};
