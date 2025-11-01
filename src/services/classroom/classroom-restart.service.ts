/**
 * Classroom Restart Service
 * 
 * Handles restarting finalized classrooms for new student groups
 * Preserves complete history of previous runs
 * 
 * Design Patterns:
 * - Factory Pattern: Creates new classroom runs
 * - Repository Pattern: Manages classroom run history
 * - Builder Pattern: Constructs complex run records
 */

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { 
  IClassroom, 
  IClassroomRun, 
  IStudentRunRecord, 
  IUser, 
  IStudentEvaluation 
} from '../../models';
import { UserService } from '../user/user.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ProgramService } from '../program/program.service';

/**
 * Result of restart operation
 */
export interface IRestartResult {
  success: boolean;
  classroomId: string;
  runId?: string;
  runNumber: number;
  errors: string[];
  timestamp: Date;
}

export class ClassroomRestartService {
  /**
   * Validate if classroom can be restarted
   */
  static async validateRestart(classroomId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      if (!classroom) {
        errors.push('Clase no encontrada');
        return { isValid: false, errors, warnings };
      }

      // Must be finalized to restart
      if (classroom.isActive) {
        errors.push('La clase debe estar finalizada para poder reiniciarla');
        return { isValid: false, errors, warnings };
      }

      if (!classroom.endDate) {
        errors.push('La clase no ha sido finalizada correctamente');
        return { isValid: false, errors, warnings };
      }

      // Check if teacher still exists
      const teacher = await UserService.getUserById(classroom.teacherId);
      if (!teacher) {
        warnings.push('El profesor asignado ya no existe en el sistema');
      } else if (!teacher.isActive) {
        warnings.push('El profesor asignado está inactivo');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating restart:', error);
      errors.push('Error al validar el reinicio');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Create complete historical record of classroom run
   * Builder Pattern - constructs complex record step by step
   */
  private static async createClassroomRun(
    classroom: IClassroom,
    runNumber: number,
    createdBy: string
  ): Promise<IClassroomRun> {
    // Get program information
    const program = await ProgramService.getProgramById(classroom.programId);
    const programName = program?.name || 'Programa sin nombre';

    // Get teacher information
    const teacher = await UserService.getUserById(classroom.teacherId);
    const teacherName = teacher 
      ? `${teacher.firstName} ${teacher.lastName}` 
      : 'Profesor desconocido';

    // Get all evaluations for this classroom
    const evaluations = await EvaluationService.getClassroomEvaluations(classroom.id);

    // Build student records
    const studentRecords: IStudentRunRecord[] = [];
    
    for (const studentId of classroom.studentIds || []) {
      const student = await UserService.getUserById(studentId);
      if (!student) continue;

      const evaluation = evaluations.find(e => e.studentId === studentId);
      
      const record: IStudentRunRecord = {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentPhone: student.phone,
        studentEmail: student.email,
        finalGrade: evaluation?.percentage,
        status: this.determineStudentStatus(evaluation?.percentage || 0),
        attendanceRate: this.calculateAttendanceRate(evaluation),
        participationPoints: evaluation?.participationPoints || 0,
        enrollmentDate: classroom.startDate || new Date(),
        completionDate: classroom.endDate || new Date()
      };

      studentRecords.push(record);
    }

    // Calculate statistics
    const statistics = this.calculateRunStatistics(studentRecords);

    // Build the complete run record
    const classroomRun: IClassroomRun = {
      id: '', // Will be set by Firebase
      classroomId: classroom.id,
      classroomName: classroom.name,
      classroomSubject: classroom.subject,
      programId: classroom.programId,
      programName,
      teacherId: classroom.teacherId,
      teacherName,
      
      // Evaluation criteria at time of run
      evaluationCriteria: {
        questionnaires: classroom.evaluationCriteria.questionnaires,
        attendance: classroom.evaluationCriteria.attendance,
        participation: classroom.evaluationCriteria.participation,
        finalExam: classroom.evaluationCriteria.finalExam,
        customCriteria: classroom.evaluationCriteria.customCriteria.map(c => ({
          name: c.name,
          points: c.points
        }))
      },
      
      schedule: classroom.schedule ? { ...classroom.schedule } : undefined,
      room: classroom.room,
      location: classroom.location,
      materialPrice: classroom.materialPrice || 0,
      
      // Module information
      totalModules: classroom.modules.length,
      completedModules: classroom.modules.filter(m => m.isCompleted).length,
      moduleNames: classroom.modules.map(m => m.name),
      
      // Student data
      students: studentRecords,
      totalStudents: studentRecords.length,
      
      // Statistics
      statistics,
      
      // Dates
      startDate: classroom.startDate || new Date(),
      endDate: classroom.endDate || new Date(),
      
      // Metadata
      runNumber,
      createdAt: new Date(),
      createdBy
    };

    return classroomRun;
  }

  /**
   * Determine student status based on grade
   */
  private static determineStudentStatus(grade: number): 'completed' | 'failed' {
    return grade >= 70 ? 'completed' : 'failed';
  }

  /**
   * Calculate attendance rate from evaluation
   */
  private static calculateAttendanceRate(evaluation?: IStudentEvaluation): number {
    if (!evaluation?.attendanceRecords || evaluation.attendanceRecords.length === 0) {
      return 0;
    }
    const present = evaluation.attendanceRecords.filter(r => r.isPresent).length;
    return (present / evaluation.attendanceRecords.length) * 100;
  }

  /**
   * Calculate statistics for the run
   */
  private static calculateRunStatistics(students: IStudentRunRecord[]) {
    if (students.length === 0) {
      return {
        averageGrade: 0,
        passRate: 0,
        attendanceRate: 0,
        totalParticipationPoints: 0,
        highestGrade: 0,
        lowestGrade: 0,
        distribution: { excellent: 0, good: 0, regular: 0, poor: 0 }
      };
    }

    const grades = students
      .map(s => s.finalGrade || 0)
      .filter(g => g > 0);

    const totalGrade = grades.reduce((sum, g) => sum + g, 0);
    const averageGrade = grades.length > 0 ? totalGrade / grades.length : 0;

    const passed = students.filter(s => (s.finalGrade || 0) >= 70).length;
    const passRate = (passed / students.length) * 100;

    const totalAttendance = students.reduce((sum, s) => sum + s.attendanceRate, 0);
    const attendanceRate = totalAttendance / students.length;

    const totalParticipationPoints = students.reduce((sum, s) => sum + s.participationPoints, 0);

    const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
    const lowestGrade = grades.length > 0 ? Math.min(...grades) : 0;

    const distribution = {
      excellent: students.filter(s => (s.finalGrade || 0) >= 90).length,
      good: students.filter(s => (s.finalGrade || 0) >= 80 && (s.finalGrade || 0) < 90).length,
      regular: students.filter(s => (s.finalGrade || 0) >= 70 && (s.finalGrade || 0) < 80).length,
      poor: students.filter(s => (s.finalGrade || 0) < 70).length
    };

    return {
      averageGrade,
      passRate,
      attendanceRate,
      totalParticipationPoints,
      highestGrade,
      lowestGrade,
      distribution
    };
  }

  /**
   * Get next run number for a classroom
   */
  private static async getNextRunNumber(classroomId: string): Promise<number> {
    try {
      const runs = await FirebaseService.queryDocuments<IClassroomRun>(
        COLLECTIONS.CLASSROOM_RUNS,
        'classroomId',
        '==',
        classroomId
      );

      if (runs.length === 0) return 1;

      const maxRunNumber = Math.max(...runs.map(r => r.runNumber));
      return maxRunNumber + 1;
    } catch (error) {
      console.error('Error getting next run number:', error);
      return 1;
    }
  }

  /**
   * Restart classroom - Main operation
   * Creates historical record and prepares classroom for new group
   */
  static async restartClassroom(
    classroomId: string,
    userId: string,
    notes?: string
  ): Promise<IRestartResult> {
    const result: IRestartResult = {
      success: false,
      classroomId,
      runNumber: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      // Validate
      const validation = await this.validateRestart(classroomId);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }

      // Get classroom
      const classroom = await FirebaseService.getDocument<IClassroom>(
        COLLECTIONS.CLASSROOMS,
        classroomId
      );

      if (!classroom) {
        result.errors.push('Clase no encontrada');
        return result;
      }

      // Get next run number
      const runNumber = await this.getNextRunNumber(classroomId);
      result.runNumber = runNumber;

      // Create historical record
      const classroomRun = await this.createClassroomRun(classroom, runNumber, userId);
      
      // Add notes if provided
      if (notes) {
        classroomRun.notes = notes;
      }

      // Save run to history
      const runId = await FirebaseService.createDocument(COLLECTIONS.CLASSROOM_RUNS, classroomRun);
      result.runId = runId;

      // Reset classroom for new group
      await this.resetClassroom(classroom);

      result.success = true;
      return result;
    } catch (error: any) {
      console.error('Error restarting classroom:', error);
      result.errors.push(error.message || 'Error desconocido al reiniciar');
      return result;
    }
  }

  /**
   * Reset classroom to initial state for new group
   */
  private static async resetClassroom(classroom: IClassroom): Promise<void> {
    // Reset modules to not completed
    const resetModules = classroom.modules.map(m => ({
      ...m,
      isCompleted: false
    }));

    // Reset to first module
    const firstModule = resetModules[0];

    // Prepare update data
    const updates = {
      studentIds: [], // Clear all students
      isActive: true, // Reactivate classroom
      currentModule: firstModule,
      modules: resetModules,
      startDate: new Date(), // New start date
      endDate: undefined, // Clear end date
      updatedAt: new Date()
      // Keep: teacherId, evaluationCriteria, schedule, room, etc.
    };

    // Remove endDate field by updating without it
    const { endDate, ...cleanUpdates } = updates;

    await FirebaseService.updateDocument(
      COLLECTIONS.CLASSROOMS,
      classroom.id,
      cleanUpdates as any
    );
  }

  /**
   * Get all runs for a classroom
   */
  static async getClassroomRuns(classroomId: string): Promise<IClassroomRun[]> {
    try {
      const runs = await FirebaseService.queryDocuments<IClassroomRun>(
        COLLECTIONS.CLASSROOM_RUNS,
        'classroomId',
        '==',
        classroomId
      );

      return runs.sort((a, b) => b.runNumber - a.runNumber);
    } catch (error) {
      console.error('Error getting classroom runs:', error);
      return [];
    }
  }

  /**
   * Get specific run by ID
   */
  static async getRunById(runId: string): Promise<IClassroomRun | null> {
    try {
      return await FirebaseService.getDocument<IClassroomRun>(COLLECTIONS.CLASSROOM_RUNS, runId);
    } catch (error) {
      console.error('Error getting run:', error);
      return null;
    }
  }

  /**
   * Get all runs for a teacher
   */
  static async getTeacherRuns(teacherId: string): Promise<IClassroomRun[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroomRun>(
        COLLECTIONS.CLASSROOM_RUNS,
        'teacherId',
        '==',
        teacherId
      );
    } catch (error) {
      console.error('Error getting teacher runs:', error);
      return [];
    }
  }

