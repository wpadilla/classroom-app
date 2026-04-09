import React, { useMemo } from 'react';
import { Badge } from 'reactstrap';
import { motion } from 'framer-motion';
import SectionHeader from '../../../components/student/SectionHeader';
import { IClassroom, IStudentEvaluation, IUser } from '../../../models';

interface EvaluationSummarySectionProps {
  classroom: IClassroom;
  students: IUser[];
  evaluations: Map<string, IStudentEvaluation>;
  classAverage: number;
  distribution: {
    excellent: number;
    good: number;
    regular: number;
    poor: number;
  };
}

const distributionConfig = [
  { key: 'excellent', label: 'Excelente', range: '90-100', color: 'bg-emerald-500', badge: 'success' },
  { key: 'good', label: 'Bueno', range: '80-89', color: 'bg-blue-500', badge: 'info' },
  { key: 'regular', label: 'Regular', range: '70-79', color: 'bg-amber-500', badge: 'warning' },
  { key: 'poor', label: 'Deficiente', range: '<70', color: 'bg-rose-500', badge: 'danger' },
] as const;

const EvaluationSummarySection: React.FC<EvaluationSummarySectionProps> = ({
  classroom,
  students,
  evaluations,
  classAverage,
  distribution,
}) => {
  const topStudents = useMemo(
    () =>
      Array.from(evaluations.entries())
        .sort((a, b) => (b[1].percentage || 0) - (a[1].percentage || 0))
        .slice(0, 5)
        .map(([studentId, evaluation]) => ({
          student: students.find((item) => item.id === studentId),
          evaluation,
        })),
    [evaluations, students]
  );

  return (
    <SectionHeader
      icon="bi-graph-up"
      title="Resumen del rendimiento"
      badge={`${classAverage.toFixed(1)}%`}
      badgeColor="bg-indigo-100 text-indigo-700"
      defaultOpen={false}
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="mb-4 text-base font-semibold text-slate-900">Distribución de calificaciones</p>
          <div className="space-y-4">
            {distributionConfig.map((item, index) => {
              const value = distribution[item.key];
              const percentage = students.length > 0 ? (value / students.length) * 100 : 0;

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.05 }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="mb-0 text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mb-0 text-xs text-slate-500">{item.range}</p>
                    </div>
                    <Badge color={item.badge}>{value}</Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Criterios activos</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                Cuestionarios: {classroom.evaluationCriteria?.questionnaires || 0}
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                Asistencia: {classroom.evaluationCriteria?.attendance || 0}
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                Participación: {classroom.evaluationCriteria?.participation || 0}
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                Examen: {classroom.evaluationCriteria?.finalExam || 0}
              </span>
              {(classroom.evaluationCriteria?.customCriteria || []).map((criterion) => (
                <span key={criterion.id} className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                  {criterion.name}: {criterion.points}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="mb-4 text-base font-semibold text-slate-900">Top estudiantes</p>
          {topStudents.length === 0 ? (
            <p className="mb-0 text-sm text-slate-500">Todavía no hay evaluaciones con calificación final.</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map(({ student, evaluation }, index) => (
                <motion.div
                  key={`${student?.id || 'student'}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.05 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                        index === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 truncate text-sm font-semibold text-slate-900">
                          {student ? `${student.firstName} ${student.lastName}` : 'Estudiante'}
                        </p>
                        <p className="mb-0 text-xs text-slate-500">
                          {evaluation.status === 'evaluated' ? 'Evaluado' : 'En progreso'}
                        </p>
                      </div>
                    </div>
                    <Badge color="success">{evaluation.percentage?.toFixed(1)}%</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionHeader>
  );
};

export default EvaluationSummarySection;
