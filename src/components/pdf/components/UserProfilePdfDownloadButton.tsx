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
      const evaluations = await EvaluationService.getStudentEvaluations(user.id);

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

          const evaluation = evaluations.find(e => e.classroomId === classroomId);

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

      // Calculate program progress similar to the progress tab
      const [programs, allClassrooms] = await Promise.all([
        ProgramService.getAllPrograms(),
        ClassroomService.getAllClassrooms(),
      ]);

      const enrolledIds = new Set(user.enrolledClassrooms || []);
      const completedMap = new Map(
        (user.completedClassrooms || []).map(c => [c.classroomId, c])
      );
      const teachingIds = new Set(user.teachingClassrooms || []);
      const taughtMap = new Map(
        (user.taughtClassrooms || []).map(c => [c.classroomId, c])
      );

      const programProgress = programs.flatMap((program) => {
        const programClassrooms = allClassrooms.filter(c => c.programId === program.id);
        if (programClassrooms.length === 0) return [];

        const hasEnrolled = programClassrooms.some(c => enrolledIds.has(c.id));
        const hasCompleted = programClassrooms.some(c => completedMap.has(c.id));
        const isTeaching = programClassrooms.some(c => teachingIds.has(c.id));
        const hasTaught = programClassrooms.some(c => taughtMap.has(c.id));

        if (!hasEnrolled && !hasCompleted && !isTeaching && !hasTaught) return [];

        let completedCount = 0;
        let enrolledCount = 0;
        let totalGrades = 0;
        let gradeCount = 0;

        for (const classroom of programClassrooms) {
          const history = completedMap.get(classroom.id);
          const isEnrolled = enrolledIds.has(classroom.id);

          if (history) {
            completedCount++;
            if (history.finalGrade !== undefined) {
              totalGrades += history.finalGrade;
              gradeCount++;
            }
          } else if (isEnrolled) {
            enrolledCount++;
            const currentEval = evaluations.find(e => e.classroomId === classroom.id);
            if (currentEval && currentEval.percentage > 0) {
              totalGrades += currentEval.percentage;
              gradeCount++;
            }
          }
        }

        const progressPercentage = programClassrooms.length > 0
          ? Math.round((completedCount / programClassrooms.length) * 100)
          : 0;

        const averageGrade = gradeCount > 0
          ? Math.round((totalGrades / gradeCount) * 10) / 10
          : 0;

        return [{
          programName: program.name,
          completed: completedCount,
          total: programClassrooms.length,
          average: averageGrade,
          percentage: progressPercentage,
        }];
      });

      const programsWithGrades = programProgress.filter(p => p.average > 0);
      const overallGrade = programsWithGrades.length > 0
        ? Math.round(
            (programsWithGrades.reduce((sum, p) => sum + p.average, 0) /
              programsWithGrades.length) * 10
          ) / 10
        : 0;

      const validEnrolledClassrooms = enrolledClassrooms.filter(Boolean) as UserProfilePdfProps['enrolledClassrooms'];

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
