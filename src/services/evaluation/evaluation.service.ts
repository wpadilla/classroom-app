// Evaluation Service - Managing student evaluations and grades

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import {
  IStudentEvaluation,
  IEvaluationCriteria,
  IAttendanceRecord,
  DEFAULT_GRADE_SCALE,
  IEvaluationCreate
} from '../../models/evaluation.model';
import { IClassroom } from '../../models/classroom.model';
import { where } from 'firebase/firestore';
import {
  calculateAttendancePercentage,
  calculateFinalEvaluation,
} from './evaluation-score.utils';

export class EvaluationService {
  private static createDefaultScores() {
    return {
      questionnaires: 0,
      attendance: 0,
      participation: 0,
      finalExam: 0,
      customScores: [] as { criterionId: string; score: number }[],
    };
  }

  private static createBaseEvaluation(
    studentId: string,
    classroomId: string,
    overrides: Partial<IEvaluationCreate> = {}
  ): IEvaluationCreate {
    return {
      studentId,
      classroomId,
      moduleId: overrides.moduleId ?? '',
      participationRecords: overrides.participationRecords ?? [],
      scores: overrides.scores ?? this.createDefaultScores(),
      attendanceRecords: overrides.attendanceRecords ?? [],
      participationPoints: overrides.participationPoints ?? 0,
      totalScore: overrides.totalScore ?? 0,
      percentage: overrides.percentage ?? 0,
      status: overrides.status ?? 'in-progress',
      isActive: overrides.isActive,
      evaluatedBy: overrides.evaluatedBy,
      evaluatedAt: overrides.evaluatedAt,
      comments: overrides.comments,
    };
  }

  private static recalculatePreservingWorkflowStatus(
    evaluation: IStudentEvaluation,
    criteria?: IEvaluationCriteria,
    totalModules: number = 8
  ): IStudentEvaluation {
    if (!criteria) return evaluation;

    const recalculated = this.calculateFinalGrade(evaluation, criteria, totalModules);
    return {
      ...recalculated,
      status: evaluation.status,
      evaluatedAt: evaluation.evaluatedAt,
    };
  }

  /**
   * Create evaluation criteria for a classroom
   */
  static validateCriteria(criteria: IEvaluationCriteria): boolean {
    const total = 
      criteria.questionnaires +
      criteria.attendance +
      criteria.participation +
      criteria.finalExam +
      criteria.customCriteria.reduce((sum, c) => sum + c.points, 0);
    
    return total === 100;
  }

  /**
   * Get all evaluations. Used by aggregate admin views to avoid one query per user.
   */
  static async getAllEvaluations(): Promise<IStudentEvaluation[]> {
    try {
      return await FirebaseService.getDocuments<IStudentEvaluation>(COLLECTIONS.EVALUATIONS);
    } catch (error) {
      console.error('Error getting all evaluations:', error);
      return [];
    }
  }

  /**
   * Get all evaluations for a student
   */
  static async getStudentEvaluations(studentId: string): Promise<IStudentEvaluation[]> {
    try {
      return await FirebaseService.queryDocuments<IStudentEvaluation>(
        COLLECTIONS.EVALUATIONS,
        'studentId',
        '==',
        studentId
      );
    } catch (error) {
      console.error(`Error getting evaluations for student ${studentId}:`, error);
      return [];
    }
  }

  /**
   * Get all evaluations for a classroom
   */
  static async getClassroomEvaluations(classroomId: string): Promise<IStudentEvaluation[]> {
    try {
      return await FirebaseService.queryDocuments<IStudentEvaluation>(
        COLLECTIONS.EVALUATIONS,
        'classroomId',
        '==',
        classroomId
      );
    } catch (error) {
      console.error(`Error getting evaluations for classroom ${classroomId}:`, error);
      return [];
    }
  }

  /**
   * Get evaluation for a specific student in a classroom
   */
  static async getStudentClassroomEvaluation(
    studentId: string,
    classroomId: string
  ): Promise<IStudentEvaluation | null> {
    try {
      const evaluations = await FirebaseService.getDocuments<IStudentEvaluation>(
        COLLECTIONS.EVALUATIONS,
        [
          where('studentId', '==', studentId),
          where('classroomId', '==', classroomId)
        ]
      );
      
      return evaluations.length > 0 ? evaluations[0] : null;
    } catch (error) {
      console.error(`Error getting evaluation for student ${studentId} in classroom ${classroomId}:`, error);
      return null;
    }
  }

