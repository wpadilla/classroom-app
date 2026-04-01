import { IProgram } from '../models';

const toValidDate = (value?: Date | string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isProgramEnrollmentActive = (
  program: Pick<IProgram, 'isActive' | 'startDate' | 'endDate'>,
  referenceDate: Date = new Date()
): boolean => {
  if (!program.isActive) {
    return false;
  }

  const startDate = toValidDate(program.startDate);
  const endDate = toValidDate(program.endDate);

  if (!startDate || !endDate) {
    return false;
  }

  const currentDate = new Date(referenceDate);
  currentDate.setHours(12, 0, 0, 0);

  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setHours(0, 0, 0, 0);

  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setHours(23, 59, 59, 999);

  return currentDate >= normalizedStartDate && currentDate <= normalizedEndDate;
};

export const formatProgramEnrollmentRange = (
  program: Pick<IProgram, 'startDate' | 'endDate'>
): string => {
  const startDate = toValidDate(program.startDate);
  const endDate = toValidDate(program.endDate);

  if (!startDate || !endDate) {
    return 'Período no configurado';
  }

  return `${startDate.toLocaleDateString('es-DO')} - ${endDate.toLocaleDateString('es-DO')}`;
};
