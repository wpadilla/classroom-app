// Student Classroom View — Mobile-First Redesign
// Single page with sections: step timeline, donut grades, avatar stack

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IStudentEvaluation, IUser, IModule } from '../../models';
import { toast } from 'react-toastify';
import GradeRing from '../../components/student/GradeRing';
import SectionHeader from '../../components/student/SectionHeader';
import { BottomDrawer } from '../../components/mobile/BottomDrawer';

const StudentClassroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState<IClassroom | null>(null);
  const [evaluation, setEvaluation] = useState<IStudentEvaluation | null>(null);
  const [teacher, setTeacher] = useState<IUser | null>(null);
  const [classmates, setClassmates] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassmates, setShowClassmates] = useState(false);

  const loadClassroomData = useCallback(async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      const classroomData = await ClassroomService.getClassroomById(id);
      if (!classroomData) {
        toast.error('Clase no encontrada');
        navigate('/student/dashboard');
        return;
      }

      if (!classroomData.studentIds?.includes(user.id)) {
        toast.error('No estás inscrito en esta clase');
        navigate('/student/dashboard');
        return;
      }

      setClassroom(classroomData);

      const [teacherData, evaluationData] = await Promise.all([
        classroomData.teacherId ? UserService.getUserById(classroomData.teacherId) : null,
        EvaluationService.getStudentClassroomEvaluation(user.id, id),
      ]);

      setTeacher(teacherData);
      setEvaluation(evaluationData);

      if (classroomData.studentIds && classroomData.studentIds.length > 0) {
        const classmatePromises = classroomData.studentIds
          .filter((studentId) => studentId !== user.id)
          .map((studentId) => UserService.getUserById(studentId));
        const classmateResults = await Promise.all(classmatePromises);
        setClassmates(classmateResults.filter((c) => c !== null) as IUser[]);
      }
    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast.error('Error al cargar los datos de la clase');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, user]);

  useEffect(() => {
    if (id && user) {
      loadClassroomData();
    }
  }, [id, user, loadClassroomData]);

  const getModuleStatus = (module: IModule): 'completed' | 'current' | 'upcoming' => {
    if (module.isCompleted) return 'completed';
    if (classroom?.currentModule?.weekNumber === module.weekNumber) return 'current';
    return 'upcoming';
  };

  const getAttendanceRate = (): number => {
    if (!evaluation?.attendanceRecords || evaluation.attendanceRecords.length === 0) return 0;
    const present = evaluation.attendanceRecords.filter((r) => r.isPresent).length;
    return (present / evaluation.attendanceRecords.length) * 100;
  };

  const getParticipationPoints = (): number => {
    if (!evaluation?.participationRecords) return 0;
    return evaluation.participationRecords.reduce((sum, r) => sum + r.points, 0);
  };

  const getOverallProgress = (): number => {
    if (!classroom) return 0;
    const completedModules = classroom.modules.filter((m) => m.isCompleted).length;
    return (completedModules / classroom.modules.length) * 100;
  };

  const getGradeBreakdown = () => {
    if (!evaluation || !classroom?.evaluationCriteria) return [];

    const criteria = classroom.evaluationCriteria;
    const scores = evaluation.scores;

    return [
      {
        name: 'Cuestionarios',
        points: criteria.questionnaires,
        earned: scores.questionnaires,
        percentage:
          criteria.questionnaires > 0
            ? (scores.questionnaires / criteria.questionnaires) * 100
            : 0,
        icon: 'bi-journal-text',
        color: 'blue',
      },
      {
        name: 'Asistencia',
        points: criteria.attendance,
        earned: scores.attendance,
        percentage:
          criteria.attendance > 0 ? (scores.attendance / criteria.attendance) * 100 : 0,
        icon: 'bi-calendar-check',
        color: 'green',
      },
      {
        name: 'Participación',
        points: criteria.participation,
        earned: scores.participation,
        percentage:
          criteria.participation > 0
            ? (scores.participation / criteria.participation) * 100
            : 0,
        icon: 'bi-hand-thumbs-up',
        color: 'purple',
      },
      {
        name: 'Examen Final',
        points: criteria.finalExam,
        earned: scores.finalExam,
        percentage:
          criteria.finalExam > 0 ? (scores.finalExam / criteria.finalExam) * 100 : 0,
        icon: 'bi-file-earmark-text',
        color: 'amber',
      },
      ...criteria.customCriteria.map((c) => ({
        name: c.name,
        points: c.points,
        earned: scores.customScores.find((cs) => cs.criterionId === c.id)?.score || 0,
        percentage:
          c.points > 0
            ? ((scores.customScores.find((cs) => cs.criterionId === c.id)?.score || 0) /
                c.points) *
              100
            : 0,
        icon: 'bi-star',
        color: 'indigo',
      })),
    ];
  };

  const barColorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
  };

  if (loading) {
    return (
      <div className="px-1 py-4 animate-pulse space-y-4">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-16 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="px-4 py-8 text-center">
        <i className="bi bi-exclamation-triangle text-red-400 text-4xl mb-3 block" />
        <p className="text-red-600 font-medium">Clase no encontrada</p>
      </div>
    );
  }

  return (
    <div className="px-1 pb-6 -mx-3 -my-3">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-4">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-3 bg-transparent border-0 p-0 active:opacity-70"
        >
          <i className="bi bi-arrow-left" />
          <span>Panel</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 mb-0.5 truncate">
              {classroom.subject}
            </h1>
            <p className="text-sm text-gray-500 mb-1 truncate">{classroom.name}</p>
            {teacher && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <i className="bi bi-person-badge" />
                <span>
                  {teacher.firstName} {teacher.lastName}
                </span>
              </div>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              classroom.isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {classroom.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              value: `${evaluation?.percentage?.toFixed(0) || 0}%`,
              label: 'Nota',
              color:
                (evaluation?.percentage || 0) >= 70
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-amber-600 bg-amber-50',
            },
            {
              value: `${getAttendanceRate().toFixed(0)}%`,
              label: 'Asistencia',
              color:
                getAttendanceRate() >= 80
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-amber-600 bg-amber-50',
            },
            {
              value: `${getParticipationPoints()}`,
              label: 'Particip.',
              color: 'text-blue-600 bg-blue-50',
            },
            {
              value: `${classroom.currentModule?.weekNumber || 1}/${classroom.modules.length}`,
              label: 'Módulo',
              color: 'text-indigo-600 bg-indigo-50',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${stat.color} rounded-xl p-2.5 text-center`}
            >
              <div className="font-bold text-base leading-tight">{stat.value}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4">
        {/* Current Module Highlight */}
        {classroom.currentModule && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 mb-5 text-white"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="bi bi-play-circle text-sm" />
              </div>
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                Módulo Actual
              </span>
            </div>
            <h3 className="font-bold text-base mb-1">
              Semana {classroom.currentModule.weekNumber}
            </h3>
            {classroom.currentModule.topics && (
              <p className="text-white/70 text-xs mb-2 line-clamp-2">
                {classroom.currentModule.topics.join(', ')}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="text-white/60 text-xs">
                <i className="bi bi-calendar-check me-1" />
                {new Date(classroom.currentModule.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
              {/* Progress indicator */}
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-16 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full"
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>
                <span className="text-white/60 text-[10px]">
                  {getOverallProgress().toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modules — Step Timeline */}
        <SectionHeader icon="bi-list-task" title="Módulos" badge={classroom.modules.length}>
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {classroom.modules.map((module, index) => {
              const status = getModuleStatus(module);
              const attendanceRecord = evaluation?.attendanceRecords?.find(
                (r) => r.moduleId === module.weekNumber.toString()
              );
              const participationRecord = evaluation?.participationRecords?.find(
                (r) => r.moduleId === module.weekNumber.toString()
              );

              return (
                <motion.div
                  key={module.weekNumber}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative flex items-start gap-3 pb-4 last:pb-0"
                >
                  {/* Dot */}
                  <div
                    className={`relative z-10 w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${
                      status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500'
                        : status === 'current'
                        ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {status === 'completed' && (
                      <i className="bi bi-check text-white text-[10px] absolute inset-0 flex items-center justify-center" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            status === 'completed'
                              ? 'text-gray-900'
                              : status === 'current'
                              ? 'text-blue-700'
                              : 'text-gray-400'
                          }`}
                        >
                          Sem. {module.weekNumber}
                        </span>
                        {status === 'current' && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                            EN CURSO
                          </span>
                        )}
                      </div>

                      {/* Attendance/Participation badges */}
                      {status === 'completed' && (
                        <div className="flex items-center gap-1">
                          {attendanceRecord && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                attendanceRecord.isPresent
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {attendanceRecord.isPresent ? '✓' : '✗'}
                            </span>
                          )}
                          {participationRecord && participationRecord.points > 0 && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                              +{participationRecord.points}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {module.topics && module.topics.length > 0 && (
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          status === 'upcoming' ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {module.topics.join(', ')}
                      </p>
                    )}

                    <div
                      className={`text-[11px] mt-0.5 ${
                        status === 'upcoming' ? 'text-gray-300' : 'text-gray-400'
                      }`}
                    >
                      {new Date(module.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionHeader>

        {/* Grades — Donut + Breakdown List */}
        <SectionHeader icon="bi-clipboard-data" title="Calificaciones">
          {evaluation ? (
            <div>
              {/* Central Grade Ring */}
              <div className="flex flex-col items-center mb-5">
                <GradeRing
                  value={evaluation.percentage || 0}
                  size={80}
                  strokeWidth={7}
                />
                <div className="text-center mt-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {evaluation.percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="text-xs text-gray-400">Calificación Total</div>
                </div>
              </div>

              {/* Breakdown list */}
              <div className="space-y-3">
                {getGradeBreakdown().map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <i className={`bi ${item.icon} text-gray-500 text-sm`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                          {item.earned.toFixed(1)}/{item.points}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                          transition={{ delay: index * 0.04 + 0.2, duration: 0.5 }}
                          className={`h-full rounded-full ${
                            barColorMap[item.color] || 'bg-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {evaluation.status !== 'evaluated' && (
                <div className="mt-4 bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                  <i className="bi bi-info-circle text-blue-500" />
                  <span className="text-xs text-blue-700">
                    Calificación en progreso — puede cambiar
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <i className="bi bi-clipboard text-gray-300 text-3xl mb-2 block" />
              <p className="text-gray-400 text-sm">No hay calificaciones disponibles</p>
            </div>
          )}
        </SectionHeader>

        {/* Class Info */}
        <SectionHeader icon="bi-info-circle" title="Información" defaultOpen={false}>
          <div className="space-y-3">
            {classroom.description && (
              <p className="text-sm text-gray-600">{classroom.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: 'bi-calendar',
                  label: 'Horario',
                  value: `${classroom.schedule?.dayOfWeek || ''} ${classroom.schedule?.time || ''}`,
                },
                {
                  icon: 'bi-clock',
                  label: 'Duración',
                  value: `${classroom.schedule?.duration || '-'} min`,
                },
                {
                  icon: 'bi-geo-alt',
                  label: 'Ubicación',
                  value: classroom.location || 'No definida',
                },
                {
                  icon: 'bi-people',
                  label: 'Estudiantes',
                  value: `${classroom.studentIds?.length || 0}`,
                },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <i className={`bi ${item.icon} text-gray-400 text-xs`} />
                    <span className="text-[11px] text-gray-400">{item.label}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionHeader>

        {/* Classmates — Avatar Stack */}
        <SectionHeader
          icon="bi-people"
          title="Compañeros"
          badge={classmates.length + 1}
          defaultOpen={false}
        >
          <button
            onClick={() => setShowClassmates(true)}
            className="w-full flex items-center justify-between bg-gray-50 rounded-xl p-3 border-0 active:bg-gray-100 transition-colors"
          >
            {/* Avatar stack */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {/* Current user */}
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center z-10">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="bi bi-person-fill text-white text-xs" />
                  )}
                </div>
                {classmates.slice(0, 3).map((mate, i) => (
                  <div
                    key={mate.id}
                    className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                    style={{ zIndex: 9 - i }}
                  >
                    {mate.profilePhoto ? (
                      <img
                        src={mate.profilePhoto}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-[10px] font-bold">
                        {mate.firstName.charAt(0)}
                      </span>
                    )}
                  </div>
                ))}
                {classmates.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center z-0">
                    <span className="text-gray-500 text-[10px] font-bold">
                      +{classmates.length - 3}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600 ml-3">
                {classmates.length + 1} estudiantes
              </span>
            </div>
            <i className="bi bi-chevron-right text-gray-400" />
          </button>
        </SectionHeader>
      </div>

      {/* Classmates Bottom Drawer */}
      <BottomDrawer
        isOpen={showClassmates}
        onClose={() => setShowClassmates(false)}
        title="Compañeros de Clase"
      >
        <div className="p-4 space-y-3">
          {/* Current user */}
          <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <i className="bi bi-person-fill text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500">{user?.email || user?.phone}</div>
            </div>
            <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">
              Tú
            </span>
          </div>

          {classmates.map((classmate) => (
            <div key={classmate.id} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                {classmate.profilePhoto ? (
                  <img
                    src={classmate.profilePhoto}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-sm font-bold">
                    {classmate.firstName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {classmate.firstName} {classmate.lastName}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {classmate.email || classmate.phone}
                </div>
              </div>
            </div>
          ))}

          {classmates.length === 0 && (
            <div className="text-center py-6">
              <i className="bi bi-people text-gray-300 text-3xl mb-2 block" />
              <p className="text-gray-400 text-sm">Eres el único estudiante</p>
            </div>
          )}
        </div>
      </BottomDrawer>
    </div>
  );
};

export default StudentClassroom;
