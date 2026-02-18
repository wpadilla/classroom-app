import React from 'react';
import { IClassroom, IStudentEvaluation } from '../../../models';
import { PDFDocument } from '../core/PDFDocument';
import { PDFHeader } from '../layout/PDFHeader';
import { PDFFooter } from '../layout/PDFFooter';
import { PDFSection } from '../layout/PDFSection';
import { PDFTable } from '../data/PDFTable';
import { PDFKeyValue } from '../data/PDFKeyValue';
import { PDFGrid } from '../data/PDFGrid';
import { PDFStatCard } from '../visual/PDFStatCard';
import { PDFImage } from '../visual/PDFImage';
import { formatDate } from '../utils/pdfHelpers';
import { PDFTableColumn } from '../utils/pdfConfig.types';

export interface ClassroomReportPdfProps {
  classroom: IClassroom;
  programName: string;
  teacherName: string;
  students: {
    id: string;
    name: string;
    phone: string;
    evaluation?: IStudentEvaluation;
    attendanceRate: number;
  }[];
  stats: { averageGrade: number; passRate: number; attendanceRate: number };
  gradeDistributionChart?: string;
}

const translateStatus = (status?: string): string => {
  const map: Record<string, string> = {
    completed: 'Completado', dropped: 'Retirado', failed: 'Reprobado',
    'in-progress': 'En Progreso', evaluated: 'Evaluado',
  };
  return map[status || ''] || status || 'N/A';
};

const formatSchedule = (schedule?: { dayOfWeek: string; time: string; duration: number }): string => {
  if (!schedule) return 'N/A';
  return `${schedule.dayOfWeek} ${schedule.time} (${schedule.duration} min)`;
};

const ClassroomReportPdfTemplate: React.FC<ClassroomReportPdfProps> = ({
  classroom,
  programName,
  teacherName,
  students,
  stats,
  gradeDistributionChart,
}) => {
  const completedModules = classroom.modules?.filter((m) => m.isCompleted).length || 0;
  const totalModules = classroom.modules?.length || 0;

  // Module rows
  const moduleRows = (classroom.modules || []).map((m) => ({
    week: m.weekNumber,
    name: m.name,
    status: m.isCompleted ? 'Completado' : 'Pendiente',
  }));

  const moduleColumns: PDFTableColumn[] = [
    { key: 'week', label: '#', width: '10%', align: 'center' },
    { key: 'name', label: 'Nombre', width: '65%' },
    { key: 'status', label: 'Estado', width: '25%', align: 'center' },
  ];

  // Student rows
  const studentRows = students.map((s, i) => ({
    index: i + 1,
    name: s.name,
    phone: s.phone,
    attendance: `${s.attendanceRate.toFixed(0)}%`,
    participation: s.evaluation?.participationPoints || 0,
    grade: s.evaluation?.percentage?.toFixed(1) || 'N/A',
    letter: s.evaluation?.letterGrade || '-',
    status: translateStatus(s.evaluation?.status),
    active: s.evaluation?.isActive !== false ? 'Si' : 'No',
  }));

  const studentColumns: PDFTableColumn[] = [
    { key: 'index', label: '#', width: '4%', align: 'center' },
    { key: 'name', label: 'Nombre', width: '22%' },
    { key: 'phone', label: 'Telefono', width: '13%' },
    { key: 'attendance', label: 'Asistencia', width: '10%', align: 'center' },
    { key: 'participation', label: 'Partic.', width: '9%', align: 'center' },
    { key: 'grade', label: 'Calif.', width: '10%', align: 'center' },
    { key: 'letter', label: 'Letra', width: '7%', align: 'center' },
    { key: 'status', label: 'Estado', width: '13%' },
    { key: 'active', label: 'Activo', width: '8%', align: 'center' },
  ];

  // Criteria data
  const criteriaData: Record<string, string> = {
    'Cuestionarios': `${classroom.evaluationCriteria.questionnaires} pts`,
    'Asistencia': `${classroom.evaluationCriteria.attendance} pts`,
    'Participacion': `${classroom.evaluationCriteria.participation} pts (${classroom.evaluationCriteria.participationPointsPerModule || 1} pts/modulo)`,
    'Examen Final': `${classroom.evaluationCriteria.finalExam} pts`,
  };
  (classroom.evaluationCriteria.customCriteria || []).forEach((c) => {
    criteriaData[c.name] = `${c.points} pts`;
  });

  return (
    <PDFDocument
      metadata={{ title: `Reporte - ${classroom.subject}`, author: 'Academia de Ministros' }}
    >
      <PDFHeader
        title={classroom.subject}
        subtitle={classroom.name}
        metadata={{
          'Programa': programName,
          'Profesor': teacherName,
          'Horario': formatSchedule(classroom.schedule),
          'Salon': classroom.room || 'N/A',
          'Estado': classroom.isActive ? 'Activa' : 'Finalizada',
        }}
      />

      <PDFGrid columns={3}>
        <PDFStatCard
          value={stats.averageGrade.toFixed(1)}
          title="Promedio General"
          color="blue"
        />
        <PDFStatCard
          value={`${stats.passRate.toFixed(0)}%`}
          title="Tasa de Aprobacion"
          color="green"
        />
        <PDFStatCard
          value={`${stats.attendanceRate.toFixed(0)}%`}
          title="Asistencia Promedio"
          color="orange"
        />
      </PDFGrid>

      <PDFSection title="Progreso de Modulos">
        <PDFKeyValue
          data={{
            'Modulos Completados': `${completedModules} de ${totalModules}`,
            'Progreso': totalModules > 0 ? `${((completedModules / totalModules) * 100).toFixed(0)}%` : '0%',
          }}
        />
        {moduleRows.length > 0 && (
          <PDFTable columns={moduleColumns} data={moduleRows} stripe fontSize={8} />
        )}
      </PDFSection>

      {gradeDistributionChart && (
        <PDFSection title="Distribucion de Calificaciones">
          <PDFImage
            src={gradeDistributionChart}
            width={400}
            caption="Distribucion de calificaciones"
          />
        </PDFSection>
      )}

      <PDFSection title="Lista de Estudiantes">
        {studentRows.length > 0 ? (
          <PDFTable columns={studentColumns} data={studentRows} stripe fontSize={8} />
        ) : (
          <PDFKeyValue data={{ 'Info': 'No hay estudiantes registrados' }} />
        )}
      </PDFSection>

      <PDFSection title="Criterios de Evaluacion">
        <PDFKeyValue data={criteriaData} />
      </PDFSection>

      <PDFFooter
        text={`Generado el ${formatDate(new Date())}`}
        copyright="Academia de Ministros Oasis de Amor"
      />
    </PDFDocument>
  );
};

export default ClassroomReportPdfTemplate;
