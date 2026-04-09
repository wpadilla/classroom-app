import React, { useMemo } from 'react';
import { Button, Badge } from 'reactstrap';
import { motion } from 'framer-motion';
import { IUser, IModule } from '../../../../models';
import { DataTable } from '../../../../components/common';
import { EmptyState } from '../../../../components/mobile';
import SectionHeader from '../../../../components/student/SectionHeader';

interface ClassroomParticipationSectionProps {
  students: IUser[];
  currentModule: IModule | null;
  isFinalized: boolean;
  participationTotals: Map<string, number>;
  maxParticipationPoints: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onClearSelection: () => void;
  onOpenBulkParticipation: () => void;
  onParticipationChange: (studentId: string, delta: number) => void;
  onOpenScoreDialog: (student: IUser, currentScore: number) => void;
}

const ClassroomParticipationSection: React.FC<ClassroomParticipationSectionProps> = ({
  students,
  currentModule,
  isFinalized,
  participationTotals,
  maxParticipationPoints,
  selectedIds,
  onSelectionChange,
  onClearSelection,
  onOpenBulkParticipation,
  onParticipationChange,
  onOpenScoreDialog,
}) => {
  const topParticipants = useMemo(
    () =>
      students
        .map((student) => ({
          student,
          points: participationTotals.get(student.id) || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3),
    [participationTotals, students]
  );

  return (
    <SectionHeader
      icon="bi-hand-thumbs-up"
      title="Participación"
      badge={currentModule ? `Semana ${currentModule.weekNumber}` : 'Pendiente'}
      badgeColor="bg-purple-100 text-purple-700"
      defaultOpen={false}
    >
      <div className="rounded-[28px] bg-white p-0 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="p-3">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-base font-semibold text-slate-900">
                Puntos acumulados del curso
              </p>
              <p className="mb-0 text-sm text-slate-500">
                Máximo configurado: {maxParticipationPoints} puntos.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
              <i className="bi bi-stars me-2" />
              {isFinalized ? 'Solo lectura' : 'Ajuste rápido'}
            </span>
          </div>

          {topParticipants.length > 0 ? (
            <div className="mb-2 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {topParticipants.map((item, index) => (
                <motion.div
                  key={item.student.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.05 }}
                  className="min-w-[210px] flex-shrink-0 rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                      index === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 truncate text-sm font-semibold text-slate-900">
                        {item.student.firstName} {item.student.lastName}
                      </p>
                      <p className="mb-0 text-sm text-amber-700">{item.points} puntos</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>

        <DataTable<IUser>
          data={students}
          columns={[
            {
              header: 'Estudiante',
              accessor: (student) => `${student.firstName} ${student.lastName}`,
              render: (fullName, student) => (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{fullName}</div>
                  <small className="text-slate-500">{student.phone || 'Sin teléfono'}</small>
                </div>
              ),
            },
            {
              header: 'Puntos',
              accessor: (student) => participationTotals.get(student.id) || 0,
              width: '90px',
              className: 'text-center',
              render: (totalPoints) => (
                <motion.div
                  key={totalPoints}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                >
                  <Badge
                    color={
                      totalPoints >= maxParticipationPoints
                        ? 'success'
                        : totalPoints >= Math.ceil(maxParticipationPoints / 2)
                        ? 'warning'
                        : 'secondary'
                    }
                    className="px-2 py-1"
                  >
                    {totalPoints}
                  </Badge>
                </motion.div>
              ),
            },
            {
              header: 'Acciones',
              width: '300px',
              className: 'text-center',
              render: (_, student) => {
                const totalPoints = participationTotals.get(student.id) || 0;

                return (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => onParticipationChange(student.id, -1)}
                      disabled={isFinalized || totalPoints <= 0}
                    >
                      <i className="bi bi-dash-lg me-1" />
                      -1
                    </Button>
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => onOpenScoreDialog(student, totalPoints)}
                      disabled={isFinalized}
                    >
                      <i className="bi bi-pencil-square" />
                    </Button>
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => onParticipationChange(student.id, 1)}
                      disabled={isFinalized || totalPoints >= maxParticipationPoints}
                    >
                      <i className="bi bi-plus-lg me-1" />
                      +1
                    </Button>
                  </div>
                );
              },
            },
          ]}
          keyExtractor={(student) => student.id}
          searchable
          searchFields={['firstName', 'lastName', 'phone']}
          searchPlaceholder="Buscar estudiante..."
          selectable={!isFinalized}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          bulkActions={(
            <>
              <Button color="primary" size="sm" onClick={onOpenBulkParticipation}>
                <i className="bi bi-hand-thumbs-up me-1" />
                Asignar puntos
              </Button>
              <Button color="secondary" size="sm" outline onClick={onClearSelection}>
                <i className="bi bi-x me-1" />
                Cancelar
              </Button>
            </>
          )}
          emptyState={(
            <EmptyState
              icon="bi-people"
              heading="Sin estudiantes inscritos"
              description="Inscribe estudiantes para comenzar a registrar participación."
            />
          )}
          hover
        />
      </div>
    </SectionHeader>
  );
};

export default ClassroomParticipationSection;
