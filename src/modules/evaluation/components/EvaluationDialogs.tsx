import React from 'react';
import { Alert, Input, Spinner } from 'reactstrap';
import { Dialog } from '../../../components/common';
import { IClassroom, ICustomCriterion, IEvaluationCriteria, IUser } from '../../../models';
import {
  calculateEvaluationTotalPreview,
  getAttendancePointStep,
  getAttendanceScorePreview,
} from '../../../services/evaluation/evaluation-score.utils';

export interface EvaluationFormData {
  questionnaires: number;
  attendance: number;
  participation: number;
  finalExam: number;
  customScores: { criterionId: string; score: number }[];
}

interface ScoreFieldProps {
  label: string;
  value: number;
  max: number;
  step?: number;
  helpText?: string;
  onChange: (value: number) => void;
  onSetMax: () => void;
}

const ScoreField: React.FC<ScoreFieldProps> = ({
  label,
  value,
  max,
  step = 0.1,
  helpText,
  onChange,
  onSetMax,
}) => {
  const inputId = React.useId();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={onSetMax}
          disabled={value === max}
          className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className="bi bi-lightning-fill" />
          Máx
        </button>
      </div>
      <Input
        id={inputId}
        type="number"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="rounded-2xl"
      />
      {helpText ? <p className="mb-0 text-xs text-slate-500">{helpText}</p> : null}
    </div>
  );
};

const EvaluationTotalPreview: React.FC<{ total: number }> = ({ total }) => {
  const formattedTotal = total.toFixed(1);

  return (
    <output
      aria-live="polite"
      className="block rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-slate-900"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
            <i className="bi bi-calculator-fill" aria-hidden="true" />
          </span>
          <div>
            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Total calculado
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Se actualiza automáticamente con cada criterio.
            </span>
          </div>
        </div>
        <span className="shrink-0 text-right">
          <strong className="block text-2xl font-bold text-blue-700">{formattedTotal}%</strong>
          <small className="text-xs text-slate-500">{formattedTotal} / 100 puntos</small>
        </span>
      </div>
      <span className="mt-3 block h-2 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
        <span
          className="block h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(Math.max(total, 0), 100)}%` }}
        />
      </span>
    </output>
  );
};

interface EvaluationCriteriaDialogProps {
  isOpen: boolean;
  saving: boolean;
  classroom: IClassroom;
  criteriaForm: IEvaluationCriteria;
  onClose: () => void;
  onSave: () => void;
  onChange: (updates: IEvaluationCriteria) => void;
  onAddCustomCriterion: () => void;
  onRemoveCustomCriterion: (id: string) => void;
  onUpdateCustomCriterion: (id: string, field: 'name' | 'points', value: string | number) => void;
}

