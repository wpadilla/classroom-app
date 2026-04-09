import React, { useMemo } from 'react';
import { Badge, Button, Spinner } from 'reactstrap';
import { DataTable } from '../../../components/common';
import { EmptyState } from '../../../components/mobile';
import SectionHeader from '../../../components/student/SectionHeader';
import { IClassroom, ICustomCriterion, IStudentEvaluation, IUser } from '../../../models';
import {
  isStudentEligibleForCertificate,
} from '../certificates/certificate.utils';

export type StudentWithEvaluation = IUser & {
  evaluation: IStudentEvaluation;
};

interface EvaluationStudentsSectionProps {
  classroom: IClassroom;
  students: StudentWithEvaluation[];
  selectedIds: Set<string>;
  isFinalized: boolean;
  certificateLoadingId: string | null;
  bulkCertificateLoading: boolean;
  onSelectionChange: (ids: Set<string>) => void;
  onDownloadCertificate: (student: StudentWithEvaluation) => void;
  onOpenEvaluationModal: (student: IUser) => void;
  onBulkDownloadCertificates: () => void;
  onOpenBulkEvaluation: () => void;
  onClearSelection: () => void;
}

const EvaluationStudentsSection: React.FC<EvaluationStudentsSectionProps> = ({
  classroom,
  students,
  selectedIds,
  isFinalized,
  certificateLoadingId,
  bulkCertificateLoading,
  onSelectionChange,
  onDownloadCertificate,
  onOpenEvaluationModal,
  onBulkDownloadCertificates,
  onOpenBulkEvaluation,
  onClearSelection,
}) => {
  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.has(student.id)),
    [selectedIds, students]
  );

  const eligibleSelectedStudents = useMemo(
    () => selectedStudents.filter((student) => isStudentEligibleForCertificate(student.evaluation)),
    [selectedStudents]
  );

  const columns = useMemo(
    () => [
      {
        header: 'Estudiante',
        accessor: (row: StudentWithEvaluation) => `${row.firstName} ${row.lastName}`,
        render: (fullName: string, row: StudentWithEvaluation) => (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{fullName}</div>
            <small className="text-slate-500">{row.phone || 'Sin teléfono'}</small>
          </div>
        ),
      },
      {
        header: 'Cuestionarios',
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <span>{row.evaluation.scores.questionnaires}/{classroom.evaluationCriteria?.questionnaires || 0}</span>
        ),
      },
      {
        header: 'Asistencia',
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <span>{row.evaluation.scores.attendance.toFixed(1)}/{classroom.evaluationCriteria?.attendance || 0}</span>
        ),
      },
      {
        header: 'Participación',
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <span>{row.evaluation.scores.participation.toFixed(1)}/{classroom.evaluationCriteria?.participation || 0}</span>
        ),
      },
      {
        header: 'Examen',
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <span>{row.evaluation.scores.finalExam}/{classroom.evaluationCriteria?.finalExam || 0}</span>
        ),
      },
      ...((classroom.evaluationCriteria?.customCriteria || []).map((criterion: ICustomCriterion) => ({
        header: criterion.name,
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <span>
            {row.evaluation.scores.customScores.find((score) => score.criterionId === criterion.id)?.score || 0}/{criterion.points}
          </span>
        ),
      })) as any[]),
      {
        header: 'Total',
        align: 'center' as const,
        render: (_: unknown, row: StudentWithEvaluation) => (
          <Badge color={row.evaluation.percentage && row.evaluation.percentage >= 70 ? 'success' : 'danger'}>
            {row.evaluation.percentage?.toFixed(1)}%
          </Badge>
        ),
      },
      {
        header: 'Estado',
        align: 'center' as const,
        mobileHidden: true,
        render: (_: unknown, row: StudentWithEvaluation) =>
          isStudentEligibleForCertificate(row.evaluation) ? (
            <div className="d-flex flex-column align-items-center gap-1">
              <Badge color="success">Evaluado</Badge>
              <Badge color="info" pill>Certificable</Badge>
            </div>
          ) : row.evaluation.status === 'evaluated' ? (
            <Badge color="success">Evaluado</Badge>
          ) : (
            <Badge color="warning">En progreso</Badge>
          ),
      },
    ],
    [classroom.evaluationCriteria]
  );

  return (
    <SectionHeader
      icon="bi-clipboard-check"
      title="Evaluación final"
      badge={`${students.length} estudiantes`}
      badgeColor="bg-blue-100 text-blue-700"
      alwaysOpen
    >
      <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <i className="bi bi-award" />
            </div>
            <div>
              <p className="mb-1 font-semibold">Certificados y edición rápida</p>
              <p className="mb-0 text-blue-800/80">
                Selecciona estudiantes para generar certificados en lote o aplicar la misma evaluación a varios perfiles.
              </p>
            </div>
          </div>
        </div>

        <DataTable<StudentWithEvaluation>
          data={students}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchable
          searchFields={['firstName', 'lastName', 'phone']}
          searchPlaceholder="Buscar estudiante por nombre..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          actions={(row) => (
            <div className="d-flex gap-1">
                    <Button
                      color="secondary"
                      size="sm"
                      outline
                      onClick={() => onDownloadCertificate(row)}
                      disabled={!isStudentEligibleForCertificate(row.evaluation) || bulkCertificateLoading}
                      title={
                        isStudentEligibleForCertificate(row.evaluation)
                          ? 'Descargar certificado'
                          : 'Disponible solo para estudiantes evaluados y aprobados'
                      }
                    >
                {certificateLoadingId === row.id ? <Spinner size="sm" /> : <i className="bi bi-award" />}
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => onOpenEvaluationModal(row)}
                disabled={isFinalized}
                title={isFinalized ? 'Revierte la finalización para editar' : 'Editar evaluación'}
              >
                <i className="bi bi-pencil" />
              </Button>
            </div>
          )}
          bulkActions={(
            <>
              <Button
                color="secondary"
                size="sm"
                onClick={onBulkDownloadCertificates}
                disabled={bulkCertificateLoading || eligibleSelectedStudents.length === 0}
              >
                {bulkCertificateLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-2" />
                    Certificados
                  </>
                )}
              </Button>
              <Button color="primary" size="sm" onClick={onOpenBulkEvaluation} disabled={isFinalized}>
                <i className="bi bi-pencil-square me-2" />
                Evaluar seleccionados
              </Button>
              <Button color="secondary" size="sm" onClick={onClearSelection}>
                Cancelar
              </Button>
            </>
          )}
          emptyState={(
            <EmptyState
              icon="bi-people"
              heading="Sin estudiantes inscritos"
              description="Inscribe estudiantes en la clase para comenzar a evaluar."
            />
          )}
          hover
        />
      </div>
    </SectionHeader>
  );
};

export default EvaluationStudentsSection;
