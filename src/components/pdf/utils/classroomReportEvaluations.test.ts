import { IClassroom, IStudentEvaluation } from '../../../models';
import { recalculateClassroomReportEvaluations } from './classroomReportEvaluations';

describe('recalculateClassroomReportEvaluations', () => {
  it('uses the same current criteria calculation as the evaluation screen', () => {
    const classroom = {
      modules: Array.from({ length: 8 }, (_, index) => ({ id: `module-${index + 1}` })),
      evaluationCriteria: {
        questionnaires: 30,
        attendance: 20,
        participation: 20,
        participationPointsPerModule: 2,
        finalExam: 30,
        customCriteria: [],
        participationRecords: [],
      },
    } as unknown as IClassroom;
    const evaluation = {
      studentId: 'student-1',
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
      status: 'evaluated',
    } as unknown as IStudentEvaluation;

    const [result] = recalculateClassroomReportEvaluations([evaluation], classroom);

    expect(result.scores.attendance).toBe(20);
    expect(result.scores.participation).toBe(18.75);
    expect(result.percentage).toBe(98.75);
  });
});
