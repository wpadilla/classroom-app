import React from 'react';
import { motion } from 'framer-motion';
import { IModule } from '../../../../models';

interface ClassroomModuleProgressProps {
  modules: IModule[];
  currentModule: IModule | null;
  isFinalized: boolean;
  onModuleChange: (module: IModule) => void;
  onToggleModuleCompletion: (moduleId: string, currentStatus: boolean) => void;
}

const ClassroomModuleProgress: React.FC<ClassroomModuleProgressProps> = ({
  modules,
  currentModule,
  isFinalized,
  onModuleChange,
  onToggleModuleCompletion,
}) => {
  const completedModules = modules.filter((module) => module.isCompleted).length;
  const progress = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.05 }}
      className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Progreso del curso
          </p>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            {currentModule ? `Semana ${currentModule.weekNumber}: ${currentModule.name}` : 'Sin módulo activo'}
          </h2>
          <p className="mb-0 text-sm text-slate-500">
            {completedModules} de {modules.length} módulos completados
          </p>
        </div>

        <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          <i className="bi bi-graph-up-arrow me-2 text-slate-500" />
          {progress.toFixed(0)}%
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {modules.map((module, index) => {
          const isCurrent = currentModule?.id === module.id;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              className="min-w-[150px] flex-shrink-0 rounded-3xl border border-slate-200 bg-slate-50 p-3"
            >
              <button
                type="button"
                onClick={() => onModuleChange(module)}
                className={`w-full rounded-2xl px-3 py-2 text-left transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : module.isCompleted
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
                    S{module.weekNumber}
                  </span>
                  {module.isCompleted ? <i className="bi bi-check-circle-fill text-xs" /> : null}
                </div>
                <p className="mb-0 mt-2 text-sm font-semibold leading-5">
                  {module.name}
                </p>
              </button>

              {currentModule && module.weekNumber <= currentModule.weekNumber ? (
                <label className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-500">
                  <span>{module.isCompleted ? 'Completado' : 'Pendiente'}</span>
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    type="checkbox"
                    checked={module.isCompleted}
                    onChange={() => onToggleModuleCompletion(module.id, module.isCompleted)}
                    disabled={isFinalized}
                  />
                </label>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default ClassroomModuleProgress;
