// StudentSchedule — Weekly calendar with day-based list view
// Shows enrolled class schedules with week navigation

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { ProgramService } from '../../services/program/program.service';
import { IClassroom, IProgram } from '../../models';
import { toast } from 'react-toastify';

// Day mapping for i18n
const DAY_MAP: Record<string, { short: string; full: string; index: number }> = {
  Monday: { short: 'Lun', full: 'Lunes', index: 0 },
  Tuesday: { short: 'Mar', full: 'Martes', index: 1 },
  Wednesday: { short: 'Mié', full: 'Miércoles', index: 2 },
  Thursday: { short: 'Jue', full: 'Jueves', index: 3 },
  Friday: { short: 'Vie', full: 'Viernes', index: 4 },
  Saturday: { short: 'Sáb', full: 'Sábado', index: 5 },
  Sunday: { short: 'Dom', full: 'Domingo', index: 6 },
};

// Color palette for programs (distinctive, not generic)
const PROGRAM_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
];

interface ScheduleEvent {
  classroom: IClassroom;
  program: IProgram | null;
  dayOfWeek: string;
  time: string;
  duration: number;
  colorIndex: number;
  // For module projection
  moduleDate?: Date;
  moduleWeek?: number;
  isPast: boolean;
}

const StudentSchedule: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const userProfile = await UserService.getUserById(user.id);
      if (!userProfile?.enrolledClassrooms?.length) {
        setClassrooms([]);
        return;
      }

      const classroomPromises = userProfile.enrolledClassrooms.map((id) =>
        ClassroomService.getClassroomById(id)
      );
      const classroomResults = await Promise.all(classroomPromises);
      const validClassrooms = classroomResults.filter((c) => c !== null) as IClassroom[];
      setClassrooms(validClassrooms);

      // Load programs
      const programIds = new Set(validClassrooms.map((c) => c.programId));
      const programPromises = Array.from(programIds).map((id) =>
        ProgramService.getProgramById(id)
      );
      const programResults = await Promise.all(programPromises);
      setPrograms(programResults.filter((p) => p !== null) as IProgram[]);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Error al cargar el horario');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Calculate the week's date range
  const weekRange = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startOfWeek.setDate(now.getDate() - diff + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return { start: startOfWeek, end: endOfWeek, days };
  }, [weekOffset]);

  // Build program color map
  const programColorMap = useMemo(() => {
    const map = new Map<string, number>();
    programs.forEach((p, i) => map.set(p.id, i % PROGRAM_COLORS.length));
    return map;
  }, [programs]);

  // Build events for the week
  const weekEvents = useMemo(() => {
    const events: ScheduleEvent[] = [];
    const now = new Date();

    for (const classroom of classrooms) {
      if (!classroom.schedule?.dayOfWeek || !classroom.schedule?.time) continue;

      const colorIndex = programColorMap.get(classroom.programId) || 0;
      const program = programs.find((p) => p.id === classroom.programId) || null;
      const dayInfo = DAY_MAP[classroom.schedule.dayOfWeek];

      if (!dayInfo) continue;

      // Find the module that corresponds to this week
      const dayDate = weekRange.days[dayInfo.index];
      const matchingModule = classroom.modules.find((m) => {
        const moduleDate = new Date(m.date);
        return (
          moduleDate.getFullYear() === dayDate.getFullYear() &&
          moduleDate.getMonth() === dayDate.getMonth() &&
          moduleDate.getDate() === dayDate.getDate()
        );
      });

      events.push({
        classroom,
        program,
        dayOfWeek: classroom.schedule.dayOfWeek,
        time: classroom.schedule.time,
        duration: classroom.schedule.duration || 60,
        colorIndex,
        moduleDate: matchingModule ? new Date(matchingModule.date) : undefined,
        moduleWeek: matchingModule?.weekNumber,
        isPast: dayDate < now && !matchingModule?.isCompleted === false,
      });
    }

    // Sort by day index then time
    events.sort((a, b) => {
      const dayDiff =
        (DAY_MAP[a.dayOfWeek]?.index || 0) - (DAY_MAP[b.dayOfWeek]?.index || 0);
      if (dayDiff !== 0) return dayDiff;
      return a.time.localeCompare(b.time);
    });

    return events;
  }, [classrooms, programs, programColorMap, weekRange]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<number, ScheduleEvent[]>();
    weekRange.days.forEach((_, i) => grouped.set(i, []));

    for (const event of weekEvents) {
      const dayIndex = DAY_MAP[event.dayOfWeek]?.index;
      if (dayIndex !== undefined) {
        grouped.get(dayIndex)?.push(event);
      }
    }

    return grouped;
  }, [weekEvents, weekRange]);

  const formatDateRange = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('es-ES', opts)} — ${end.toLocaleDateString('es-ES', opts)}`;
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="px-1 py-4 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-1 pb-6 -mx-3 -my-3">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 mb-3">Mi Horario</h1>

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border-0 active:bg-gray-100 transition-colors"
          >
            <i className="bi bi-chevron-left text-gray-600" />
          </button>

          <div className="text-center flex-1">
            <div className="text-sm font-semibold text-gray-900">
              {weekOffset === 0
                ? 'Esta Semana'
                : weekOffset === 1
                ? 'Próxima Semana'
                : weekOffset === -1
                ? 'Semana Pasada'
                : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </div>
            <div className="text-[11px] text-gray-400">
              {formatDateRange(weekRange.start, weekRange.end)}
            </div>
          </div>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border-0 active:bg-gray-100 transition-colors"
          >
            <i className="bi bi-chevron-right text-gray-600" />
          </button>
        </div>

        {/* Quick back-to-today */}
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="w-full mt-2 text-blue-600 text-xs font-medium text-center bg-blue-50 rounded-lg py-1.5 border-0 active:bg-blue-100"
          >
            <i className="bi bi-arrow-return-left me-1" />
            Volver a esta semana
          </button>
        )}
      </div>

      {/* Day strips — Mini calendar */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {weekRange.days.map((day, i) => {
            const dayEvents = eventsByDay.get(i) || [];
            const today = isToday(day);
            const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

            return (
              <div
                key={i}
                className={`text-center py-2 rounded-xl transition-all ${
                  today
                    ? 'bg-blue-600 text-white shadow-md'
                    : dayEvents.length > 0
                    ? 'bg-gray-50'
                    : ''
                }`}
              >
                <div
                  className={`text-[10px] font-medium ${
                    today ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {dayNames[i]}
                </div>
                <div
                  className={`text-sm font-bold ${today ? 'text-white' : 'text-gray-700'}`}
                >
                  {day.getDate()}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dayEvents.map((event, j) => (
                      <div
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${
                          today ? 'bg-white/70' : PROGRAM_COLORS[event.colorIndex]?.dot || 'bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day-by-day list */}
        <div className="space-y-4">
          {weekRange.days.map((day, dayIndex) => {
            const dayEvents = eventsByDay.get(dayIndex) || [];
            const today = isToday(day);
            const dayNames = [
              'Lunes',
              'Martes',
              'Miércoles',
              'Jueves',
              'Viernes',
              'Sábado',
              'Domingo',
            ];

            return (
              <div key={dayIndex}>
                {/* Day header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`text-xs font-semibold ${
                      today ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {dayNames[dayIndex]}
                  </div>
                  <div className="text-xs text-gray-300">
                    {day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                  {today && (
                    <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                      HOY
                    </span>
                  )}
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {dayEvents.length === 0 ? (
                  <div className="pl-4 py-2">
                    <span className="text-xs text-gray-300 italic">Sin clases</span>
                  </div>
                ) : (
                  <div className="space-y-2 pl-1">
                    {dayEvents.map((event, eventIndex) => {
                      const colors = PROGRAM_COLORS[event.colorIndex] || PROGRAM_COLORS[0];

                      return (
                        <motion.div
                          key={`${event.classroom.id}-${eventIndex}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: eventIndex * 0.05 }}
                          className={`${colors.bg} ${colors.border} border rounded-xl p-3 ${
                            event.isPast ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Time block */}
                            <div className="shrink-0 text-center min-w-[44px]">
                              <div className={`text-sm font-bold ${colors.text}`}>
                                {event.time}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {event.duration} min
                              </div>
                            </div>

                            {/* Vertical divider */}
                            <div className={`w-0.5 self-stretch rounded-full ${colors.dot} opacity-30`} />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {event.classroom.subject}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {event.classroom.name}
                              </div>

                              <div className="flex items-center gap-3 mt-1.5">
                                {event.classroom.location && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <i className="bi bi-geo-alt" />
                                    <span className="truncate">{event.classroom.location}</span>
                                  </div>
                                )}
                                {event.moduleWeek && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <i className="bi bi-journal" />
                                    <span>Sem. {event.moduleWeek}</span>
                                  </div>
                                )}
                              </div>

                              {event.program && (
                                <div
                                  className={`inline-block text-[9px] font-semibold ${colors.text} mt-1.5 px-1.5 py-0.5 rounded-md ${colors.bg}`}
                                  style={{ border: `1px solid currentColor`, opacity: 0.7 }}
                                >
                                  {event.program.name}
                                </div>
                              )}
                            </div>

                            {/* Past/Future indicator */}
                            {event.isPast && (
                              <div className="shrink-0">
                                <i className="bi bi-check-circle-fill text-emerald-400 text-sm" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {classrooms.length === 0 && (
          <div className="text-center py-12">
            <i className="bi bi-calendar-x text-gray-300 text-4xl mb-3 block" />
            <p className="text-gray-500 text-sm font-medium">No tienes clases inscritas</p>
            <p className="text-gray-400 text-xs mt-1">
              Tu horario aparecerá aquí cuando te inscribas en una clase
            </p>
          </div>
        )}

        {/* Legend */}
        {programs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-[11px] text-gray-400 font-medium mb-2">Programas</div>
            <div className="flex flex-wrap gap-2">
              {programs.map((prog) => {
                const colorIdx = programColorMap.get(prog.id) || 0;
                const colors = PROGRAM_COLORS[colorIdx];
                return (
                  <div key={prog.id} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className="text-xs text-gray-600">{prog.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;
