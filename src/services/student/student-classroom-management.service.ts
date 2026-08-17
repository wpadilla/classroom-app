import { IClassroom, IClassroomHistory, IProgram, IUser } from '../../models';
import { ClassroomService } from '../classroom/classroom.service';
import { UserService } from '../user/user.service';

interface IBuildHistoryEntryOptions {
  classroom: IClassroom;
  program?: IProgram | null;
  enrollmentDate: Date;
  completionDate: Date;
  finalGrade: number;
  status?: 'completed' | 'dropped' | 'failed';
}

interface IMergeHistorySelectionOptions {
  user: IUser;
  classroomIds: string[];
  classrooms: IClassroom[];
  programs: IProgram[];
  enrollmentDate?: Date;
  completionDate?: Date;
  finalGrade?: number;
  status?: 'completed' | 'dropped' | 'failed';
}

interface ISyncStudentEnrollmentsOptions {
  userId: string;
  desiredClassroomIds: string[];
  managedClassroomIds: string[];
  managedClassrooms?: IClassroom[];
}

interface ISyncMultipleStudentEnrollmentsOptions {
  userIds: string[];
  desiredClassroomIds: string[];
  managedClassroomIds: string[];
  managedClassrooms?: IClassroom[];
}

interface IBulkEnrollStudentsInClassroomsOptions {
  userIds: string[];
  classroomIds: string[];
}

export class StudentClassroomManagementService {
  static async ensureStudentEnrollmentForAccess(
    userId: string,
    classroom: IClassroom
  ): Promise<boolean> {
    if (classroom.studentIds?.includes(userId)) {
      return true;
    }

    const user = await UserService.getUserById(userId);
    if (!user?.enrolledClassrooms?.includes(classroom.id)) {
      return false;
    }

    await ClassroomService.addStudentToClassroom(classroom.id, userId);
    return true;
  }

  static buildHistoryEntry({
    classroom,
    program,
    enrollmentDate,
    completionDate,
    finalGrade,
    status = 'completed',
  }: IBuildHistoryEntryOptions): IClassroomHistory {
    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      programId: classroom.programId,
      programName: program?.name || 'Sin programa',
      role: 'student',
      enrollmentDate,
      completionDate,
      finalGrade,
      status,
    };
  }

  static upsertStudentHistoryEntry(
    entries: IClassroomHistory[] = [],
    nextEntry: IClassroomHistory
  ): IClassroomHistory[] {
    const nextEntries = [...entries];
    const existingIndex = nextEntries.findIndex(
      (entry) => entry.classroomId === nextEntry.classroomId && entry.role === 'student'
    );

    if (existingIndex >= 0) {
      nextEntries[existingIndex] = nextEntry;
    } else {
      nextEntries.push(nextEntry);
    }

    return this.sortHistoryEntries(nextEntries);
  }

  static mergeCompletedHistorySelection({
    user,
    classroomIds,
    classrooms,
    programs,
    enrollmentDate = new Date(),
    completionDate = new Date(),
    finalGrade = 100,
    status = 'completed',
  }: IMergeHistorySelectionOptions): IClassroomHistory[] {
    const selectedIds = new Set(classroomIds);
    const classroomMap = new Map(classrooms.map((classroom) => [classroom.id, classroom]));
    const programMap = new Map(programs.map((program) => [program.id, program]));

    return Array.from(selectedIds).reduce<IClassroomHistory[]>(
      (history, classroomId) => {
        const classroom = classroomMap.get(classroomId);
        if (!classroom) {
          return history;
        }

        const alreadyExists = history.some(
          (entry) => entry.classroomId === classroomId && entry.role === 'student'
        );

        if (alreadyExists) {
          return history;
        }

        const nextEntry = this.buildHistoryEntry({
          classroom,
          program: programMap.get(classroom.programId),
          enrollmentDate: classroom.startDate || enrollmentDate,
          completionDate,
          finalGrade,
          status,
        });

        return this.upsertStudentHistoryEntry(history, nextEntry);
      },
      [...(user.completedClassrooms || [])]
    );
  }

  static async syncStudentEnrollments({
    userId,
    desiredClassroomIds,
    managedClassroomIds,
    managedClassrooms = [],
  }: ISyncStudentEnrollmentsOptions): Promise<void> {
    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const managedSet = new Set(managedClassroomIds);
    const nextManagedEnrollments = Array.from(
      new Set(desiredClassroomIds.filter((classroomId) => managedSet.has(classroomId)))
    );
    const desiredSet = new Set(nextManagedEnrollments);
    const userEnrollmentSet = new Set(user.enrolledClassrooms || []);
    const classroomById = new Map(
      managedClassrooms.map((classroom) => [classroom.id, classroom])
    );
    const classroomIdsToRemove = managedClassroomIds.filter((classroomId) => {
      if (desiredSet.has(classroomId)) return false;

      const managedClassroom = classroomById.get(classroomId);
      return userEnrollmentSet.has(classroomId) ||
        Boolean(managedClassroom?.isActive && managedClassroom.studentIds?.includes(userId));
    });

    // Always assert desired enrollments on both documents. This intentionally
    // repairs legacy records that exist only on the user or only on the class.
    for (const classroomId of nextManagedEnrollments) {
      await ClassroomService.addStudentToClassroom(classroomId, userId);
    }

    for (const classroomId of classroomIdsToRemove) {
      await ClassroomService.removeStudentFromClassroom(classroomId, userId);
    }
  }

  static async syncMultipleStudentEnrollments({
    userIds,
    desiredClassroomIds,
    managedClassroomIds,
    managedClassrooms = [],
  }: ISyncMultipleStudentEnrollmentsOptions): Promise<void> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

    for (const userId of uniqueUserIds) {
      await this.syncStudentEnrollments({
        userId,
        desiredClassroomIds,
        managedClassroomIds,
        managedClassrooms,
      });
    }
  }

  static async bulkEnrollStudentsInClassrooms({
    userIds,
    classroomIds,
  }: IBulkEnrollStudentsInClassroomsOptions): Promise<void> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    const uniqueClassroomIds = Array.from(new Set(classroomIds.filter(Boolean)));

    for (const classroomId of uniqueClassroomIds) {
      for (const userId of uniqueUserIds) {
        await ClassroomService.addStudentToClassroom(classroomId, userId);
      }
    }
  }

  private static sortHistoryEntries(entries: IClassroomHistory[]): IClassroomHistory[] {
    return [...entries].sort((entryA, entryB) => {
      const completionDateA = new Date(entryA.completionDate).getTime();
      const completionDateB = new Date(entryB.completionDate).getTime();

      if (completionDateA !== completionDateB) {
        return completionDateB - completionDateA;
      }

      return entryA.classroomName.localeCompare(entryB.classroomName, 'es');
    });
  }
}
