import React, { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import UserProfilePdfTemplate, { UserProfilePdfProps } from '../templates/UserProfilePdfTemplate';
import { IUser } from '../../../models';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { UserService } from '../../../services/user/user.service';
import { EvaluationService } from '../../../services/evaluation/evaluation.service';
import { ProgramService } from '../../../services/program/program.service';

interface UserProfilePdfDownloadButtonProps {
  user: IUser;
  children?: React.ReactNode;
}

/**
 * Lazy-loading PDF download button that only generates the PDF when clicked.
 * This prevents pre-rendering PDFs for every user in a list, improving performance
 * and avoiding "Invalid border width: undefined" errors from mass PDF generation.
 * 
 * Uses pdf() instead of PDFDownloadLink to generate on-demand.
 */
export const UserProfilePdfDownloadButton: React.FC<UserProfilePdfDownloadButtonProps> = ({
  user,
  children,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Fetch enrolled classrooms data
      const enrolledClassrooms = await Promise.all(
        (user.enrolledClassrooms || []).map(async (classroomId) => {
          const classroom = await ClassroomService.getClassroomById(classroomId);
          if (!classroom) return null;

          let teacherName = 'N/A';
          if (classroom.teacherId) {
            const teacher = await UserService.getUserById(classroom.teacherId);
            if (teacher) teacherName = `${teacher.firstName} ${teacher.lastName}`;
          }

          const evaluation = await EvaluationService.getStudentClassroomEvaluation(
            user.id,
            classroomId
          );

          const completed = classroom.modules?.filter((m) => m.isCompleted).length || 0;
          const total = classroom.modules?.length || 0;
          const moduleProgress = `${completed}/${total}`;

          return { classroom, teacherName, evaluation: evaluation || undefined, moduleProgress };
        })
      );

      // Fetch teaching classrooms data
      const teachingClassrooms = await Promise.all(
        (user.teachingClassrooms || []).map(async (classroomId) => {
          const classroom = await ClassroomService.getClassroomById(classroomId);
          if (!classroom) return null;
          return { classroom, studentCount: classroom.studentIds?.length || 0 };
        })
      );

      // Calculate program progress from completed classrooms
      const programMap = new Map<
        string,
        { programName: string; grades: number[]; completed: number; total: number }
      >();

      for (const history of user.completedClassrooms || []) {
        const existing = programMap.get(history.programId) || {
          programName: history.programName,
          grades: [],
          completed: 0,
          total: 0,
        };
        existing.completed += 1;
        if (history.finalGrade) existing.grades.push(history.finalGrade);
        programMap.set(history.programId, existing);
      }

      // Get total classrooms per program
      const programEntries = Array.from(programMap.entries());
      await Promise.all(
        programEntries.map(async ([programId, progData]) => {
          const program = await ProgramService.getProgramById(programId);
          if (program) {
            progData.total = program.classrooms?.length || progData.completed;
            progData.programName = program.name;
          }
        })
      );

      const programProgress = Array.from(programMap.entries()).map(([, data]) => ({
        programName: data.programName,
        completed: data.completed,
        total: data.total,
        average:
          data.grades.length > 0
            ? data.grades.reduce((s, g) => s + g, 0) / data.grades.length
            : 0,
        percentage: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      }));

      // Calculate overall grade from enrolled classrooms evaluations
      const validEnrolledClassrooms = enrolledClassrooms.filter(Boolean) as UserProfilePdfProps['enrolledClassrooms'];
      const evaluatedGrades = validEnrolledClassrooms
        .filter((ec) => ec?.evaluation?.status === 'evaluated' && ec?.evaluation?.percentage !== undefined)
        .map((ec) => ec.evaluation!.percentage);
      
      const overallGrade = evaluatedGrades.length > 0
        ? evaluatedGrades.reduce((sum, g) => sum + g, 0) / evaluatedGrades.length
        : 0;

      const pdfData: UserProfilePdfProps = {
        user,
        enrolledClassrooms: validEnrolledClassrooms,
        teachingClassrooms: teachingClassrooms.filter(Boolean) as UserProfilePdfProps['teachingClassrooms'],
        programProgress,
        overallGrade,
      };

      // Generate PDF blob on-demand (not pre-rendered)
      const blob = await pdf(<UserProfilePdfTemplate {...pdfData} />).toBlob();
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `perfil-${user.firstName}-${user.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating user profile PDF:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDownload();
    }
  }, [handleDownload]);

  return (
    <span 
      role="button"
      tabIndex={0}
      onClick={handleDownload}
      onKeyDown={handleKeyDown}
      style={{ 
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <span style={{ color: '#999' }}>Generando PDF...</span>
      ) : (
        children || (
          <span style={{ color: '#1976d2' }}>Descargar Perfil PDF</span>
        )
      )}
    </span>
  );
};

export default UserProfilePdfDownloadButton;
