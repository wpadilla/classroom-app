import {
  IAttendanceRecord,
  IEvaluationCriteria,
  IModule,
  IStudentEvaluation,
} from '../../models';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);

const roundScore = (value: number): number => Math.round(value * 10000) / 10000;

const getNonNegativeNumber = (value: number): number =>
  Number.isFinite(value) ? Math.max(value, 0) : 0;

export const calculateAttendancePercentage = (records: IAttendanceRecord[]): number => {
  const allRecords = records || [];
  const gradedRecords = allRecords.filter(
    (record) => record.isPresent === true || record.isPresent === false
  );

  if (gradedRecords.length === 0) {
    return allRecords.some((record) => record.isPresent === null) ? 100 : 0;
  }

  const presentCount = gradedRecords.filter((record) => record.isPresent === true).length;
  return (presentCount / gradedRecords.length) * 100;
};

const getCriterionScore = (score: number, maxScore: number): number => {
  const normalizedMaxScore = getNonNegativeNumber(maxScore);
  if (normalizedMaxScore === 0) return 0;
  return clamp(score, 0, normalizedMaxScore);
};

/**
 * Canonical grade calculation shared by every grade consumer.
 * Evaluation inputs are stored as points earned (for example 25/30), not as
 * independent percentages. Attendance and participation are the only values
 * derived from their detailed records.
 */
export const calculateFinalEvaluation = (
  evaluation: IStudentEvaluation,
  criteria: IEvaluationCriteria,
  totalModules: number = 8,
  calculatedAt: Date = new Date()
): IStudentEvaluation => {
  const attendancePercentage = calculateAttendancePercentage(
    evaluation.attendanceRecords || []
  );
  const attendanceMaxScore = getNonNegativeNumber(criteria.attendance);
  const attendanceScore = roundScore(
    (attendancePercentage / 100) * attendanceMaxScore
  );

  const participationPoints = getNonNegativeNumber(evaluation.participationPoints || 0);
  const participationMaxScore = getNonNegativeNumber(criteria.participation);
  const pointsPerModule = getNonNegativeNumber(criteria.participationPointsPerModule || 1);
  const requiredParticipationPoints = getNonNegativeNumber(totalModules) * pointsPerModule;
  const participationScore = requiredParticipationPoints > 0
    ? roundScore(
        Math.min(
          (participationPoints / requiredParticipationPoints) * participationMaxScore,
          participationMaxScore
        )
      )
    : 0;

  const customScore = (criteria.customCriteria || []).reduce((total, criterion) => {
    const studentScore = (evaluation.scores.customScores || []).find(
      (score) => score.criterionId === criterion.id
    );
    return total + getCriterionScore(studentScore?.score || 0, criterion.points);
  }, 0);

  const totalScore = roundScore(
    Math.min(
      getCriterionScore(evaluation.scores.questionnaires || 0, criteria.questionnaires) +
        attendanceScore +
        participationScore +
        getCriterionScore(evaluation.scores.finalExam || 0, criteria.finalExam) +
        customScore,
      100
    )
  );

  return {
    ...evaluation,
    scores: {
      ...evaluation.scores,
      attendance: attendanceScore,
      participation: participationScore,
    },
    totalScore,
    percentage: totalScore,
    status: 'evaluated',
    evaluatedAt: calculatedAt,
    updatedAt: calculatedAt,
  };
};

export const getAttendancePointStep = (maxScore: number, totalModules: number): number => {
  if (maxScore <= 0 || totalModules <= 0) return 0.1;
  return roundScore(maxScore / totalModules);
};

export const getAttendanceScorePreview = (
  requestedScore: number,
  maxScore: number,
  totalModules: number
): { effectiveScore: number; presentCount: number; totalModules: number } => {
  if (maxScore <= 0 || totalModules <= 0) {
    return { effectiveScore: 0, presentCount: 0, totalModules: Math.max(totalModules, 0) };
  }

  const normalizedScore = clamp(requestedScore, 0, maxScore);
  const presentCount = Math.round((normalizedScore / maxScore) * totalModules);
  const effectiveScore = roundScore((presentCount / totalModules) * maxScore);

  return { effectiveScore, presentCount, totalModules };
};

interface EvaluationScorePreviewInput {
  questionnaires: number;
  attendance: number;
  participation: number;
  finalExam: number;
  customScores: { criterionId: string; score: number }[];
}

/**
 * Calculates the grade shown while editing point-based evaluation inputs.
 * Attendance uses the effective whole-module score that will be persisted,
 * so the preview and the saved evaluation remain aligned.
 */
export const calculateEvaluationTotalPreview = (
  scores: EvaluationScorePreviewInput,
  criteria: IEvaluationCriteria,
  totalModules: number
): number => {
  const attendanceScore = getAttendanceScorePreview(
    scores.attendance,
    criteria.attendance,
    totalModules
  ).effectiveScore;
  const customScore = (criteria.customCriteria || []).reduce((total, criterion) => {
    const score = scores.customScores.find((item) => item.criterionId === criterion.id)?.score || 0;
    return total + getCriterionScore(score, criterion.points);
  }, 0);

  return roundScore(
    Math.min(
      getCriterionScore(scores.questionnaires, criteria.questionnaires) +
        attendanceScore +
        getCriterionScore(scores.participation, criteria.participation) +
        getCriterionScore(scores.finalExam, criteria.finalExam) +
        customScore,
      100
    )
  );
};

interface BuildAttendanceRecordsFromScoreOptions {
  requestedScore: number;
  maxScore: number;
  modules: IModule[];
  existingRecords: IAttendanceRecord[];
  studentId: string;
  markedBy: string;
  markedAt?: Date;
}

export const buildAttendanceRecordsFromScore = ({
  requestedScore,
  maxScore,
  modules,
  existingRecords,
  studentId,
  markedBy,
  markedAt = new Date(),
}: BuildAttendanceRecordsFromScoreOptions): IAttendanceRecord[] => {
  const orderedModules = [...modules].sort((a, b) => a.weekNumber - b.weekNumber);
  const { presentCount } = getAttendanceScorePreview(
    requestedScore,
    maxScore,
    orderedModules.length
  );
  const existingByModule = new Map(
    existingRecords.map((record) => [record.moduleId, record])
  );

  // Keep as many existing presences as possible, then fill the earliest modules.
  const presentModuleIds = new Set(
    orderedModules
      .filter((module) => existingByModule.get(module.id)?.isPresent === true)
      .slice(0, presentCount)
      .map((module) => module.id)
  );

  for (const module of orderedModules) {
    if (presentModuleIds.size >= presentCount) break;
    presentModuleIds.add(module.id);
  }

  return orderedModules.map((module) => {
    const existingRecord = existingByModule.get(module.id);
    const isPresent = presentModuleIds.has(module.id);

    if (existingRecord?.isPresent === isPresent) {
      return existingRecord;
    }

    return {
      moduleId: module.id,
      studentId,
      isPresent,
      date: existingRecord?.date || module.date || markedAt,
      markedBy,
      markedAt,
    };
  });
};

export const participationScoreToAccumulatedPoints = (
  score: number,
  criteria: IEvaluationCriteria,
  totalModules: number
): number => {
  if (criteria.participation <= 0 || totalModules <= 0) return 0;

  const normalizedScore = clamp(score, 0, criteria.participation);
  const requiredPoints = totalModules * (criteria.participationPointsPerModule || 1);
  return roundScore((normalizedScore / criteria.participation) * requiredPoints);
};
