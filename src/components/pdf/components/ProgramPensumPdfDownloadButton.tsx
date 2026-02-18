import React, { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import ProgramPensumPdfTemplate, { ProgramPensumPdfProps } from '../templates/ProgramPensumPdfTemplate';
import { IProgram } from '../../../models';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { UserService } from '../../../services/user/user.service';

interface ProgramPensumPdfDownloadButtonProps {
  program: IProgram;
  children?: React.ReactNode;
}

/**
 * Lazy-loading PDF download button that only generates the PDF when clicked.
 * This prevents pre-rendering PDFs for every program in a list, improving performance
 * and avoiding "Invalid border width: undefined" errors from mass PDF generation.
 * 
 * Uses pdf() instead of PDFDownloadLink to generate on-demand.
 */
export const ProgramPensumPdfDownloadButton: React.FC<ProgramPensumPdfDownloadButtonProps> = ({
  program,
  children,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const classrooms = await ClassroomService.getClassroomsByProgram(program.id);

      const enriched = await Promise.all(
        classrooms.map(async (c) => {
          let teacherName = 'N/A';
          if (c.teacherId) {
            const teacher = await UserService.getUserById(c.teacherId);
            if (teacher) teacherName = `${teacher.firstName} ${teacher.lastName}`;
          }
          return {
            ...c,
            teacherName,
            studentCount: c.studentIds?.length || 0,
            completedModules: c.modules?.filter((m) => m.isCompleted).length || 0,
          };
        })
      );

      const pdfData: ProgramPensumPdfProps = { program, classrooms: enriched };

      // Generate PDF blob on-demand (not pre-rendered)
      const blob = await pdf(<ProgramPensumPdfTemplate {...pdfData} />).toBlob();
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pensum-${program.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating pensum PDF:', error);
    } finally {
      setLoading(false);
    }
  }, [program, loading]);

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
          <span style={{ color: '#1976d2' }}>Descargar Pensum</span>
        )
      )}
    </span>
  );
};

export default ProgramPensumPdfDownloadButton;
