import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ClassroomReportPdfTemplate, { ClassroomReportPdfProps } from '../templates/ClassroomReportPdfTemplate';
import { IClassroom } from '../../../models';
import { UserService } from '../../../services/user/user.service';
import { EvaluationService } from '../../../services/evaluation/evaluation.service';
import { ProgramService } from '../../../services/program/program.service';
import { createBarChartImage } from '../utils/chartToImage';

interface ClassroomReportPdfDownloadButtonProps {
  classroom: IClassroom;
  children?: React.ReactNode;
}

export const ClassroomReportPdfDownloadButton: React.FC<ClassroomReportPdfDownloadButtonProps> = ({
  classroom,
  children,
}) => {
  const [data, setData] = useState<ClassroomReportPdfProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch program name
        const program = await ProgramService.getProgramById(classroom.programId);
        const programName = program?.name || 'N/A';

        // Fetch teacher name
        let teacherName = 'N/A';
        if (classroom.teacherId) {
          const teacher = await UserService.getUserById(classroom.teacherId);
          if (teacher) teacherName = `${teacher.firstName} ${teacher.lastName}`;
        }

        // Fetch evaluations
        const evaluations = await EvaluationService.getClassroomEvaluations(classroom.id);

        // Fetch students
        const studentUsers = await UserService.getUsersByIds(classroom.studentIds || []);
        const evalMap = new Map(evaluations.map((e) => [e.studentId, e]));

        const students = studentUsers.map((u) => {
          const evaluation = evalMap.get(u.id);
          const attendanceRate = evaluation
            ? EvaluationService.calculateAttendanceScore(evaluation.attendanceRecords)
            : 0;
          return {
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            phone: u.phone,
            evaluation,
            attendanceRate,
          };
        });

        // Compute stats
        const evaluated = evaluations.filter((e) => e.status === 'evaluated' && e.percentage > 0);
        const averageGrade =
          evaluated.length > 0
            ? evaluated.reduce((s, e) => s + e.percentage, 0) / evaluated.length
            : 0;
        const passing = evaluated.filter((e) => e.percentage >= 70).length;
        const passRate = evaluated.length > 0 ? (passing / evaluated.length) * 100 : 0;
        const attendanceRates = evaluations.map((e) =>
          EvaluationService.calculateAttendanceScore(e.attendanceRecords)
        );
        const attendanceRate =
          attendanceRates.length > 0
            ? attendanceRates.reduce((s, r) => s + r, 0) / attendanceRates.length
            : 0;

        // Generate grade distribution chart
        let gradeDistributionChart: string | undefined;
        try {
          const distribution = [
            evaluated.filter((e) => e.percentage >= 90).length,
            evaluated.filter((e) => e.percentage >= 80 && e.percentage < 90).length,
            evaluated.filter((e) => e.percentage >= 70 && e.percentage < 80).length,
            evaluated.filter((e) => e.percentage >= 60 && e.percentage < 70).length,
            evaluated.filter((e) => e.percentage < 60).length,
          ];

          if (distribution.some((d) => d > 0)) {
            const result = await createBarChartImage(
              ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
              distribution,
              'Estudiantes',
              '#3b82f6',
              { width: 500, height: 300 }
            );
            gradeDistributionChart = result.base64;
          }
        } catch (err) {
          console.warn('Could not generate grade distribution chart:', err);
        }

        setData({
          classroom,
          programName,
          teacherName,
          students,
          stats: { averageGrade, passRate, attendanceRate },
          gradeDistributionChart,
        });
      } catch (error) {
        console.error('Error loading classroom report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroom]);

  if (loading || !data) {
    return (
      <span style={{ color: '#999', cursor: 'not-allowed' }}>
        {children || 'Cargando PDF...'}
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<ClassroomReportPdfTemplate {...data} />}
      fileName={`reporte-${classroom.subject}-${classroom.name}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading: pdfLoading }) => (
        <span>
          {pdfLoading ? (
            <span style={{ color: '#999' }}>Generando PDF...</span>
          ) : (
            children || (
              <span style={{ cursor: 'pointer', color: '#1976d2' }}>Descargar Reporte</span>
            )
          )}
        </span>
      )}
    </PDFDownloadLink>
  );
};

export default ClassroomReportPdfDownloadButton;
