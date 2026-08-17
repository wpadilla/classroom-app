import { IClassroomHistory, IStudentEvaluation } from '../../models';
import {
  calculateStudentHistoryAverage,
  formatStudentGrade,
  reconcileStudentHistoryGrades,
} from './evaluation-history.utils';

describe('reconcileStudentHistoryGrades', () => {
  it('calculates one overall average from authoritative archived grades', () => {
    const history = [
      { role: 'student', status: 'completed', finalGrade: 92 },
      { role: 'student', status: 'completed', finalGrade: 98.75 },
      { role: 'student', status: 'completed', finalGrade: 92 },
      { role: 'student', status: 'dropped', finalGrade: 10 },
    ] as IClassroomHistory[];

    expect(calculateStudentHistoryAverage(history)).toBe(94.25);
    expect(formatStudentGrade(calculateStudentHistoryAverage(history))).toBe('94.3');
    expect(formatStudentGrade(92)).toBe('92');
  });

  it('repairs a stale student history grade and its pass status', () => {
    const history = [{
      classroomId: 'hogar-cristiano',
      role: 'student',
      finalGrade: 83.75,
      status: 'failed',
    }] as IClassroomHistory[];
    const evaluations = [{
      classroomId: 'hogar-cristiano',
      percentage: 98.75,
    }] as IStudentEvaluation[];

    expect(reconcileStudentHistoryGrades(history, evaluations)[0]).toMatchObject({
      finalGrade: 98.75,
      status: 'completed',
    });
  });

  it('keeps archived entries that have no matching source evaluation', () => {
    const history = [{
      classroomId: 'older-run',
      role: 'student',
      finalGrade: 84,
      status: 'completed',
    }] as IClassroomHistory[];

    expect(reconcileStudentHistoryGrades(history, [])).toEqual(history);
  });
});
