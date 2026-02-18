// Statistics Service - Aggregates data from all services for dashboard analytics

import { UserService } from '../user/user.service';
import { ProgramService } from '../program/program.service';
import { ClassroomService } from '../classroom/classroom.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ClassroomRestartService } from '../classroom/classroom-restart.service';
import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import {
  IUser,
  IProgram,
  IClassroom,
  IStudentEvaluation,
  IClassroomRun,
  IStatisticsDashboard,
  IEnrollmentAnalytics,
  IAcademicPerformance,
  IAttendanceAnalytics,
  IProgramAnalytics,
  ITeacherAnalytics,
  IDemographicAnalytics,
  IFinancialOverview,
  IHistoricalTrends,
  IGradeDistribution,
  IMonthlyCount,
} from '../../models';

export class StatisticsService {
  /**
   * Get complete dashboard data
   */
  static async getDashboardData(): Promise<IStatisticsDashboard> {
    // Fetch all base data in parallel
    const [users, programs, classrooms, evaluations, runs] = await Promise.all([
      UserService.getAllUsers(),
      ProgramService.getAllPrograms(),
      ClassroomService.getAllClassrooms(),
      FirebaseService.getDocuments<IStudentEvaluation>(COLLECTIONS.EVALUATIONS),
      FirebaseService.getDocuments<IClassroomRun>(COLLECTIONS.CLASSROOM_RUNS),
    ]);

    // Compute analytics in parallel from pre-fetched data
    const [enrollment, academic, attendance, programAnalytics, teachers, demographics, financial, trends] =
      await Promise.all([
        this.computeEnrollmentAnalytics(users, programs, classrooms),
        this.computeAcademicPerformance(users, classrooms, evaluations),
        this.computeAttendanceAnalytics(users, classrooms, evaluations),
        this.computeProgramAnalytics(programs, classrooms),
        this.computeTeacherAnalytics(users, classrooms, evaluations),
        this.computeDemographicAnalytics(users),
        this.computeFinancialOverview(programs, classrooms),
        this.computeHistoricalTrends(runs),
      ]);

    return {
      enrollment,
      academic,
      attendance,
      programs: programAnalytics,
      teachers,
      demographics,
      financial,
      trends,
      generatedAt: new Date(),
    };
  }

  // ─── Enrollment ────────────────────────────────────────────

