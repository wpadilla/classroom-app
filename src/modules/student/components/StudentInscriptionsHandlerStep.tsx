import React from 'react';
import { Badge } from 'reactstrap';
import { IClassroom } from '../../../models';
import '../StudentOnboarding.css';

type StudentInscriptionsHandlerStepVariant = 'history' | 'current' | 'enrollment';

interface StudentInscriptionsHandlerStepProps {
  variant: StudentInscriptionsHandlerStepVariant;
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
  initialEnrolledClassroomId?: string;
  errorMessage?: string;
  onToggleClassroom?: (classroomId: string) => void;
  onSelectClassroom?: (classroomId: string) => void;
}

const EMPTY_SELECTED_CLASSROOM_IDS: string[] = [];

const StudentInscriptionsHandlerStep: React.FC<StudentInscriptionsHandlerStepProps> = ({
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
  selectedClassroomIds = EMPTY_SELECTED_CLASSROOM_IDS,
  selectedClassroomId,
  initialEnrolledClassroomId,
  errorMessage,
  onToggleClassroom,
  onSelectClassroom,
}) => {
  const isHistoryVariant = variant === 'history';
  const orderedOptions = React.useMemo(
    () =>
      [...options].sort((classroomA, classroomB) => {
        const positionA = classroomA.programPosition ?? Number.MAX_SAFE_INTEGER;
        const positionB = classroomB.programPosition ?? Number.MAX_SAFE_INTEGER;

        if (positionA !== positionB) {
          return positionA - positionB;
        }

        if (!isHistoryVariant && initialEnrolledClassroomId) {
          const isSelectedA = classroomA.id === initialEnrolledClassroomId;
          const isSelectedB = classroomB.id === initialEnrolledClassroomId;
          if (isSelectedA || isSelectedB) {
            if (isSelectedA && !isSelectedB) return -1;
            if (isSelectedB && !isSelectedA) return 1;
          }
        }

        const startDateA = classroomA.startDate ? new Date(classroomA.startDate).getTime() : 0;
        const startDateB = classroomB.startDate ? new Date(classroomB.startDate).getTime() : 0;

        if (startDateA !== startDateB) {
          return startDateA - startDateB;
        }

        return `${classroomA.subject} ${classroomA.name}`.localeCompare(
          `${classroomB.subject} ${classroomB.name}`,
          'es'
        );
      }),
    [options]
  );
  const resolvedTitle = title || (isHistoryVariant ? 'Clases que ya tomaste' : 'Inscríbete en una clase');
  const resolvedDescription = description || (
    isHistoryVariant
      ? `Selecciona las clases que ya tomaste en el pasado. Actualmente solo tienes ${existingHistoryCount} registradas y ${currentEnrollmentCount} activas.`
      : 'Elige una sola clase para dejar lista tu inscripción actual.'
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

        {orderedOptions.length > 0 ? (
          <div className="student-onboarding-choice-grid">
            {orderedOptions.map((classroom) => {
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

                  <h6 className="student-onboarding-choice__title">{classroom.subject}</h6>
                  <p className="student-onboarding-choice__subtitle text-truncate text-ellipsis max-w-[250px]">{classroom.description}</p>
                  {/* <p className="student-onboarding-choice__detail">{formatSchedule(classroom)}</p> */}
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

export default StudentInscriptionsHandlerStep;
