// Complete Student Dashboard — Mobile-First Redesign
// Hero header + stat strip + horizontal class cards + activity timeline

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { ProgramService } from '../../services/program/program.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IProgram, IUser } from '../../models';
import { toast } from 'react-toastify';
import StatStrip, { StatItem } from '../../components/student/StatStrip';
import GradeRing from '../../components/student/GradeRing';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';
import ProgramEnrollmentCampaigns from '../../components/programs/ProgramEnrollmentCampaigns';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enrolledClassrooms, setEnrolledClassrooms] = useState<IClassroom[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextClass, setNextClass] = useState<IClassroom | null>(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedClasses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    totalParticipation: 0,
    pendingAssignments: 0,
  });

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const userProfile = await UserService.getUserById(user.id);
      if (!userProfile) return;

      if (userProfile.enrolledClassrooms && userProfile.enrolledClassrooms.length > 0) {
        const classrooms = await Promise.all(
          userProfile.enrolledClassrooms.map((id) => ClassroomService.getClassroomById(id))
        );
        const validClassrooms = classrooms.filter((c) => c !== null) as IClassroom[];
        setEnrolledClassrooms(validClassrooms);

        const programIds = new Set(validClassrooms.map((c) => c.programId));
        const programPromises = Array.from(programIds).map((id) =>
          ProgramService.getProgramById(id)
        );
        const programResults = await Promise.all(programPromises);
        setPrograms(programResults.filter((p) => p !== null) as IProgram[]);

        const evaluationPromises = validClassrooms.map((classroom) =>
          EvaluationService.getStudentClassroomEvaluation(user.id, classroom.id)
        );
        const evaluationResults = await Promise.all(evaluationPromises);
        const validEvaluations = evaluationResults.filter(
          (e) => e !== null
        ) as IStudentEvaluation[];
        setEvaluations(validEvaluations);

        calculateStatistics(validClassrooms, validEvaluations, userProfile);
        findNextClass(validClassrooms);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const calculateStatistics = (
    classrooms: IClassroom[],
    evaluations: IStudentEvaluation[],
    profile: IUser
  ) => {
    const evaluatedOnes = evaluations.filter((e) => e.status === 'evaluated');
    const averageGrade =
      evaluatedOnes.length > 0
        ? evaluatedOnes.reduce((sum, e) => sum + (e.percentage || 0), 0) / evaluatedOnes.length
        : 0;

    let totalPresent = 0;
    let totalRecords = 0;
    evaluations.forEach((evaluation) => {
      if (evaluation.attendanceRecords) {
        totalPresent += evaluation.attendanceRecords.filter((r) => r.isPresent).length;
        totalRecords += evaluation.attendanceRecords.length;
      }
    });
    const attendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    const totalParticipation = evaluations.reduce((sum, evaluation) => {
      if (evaluation.participationRecords) {
        return sum + evaluation.participationRecords.reduce((pSum, r) => pSum + r.points, 0);
      }
      return sum;
    }, 0);

    const pendingAssignments = evaluations.filter(
      (e) => e.status !== 'evaluated' && e.scores.questionnaires === 0
    ).length;

    const completedClasses = profile.completedClassrooms?.length || 0;

    setStats({
      totalClasses: classrooms.length,
      completedClasses,
      averageGrade,
      attendanceRate,
      totalParticipation,
      pendingAssignments,
    });
  };

  const findNextClass = (classrooms: IClassroom[]) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayClasses = classrooms.filter(
      (c) => c.schedule?.dayOfWeek === currentDay && c.isActive
    );

    const next = todayClasses.find((c) => {
      if (c.schedule?.time) {
        return c.schedule.time > currentTime;
      }
      return false;
    });

    setNextClass(next || null);
  };

  const getClassroomProgress = (classroom: IClassroom): number => {
    if (!classroom.modules.length) return 0;
    const completedModules = classroom.modules.filter((m) => m.isCompleted).length;
    return (completedModules / classroom.modules.length) * 100;
  };

  const getClassroomGrade = (classroomId: string): number => {
    const evaluation = evaluations.find((e) => e.classroomId === classroomId);
    return evaluation?.percentage || 0;
  };

  const getProgramName = (programId: string): string => {
    const program = programs.find((p) => p.id === programId);
    return program?.name || 'Sin programa';
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeBg = (grade: number): string => {
    if (grade >= 90) return 'bg-emerald-50 border-emerald-200';
    if (grade >= 80) return 'bg-blue-50 border-blue-200';
    if (grade >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const statItems: StatItem[] = [
    { icon: 'bi-book', value: stats.totalClasses, label: 'Clases Actuales', color: 'blue' },
    { icon: 'bi-check-circle', value: stats.completedClasses, label: 'Completadas', color: 'green' },
    {
      icon: 'bi-calendar-check',
      value: `${stats.attendanceRate.toFixed(0)}%`,
      label: 'Asistencia',
      color: 'amber',
    },
    {
      icon: 'bi-hand-thumbs-up',
      value: stats.totalParticipation,
      label: 'Participación',
      color: 'purple',
    },
    {
      icon: 'bi-exclamation-circle',
      value: stats.pendingAssignments,
      label: 'Pendientes',
      color: 'red',
    },
    {
      icon: 'bi-graph-up',
      value: `${stats.averageGrade.toFixed(0)}%`,
      label: 'Promedio',
      color: 'indigo',
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="px-1 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 pb-6 -mx-3 -my-3">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-5 pt-5 pb-6 rounded-b-[28px] mb-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-0.5">Bienvenido de vuelta</p>
            <h1 className="text-white text-xl font-bold leading-tight">
              ¡Hola, {user?.firstName}!
            </h1>
          </div>
          <button
            onClick={() => navigate('/student/profile')}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center transition-all active:scale-95 border-0"
          >
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <i className="bi bi-person-fill text-white text-lg" />
            )}
          </button>
        </div>

        {/* Inline grade ring */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-3">
          <GradeRing value={stats.averageGrade} size={52} strokeWidth={5} />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold">Promedio General</div>
            <div className="text-blue-200 text-xs">
              {stats.totalClasses} clases inscritas · {stats.completedClasses} completadas
            </div>
          </div>
          <div className="text-white text-2xl font-bold">{stats.averageGrade.toFixed(0)}%</div>
        </div>
      </motion.div>

      <div className="px-4">
        {user?.id && (
          <ProgramEnrollmentCampaigns userId={user.id} audience="student" />
        )}

        {/* Next Class Alert */}
        <AnimatePresence>
          {nextClass && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={() => navigate(`/student/classroom/${nextClass.id}`)}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-4 mb-4 text-left shadow-md active:scale-[0.98] transition-transform border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center shrink-0">
                  <i className="bi bi-clock-fill text-amber-900 text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-amber-900 text-[11px] font-semibold uppercase tracking-wide">
                    Próxima clase
                  </div>
                  <div className="text-amber-950 font-bold text-base truncate">
                    {nextClass.subject}
                  </div>
                  <div className="text-amber-800 text-xs">
                    {nextClass.schedule?.time}
                    {nextClass.location && ` · ${nextClass.location}`}
                  </div>
                </div>
                <i className="bi bi-chevron-right text-amber-800" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Stats Strip */}
        <StatStrip stats={statItems} className="mb-5" />

        {/* My Classes — Horizontal Scroll */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Mis Clases</h2>
            <span className="text-xs text-gray-400 font-medium">
              {enrolledClassrooms.length} {enrolledClassrooms.length === 1 ? 'clase' : 'clases'}
            </span>
          </div>

          {enrolledClassrooms.length === 0 ? (
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <i className="bi bi-book text-blue-300 text-3xl mb-2 block" />
              <p className="text-blue-600 text-sm font-medium mb-0">
                No estás inscrito en ninguna clase
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {enrolledClassrooms.map((classroom, index) => {
                const progress = getClassroomProgress(classroom);
                const grade = getClassroomGrade(classroom.id);

                return (
                  <motion.button
                    key={classroom.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    onClick={() => navigate(`/student/classroom/${classroom.id}`)}
                    className="snap-start shrink-0 w-[260px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform"
                  >
                    {/* Program tag */}
                    <div className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-2 truncate max-w-full">
                      {getProgramName(classroom.programId)}
                    </div>

                    {/* Subject */}
                    <div className="font-bold text-gray-900 text-[15px] mb-0.5 truncate">
                      {classroom.subject}
                    </div>
                    <div className="text-gray-500 text-xs mb-3 truncate">{classroom.name}</div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-gray-400">Progreso</span>
                        <span className="font-semibold text-gray-600">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: index * 0.06 + 0.3, duration: 0.5 }}
                          className={`h-full rounded-full ${
                            progress >= 75 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Bottom stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <i className="bi bi-calendar text-gray-400 text-xs" />
                        <span className="text-gray-500 text-xs">
                          {classroom.schedule?.dayOfWeek?.slice(0, 3)} {classroom.schedule?.time}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${getGradeBg(
                          grade
                        )} ${getGradeColor(grade)}`}
                      >
                        {grade.toFixed(0)}%
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Actividad Reciente</h2>

          {evaluations.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <i className="bi bi-clock-history text-gray-300 text-3xl mb-2 block" />
              <p className="text-gray-500 text-sm mb-0">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-0">
              {evaluations
                .filter((e) => e.status === 'evaluated')
                .slice(0, 5)
                .map((evaluation, index) => {
                  const classroom = enrolledClassrooms.find(
                    (c) => c.id === evaluation.classroomId
                  );
                  const grade = evaluation.percentage || 0;

                  return (
                    <motion.div
                      key={evaluation.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
                    >
                      {/* Dot indicator */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          grade >= 70 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {classroom?.subject || 'Clase'}
                        </div>
                        <div className="text-xs text-gray-400">Calificación evaluada</div>
                      </div>
                      <div
                        className={`text-sm font-bold ${getGradeColor(grade)}`}
                      >
                        {grade.toFixed(0)}%
                      </div>
                    </motion.div>
                  );
                })}

              {evaluations.filter((e) => e.status === 'evaluated').length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No hay calificaciones aún</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PWAInstallPrompt />
    </div>
  );
};

export default StudentDashboard;
