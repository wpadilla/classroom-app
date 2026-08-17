import React, { useMemo } from 'react';
import { Button } from 'reactstrap';
import { AttendanceStatus, IUser, IModule } from '../../../../models';
import { DataTable } from '../../../../components/common';
import { EmptyState, Switch } from '../../../../components/mobile';
import StatStrip, { StatItem } from '../../../../components/student/StatStrip';
import SectionHeader from '../../../../components/student/SectionHeader';

interface ClassroomAttendanceSectionProps {
  students: IUser[];
  currentModule: IModule | null;
  isFinalized: boolean;
  attendanceRecords: Map<string, AttendanceStatus>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onOpenBulkAttendance: () => void;
  onClearSelection: () => void;
  onAttendanceChange: (studentId: string, status: boolean | null) => void;
}

const ClassroomAttendanceSection: React.FC<ClassroomAttendanceSectionProps> = ({
  students,
  currentModule,
  isFinalized,
  attendanceRecords,
  selectedIds,
  onSelectionChange,
  onOpenBulkAttendance,
  onClearSelection,
  onAttendanceChange,
}) => {
  const stats = useMemo<StatItem[]>(() => {
    const presentCount = Array.from(attendanceRecords.values()).filter((value) => value === true).length;
    const absentCount = Array.from(attendanceRecords.values()).filter((value) => value === false).length;
    const excusedCount = Array.from(attendanceRecords.values()).filter((value) => value === null).length;
    const unassignedCount = Math.max(
      students.length - presentCount - absentCount - excusedCount,
      0
    );

    return [
      { icon: 'bi-people', label: 'Total', value: students.length, color: 'blue' },
      { icon: 'bi-check-circle', label: 'Presentes', value: presentCount, color: 'green' },
      { icon: 'bi-x-circle', label: 'Ausentes', value: absentCount, color: 'red' },
      { icon: 'bi-file-earmark-check', label: 'Excusas', value: excusedCount, color: 'amber' },
      { icon: 'bi-clock', label: 'Sin asignar', value: unassignedCount, color: 'blue' },
    ];
  }, [attendanceRecords, students.length]);

  return (
    <SectionHeader
      icon="bi-calendar-check"
      title="Asistencia"
      badge={currentModule ? `Semana ${currentModule.weekNumber}` : 'Pendiente'}
      badgeColor={currentModule?.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
    >
      <div className="rounded-[28px] bg-white p-2 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-base font-semibold text-slate-900">
              {currentModule ? `Pase de lista del módulo ${currentModule.weekNumber}` : 'Pase de lista'}
            </p>
            <p className="mb-0 text-sm text-slate-500">
              {isFinalized
                ? 'La clase está finalizada. Solo puedes revisar el historial.'
                : 'Cada cambio se guarda automáticamente.'}
            </p>
          </div>
        </div>

        {students.length > 0 ? (
          <div className="mb-4">
            <StatStrip stats={stats} columns={5} />
          </div>
        ) : null}

        <DataTable<IUser>
          data={students}
          columns={[
            {
              header: 'Estudiante',
              accessor: 'firstName',
              render: (_, student) => (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <small className="text-slate-500">{student.phone || 'Sin teléfono'}</small>
                </div>
              ),
            },
            {
              header: 'Asistencia',
              accessor: (student) => attendanceRecords.get(student.id),
              width: '280px',
              align: 'center',
              render: (isPresent, student) => {
                const isExcused = isPresent === null;

                return (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="min-w-[64px] text-xs text-slate-500">
                      {isPresent === true
                        ? 'Presente'
                        : isPresent === false
                        ? 'Ausente'
                        : isExcused
                        ? 'Excusa'
                        : 'Sin marcar'}
                    </span>
                    <Switch
                      checked={isPresent === true}
                      onChange={(checked) => onAttendanceChange(student.id, checked)}
                      disabled={isFinalized || isExcused}
                      ariaLabel={`Marcar a ${student.firstName} ${student.lastName} como ${
                        isPresent === true ? 'ausente' : 'presente'
                      }`}
                      onColor="bg-success"
                      offColor="bg-danger"
                    />
                    <label className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      isExcused
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isExcused}
                        onChange={(event) =>
                          onAttendanceChange(student.id, event.target.checked ? null : false)
                        }
                        disabled={isFinalized}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      Excusa
                    </label>
                  </div>
                );
              },
            },
          ]}
          keyExtractor={(student) => student.id}
          searchable
          searchFields={['firstName', 'lastName', 'phone']}
          searchPlaceholder="Buscar estudiante por nombre o teléfono..."
          selectable={!isFinalized}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          bulkActions={(
            <>
              <Button color="primary" size="sm" onClick={onOpenBulkAttendance}>
                <i className="bi bi-check-circle me-1" />
                Pasar asistencia
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
              description="Inscribe estudiantes para comenzar a registrar asistencia."
            />
          )}
          hover
        />
      </div>
    </SectionHeader>
  );
};

export default ClassroomAttendanceSection;
