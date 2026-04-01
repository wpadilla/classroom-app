// ProgramsProgressTab Component
// Reusable component to display user's program progress
// Can be used in UserDetailModal, UserProfile, and other contexts

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IUser } from '../../../models';
import { useProgramProgress, ProgramProgress } from '../../../hooks/useProgramProgress';
import GradeRing from '../../../components/student/GradeRing';

interface ProgramsProgressTabProps {
  user: IUser;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ProgramsProgressTab: React.FC<ProgramsProgressTabProps> = ({
  user,
  className = '',
  showDetails = true,
  compact = false,
}) => {
  const { programProgress, overallStats, loading, calculateProgress } = useProgramProgress();
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      calculateProgress(user);
    }
  }, [calculateProgress, user]);

  const toggleProgram = (programId: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-3" />
        <p className="text-gray-500 text-sm font-medium">Calculando progreso...</p>
      </div>
    );
  }

  if (programProgress.length === 0) {
    return (
      <div className={`bg-blue-50 text-blue-800 p-4 rounded-2xl flex items-start gap-3 ${className}`}>
        <i className="bi bi-info-circle-fill text-blue-500 text-lg" />
        <p className="text-sm font-medium m-0 pt-0.5">
          No hay progreso en programas registrado para este usuario.
        </p>
      </div>
    );
  }

  // Compact view for sidebar or small spaces
  if (compact) {
    return (
      <div className={className}>
        <div className="mb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progreso General</span>
            <span className="text-sm font-bold text-gray-900">{overallStats.averageProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overallStats.averageProgress}%` }}
            />
          </div>
          {overallStats.overallAverage > 0 && (
            <p className="text-xs text-gray-500 m-0">
              Promedio: <strong className="text-gray-700">{overallStats.overallAverage}%</strong>
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          {programProgress.map((prog: ProgramProgress) => (
            <div key={prog.program.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">
                  {prog.program.name}
                </span>
                <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {prog.completedClassrooms}/{prog.totalClassrooms}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${prog.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${prog.progressPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full view for detailed display
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Stats (StatStrip pattern) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-blue-600 mb-1">{overallStats.totalClassroomsCompleted}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Completadas</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-indigo-500 mb-1">{overallStats.totalClassroomsEnrolled}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">En Curso</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-emerald-500 mb-1">{overallStats.averageProgress}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Progreso Total</span>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <GradeRing value={overallStats.overallAverage || 0} size={48} strokeWidth={4} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">Acumulado</span>
        </div>
      </div>

      {/* Per-Program Progress */}
      <div className="space-y-4">
        {programProgress.map((prog: ProgramProgress, index: number) => {
          const isExpanded = expandedPrograms[prog.program.id] || false;
          
          return (
            <motion.div 
              key={prog.program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <i className="bi bi-journal-bookmark text-lg" />
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-bold text-gray-900 text-sm mb-0.5 truncate pr-2">
                        {prog.program.name}
                      </h6>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {prog.progressPercentage === 100 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <i className="bi bi-check-circle" /> Completado
                          </span>
                        )}
                        {prog.averageGrade > 0 && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                            Promedio: {prog.averageGrade}%
                          </span>
                        )}
                        {prog.enrolledClassrooms > 0 && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                            {prog.enrolledClassrooms} en curso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Donut for each program */}
                  {prog.averageGrade > 0 && (
                    <div className="hidden sm:block shrink-0">
                      <GradeRing value={prog.averageGrade} size={40} strokeWidth={4} />
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-medium text-gray-500">
                      {prog.completedClassrooms} de {prog.totalClassrooms} módulos
                    </span>
                    <span className="text-sm font-bold text-gray-900">{prog.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${prog.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${prog.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Classroom Details Toggle */}
                {showDetails && prog.classroomDetails.length > 0 && (
                  <button 
                    onClick={() => toggleProgram(prog.program.id)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 transition-colors border-0"
                  >
                    <i className="bi bi-list-ul" />
                    {isExpanded ? 'Ocultar módulos' : `Ver desglose de ${prog.classroomDetails.length} módulos`}
                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} ml-1`} />
                  </button>
                )}
              </div>

              {/* Expandable List */}
              <AnimatePresence>
                {isExpanded && showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 bg-gray-50"
                  >
                    <div className="px-4 py-2 flex flex-col">
                      {prog.classroomDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-gray-200/60 last:border-0">
                          {/* Status Icon */}
                          <div className="shrink-0 flex items-center justify-center w-6">
                            {detail.status === 'completed' && <i className="bi bi-check-circle-fill text-emerald-500" />}
                            {detail.status === 'enrolled' && <i className="bi bi-play-circle-fill text-blue-500" />}
                            {detail.status === 'not-started' && <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                          </div>
                          
                          {/* Module Name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm truncate ${detail.status === 'not-started' ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                                {detail.classroom.name}
                              </span>
                              {detail.status === 'enrolled' && (
                                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-700 uppercase">
                                  En Curso
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Grade */}
                          <div className="shrink-0 text-right w-12 cursor-default">
                            {detail.finalGrade !== undefined && detail.finalGrade > 0 ? (
                              <span className={`inline-flex px-1.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                                detail.finalGrade >= 90 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                detail.finalGrade >= 80 ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                detail.finalGrade >= 70 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {detail.finalGrade}%
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramsProgressTab;
