import {
  AcademicLevel,
  DocumentType,
  IClassroom,
  IStudentEvaluation,
  IUser,
  UserRole,
} from '../../../models';
import { normalizeTextForSearch } from '../../../utils/searchUtils';
import { calculateAttendancePercentage } from '../../../services/evaluation/evaluation-score.utils';

export type AcademicRelationship =
  | 'student-current-or-history'
  | 'student-current'
  | 'student-history'
  | 'student-completed'
  | 'student-failed'
  | 'student-dropped'
  | 'teacher-current-or-history'
  | 'teacher-current'
  | 'teacher-history'
  | 'any-involvement';

export type PerformanceOrder =
  | 'default'
  | 'index-desc'
  | 'index-asc'
  | 'completed-desc'
  | 'active-enrollments-desc'
  | 'newest';

export interface UserFilters {
  role: UserRole | 'all';
  isActive: 'true' | 'false' | 'all';
  enrollmentType: string | 'all';
  historyStatus: 'all' | 'no-history' | 'has-history';
  activeEnrollments: 'all' | 'zero' | 'one-or-more';
  programId: string;
  classroomId: string;
  missingClassroomId: string;
  academicRelationship: AcademicRelationship;
  historyOutcome: 'all' | 'completed' | 'failed' | 'dropped';
  gradeAvailability: 'all' | 'with-grade' | 'without-grade';
  minGeneralIndex: string;
  maxGeneralIndex: string;
  minAttendance: string;
  maxAttendance: string;
  minActiveEnrollments: string;
  maxActiveEnrollments: string;
  minCompletedClassrooms: string;
  maxCompletedClassrooms: string;
  academicLevel: AcademicLevel | 'all';
  documentType: DocumentType | 'all';
  country: string;
  profileStatus: 'all' | 'complete' | 'incomplete';
  onboardingStatus: 'all' | 'completed' | 'pending';
  createdFrom: string;
  createdTo: string;
  orderBy: PerformanceOrder;
}

export const defaultUserFilters: UserFilters = {
  role: 'all',
  isActive: 'all',
  enrollmentType: 'all',
  historyStatus: 'all',
  activeEnrollments: 'all',
  programId: '',
  classroomId: '',
  missingClassroomId: '',
  academicRelationship: 'student-current-or-history',
  historyOutcome: 'all',
  gradeAvailability: 'all',
  minGeneralIndex: '',
  maxGeneralIndex: '',
  minAttendance: '',
  maxAttendance: '',
  minActiveEnrollments: '',
  maxActiveEnrollments: '',
  minCompletedClassrooms: '',
  maxCompletedClassrooms: '',
  academicLevel: 'all',
  documentType: 'all',
  country: '',
  profileStatus: 'all',
  onboardingStatus: 'all',
  createdFrom: '',
  createdTo: '',
  orderBy: 'default',
};

export interface UserAcademicMetrics {
  generalIndex: number | null;
  gradedClassrooms: number;
  attendanceRate: number | null;
  activeEnrollments: number;
  completedClassrooms: number;
  failedClassrooms: number;
  droppedClassrooms: number;
  teachingClassrooms: number;
  taughtClassrooms: number;
}

interface FilterUsersOptions {
  users: IUser[];
  classrooms: IClassroom[];
  evaluations: IStudentEvaluation[];
  filters: UserFilters;
  searchQuery?: string;
}

const parseOptionalNumber = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidGrade = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

const getTime = (value: Date | undefined): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const buildEvaluationsByStudent = (
  evaluations: IStudentEvaluation[]
): Map<string, IStudentEvaluation[]> => {
  const result = new Map<string, IStudentEvaluation[]>();
  evaluations.forEach((evaluation) => {
    const current = result.get(evaluation.studentId) || [];
    current.push(evaluation);
    result.set(evaluation.studentId, current);
  });
  return result;
};

/**
 * The general index combines finalized history grades and currently evaluated
 * classrooms. A historical grade wins when both sources contain the same class,
 * preventing a finalized class from being counted twice.
 */
