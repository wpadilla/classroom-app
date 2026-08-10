import { IClassroom, IClassroomHistory, IStudentEvaluation, IUser } from '../../../models';
import {
  CERTIFICATE_OUTSTANDING_PERCENTAGE,
  CERTIFICATE_PASSING_PERCENTAGE,
} from './certificate.constants';
import { CertificateData, CertificateVariant } from './certificate.types';

export const getUserFullName = (user?: Pick<IUser, 'firstName' | 'lastName'> | null): string => {
  if (!user) {
    return '';
  }

  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
};


const buildCompletionText = (classroom: IClassroom): string => {
  const subject = classroom.subject?.trim() || '';
  const accreditation = (classroom.accreditation || '').trim();

  return [subject, accreditation]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const buildHistoryCompletionText = (
  history: IClassroomHistory,
  classroom?: IClassroom | null
): string => {
  const subject = classroom?.subject?.trim() || history.classroomName?.trim() || '';
  const accreditation = (classroom?.accreditation || '').trim();

  return [subject, accreditation]
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const sanitizeFileName = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
};

export const buildCertificateFileName = (
  studentName: string,
  subjectName: string,
  extension: 'png' | 'pdf',
  variant: CertificateVariant = 'regular'
): string => {
  const safeStudentName = sanitizeFileName(studentName || 'estudiante');
  const safeSubjectName = sanitizeFileName(subjectName || 'materia');
  const prefix = variant === 'outstanding' ? 'certificado-meritorio' : 'certificado';
  return `${prefix}-${safeStudentName}-${safeSubjectName}.${extension}`;
};

export const buildBulkCertificateFileName = (
  classroom: IClassroom,
  includeOutstandingCertificates = false
): string => {
  const safeSubjectName = sanitizeFileName(classroom.subject || classroom.name || 'clase');
  const safeClassroomName = sanitizeFileName(classroom.name || 'grupo');
  const prefix = includeOutstandingCertificates ? 'certificados-con-meritorios' : 'certificados';
  return `${prefix}-${safeSubjectName}-${safeClassroomName}.pdf`;
};

export const isStudentEligibleForCertificate = (
  evaluation?: Pick<IStudentEvaluation, 'status' | 'percentage'> | null
): boolean => {
  if (!evaluation) {
    return false;
  }

  return evaluation.status === 'evaluated' && (evaluation.percentage || 0) >= CERTIFICATE_PASSING_PERCENTAGE;
};

export const isStudentOutstandingForCertificate = (
  evaluation?: Pick<IStudentEvaluation, 'status' | 'percentage'> | null
): boolean => {
  if (!isStudentEligibleForCertificate(evaluation)) {
    return false;
  }

  return (evaluation?.percentage || 0) >= CERTIFICATE_OUTSTANDING_PERCENTAGE;
};

export const isHistoryEntryEligibleForCertificate = (
  history?: Pick<IClassroomHistory, 'role' | 'status' | 'finalGrade'> | null
): boolean => {
  if (!history || history.role !== 'student') {
    return false;
  }

  return history.status === 'completed' && (history.finalGrade || 0) >= CERTIFICATE_PASSING_PERCENTAGE;
};

export const isHistoryEntryOutstandingForCertificate = (
  history?: Pick<IClassroomHistory, 'role' | 'status' | 'finalGrade'> | null
): boolean => {
  if (!isHistoryEntryEligibleForCertificate(history)) {
    return false;
  }

  return (history?.finalGrade || 0) >= CERTIFICATE_OUTSTANDING_PERCENTAGE;
};

export const buildCertificateData = ({
  classroom,
  student,
  teacher,
  variant = 'regular',
}: {
  classroom: IClassroom;
  student: IUser;
  teacher?: Pick<IUser, 'firstName' | 'lastName'> | null;
  variant?: CertificateVariant;
}): CertificateData => {
  return {
    id: `${student.id}-${variant}`,
    variant,
    classroomName: classroom.name?.trim() || classroom.subject?.trim() || 'Clase',
    subjectName: classroom.subject?.trim() || classroom.name?.trim() || 'Materia',
    completionText: buildCompletionText(classroom) || classroom.subject?.trim() || 'Materia',
    studentName: getUserFullName(student) || 'Estudiante',
    teacherName: '',
    // teacherName: (getUserFullName(teacher) || 'Maestro no asignado').toLocaleUpperCase('es'),
  };
};

export const buildHistoryCertificateData = ({
  history,
  classroom,
  student,
  teacher,
  variant = 'regular',
}: {
  history: IClassroomHistory;
  classroom?: IClassroom | null;
  student: Pick<IUser, 'id' | 'firstName' | 'lastName'>;
  teacher?: Pick<IUser, 'firstName' | 'lastName'> | null;
  variant?: CertificateVariant;
}): CertificateData => {
  return {
    id: `${history.classroomId}-${student.id}-${variant}`,
    variant,
    classroomName: classroom?.name?.trim() || history.classroomName?.trim() || classroom?.subject?.trim() || 'Clase',
    subjectName: classroom?.subject?.trim() || history.classroomName?.trim() || classroom?.name?.trim() || 'Materia',
    completionText:
      buildHistoryCompletionText(history, classroom) ||
      history.classroomName?.trim() ||
      history.programName?.trim() ||
      'Materia',
    studentName: getUserFullName(student) || 'Estudiante',
    teacherName: (getUserFullName(teacher) || 'Maestro no asignado').toLocaleUpperCase('es'),
  };
};
