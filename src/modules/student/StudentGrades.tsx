// StudentGrades — Complete grade history with screenshot download
// Mobile-first: donut chart, filter chips, expandable items

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { ProgramService } from '../../services/program/program.service';
import { IUser, IClassroom, IStudentEvaluation, IProgram, IClassroomHistory } from '../../models';
import { toast } from 'react-toastify';
import GradeRing from '../../components/student/GradeRing';

interface ClassGradeItem {
  classroomId: string;
  classroomName: string;
  subject: string;
  programId: string;
  programName: string;
  grade: number;
  status: 'in-progress' | 'completed' | 'evaluated' | 'dropped' | 'failed';
  isCurrentEnrollment: boolean;
  evaluation?: IStudentEvaluation;
  breakdown?: {
    name: string;
    earned: number;
    total: number;
    percentage: number;
    icon: string;
  }[];
}

const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const screenshotRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<IUser | null>(null);
  const [gradeItems, setGradeItems] = useState<ClassGradeItem[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [overallStats, setOverallStats] = useState({
    averageGrade: 0,
    completedClasses: 0,
    passRate: 0,
    totalClasses: 0,
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const userProfile = await UserService.getUserById(user.id);
      if (!userProfile) return;
      setProfile(userProfile);

      const items: ClassGradeItem[] = [];

      // Current enrollments
      if (userProfile.enrolledClassrooms && userProfile.enrolledClassrooms.length > 0) {
        const [classrooms, evaluations] = await Promise.all([
          Promise.all(
            userProfile.enrolledClassrooms.map((id) => ClassroomService.getClassroomById(id))
          ),
          EvaluationService.getStudentEvaluations(user.id),
        ]);

        const validClassrooms = classrooms.filter((c) => c !== null) as IClassroom[];
        const programIds = new Set<string>();

        for (const classroom of validClassrooms) {
          programIds.add(classroom.programId);
          const evaluation = evaluations.find((e) => e.classroomId === classroom.id);

          let breakdown: ClassGradeItem['breakdown'];
          if (evaluation && classroom.evaluationCriteria) {
            const criteria = classroom.evaluationCriteria;
            const scores = evaluation.scores;
            breakdown = [
              {
                name: 'Cuestionarios',
                earned: scores.questionnaires,
                total: criteria.questionnaires,
                percentage:
                  criteria.questionnaires > 0
                    ? (scores.questionnaires / criteria.questionnaires) * 100
                    : 0,
                icon: 'bi-journal-text',
              },
              {
                name: 'Asistencia',
                earned: scores.attendance,
                total: criteria.attendance,
                percentage:
                  criteria.attendance > 0
                    ? (scores.attendance / criteria.attendance) * 100
                    : 0,
                icon: 'bi-calendar-check',
              },
              {
                name: 'Participación',
                earned: scores.participation,
                total: criteria.participation,
                percentage:
                  criteria.participation > 0
                    ? (scores.participation / criteria.participation) * 100
                    : 0,
                icon: 'bi-hand-thumbs-up',
              },
              {
                name: 'Examen Final',
                earned: scores.finalExam,
                total: criteria.finalExam,
                percentage:
                  criteria.finalExam > 0
                    ? (scores.finalExam / criteria.finalExam) * 100
                    : 0,
                icon: 'bi-file-earmark-text',
              },
            ];
          }

          items.push({
            classroomId: classroom.id,
            classroomName: classroom.name,
            subject: classroom.subject,
            programId: classroom.programId,
            programName: '',
            grade: evaluation?.percentage || 0,
            status: evaluation?.status || 'in-progress',
            isCurrentEnrollment: true,
            evaluation,
            breakdown,
          });
        }

        // Load programs
        const programPromises = Array.from(programIds).map((id) =>
          ProgramService.getProgramById(id)
        );
        const programResults = await Promise.all(programPromises);
        const validPrograms = programResults.filter((p) => p !== null) as IProgram[];
        setPrograms(validPrograms);

        // Fill program names
        items.forEach((item) => {
          const prog = validPrograms.find((p) => p.id === item.programId);
          item.programName = prog?.name || 'Sin programa';
        });
      }

      // Completed classrooms (history)
      if (userProfile.completedClassrooms && userProfile.completedClassrooms.length > 0) {
        for (const hist of userProfile.completedClassrooms) {
          items.push({
            classroomId: hist.classroomId,
            classroomName: hist.classroomName,
            subject: hist.classroomName,
            programId: hist.programId,
            programName: hist.programName,
            grade: hist.finalGrade || 0,
            status: hist.status === 'completed' ? 'evaluated' : hist.status,
            isCurrentEnrollment: false,
          });
        }
      }

      setGradeItems(items);

      // Calculate overall stats
      const evaluatedItems = items.filter(
        (i) => i.status === 'evaluated' || (!i.isCurrentEnrollment && i.grade > 0)
      );
      const avgGrade =
        evaluatedItems.length > 0
          ? evaluatedItems.reduce((sum, i) => sum + i.grade, 0) / evaluatedItems.length
          : 0;
      const passedItems = evaluatedItems.filter((i) => i.grade >= 70);

      setOverallStats({
        averageGrade: avgGrade,
        completedClasses: items.filter((i) => !i.isCurrentEnrollment).length,
        passRate:
          evaluatedItems.length > 0
            ? (passedItems.length / evaluatedItems.length) * 100
            : 0,
        totalClasses: items.length,
      });
    } catch (error) {
      console.error('Error loading grades:', error);
      toast.error('Error al cargar las calificaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleDownloadScreenshot = async () => {
    if (!screenshotRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(screenshotRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Mobile share or desktop download
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'mis-notas-amoa.png', { type: 'image/png' });
        await navigator.share({
          title: 'Mis Notas — AMOA',
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.download = 'mis-notas-amoa.png';
        link.href = dataUrl;
        link.click();
      }

      toast.success('Imagen generada correctamente');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error generating screenshot:', error);
        toast.error('Error al generar la imagen');
      }
    } finally {
      setDownloading(false);
    }
  };

  const filteredItems =
    selectedProgram === 'all'
      ? gradeItems
      : gradeItems.filter((i) => i.programId === selectedProgram);

  const currentItems = filteredItems.filter((i) => i.isCurrentEnrollment);
  const historyItems = filteredItems.filter((i) => !i.isCurrentEnrollment);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return { text: 'Evaluado', class: 'bg-emerald-50 text-emerald-700' };
      case 'in-progress':
        return { text: 'En curso', class: 'bg-blue-50 text-blue-700' };
      case 'completed':
        return { text: 'Completado', class: 'bg-emerald-50 text-emerald-700' };
      case 'dropped':
        return { text: 'Abandonado', class: 'bg-amber-50 text-amber-700' };
      case 'failed':
        return { text: 'Reprobado', class: 'bg-red-50 text-red-700' };
      default:
        return { text: status, class: 'bg-gray-50 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="px-1 py-4 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-1 pb-6 -mx-3 -my-3">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Mi Historial Académico</h1>
          <button
            onClick={handleDownloadScreenshot}
            disabled={downloading}
            className="flex items-center gap-1.5 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg border-0 active:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <i className="bi bi-hourglass-split animate-spin" />
            ) : (
              <i className="bi bi-download" />
            )}
            <span className="hidden sm:inline">Descargar</span>
          </button>
        </div>
      </div>

      {/* Screenshottable area */}
      <div ref={screenshotRef}>
        <div className="px-4 pt-4">
          {/* Summary visual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-800 rounded-2xl p-5 mb-4 text-center"
          >
            <GradeRing value={overallStats.averageGrade} size={72} strokeWidth={6} />
            <div className="text-white text-2xl font-bold mt-2">
              {overallStats.averageGrade.toFixed(1)}%
            </div>
            <div className="text-blue-200 text-xs mb-4">Promedio General</div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-2">
                <div className="text-white text-lg font-bold">{overallStats.totalClasses}</div>
                <div className="text-blue-200 text-[10px]">Total</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <div className="text-white text-lg font-bold">
                  {overallStats.completedClasses}
                </div>
                <div className="text-blue-200 text-[10px]">Completadas</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2">
                <div className="text-white text-lg font-bold">
                  {overallStats.passRate.toFixed(0)}%
                </div>
                <div className="text-blue-200 text-[10px]">Aprobación</div>
              </div>
            </div>
          </motion.div>

          {/* Program filter chips */}
          {programs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              <button
                onClick={() => setSelectedProgram('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedProgram === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'
                }`}
              >
                Todos
              </button>
              {programs.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedProgram === prog.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'
                  }`}
                >
                  {prog.name}
                </button>
              ))}
            </div>
          )}

          {/* Current Enrollments */}
          {currentItems.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <i className="bi bi-play-circle-fill text-blue-500" />
                Inscripciones Actuales
              </h2>
              <div className="space-y-2">
                {currentItems.map((item, index) => (
                  <GradeItemCard
                    key={item.classroomId}
                    item={item}
                    index={index}
                    expanded={expandedId === item.classroomId}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === item.classroomId ? null : item.classroomId
                      )
                    }
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {historyItems.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <i className="bi bi-clock-history text-gray-400" />
                Historial Completado
              </h2>
              <div className="space-y-2">
                {historyItems.map((item, index) => (
                  <GradeItemCard
                    key={`${item.classroomId}-hist-${index}`}
                    item={item}
                    index={index}
                    expanded={expandedId === `${item.classroomId}-hist`}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === `${item.classroomId}-hist`
                          ? null
                          : `${item.classroomId}-hist`
                      )
                    }
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-10">
              <i className="bi bi-journal-x text-gray-300 text-4xl mb-3 block" />
              <p className="text-gray-400 text-sm">No hay calificaciones registradas</p>
            </div>
          )}
        </div>

        {/* Watermark footer */}
        <div className="flex items-center justify-center gap-2 py-3 px-4">
          <img
            src="/logo192.png"
            alt=""
            className="w-4 h-4 rounded-sm opacity-40"
          />
          <span className="text-[10px] text-gray-300">
            Academia de Ministros Oasis de Amor • {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Grade item card with expandable breakdown
const GradeItemCard: React.FC<{
  item: ClassGradeItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  getStatusBadge: (status: string) => { text: string; class: string };
}> = ({ item, index, expanded, onToggle, getStatusBadge }) => {
  const badge = getStatusBadge(item.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 border-0 bg-transparent active:bg-gray-50 transition-colors text-left"
      >
        <GradeRing value={item.grade} size={40} strokeWidth={3.5} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{item.subject}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 truncate">{item.programName}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badge.class}`}>
              {badge.text}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{item.grade.toFixed(0)}%</span>
          {item.breakdown && (
            <motion.i
              className="bi bi-chevron-down text-gray-300 text-xs"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && item.breakdown && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-gray-50">
              {item.breakdown.map((b, i) => (
                <div key={b.name} className="flex items-center gap-2 py-1.5">
                  <i className={`bi ${b.icon} text-gray-400 text-xs w-5 text-center`} />
                  <span className="text-xs text-gray-600 flex-1">{b.name}</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.15, duration: 0.4 }}
                      className={`h-full rounded-full ${
                        b.percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 w-10 text-right">
                    {b.earned.toFixed(0)}/{b.total}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentGrades;