  /**
   * Create or update student evaluation
   */
  static async saveEvaluation(evaluation: IStudentEvaluation | IEvaluationCreate): Promise<string> {
    try {
      // Check if evaluation has an ID (existing evaluation)
      if ('id' in evaluation && evaluation.id) {
        // Update existing evaluation
        const { id, createdAt, ...updateData } = evaluation as IStudentEvaluation;
        await FirebaseService.updateDocument(
          COLLECTIONS.EVALUATIONS,
          id,
          updateData
        );
        return id;
      } else {
        // Check if evaluation already exists by student and classroom
        const existing = await this.getStudentClassroomEvaluation(
          evaluation.studentId,
          evaluation.classroomId
        );
        
        if (existing) {
          // Update existing evaluation
          const { id, createdAt, ...updateData } = evaluation as any;
          await FirebaseService.updateDocument(
            COLLECTIONS.EVALUATIONS,
            existing.id,
            updateData
          );
          return existing.id;
        } else {
          // Create new evaluation
          const { id, createdAt, updatedAt, ...createData } = evaluation as any;
          return await FirebaseService.createDocument(
            COLLECTIONS.EVALUATIONS,
            createData
          );
        }
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  /**
   * Persist the latest attendance state for a specific module.
   * Accepts an optional in-memory evaluation snapshot so callers can avoid
   * read-modify-write races when they already have the latest optimistic state.
   */
  static async saveAttendanceState(
    studentId: string,
    classroomId: string,
    moduleId: string,
    isPresent: boolean | null,
    teacherId: string,
    currentEvaluation?: IStudentEvaluation | null,
    criteria?: IEvaluationCriteria,
    totalModules: number = 8
  ): Promise<IStudentEvaluation> {
    try {
      const now = new Date();
      const evaluation =
        currentEvaluation?.id
          ? currentEvaluation
          : await this.getStudentClassroomEvaluation(studentId, classroomId);

      const attendanceRecords = [...(evaluation?.attendanceRecords || [])];
      const existingIndex = attendanceRecords.findIndex(
        (record) => record.moduleId === moduleId
      );

      const newRecord: IAttendanceRecord = {
        moduleId,
        studentId,
        isPresent,
        date: now,
        markedBy: teacherId,
        markedAt: now,
      };

      if (existingIndex >= 0) {
        attendanceRecords[existingIndex] = newRecord;
      } else {
        attendanceRecords.push(newRecord);
      }

      const attendancePercentage = this.calculateAttendanceScore(attendanceRecords);
      const attendanceScore = criteria
        ? (attendancePercentage / 100) * criteria.attendance
        : attendancePercentage;

      if (evaluation) {
        const nextEvaluation = this.recalculatePreservingWorkflowStatus({
          ...evaluation,
          moduleId: evaluation.moduleId || moduleId,
          attendanceRecords,
          scores: {
            ...evaluation.scores,
            attendance: attendanceScore,
          },
          updatedAt: now,
        }, criteria, totalModules);

        await this.saveEvaluation(nextEvaluation);
        return nextEvaluation;
      }

      const nextEvaluation = this.createBaseEvaluation(studentId, classroomId, {
        moduleId,
        attendanceRecords,
        scores: {
          ...this.createDefaultScores(),
          attendance: attendanceScore,
        },
      });

      const savedId = await this.saveEvaluation(nextEvaluation);
      const savedEvaluation = this.recalculatePreservingWorkflowStatus({
        ...nextEvaluation,
        id: savedId,
        createdAt: now,
        updatedAt: now,
      }, criteria, totalModules);

      if (criteria) {
        await this.saveEvaluation(savedEvaluation);
      }

      return savedEvaluation;
    } catch (error) {
      console.error('Error saving attendance state:', error);
      throw error;
    }
  }

  /**
   * Persist the latest participation total as an absolute value.
   * This is safe to use with optimistic UI and queued writes.
   */
  static async saveParticipationPoints(
    studentId: string,
    classroomId: string,
    participationPoints: number,
    currentEvaluation?: IStudentEvaluation | null,
    criteria?: IEvaluationCriteria,
    totalModules: number = 8
  ): Promise<IStudentEvaluation> {
    try {
      const now = new Date();
      const normalizedPoints = Math.max(0, participationPoints);
      const evaluation =
        currentEvaluation?.id
          ? currentEvaluation
          : await this.getStudentClassroomEvaluation(studentId, classroomId);

      if (evaluation) {
        const nextEvaluation = this.recalculatePreservingWorkflowStatus({
          ...evaluation,
          participationPoints: normalizedPoints,
          updatedAt: now,
        }, criteria, totalModules);

        await this.saveEvaluation(nextEvaluation);
        return nextEvaluation;
      }

      const nextEvaluation = this.createBaseEvaluation(studentId, classroomId, {
        participationPoints: normalizedPoints,
      });

      const savedId = await this.saveEvaluation(nextEvaluation);
      const savedEvaluation = this.recalculatePreservingWorkflowStatus({
        ...nextEvaluation,
        id: savedId,
        createdAt: now,
        updatedAt: now,
      }, criteria, totalModules);

      if (criteria) {
        await this.saveEvaluation(savedEvaluation);
      }

      return savedEvaluation;
    } catch (error) {
      console.error('Error saving participation points:', error);
      throw error;
    }
  }

  /**
   * Record attendance for a module
   */
  static async recordAttendance(
    studentId: string,
    classroomId: string,
    moduleId: string,
    isPresent: boolean | null,
    teacherId: string
  ): Promise<void> {
    try {
      await this.saveAttendanceState(
        studentId,
        classroomId,
        moduleId,
        isPresent,
        teacherId
      );
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * Record participation points for a module
   */
  /**
   * Add or subtract participation points (simple counter)
   */
  static async recordParticipation(
    studentId: string,
    classroomId: string,
    points: number
  ): Promise<void> {
    try {
      const evaluation = await this.getStudentClassroomEvaluation(studentId, classroomId);
      const currentPoints =
        typeof evaluation?.participationPoints === 'number'
          ? evaluation.participationPoints
          : 0;

      await this.saveParticipationPoints(
        studentId,
        classroomId,
        currentPoints + points,
        evaluation
      );
    } catch (error) {
      console.error('Error recording participation:', error);
      throw error;
    }
  }

  /**
   * Update evaluation scores
   */
  static async updateScores(
    evaluationId: string,
    scores: {
      questionnaires?: number;
      finalExam?: number;
      customScores?: { criterionId: string; score: number }[];
    }
  ): Promise<void> {
    try {
      const updates: any = {
        updatedAt: new Date()
      };
      
      if (scores.questionnaires !== undefined) {
        updates['scores.questionnaires'] = scores.questionnaires;
      }
      
      if (scores.finalExam !== undefined) {
        updates['scores.finalExam'] = scores.finalExam;
      }
      
      if (scores.customScores) {
        updates['scores.customScores'] = scores.customScores;
      }
      
      await FirebaseService.updateDocument(
        COLLECTIONS.EVALUATIONS,
        evaluationId,
        updates
      );
    } catch (error) {
      console.error('Error updating scores:', error);
      throw error;
    }
  }

  /**
   * Calculate final grade (synchronous version for UI)
   */
  static calculateFinalGrade(
    evaluation: IStudentEvaluation,
    criteria: IEvaluationCriteria,
    totalModules: number = 8
  ): IStudentEvaluation {
    const recalculated = calculateFinalEvaluation(evaluation, criteria, totalModules);
    return {
      ...recalculated,
      letterGrade: this.getLetterGrade(recalculated.percentage),
    };
  }

  /**
   * Recalculate every evaluation with the classroom's current criteria.
   */
  static recalculateClassroomEvaluations(
    evaluations: IStudentEvaluation[],
    classroom: IClassroom
  ): IStudentEvaluation[] {
    const totalModules = classroom.modules?.length || 8;
    return evaluations.map((evaluation) =>
      this.calculateFinalGrade(evaluation, classroom.evaluationCriteria, totalModules)
    );
  }

  /**
   * Recalculate and persist the canonical grade before a class is archived.
   */
  static async recalculateAndPersistClassroomEvaluations(
    classroom: IClassroom,
    evaluations?: IStudentEvaluation[]
  ): Promise<IStudentEvaluation[]> {
    const sourceEvaluations = evaluations || await this.getClassroomEvaluations(classroom.id);
    const recalculated = this.recalculateClassroomEvaluations(sourceEvaluations, classroom);
    await Promise.all(recalculated.map((evaluation) => this.saveEvaluation(evaluation)));
    return recalculated;
  }

  /**
   * Calculate final grade (async version that updates database)
   */
  static async calculateFinalGradeAsync(
    evaluationId: string,
    criteria: IEvaluationCriteria,
    totalModules: number = 8
  ): Promise<void> {
    try {
      const evaluation = await FirebaseService.getDocument<IStudentEvaluation>(
        COLLECTIONS.EVALUATIONS,
        evaluationId
      );
      
      if (!evaluation) throw new Error('Evaluación no encontrada');
      
      const recalculated = this.calculateFinalGrade(evaluation, criteria, totalModules);
      await this.saveEvaluation(recalculated);
    } catch (error) {
      console.error('Error calculating final grade:', error);
      throw error;
    }
  }

  /**
   * Calculate attendance score as percentage
   */
  static calculateAttendanceScore(records: IAttendanceRecord[]): number {
    return calculateAttendancePercentage(records);
  }


  /**
   * Get letter grade based on percentage
   */
  static getLetterGrade(percentage: number): string {
    const scale = DEFAULT_GRADE_SCALE.find(
      grade => percentage >= grade.min && percentage <= grade.max
    );
    return scale ? scale.letter : 'F';
  }

  /**
   * Get evaluation statistics for a classroom
   */
  static async getClassroomStatistics(classroomId: string): Promise<{
    totalStudents: number;
    evaluatedStudents: number;
    averageGrade: number;
    passRate: number;
    attendanceRate: number;
  }> {
    try {
      const evaluations = await this.getClassroomEvaluations(classroomId);
      
      if (evaluations.length === 0) {
        return {
          totalStudents: 0,
          evaluatedStudents: 0,
          averageGrade: 0,
          passRate: 0,
          attendanceRate: 0
        };
      }
      
      const evaluatedStudents = evaluations.filter(e => e.status === 'evaluated').length;
      const totalScores = evaluations
        .filter(e => e.status === 'evaluated')
        .reduce((sum, e) => sum + e.percentage, 0);
      const averageGrade = evaluatedStudents > 0 ? totalScores / evaluatedStudents : 0;
      
      const passingStudents = evaluations.filter(e => e.percentage >= 70).length;
      const passRate = evaluatedStudents > 0 ? (passingStudents / evaluatedStudents) * 100 : 0;
      
      // Calculate average attendance rate
      const attendanceRates = evaluations.map(e =>
        this.calculateAttendanceScore(e.attendanceRecords)
      );
      const attendanceRate = attendanceRates.reduce((sum, r) => sum + r, 0) / attendanceRates.length;
      
      return {
        totalStudents: evaluations.length,
        evaluatedStudents,
        averageGrade,
        passRate,
        attendanceRate
      };
    } catch (error) {
      console.error('Error getting classroom statistics:', error);
      return {
        totalStudents: 0,
        evaluatedStudents: 0,
        averageGrade: 0,
        passRate: 0,
        attendanceRate: 0
      };
    }
  }
  /**
   * Update student active status in a classroom
   */
  static async updateStudentStatus(
    studentId: string,
    classroomId: string,
    isActive: boolean
  ): Promise<void> {
    try {
      const evaluation = await this.getStudentClassroomEvaluation(studentId, classroomId);
      
      if (evaluation) {
        await FirebaseService.updateDocument(
          COLLECTIONS.EVALUATIONS,
          evaluation.id,
          {
            isActive,
            updatedAt: new Date()
          }
        );
      } else {
        // Create new evaluation with status
        const newEvaluation: IEvaluationCreate = {
          studentId,
          classroomId,
          moduleId: '',
          participationRecords: [],
          scores: {
            questionnaires: 0,
            attendance: 0,
            participation: 0,
            finalExam: 0,
            customScores: []
          },
          attendanceRecords: [],
          participationPoints: 0,
          totalScore: 0,
          percentage: 0,
          status: 'in-progress',
          isActive
        };
        
        await this.saveEvaluation(newEvaluation);
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  }
}
