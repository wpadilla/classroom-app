import React, { useMemo } from 'react';
import { Button } from 'reactstrap';
import { IUser, IModule } from '../../../../models';
import { DataTable } from '../../../../components/common';
import { EmptyState, Switch } from '../../../../components/mobile';
import StatStrip, { StatItem } from '../../../../components/student/StatStrip';
import SectionHeader from '../../../../components/student/SectionHeader';

interface ClassroomAttendanceSectionProps {
  students: IUser[];
  currentModule: IModule | null;
  isFinalized: boolean;
  attendanceRecords: Map<string, boolean>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onOpenBulkAttendance: () => void;
  onClearSelection: () => void;
  onAttendanceChange: (studentId: string, isPresent: boolean) => void;
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

    return [
      { icon: 'bi-people', label: 'Total', value: students.length, color: 'blue' },
      { icon: 'bi-check-circle', label: 'Presentes', value: presentCount, color: 'green' },
      { icon: 'bi-x-circle', label: 'Ausentes', value: absentCount, color: 'red' },
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
            <StatStrip stats={stats} columns={3} />
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
              width: '160px',
              align: 'center',
              render: (isPresent, student) => (
                <div className="flex items-center justify-center gap-2">
                  <span className="hidden text-xs text-slate-500 md:inline">
                    {isPresent === true ? 'Presente' : isPresent === false ? 'Ausente' : 'Sin marcar'}
                  </span>
                  <Switch
                    checked={isPresent === true}
                    onChange={(checked) => onAttendanceChange(student.id, checked)}
                    disabled={isFinalized}
                    onColor="bg-success"
                    offColor="bg-danger"
                  />
                </div>
              ),
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
