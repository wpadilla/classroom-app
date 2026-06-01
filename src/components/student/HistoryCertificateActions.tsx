import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import { IClassroomHistory, IUser } from '../../models';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { generateCertificateBlob } from '../../modules/evaluation/certificates/certificate.canvas';
import {
  buildCertificateFileName,
  buildHistoryCertificateData,
  isHistoryEntryEligibleForCertificate,
  isHistoryEntryOutstandingForCertificate,
} from '../../modules/evaluation/certificates/certificate.utils';
import { CertificateVariant } from '../../modules/evaluation/certificates/certificate.types';

interface HistoryCertificateActionsProps {
  history: IClassroomHistory;
  student: Pick<IUser, 'id' | 'firstName' | 'lastName'>;
  className?: string;
}

const baseButtonClassName =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const HistoryCertificateActions: React.FC<HistoryCertificateActionsProps> = ({
  history,
  student,
  className = '',
}) => {
  const [loadingVariant, setLoadingVariant] = useState<CertificateVariant | null>(null);

  if (!isHistoryEntryEligibleForCertificate(history)) {
    return null;
  }

  const handleDownload = async (
    event: React.MouseEvent<HTMLButtonElement>,
    variant: CertificateVariant
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const isOutstandingCertificate = variant === 'outstanding';
    const canDownload = isOutstandingCertificate
      ? isHistoryEntryOutstandingForCertificate(history)
      : isHistoryEntryEligibleForCertificate(history);

    if (!canDownload) {
      toast.info(
        isOutstandingCertificate
          ? 'El reconocimiento de meritorio solo está disponible para notas de 90 o más'
          : 'El certificado solo está disponible para clases completadas y aprobadas'
      );
      return;
    }

    try {
      setLoadingVariant(variant);

      let classroom = null;
      try {
        classroom = await ClassroomService.getClassroomById(history.classroomId);
      } catch (error) {
        console.warn('Could not load classroom for history certificate:', error);
      }

      let teacher = null;
      if (classroom?.teacherId) {
        try {
          teacher = await UserService.getUserById(classroom.teacherId);
        } catch (error) {
          console.warn('Could not load teacher for history certificate:', error);
        }
      }

      const certificate = buildHistoryCertificateData({
        history,
        classroom,
        student,
        teacher,
        variant,
      });

      const blob = await generateCertificateBlob(certificate, { format: 'png' });
      saveAs(
        blob,
        buildCertificateFileName(certificate.studentName, certificate.subjectName, 'png', variant)
      );

      toast.success(
        `${isOutstandingCertificate ? 'Reconocimiento de meritorio' : 'Certificado'} generado para ${certificate.studentName}`
      );
    } catch (error) {
      console.error('Error generating history certificate:', error);
      toast.error(
        isOutstandingCertificate
          ? 'No se pudo generar el reconocimiento de meritorio'
          : 'No se pudo generar el certificado'
      );
    } finally {
      setLoadingVariant(null);
    }
  };

  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      <button
        type="button"
        onClick={(event) => handleDownload(event, 'regular')}
        disabled={loadingVariant !== null}
        title="Descargar certificado"
        className={`${baseButtonClassName} text-slate-600 hover:bg-slate-100 hover:text-slate-900`}
      >
        {loadingVariant === 'regular' ? (
          <i className="bi bi-arrow-repeat animate-spin" />
        ) : (
          <i className="bi bi-award" />
        )}
      </button>
      {isHistoryEntryOutstandingForCertificate(history) && (
        <button
          type="button"
          onClick={(event) => handleDownload(event, 'outstanding')}
          disabled={loadingVariant !== null}
          title="Descargar reconocimiento de meritorio"
          className={`${baseButtonClassName} text-amber-600 hover:bg-amber-50 hover:text-amber-700`}
        >
          {loadingVariant === 'outstanding' ? (
            <i className="bi bi-arrow-repeat animate-spin" />
          ) : (
            <i className="bi bi-trophy-fill" />
          )}
        </button>
      )}
    </div>
  );
};

export default HistoryCertificateActions;
