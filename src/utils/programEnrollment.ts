import { IProgram } from '../models';
import {
  INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
  INTERNAL_FORMATION_PROGRAM_ID,
} from '../constants/onboarding.constants';
import { isInternalFormationEnrollment } from './onboarding';

export interface IEnrollmentProgramOption {
  id: string;
  value: string;
  label: string;
  isInternalFormation: boolean;
}

const normalizeProgramName = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

export const buildEnrollmentProgramOptions = (
  programs: IProgram[]
): IEnrollmentProgramOption[] => {
  const sortedPrograms = [...programs].sort((programA, programB) => {
    const programAIsInternal = programA.id === INTERNAL_FORMATION_PROGRAM_ID;
    const programBIsInternal = programB.id === INTERNAL_FORMATION_PROGRAM_ID;

    if (programAIsInternal !== programBIsInternal) {
      return programAIsInternal ? -1 : 1;
    }

    if (programA.isActive !== programB.isActive) {
      return programA.isActive ? -1 : 1;
    }

    return programA.name.localeCompare(programB.name, 'es');
  });

  if (sortedPrograms.length === 0) {
    return [
      {
        id: INTERNAL_FORMATION_PROGRAM_ID,
        value: INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
        label: INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
        isInternalFormation: true,
      },
    ];
  }

  return sortedPrograms.map((program) => ({
    id: program.id,
    value: program.name,
    label: program.name,
    isInternalFormation: program.id === INTERNAL_FORMATION_PROGRAM_ID,
  }));
};

export const normalizeEnrollmentTypeValue = (
  enrollmentType: string | undefined,
  options: IEnrollmentProgramOption[]
): string => {
  if (!enrollmentType) {
    return options[0]?.value || INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME;
  }

  const normalizedValue = normalizeProgramName(enrollmentType);
  const directMatch = options.find(
    (option) => normalizeProgramName(option.value) === normalizedValue
  );

  if (directMatch) {
    return directMatch.value;
  }

  if (isInternalFormationEnrollment(enrollmentType)) {
    return (
      options.find((option) => option.isInternalFormation)?.value ||
      INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME
    );
  }

  return enrollmentType;
};
