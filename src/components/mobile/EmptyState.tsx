/**
 * EmptyState Component
 * 
 * Actionable empty states with call-to-action (not passive alerts).
 * Research: Actionable empty states increase task completion rates.
 * 
 * Features:
 * - Large icon (distinctive visual)
 * - Heading (2-4 words)
 * - Description (1 sentence)
 * - Primary CTA button
 * 
 * Usage:
 *   <EmptyState
 *     icon="bi-people"
 *     heading="Sin estudiantes"
 *     description="Inscribe estudiantes para comenzar a registrar asistencia."
 *     action={
 *       <ActionButton
 *         icon="bi-plus-circle"
 *         label="Inscribir Estudiante"
 *         onClick={openEnrollModal}
 *       />
 *     }
 *   />
 */

import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: string;
  heading: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        <i className={`${icon} text-6xl text-neutral-300`}></i>
      </div>

      {/* Heading */}
      <h3 className="text-xl font-bold text-neutral-700 mb-2">
        {heading}
      </h3>

      {/* Description */}
      <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>

      {/* Action */}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};