export const getUserAcademicMetrics = (
  user: IUser,
  evaluations: IStudentEvaluation[] = []
): UserAcademicMetrics => {
  const gradesByClassroom = new Map<string, number>();

  evaluations.forEach((evaluation) => {
    if (evaluation.status === 'evaluated' && isValidGrade(evaluation.percentage)) {
      gradesByClassroom.set(evaluation.classroomId, evaluation.percentage);
    }
  });

  (user.completedClassrooms || []).forEach((history) => {
    if (isValidGrade(history.finalGrade)) {
      gradesByClassroom.set(history.classroomId, history.finalGrade);
    }
  });

  const grades = Array.from(gradesByClassroom.values());
  const attendanceRecords = evaluations.flatMap((evaluation) => evaluation.attendanceRecords || []);

  return {
    generalIndex:
      grades.length > 0
        ? grades.reduce((total, grade) => total + grade, 0) / grades.length
        : null,
    gradedClassrooms: grades.length,
    attendanceRate:
      attendanceRecords.length > 0
        ? calculateAttendancePercentage(attendanceRecords)
        : null,
    activeEnrollments: new Set(user.enrolledClassrooms || []).size,
    completedClassrooms: (user.completedClassrooms || []).filter(
      (history) => history.status === 'completed'
    ).length,
    failedClassrooms: (user.completedClassrooms || []).filter(
      (history) => history.status === 'failed'
    ).length,
    droppedClassrooms: (user.completedClassrooms || []).filter(
      (history) => history.status === 'dropped'
    ).length,
    teachingClassrooms: new Set(user.teachingClassrooms || []).size,
    taughtClassrooms: (user.taughtClassrooms || []).length,
  };
};

const isProfileComplete = (user: IUser): boolean =>
  Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.phone?.trim() &&
      user.documentType &&
      user.documentNumber?.trim() &&
      user.country?.trim() &&
      user.churchName?.trim() &&
      user.academicLevel &&
      user.enrollmentType?.trim()
  );

const isWithinOptionalRange = (
  value: number,
  minimum: string,
  maximum: string
): boolean => {
  const min = parseOptionalNumber(minimum);
  const max = parseOptionalNumber(maximum);
  return (min === null || value >= min) && (max === null || value <= max);
};

const matchesAcademicRelationship = (
  user: IUser,
  classrooms: IClassroom[],
  filters: UserFilters
): boolean => {
  const hasScope = Boolean(filters.classroomId || filters.programId);
  const hasExplicitRelationship =
    filters.academicRelationship !== defaultUserFilters.academicRelationship;

  if (!hasScope && !hasExplicitRelationship) return true;

  const classroomById = new Map(classrooms.map((classroom) => [classroom.id, classroom]));
  const classroomMatchesScope = (classroomId: string, programId?: string): boolean => {
    if (filters.classroomId) return classroomId === filters.classroomId;
    if (filters.programId) {
      return programId === filters.programId || classroomById.get(classroomId)?.programId === filters.programId;
    }
    return true;
  };

  const scopedClassrooms = classrooms.filter((classroom) =>
    classroomMatchesScope(classroom.id, classroom.programId)
  );
  const currentStudent =
    (user.enrolledClassrooms || []).some((id) => classroomMatchesScope(id)) ||
    scopedClassrooms.some((classroom) => classroom.studentIds?.includes(user.id));
  const studentHistory = (user.completedClassrooms || []).filter((history) =>
    classroomMatchesScope(history.classroomId, history.programId)
  );
  const currentTeacher =
    (user.teachingClassrooms || []).some((id) => classroomMatchesScope(id)) ||
    scopedClassrooms.some((classroom) => classroom.teacherId === user.id);
  const teacherHistory = (user.taughtClassrooms || []).filter((history) =>
    classroomMatchesScope(history.classroomId, history.programId)
  );

  switch (filters.academicRelationship) {
    case 'student-current-or-history':
      return currentStudent || studentHistory.length > 0;
    case 'student-current':
      return currentStudent;
    case 'student-history':
      return studentHistory.length > 0;
    case 'student-completed':
      return studentHistory.some((history) => history.status === 'completed');
    case 'student-failed':
      return studentHistory.some((history) => history.status === 'failed');
    case 'student-dropped':
      return studentHistory.some((history) => history.status === 'dropped');
    case 'teacher-current-or-history':
      return currentTeacher || teacherHistory.length > 0;
    case 'teacher-current':
      return currentTeacher;
    case 'teacher-history':
      return teacherHistory.length > 0;
    case 'any-involvement':
      return currentStudent || studentHistory.length > 0 || currentTeacher || teacherHistory.length > 0;
  }
};

