import {
  IAttendanceRecord,
  IEvaluationCriteria,
  IModule,
  IStudentEvaluation,
} from '../../models';
import {
  buildAttendanceRecordsFromScore,
  calculateAttendancePercentage,
  calculateEvaluationTotalPreview,
  calculateFinalEvaluation,
  getAttendancePointStep,
  getAttendanceScorePreview,
  participationScoreToAccumulatedPoints,
} from './evaluation-score.utils';

const modules = Array.from({ length: 4 }, (_, index) => ({
  id: `module-${index + 1}`,
  weekNumber: index + 1,
  date: new Date(2026, 0, index + 1),
})) as IModule[];

describe('evaluation score inputs', () => {
  it('recalculates the stale archived grade from the underlying criterion values', () => {
    const criteria = {
      questionnaires: 30,
      attendance: 20,
      participation: 20,
      participationPointsPerModule: 2,
      finalExam: 30,
      customCriteria: [],
    } as unknown as IEvaluationCriteria;
    const evaluation = {
      scores: {
        questionnaires: 30,
        attendance: 0,
        participation: 0,
        finalExam: 30,
        customScores: [],
      },
      attendanceRecords: Array.from({ length: 8 }, (_, index) => ({
        moduleId: `module-${index + 1}`,
        isPresent: true,
      })),
      participationPoints: 15,
      percentage: 83.75,
    } as unknown as IStudentEvaluation;

    const result = calculateFinalEvaluation(evaluation, criteria, 8);

    expect(result.scores.attendance).toBe(20);
    expect(result.scores.participation).toBe(18.75);
    expect(result.percentage).toBe(98.75);
  });

  it('does not produce NaN when a criterion is disabled', () => {
    const result = calculateFinalEvaluation({
      scores: {
        questionnaires: 0,
        attendance: 0,
        participation: 0,
        finalExam: 0,
        customScores: [],
      },
      attendanceRecords: [],
      participationPoints: 0,
    } as unknown as IStudentEvaluation, {
      questionnaires: 0,
      attendance: 0,
      participation: 0,
      participationPointsPerModule: 1,
      finalExam: 0,
      customCriteria: [],
    } as unknown as IEvaluationCriteria, 0);

    expect(result.percentage).toBe(0);
    expect(Number.isNaN(result.percentage)).toBe(false);
  });

  it('converts 15/20 attendance points into three present modules out of four', () => {
    const records = buildAttendanceRecordsFromScore({
      requestedScore: 15,
      maxScore: 20,
      modules,
      existingRecords: [],
      studentId: 'student-1',
      markedBy: 'teacher-1',
    });

    expect(records.filter((record) => record.isPresent === true)).toHaveLength(3);
    expect(records.filter((record) => record.isPresent === false)).toHaveLength(1);
    expect(calculateAttendancePercentage(records)).toBe(75);
  });

  it('supports decimal point increments without fractional attendance states', () => {
    expect(getAttendancePointStep(20, 3)).toBe(6.6667);
    expect(getAttendanceScorePreview(22.5, 30, 8)).toEqual({
      effectiveScore: 22.5,
      presentCount: 6,
      totalModules: 8,
    });
  });

  it('previews the final total using the effective attendance and custom criteria', () => {
    const criteria = {
      questionnaires: 30,
      attendance: 20,
      participation: 20,
      participationPointsPerModule: 1,
      finalExam: 25,
      customCriteria: [{ id: 'practice', name: 'Práctica', points: 5 }],
    } as IEvaluationCriteria;

    const total = calculateEvaluationTotalPreview({
      questionnaires: 30,
      attendance: 14,
      participation: 18.75,
      finalExam: 25,
      customScores: [{ criterionId: 'practice', score: 7 }],
    }, criteria, 4);

    // 14 requested attendance points become 3/4 modules, or 15 effective points.
    // The custom criterion is also clamped to its configured maximum of 5.
    expect(total).toBe(93.75);
  });

  it('does not penalize an excused module in the attendance percentage', () => {
    const records = [
      { isPresent: true },
      { isPresent: false },
      { isPresent: null },
    ] as IAttendanceRecord[];

    expect(calculateAttendancePercentage(records)).toBe(50);
    expect(calculateAttendancePercentage([{ isPresent: null } as IAttendanceRecord])).toBe(100);
  });

  it('turns unassigned and excused modules into explicit states after a manual score edit', () => {
    const records = buildAttendanceRecordsFromScore({
      requestedScore: 5,
      maxScore: 20,
      modules,
      existingRecords: [
        { moduleId: 'module-1', isPresent: undefined },
        { moduleId: 'module-2', isPresent: null },
      ] as IAttendanceRecord[],
      studentId: 'student-1',
      markedBy: 'teacher-1',
    });

    expect(records.filter((record) => record.isPresent === true)).toHaveLength(1);
    expect(records.some(
      (record) => record.isPresent === null || record.isPresent === undefined
    )).toBe(false);
  });

  it('converts weighted participation back to accumulated participation points', () => {
    const criteria = {
      participation: 20,
      participationPointsPerModule: 2,
    } as IEvaluationCriteria;

    expect(participationScoreToAccumulatedPoints(18.75, criteria, 8)).toBe(15);
  });
});
