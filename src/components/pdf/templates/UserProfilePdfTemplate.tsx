import React from 'react';
import { IUser, IClassroom, IStudentEvaluation } from '../../../models';
import { PDFDocument } from '../core/PDFDocument';
import { PDFHeader } from '../layout/PDFHeader';
import { PDFFooter } from '../layout/PDFFooter';
import { PDFSection } from '../layout/PDFSection';
import { PDFColumns } from '../layout/PDFColumns';
import { PDFTable } from '../data/PDFTable';
import { PDFKeyValue } from '../data/PDFKeyValue';
import { formatDate } from '../utils/pdfHelpers';
import { PDFTableColumn } from '../utils/pdfConfig.types';

export interface UserProfilePdfProps {
  user: IUser;
  enrolledClassrooms: {
    classroom: IClassroom;
    teacherName: string;
    evaluation?: IStudentEvaluation;
    moduleProgress: string;
  }[];
  teachingClassrooms: { classroom: IClassroom; studentCount: number }[];
  programProgress: {
    programName: string;
    completed: number;
    total: number;
    average: number;
    percentage: number;
  }[];
  overallGrade?: number; // Student's overall average grade
}

const translateRole = (role: string): string => {
  const map: Record<string, string> = { admin: 'Administrador', teacher: 'Profesor', student: 'Estudiante' };
  return map[role] || role;
};

const translateDocType = (type?: string): string => {
  const map: Record<string, string> = { NationalId: 'Cedula', Passport: 'Pasaporte' };
  return map[type || ''] || type || 'N/A';
};

const translateAcademicLevel = (level?: string): string => {
  const map: Record<string, string> = {
    Basic: 'Basico', HighSchool: 'Bachillerato', Bachelor: 'Universitario',
    Postgraduate: 'Postgrado', Doctorate: 'Doctorado',
  };
  return map[level || ''] || level || 'N/A';
};

const translateEnrollmentType = (type?: string): string => {
  const map: Record<string, string> = {
    TheologyDegree: 'Licenciatura en Teologia', SingleCourse: 'Curso Individual',
    InternalFormation: 'Formacion Interna',
  };
  return map[type || ''] || type || 'N/A';
};

const translateStatus = (status?: string): string => {
  const map: Record<string, string> = {
    completed: 'Completado', dropped: 'Retirado', failed: 'Reprobado',
    'in-progress': 'En Progreso', evaluated: 'Evaluado',
  };
  return map[status || ''] || status || 'N/A';
};

const formatSchedule = (schedule?: { dayOfWeek: string; time: string; duration: number }): string => {
  if (!schedule) return 'N/A';
  return `${schedule.dayOfWeek} ${schedule.time}`;
};

