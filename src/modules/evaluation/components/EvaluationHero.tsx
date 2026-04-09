import React from 'react';
import { Button } from 'reactstrap';
import { IClassroom } from '../../../models';
import { MobileHero } from '../../../components/common';
import GradeRing from '../../../components/student/GradeRing';
import type { StatItem } from '../../../components/student/StatStrip';

interface EvaluationHeroProps {
  classroom: IClassroom;
  studentCount: number;
  classAverage: number;
  approvedCount: number;
  failedCount: number;
  isFinalized: boolean;
  saving: boolean;
  onBack: () => void;
  onOpenCriteria: () => void;
  onMarkAllAsEvaluated: () => void;
  onOpenFinalization: () => void;
}

const EvaluationHero: React.FC<EvaluationHeroProps> = ({
  classroom,
  studentCount,
  classAverage,
  approvedCount,
  failedCount,
  isFinalized,
  saving,
  onBack,
  onOpenCriteria,
  onMarkAllAsEvaluated,
  onOpenFinalization,
}) => {
  const stats: StatItem[] = [
    { icon: 'bi-people', value: studentCount, label: 'Estudiantes', color: 'blue' },
    { icon: 'bi-graph-up', value: `${classAverage.toFixed(1)}%`, label: 'Promedio', color: 'indigo' },
    { icon: 'bi-patch-check', value: approvedCount, label: 'Aprobados', color: 'green' },
    { icon: 'bi-exclamation-triangle', value: failedCount, label: 'Reprobados', color: 'red' },
  ];

  return (
    <MobileHero
      eyebrow="Cierre académico"
      title={`Evaluaciones de ${classroom.subject}`}
      description={`${classroom.name} · Revisa el rendimiento final, genera certificados y ajusta criterios desde una experiencia pensada para móvil.`}
      backLabel="Volver a la clase"
      onBack={onBack}
      badges={isFinalized ? [{ label: 'Clase finalizada', icon: 'bi-flag-fill', tone: 'warning' }] : []}
      stats={stats}
      aside={(
        <div className="flex items-center gap-3">
          <GradeRing value={classAverage} size={72} label="Promedio" />
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-slate-200/70">Estado</p>
            <p className="mb-1 text-sm font-semibold text-white">
              {isFinalized ? 'Solo lectura' : 'Edición activa'}
            </p>
            <p className="mb-0 text-xs text-slate-200/80">
              {classroom.modules.length} módulos configurados
            </p>
          </div>
        </div>
      )}
      actions={(
        <>
          <Button color="info" className="rounded-pill px-3 py-2 text-sm fw-semibold" onClick={onOpenCriteria} disabled={isFinalized}>
            <i className="bi bi-sliders me-2" />
            Configurar criterios
          </Button>
          <Button color="success" className="rounded-pill px-3 py-2 text-sm fw-semibold" onClick={onMarkAllAsEvaluated} disabled={saving || isFinalized}>
            <i className="bi bi-check-all me-2" />
            Finalizar todas
          </Button>
          <Button color={isFinalized ? 'warning' : 'danger'} className="rounded-pill px-3 py-2 text-sm fw-semibold" onClick={onOpenFinalization}>
            <i className={`bi bi-${isFinalized ? 'arrow-counterclockwise' : 'flag-fill'} me-2`} />
            {isFinalized ? 'Revertir clase' : 'Finalizar clase'}
          </Button>
        </>
      )}
    />
  );
};

export default EvaluationHero;
