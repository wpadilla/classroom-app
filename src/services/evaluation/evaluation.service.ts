// Evaluation Service - Managing student evaluations and grades

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import {
  IStudentEvaluation,
  IEvaluationCriteria,
  IAttendanceRecord,
  DEFAULT_GRADE_SCALE,
  IEvaluationCreate
} from '../../models';
import { where, orderBy } from 'firebase/firestore';

export class EvaluationService {
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
   * Record attendance for a module
   */
  static async recordAttendance(
    studentId: string,
    classroomId: string,
    moduleId: string,
    isPresent: boolean,
    teacherId: string
  ): Promise<void> {
    try {
      const evaluation = await this.getStudentClassroomEvaluation(studentId, classroomId);
      
      if (!evaluation) {
        // Create new evaluation if doesn't exist
        const newEvaluation: IEvaluationCreate = {
          studentId,
          classroomId,
          moduleId,
          participationRecords: [],
          scores: {
            questionnaires: 0,
            attendance: 0,
            participation: 0,
            finalExam: 0,
            customScores: []
          },
          attendanceRecords: [{
            moduleId,
            studentId,
            isPresent,
            date: new Date(),
            markedBy: teacherId,
            markedAt: new Date()
          }],
          participationPoints: 0,
          totalScore: 0,
          percentage: 0,
          status: 'in-progress'
        };
        
        await this.saveEvaluation(newEvaluation);
      } else {
        // Update existing evaluation
        const attendanceRecords = evaluation.attendanceRecords || [];
        
        // Check if attendance for this module already exists
        const existingIndex = attendanceRecords.findIndex(
          record => record.moduleId === moduleId
        );
        
        const newRecord: IAttendanceRecord = {
          moduleId,
          studentId,
          isPresent,
          date: new Date(),
          markedBy: teacherId,
          markedAt: new Date()
        };
        
        if (existingIndex >= 0) {
          attendanceRecords[existingIndex] = newRecord;
        } else {
          attendanceRecords.push(newRecord);
        }
        
        // Recalculate attendance score
        const attendanceScore = this.calculateAttendanceScore(attendanceRecords);
        
        await FirebaseService.updateDocument(
          COLLECTIONS.EVALUATIONS,
          evaluation.id,
          {
            attendanceRecords,
            'scores.attendance': attendanceScore,
            updatedAt: new Date()
          }
        );
      }
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
      
      if (!evaluation) {
        // Create new evaluation if doesn't exist
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
          participationPoints: points,
          totalScore: 0,
          percentage: 0,
          status: 'in-progress'
        };
        
        await this.saveEvaluation(newEvaluation);
      } else {
        // Simply add/subtract points to the total
        const newTotal = (evaluation.participationPoints || 0) + points;
        
        await FirebaseService.updateDocument(
          COLLECTIONS.EVALUATIONS,
          evaluation.id,
          {
            participationPoints: newTotal,
            updatedAt: new Date()
          }
        );
      }
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
    // Calculate weighted scores
    let totalScore = 0;
    
    // Questionnaires
    totalScore += (evaluation.scores.questionnaires / criteria.questionnaires) * criteria.questionnaires;
    
    // Attendance
    const attendancePercentage = this.calculateAttendanceScore(evaluation.attendanceRecords);
    const attendanceScore = (attendancePercentage / 100) * criteria.attendance;
    totalScore += attendanceScore;
    
    // Participation - Calculate based on points per module and required points per module
    // Formula: (accumulated points / (total modules × points per module)) × criteria points
    // Example: 
    //   - 8 modules, 1 point per module required, 25 criteria points
    //   - Student has 8 points: (8 / (8 × 1)) × 25 = 25/25 (100%)
    //   - 8 modules, 2 points per module required, 25 criteria points
    //   - Student has 8 points: (8 / (8 × 2)) × 25 = 12.5/25 (50%)
    const participationPoints = evaluation.participationPoints || 0;
    const pointsPerModule = criteria.participationPointsPerModule || 1;
    const requiredPoints = totalModules * pointsPerModule;
    const participationPercentage = requiredPoints > 0 ? (participationPoints / requiredPoints) : 0;
    const participationScore = Math.min(participationPercentage * criteria.participation, criteria.participation);
    totalScore += participationScore;
    
    // Final Exam
    totalScore += (evaluation.scores.finalExam / criteria.finalExam) * criteria.finalExam;
    
    // Custom Criteria
    criteria.customCriteria?.forEach(criterion => {
      const customScore = evaluation.scores.customScores.find(
        cs => cs.criterionId === criterion.id
      );
      if (customScore) {
        totalScore += (customScore.score / criterion.points) * criterion.points;
      }
    });
    
    // Ensure totalScore does not exceed 100
    totalScore = Math.min(totalScore, 100);
    
    const percentage = totalScore;
    const letterGrade = this.getLetterGrade(percentage);
    
    return {
      ...evaluation,
      scores: {
        ...evaluation.scores,
        attendance: attendanceScore,
        participation: participationScore
      },
      totalScore,
      percentage,
      letterGrade,
      status: 'evaluated',
      evaluatedAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Calculate final grade (async version that updates database)
   */
  static async calculateFinalGradeAsync(
    evaluationId: string,
    criteria: IEvaluationCriteria
  ): Promise<void> {
    try {
      const evaluation = await FirebaseService.getDocument<IStudentEvaluation>(
        COLLECTIONS.EVALUATIONS,
        evaluationId
      );
      
      if (!evaluation) throw new Error('Evaluación no encontrada');
      
      // Calculate weighted scores
      let totalScore = 0;
      
      // Questionnaires
      totalScore += (evaluation.scores.questionnaires / 100) * criteria.questionnaires;
      
      // Attendance
      const attendancePercentage = this.calculateAttendanceScore(evaluation.attendanceRecords);
      totalScore += (attendancePercentage / 100) * criteria.attendance;
      
      // Participation - Simple: use accumulated points directly, capped at max criteria points
      const participationPoints = evaluation.participationPoints || 0;
      const participationScore = Math.min(participationPoints, criteria.participation);
      totalScore += participationScore;
      
      // Final Exam
      totalScore += (evaluation.scores.finalExam / 100) * criteria.finalExam;
      
      // Custom Criteria
      criteria.customCriteria.forEach(criterion => {
        const customScore = evaluation.scores.customScores.find(
          cs => cs.criterionId === criterion.id
        );
        if (customScore) {
          totalScore += (customScore.score / 100) * criterion.points;
        }
      });
      
      // Get letter grade
      const letterGrade = this.getLetterGrade(totalScore);
      
      // Update evaluation
      await FirebaseService.updateDocument(
        COLLECTIONS.EVALUATIONS,
        evaluationId,
        {
          totalScore,
          percentage: totalScore,
          letterGrade,
          status: 'evaluated',
          evaluatedAt: new Date(),
          updatedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error calculating final grade:', error);
      throw error;
    }
  }

  /**
   * Calculate attendance score as percentage
   */
  static calculateAttendanceScore(records: IAttendanceRecord[]): number {
    if (!records || records.length === 0) return 0;
    
    const presentCount = records.filter(r => r.isPresent).length;
    return (presentCount / records.length) * 100;
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
}
