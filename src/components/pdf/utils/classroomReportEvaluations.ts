import { IClassroom, IStudentEvaluation } from '../../../models';
import { EvaluationService } from '../../../services/evaluation/evaluation.service';

export const recalculateClassroomReportEvaluations = (
  evaluations: IStudentEvaluation[],
  classroom: IClassroom
): IStudentEvaluation[] =>
  EvaluationService.recalculateClassroomEvaluations(evaluations, classroom);
