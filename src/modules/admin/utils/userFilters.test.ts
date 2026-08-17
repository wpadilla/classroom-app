import { IClassroom, IClassroomHistory, IStudentEvaluation, IUser } from '../../../models';
import {
  defaultUserFilters,
  filterAndSortUsers,
  getUserAcademicMetrics,
  UserFilters,
} from './userFilters';

const now = new Date('2026-08-10T12:00:00Z');

const createHistory = (
  classroomId: string,
  programId: string,
  status: IClassroomHistory['status'] = 'completed',
  finalGrade?: number,
  role: IClassroomHistory['role'] = 'student'
): IClassroomHistory => ({
  classroomId,
  classroomName: classroomId,
  programId,
  programName: programId,
  role,
  enrollmentDate: now,
  completionDate: now,
  status,
  finalGrade,
});

const createUser = (id: string, overrides: Partial<IUser> = {}): IUser => ({
  id,
  firstName: id,
  lastName: 'Prueba',
  phone: '8095550000',
  password: 'secret',
  role: 'student',
  isTeacher: false,
  isActive: true,
  createdAt: now,
  updatedAt: now,
  enrolledClassrooms: [],
  completedClassrooms: [],
  teachingClassrooms: [],
  taughtClassrooms: [],
  ...overrides,
});

