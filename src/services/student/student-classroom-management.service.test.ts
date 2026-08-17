import { IClassroom, IUser } from '../../models';
import { ClassroomService } from '../classroom/classroom.service';
import { UserService } from '../user/user.service';
import { StudentClassroomManagementService } from './student-classroom-management.service';

jest.mock('../classroom/classroom.service', () => ({
  ClassroomService: {
    addStudentToClassroom: jest.fn(),
    removeStudentFromClassroom: jest.fn(),
  },
}));

jest.mock('../user/user.service', () => ({
  UserService: {
    getUserById: jest.fn(),
  },
}));

const mockedAddStudent = ClassroomService.addStudentToClassroom as jest.MockedFunction<
  typeof ClassroomService.addStudentToClassroom
>;
const mockedRemoveStudent = ClassroomService.removeStudentFromClassroom as jest.MockedFunction<
  typeof ClassroomService.removeStudentFromClassroom
>;
const mockedGetUser = UserService.getUserById as jest.MockedFunction<
  typeof UserService.getUserById
>;

const createClassroom = (
  studentIds: string[] = [],
  isActive: boolean = true
): IClassroom => ({
  id: 'classroom-1',
  programId: 'program-1',
  name: 'Clase de prueba',
  subject: 'Materia de prueba',
  teacherId: 'teacher-1',
  studentIds,
  modules: [],
  isActive,
  evaluationCriteria: {
    questionnaires: 25,
    attendance: 25,
    participation: 25,
    participationPointsPerModule: 1,
    finalExam: 25,
    customCriteria: [],
    participationRecords: [],
  },
  startDate: new Date('2026-08-15T00:00:00Z'),
  materialPrice: 0,
  createdAt: new Date('2026-08-15T00:00:00Z'),
  updatedAt: new Date('2026-08-15T00:00:00Z'),
});

const createUser = (enrolledClassrooms: string[] = []): IUser => ({
  id: 'student-1',
  firstName: 'Estudiante',
  lastName: 'Prueba',
  phone: '8095550000',
  password: 'secret',
  role: 'student',
  isTeacher: false,
  isActive: true,
  enrolledClassrooms,
  completedClassrooms: [],
  teachingClassrooms: [],
  taughtClassrooms: [],
  createdAt: new Date('2026-08-15T00:00:00Z'),
  updatedAt: new Date('2026-08-15T00:00:00Z'),
});

describe('StudentClassroomManagementService enrollment reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAddStudent.mockResolvedValue(undefined);
    mockedRemoveStudent.mockResolvedValue(undefined);
  });

  it('repairs a desired enrollment even when it already exists on the user', async () => {
    mockedGetUser.mockResolvedValue(createUser(['classroom-1']));

    await StudentClassroomManagementService.syncStudentEnrollments({
      userId: 'student-1',
      desiredClassroomIds: ['classroom-1'],
      managedClassroomIds: ['classroom-1'],
      managedClassrooms: [createClassroom()],
    });

    expect(mockedAddStudent).toHaveBeenCalledWith('classroom-1', 'student-1');
    expect(mockedRemoveStudent).not.toHaveBeenCalled();
  });

  it('removes an enrollment that exists only on the classroom', async () => {
    mockedGetUser.mockResolvedValue(createUser());

    await StudentClassroomManagementService.syncStudentEnrollments({
      userId: 'student-1',
      desiredClassroomIds: [],
      managedClassroomIds: ['classroom-1'],
      managedClassrooms: [createClassroom(['student-1'])],
    });

    expect(mockedRemoveStudent).toHaveBeenCalledWith('classroom-1', 'student-1');
    expect(mockedAddStudent).not.toHaveBeenCalled();
  });

  it('preserves the historical roster of an inactive finalized classroom', async () => {
    mockedGetUser.mockResolvedValue(createUser());

    await StudentClassroomManagementService.syncStudentEnrollments({
      userId: 'student-1',
      desiredClassroomIds: [],
      managedClassroomIds: ['classroom-1'],
      managedClassrooms: [createClassroom(['student-1'], false)],
    });

    expect(mockedRemoveStudent).not.toHaveBeenCalled();
  });

  it('repairs access when the enrollment exists only on the user', async () => {
    mockedGetUser.mockResolvedValue(createUser(['classroom-1']));

    const hasEnrollment = await StudentClassroomManagementService.ensureStudentEnrollmentForAccess(
      'student-1',
      createClassroom()
    );

    expect(hasEnrollment).toBe(true);
    expect(mockedAddStudent).toHaveBeenCalledWith('classroom-1', 'student-1');
  });

  it('does not grant access without an enrollment on either document', async () => {
    mockedGetUser.mockResolvedValue(createUser());

    const hasEnrollment = await StudentClassroomManagementService.ensureStudentEnrollmentForAccess(
      'student-1',
      createClassroom()
    );

    expect(hasEnrollment).toBe(false);
    expect(mockedAddStudent).not.toHaveBeenCalled();
  });
});
