// Hook for calculating program progress and statistics
// Used in user profiles and admin views

import { useState, useCallback, useMemo } from 'react';
import { IUser, IClassroom, IProgram, IClassroomHistory } from '../models';
import { ClassroomService } from '../services/classroom/classroom.service';
import { ProgramService } from '../services/program/program.service';
import { EvaluationService } from '../services/evaluation/evaluation.service';

export interface ProgramProgress {
  program: IProgram;
  totalClassrooms: number;
  completedClassrooms: number;
  enrolledClassrooms: number;
  progressPercentage: number;
  averageGrade: number;
  classroomDetails: ClassroomProgressDetail[];
}

export interface ClassroomProgressDetail {
  classroom: IClassroom;
  status: 'completed' | 'enrolled' | 'not-started';
  finalGrade?: number;
  history?: IClassroomHistory;
}

export interface OverallStats {
  totalPrograms: number;
  completedPrograms: number;
  overallAverage: number;
  totalClassrooms: number;
  completedClassrooms: number;
  averageProgress: number;
  totalClassroomsCompleted: number;
  totalClassroomsEnrolled: number;
}

export interface UseProgramProgressReturn {
  programProgress: ProgramProgress[];
  loading: boolean;
  error: string | null;
  calculateProgress: (user: IUser) => Promise<void>;
  getOverallStats: () => OverallStats;
  overallStats: OverallStats;
}

export const useProgramProgress = (): UseProgramProgressReturn => {
  const [programProgress, setProgramProgress] = useState<ProgramProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateProgress = useCallback(async (user: IUser) => {
    try {
      setLoading(true);
      setError(null);

      // Get all programs and classrooms
      const [programs, allClassrooms] = await Promise.all([
        ProgramService.getAllPrograms(),
        ClassroomService.getAllClassrooms(),
      ]);

      // Get user's enrolled and completed classrooms
      const enrolledIds = new Set(user.enrolledClassrooms || []);
      const completedMap = new Map(
        (user.completedClassrooms || []).map(c => [c.classroomId, c])
      );

      // Also check teaching classrooms for teachers
      const teachingIds = new Set(user.teachingClassrooms || []);
      const taughtMap = new Map(
        (user.taughtClassrooms || []).map(c => [c.classroomId, c])
      );

      // Calculate progress for each program that the user is involved in
      const progressList: ProgramProgress[] = [];

      for (const program of programs) {
        // Get classrooms in this program
        const programClassrooms = allClassrooms.filter(
          c => c.programId === program.id
        );

        if (programClassrooms.length === 0) continue;

        // Check if user has any involvement in this program
        const hasEnrolled = programClassrooms.some(c => enrolledIds.has(c.id));
        const hasCompleted = programClassrooms.some(c => completedMap.has(c.id));
        const isTeaching = programClassrooms.some(c => teachingIds.has(c.id));
        const hasTaught = programClassrooms.some(c => taughtMap.has(c.id));

        if (!hasEnrolled && !hasCompleted && !isTeaching && !hasTaught) continue;

        // Calculate details for each classroom
        const classroomDetails: ClassroomProgressDetail[] = [];
        let completedCount = 0;
        let enrolledCount = 0;
        let totalGrades = 0;
        let gradeCount = 0;

        for (const classroom of programClassrooms) {
          const history = completedMap.get(classroom.id);
          const isEnrolled = enrolledIds.has(classroom.id);

          let status: 'completed' | 'enrolled' | 'not-started' = 'not-started';
          
          if (history) {
            status = 'completed';
            completedCount++;
            if (history.finalGrade !== undefined) {
              totalGrades += history.finalGrade;
              gradeCount++;
            }
          } else if (isEnrolled) {
            status = 'enrolled';
            enrolledCount++;
            
            // Try to get current evaluation for enrolled class
            try {
              const evaluations = await EvaluationService.getStudentEvaluations(user.id);
              const currentEval = evaluations.find(e => e.classroomId === classroom.id);
              if (currentEval && currentEval.percentage > 0) {
                totalGrades += currentEval.percentage;
                gradeCount++;
              }
            } catch {
              // Ignore evaluation fetch errors
            }
          }

          classroomDetails.push({
            classroom,
            status,
            finalGrade: history?.finalGrade,
            history,
          });
        }

        const progressPercentage = programClassrooms.length > 0
          ? Math.round((completedCount / programClassrooms.length) * 100)
          : 0;

        const averageGrade = gradeCount > 0
          ? Math.round((totalGrades / gradeCount) * 10) / 10
          : 0;

        progressList.push({
          program,
          totalClassrooms: programClassrooms.length,
          completedClassrooms: completedCount,
          enrolledClassrooms: enrolledCount,
          progressPercentage,
          averageGrade,
          classroomDetails,
        });
      }

      // Sort by progress percentage (descending)
      progressList.sort((a, b) => b.progressPercentage - a.progressPercentage);

      setProgramProgress(progressList);
    } catch (err: any) {
      setError(err.message || 'Error al calcular progreso');
      console.error('Error calculating program progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const overallStats = useMemo((): OverallStats => {
    const totalPrograms = programProgress.length;
    const completedPrograms = programProgress.filter(
      p => p.progressPercentage === 100
    ).length;

    const totalClassrooms = programProgress.reduce(
      (sum, p) => sum + p.totalClassrooms, 0
    );
    const completedClassrooms = programProgress.reduce(
      (sum, p) => sum + p.completedClassrooms, 0
    );
    const enrolledClassrooms = programProgress.reduce(
      (sum, p) => sum + p.enrolledClassrooms, 0
    );

    const programsWithGrades = programProgress.filter(p => p.averageGrade > 0);
    const overallAverage = programsWithGrades.length > 0
      ? Math.round(
          (programsWithGrades.reduce((sum, p) => sum + p.averageGrade, 0) / 
           programsWithGrades.length) * 10
        ) / 10
      : 0;

    const averageProgress = totalPrograms > 0
      ? Math.round(
          programProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / totalPrograms
        )
      : 0;

    return {
      totalPrograms,
      completedPrograms,
      overallAverage,
      totalClassrooms,
      completedClassrooms,
      averageProgress,
      totalClassroomsCompleted: completedClassrooms,
      totalClassroomsEnrolled: enrolledClassrooms,
    };
  }, [programProgress]);

  const getOverallStats = useCallback(() => overallStats, [overallStats]);

  return {
    programProgress,
    loading,
    error,
    calculateProgress,
    getOverallStats,
    overallStats,
  };
};
