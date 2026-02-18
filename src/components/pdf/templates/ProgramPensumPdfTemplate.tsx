import React from 'react';
import { IProgram, IClassroom } from '../../../models';
import { PDFDocument } from '../core/PDFDocument';
import { PDFHeader } from '../layout/PDFHeader';
import { PDFFooter } from '../layout/PDFFooter';
import { PDFSection } from '../layout/PDFSection';
import { PDFTable } from '../data/PDFTable';
import { PDFList } from '../data/PDFList';
import { PDFKeyValue } from '../data/PDFKeyValue';
import { formatDate, formatCurrency } from '../utils/pdfHelpers';
import { PDFTableColumn } from '../utils/pdfConfig.types';

interface ClassroomRow {
  index: number;
  subject: string;
  name: string;
  teacherName: string;
  schedule: string;
  room: string;
  studentCount: number;
  moduleProgress: string;
}

export interface ProgramPensumPdfProps {
  program: IProgram;
  classrooms: (IClassroom & { teacherName: string; studentCount: number; completedModules: number })[];
}

const translateCategory = (cat?: string): string => {
  const map: Record<string, string> = {
    theology: 'Teologia', leadership: 'Liderazgo', discipleship: 'Discipulado',
    general: 'General', other: 'Otro',
  };
  return map[cat || ''] || cat || 'N/A';
};

const translateLevel = (level?: string): string => {
  const map: Record<string, string> = {
    basic: 'Basico', intermediate: 'Intermedio', advanced: 'Avanzado',
  };
  return map[level || ''] || level || 'N/A';
};

const formatSchedule = (schedule?: { dayOfWeek: string; time: string; duration: number }): string => {
  if (!schedule) return 'N/A';
  return `${schedule.dayOfWeek} ${schedule.time}`;
};

const ProgramPensumPdfTemplate: React.FC<ProgramPensumPdfProps> = ({ program, classrooms }) => {
  const rows: ClassroomRow[] = classrooms.map((c, i) => ({
    index: i + 1,
    subject: c.subject,
    name: c.name,
    teacherName: c.teacherName,
    schedule: formatSchedule(c.schedule),
    room: c.room || 'N/A',
    studentCount: c.studentCount,
    moduleProgress: `${c.completedModules}/${c.modules?.length || 0}`,
  }));

  const columns: PDFTableColumn<ClassroomRow>[] = [
    { key: 'index', label: '#', width: '5%', align: 'center' },
    { key: 'subject', label: 'Materia', width: '18%' },
    { key: 'name', label: 'Nombre', width: '18%' },
    { key: 'teacherName', label: 'Profesor', width: '18%' },
    { key: 'schedule', label: 'Horario', width: '15%' },
    { key: 'room', label: 'Salon', width: '8%', align: 'center' },
    { key: 'studentCount', label: 'Estudiantes', width: '8%', align: 'center' },
    { key: 'moduleProgress', label: 'Modulos', width: '10%', align: 'center' },
  ];

  return (
    <PDFDocument
      metadata={{ title: `Pensum - ${program.name}`, author: 'Academia de Ministros' }}
    >
      <PDFHeader
        title={program.name}
        subtitle={`Codigo: ${program.code}`}
        metadata={{
          'Categoria': translateCategory(program.category),
          'Nivel': translateLevel(program.level),
          'Duracion': program.duration || 'N/A',
          'Creditos': program.totalCredits?.toString() || 'N/A',
        }}
      />

      {program.description && (
        <PDFSection title="Descripcion">
          <PDFKeyValue data={{ 'Detalle': program.description }} />
        </PDFSection>
      )}

      <PDFSection title="Informacion General">
        <PDFKeyValue
          data={{
            'Estado': program.isActive ? 'Activo' : 'Inactivo',
            'Fecha de Inicio': program.startDate ? formatDate(program.startDate) : 'N/A',
            'Min. Estudiantes': program.minStudents?.toString() || 'N/A',
            'Max. Estudiantes': program.maxStudents?.toString() || 'N/A',
          }}
        />
      </PDFSection>

      {program.requirements && program.requirements.length > 0 && (
        <PDFSection title="Requisitos">
          <PDFList items={program.requirements} type="numbered" />
        </PDFSection>
      )}

      {program.materials && (
        <PDFSection title="Materiales">
          <PDFKeyValue
            data={{
              'Libros': program.materials.books?.join(', ') || 'N/A',
              'Recursos': program.materials.resources?.join(', ') || 'N/A',
              'Costo de Materiales': program.materials.cost
                ? formatCurrency(program.materials.cost, 'RD$')
                : 'N/A',
            }}
          />
        </PDFSection>
      )}

      <PDFSection title="Clases del Programa">
        {rows.length > 0 ? (
          <PDFTable columns={columns} data={rows} stripe />
        ) : (
          <PDFKeyValue data={{ 'Info': 'No hay clases registradas en este programa' }} />
        )}
      </PDFSection>

      <PDFFooter
        text={`Generado el ${formatDate(new Date())}`}
        copyright="Academia de Ministros Oasis de Amor"
      />
    </PDFDocument>
  );
};

export default ProgramPensumPdfTemplate;