const UserProfilePdfTemplate: React.FC<UserProfilePdfProps> = ({
  user,
  enrolledClassrooms,
  teachingClassrooms,
  programProgress,
  overallGrade,
}) => {
  const roleLabel = translateRole(user.role) + (user.isTeacher && user.role !== 'teacher' ? ' / Profesor' : '');

  // Enrolled classrooms table rows
  const enrolledRows = enrolledClassrooms.map((ec) => ({
    subject: ec.classroom.subject,
    teacherName: ec.teacherName,
    schedule: formatSchedule(ec.classroom.schedule),
    moduleProgress: ec.moduleProgress,
    grade: ec.evaluation?.percentage?.toFixed(1) || 'N/A',
    letter: ec.evaluation?.letterGrade || '-',
    status: translateStatus(ec.evaluation?.status),
  }));

  const enrolledColumns: PDFTableColumn[] = [
    { key: 'subject', label: 'Materia', width: '20%' },
    { key: 'teacherName', label: 'Profesor', width: '18%' },
    { key: 'schedule', label: 'Horario', width: '18%' },
    { key: 'moduleProgress', label: 'Progreso', width: '14%' },
    { key: 'grade', label: 'Calificacion', width: '11%', align: 'center' },
    { key: 'letter', label: 'Letra', width: '8%', align: 'center' },
    { key: 'status', label: 'Estado', width: '11%' },
  ];

  // Teaching classrooms table rows
  const teachingRows = teachingClassrooms.map((tc) => ({
    subject: tc.classroom.subject,
    name: tc.classroom.name,
    studentCount: tc.studentCount,
    status: tc.classroom.isActive ? 'Activa' : 'Finalizada',
  }));

  const teachingColumns: PDFTableColumn[] = [
    { key: 'subject', label: 'Materia', width: '35%' },
    { key: 'name', label: 'Nombre', width: '30%' },
    { key: 'studentCount', label: 'Estudiantes', width: '15%', align: 'center' },
    { key: 'status', label: 'Estado', width: '20%' },
  ];

  // History rows
  const historyRows = (user.completedClassrooms || []).map((h) => ({
    className: h.classroomName,
    programName: h.programName,
    role: h.role === 'teacher' ? 'Profesor' : 'Estudiante',
    date: h.completionDate ? formatDate(h.completionDate) : 'N/A',
    grade: h.finalGrade?.toFixed(1) || 'N/A',
    status: translateStatus(h.status),
  }));

  const historyColumns: PDFTableColumn[] = [
    { key: 'className', label: 'Clase', width: '25%' },
    { key: 'programName', label: 'Programa', width: '25%' },
    { key: 'role', label: 'Rol', width: '10%' },
    { key: 'date', label: 'Fecha', width: '15%' },
    { key: 'grade', label: 'Calificacion', width: '10%', align: 'center' },
    { key: 'status', label: 'Estado', width: '15%' },
  ];

  // Program progress rows
  const progressRows = programProgress.map((pp) => ({
    programName: pp.programName,
    completed: `${pp.completed}/${pp.total}`,
    average: pp.average.toFixed(1),
    percentage: `${pp.percentage.toFixed(0)}%`,
  }));

  const progressColumns: PDFTableColumn[] = [
    { key: 'programName', label: 'Programa', width: '35%' },
    { key: 'completed', label: 'Completadas', width: '20%', align: 'center' },
    { key: 'average', label: 'Promedio', width: '20%', align: 'center' },
    { key: 'percentage', label: 'Avance', width: '25%', align: 'center' },
  ];

  return (
    <PDFDocument
      metadata={{ title: `Perfil - ${user.firstName} ${user.lastName}`, author: 'Academia de Ministros' }}
    >
      <PDFHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={roleLabel}
        metadata={{
          'Telefono': user.phone,
          'Email': user.email || 'N/A',
          'Estado': user.isActive ? 'Activo' : 'Inactivo',
          'Promedio General': overallGrade !== undefined && overallGrade > 0 ? `${overallGrade.toFixed(1)}%` : 'N/A',
          'Fecha de Registro': user.createdAt ? formatDate(user.createdAt) : 'N/A',
        }}
      />

      <PDFSection title="Datos de Inscripcion">
        <PDFColumns columns={2}>
          <PDFKeyValue
            data={{
              'Tipo de Documento': translateDocType(user.documentType),
              'No. Documento': user.documentNumber || 'N/A',
              'Pais': user.country || 'N/A',
              'Iglesia': user.churchName || 'N/A',
              'Pastor': user.pastor?.fullName || 'N/A',
              'Tel. Pastor': user.pastor?.phone || 'N/A',
            }}
          />
          <PDFKeyValue
            data={{
              'Nivel Academico': translateAcademicLevel(user.academicLevel),
              'Tipo de Inscripcion': translateEnrollmentType(user.enrollmentType),
            }}
          />
        </PDFColumns>
      </PDFSection>

      {enrolledRows.length > 0 && (
        <PDFSection title="Clases Inscritas">
          <PDFTable columns={enrolledColumns} data={enrolledRows} stripe />
        </PDFSection>
      )}

      {teachingRows.length > 0 && (
        <PDFSection title="Clases como Profesor">
          <PDFTable columns={teachingColumns} data={teachingRows} stripe />
        </PDFSection>
      )}

      {historyRows.length > 0 && (
        <PDFSection title="Historial Academico">
          <PDFTable columns={historyColumns} data={historyRows} stripe />
        </PDFSection>
      )}

      {progressRows.length > 0 && (
        <PDFSection title="Progreso en Programas">
          <PDFTable columns={progressColumns} data={progressRows} stripe />
        </PDFSection>
      )}

      <PDFFooter
        text={`Generado el ${formatDate(new Date())}`}
        copyright="Academia de Ministros Oasis de Amor"
      />
    </PDFDocument>
  );
};

export default UserProfilePdfTemplate;