const isMissingSelectedClassroom = (user: IUser, classroomId: string): boolean => {
  if (!classroomId) return false;

  return !(user.completedClassrooms || []).some(
    (history) => history.classroomId === classroomId && history.status === 'completed'
  );
};

const matchesSearch = (user: IUser, query: string): boolean => {
  const normalizedQuery = normalizeTextForSearch(query);
  if (!normalizedQuery) return true;

  return [
    user.firstName,
    user.lastName,
    `${user.firstName} ${user.lastName}`,
    user.phone,
    user.email,
    user.documentNumber,
    user.churchName,
    user.pastor?.fullName,
    user.pastor?.phone,
  ].some((value) => normalizeTextForSearch(value || '').includes(normalizedQuery));
};

export const filterAndSortUsers = ({
  users,
  classrooms,
  evaluations,
  filters,
  searchQuery = '',
}: FilterUsersOptions): IUser[] => {
  const evaluationsByStudent = buildEvaluationsByStudent(evaluations);
  const metricsByUser = new Map(
    users.map((user) => [
      user.id,
      getUserAcademicMetrics(user, evaluationsByStudent.get(user.id) || []),
    ])
  );

  const filtered = users.filter((user) => {
    const metrics = metricsByUser.get(user.id)!;

    if (filters.role === 'teacher' ? !user.isTeacher : filters.role !== 'all' && user.role !== filters.role) {
      return false;
    }
    if (filters.isActive !== 'all' && user.isActive !== (filters.isActive === 'true')) return false;
    if (filters.enrollmentType !== 'all' && user.enrollmentType !== filters.enrollmentType) return false;
    if (filters.academicLevel !== 'all' && user.academicLevel !== filters.academicLevel) return false;
    if (filters.documentType !== 'all' && user.documentType !== filters.documentType) return false;
    if (filters.country && user.country !== filters.country) return false;

    const hasStudentHistory = (user.completedClassrooms || []).length > 0;
    const hasCurrentEnrollment = metrics.activeEnrollments > 0;
    if (filters.historyStatus === 'no-history' && (hasStudentHistory || hasCurrentEnrollment)) return false;
    if (filters.historyStatus === 'has-history' && !hasStudentHistory && !hasCurrentEnrollment) return false;
    if (filters.activeEnrollments === 'zero' && hasCurrentEnrollment) return false;
    if (filters.activeEnrollments === 'one-or-more' && !hasCurrentEnrollment) return false;

    if (
      filters.historyOutcome !== 'all' &&
      !(user.completedClassrooms || []).some((history) => history.status === filters.historyOutcome)
    ) {
      return false;
    }

    if (!matchesAcademicRelationship(user, classrooms, filters)) return false;
    if (
      filters.missingClassroomId &&
      !isMissingSelectedClassroom(user, filters.missingClassroomId)
    ) {
      return false;
    }

    if (filters.gradeAvailability === 'with-grade' && metrics.generalIndex === null) return false;
    if (filters.gradeAvailability === 'without-grade' && metrics.generalIndex !== null) return false;
    if (
      metrics.generalIndex !== null &&
      !isWithinOptionalRange(metrics.generalIndex, filters.minGeneralIndex, filters.maxGeneralIndex)
    ) {
      return false;
    }
    if (
      metrics.generalIndex === null &&
      (filters.minGeneralIndex !== '' || filters.maxGeneralIndex !== '')
    ) {
      return false;
    }
    if (
      metrics.attendanceRate !== null &&
      !isWithinOptionalRange(metrics.attendanceRate, filters.minAttendance, filters.maxAttendance)
    ) {
      return false;
    }
    if (
      metrics.attendanceRate === null &&
      (filters.minAttendance !== '' || filters.maxAttendance !== '')
    ) {
      return false;
    }
    if (!isWithinOptionalRange(metrics.activeEnrollments, filters.minActiveEnrollments, filters.maxActiveEnrollments)) {
      return false;
    }
    const historyCount = (user.completedClassrooms || []).length;
    if (!isWithinOptionalRange(historyCount, filters.minCompletedClassrooms, filters.maxCompletedClassrooms)) {
      return false;
    }

    if (filters.profileStatus === 'complete' && !isProfileComplete(user)) return false;
    if (filters.profileStatus === 'incomplete' && isProfileComplete(user)) return false;
    if (filters.onboardingStatus !== 'all' && user.role !== 'student') return false;
    if (filters.onboardingStatus === 'completed' && user.once?.onboarding !== true) return false;
    if (filters.onboardingStatus === 'pending' && user.once?.onboarding === true) return false;

    const createdAt = getTime(user.createdAt);
    if (filters.createdFrom && createdAt < new Date(`${filters.createdFrom}T00:00:00`).getTime()) return false;
    if (filters.createdTo && createdAt > new Date(`${filters.createdTo}T23:59:59.999`).getTime()) return false;

    return matchesSearch(user, searchQuery);
  });

  return [...filtered].sort((left, right) => {
    const leftMetrics = metricsByUser.get(left.id)!;
    const rightMetrics = metricsByUser.get(right.id)!;

    switch (filters.orderBy) {
      case 'index-desc':
        return (rightMetrics.generalIndex ?? -1) - (leftMetrics.generalIndex ?? -1);
      case 'index-asc':
        return (leftMetrics.generalIndex ?? 101) - (rightMetrics.generalIndex ?? 101);
      case 'completed-desc':
        return rightMetrics.completedClassrooms - leftMetrics.completedClassrooms;
      case 'active-enrollments-desc':
        return rightMetrics.activeEnrollments - leftMetrics.activeEnrollments;
      case 'newest':
        return getTime(right.createdAt) - getTime(left.createdAt);
      default:
        return 0;
    }
  });
};

