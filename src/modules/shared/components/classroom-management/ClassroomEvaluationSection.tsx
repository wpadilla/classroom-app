import React, { useMemo } from 'react';
import { Badge } from 'reactstrap';
import { IUser, IStudentEvaluation } from '../../../../models';
import { DataTable } from '../../../../components/common';
import { EmptyState, Switch } from '../../../../components/mobile';
import SectionHeader from '../../../../components/student/SectionHeader';

interface ClassroomEvaluationSectionProps {
  students: IUser[];
  evaluations: Map<string, IStudentEvaluation>;
  participationTotals: Map<string, number>;
  maxParticipationPoints: number;
  onNavigateToManager: () => void;
  onToggleStudentStatus: (studentId: string, currentStatus: boolean) => void;
  getStudentAttendanceRate: (studentId: string) => number;
}

const ClassroomEvaluationSection: React.FC<ClassroomEvaluationSectionProps> = ({
  students,
  evaluations,
  participationTotals,
  maxParticipationPoints,
  onNavigateToManager,
  onToggleStudentStatus,
  getStudentAttendanceRate,
}) => {
  const evaluatedCount = useMemo(
    () => Array.from(evaluations.values()).filter((evaluation) => evaluation.status === 'evaluated').length,
    [evaluations]
  );

  return (
    <SectionHeader
      icon="bi-clipboard-check"
      title="Evaluaciones"
      badge={`${evaluatedCount}/${students.length}`}
      badgeColor="bg-emerald-100 text-emerald-700"
      defaultOpen={false}
      rightAction={(
        <button
          type="button"
          onClick={onNavigateToManager}
          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <i className="bi bi-arrow-right-circle" />
          Gestionar
        </button>
      )}
    >
      <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <i className="bi bi-info-circle" />
            </div>
            <div>
              <p className="mb-1 font-semibold">Cierre final del curso</p>
              <p className="mb-0 text-blue-800/80">
                Las evaluaciones finales se configuran desde el gestor dedicado. Máx. participación: {maxParticipationPoints} puntos.
              </p>
            </div>
          </div>
        </div>

        <DataTable<IUser>
          data={students}
          columns={[
            {
              header: 'Estudiante',
              accessor: 'firstName',
              render: (_, student) => {
                const evaluation = evaluations.get(student.id);
                const isActive = evaluation?.isActive !== false;

                return (
                  <div className={isActive ? '' : 'opacity-60'}>
                    <div className="text-sm font-semibold text-slate-900">
                      {student.firstName} {student.lastName}
                    </div>
                    <small className="text-slate-500">{student.phone || 'Sin teléfono'}</small>
                  </div>
                );
              },
            },
            {
              header: 'Asist.',
              accessor: (student) => getStudentAttendanceRate(student.id),
              width: '88px',
              align: 'center',
              render: (attendanceRate) => (
                <Badge color={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'danger'}>
                  {typeof attendanceRate === 'number' ? attendanceRate.toFixed(0) : 0}%
                </Badge>
              ),
            },
            {
              header: 'Part.',
              accessor: (student) => participationTotals.get(student.id) || 0,
              width: '110px',
              align: 'center',
              render: (participation) => {
                const percentage =
                  maxParticipationPoints > 0
                    ? Math.min((participation / maxParticipationPoints) * 100, 100)
                    : 0;

                return (
                  <div className="flex flex-col items-center">
                    <Badge color={percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'secondary'}>
                      {participation}/{maxParticipationPoints}
                    </Badge>
                    <small className="text-slate-500">{percentage.toFixed(0)}%</small>
                  </div>
                );
              },
            },
            {
              header: 'Estado',
              accessor: (student) => evaluations.get(student.id)?.status,
              width: '110px',
              align: 'center',
              mobileHidden: true,
              render: (status) => (
                <Badge color={status === 'evaluated' ? 'success' : status === 'in-progress' ? 'warning' : 'secondary'}>
                  {status === 'evaluated' ? 'Evaluado' : status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                </Badge>
              ),
            },
            {
              header: 'Activo',
              accessor: (student) => evaluations.get(student.id)?.isActive !== false,
              width: '82px',
              align: 'center',
              render: (isActive, student) => (
                <Switch
                  checked={isActive}
                  onChange={() => onToggleStudentStatus(student.id, isActive)}
                  onColor="bg-success"
                  offColor="bg-danger"
                />
              ),
            },
          ]}
          keyExtractor={(student) => student.id}
          searchable
          searchFields={['firstName', 'lastName', 'phone']}
          searchPlaceholder="Buscar estudiante..."
          emptyState={(
            <EmptyState
              icon="bi-clipboard-check"
              heading="Sin estudiantes inscritos"
              description="Inscribe estudiantes para comenzar a evaluar."
            />
          )}
          hover
        />
      </div>
    </SectionHeader>
  );
};

export default ClassroomEvaluationSection;
