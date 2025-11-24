// Classroom Service - CRUD operations for classrooms

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { IClassroom, IModule, IWhatsappGroup, IEvaluationCriteria, IClassroomResource } from '../../models';
import { orderBy, where } from 'firebase/firestore';
import { UserService } from '../user/user.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClassroomFinalizationService, IFinalizationOptions, IFinalizationResult } from './classroom-finalization.service';
import { ClassroomRestartService, IRestartResult } from './classroom-restart.service';

export class ClassroomService {
  /**
   * Get all classrooms
   */
  static async getAllClassrooms(): Promise<IClassroom[]> {
    try {
      return await FirebaseService.getDocuments<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        [orderBy('createdAt', 'desc')]
      );
    } catch (error) {
      console.error('Error getting all classrooms:', error);
      return [];
    }
  }

  /**
   * Get active classrooms
   */
  static async getActiveClassrooms(): Promise<IClassroom[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        'isActive',
        '==',
        true
      );
    } catch (error) {
      console.error('Error getting active classrooms:', error);
      return [];
    }
  }

  /**
   * Get classrooms by program
   */
  static async getClassroomsByProgram(programId: string): Promise<IClassroom[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        'programId',
        '==',
        programId
      );
    } catch (error) {
      console.error(`Error getting classrooms for program ${programId}:`, error);
      return [];
    }
  }

  /**
   * Get classrooms by teacher (or all for admin)
   */
  static async getClassroomsByTeacher(teacherId: string, isAdmin: boolean = false): Promise<IClassroom[]> {
    try {
      if (isAdmin) {
        // Admin can see all classrooms
        return await FirebaseService.getDocuments<IClassroom>(
          COLLECTIONS.CLASSROOMS,
          [orderBy('createdAt', 'desc')]
        );
      }

      return await FirebaseService.queryDocuments<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        'teacherId',
        '==',
        teacherId
      );
    } catch (error) {
      console.error(`Error getting classrooms for teacher ${teacherId}:`, error);
      return [];
    }
  }

  /**
   * Get classroom by ID
   */
  static async getClassroomById(classroomId: string): Promise<IClassroom | null> {
    try {
      return await FirebaseService.getDocument<IClassroom>(COLLECTIONS.CLASSROOMS, classroomId);
    } catch (error) {
      console.error(`Error getting classroom ${classroomId}:`, error);
      return null;
    }
  }

  /**
   * Create a new classroom
   */
  static async createClassroom(
    classroomData: Omit<IClassroom, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Validate evaluation criteria totals 100 points
      const criteriaTotal =
        classroomData.evaluationCriteria.questionnaires +
        classroomData.evaluationCriteria.attendance +
        classroomData.evaluationCriteria.participation +
        classroomData.evaluationCriteria.finalExam +
        classroomData.evaluationCriteria.customCriteria.reduce((sum, c) => sum + c.points, 0);

      if (criteriaTotal !== 100) {
        throw new Error('Los criterios de evaluación deben sumar 100 puntos');
      }

      return await FirebaseService.createDocument(COLLECTIONS.CLASSROOMS, classroomData);
    } catch (error) {
      console.error('Error creating classroom:', error);
      throw error;
    }
  }

  /**
   * Update classroom
   */
  static async updateClassroom(
    classroomId: string,
    updates: Partial<IClassroom>
  ): Promise<void> {
    try {
      // If updating evaluation criteria, validate it totals 100
      if (updates.evaluationCriteria) {
        const criteriaTotal =
          updates.evaluationCriteria.questionnaires! +
          updates.evaluationCriteria.attendance! +
          updates.evaluationCriteria.participation! +
          updates.evaluationCriteria.finalExam! +
          updates.evaluationCriteria.customCriteria!.reduce((sum, c) => sum + c.points, 0);

        if (criteriaTotal !== 100) {
          throw new Error('Los criterios de evaluación deben sumar 100 puntos');
        }
      }

      await FirebaseService.updateDocument(COLLECTIONS.CLASSROOMS, classroomId, updates as any);
    } catch (error) {
      console.error(`Error updating classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Add student to classroom
   */
  static async addStudentToClassroom(classroomId: string, studentId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const studentIds = classroom.studentIds || [];
      if (!studentIds.includes(studentId)) {
        studentIds.push(studentId);
        await this.updateClassroom(classroomId, { studentIds });

        // Also update user's enrolled classrooms
        await UserService.enrollInClassroom(studentId, classroomId);
      }
    } catch (error) {
      console.error(`Error adding student ${studentId} to classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Remove student from classroom
   */
  static async removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const studentIds = (classroom.studentIds || []).filter(id => id !== studentId);
      await this.updateClassroom(classroomId, { studentIds });

      // Also update user's enrolled classrooms
      await UserService.removeFromClassroom(studentId, classroomId);
    } catch (error) {
      console.error(`Error removing student ${studentId} from classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Create WhatsApp group for classroom
   */
  static async createWhatsappGroup(classroomId: string): Promise<IWhatsappGroup> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      // Get student phone numbers
      const students = await UserService.getUsersByClassroom(classroomId);
      const phoneNumbers = students
        .filter(s => s.phone)
        .map(s => WhatsappService.formatPhoneNumber(s.phone));

      // Get teacher phone number and add to the group
      const teacher = await UserService.getUserById(classroom.teacherId);
      if (teacher && teacher.phone) {
        const teacherPhone = WhatsappService.formatPhoneNumber(teacher.phone);
        // Add teacher at the beginning of the list (will be admin by default)
        phoneNumbers.unshift(teacherPhone);
      }

      // Create WhatsApp group
      const groupName = `${classroom.subject} - ${classroom.name}`;
      const groupResponse = await WhatsappService.createGroup(
        groupName,
        phoneNumbers,
        `Grupo de la clase ${classroom.subject}. Profesor: ${teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'}`
      );

      if (!groupResponse.success || !groupResponse.data) {
        throw new Error(groupResponse.error || 'Error al crear grupo de WhatsApp');
      }

      // Update classroom with WhatsApp group info
      await this.updateClassroom(classroomId, {
        whatsappGroup: groupResponse.data
      });

      return groupResponse.data;
    } catch (error) {
      console.error(`Error creating WhatsApp group for classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Sync WhatsApp group participants with classroom students
   */
  static async syncWhatsappGroup(classroomId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');
      if (!classroom.whatsappGroup) throw new Error('La clase no tiene un grupo de WhatsApp asociado');

      // Get current students
      const students = await UserService.getUsersByClassroom(classroomId);
      const studentPhones = students
        .filter(s => s.phone)
        .map(s => WhatsappService.formatPhoneNumber(s.phone));

      // Get teacher phone and add to participants
      const teacher = await UserService.getUserById(classroom.teacherId);
      const allPhones = [...studentPhones];
      if (teacher && teacher.phone) {
        const teacherPhone = WhatsappService.formatPhoneNumber(teacher.phone);
        // Add teacher at the beginning
        allPhones.unshift(teacherPhone);
      }

      // Sync with WhatsApp group
      const response = await WhatsappService.syncGroupParticipants(
        classroom.whatsappGroup.id,
        classroomId,
        allPhones
      );

      if (!response.success) {
        throw new Error(response.error || 'Error al sincronizar grupo');
      }

      // Get updated group participants
      const participants = await WhatsappService.getGroupParticipants(classroom.whatsappGroup.id);

      // Add new participants as students if they're not in the classroom
      // Exclude teacher from being added as student
      const teacherPhone = teacher?.phone ? WhatsappService.formatPhoneNumber(teacher.phone) : null;

      for (const participant of participants) {
        // Skip if it's the teacher
        if (teacherPhone && participant.phone === teacherPhone) {
          continue;
        }

        const existingStudent = students.find(
          s => WhatsappService.formatPhoneNumber(s.phone) === participant.phone
        );

        if (!existingStudent && participant.phone) {
          // Create a new student user
          const newStudent = await UserService.createUser({
            firstName: participant.name || 'Estudiante',
            lastName: 'Nuevo',
            phone: participant.phone,
            password: '123456', // Default password
            role: 'student',
            isTeacher: false,
            isActive: true,
            enrolledClassrooms: [classroomId]
          });

          // Add to classroom
          await this.addStudentToClassroom(classroomId, newStudent);
        }
      }
    } catch (error) {
      console.error(`Error syncing WhatsApp group for classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to classroom WhatsApp group
   */
  static async sendWhatsappMessage(classroomId: string, message: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');
      if (!classroom.whatsappGroup) throw new Error('La clase no tiene un grupo de WhatsApp asociado');

      const response = await WhatsappService.sendMessage(
        [classroom.whatsappGroup.id],
        {
          type: 'text',
          content: message
        } as any,
        5, // delay
        classroom.whatsappGroup.name || `${classroom.subject} - ${classroom.name}` // group title
      );

      if (!response.success) {
        throw new Error(response.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error(`Error sending WhatsApp message to classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Update current module
   */
  static async updateCurrentModule(classroomId: string, moduleId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const module = classroom.modules.find(m => m.id === moduleId);
      if (!module) throw new Error('Módulo no encontrado');

      await this.updateClassroom(classroomId, { currentModule: module });
    } catch (error) {
      console.error(`Error updating current module for classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Mark module as completed
   */
  static async markModuleCompleted(classroomId: string, moduleId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const modules = classroom.modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, isCompleted: true };
        }
        return m;
      });

      await this.updateClassroom(classroomId, { modules });
    } catch (error) {
      console.error(`Error marking module ${moduleId} as completed:`, error);
      throw error;
    }
  }

  /**
   * Toggle classroom active status
   */
  static async toggleClassroomStatus(classroomId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      await this.updateClassroom(classroomId, { isActive: !classroom.isActive });
    } catch (error) {
      console.error(`Error toggling classroom ${classroomId} status:`, error);
      throw error;
    }
  }

  /**
   * Delete classroom
   */
  static async deleteClassroom(classroomId: string): Promise<void> {
    try {
      // Remove classroom from all enrolled students
      const students = await UserService.getUsersByClassroom(classroomId);
      for (const student of students) {
        await UserService.removeFromClassroom(student.id, classroomId);
      }

      // Remove classroom from teacher
      const classroom = await this.getClassroomById(classroomId);
      if (classroom && classroom.teacherId) {
        await UserService.removeTeacherFromClassroom(classroom.teacherId, classroomId);
      }

      // Delete classroom
      await FirebaseService.deleteDocument(COLLECTIONS.CLASSROOMS, classroomId);
    } catch (error) {
      console.error(`Error deleting classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Get classroom statistics
   */
  static async getClassroomStatistics(classroomId: string): Promise<{
    totalStudents: number;
    completedModules: number;
    totalModules: number;
    isActive: boolean;
    hasWhatsappGroup: boolean;
  }> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) {
        return {
          totalStudents: 0,
          completedModules: 0,
          totalModules: 0,
          isActive: false,
          hasWhatsappGroup: false
        };
      }

      const completedModules = classroom.modules.filter(m => m.isCompleted).length;

      return {
        totalStudents: classroom.studentIds?.length || 0,
        completedModules,
        totalModules: classroom.modules.length,
        isActive: classroom.isActive,
        hasWhatsappGroup: !!classroom.whatsappGroup
      };
    } catch (error) {
      console.error(`Error getting statistics for classroom ${classroomId}:`, error);
      return {
        totalStudents: 0,
        completedModules: 0,
        totalModules: 0,
        isActive: false,
        hasWhatsappGroup: false
      };
    }
  }

  /**
   * Finalize classroom - Move students and teacher to history
   * Delegates to ClassroomFinalizationService
   */
  static async finalizeClassroom(
    classroomId: string,
    options: IFinalizationOptions = {}
  ): Promise<IFinalizationResult> {
    return await ClassroomFinalizationService.finalizeClassroom(classroomId, options);
  }

  /**
   * Revert classroom finalization
   * Delegates to ClassroomFinalizationService
   */
  static async revertFinalization(classroomId: string): Promise<IFinalizationResult> {
    return await ClassroomFinalizationService.revertFinalization(classroomId);
  }

  /**
   * Check if classroom is finalized
   */
  static async isFinalized(classroomId: string): Promise<boolean> {
    return await ClassroomFinalizationService.isFinalized(classroomId);
  }

  /**
   * Get finalization statistics
   */
  static async getFinalizationStats(classroomId: string) {
    return await ClassroomFinalizationService.getFinalizationStats(classroomId);
  }

  /**
   * Restart classroom - Create historical record and reset for new group
   * Delegates to ClassroomRestartService
   */
  static async restartClassroom(
    classroomId: string,
    userId: string,
    notes?: string
  ): Promise<IRestartResult> {
    return await ClassroomRestartService.restartClassroom(classroomId, userId, notes);
  }

  /**
   * Get all historical runs for a classroom
   */
  static async getClassroomRuns(classroomId: string) {
    return await ClassroomRestartService.getClassroomRuns(classroomId);
  }

  /**
   * Get aggregated statistics across all runs
   */
  static async getAggregatedRunStats(classroomId: string) {
    return await ClassroomRestartService.getAggregatedStats(classroomId);
  }

  /**
   * Add resource to classroom
   */
  static async addResource(classroomId: string, resource: IClassroomResource): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const resources = classroom.resources || [];
      resources.push(resource);

      await this.updateClassroom(classroomId, { resources } as any);
    } catch (error) {
      console.error(`Error adding resource to classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Delete resource from classroom
   */
  static async deleteResource(classroomId: string, resourceId: string): Promise<void> {
    try {
      const classroom = await this.getClassroomById(classroomId);
      if (!classroom) throw new Error('Clase no encontrada');

      const resources = (classroom.resources || []).filter(r => r.id !== resourceId);

      await this.updateClassroom(classroomId, { resources } as any);
    } catch (error) {
      console.error(`Error deleting resource ${resourceId} from classroom ${classroomId}:`, error);
      throw error;
    }
  }
}

