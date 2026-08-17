import { IClassroomHistory, IStudentEvaluation } from '../../models';

export const getStudentHistoryGrades = (
  history: IClassroomHistory[] = []
): number[] => history
  .filter((entry) =>
    entry.role === 'student' &&
    entry.status !== 'dropped' &&
    Number.isFinite(entry.finalGrade)
  )
  .map((entry) => entry.finalGrade as number);

export const calculateStudentHistoryAverage = (
  history: IClassroomHistory[] = []
): number => {
  const grades = getStudentHistoryGrades(history);
  if (grades.length === 0) return 0;
  return grades.reduce((total, grade) => total + grade, 0) / grades.length;
};

export const formatStudentGrade = (grade: number): string => {
  const rounded = Math.round(grade * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const getHistoryStatus = (finalGrade: number): 'completed' | 'failed' =>
  finalGrade >= 70 ? 'completed' : 'failed';

/**
 * Replaces archived grades with recalculated evaluation values when the raw
 * evaluation is still available. Entries without source data stay untouched.
 */
export const reconcileStudentHistoryGrades = (
  history: IClassroomHistory[] = [],
  evaluations: IStudentEvaluation[] = []
): IClassroomHistory[] => {
  const evaluationByClassroom = new Map(
    evaluations.map((evaluation) => [evaluation.classroomId, evaluation])
  );

  return history.map((entry) => {
    if (entry.role !== 'student') return entry;

    const evaluation = evaluationByClassroom.get(entry.classroomId);
    if (!evaluation || !Number.isFinite(evaluation.percentage)) return entry;

    return {
      ...entry,
      finalGrade: evaluation.percentage,
      status: getHistoryStatus(evaluation.percentage),
    };
  });
};

export const didStudentHistoryGradesChange = (
  previous: IClassroomHistory[] = [],
  next: IClassroomHistory[] = []
): boolean => previous.some((entry, index) => {
  const nextEntry = next[index];
  return Boolean(
    nextEntry &&
      (entry.finalGrade !== nextEntry.finalGrade || entry.status !== nextEntry.status)
  );
});
