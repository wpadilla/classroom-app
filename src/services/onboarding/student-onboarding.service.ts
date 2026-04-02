import { INTERNAL_FORMATION_PROGRAM_ID } from '../../constants/onboarding.constants';
import { StudentOnboardingFormData } from '../../schemas/student-onboarding.schema';
import { ClassroomService } from '../classroom/classroom.service';
import { ProgramService } from '../program/program.service';
import { StudentClassroomManagementService } from '../student/student-classroom-management.service';
import { UserService } from '../user/user.service';
import { IClassroom, IProgram, IUser, IUserUpdate } from '../../models';
import { isInternalFormationEnrollment } from '../../utils/onboarding';

interface IInternalFormationCatalog {
  program: IProgram | null;
  classrooms: IClassroom[];
}

export class StudentOnboardingService {
  static async getInternalFormationCatalog(): Promise<IInternalFormationCatalog> {
    const [program, classrooms] = await Promise.all([
      ProgramService.getProgramById(INTERNAL_FORMATION_PROGRAM_ID),
      ClassroomService.getClassroomsByProgram(INTERNAL_FORMATION_PROGRAM_ID),
    ]);

    const sortedClassrooms = [...classrooms].sort((classroomA, classroomB) => {
      if (classroomA.isActive !== classroomB.isActive) {
        return classroomA.isActive ? -1 : 1;
      }

      const startDateA = classroomA.startDate ? new Date(classroomA.startDate).getTime() : 0;
      const startDateB = classroomB.startDate ? new Date(classroomB.startDate).getTime() : 0;
      return startDateA - startDateB;
    });

    return {
      program,
      classrooms: sortedClassrooms,
    };
  }

  static async completeOnboarding(
    userId: string,
    formData: StudentOnboardingFormData
  ): Promise<IUser> {
    const currentUser = await UserService.getUserById(userId);
    if (!currentUser) {
      throw new Error('Usuario no encontrado');
    }

    const programs = await ProgramService.getAllPrograms();
    const allClassrooms = await ClassroomService.getAllClassrooms();
    const selectedProgram = programs.find(p => p.name === formData.enrollmentType);
    const managedClassrooms = selectedProgram
      ? allClassrooms.filter(c => c.programId === selectedProgram.id)
      : [];

    const { program: internalProgram, classrooms: internalClassrooms } = await this.getInternalFormationCatalog();
    
    const completedClassrooms =
      isInternalFormationEnrollment(formData.enrollmentType)
        ? StudentClassroomManagementService.mergeCompletedHistorySelection({
            user: currentUser,
            classroomIds: formData.completedInternalClassroomIds,
            classrooms: internalClassrooms,
            programs: internalProgram ? [internalProgram] : [],
            completionDate: new Date(),
            finalGrade: 100,
            status: 'completed',
          })
        : currentUser.completedClassrooms || [];

    const updates: IUserUpdate = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      country: formData.country,
      churchName: formData.churchName,
      pastor: formData.pastor,
      academicLevel: formData.academicLevel,
      enrollmentType: formData.enrollmentType,
      completedClassrooms,
      once: {
        ...(currentUser.once || {}),
        onboarding: true,
      },
      updatedAt: new Date(),
    };

    await UserService.updateUser(userId, updates);

    await StudentClassroomManagementService.syncStudentEnrollments({
      userId,
      desiredClassroomIds: formData.currentInternalClassroomId
          ? [formData.currentInternalClassroomId]
          : [],
      managedClassroomIds: managedClassrooms.map((classroom) => classroom.id),
    });

    const refreshedUser = await UserService.getUserById(userId);
    if (!refreshedUser) {
      throw new Error('No se pudo refrescar el usuario');
    }

    return refreshedUser;
  }
}
