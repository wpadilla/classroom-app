import { IClassroom, IStudentEvaluation, IUser } from '../../../models';
import { CERTIFICATE_PASSING_PERCENTAGE } from './certificate.constants';
import { CertificateData } from './certificate.types';

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
  extension: 'png' | 'pdf'
): string => {
  const safeStudentName = sanitizeFileName(studentName || 'estudiante');
  const safeSubjectName = sanitizeFileName(subjectName || 'materia');
  return `certificado-${safeStudentName}-${safeSubjectName}.${extension}`;
};

export const buildBulkCertificateFileName = (classroom: IClassroom): string => {
  const safeSubjectName = sanitizeFileName(classroom.subject || classroom.name || 'clase');
  const safeClassroomName = sanitizeFileName(classroom.name || 'grupo');
  return `certificados-${safeSubjectName}-${safeClassroomName}.pdf`;
};

export const isStudentEligibleForCertificate = (
  evaluation?: Pick<IStudentEvaluation, 'status' | 'percentage'> | null
): boolean => {
  if (!evaluation) {
    return false;
  }

  return evaluation.status === 'evaluated' && (evaluation.percentage || 0) >= CERTIFICATE_PASSING_PERCENTAGE;
};

export const buildCertificateData = ({
  classroom,
  student,
  teacher,
}: {
  classroom: IClassroom;
  student: IUser;
  teacher?: Pick<IUser, 'firstName' | 'lastName'> | null;
}): CertificateData => {
  const data =  {
    id: student.id,
    classroomName: classroom.name?.trim() || classroom.subject?.trim() || 'Clase',
    subjectName: classroom.subject?.trim() || classroom.name?.trim() || 'Materia',
    completionText: buildCompletionText(classroom) || classroom.subject?.trim() || 'Materia',
    studentName: getUserFullName(student) || 'Estudiante',
    teacherName: (getUserFullName(teacher) || 'Maestro no asignado').toLocaleUpperCase('es'),
  }
  console.log('Building certificate data with:', data, { classroom, student, teacher });

  return data;
};
