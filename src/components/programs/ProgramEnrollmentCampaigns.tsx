import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Spinner } from 'reactstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Dialog from '../common/Dialog';
import InternalFormationClassStep from '../../modules/student/components/InternalFormationClassStep';
import { IProgramEnrollmentCampaign, ProgramEnrollmentService } from '../../services/program/program-enrollment.service';
import { formatProgramEnrollmentRange } from '../../utils/programPeriods';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth/auth.service';

interface ProgramEnrollmentCampaignsProps {
  userId: string;
  audience: 'student' | 'teacher';
}

const audienceCopy: Record<ProgramEnrollmentCampaignsProps['audience'], string> = {
  student: 'Hay programas activos en período de inscripción para que continúes tu formación.',
  teacher: 'También puedes inscribirte como participante en los programas que están abiertos.',
};

const ProgramEnrollmentCampaigns: React.FC<ProgramEnrollmentCampaignsProps> = ({
  userId,
  audience,
}) => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<IProgramEnrollmentCampaign[]>([]);
  const [dismissedProgramIds, setDismissedProgramIds] = useState<Set<string>>(new Set());
  const [activeCampaign, setActiveCampaign] = useState<IProgramEnrollmentCampaign | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const nextCampaigns = await ProgramEnrollmentService.getOpenEnrollmentCampaigns(userId);
      setCampaigns(nextCampaigns);
    } catch (error) {
      console.error('Error loading enrollment campaigns:', error);
      toast.error('No se pudieron cargar los programas en inscripción.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const visibleCampaigns = useMemo(
    () => campaigns.filter((campaign) => !dismissedProgramIds.has(campaign.program.id)),
    [campaigns, dismissedProgramIds]
  );

  const handleDismissBanner = (programId: string) => {
    setDismissedProgramIds((current) => new Set([...Array.from(current), programId]));
  };

  const openCampaign = (campaign: IProgramEnrollmentCampaign) => {
    setActiveCampaign(campaign);
    setSelectedClassroomId('');
  };

  const closeCampaign = () => {
    setActiveCampaign(null);
    setSelectedClassroomId('');
  };

  const handleConfirmEnrollment = async () => {
    if (!activeCampaign) {
      return;
    }

    if (!selectedClassroomId) {
      toast.error('Selecciona una clase para continuar con la inscripción.');
      return;
    }

    try {
      setSaving(true);
      const updatedUser = await ProgramEnrollmentService.enrollUserInProgramClassroom(
        userId,
        activeCampaign.program.id,
        selectedClassroomId
      );

      if (updatedUser) {
        AuthService.cacheUser(updatedUser);
      }

      await refreshUser();
      await loadCampaigns();
      toast.success(`Ya quedaste inscrito en ${activeCampaign.program.name}.`);
      closeCampaign();
    } catch (error) {
      console.error('Error enrolling in program campaign:', error);
      toast.error('No se pudo completar la inscripción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || visibleCampaigns.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4 grid gap-3">
        {visibleCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.program.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">
                  Inscripción abierta
                </p>
                <h3 className="mb-1 text-base font-semibold text-slate-900">
                  {campaign.program.name}
                </h3>
                <p className="mb-2 text-sm text-slate-600">
                  {audienceCopy[audience]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDismissBanner(campaign.program.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-700"
                aria-label={`Ocultar banner de ${campaign.program.name}`}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
                {formatProgramEnrollmentRange(campaign.program)}
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm">
                {campaign.classrooms.length} clase{campaign.classrooms.length === 1 ? '' : 's'} disponible{campaign.classrooms.length === 1 ? '' : 's'}
              </span>
              {campaign.hasEnrollmentInProgram && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                  Ya tienes inscripción en este programa
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                color="primary"
                size="sm"
                className="rounded-2xl px-4"
                onClick={() => openCampaign(campaign)}
                disabled={campaign.classrooms.length === 0}
              >
                <i className="bi bi-mortarboard me-1"></i>
                {campaign.hasEnrollmentInProgram ? 'Cambiar clase' : 'Inscribirme'}
              </Button>
              <span className="text-xs text-slate-500">
                {campaign.classrooms.length === 0
                  ? 'No hay clases activas disponibles ahora mismo.'
                  : 'Selecciona una clase activa para sumarte al programa.'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog
        isOpen={Boolean(activeCampaign)}
        onClose={closeCampaign}
        title={activeCampaign ? `Inscribirse en ${activeCampaign.program.name}` : 'Inscripción'}
        size="lg"
        fullScreen
        footer={
          <div className="flex gap-2">
            <Button color="secondary" onClick={closeCampaign} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button color="primary" onClick={handleConfirmEnrollment} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Inscribiendo...
                </>
              ) : (
                'Confirmar inscripción'
              )}
            </Button>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          {activeCampaign && (
            <motion.div
              key={activeCampaign.program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <InternalFormationClassStep
                variant="enrollment"
                programName={activeCampaign.program.name}
                options={activeCampaign.classrooms}
                title="Selecciona tu clase"
                description="Elige la clase activa en la que deseas inscribirte dentro de este programa."
                emptyMessage="No hay clases activas disponibles para este programa en este momento."
                badgeLabel="Selección única"
                selectedLabel="Clase seleccionada"
                unselectedLabel="Seleccionar"
                selectedClassroomId={selectedClassroomId}
                onSelectClassroom={setSelectedClassroomId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </>
  );
};

export default ProgramEnrollmentCampaigns;