  /**
   * Get all runs for a program
   */
  static async getProgramRuns(programId: string): Promise<IClassroomRun[]> {
    try {
      return await FirebaseService.queryDocuments<IClassroomRun>(
        COLLECTIONS.CLASSROOM_RUNS,
        'programId',
        '==',
        programId
      );
    } catch (error) {
      console.error('Error getting program runs:', error);
      return [];
    }
  }

  /**
   * Delete a run record (admin only)
   */
  static async deleteRun(runId: string): Promise<void> {
    try {
      await FirebaseService.deleteDocument(COLLECTIONS.CLASSROOM_RUNS, runId);
    } catch (error) {
      console.error('Error deleting run:', error);
      throw error;
    }
  }

  /**
   * Get aggregated statistics across all runs of a classroom
   */
  static async getAggregatedStats(classroomId: string): Promise<{
    totalRuns: number;
    totalStudentsTaught: number;
    averageGradeAcrossRuns: number;
    averagePassRate: number;
    bestRun: { runNumber: number; averageGrade: number } | null;
    worstRun: { runNumber: number; averageGrade: number } | null;
  }> {
    try {
      const runs = await this.getClassroomRuns(classroomId);

      if (runs.length === 0) {
        return {
          totalRuns: 0,
          totalStudentsTaught: 0,
          averageGradeAcrossRuns: 0,
          averagePassRate: 0,
          bestRun: null,
          worstRun: null
        };
      }

      const totalStudentsTaught = runs.reduce((sum, r) => sum + r.totalStudents, 0);
      
      const totalGrade = runs.reduce((sum, r) => sum + r.statistics.averageGrade, 0);
      const averageGradeAcrossRuns = totalGrade / runs.length;

      const totalPassRate = runs.reduce((sum, r) => sum + r.statistics.passRate, 0);
      const averagePassRate = totalPassRate / runs.length;

      // Find best and worst runs
      const sortedByGrade = [...runs].sort((a, b) => 
        b.statistics.averageGrade - a.statistics.averageGrade
      );

      const bestRun = sortedByGrade.length > 0 
        ? { 
            runNumber: sortedByGrade[0].runNumber, 
            averageGrade: sortedByGrade[0].statistics.averageGrade 
          }
        : null;

      const worstRun = sortedByGrade.length > 0
        ? {
            runNumber: sortedByGrade[sortedByGrade.length - 1].runNumber,
            averageGrade: sortedByGrade[sortedByGrade.length - 1].statistics.averageGrade
          }
        : null;

      return {
        totalRuns: runs.length,
        totalStudentsTaught,
        averageGradeAcrossRuns,
        averagePassRate,
        bestRun,
        worstRun
      };
    } catch (error) {
      console.error('Error getting aggregated stats:', error);
      return {
        totalRuns: 0,
        totalStudentsTaught: 0,
        averageGradeAcrossRuns: 0,
        averagePassRate: 0,
        bestRun: null,
        worstRun: null
      };
    }
  }
}