export const countActiveUserFilters = (filters: UserFilters): number => {
  let count = 0;
  if (filters.role !== 'all') count++;
  if (filters.isActive !== 'all') count++;
  if (filters.enrollmentType !== 'all') count++;
  if (filters.historyStatus !== 'all') count++;
  if (filters.activeEnrollments !== 'all') count++;
  if (filters.programId || filters.classroomId) count++;
  if (filters.missingClassroomId) count++;
  if (filters.academicRelationship !== defaultUserFilters.academicRelationship) count++;
  if (filters.historyOutcome !== 'all') count++;
  if (filters.gradeAvailability !== 'all') count++;
  if (filters.minGeneralIndex || filters.maxGeneralIndex) count++;
  if (filters.minAttendance || filters.maxAttendance) count++;
  if (filters.minActiveEnrollments || filters.maxActiveEnrollments) count++;
  if (filters.minCompletedClassrooms || filters.maxCompletedClassrooms) count++;
  if (filters.academicLevel !== 'all') count++;
  if (filters.documentType !== 'all') count++;
  if (filters.country) count++;
  if (filters.profileStatus !== 'all') count++;
  if (filters.onboardingStatus !== 'all') count++;
  if (filters.createdFrom || filters.createdTo) count++;
  if (filters.orderBy !== 'default') count++;
  return count;
};
