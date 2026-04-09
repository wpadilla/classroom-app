import React from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Spinner } from 'reactstrap';
import { IClassroom } from '../../../../models';
import { MobileHero } from '../../../../components/common';
import type { StatItem } from '../../../../components/student/StatStrip';
import { useAuth } from '../../../../contexts/AuthContext';

interface ClassroomHeroProps {
  classroom: IClassroom;
  studentsCount: number;
  completedModules: number;
  currentModuleLabel: string;
  isFinalized: boolean;
  isOffline: boolean;
  pendingOperations: number;
  whatsappDropdownOpen: boolean;
  creatingGroup: boolean;
  syncingGroup: boolean;
  reportAction: React.ReactNode;
  onBack: () => void;
  onToggleWhatsappDropdown: () => void;
  onCreateWhatsappGroup: () => void;
  onSyncWhatsappGroup: () => void;
  onOpenWhatsappMessage: () => void;
  onOpenFinalization: () => void;
}

const ClassroomHero: React.FC<ClassroomHeroProps> = ({
  classroom,
  studentsCount,
  completedModules,
  currentModuleLabel,
  isFinalized,
  isOffline,
  pendingOperations,
  whatsappDropdownOpen,
  creatingGroup,
  syncingGroup,
  reportAction,
  onBack,
  onToggleWhatsappDropdown,
  onCreateWhatsappGroup,
  onSyncWhatsappGroup,
  onOpenWhatsappMessage,
  onOpenFinalization,
}) => {
  const { user } = useAuth();
  const stats: StatItem[] = [
    {
      icon: 'bi-people',
      label: 'Estudiantes',
      value: studentsCount,
      color: 'blue',
    },
    {
      icon: 'bi-book-half',
      label: 'Módulo actual',
      value: currentModuleLabel,
      color: 'indigo',
    },
    {
      icon: 'bi-check-circle',
      label: 'Completados',
      value: `${completedModules}/${classroom.modules.length}`,
      color: 'green',
    },
    {
      icon: 'bi-wifi-off',
      label: 'Pendientes sync',
      value: isOffline ? pendingOperations : 0,
      color: isOffline && pendingOperations > 0 ? 'amber' : 'red',
    },
  ];

  return (
    <MobileHero
      eyebrow="Gestión de clase"
      title={classroom.subject}
      description={`${classroom.name} · Controla asistencia, participación, evaluaciones y recursos sin salir del flujo móvil.`}
      backLabel="Volver a clases"
      onBack={onBack}
      badges={[
        ...(isFinalized ? [{ label: 'Finalizada', icon: 'bi-flag-fill', tone: 'warning' as const }] : []),
        ...(isOffline ? [{ label: 'Sin conexión', icon: 'bi-wifi-off', tone: 'neutral' as const }] : []),
      ]}
      stats={stats}
      aside={(
        <div className="min-w-[110px]">
          <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-200/70">Programa</p>
          <p className="mb-2 text-sm font-semibold text-white">{classroom.schedule?.dayOfWeek || 'Horario flexible'}</p>
          <p className="mb-0 text-xs text-slate-200/80">
            {classroom.schedule?.time || 'Hora pendiente'}
          </p>
        </div>
      )}
      actions={(
        <>
          <div>{reportAction}</div>

          <Button
            color={isFinalized ? 'warning' : 'danger'}
            outline={!isFinalized}
            className="rounded-pill px-3 py-2 text-sm fw-semibold"
            onClick={onOpenFinalization}
          >
            <i className={`bi bi-${isFinalized ? 'arrow-counterclockwise' : 'flag-fill'} me-2`} />
            {isFinalized ? 'Revertir finalización' : 'Finalizar clase'}
          </Button>

         {user?.role === "admin" && <Dropdown isOpen={whatsappDropdownOpen} toggle={onToggleWhatsappDropdown}>
            <DropdownToggle color="success" className="rounded-pill px-3 py-2 text-sm fw-semibold">
              <i className="bi bi-whatsapp me-2" />
              WhatsApp
            </DropdownToggle>
            <DropdownMenu end>
              {!classroom.whatsappGroup ? (
                <DropdownItem onClick={onCreateWhatsappGroup} disabled={creatingGroup}>
                  {creatingGroup ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Creando grupo...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2" />
                      Crear grupo
                    </>
                  )}
                </DropdownItem>
              ) : (
                <>
                  <DropdownItem header>
                    <i className="bi bi-check-circle-fill text-success me-2" />
                    Grupo conectado
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem onClick={onSyncWhatsappGroup} disabled={syncingGroup}>
                    {syncingGroup ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-repeat me-2" />
                        Sincronizar grupo
                      </>
                    )}
                  </DropdownItem>
                  <DropdownItem onClick={onOpenWhatsappMessage}>
                    <i className="bi bi-send me-2" />
                    Enviar mensaje
                  </DropdownItem>
                </>
              )}
            </DropdownMenu>
          </Dropdown>}
        </>
      )}
    />
  );
};

export default ClassroomHero;
