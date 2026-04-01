import React from 'react';
import { Badge } from 'reactstrap';
import { IClassroom } from '../../../models';
import '../StudentOnboarding.css';

type InternalFormationClassStepVariant = 'history' | 'current' | 'enrollment';

interface InternalFormationClassStepProps {
  variant: InternalFormationClassStepVariant;
  programName: string;
  options: IClassroom[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  badgeLabel?: string;
  selectedLabel?: string;
  unselectedLabel?: string;
  existingHistoryCount?: number;
  currentEnrollmentCount?: number;
  selectedClassroomIds?: string[];
  selectedClassroomId?: string;
  errorMessage?: string;
  onToggleClassroom?: (classroomId: string) => void;
  onSelectClassroom?: (classroomId: string) => void;
}

const formatSchedule = (classroom: IClassroom): string => {
  if (!classroom.schedule?.dayOfWeek || !classroom.schedule?.time) {
    return 'Horario por confirmar';
  }

  return `${classroom.schedule.dayOfWeek} · ${classroom.schedule.time}`;
};

const InternalFormationClassStep: React.FC<InternalFormationClassStepProps> = ({
  variant,
  programName,
  options,
  title,
  description,
  emptyMessage,
  badgeLabel,
  selectedLabel,
  unselectedLabel,
  existingHistoryCount = 0,
  currentEnrollmentCount = 0,
  selectedClassroomIds = [],
  selectedClassroomId,
  errorMessage,
  onToggleClassroom,
  onSelectClassroom,
}) => {
  const isHistoryVariant = variant === 'history';
  const resolvedTitle = title || (isHistoryVariant ? 'Clases ya impartidas' : 'Clase para inscripción');
  const resolvedDescription = description || (
    isHistoryVariant
      ? `Solo verás clases que aún no están en tu historial ni entre tus inscripciones activas. Ya tienes ${existingHistoryCount} registradas y ${currentEnrollmentCount} activas.`
      : 'Elige una sola clase activa para dejar lista tu inscripción actual.'
  );
  const resolvedBadgeLabel = badgeLabel || (isHistoryVariant ? 'Selección múltiple' : 'Selección única');
  const resolvedSelectedLabel = selectedLabel || (isHistoryVariant ? 'Se agregará al historial' : 'Inscripción seleccionada');
  const resolvedUnselectedLabel = unselectedLabel || (isHistoryVariant ? 'Agregar al historial' : 'Disponible');
  const resolvedEmptyMessage = emptyMessage || (
    isHistoryVariant
      ? 'No hay clases pendientes por agregar al historial.'
      : 'No hay clases activas disponibles por ahora. Puedes finalizar y coordinar la inscripción después.'
  );

  return (
    <div className="student-onboarding-step-layout">
      <div className="student-onboarding-step-card">
        <div className="student-onboarding-step-card__header">
          <div>
            <p className="student-onboarding-step-card__eyebrow">{programName}</p>
            <h5 className="student-onboarding-step-card__title">{resolvedTitle}</h5>
            <p className="student-onboarding-step-card__text">{resolvedDescription}</p>
          </div>
          <Badge color={isHistoryVariant ? 'dark' : 'primary'} pill>
            {resolvedBadgeLabel}
          </Badge>
        </div>

        {options.length > 0 ? (
          <div className="student-onboarding-choice-grid">
            {options.map((classroom) => {
              const isSelected = isHistoryVariant
                ? selectedClassroomIds.includes(classroom.id)
                : selectedClassroomId === classroom.id;

              return (
                <button
                  key={classroom.id}
                  type="button"
                  className={`student-onboarding-choice group ${isSelected ? 'is-selected' : ''}`}
                  onClick={() =>
                    isHistoryVariant
                      ? onToggleClassroom?.(classroom.id)
                      : onSelectClassroom?.(classroom.id)
                  }
                >
                  <span className={`student-onboarding-choice__indicator ${isSelected ? 'is-active' : ''}`}>
                    <i className="bi bi-check-lg"></i>
                  </span>

                  <div className="student-onboarding-choice__meta">
                    <span className="student-onboarding-choice__pill">
                      {isHistoryVariant
                        ? isSelected
                          ? resolvedSelectedLabel
                          : resolvedUnselectedLabel
                        : isSelected
                          ? resolvedSelectedLabel
                          : resolvedUnselectedLabel}
                    </span>
                    {classroom.isActive && !isHistoryVariant && (
                      <span className="student-onboarding-choice__pill success">Activa</span>
                    )}
                    {!classroom.isActive && (
                      <span className="student-onboarding-choice__pill muted">Cerrada</span>
                    )}
                  </div>

                  <h6 className="student-onboarding-choice__title">{classroom.name}</h6>
                  <p className="student-onboarding-choice__subtitle">{classroom.subject}</p>
                  <p className="student-onboarding-choice__detail">{formatSchedule(classroom)}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="student-onboarding-empty">
            <i className={`bi ${isHistoryVariant ? 'bi-journal-check' : 'bi-calendar2-x'}`}></i>
            <p className="mb-0">{resolvedEmptyMessage}</p>
          </div>
        )}

        {errorMessage && <p className="student-onboarding-error mt-3 mb-0">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default InternalFormationClassStep;
