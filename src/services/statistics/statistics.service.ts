// Statistics Service - Aggregates data from all services for dashboard analytics

import { UserService } from '../user/user.service';
import { ProgramService } from '../program/program.service';
import { ClassroomService } from '../classroom/classroom.service';
import { EvaluationService } from '../evaluation/evaluation.service';
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
  IClassroomPaymentCost,
  IClassroomStudentPayment,
  IFinancialEnrollmentEntry,
  PaymentMethod,
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
        this.computeFinancialOverview(users, programs, classrooms, runs),
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

    const averageByProgram = Array.from(programGrades.entries()).map(([programId, data]) => {
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
    users: IUser[],
    programs: IProgram[],
    classrooms: IClassroom[],
    runs: IClassroomRun[]
  ): Promise<IFinancialOverview> {
    const [costDocs, payments] = await Promise.all([
      FirebaseService.getDocuments<IClassroomPaymentCost>(COLLECTIONS.CLASSROOM_PAYMENT_COSTS),
      FirebaseService.getDocuments<IClassroomStudentPayment>(COLLECTIONS.CLASSROOM_STUDENT_PAYMENTS),
    ]);

    console.log('Cost docs:', costDocs);
    console.log('Payments:', payments);

    const programMap = new Map(programs.map((program) => [program.id, program]));
    const userMap = new Map(users.map((user) => [user.id, user]));
    const costMap = new Map(costDocs.map((doc) => [doc.classroomId, doc.items]));

    const totals = {
      expected: 0,
      collected: 0,
      outstanding: 0,
      collectionRate: 0,
      totalEnrollments: 0,
      uniqueStudents: 0,
      averageExpectedPerEnrollment: 0,
      averageCollectedPerEnrollment: 0,
      averageOutstandingPerEnrollment: 0,
      averageExpectedPerUniqueStudent: 0,
      averageCollectedPerUniqueStudent: 0,
      averageOutstandingPerUniqueStudent: 0,
    };

    const requiredOptional = {
      requiredExpected: 0,
      requiredCollected: 0,
      requiredOutstanding: 0,
      optionalExpected: 0,
      optionalCollected: 0,
      optionalOutstanding: 0,
      unassignedCollected: 0,
    };

    const byProgramMap = new Map<
      string,
      {
        programId: string;
        programName: string;
        expected: number;
        collected: number;
        outstanding: number;
        enrollmentCount: number;
        uniqueStudents: Set<string>;
      }
    >();

    const byClassroomMap = new Map<
      string,
      {
        classroomId: string;
        classroomName: string;
        programId: string;
        programName: string;
        expected: number;
        collected: number;
        outstanding: number;
        studentCount: number;
      }
    >();

    const byStudentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        expected: number;
        collected: number;
        outstanding: number;
        enrollmentCount: number;
      }
    >();

    const methodMap = new Map<PaymentMethod, { method: PaymentMethod; amount: number; count: number }>();
    const monthlyMap = new Map<string, { expected: number; collected: number }>();
    const monthlyExpectedTracker = new Set<string>();
    const uniqueStudents = new Set<string>();
    const enrollments: IFinancialEnrollmentEntry[] = [];

    const parseObjectDate = (value: { toDate?: () => Date; seconds?: number }): Date | null => {
      if (value.toDate) {
        const parsed = value.toDate();
        return parsed instanceof Date ? parsed : null;
      }
      if (typeof value.seconds === 'number') {
        const parsed = new Date(value.seconds * 1000);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    const normalizeDate = (value: unknown): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      if (typeof value === 'object') {
        return parseObjectDate(value as { toDate?: () => Date; seconds?: number });
      }
      return null;
    };

    const getMonthKey = (value: unknown): string => {
      const date = normalizeDate(value);
      if (!date) return 'invalid';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const getCostTotals = (items: IClassroomPaymentCost['items']) => {
      const requiredTotal = items.filter((item) => item.required).reduce((sum, item) => sum + item.amount, 0);
      const optionalTotal = items.filter((item) => !item.required).reduce((sum, item) => sum + item.amount, 0);
      return {
        total: requiredTotal + optionalTotal,
        requiredTotal,
        optionalTotal,
      };
    };

    const getCostSummary = (items: IClassroomPaymentCost['items']) =>
      items.map((item) => ({
        id: item.id,
        amount: item.amount,
        required: item.required,
      }));

    const groupPaymentsByStudent = (entries: IClassroomStudentPayment[]) => {
      return entries.reduce<Record<string, IClassroomStudentPayment[]>>((acc, payment) => {
        if (!acc[payment.studentId]) {
          acc[payment.studentId] = [];
        }
        acc[payment.studentId].push(payment);
        return acc;
      }, {});
    };

    const trackMonthlyExpected = (
      monthKey: string,
      classroomId: string,
      studentId: string,
      totalDuePerStudent: number
    ) => {
      if (!totalDuePerStudent) return;
      const trackerKey = `${monthKey}::${classroomId}::${studentId}`;
      if (monthlyExpectedTracker.has(trackerKey)) return;
      monthlyExpectedTracker.add(trackerKey);
      const monthly = monthlyMap.get(monthKey) || { expected: 0, collected: 0 };
      monthly.expected += totalDuePerStudent;
      monthlyMap.set(monthKey, monthly);
    };

    const allocatePayment = (
      payment: IClassroomStudentPayment,
      costItems: IClassroomPaymentCost['items']
    ) => {
      if (!payment.appliedItemIds || payment.appliedItemIds.length === 0) {
        requiredOptional.unassignedCollected += payment.amount;
        return;
      }

      const appliedItems = costItems.filter((item) => payment.appliedItemIds.includes(item.id));
      const totalApplied = appliedItems.reduce((sum, item) => sum + item.amount, 0);
      if (!totalApplied) {
        requiredOptional.unassignedCollected += payment.amount;
        return;
      }

      appliedItems.forEach((item) => {
        const portion = payment.amount * (item.amount / totalApplied);
        if (item.required) {
          requiredOptional.requiredCollected += portion;
        } else {
          requiredOptional.optionalCollected += portion;
        }
      });
    };

    const registerMethod = (method: PaymentMethod, amount: number) => {
      const existing = methodMap.get(method) || { method, amount: 0, count: 0 };
      existing.amount += amount;
      existing.count += 1;
      methodMap.set(method, existing);
    };

    const updateProgram = (
      programId: string,
      programName: string,
      expected: number,
      collected: number,
      outstanding: number,
      studentIds: string[]
    ) => {
      const entry = byProgramMap.get(programId) || {
        programId,
        programName,
        expected: 0,
        collected: 0,
        outstanding: 0,
        enrollmentCount: 0,
        uniqueStudents: new Set<string>(),
      };

      entry.expected += expected;
      entry.collected += collected;
      entry.outstanding += outstanding;
      entry.enrollmentCount += studentIds.length;
      studentIds.forEach((studentId) => entry.uniqueStudents.add(studentId));
      byProgramMap.set(programId, entry);
    };

    const updateClassroom = (payload: {
      classroomId: string;
      classroomName: string;
      programId: string;
      programName: string;
      expected: number;
      collected: number;
      outstanding: number;
      studentCount: number;
    }) => {
      byClassroomMap.set(payload.classroomId, payload);
    };

    const updateStudent = (
      studentId: string,
      studentName: string,
      expected: number,
      collected: number,
      outstanding: number
    ) => {
      const entry = byStudentMap.get(studentId) || {
        studentId,
        studentName,
        expected: 0,
        collected: 0,
        outstanding: 0,
        enrollmentCount: 0,
      };

      entry.expected += expected;
      entry.collected += collected;
      entry.outstanding += outstanding;
      entry.enrollmentCount += 1;
      byStudentMap.set(studentId, entry);
    };

    const addCurrentClassroom = (classroom: IClassroom) => {
      const costItems = costMap.get(classroom.id) || [];
      const costTotals = getCostTotals(costItems);
      const costSummary = getCostSummary(costItems);
      const studentIds = classroom.studentIds || [];
      const totalDuePerStudent = costTotals.total;
      const expected = totalDuePerStudent * studentIds.length;

      const classroomPayments = payments.filter((payment) => {
        if (payment.classroomId !== classroom.id) return false;
        if (!classroom.startDate) return true;
        const paymentDate = normalizeDate(payment.createdAt);
        const startDate = normalizeDate(classroom.startDate);
        if (!paymentDate || !startDate) return false;
        return paymentDate >= startDate;
      });
      const collected = classroomPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstanding = Math.max(expected - collected, 0);

      totals.totalEnrollments += studentIds.length;
      studentIds.forEach((studentId) => uniqueStudents.add(studentId));

      totals.expected += expected;
      totals.collected += collected;
      totals.outstanding += outstanding;

      requiredOptional.requiredExpected += costTotals.requiredTotal * studentIds.length;
      requiredOptional.optionalExpected += costTotals.optionalTotal * studentIds.length;

      const program = programMap.get(classroom.programId);
      const programName = program?.name || classroom.programId;
      const classroomName = `${classroom.subject} - ${classroom.name}`;

      updateProgram(
        classroom.programId,
        programName,
        expected,
        collected,
        outstanding,
        studentIds
      );
      updateClassroom({
        classroomId: classroom.id,
        classroomName,
        programId: classroom.programId,
        programName,
        expected,
        collected,
        outstanding,
        studentCount: studentIds.length,
      });

      const paymentsByStudent = new Map<string, number>();
      const groupedPayments = groupPaymentsByStudent(classroomPayments);
      classroomPayments.forEach((payment) => {
        paymentsByStudent.set(
          payment.studentId,
          (paymentsByStudent.get(payment.studentId) || 0) + payment.amount
        );
        registerMethod(payment.method, payment.amount);
        allocatePayment(payment, costItems);

        const monthKey = getMonthKey(payment.createdAt);
        if (monthKey !== 'invalid') {
          const monthly = monthlyMap.get(monthKey) || { expected: 0, collected: 0 };
          monthly.collected += payment.amount;
          monthlyMap.set(monthKey, monthly);
          trackMonthlyExpected(monthKey, classroom.id, payment.studentId, totalDuePerStudent);
        }
      });

      studentIds.forEach((studentId) => {
        const user = userMap.get(studentId);
        const studentName = user ? `${user.firstName} ${user.lastName}` : 'Desconocido';
        const studentCollected = paymentsByStudent.get(studentId) || 0;
        const studentExpected = totalDuePerStudent;
        const studentOutstanding = Math.max(studentExpected - studentCollected, 0);
        updateStudent(studentId, studentName, studentExpected, studentCollected, studentOutstanding);

        const studentPayments = groupedPayments[studentId] || [];
        enrollments.push({
          enrollmentId: `current:${classroom.id}:${studentId}`,
          source: 'current',
          classroomId: classroom.id,
          classroomName,
          programId: classroom.programId,
          programName,
          studentId,
          studentName,
          totalDue: totalDuePerStudent,
          requiredDue: costTotals.requiredTotal,
          optionalDue: costTotals.optionalTotal,
          costItems: costSummary,
          payments: studentPayments
            .map((payment) => {
              const createdAt = normalizeDate(payment.createdAt);
              if (!createdAt) return null;
              return {
                id: payment.id,
                amount: payment.amount,
                method: payment.method,
                createdAt,
                appliedItemIds: payment.appliedItemIds || [],
              };
            })
            .filter((payment): payment is IFinancialEnrollmentEntry['payments'][number] => !!payment),
        });
      });
    };

    const addRunSnapshot = (run: IClassroomRun) => {
      if (!run.paymentsSnapshot) {
        return;
      }

      const costItems = run.paymentsSnapshot.costs || [];
      const costTotals = getCostTotals(costItems);
      const costSummary = getCostSummary(costItems);
      const studentIds = run.students.map((student) => student.studentId);
      const totalDuePerStudent = costTotals.total;
      const expected = totalDuePerStudent * studentIds.length;
      const collected = run.paymentsSnapshot.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const outstanding = Math.max(expected - collected, 0);

      totals.totalEnrollments += studentIds.length;
      studentIds.forEach((studentId) => uniqueStudents.add(studentId));

      totals.expected += expected;
      totals.collected += collected;
      totals.outstanding += outstanding;

      requiredOptional.requiredExpected += costTotals.requiredTotal * studentIds.length;
      requiredOptional.optionalExpected += costTotals.optionalTotal * studentIds.length;

      updateProgram(
        run.programId,
        run.programName,
        expected,
        collected,
        outstanding,
        studentIds
      );
      updateClassroom({
        classroomId: run.classroomId,
        classroomName: `${run.classroomSubject} - ${run.classroomName}`,
        programId: run.programId,
        programName: run.programName,
        expected,
        collected,
        outstanding,
        studentCount: studentIds.length,
      });

      const paymentsByStudent = new Map<string, number>();
      const groupedPayments = groupPaymentsByStudent(run.paymentsSnapshot.payments);
      run.paymentsSnapshot.payments.forEach((payment) => {
        paymentsByStudent.set(
          payment.studentId,
          (paymentsByStudent.get(payment.studentId) || 0) + payment.amount
        );
        registerMethod(payment.method, payment.amount);
        allocatePayment(payment, costItems);

        const monthKey = getMonthKey(payment.createdAt);
        if (monthKey !== 'invalid') {
          const monthly = monthlyMap.get(monthKey) || { expected: 0, collected: 0 };
          monthly.collected += payment.amount;
          monthlyMap.set(monthKey, monthly);
          trackMonthlyExpected(monthKey, run.id, payment.studentId, totalDuePerStudent);
        }
      });

      run.students.forEach((student) => {
        const studentCollected = paymentsByStudent.get(student.studentId) || 0;
        const studentExpected = totalDuePerStudent;
        const studentOutstanding = Math.max(studentExpected - studentCollected, 0);
        updateStudent(
          student.studentId,
          student.studentName || 'Desconocido',
          studentExpected,
          studentCollected,
          studentOutstanding
        );

        const studentPayments = groupedPayments[student.studentId] || [];
        enrollments.push({
          enrollmentId: `run:${run.id}:${student.studentId}`,
          source: 'run',
          classroomId: run.classroomId,
          classroomName: `${run.classroomSubject} - ${run.classroomName}`,
          programId: run.programId,
          programName: run.programName,
          studentId: student.studentId,
          studentName: student.studentName || 'Desconocido',
          totalDue: totalDuePerStudent,
          requiredDue: costTotals.requiredTotal,
          optionalDue: costTotals.optionalTotal,
          costItems: costSummary,
          payments: studentPayments
            .map((payment) => {
              const createdAt = normalizeDate(payment.createdAt);
              if (!createdAt) return null;
              return {
                id: payment.id,
                amount: payment.amount,
                method: payment.method,
                createdAt,
                appliedItemIds: payment.appliedItemIds || [],
              };
            })
            .filter((payment): payment is IFinancialEnrollmentEntry['payments'][number] => !!payment),
        });
      });
    };

    classrooms.forEach(addCurrentClassroom);
    runs.forEach(addRunSnapshot);

    requiredOptional.requiredOutstanding = Math.max(
      requiredOptional.requiredExpected - requiredOptional.requiredCollected,
      0
    );
    requiredOptional.optionalOutstanding = Math.max(
      requiredOptional.optionalExpected - requiredOptional.optionalCollected,
      0
    );

    totals.outstanding = Math.max(totals.expected - totals.collected, 0);

    totals.uniqueStudents = uniqueStudents.size;
    totals.collectionRate = totals.expected > 0 ? (totals.collected / totals.expected) * 100 : 0;
    totals.averageExpectedPerEnrollment =
      totals.totalEnrollments > 0 ? totals.expected / totals.totalEnrollments : 0;
    totals.averageCollectedPerEnrollment =
      totals.totalEnrollments > 0 ? totals.collected / totals.totalEnrollments : 0;
    totals.averageOutstandingPerEnrollment =
      totals.totalEnrollments > 0 ? totals.outstanding / totals.totalEnrollments : 0;
    totals.averageExpectedPerUniqueStudent =
      totals.uniqueStudents > 0 ? totals.expected / totals.uniqueStudents : 0;
    totals.averageCollectedPerUniqueStudent =
      totals.uniqueStudents > 0 ? totals.collected / totals.uniqueStudents : 0;
    totals.averageOutstandingPerUniqueStudent =
      totals.uniqueStudents > 0 ? totals.outstanding / totals.uniqueStudents : 0;

    const byProgram = Array.from(byProgramMap.values())
      .map((entry) => ({
        programId: entry.programId,
        programName: entry.programName,
        expected: entry.expected,
        collected: entry.collected,
        outstanding: entry.outstanding,
        collectionRate: entry.expected > 0 ? (entry.collected / entry.expected) * 100 : 0,
        enrollmentCount: entry.enrollmentCount,
        uniqueStudentCount: entry.uniqueStudents.size,
      }))
      .sort((a, b) => b.expected - a.expected);

    const byClassroom = Array.from(byClassroomMap.values())
      .map((entry) => ({
        classroomId: entry.classroomId,
        classroomName: entry.classroomName,
        programId: entry.programId,
        programName: entry.programName,
        expected: entry.expected,
        collected: entry.collected,
        outstanding: entry.outstanding,
        collectionRate: entry.expected > 0 ? (entry.collected / entry.expected) * 100 : 0,
        studentCount: entry.studentCount,
      }))
      .sort((a, b) => b.expected - a.expected);

    const byStudent = Array.from(byStudentMap.values())
      .map((entry) => ({
        studentId: entry.studentId,
        studentName: entry.studentName,
        expected: entry.expected,
        collected: entry.collected,
        outstanding: entry.outstanding,
        collectionRate: entry.expected > 0 ? (entry.collected / entry.expected) * 100 : 0,
        enrollmentCount: entry.enrollmentCount,
      }))
      .sort((a, b) => b.outstanding - a.outstanding);

    const byMethod = Array.from(methodMap.values()).sort((a, b) => b.amount - a.amount);

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, values]) => ({
        month,
        expected: values.expected,
        collected: values.collected,
        outstanding: Math.max(values.expected - values.collected, 0),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totals,
      byProgram,
      byClassroom,
      byStudent,
      byMethod,
      requiredOptional,
      monthly,
      enrollments,
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

    const runComparisons = Array.from(classroomRuns.entries()).map(([classroomId, cruns]) => {
      const sortedRuns = [...cruns].sort((a, b) => a.runNumber - b.runNumber);
      return {
        classroomId,
        classroomName: cruns[0]?.classroomName || classroomId,
        runs: sortedRuns.map((r) => ({
          runNumber: r.runNumber,
          averageGrade: r.statistics.averageGrade,
          passRate: r.statistics.passRate,
          attendanceRate: r.statistics.attendanceRate,
          studentCount: r.totalStudents,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
      };
    });

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