export const EvaluationCriteriaDialog: React.FC<EvaluationCriteriaDialogProps> = ({
  isOpen,
  saving,
  classroom,
  criteriaForm,
  onClose,
  onSave,
  onChange,
  onAddCustomCriterion,
  onRemoveCustomCriterion,
  onUpdateCustomCriterion,
}) => {
  const total =
    criteriaForm.questionnaires +
    criteriaForm.attendance +
    criteriaForm.participation +
    criteriaForm.finalExam +
    (criteriaForm.customCriteria?.reduce((sum, criterion) => sum + criterion.points, 0) || 0);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar criterios de evaluación"
      size="lg"
      fullScreen
      footer={(
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle" />
                Guardar criterios
              </>
            )}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <Alert color="info" className="mb-0">
          Los puntos deben sumar exactamente 100 para poder guardar.
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Cuestionarios
            <Input
              type="number"
              min="0"
              max="100"
              value={criteriaForm.questionnaires}
              onChange={(event) =>
                onChange({ ...criteriaForm, questionnaires: parseInt(event.target.value, 10) || 0 })
              }
              className="mt-2 rounded-2xl"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Asistencia
            <Input
              type="number"
              min="0"
              max="100"
              value={criteriaForm.attendance}
              onChange={(event) =>
                onChange({ ...criteriaForm, attendance: parseInt(event.target.value, 10) || 0 })
              }
              className="mt-2 rounded-2xl"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Participación
            <Input
              type="number"
              min="0"
              max="100"
              value={criteriaForm.participation}
              onChange={(event) =>
                onChange({ ...criteriaForm, participation: parseInt(event.target.value, 10) || 0 })
              }
              className="mt-2 rounded-2xl"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Examen final / práctica
            <Input
              type="number"
              min="0"
              max="100"
              value={criteriaForm.finalExam}
              onChange={(event) =>
                onChange({ ...criteriaForm, finalExam: parseInt(event.target.value, 10) || 0 })
              }
              className="mt-2 rounded-2xl"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Puntos de participación por clase
            <Input
              type="number"
              min="1"
              max="3"
              value={criteriaForm.participationPointsPerModule}
              onChange={(event) =>
                onChange({
                  ...criteriaForm,
                  participationPointsPerModule: Math.min(
                    Math.max(parseInt(event.target.value, 10) || 1, 1),
                    3
                  ),
                })
              }
              className="mt-2 rounded-2xl"
            />
            <p className="mb-0 mt-2 text-xs text-slate-500">
              Con {criteriaForm.participationPointsPerModule} punto(s) por clase se requieren{' '}
              {(classroom.modules.length || 8) * criteriaForm.participationPointsPerModule} puntos para alcanzar el 100% de participación.
            </p>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-base font-semibold text-slate-900">Criterios personalizados</p>
              <p className="mb-0 text-sm text-slate-500">Agrega rúbricas o prácticas adicionales.</p>
            </div>
            <button
              type="button"
              onClick={onAddCustomCriterion}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <i className="bi bi-plus-circle" />
              Agregar
            </button>
          </div>

          <div className="space-y-3">
            {(criteriaForm.customCriteria || []).map((criterion: ICustomCriterion) => (
              <div key={criterion.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_120px_auto]">
                <Input
                  type="text"
                  placeholder="Nombre del criterio"
                  value={criterion.name}
                  onChange={(event) => onUpdateCustomCriterion(criterion.id, 'name', event.target.value)}
                  className="rounded-2xl"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Puntos"
                  value={criterion.points}
                  onChange={(event) =>
                    onUpdateCustomCriterion(criterion.id, 'points', parseInt(event.target.value, 10) || 0)
                  }
                  className="rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => onRemoveCustomCriterion(criterion.id)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <i className="bi bi-trash" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-300">Total configurado</p>
          <p className="mb-0 text-lg font-semibold">
            {total} / 100
          </p>
        </div>
      </div>
    </Dialog>
  );
};

interface StudentEvaluationDialogProps {
  isOpen: boolean;
  classroom: IClassroom;
  selectedStudent: IUser | null;
  evaluationForm: EvaluationFormData;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updates: EvaluationFormData) => void;
  onSetAllMax: () => void;
}

export const StudentEvaluationDialog: React.FC<StudentEvaluationDialogProps> = ({
  isOpen,
  classroom,
  selectedStudent,
  evaluationForm,
  saving,
  onClose,
  onSave,
  onChange,
  onSetAllMax,
}) => {
  const totalModules = classroom.modules?.length || 8;
  const attendanceMax = classroom.evaluationCriteria?.attendance || 0;
  const attendancePreview = getAttendanceScorePreview(
    evaluationForm.attendance,
    attendanceMax,
    totalModules
  );
  const attendanceStep = getAttendancePointStep(attendanceMax, totalModules);
  const evaluationTotal = calculateEvaluationTotalPreview(
    evaluationForm,
    classroom.evaluationCriteria,
    totalModules
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Evaluar ${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`.trim()}
      fullScreen
      footer={(
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle" />
                Guardar evaluación
              </>
            )}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSetAllMax}
            className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            <i className="bi bi-lightning-fill" />
            Máxima en todas
          </button>
        </div>

        <EvaluationTotalPreview total={evaluationTotal} />

        <ScoreField
          label={`Cuestionarios (máx. ${classroom.evaluationCriteria?.questionnaires || 0})`}
          value={evaluationForm.questionnaires}
          max={classroom.evaluationCriteria?.questionnaires || 0}
          onChange={(value) => onChange({ ...evaluationForm, questionnaires: value })}
          onSetMax={() => onChange({ ...evaluationForm, questionnaires: classroom.evaluationCriteria?.questionnaires || 0 })}
        />

        <ScoreField
          label={`Asistencia (máx. ${attendanceMax})`}
          value={evaluationForm.attendance}
          max={attendanceMax}
          step={attendanceStep}
          helpText={`Equivale a ${attendancePreview.presentCount} de ${attendancePreview.totalModules} asistencias. Al guardar se ajustará a ${attendancePreview.effectiveScore.toFixed(2)} puntos; si cambias el valor, las excusas se reemplazarán por estados presente/ausente.`}
          onChange={(value) => onChange({ ...evaluationForm, attendance: value })}
          onSetMax={() => onChange({ ...evaluationForm, attendance: attendanceMax })}
        />

        <ScoreField
          label={`Participación (máx. ${classroom.evaluationCriteria?.participation || 0})`}
          value={evaluationForm.participation}
          max={classroom.evaluationCriteria?.participation || 0}
          onChange={(value) => onChange({ ...evaluationForm, participation: value })}
          onSetMax={() => onChange({
            ...evaluationForm,
            participation: classroom.evaluationCriteria?.participation || 0,
          })}
        />

        <ScoreField
          label={`Examen final (máx. ${classroom.evaluationCriteria?.finalExam || 0})`}
          value={evaluationForm.finalExam}
          max={classroom.evaluationCriteria?.finalExam || 0}
          onChange={(value) => onChange({ ...evaluationForm, finalExam: value })}
          onSetMax={() => onChange({ ...evaluationForm, finalExam: classroom.evaluationCriteria?.finalExam || 0 })}
        />

        {(classroom.evaluationCriteria?.customCriteria || []).map((criterion) => {
          const currentScore = evaluationForm.customScores.find((item) => item.criterionId === criterion.id)?.score || 0;

          return (
            <ScoreField
              key={criterion.id}
              label={`${criterion.name} (máx. ${criterion.points})`}
              value={currentScore}
              max={criterion.points}
              onChange={(value) => {
                const customScores = evaluationForm.customScores.filter((item) => item.criterionId !== criterion.id);
                customScores.push({ criterionId: criterion.id, score: value });
                onChange({ ...evaluationForm, customScores });
              }}
              onSetMax={() => {
                const customScores = evaluationForm.customScores.filter((item) => item.criterionId !== criterion.id);
                customScores.push({ criterionId: criterion.id, score: criterion.points });
                onChange({ ...evaluationForm, customScores });
              }}
            />
          );
        })}

        <Alert color="info" className="mb-0">
          Si cambias asistencia, se sincronizarán los módulos presentes y ausentes. La participación actualizará también el acumulado usado en el pase semanal.
        </Alert>
      </div>
    </Dialog>
  );
};

interface BulkEvaluationDialogProps {
  isOpen: boolean;
  classroom: IClassroom;
  selectedCount: number;
  bulkEvaluationForm: EvaluationFormData;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updates: EvaluationFormData) => void;
  onSetAllMax: () => void;
}

export const BulkEvaluationDialog: React.FC<BulkEvaluationDialogProps> = ({
  isOpen,
  classroom,
  selectedCount,
  bulkEvaluationForm,
  saving,
  onClose,
  onSave,
  onChange,
  onSetAllMax,
}) => {
  const totalModules = classroom.modules?.length || 8;
  const attendanceMax = classroom.evaluationCriteria?.attendance || 0;
  const attendancePreview = getAttendanceScorePreview(
    bulkEvaluationForm.attendance,
    attendanceMax,
    totalModules
  );
  const attendanceStep = getAttendancePointStep(attendanceMax, totalModules);
  const evaluationTotal = calculateEvaluationTotalPreview(
    bulkEvaluationForm,
    classroom.evaluationCriteria,
    totalModules
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Evaluar ${selectedCount} estudiantes`}
      size="lg"
      fullScreen
      footer={(
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" />
                Guardar evaluaciones
              </>
            )}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <Alert color="info" className="mb-0">
          Se aplicarán todas estas puntuaciones a {selectedCount} estudiantes. La asistencia sincronizará sus módulos y la participación actualizará sus acumulados.
        </Alert>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSetAllMax}
            className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            <i className="bi bi-stars" />
            Máxima en todas
          </button>
        </div>

        <EvaluationTotalPreview total={evaluationTotal} />

        <ScoreField
          label={`Cuestionarios (máx. ${classroom.evaluationCriteria?.questionnaires || 0})`}
          value={bulkEvaluationForm.questionnaires}
          max={classroom.evaluationCriteria?.questionnaires || 0}
          step={0.5}
          onChange={(value) => onChange({ ...bulkEvaluationForm, questionnaires: value })}
          onSetMax={() => onChange({ ...bulkEvaluationForm, questionnaires: classroom.evaluationCriteria?.questionnaires || 0 })}
        />

        <ScoreField
          label={`Asistencia (máx. ${attendanceMax})`}
          value={bulkEvaluationForm.attendance}
          max={attendanceMax}
          step={attendanceStep}
          helpText={`Se marcarán ${attendancePreview.presentCount} de ${attendancePreview.totalModules} módulos como presentes (${attendancePreview.effectiveScore.toFixed(2)} puntos efectivos) y se reemplazarán las excusas existentes.`}
          onChange={(value) => onChange({ ...bulkEvaluationForm, attendance: value })}
          onSetMax={() => onChange({ ...bulkEvaluationForm, attendance: attendanceMax })}
        />

        <ScoreField
          label={`Participación (máx. ${classroom.evaluationCriteria?.participation || 0})`}
          value={bulkEvaluationForm.participation}
          max={classroom.evaluationCriteria?.participation || 0}
          step={0.5}
          onChange={(value) => onChange({ ...bulkEvaluationForm, participation: value })}
          onSetMax={() => onChange({
            ...bulkEvaluationForm,
            participation: classroom.evaluationCriteria?.participation || 0,
          })}
        />

        <ScoreField
          label={`Examen final (máx. ${classroom.evaluationCriteria?.finalExam || 0})`}
          value={bulkEvaluationForm.finalExam}
          max={classroom.evaluationCriteria?.finalExam || 0}
          step={0.5}
          onChange={(value) => onChange({ ...bulkEvaluationForm, finalExam: value })}
          onSetMax={() => onChange({ ...bulkEvaluationForm, finalExam: classroom.evaluationCriteria?.finalExam || 0 })}
        />

        {(classroom.evaluationCriteria?.customCriteria || []).map((criterion) => {
          const currentScore = bulkEvaluationForm.customScores.find((item) => item.criterionId === criterion.id)?.score || 0;

          return (
            <ScoreField
              key={criterion.id}
              label={`${criterion.name} (máx. ${criterion.points})`}
              value={currentScore}
              max={criterion.points}
              onChange={(value) => {
                const customScores = bulkEvaluationForm.customScores.filter((item) => item.criterionId !== criterion.id);
                customScores.push({ criterionId: criterion.id, score: value });
                onChange({ ...bulkEvaluationForm, customScores });
              }}
              onSetMax={() => {
                const customScores = bulkEvaluationForm.customScores.filter((item) => item.criterionId !== criterion.id);
                customScores.push({ criterionId: criterion.id, score: criterion.points });
                onChange({ ...bulkEvaluationForm, customScores });
              }}
            />
          );
        })}
      </div>
    </Dialog>
  );
};