  private static async computeEnrollmentAnalytics(
    users: IUser[],
    programs: IProgram[],
    classrooms: IClassroom[]
  ): Promise<IEnrollmentAnalytics> {
    const students = users.filter((u) => u.role === 'student' || !u.isTeacher);
    const activeStudents = students.filter((u) => u.isActive);
    const teachers = users.filter((u) => u.isTeacher);
    const admins = users.filter((u) => u.role === 'admin');

    // Monthly new students (last 12 months)
    const newStudentsPerMonth = this.computeMonthlyRegistrations(students);

    // Enrollment by program
    const enrollmentByProgram = programs.map((p) => {
      const programClassrooms = classrooms.filter((c) => c.programId === p.id);
      const studentSet = new Set<string>();
      programClassrooms.forEach((c) => (c.studentIds || []).forEach((s) => studentSet.add(s)));
      return { programId: p.id, programName: p.name, count: studentSet.size };
    });

    // Enrollment by category
    const categoryMap = new Map<string, number>();
    programs.forEach((p) => {
      const cat = p.category || 'other';
      const programClassrooms = classrooms.filter((c) => c.programId === p.id);
      const studentSet = new Set<string>();
      programClassrooms.forEach((c) => (c.studentIds || []).forEach((s) => studentSet.add(s)));
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + studentSet.size);
    });
    const enrollmentByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category: this.translateCategory(category),
      count,
    }));

    // Enrollment by type
    const typeMap = new Map<string, number>();
    students.forEach((s) => {
      const type = s.enrollmentType || 'Sin especificar';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    const enrollmentByType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type: this.translateEnrollmentType(type),
      count,
    }));

    // Retention rate: students who completed at least one classroom / total students
    const studentsWithCompletions = students.filter(
      (s) => s.completedClassrooms && s.completedClassrooms.length > 0
    ).length;
    const retentionRate = students.length > 0 ? (studentsWithCompletions / students.length) * 100 : 0;

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      totalTeachers: teachers.length,
      totalAdmins: admins.length,
      newStudentsPerMonth,
      retentionRate,
      enrollmentByProgram,
      enrollmentByCategory,
      enrollmentByType,
    };
  }

  // ─── Academic Performance ──────────────────────────────────

  private static async computeAcademicPerformance(
    users: IUser[],
    classrooms: IClassroom[],
    evaluations: IStudentEvaluation[]
  ): Promise<IAcademicPerformance> {
    const evaluatedEvals = evaluations.filter((e) => e.status === 'evaluated' && e.percentage > 0);

    const overallAverageGrade =
      evaluatedEvals.length > 0
        ? evaluatedEvals.reduce((sum, e) => sum + e.percentage, 0) / evaluatedEvals.length
        : 0;

    const passing = evaluatedEvals.filter((e) => e.percentage >= 70).length;
    const passRate = evaluatedEvals.length > 0 ? (passing / evaluatedEvals.length) * 100 : 0;
    const failRate = 100 - passRate;

    // Grade distribution
    const gradeDistribution: IGradeDistribution = {
      excellent: evaluatedEvals.filter((e) => e.percentage >= 90).length,
      good: evaluatedEvals.filter((e) => e.percentage >= 80 && e.percentage < 90).length,
      satisfactory: evaluatedEvals.filter((e) => e.percentage >= 70 && e.percentage < 80).length,
      needsImprovement: evaluatedEvals.filter((e) => e.percentage >= 60 && e.percentage < 70).length,
      failing: evaluatedEvals.filter((e) => e.percentage < 60).length,
    };

    // Average by program
    const classroomProgramMap = new Map<string, string>();
    classrooms.forEach((c) => classroomProgramMap.set(c.id, c.programId));

    const programGrades = new Map<string, { total: number; count: number; name: string }>();
    evaluatedEvals.forEach((e) => {
      const programId = classroomProgramMap.get(e.classroomId);
      if (!programId) return;
      const existing = programGrades.get(programId) || { total: 0, count: 0, name: '' };
      existing.total += e.percentage;
      existing.count += 1;
      programGrades.set(programId, existing);
    });

    // Resolve program names
    const programMap = new Map<string, IProgram>();
    classrooms.forEach((c) => {
      // We don't have direct program objects here for all, but we can try
    });

    const averageByProgram = Array.from(programGrades.entries()).map(([programId, data]) => {
      const program = classrooms.find((c) => c.programId === programId);
      return {
        programId,
        programName: data.name || programId,
        averageGrade: data.count > 0 ? data.total / data.count : 0,
        studentCount: data.count,
      };
    });

    // Top performers: students with highest average across all their evaluations
    const studentGrades = new Map<string, { total: number; count: number }>();
    evaluatedEvals.forEach((e) => {
      const existing = studentGrades.get(e.studentId) || { total: 0, count: 0 };
      existing.total += e.percentage;
      existing.count += 1;
      studentGrades.set(e.studentId, existing);
    });

    const userMap = new Map<string, IUser>();
    users.forEach((u) => userMap.set(u.id, u));

    const topPerformers = Array.from(studentGrades.entries())
      .map(([studentId, data]) => {
        const user = userMap.get(studentId);
        return {
          studentId,
          studentName: user ? `${user.firstName} ${user.lastName}` : 'Desconocido',
          averageGrade: data.count > 0 ? data.total / data.count : 0,
          classroomCount: data.count,
        };
      })
      .sort((a, b) => b.averageGrade - a.averageGrade)
      .slice(0, 10);

    return {
      overallAverageGrade,
      averageByProgram,
      passRate,
      failRate,
      gradeDistribution,
      topPerformers,
      totalEvaluated: evaluatedEvals.length,
    };
  }

  // ─── Attendance ────────────────────────────────────────────

  private static async computeAttendanceAnalytics(
    users: IUser[],
    classrooms: IClassroom[],
    evaluations: IStudentEvaluation[]
  ): Promise<IAttendanceAnalytics> {
    // Attendance by classroom
    const classroomMap = new Map<string, IClassroom>();
    classrooms.forEach((c) => classroomMap.set(c.id, c));

    const attendanceByClassroom = classrooms
      .filter((c) => c.isActive)
      .map((c) => {
        const classEvals = evaluations.filter((e) => e.classroomId === c.id);
        const rates = classEvals.map((e) => EvaluationService.calculateAttendanceScore(e.attendanceRecords));
        const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
        return {
          classroomId: c.id,
          classroomName: c.name,
          subject: c.subject,
          attendanceRate: avgRate,
          studentCount: c.studentIds?.length || 0,
        };
      });

    const allRates = attendanceByClassroom.map((c) => c.attendanceRate);
    const overallAttendanceRate =
      allRates.length > 0 ? allRates.reduce((s, r) => s + r, 0) / allRates.length : 0;

    // Low attendance alerts (students below 60%)
    const userMap = new Map<string, IUser>();
    users.forEach((u) => userMap.set(u.id, u));

    const lowAttendanceAlerts = evaluations
      .map((e) => {
        const rate = EvaluationService.calculateAttendanceScore(e.attendanceRecords);
        const user = userMap.get(e.studentId);
        const classroom = classroomMap.get(e.classroomId);
        return {
          studentId: e.studentId,
          studentName: user ? `${user.firstName} ${user.lastName}` : 'Desconocido',
          classroomName: classroom?.name || 'Desconocida',
          attendanceRate: rate,
        };
      })
      .filter((a) => a.attendanceRate > 0 && a.attendanceRate < 60)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 20);

    return {
      overallAttendanceRate,
      attendanceByClassroom,
      lowAttendanceAlerts,
    };
  }

  // ─── Program Analytics ─────────────────────────────────────

  private static async computeProgramAnalytics(
    programs: IProgram[],
    classrooms: IClassroom[]
  ): Promise<IProgramAnalytics> {
    const completionRates = programs.map((p) => {
      const programClassrooms = classrooms.filter((c) => c.programId === p.id);
      const active = programClassrooms.filter((c) => c.isActive).length;
      const completed = programClassrooms.filter((c) => !c.isActive && c.endDate).length;
      const studentSet = new Set<string>();
      programClassrooms.forEach((c) => (c.studentIds || []).forEach((s) => studentSet.add(s)));

      return {
        programId: p.id,
        programName: p.name,
        totalClassrooms: programClassrooms.length,
        activeClassrooms: active,
        completedClassrooms: completed,
        completionRate:
          programClassrooms.length > 0 ? (completed / programClassrooms.length) * 100 : 0,
        totalStudents: studentSet.size,
      };
    });

    // Classroom utilization (students / maxStudents)
    const classroomUtilization = classrooms
      .filter((c) => c.isActive && c.maxStudents)
      .map((c) => ({
        classroomId: c.id,
        classroomName: `${c.subject} - ${c.name}`,
        utilization: c.maxStudents ? ((c.studentIds?.length || 0) / c.maxStudents) * 100 : 0,
      }));

    return {
      totalPrograms: programs.length,
      activePrograms: programs.filter((p) => p.isActive).length,
      completionRates,
      classroomUtilization,
    };
  }

  // ─── Teacher Analytics ─────────────────────────────────────

  private static async computeTeacherAnalytics(
    users: IUser[],
    classrooms: IClassroom[],
    evaluations: IStudentEvaluation[]
  ): Promise<ITeacherAnalytics> {
    const teachers = users.filter((u) => u.isTeacher);

    const teacherPerformance = teachers.map((teacher) => {
      const teacherClassrooms = classrooms.filter((c) => c.teacherId === teacher.id);
      const classroomIds = new Set(teacherClassrooms.map((c) => c.id));
      const teacherEvals = evaluations.filter(
        (e) => classroomIds.has(e.classroomId) && e.status === 'evaluated'
      );

      const totalStudents = new Set(
        teacherClassrooms.flatMap((c) => c.studentIds || [])
      ).size;

      const avgGrade =
        teacherEvals.length > 0
          ? teacherEvals.reduce((s, e) => s + e.percentage, 0) / teacherEvals.length
          : 0;

      const passing = teacherEvals.filter((e) => e.percentage >= 70).length;
      const passRate = teacherEvals.length > 0 ? (passing / teacherEvals.length) * 100 : 0;

      const attendanceRates = teacherEvals.map((e) =>
        EvaluationService.calculateAttendanceScore(e.attendanceRecords)
      );
      const attendanceRate =
        attendanceRates.length > 0
          ? attendanceRates.reduce((s, r) => s + r, 0) / attendanceRates.length
          : 0;

      return {
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        classroomCount: teacherClassrooms.length,
        totalStudents,
        averageGrade: avgGrade,
        passRate,
        attendanceRate,
      };
    });

    const avgStudents =
      teacherPerformance.length > 0
        ? teacherPerformance.reduce((s, t) => s + t.totalStudents, 0) / teacherPerformance.length
        : 0;

    const avgClassrooms =
      teacherPerformance.length > 0
        ? teacherPerformance.reduce((s, t) => s + t.classroomCount, 0) / teacherPerformance.length
        : 0;

    return {
      totalTeachers: teachers.length,
      teacherPerformance,
      averageStudentsPerTeacher: avgStudents,
      averageClassroomsPerTeacher: avgClassrooms,
    };
  }

  // ─── Demographics ──────────────────────────────────────────

  private static async computeDemographicAnalytics(users: IUser[]): Promise<IDemographicAnalytics> {
    const students = users.filter((u) => u.role === 'student');

    const countBy = (field: (u: IUser) => string | undefined) => {
      const map = new Map<string, number>();
      students.forEach((s) => {
        const val = field(s) || 'Sin especificar';
        map.set(val, (map.get(val) || 0) + 1);
      });
      return Array.from(map.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      studentsByCountry: countBy((u) => u.country).map((c) => ({ country: c.key, count: c.count })),
      studentsByChurch: countBy((u) => u.churchName).map((c) => ({ church: c.key, count: c.count })),
      studentsByAcademicLevel: countBy((u) => u.academicLevel ? this.translateAcademicLevel(u.academicLevel) : undefined).map((c) => ({
        level: c.key,
        count: c.count,
      })),
      studentsByEnrollmentType: countBy((u) => u.enrollmentType ? this.translateEnrollmentType(u.enrollmentType) : undefined).map((c) => ({
        type: c.key,
        count: c.count,
      })),
    };
  }

  // ─── Financial ─────────────────────────────────────────────

  private static async computeFinancialOverview(
    programs: IProgram[],
    classrooms: IClassroom[]
  ): Promise<IFinancialOverview> {
    const revenueByClassroom = classrooms.map((c) => {
      const students = c.studentIds?.length || 0;
      return {
        classroomId: c.id,
        classroomName: `${c.subject} - ${c.name}`,
        revenue: c.materialPrice * students,
        students,
      };
    });

    const totalMaterialRevenue = revenueByClassroom.reduce((s, c) => s + c.revenue, 0);

    // Revenue by program
    const programRevMap = new Map<string, { revenue: number; count: number; name: string }>();
    classrooms.forEach((c) => {
      const existing = programRevMap.get(c.programId) || { revenue: 0, count: 0, name: '' };
      existing.revenue += c.materialPrice * (c.studentIds?.length || 0);
      existing.count += c.studentIds?.length || 0;
      programRevMap.set(c.programId, existing);
    });

    // Resolve program names
    const programMap = new Map<string, IProgram>();
    programs.forEach((p) => programMap.set(p.id, p));

    const revenueByProgram = Array.from(programRevMap.entries()).map(([programId, data]) => ({
      programId,
      programName: programMap.get(programId)?.name || programId,
      revenue: data.revenue,
      studentCount: data.count,
    }));

    const totalStudents = classrooms.reduce((s, c) => s + (c.studentIds?.length || 0), 0);
    const averageCostPerStudent = totalStudents > 0 ? totalMaterialRevenue / totalStudents : 0;

    return {
      totalMaterialRevenue,
      revenueByProgram,
      revenueByClassroom: revenueByClassroom.filter((c) => c.revenue > 0),
      averageCostPerStudent,
    };
  }

  // ─── Historical Trends ─────────────────────────────────────

  private static async computeHistoricalTrends(runs: IClassroomRun[]): Promise<IHistoricalTrends> {
    // Group runs by classroom
    const classroomRuns = new Map<string, IClassroomRun[]>();
    runs.forEach((r) => {
      const existing = classroomRuns.get(r.classroomId) || [];
      existing.push(r);
      classroomRuns.set(r.classroomId, existing);
    });

    const runComparisons = Array.from(classroomRuns.entries()).map(([classroomId, cruns]) => ({
      classroomId,
      classroomName: cruns[0]?.classroomName || classroomId,
      runs: cruns
        .sort((a, b) => a.runNumber - b.runNumber)
        .map((r) => ({
          runNumber: r.runNumber,
          averageGrade: r.statistics.averageGrade,
          passRate: r.statistics.passRate,
          attendanceRate: r.statistics.attendanceRate,
          studentCount: r.totalStudents,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
    }));

    const allGrades = runs.map((r) => r.statistics.averageGrade).filter((g) => g > 0);
    const averageRunGrade = allGrades.length > 0 ? allGrades.reduce((s, g) => s + g, 0) / allGrades.length : 0;

    const allPassRates = runs.map((r) => r.statistics.passRate);
    const averageRunPassRate =
      allPassRates.length > 0 ? allPassRates.reduce((s, r) => s + r, 0) / allPassRates.length : 0;

    return {
      runComparisons,
      totalRuns: runs.length,
      averageRunGrade,
      averageRunPassRate,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────

  private static computeMonthlyRegistrations(users: IUser[]): IMonthlyCount[] {
    const months: IMonthlyCount[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const count = users.filter((u) => {
        if (!u.createdAt) return false;
        const created = u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt);
        return (
          created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth()
        );
      }).length;
      months.push({ month: monthKey, count });
    }

    return months;
  }

  private static translateCategory(cat: string): string {
    const map: Record<string, string> = {
      theology: 'Teologia',
      leadership: 'Liderazgo',
      discipleship: 'Discipulado',
      general: 'General',
      other: 'Otro',
    };
    return map[cat] || cat;
  }

  private static translateEnrollmentType(type: string): string {
    const map: Record<string, string> = {
      TheologyDegree: 'Licenciatura en Teologia',
      SingleCourse: 'Curso Individual',
      InternalFormation: 'Formacion Interna',
    };
    return map[type] || type;
  }

  private static translateAcademicLevel(level: string): string {
    const map: Record<string, string> = {
      Basic: 'Basico',
      HighSchool: 'Bachillerato',
      Bachelor: 'Universitario',
      Postgraduate: 'Postgrado',
      Doctorate: 'Doctorado',
    };
    return map[level] || level;
  }
}
