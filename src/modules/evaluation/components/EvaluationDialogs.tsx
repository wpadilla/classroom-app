import React from 'react';
import { Alert, Input, Spinner } from 'reactstrap';
import { Dialog } from '../../../components/common';
import { IClassroom, ICustomCriterion, IEvaluationCriteria, IUser } from '../../../models';

export interface EvaluationFormData {
  questionnaires: number;
  finalExam: number;
  customScores: { criterionId: string; score: number }[];
}

interface ScoreFieldProps {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onSetMax: () => void;
}

const ScoreField: React.FC<ScoreFieldProps> = ({
  label,
  value,
  max,
  step = 0.1,
  onChange,
  onSetMax,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
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
        type="number"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="rounded-2xl"
      />
    </div>
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

        <ScoreField
          label={`Cuestionarios (máx. ${classroom.evaluationCriteria?.questionnaires || 0})`}
          value={evaluationForm.questionnaires}
          max={classroom.evaluationCriteria?.questionnaires || 0}
          onChange={(value) => onChange({ ...evaluationForm, questionnaires: value })}
          onSetMax={() => onChange({ ...evaluationForm, questionnaires: classroom.evaluationCriteria?.questionnaires || 0 })}
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
          La asistencia y la participación se calculan automáticamente según el historial del curso.
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
          Se aplicarán estas puntuaciones a {selectedCount} estudiantes seleccionados. La asistencia y participación se mantienen individuales.
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

        <ScoreField
          label={`Cuestionarios (máx. ${classroom.evaluationCriteria?.questionnaires || 0})`}
          value={bulkEvaluationForm.questionnaires}
          max={classroom.evaluationCriteria?.questionnaires || 0}
          step={0.5}
          onChange={(value) => onChange({ ...bulkEvaluationForm, questionnaires: value })}
          onSetMax={() => onChange({ ...bulkEvaluationForm, questionnaires: classroom.evaluationCriteria?.questionnaires || 0 })}
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
