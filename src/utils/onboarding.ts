import { EnrollmentType, IAuthUser } from '../models';
import { INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME } from '../constants/onboarding.constants';

const normalizeEnrollmentName = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

const INTERNAL_FORMATION_ALIASES = new Set([
  normalizeEnrollmentName('InternalFormation'),
  normalizeEnrollmentName(INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME),
  normalizeEnrollmentName('Formacion Oasis de Amor'),
  normalizeEnrollmentName('Formacion Interna'),
]);

export const needsStudentOnboarding = (
  user?: Pick<IAuthUser, 'role' | 'once'> | null
): boolean => user?.role === 'student' && user.once?.onboarding !== true;

export const isInternalFormationEnrollment = (
  enrollmentType?: EnrollmentType
): boolean => INTERNAL_FORMATION_ALIASES.has(normalizeEnrollmentName(enrollmentType));