const createClassroom = (
  id: string,
  programId: string,
  overrides: Partial<IClassroom> = {}
): IClassroom => ({
  id,
  programId,
  name: id,
  subject: id,
  teacherId: '',
  studentIds: [],
  modules: [],
  isActive: true,
  evaluationCriteria: {
    questionnaires: 25,
    attendance: 25,
    participation: 25,
    participationPointsPerModule: 1,
    finalExam: 25,
    customCriteria: [],
    participationRecords: [],
  },
  startDate: now,
  materialPrice: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createEvaluation = (
  studentId: string,
  classroomId: string,
  percentage: number,
  status: IStudentEvaluation['status'] = 'evaluated'
): IStudentEvaluation => ({
  id: `${studentId}-${classroomId}`,
  studentId,
  classroomId,
  moduleId: '',
  participationRecords: [],
  scores: {
    questionnaires: 0,
    attendance: 0,
    participation: 0,
    finalExam: 0,
    customScores: [],
  },
  attendanceRecords: [],
  participationPoints: 0,
  totalScore: percentage,
  percentage,
  status,
  createdAt: now,
  updatedAt: now,
});

const withFilters = (overrides: Partial<UserFilters>): UserFilters => ({
  ...defaultUserFilters,
  ...overrides,
});

describe('userFilters', () => {
  test('combina evaluaciones actuales e historial sin duplicar una clase finalizada', () => {
    const user = createUser('student-1', {
      completedClassrooms: [createHistory('class-1', 'program-1', 'completed', 90)],
    });
    const evaluations = [
      createEvaluation(user.id, 'class-1', 50),
      createEvaluation(user.id, 'class-2', 80),
      createEvaluation(user.id, 'class-3', 100, 'in-progress'),
    ];

    const metrics = getUserAcademicMetrics(user, evaluations);

    expect(metrics.generalIndex).toBe(85);
    expect(metrics.gradedClassrooms).toBe(2);
  });

  test('encuentra estudiantes actuales desde ambos lados de la relación de clase', () => {
    const referencedByUser = createUser('by-user', { enrolledClassrooms: ['class-1'] });
    const referencedByClassroom = createUser('by-classroom');
    const unrelated = createUser('unrelated');
    const classroom = createClassroom('class-1', 'program-1', {
      studentIds: [referencedByClassroom.id],
    });

    const result = filterAndSortUsers({
      users: [referencedByUser, referencedByClassroom, unrelated],
      classrooms: [classroom],
      evaluations: [],
      filters: withFilters({
        classroomId: classroom.id,
        academicRelationship: 'student-current',
      }),
    });

    expect(result.map((user) => user.id)).toEqual(['by-user', 'by-classroom']);
  });

  test('filtra historial estudiantil por programa aunque la clase ya no exista', () => {
    const formerStudent = createUser('former-student', {
      completedClassrooms: [createHistory('archived-class', 'program-1', 'failed', 62)],
    });
    const currentStudent = createUser('current-student', { enrolledClassrooms: ['class-2'] });

    const result = filterAndSortUsers({
      users: [formerStudent, currentStudent],
      classrooms: [createClassroom('class-2', 'program-2')],
      evaluations: [],
      filters: withFilters({
        programId: 'program-1',
        academicRelationship: 'student-failed',
      }),
    });

    expect(result.map((user) => user.id)).toEqual(['former-student']);
  });

  test('encuentra a quienes todavía les falta aprobar la clase seleccionada', () => {
    const approved = createUser('approved', {
      completedClassrooms: [createHistory('class-1', 'program-1', 'completed', 92)],
    });
    const failed = createUser('failed', {
      completedClassrooms: [createHistory('class-1', 'program-1', 'failed', 60)],
    });
    const dropped = createUser('dropped', {
      completedClassrooms: [createHistory('class-1', 'program-1', 'dropped')],
    });
    const currentlyEnrolled = createUser('current', {
      enrolledClassrooms: ['class-1'],
    });
    const neverEnrolled = createUser('never');
    const approvedAnotherClass = createUser('approved-another', {
      completedClassrooms: [createHistory('class-2', 'program-1', 'completed', 95)],
    });

    const result = filterAndSortUsers({
      users: [approved, failed, dropped, currentlyEnrolled, neverEnrolled, approvedAnotherClass],
      classrooms: [
        createClassroom('class-1', 'program-1'),
        createClassroom('class-2', 'program-1'),
      ],
      evaluations: [],
      filters: withFilters({
        missingClassroomId: 'class-1',
      }),
    });

    expect(result.map((user) => user.id)).toEqual([
      'failed',
      'dropped',
      'current',
      'never',
      'approved-another',
    ]);
  });

  test('combina la clase faltante con el vínculo académico sin compartir su clase específica', () => {
    const missingAndCurrent = createUser('missing-and-current', {
      enrolledClassrooms: ['class-2'],
    });
    const approvedAndCurrent = createUser('approved-and-current', {
      enrolledClassrooms: ['class-2'],
      completedClassrooms: [createHistory('class-1', 'program-1', 'completed', 95)],
    });
    const missingButUnrelated = createUser('missing-but-unrelated');

    const result = filterAndSortUsers({
      users: [missingAndCurrent, approvedAndCurrent, missingButUnrelated],
      classrooms: [
        createClassroom('class-1', 'program-1'),
        createClassroom('class-2', 'program-2'),
      ],
      evaluations: [],
      filters: withFilters({
        classroomId: 'class-2',
        academicRelationship: 'student-current',
        missingClassroomId: 'class-1',
      }),
    });

    expect(result.map((user) => user.id)).toEqual(['missing-and-current']);
  });

  test('distingue profesores actuales e históricos sin depender del rol principal', () => {
    const currentTeacher = createUser('current-teacher', { isTeacher: true });
    const formerTeacher = createUser('former-teacher', {
      isTeacher: true,
      taughtClassrooms: [createHistory('class-1', 'program-1', 'completed', undefined, 'teacher')],
    });
    const classroom = createClassroom('class-1', 'program-1', {
      teacherId: currentTeacher.id,
    });

    const current = filterAndSortUsers({
      users: [currentTeacher, formerTeacher],
      classrooms: [classroom],
      evaluations: [],
      filters: withFilters({ classroomId: 'class-1', academicRelationship: 'teacher-current' }),
    });
    const historical = filterAndSortUsers({
      users: [currentTeacher, formerTeacher],
      classrooms: [classroom],
      evaluations: [],
      filters: withFilters({ classroomId: 'class-1', academicRelationship: 'teacher-history' }),
    });

    expect(current.map((user) => user.id)).toEqual(['current-teacher']);
    expect(historical.map((user) => user.id)).toEqual(['former-teacher']);
  });

  test('aplica rango de índice y ordena los mejores estudiantes primero', () => {
    const high = createUser('high');
    const medium = createUser('medium');
    const low = createUser('low');
    const noGrade = createUser('no-grade');
    const evaluations = [
      createEvaluation(high.id, 'class-1', 96),
      createEvaluation(medium.id, 'class-1', 87),
      createEvaluation(low.id, 'class-1', 69),
    ];

    const result = filterAndSortUsers({
      users: [medium, noGrade, low, high],
      classrooms: [],
      evaluations,
      filters: withFilters({
        minGeneralIndex: '80',
        maxGeneralIndex: '100',
        orderBy: 'index-desc',
      }),
    });

    expect(result.map((user) => user.id)).toEqual(['high', 'medium']);
  });

  test('calcula asistencia general y permite filtrar usuarios sin notas', () => {
    const attended = createUser('attended');
    const noGrade = createUser('no-grade');
    const evaluation = createEvaluation(attended.id, 'class-1', 0, 'in-progress');
    evaluation.attendanceRecords = [
      { moduleId: '1', studentId: attended.id, isPresent: true, date: now, markedBy: 't', markedAt: now },
      { moduleId: '2', studentId: attended.id, isPresent: false, date: now, markedBy: 't', markedAt: now },
    ];

    const attendanceResult = filterAndSortUsers({
      users: [attended, noGrade],
      classrooms: [],
      evaluations: [evaluation],
      filters: withFilters({ minAttendance: '50', maxAttendance: '50' }),
    });
    const withoutGradeResult = filterAndSortUsers({
      users: [attended, noGrade],
      classrooms: [],
      evaluations: [evaluation],
      filters: withFilters({ gradeAvailability: 'without-grade' }),
    });

    expect(attendanceResult.map((user) => user.id)).toEqual(['attended']);
    expect(withoutGradeResult.map((user) => user.id)).toEqual(['attended', 'no-grade']);
  });

  test('el estado de onboarding solo incluye cuentas estudiantiles', () => {
    const completedStudent = createUser('completed', { once: { onboarding: true } });
    const pendingStudent = createUser('pending', { once: { onboarding: false } });
    const teacher = createUser('teacher', {
      role: 'teacher',
      isTeacher: true,
      once: undefined,
    });

    const result = filterAndSortUsers({
      users: [completedStudent, pendingStudent, teacher],
      classrooms: [],
      evaluations: [],
      filters: withFilters({ onboardingStatus: 'pending' }),
    });

    expect(result.map((user) => user.id)).toEqual(['pending']);
  });
});
