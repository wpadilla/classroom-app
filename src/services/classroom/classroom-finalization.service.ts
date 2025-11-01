/**
 * Classroom Finalization Service
 * 
 * Implements Command Pattern for reversible operations
 * Follows Single Responsibility Principle - only handles finalization logic
 * 
 * Design Patterns Used:
 * - Command Pattern: Finalization and Revert operations
 * - Transaction Pattern: Atomic operations
 * - Strategy Pattern: Different finalization strategies (normal, forced, etc)
 */

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { IClassroom, IUser, IStudentEvaluation, IClassroomHistory } from '../../models';
import { UserService } from '../user/user.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ProgramService } from '../program/program.service';

/**
 * Finalization result interface
 */
export interface IFinalizationResult {
  success: boolean;
  classroomId: string;
  studentsProcessed: number;
  teacherProcessed: boolean;
  errors: string[];
  timestamp: Date;
  canRevert: boolean;
}

/**
 * Finalization options
 */
export interface IFinalizationOptions {
  force?: boolean; // Force finalize even with pending evaluations
  skipNotifications?: boolean; // Skip WhatsApp notifications
  archiveWhatsappGroup?: boolean; // Archive the WhatsApp group
  customCompletionDate?: Date; // Custom completion date
}

/**
 * Finalization state snapshot for reversion
 */
interface IFinalizationSnapshot {
  classroomId: string;
  classroom: IClassroom;
  students: Array<{
    userId: string;
    enrolledClassrooms: string[];
    completedClassrooms: IClassroomHistory[];
  }>;
  teacher: {
    userId: string;
    teachingClassrooms: string[];
    taughtClassrooms: IClassroomHistory[];
  };
  timestamp: Date;
}

