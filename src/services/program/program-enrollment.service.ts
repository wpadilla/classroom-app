import { IClassroom, IProgram, IUser } from '../../models';
import { ClassroomService } from '../classroom/classroom.service';
import { ProgramService } from './program.service';
import { StudentClassroomManagementService } from '../student/student-classroom-management.service';
import { UserService } from '../user/user.service';

export interface IProgramEnrollmentCampaign {
  program: IProgram;
  classrooms: IClassroom[];
  alreadyEnrolledClassroomIds: string[];
  hasEnrollmentInProgram: boolean;
}

export class ProgramEnrollmentService {
  static async getOpenEnrollmentCampaigns(userId: string): Promise<IProgramEnrollmentCampaign[]> {
    const [user, programs] = await Promise.all([
      UserService.getUserById(userId),
      ProgramService.getProgramsOpenForEnrollment(),
    ]);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const classroomsByProgram = await Promise.all(
      programs.map((program) => ClassroomService.getClassroomsByProgram(program.id))
    );

    return programs.map((program, index) => {
      const allProgramClassrooms = ClassroomService.sortClassroomsByProgramPosition(
        classroomsByProgram[index]
      );
      const alreadyEnrolledClassroomIds = (user.enrolledClassrooms || []).filter((classroomId) =>
        allProgramClassrooms.some((classroom) => classroom.id === classroomId)
      );

      return {
        program,
        classrooms: allProgramClassrooms.filter(
          (classroom) => classroom.isActive && !alreadyEnrolledClassroomIds.includes(classroom.id)
        ),
        alreadyEnrolledClassroomIds,
        hasEnrollmentInProgram: alreadyEnrolledClassroomIds.length > 0,
      };
    });
  }

  static async enrollUserInProgramClassroom(
    userId: string,
    programId: string,
    classroomId: string
  ): Promise<IUser | null> {
    const [program, classrooms] = await Promise.all([
      ProgramService.getProgramById(programId),
      ClassroomService.getClassroomsByProgram(programId),
    ]);

    if (!program) {
      throw new Error('Programa no encontrado');
    }

    const managedClassroomIds = classrooms.map((classroom) => classroom.id);
    if (!managedClassroomIds.includes(classroomId)) {
      throw new Error('La clase seleccionada no pertenece al programa');
    }

    await StudentClassroomManagementService.syncStudentEnrollments({
      userId,
      desiredClassroomIds: [classroomId],
      managedClassroomIds,
    });

    await UserService.updateUser(userId, {
      enrollmentType: program.name,
    });

    return UserService.getUserById(userId);
  }
}