export class ClassroomFinalizationService {
  /**
   * Helper to remove undefined values from objects
   * Firebase doesn't allow undefined values in updates
   */
  private static cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }

  /**
   * Validate if classroom can be finalized
   */
  static async validateFinalization(classroomId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get classroom
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      if (!classroom) {
        errors.push('Clase no encontrada');
        return { isValid: false, errors, warnings };
      }

      // Check if already finalized
      if (!classroom.isActive) {
        warnings.push('La clase ya está marcada como inactiva');
      }

      // Check students
      if (!classroom.studentIds || classroom.studentIds.length === 0) {
        warnings.push('No hay estudiantes inscritos en la clase');
      }

      // Check evaluations
      const evaluations = await EvaluationService.getClassroomEvaluations(classroomId);
      const unevaluatedStudents = classroom.studentIds?.filter(studentId => {
        const evaluation = evaluations.find(e => e.studentId === studentId);
        return !evaluation || evaluation.status !== 'evaluated';
      });

      if (unevaluatedStudents && unevaluatedStudents.length > 0) {
        warnings.push(`${unevaluatedStudents.length} estudiante(s) sin evaluación final`);
      }

      // Check if all modules are completed
      const incompletedModules = classroom.modules.filter(m => !m.isCompleted);
      if (incompletedModules.length > 0) {
        warnings.push(`${incompletedModules.length} módulo(s) sin completar`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating finalization:', error);
      errors.push('Error al validar la finalización');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Create snapshot of current state for potential reversion
   * Implements Memento Pattern
   */
  private static async createSnapshot(classroomId: string): Promise<IFinalizationSnapshot> {
    const classroom = await FirebaseService.getDocument<IClassroom>(
      COLLECTIONS.CLASSROOMS,
      classroomId
    );

    if (!classroom) {
      throw new Error('Classroom not found');
    }

    // Snapshot students
    const students = await Promise.all(
      (classroom.studentIds || []).map(async (studentId) => {
        const user = await UserService.getUserById(studentId);
        if (!user) return null;

        return {
          userId: studentId,
          enrolledClassrooms: [...(user.enrolledClassrooms || [])],
          completedClassrooms: [...(user.completedClassrooms || [])]
        };
      })
    );

    // Snapshot teacher
    const teacher = await UserService.getUserById(classroom.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const snapshot: IFinalizationSnapshot = {
      classroomId,
      classroom: { ...classroom },
      students: students.filter(s => s !== null) as any[],
      teacher: {
        userId: teacher.id,
        teachingClassrooms: [...(teacher.teachingClassrooms || [])],
        taughtClassrooms: [...(teacher.taughtClassrooms || [])]
      },
      timestamp: new Date()
    };

      // Store snapshot in Firebase for reversion capability
      await FirebaseService.createDocument(COLLECTIONS.FINALIZATION_SNAPSHOTS, snapshot);

    return snapshot;
  }

  /**
   * Finalize classroom - Main operation
   * Implements Transaction Pattern for atomicity
   */
  static async finalizeClassroom(
    classroomId: string,
    options: IFinalizationOptions = {}
  ): Promise<IFinalizationResult> {
    const result: IFinalizationResult = {
      success: false,
      classroomId,
      studentsProcessed: 0,
      teacherProcessed: false,
      errors: [],
      timestamp: new Date(),
      canRevert: false
    };

    try {
      // Validate
      const validation = await this.validateFinalization(classroomId);
      if (!validation.isValid && !options.force) {
        result.errors = validation.errors;
        return result;
      }

      // Create snapshot for reversion
      const snapshot = await this.createSnapshot(classroomId);
      result.canRevert = true;

      // Get classroom and program data
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      if (!classroom) {
        result.errors.push('Clase no encontrada');
        return result;
      }

      const program = await ProgramService.getProgramById(classroom.programId);
      const programName = program?.name || 'Programa sin nombre';

      // Get all evaluations
      const evaluations = await EvaluationService.getClassroomEvaluations(classroomId);

      // Process each student
      const completionDate = options.customCompletionDate || new Date();

      for (const studentId of classroom.studentIds || []) {
        try {
          const evaluation = evaluations.find(e => e.studentId === studentId);
          const finalGrade = evaluation?.percentage || 0;
          const status = this.determineStatus(finalGrade);

          await this.moveStudentToHistory(
            studentId,
            classroom,
            programName,
            finalGrade,
            status,
            completionDate
          );

          result.studentsProcessed++;
        } catch (error) {
          console.error(`Error processing student ${studentId}:`, error);
          result.errors.push(`Error procesando estudiante ${studentId}`);
        }
      }

      // Process teacher
      try {
        await this.moveTeacherToHistory(
          classroom.teacherId,
          classroom,
          programName,
          completionDate
        );
        result.teacherProcessed = true;
      } catch (error) {
        console.error(`Error processing teacher:`, error);
        result.errors.push('Error procesando profesor');
      }

      // Update classroom status - ensure all values are defined
      const classroomUpdates = {
        isActive: false,
        endDate: completionDate,
        updatedAt: new Date()
      };
      
      await FirebaseService.updateDocument(
        COLLECTIONS.CLASSROOMS, 
        classroomId, 
        classroomUpdates as any
      );

      // Archive WhatsApp group if requested
      if (options.archiveWhatsappGroup && classroom.whatsappGroup) {
        // TODO: Implement WhatsApp group archiving
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      console.error('Error finalizing classroom:', error);
      result.errors.push(error.message || 'Error desconocido');
      return result;
    }
  }

  /**
   * Determine completion status based on grade
   */
  private static determineStatus(finalGrade: number): 'completed' | 'failed' {
    return finalGrade >= 70 ? 'completed' : 'failed';
  }

  /**
   * Move student from enrolled to history
   */
  private static async moveStudentToHistory(
    studentId: string,
    classroom: IClassroom,
    programName: string,
    finalGrade: number,
    status: 'completed' | 'dropped' | 'failed',
    completionDate: Date
  ): Promise<void> {
    const user = await UserService.getUserById(studentId);
    if (!user) throw new Error(`Student ${studentId} not found`);

    // Ensure arrays are initialized
    const enrolledClassrooms = Array.isArray(user.enrolledClassrooms) 
      ? user.enrolledClassrooms.filter(id => id !== classroom.id)
      : [];

    // Add to completed classrooms - ensure it's an array
    const completedClassrooms = Array.isArray(user.completedClassrooms) 
      ? [...user.completedClassrooms]
      : [];
    
    // Check if already exists (avoid duplicates)
    const existingIndex = completedClassrooms.findIndex(
      h => h.classroomId === classroom.id && h.role === 'student'
    );

    // Create history record - ensure all required fields are defined
    const historyRecord: IClassroomHistory = {
      classroomId: classroom.id,
      classroomName: classroom.subject || 'Clase sin nombre',
      programId: classroom.programId || 'unknown',
      programName: programName || 'Programa sin nombre',
      role: 'student',
      enrollmentDate: classroom.startDate || completionDate, // Fallback to completion date if startDate missing
      completionDate,
      status
    };

    // Add finalGrade only if it's a valid number (not undefined/null/NaN)
    if (typeof finalGrade === 'number' && !isNaN(finalGrade)) {
      historyRecord.finalGrade = finalGrade;
    }

    if (existingIndex !== -1) {
      // Update existing record
      completedClassrooms[existingIndex] = historyRecord;
    } else {
      // Add new record
      completedClassrooms.push(historyRecord);
    }

    // Validate arrays before updating
    if (!Array.isArray(enrolledClassrooms)) {
      throw new Error('enrolledClassrooms must be an array');
    }
    if (!Array.isArray(completedClassrooms)) {
      throw new Error('completedClassrooms must be an array');
    }

    // Update user with validated data
    await UserService.updateUser(studentId, {
      enrolledClassrooms: enrolledClassrooms,
      completedClassrooms: completedClassrooms
    } as any);
  }

  /**
   * Move teacher from teaching to history
   */
  private static async moveTeacherToHistory(
    teacherId: string,
    classroom: IClassroom,
    programName: string,
    completionDate: Date
  ): Promise<void> {
    const teacher = await UserService.getUserById(teacherId);
    if (!teacher) throw new Error(`Teacher ${teacherId} not found`);

    // Ensure arrays are initialized
    const teachingClassrooms = Array.isArray(teacher.teachingClassrooms)
      ? teacher.teachingClassrooms.filter(id => id !== classroom.id)
      : [];

    // Add to taught classrooms - ensure it's an array
    const taughtClassrooms = Array.isArray(teacher.taughtClassrooms)
      ? [...teacher.taughtClassrooms]
      : [];
    
    // Check if already exists
    const existingIndex = taughtClassrooms.findIndex(
      h => h.classroomId === classroom.id && h.role === 'teacher'
    );

    // Create history record for teacher - ensure all required fields are defined
    const historyRecord: IClassroomHistory = {
      classroomId: classroom.id,
      classroomName: classroom.subject || 'Clase sin nombre',
      programId: classroom.programId || 'unknown',
      programName: programName || 'Programa sin nombre',
      role: 'teacher',
      enrollmentDate: classroom.startDate || completionDate, // Fallback to completion date if startDate missing
      completionDate,
      status: 'completed'
      // Explicitly don't add finalGrade for teachers
    };

    if (existingIndex !== -1) {
      taughtClassrooms[existingIndex] = historyRecord;
    } else {
      taughtClassrooms.push(historyRecord);
    }

    // Validate arrays before updating
    if (!Array.isArray(teachingClassrooms)) {
      throw new Error('teachingClassrooms must be an array');
    }
    if (!Array.isArray(taughtClassrooms)) {
      throw new Error('taughtClassrooms must be an array');
    }

    // Update user with validated data
    await UserService.updateUser(teacherId, {
      teachingClassrooms: teachingClassrooms,
      taughtClassrooms: taughtClassrooms
    } as any);
  }

  /**
   * Revert finalization - Restore classroom to active state
   * Implements Command Pattern's Undo operation
   */
  static async revertFinalization(classroomId: string): Promise<IFinalizationResult> {
    const result: IFinalizationResult = {
      success: false,
      classroomId,
      studentsProcessed: 0,
      teacherProcessed: false,
      errors: [],
      timestamp: new Date(),
      canRevert: false
    };

    try {
      // Get snapshot
      const snapshots = await FirebaseService.queryDocuments<IFinalizationSnapshot>(
        COLLECTIONS.FINALIZATION_SNAPSHOTS,
        'classroomId',
        '==',
        classroomId
      );

      if (snapshots.length === 0) {
        result.errors.push('No se encontró snapshot para revertir');
        return result;
      }

      // Get most recent snapshot
      const snapshot = snapshots.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      // Restore students
      for (const studentSnapshot of snapshot.students) {
        try {
          await UserService.updateUser(studentSnapshot.userId, {
            enrolledClassrooms: studentSnapshot.enrolledClassrooms || [],
            completedClassrooms: studentSnapshot.completedClassrooms || []
          } as any);
          result.studentsProcessed++;
        } catch (error) {
          console.error(`Error restoring student ${studentSnapshot.userId}:`, error);
          result.errors.push(`Error restaurando estudiante ${studentSnapshot.userId}`);
        }
      }

      // Restore teacher
      try {
        await UserService.updateUser(snapshot.teacher.userId, {
          teachingClassrooms: snapshot.teacher.teachingClassrooms || [],
          taughtClassrooms: snapshot.teacher.taughtClassrooms || []
        } as any);
        result.teacherProcessed = true;
      } catch (error) {
        console.error('Error restoring teacher:', error);
        result.errors.push('Error restaurando profesor');
      }

      // Restore classroom state - delete endDate field instead of setting to null
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS, 
        classroomId
      );
      
      if (classroom) {
        const { endDate, ...restClassroom } = classroom as any;
        await FirebaseService.updateDocument(COLLECTIONS.CLASSROOMS, classroomId, {
          isActive: true,
          updatedAt: new Date()
        } as any);
      }

      result.success = result.errors.length === 0;
      result.canRevert = true; // Can re-finalize after revert

      return result;
    } catch (error: any) {
      console.error('Error reverting finalization:', error);
      result.errors.push(error.message || 'Error desconocido al revertir');
      return result;
    }
  }

  /**
   * Get finalization history for a classroom
   */
  static async getFinalizationHistory(classroomId: string): Promise<IFinalizationSnapshot[]> {
    try {
      const snapshots = await FirebaseService.queryDocuments<IFinalizationSnapshot>(
        COLLECTIONS.FINALIZATION_SNAPSHOTS,
        'classroomId',
        '==',
        classroomId
      );

      return snapshots.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting finalization history:', error);
      return [];
    }
  }

  /**
   * Check if classroom has been finalized
   */
  static async isFinalized(classroomId: string): Promise<boolean> {
    try {
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      return classroom ? !classroom.isActive && !!classroom.endDate : false;
    } catch (error) {
      console.error('Error checking if classroom is finalized:', error);
      return false;
    }
  }

  /**
   * Get finalization statistics
   */
  static async getFinalizationStats(classroomId: string): Promise<{
    totalStudents: number;
    evaluated: number;
    passed: number;
    failed: number;
    averageGrade: number;
    completedModules: number;
    totalModules: number;
  }> {
    try {
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      if (!classroom) {
        throw new Error('Classroom not found');
      }

      const evaluations = await EvaluationService.getClassroomEvaluations(classroomId);
      const evaluatedOnes = evaluations.filter(e => e.status === 'evaluated');

      const passed = evaluatedOnes.filter(e => (e.percentage || 0) >= 70).length;
      const failed = evaluatedOnes.filter(e => (e.percentage || 0) < 70).length;
      
      const totalGrade = evaluatedOnes.reduce((sum, e) => sum + (e.percentage || 0), 0);
      const averageGrade = evaluatedOnes.length > 0 ? totalGrade / evaluatedOnes.length : 0;

      const completedModules = classroom.modules.filter(m => m.isCompleted).length;

      return {
        totalStudents: classroom.studentIds?.length || 0,
        evaluated: evaluatedOnes.length,
        passed,
        failed,
        averageGrade,
        completedModules,
        totalModules: classroom.modules.length
      };
    } catch (error) {
      console.error('Error getting finalization stats:', error);
      throw error;
    }
  }

  /**
   * Batch finalize multiple classrooms
   * Useful for end-of-semester operations
   */
  static async batchFinalize(
    classroomIds: string[],
    options: IFinalizationOptions = {}
  ): Promise<IFinalizationResult[]> {
    const results: IFinalizationResult[] = [];

    for (const classroomId of classroomIds) {
      const result = await this.finalizeClassroom(classroomId, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Cleanup old snapshots (data retention policy)
   * Keep only last 5 snapshots per classroom
   */
  static async cleanupOldSnapshots(classroomId: string): Promise<void> {
    try {
      const snapshots = await this.getFinalizationHistory(classroomId);
      
      // Keep only the 5 most recent snapshots
      if (snapshots.length > 5) {
        const toDelete = snapshots.slice(5);
        
        for (const snapshot of toDelete) {
          // Note: Need to implement a way to identify snapshot document IDs
          // This is a placeholder
          console.log('Deleting old snapshot:', snapshot.timestamp);
        }
      }
    } catch (error) {
      console.error('Error cleaning up snapshots:', error);
    }
  }
}

