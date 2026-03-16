import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Button,
  ButtonGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Input,
  Label,
  Badge,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import Chart from 'react-apexcharts';
import {
  IFinancialEnrollmentEntry,
  IFinancialOverview,
  PaymentMethod,
} from '../../../../models';
import {
  formatCurrency,
  getPaymentMethodLabel,
} from '../../../../utils/paymentSnapshotUtils';

interface Props {
  data: IFinancialOverview;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface AggregatedFinancial {
  totals: IFinancialOverview['totals'];
  byProgram: IFinancialOverview['byProgram'];
  byClassroom: IFinancialOverview['byClassroom'];
  byStudent: IFinancialOverview['byStudent'];
  byMethod: IFinancialOverview['byMethod'];
  requiredOptional: IFinancialOverview['requiredOptional'];
  monthly: IFinancialOverview['monthly'];
}

const KPI_STORAGE_KEY = 'financial_kpis_v1';

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const toEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getRangeFromDays = (days: number): DateRange => {
  const end = toEndOfDay(new Date());
  const start = toStartOfDay(new Date(end));
  start.setDate(start.getDate() - (days - 1));
  return { start, end };
};

const getRangeFromMonths = (months: number): DateRange => {
  const end = toEndOfDay(new Date());
  const start = toStartOfDay(new Date(end));
  start.setMonth(start.getMonth() - months);
  start.setDate(start.getDate() + 1);
  return { start, end };
};

const getPreviousRange = (range: DateRange): DateRange => {
  const days = Math.ceil(
    (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const end = toEndOfDay(new Date(range.start.getTime() - 24 * 60 * 60 * 1000));
  const start = toStartOfDay(new Date(end));
  start.setDate(start.getDate() - (days - 1));
  return { start, end };
};

const shiftRangeYears = (range: DateRange, years: number): DateRange => {
  const start = new Date(range.start);
  const end = new Date(range.end);
  start.setFullYear(start.getFullYear() - years);
  end.setFullYear(end.getFullYear() - years);
  return { start: toStartOfDay(start), end: toEndOfDay(end) };
};

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

const isWithinRange = (date: unknown, range: DateRange | null) => {
  if (!range) return true;
  const value = normalizeDate(date);
  if (!value) return false;
  return value >= range.start && value <= range.end;
};

const aggregateFinancial = (
  enrollments: IFinancialEnrollmentEntry[],
  range: DateRange | null
): AggregatedFinancial => {
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

  const byProgramMap = new Map<string, AggregatedFinancial['byProgram'][number] & { unique: Set<string> }>();
  const byClassroomMap = new Map<string, AggregatedFinancial['byClassroom'][number]>();
  const byStudentMap = new Map<string, AggregatedFinancial['byStudent'][number]>();
  const byMethodMap = new Map<PaymentMethod, AggregatedFinancial['byMethod'][number]>();
  const monthlyMap = new Map<string, { expected: number; collected: number }>();
  const monthlyExpectedTracker = new Set<string>();
  const uniqueStudents = new Set<string>();

  const requiredOptional = {
    requiredExpected: 0,
    requiredCollected: 0,
    requiredOutstanding: 0,
    optionalExpected: 0,
    optionalCollected: 0,
    optionalOutstanding: 0,
    unassignedCollected: 0,
  };

  const getMonthKey = (value: Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const trackMonthlyExpected = (monthKey: string, enrollmentId: string, amount: number) => {
    if (!amount) return;
    const trackerKey = `${monthKey}::${enrollmentId}`;
    if (monthlyExpectedTracker.has(trackerKey)) return;
    monthlyExpectedTracker.add(trackerKey);
    const monthly = monthlyMap.get(monthKey) || { expected: 0, collected: 0 };
    monthly.expected += amount;
    monthlyMap.set(monthKey, monthly);
  };

  const allocatePayment = (
    payment: IFinancialEnrollmentEntry['payments'][number],
    costItems: IFinancialEnrollmentEntry['costItems']
  ) => {
    if (!payment.appliedItemIds || payment.appliedItemIds.length === 0) {
      requiredOptional.unassignedCollected += payment.amount;
      return;
    }

    const appliedItems = costItems.filter((item) => payment.appliedItemIds.includes(item.id));
    const appliedTotal = appliedItems.reduce((sum, item) => sum + item.amount, 0);
    if (!appliedTotal) {
      requiredOptional.unassignedCollected += payment.amount;
      return;
    }

    appliedItems.forEach((item) => {
      const portion = payment.amount * (item.amount / appliedTotal);
      if (item.required) {
        requiredOptional.requiredCollected += portion;
      } else {
        requiredOptional.optionalCollected += portion;
      }
    });
  };

  enrollments.forEach((entry) => {
    const paymentsInRange = range
      ? entry.payments.filter((payment) => isWithinRange(payment.createdAt, range))
      : entry.payments;

    const collected = paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0);
    const expected = entry.totalDue;
    const outstanding = Math.max(expected - collected, 0);

    totals.expected += expected;
    totals.collected += collected;
    totals.outstanding += outstanding;
    totals.totalEnrollments += 1;
    uniqueStudents.add(entry.studentId);

    requiredOptional.requiredExpected += entry.requiredDue;
    requiredOptional.optionalExpected += entry.optionalDue;

    paymentsInRange.forEach((payment) => {
      const byMethod = byMethodMap.get(payment.method) || {
        method: payment.method,
        amount: 0,
        count: 0,
      };
      byMethod.amount += payment.amount;
      byMethod.count += 1;
      byMethodMap.set(payment.method, byMethod);

      allocatePayment(payment, entry.costItems);

      const monthKey = getMonthKey(payment.createdAt);
      const monthly = monthlyMap.get(monthKey) || { expected: 0, collected: 0 };
      monthly.collected += payment.amount;
      monthlyMap.set(monthKey, monthly);
      trackMonthlyExpected(monthKey, entry.enrollmentId, entry.totalDue);
    });

    const byProgram = byProgramMap.get(entry.programId) ?? {
      programId: entry.programId,
      programName: entry.programName,
      expected: 0,
      collected: 0,
      outstanding: 0,
      collectionRate: 0,
      enrollmentCount: 0,
      uniqueStudentCount: 0,
      unique: new Set<string>(),
    };
    byProgram.expected += expected;
    byProgram.collected += collected;
    byProgram.outstanding += outstanding;
    byProgram.enrollmentCount += 1;
    byProgram.unique.add(entry.studentId);
    byProgram.uniqueStudentCount = byProgram.unique.size;
    byProgram.collectionRate = byProgram.expected > 0 ? (byProgram.collected / byProgram.expected) * 100 : 0;
    byProgramMap.set(entry.programId, byProgram);

    const byClassroom = byClassroomMap.get(entry.classroomId) || {
      classroomId: entry.classroomId,
      classroomName: entry.classroomName,
      programId: entry.programId,
      programName: entry.programName,
      expected: 0,
      collected: 0,
      outstanding: 0,
      collectionRate: 0,
      studentCount: 0,
    };
    byClassroom.expected += expected;
    byClassroom.collected += collected;
    byClassroom.outstanding += outstanding;
    byClassroom.studentCount += 1;
    byClassroom.collectionRate = byClassroom.expected > 0 ? (byClassroom.collected / byClassroom.expected) * 100 : 0;
    byClassroomMap.set(entry.classroomId, byClassroom);

    const byStudent = byStudentMap.get(entry.studentId) || {
      studentId: entry.studentId,
      studentName: entry.studentName,
      expected: 0,
      collected: 0,
      outstanding: 0,
      collectionRate: 0,
      enrollmentCount: 0,
    };
    byStudent.expected += expected;
    byStudent.collected += collected;
    byStudent.outstanding += outstanding;
    byStudent.enrollmentCount += 1;
    byStudent.collectionRate = byStudent.expected > 0 ? (byStudent.collected / byStudent.expected) * 100 : 0;
    byStudentMap.set(entry.studentId, byStudent);
  });

  requiredOptional.requiredOutstanding = Math.max(
    requiredOptional.requiredExpected - requiredOptional.requiredCollected,
    0
  );
  requiredOptional.optionalOutstanding = Math.max(
    requiredOptional.optionalExpected - requiredOptional.optionalCollected,
    0
  );

  totals.uniqueStudents = uniqueStudents.size;
  totals.collectionRate = totals.expected > 0 ? (totals.collected / totals.expected) * 100 : 0;
  totals.averageExpectedPerEnrollment = totals.totalEnrollments > 0 ? totals.expected / totals.totalEnrollments : 0;
  totals.averageCollectedPerEnrollment = totals.totalEnrollments > 0 ? totals.collected / totals.totalEnrollments : 0;
  totals.averageOutstandingPerEnrollment = totals.totalEnrollments > 0 ? totals.outstanding / totals.totalEnrollments : 0;
  totals.averageExpectedPerUniqueStudent = totals.uniqueStudents > 0 ? totals.expected / totals.uniqueStudents : 0;
  totals.averageCollectedPerUniqueStudent = totals.uniqueStudents > 0 ? totals.collected / totals.uniqueStudents : 0;
  totals.averageOutstandingPerUniqueStudent = totals.uniqueStudents > 0 ? totals.outstanding / totals.uniqueStudents : 0;

  const byProgram = Array.from(byProgramMap.values())
    .map(({ unique, ...entry }) => entry)
    .sort((a, b) => b.expected - a.expected);
  const byClassroom = Array.from(byClassroomMap.values()).sort((a, b) => b.expected - a.expected);
  const byStudent = Array.from(byStudentMap.values()).sort((a, b) => b.outstanding - a.outstanding);
  const byMethod = Array.from(byMethodMap.values()).sort((a, b) => b.amount - a.amount);
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
  };
};

const FinancialTab: React.FC<Props> = ({ data }) => {
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'filter' | 'compare'>('filter');

  const [dateFilterEnabled, setDateFilterEnabled] = useState(true);
  const [activeRange, setActiveRange] = useState<DateRange>(() => getRangeFromDays(30));
  const [quickPreset, setQuickPreset] = useState<'7d' | '15d' | '1m' | '3m' | 'all' | 'custom'>('1m');

  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareRange, setCompareRange] = useState<DateRange | null>(null);
  const [comparePreset, setComparePreset] = useState<string>('');

  const [draftFilterEnabled, setDraftFilterEnabled] = useState(true);
  const [draftFilterPreset, setDraftFilterPreset] = useState<'6m' | '12m' | '16m' | 'custom'>('6m');
  const [draftFilterRange, setDraftFilterRange] = useState<DateRange>(() => getRangeFromMonths(6));
  const [draftComparePreset, setDraftComparePreset] = useState<string>('');
  const [draftCompareEnabled, setDraftCompareEnabled] = useState(false);
  const [draftCompareRange, setDraftCompareRange] = useState<DateRange | null>(null);

  const kpiDefinitions = useMemo(
    () => [
      { key: 'expected', label: 'Ingresos Esperados', tone: 'primary' },
      { key: 'collected', label: 'Ingresos Cobrados', tone: 'success' },
      { key: 'outstanding', label: 'Saldo por Cobrar', tone: 'danger' },
      { key: 'collectionRate', label: 'Tasa de Cobranza', tone: 'info' },
      { key: 'avgEnrollmentExpected', label: 'Prom. Esperado (Inscripcion)', tone: 'secondary' },
      { key: 'avgUniqueExpected', label: 'Prom. Esperado (Estudiante Unico)', tone: 'secondary' },
      { key: 'avgEnrollmentCollected', label: 'Prom. Cobrado (Inscripcion)', tone: 'secondary' },
      { key: 'avgUniqueCollected', label: 'Prom. Cobrado (Estudiante Unico)', tone: 'secondary' },
    ],
    []
  );

  useEffect(() => {
    const stored = localStorage.getItem(KPI_STORAGE_KEY);
    if (!stored) {
      setSelectedKpis(kpiDefinitions.map((kpi) => kpi.key));
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSelectedKpis(parsed);
      } else {
        setSelectedKpis(kpiDefinitions.map((kpi) => kpi.key));
      }
    } catch (error) {
      console.error('Error loading KPI config:', error);
      setSelectedKpis(kpiDefinitions.map((kpi) => kpi.key));
    }
  }, [kpiDefinitions]);

  useEffect(() => {
    if (selectedKpis.length === 0) return;
    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(selectedKpis));
  }, [selectedKpis]);

  const enrollments = useMemo(() => data.enrollments || [], [data.enrollments]);
  const currentData = useMemo(
    () => aggregateFinancial(enrollments, dateFilterEnabled ? activeRange : null),
    [enrollments, dateFilterEnabled, activeRange]
  );
  const compareData = useMemo(() => {
    if (!compareEnabled || !compareRange) return null;
    return aggregateFinancial(enrollments, compareRange);
  }, [enrollments, compareEnabled, compareRange]);

  const visibleKpis = kpiDefinitions.filter((kpi) => selectedKpis.includes(kpi.key));

  const programLabels = currentData.byProgram.map((program) => program.programName);
  const programSeriesBase = [
    { name: 'Esperado', data: currentData.byProgram.map((program) => program.expected) },
    { name: 'Cobrado', data: currentData.byProgram.map((program) => program.collected) },
    { name: 'Pendiente', data: currentData.byProgram.map((program) => program.outstanding) },
  ];
  const programSeries = compareData
    ? (() => {
        const compareMap = new Map(compareData.byProgram.map((program) => [program.programId, program]));
        const compareSeries = [
          {
            name: 'Esperado (comparar)',
            data: currentData.byProgram.map((program) => compareMap.get(program.programId)?.expected ?? 0),
          },
          {
            name: 'Cobrado (comparar)',
            data: currentData.byProgram.map((program) => compareMap.get(program.programId)?.collected ?? 0),
          },
          {
            name: 'Pendiente (comparar)',
            data: currentData.byProgram.map((program) => compareMap.get(program.programId)?.outstanding ?? 0),
          },
        ];
        return [...programSeriesBase, ...compareSeries];
      })()
    : programSeriesBase;

  const methodLabels = currentData.byMethod.map((entry) => getPaymentMethodLabel(entry.method));
  const methodValues = currentData.byMethod.map((entry) => entry.amount);
  const compareMethodMap = compareData
    ? new Map(compareData.byMethod.map((entry) => [entry.method, entry]))
    : null;

  const monthlySeriesBase = [
    { name: 'Esperado', data: currentData.monthly.map((entry) => entry.expected) },
    { name: 'Cobrado', data: currentData.monthly.map((entry) => entry.collected) },
    { name: 'Pendiente', data: currentData.monthly.map((entry) => entry.outstanding) },
  ];
  const monthlySeries = compareData
    ? [
        ...monthlySeriesBase,
        { name: 'Esperado (comparar)', data: compareData.monthly.map((entry) => entry.expected) },
        { name: 'Cobrado (comparar)', data: compareData.monthly.map((entry) => entry.collected) },
        { name: 'Pendiente (comparar)', data: compareData.monthly.map((entry) => entry.outstanding) },
      ]
    : monthlySeriesBase;
  const monthlyLabels = currentData.monthly.map((entry) => entry.month);

  const toggleKpi = (key: string) => {
    setSelectedKpis((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  };

  const resetKpis = () => {
    setSelectedKpis(kpiDefinitions.map((kpi) => kpi.key));
  };

  const getKpiValue = (key: string) => {
    switch (key) {
      case 'expected':
        return formatCurrency(currentData.totals.expected);
      case 'collected':
        return formatCurrency(currentData.totals.collected);
      case 'outstanding':
        return formatCurrency(currentData.totals.outstanding);
      case 'collectionRate':
        return `${currentData.totals.collectionRate.toFixed(1)}%`;
      case 'avgEnrollmentExpected':
        return formatCurrency(currentData.totals.averageExpectedPerEnrollment);
      case 'avgUniqueExpected':
        return formatCurrency(currentData.totals.averageExpectedPerUniqueStudent);
      case 'avgEnrollmentCollected':
        return formatCurrency(currentData.totals.averageCollectedPerEnrollment);
      case 'avgUniqueCollected':
        return formatCurrency(currentData.totals.averageCollectedPerUniqueStudent);
      default:
        return '-';
    }
  };

  const getKpiNumeric = (key: string, source: AggregatedFinancial | null) => {
    if (!source) return null;
    switch (key) {
      case 'expected':
        return source.totals.expected;
      case 'collected':
        return source.totals.collected;
      case 'outstanding':
        return source.totals.outstanding;
      case 'collectionRate':
        return source.totals.collectionRate;
      case 'avgEnrollmentExpected':
        return source.totals.averageExpectedPerEnrollment;
      case 'avgUniqueExpected':
        return source.totals.averageExpectedPerUniqueStudent;
      case 'avgEnrollmentCollected':
        return source.totals.averageCollectedPerEnrollment;
      case 'avgUniqueCollected':
        return source.totals.averageCollectedPerUniqueStudent;
      default:
        return null;
    }
  };

  const renderDelta = (currentValue: number | null, compareValue: number | null, isPercent: boolean) => {
    if (currentValue === null || compareValue === null) return null;
    const diff = currentValue - compareValue;
    const diffPct = compareValue === 0 ? 0 : (diff / compareValue) * 100;
    const tone = diff >= 0 ? 'success' : 'danger';
    const sign = diff >= 0 ? '+' : '';
    const label = isPercent ? `${sign}${diff.toFixed(1)} pp` : `${sign}${formatCurrency(diff)}`;

    return (
      <div className={`text-${tone} small`}>
        {label} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
      </div>
    );
  };

  const renderCompareCell = (currentValue: number, compareValue?: number, isPercent?: boolean) => {
    if (compareValue === undefined) return null;
    const tone = currentValue >= compareValue ? 'success' : 'danger';
    const diff = currentValue - compareValue;
    const sign = diff >= 0 ? '+' : '';
    const label = isPercent ? `${sign}${diff.toFixed(1)} pp` : `${sign}${formatCurrency(diff)}`;
    return (
      <div className={`text-${tone} small`}>
        vs {isPercent ? `${compareValue.toFixed(1)}%` : formatCurrency(compareValue)} ({label})
      </div>
    );
  };

  const rangeLabel = dateFilterEnabled
    ? `${formatInputDate(activeRange.start)} - ${formatInputDate(activeRange.end)}`
    : 'Todo el tiempo';
  const compareLabel = compareEnabled && compareRange
    ? `${formatInputDate(compareRange.start)} - ${formatInputDate(compareRange.end)}`
    : '';

  const applyQuickPreset = (preset: '7d' | '15d' | '1m' | '3m') => {
    setDateFilterEnabled(true);
    setCompareEnabled(false);
    setCompareRange(null);
    setComparePreset('');
    setQuickPreset(preset);

    if (preset === '7d') setActiveRange(getRangeFromDays(7));
    if (preset === '15d') setActiveRange(getRangeFromDays(15));
    if (preset === '1m') setActiveRange(getRangeFromDays(30));
    if (preset === '3m') setActiveRange(getRangeFromDays(90));
  };

  const disableFilters = () => {
    setDateFilterEnabled(false);
    setCompareEnabled(false);
    setCompareRange(null);
    setComparePreset('');
    setQuickPreset('all');
  };

  const openFilterModal = () => {
    setDraftFilterEnabled(dateFilterEnabled);
    setDraftFilterRange(activeRange);
    setDraftFilterPreset('custom');
    setDraftCompareEnabled(compareEnabled);
    setDraftCompareRange(compareRange);
    setDraftComparePreset(comparePreset);
    setFilterModalOpen(true);
  };

  const applyFilterModal = () => {
    setFilterModalOpen(false);

    if (!draftFilterEnabled) {
      disableFilters();
      return;
    }

    setDateFilterEnabled(true);
    setActiveRange(draftFilterRange);
    setQuickPreset('custom');

    if (draftCompareEnabled && draftCompareRange) {
      setCompareEnabled(true);
      setCompareRange(draftCompareRange);
      setComparePreset(draftComparePreset);
    } else {
      setCompareEnabled(false);
      setCompareRange(null);
      setComparePreset('');
    }
  };

  const updateDraftFilterPreset = (preset: '6m' | '12m' | '16m' | 'custom') => {
    setDraftFilterPreset(preset);
    if (preset === '6m') setDraftFilterRange(getRangeFromMonths(6));
    if (preset === '12m') setDraftFilterRange(getRangeFromMonths(12));
    if (preset === '16m') setDraftFilterRange(getRangeFromMonths(16));
  };

  const updateDraftComparePreset = (preset: string) => {
    setDraftComparePreset(preset);
    setDraftCompareEnabled(true);
    setDraftFilterEnabled(true);

    if (preset === 'compare_24h_prev') {
      const range = getRangeFromDays(1);
      setDraftFilterRange(range);
      setDraftCompareRange(getPreviousRange(range));
    }
    if (preset === 'compare_24h_week') {
      const range = getRangeFromDays(1);
      const compare = {
        start: toStartOfDay(new Date(range.start.getTime() - 7 * 24 * 60 * 60 * 1000)),
        end: toEndOfDay(new Date(range.end.getTime() - 7 * 24 * 60 * 60 * 1000)),
      };
      setDraftFilterRange(range);
      setDraftCompareRange(compare);
    }
    if (preset === 'compare_7d_prev') {
      const range = getRangeFromDays(7);
      setDraftFilterRange(range);
      setDraftCompareRange(getPreviousRange(range));
    }
    if (preset === 'compare_7d_year') {
      const range = getRangeFromDays(7);
      setDraftFilterRange(range);
      setDraftCompareRange(shiftRangeYears(range, 1));
    }
    if (preset === 'compare_28d_prev') {
      const range = getRangeFromDays(28);
      setDraftFilterRange(range);
      setDraftCompareRange(getPreviousRange(range));
    }
    if (preset === 'compare_28d_year') {
      const range = getRangeFromDays(28);
      setDraftFilterRange(range);
      setDraftCompareRange(shiftRangeYears(range, 1));
    }
    if (preset === 'compare_3m_prev') {
      const range = getRangeFromMonths(3);
      setDraftFilterRange(range);
      setDraftCompareRange(getPreviousRange(range));
    }
    if (preset === 'compare_3m_year') {
      const range = getRangeFromMonths(3);
      setDraftFilterRange(range);
      setDraftCompareRange(shiftRangeYears(range, 1));
    }
    if (preset === 'compare_6m_prev') {
      const range = getRangeFromMonths(6);
      setDraftFilterRange(range);
      setDraftCompareRange(getPreviousRange(range));
    }
  };

  const updateDraftFilterRange = (field: 'start' | 'end', value: string) => {
    const parsed = parseInputDate(value);
    if (!parsed) return;
    setDraftFilterPreset('custom');
    setDraftFilterRange((current) => ({
      start: field === 'start' ? toStartOfDay(parsed) : current.start,
      end: field === 'end' ? toEndOfDay(parsed) : current.end,
    }));
  };

  const updateDraftCompareRange = (field: 'start' | 'end', value: string) => {
    const parsed = parseInputDate(value);
    if (!parsed) return;
    setDraftComparePreset('custom');
    setDraftCompareEnabled(true);
    setDraftCompareRange((current) => ({
      start: field === 'start' ? toStartOfDay(parsed) : (current?.start || toStartOfDay(parsed)),
      end: field === 'end' ? toEndOfDay(parsed) : (current?.end || toEndOfDay(parsed)),
    }));
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h5 className="mb-1">KPIs Financieros</h5>
          <small className="text-muted">
            {rangeLabel}
            {compareLabel && <span className="ms-2">vs {compareLabel}</span>}
          </small>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <ButtonGroup>
            <Button
              color="outline-secondary"
              size="sm"
              active={quickPreset === '7d'}
              onClick={() => applyQuickPreset('7d')}
            >
              7 dias
            </Button>
            <Button
              color="outline-secondary"
              size="sm"
              active={quickPreset === '15d'}
              onClick={() => applyQuickPreset('15d')}
            >
              15 dias
            </Button>
            <Button
              color="outline-secondary"
              size="sm"
              active={quickPreset === '1m'}
              onClick={() => applyQuickPreset('1m')}
            >
              1 mes
            </Button>
            <Button
              color="outline-secondary"
              size="sm"
              active={quickPreset === '3m'}
              onClick={() => applyQuickPreset('3m')}
            >
              3 meses
            </Button>
          </ButtonGroup>
          <Button
            color="outline-secondary"
            size="sm"
            active={quickPreset === 'all'}
            onClick={disableFilters}
          >
            Todo el tiempo
          </Button>
          <Button color="outline-secondary" size="sm" onClick={openFilterModal}>
            Mas informacion{' '}
            <span className="ms-1" aria-hidden="true">
              <i className="bi bi-caret-down-fill"></i>
            </span>
          </Button>
          <Button color="outline-secondary" size="sm" onClick={() => setKpiModalOpen(true)}>
            <i className="bi bi-sliders"></i>
            <span className="ms-2">Configurar KPIs</span>
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        {visibleKpis.map((kpi) => {
          const currentValue = getKpiNumeric(kpi.key, currentData);
          const compareValue = getKpiNumeric(kpi.key, compareData);
          const isPercent = kpi.key === 'collectionRate';

          return (
            <Col key={kpi.key} md={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <CardBody className="text-center">
                  <h4 className={`text-${kpi.tone}`}>{getKpiValue(kpi.key)}</h4>
                  <small className="text-muted">{kpi.label}</small>
                  {compareEnabled && renderDelta(currentValue, compareValue, isPercent)}
                </CardBody>
              </Card>
            </Col>
          );
        })}
        {visibleKpis.length === 0 && (
          <Col>
            <Card className="border-0 shadow-sm">
              <CardBody className="text-center text-muted">
                Selecciona KPIs desde la configuracion para mostrar indicadores.
              </CardBody>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="mb-4">
        <Col lg={8} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Ingresos por Programa</h6>
              {programLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={320}
                  options={{
                    chart: { stacked: true, toolbar: { show: false } },
                    xaxis: { categories: programLabels },
                    colors: ['#0d6efd', '#198754', '#dc3545', '#9ec5fe', '#a3cfbb', '#f5c2c7'],
                    plotOptions: { bar: { borderRadius: 4 } },
                    yaxis: { labels: { formatter: (v: number) => formatCurrency(v) } },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    legend: { position: 'top' },
                  }}
                  series={programSeries}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Pagos por Metodo</h6>
              {methodLabels.length > 0 ? (
                <Chart
                  type="donut"
                  height={320}
                  options={{
                    labels: methodLabels,
                    legend: { position: 'bottom' },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                  }}
                  series={methodValues}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
              {compareMethodMap && (
                <div className="mt-3">
                  {currentData.byMethod.map((entry) => (
                    <div key={entry.method} className="d-flex justify-content-between small text-muted">
                      <span>{getPaymentMethodLabel(entry.method)}</span>
                      <span>
                        {formatCurrency(entry.amount)}
                        {renderCompareCell(
                          entry.amount,
                          compareMethodMap.get(entry.method)?.amount
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Tendencia Mensual</h6>
              {monthlyLabels.length > 0 ? (
                <Chart
                  type="area"
                  height={320}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: monthlyLabels },
                    colors: ['#0d6efd', '#198754', '#dc3545', '#9ec5fe', '#a3cfbb', '#f5c2c7'],
                    dataLabels: { enabled: false },
                    stroke: { curve: 'smooth' },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    legend: { position: 'top' },
                  }}
                  series={monthlySeries}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Requeridos vs Opcionales</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Card className="bg-light h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Requerido Esperado</span>
                        <strong>{formatCurrency(currentData.requiredOptional.requiredExpected)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.requiredExpected,
                        compareData?.requiredOptional.requiredExpected
                      )}
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Requerido Cobrado</span>
                        <strong>{formatCurrency(currentData.requiredOptional.requiredCollected)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.requiredCollected,
                        compareData?.requiredOptional.requiredCollected
                      )}
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Requerido Pendiente</span>
                        <strong>{formatCurrency(currentData.requiredOptional.requiredOutstanding)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.requiredOutstanding,
                        compareData?.requiredOptional.requiredOutstanding
                      )}
                    </CardBody>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Opcional Esperado</span>
                        <strong>{formatCurrency(currentData.requiredOptional.optionalExpected)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.optionalExpected,
                        compareData?.requiredOptional.optionalExpected
                      )}
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Opcional Cobrado</span>
                        <strong>{formatCurrency(currentData.requiredOptional.optionalCollected)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.optionalCollected,
                        compareData?.requiredOptional.optionalCollected
                      )}
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Opcional Pendiente</span>
                        <strong>{formatCurrency(currentData.requiredOptional.optionalOutstanding)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.optionalOutstanding,
                        compareData?.requiredOptional.optionalOutstanding
                      )}
                    </CardBody>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Pagos sin asignar</span>
                        <strong>{formatCurrency(currentData.requiredOptional.unassignedCollected)}</strong>
                      </div>
                      {renderCompareCell(
                        currentData.requiredOptional.unassignedCollected,
                        compareData?.requiredOptional.unassignedCollected
                      )}
                      <small className="text-muted">Pagos sin items asociados</small>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Programa</h6>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Programa</th>
                    <th className="text-center">Inscripciones</th>
                    <th className="text-center">Estudiantes Unicos</th>
                    <th className="text-end">Esperado</th>
                    <th className="text-end">Cobrado</th>
                    <th className="text-end">Pendiente</th>
                    <th className="text-center">Cobranza</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.byProgram.map((program) => {
                    const compareProgram = compareData?.byProgram.find(
                      (entry) => entry.programId === program.programId
                    );
                    return (
                      <tr key={program.programId}>
                        <td>{program.programName}</td>
                        <td className="text-center">{program.enrollmentCount}</td>
                        <td className="text-center">{program.uniqueStudentCount}</td>
                        <td className="text-end">
                          {formatCurrency(program.expected)}
                          {compareProgram && renderCompareCell(program.expected, compareProgram.expected)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(program.collected)}
                          {compareProgram && renderCompareCell(program.collected, compareProgram.collected)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(program.outstanding)}
                          {compareProgram && renderCompareCell(program.outstanding, compareProgram.outstanding)}
                        </td>
                        <td className="text-center">
                          <Badge color={program.collectionRate >= 70 ? 'success' : 'warning'}>
                            {program.collectionRate.toFixed(1)}%
                          </Badge>
                          {compareProgram && renderCompareCell(program.collectionRate, compareProgram.collectionRate, true)}
                        </td>
                      </tr>
                    );
                  })}
                  {currentData.byProgram.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>

        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Clase</h6>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th className="text-center">Estudiantes</th>
                      <th className="text-end">Esperado</th>
                      <th className="text-end">Cobrado</th>
                      <th className="text-end">Pendiente</th>
                      <th className="text-center">Cobranza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.byClassroom.map((classroom) => {
                      const compareClassroom = compareData?.byClassroom.find(
                        (entry) => entry.classroomId === classroom.classroomId
                      );
                      return (
                        <tr key={classroom.classroomId}>
                          <td>{classroom.classroomName}</td>
                          <td className="text-center">{classroom.studentCount}</td>
                          <td className="text-end">
                            {formatCurrency(classroom.expected)}
                            {compareClassroom && renderCompareCell(classroom.expected, compareClassroom.expected)}
                          </td>
                          <td className="text-end">
                            {formatCurrency(classroom.collected)}
                            {compareClassroom && renderCompareCell(classroom.collected, compareClassroom.collected)}
                          </td>
                          <td className="text-end">
                            {formatCurrency(classroom.outstanding)}
                            {compareClassroom && renderCompareCell(classroom.outstanding, compareClassroom.outstanding)}
                          </td>
                          <td className="text-center">
                            <Badge color={classroom.collectionRate >= 70 ? 'success' : 'warning'}>
                              {classroom.collectionRate.toFixed(1)}%
                            </Badge>
                            {compareClassroom && renderCompareCell(classroom.collectionRate, compareClassroom.collectionRate, true)}
                          </td>
                        </tr>
                      );
                    })}
                    {currentData.byClassroom.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Sin datos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Estudiante</h6>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th className="text-center">Inscripciones</th>
                      <th className="text-end">Esperado</th>
                      <th className="text-end">Cobrado</th>
                      <th className="text-end">Pendiente</th>
                      <th className="text-center">Cobranza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.byStudent.map((student) => {
                      const compareStudent = compareData?.byStudent.find(
                        (entry) => entry.studentId === student.studentId
                      );
                      return (
                        <tr key={student.studentId}>
                          <td>{student.studentName}</td>
                          <td className="text-center">{student.enrollmentCount}</td>
                          <td className="text-end">
                            {formatCurrency(student.expected)}
                            {compareStudent && renderCompareCell(student.expected, compareStudent.expected)}
                          </td>
                          <td className="text-end">
                            {formatCurrency(student.collected)}
                            {compareStudent && renderCompareCell(student.collected, compareStudent.collected)}
                          </td>
                          <td className="text-end">
                            {formatCurrency(student.outstanding)}
                            {compareStudent && renderCompareCell(student.outstanding, compareStudent.outstanding)}
                          </td>
                          <td className="text-center">
                            <Badge color={student.collectionRate >= 70 ? 'success' : 'warning'}>
                              {student.collectionRate.toFixed(1)}%
                            </Badge>
                            {compareStudent && renderCompareCell(student.collectionRate, compareStudent.collectionRate, true)}
                          </td>
                        </tr>
                      );
                    })}
                    {currentData.byStudent.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Sin datos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal isOpen={kpiModalOpen} toggle={() => setKpiModalOpen(false)}>
        <ModalHeader toggle={() => setKpiModalOpen(false)}>
          Configuracion de KPIs
        </ModalHeader>
        <ModalBody>
          {kpiDefinitions.map((kpi) => (
            <FormGroup check key={kpi.key} className="mb-2">
              <Input
                type="checkbox"
                id={`kpi-${kpi.key}`}
                checked={selectedKpis.includes(kpi.key)}
                onChange={() => toggleKpi(kpi.key)}
              />
              <Label for={`kpi-${kpi.key}`} check>
                {kpi.label}
              </Label>
            </FormGroup>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={resetKpis}>
            Restablecer
          </Button>
          <Button color="primary" onClick={() => setKpiModalOpen(false)}>
            Listo
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={filterModalOpen} toggle={() => setFilterModalOpen(false)}>
        <ModalHeader toggle={() => setFilterModalOpen(false)}>
          Intervalo de fechas
        </ModalHeader>
        <ModalBody>
          <Nav tabs className="mb-3">
            <NavItem>
              <NavLink
                className={filterTab === 'filter' ? 'active' : ''}
                onClick={() => setFilterTab('filter')}
                style={{ cursor: 'pointer' }}
              >
                Filtrar
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={filterTab === 'compare' ? 'active' : ''}
                onClick={() => setFilterTab('compare')}
                style={{ cursor: 'pointer' }}
              >
                Comparar
              </NavLink>
            </NavItem>
          </Nav>

          {filterTab === 'filter' && (
            <div>
              <FormGroup check className="mb-3">
                <Input
                  type="checkbox"
                  id="disableFilters"
                  checked={!draftFilterEnabled}
                  onChange={() => setDraftFilterEnabled((current) => !current)}
                />
                <Label for="disableFilters" check>
                  Desactivar filtros de fecha (todo el tiempo)
                </Label>
              </FormGroup>

              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="filter-6m"
                  name="filterRange"
                  checked={draftFilterPreset === '6m'}
                  onChange={() => updateDraftFilterPreset('6m')}
                  disabled={!draftFilterEnabled}
                />
                <Label for="filter-6m" check>
                  Ultimos 6 meses
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="filter-12m"
                  name="filterRange"
                  checked={draftFilterPreset === '12m'}
                  onChange={() => updateDraftFilterPreset('12m')}
                  disabled={!draftFilterEnabled}
                />
                <Label for="filter-12m" check>
                  Ultimos 12 meses
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="filter-16m"
                  name="filterRange"
                  checked={draftFilterPreset === '16m'}
                  onChange={() => updateDraftFilterPreset('16m')}
                  disabled={!draftFilterEnabled}
                />
                <Label for="filter-16m" check>
                  Ultimos 16 meses
                </Label>
              </FormGroup>
              <FormGroup check className="mb-3">
                <Input
                  type="radio"
                  id="filter-custom"
                  name="filterRange"
                  checked={draftFilterPreset === 'custom'}
                  onChange={() => updateDraftFilterPreset('custom')}
                  disabled={!draftFilterEnabled}
                />
                <Label for="filter-custom" check>
                  Personalizado
                </Label>
              </FormGroup>

              {draftFilterPreset === 'custom' && (
                <Row className="g-3">
                  <Col md={6}>
                    <Label className="small text-muted">Fecha de inicio</Label>
                    <Input
                      type="date"
                      value={formatInputDate(draftFilterRange.start)}
                      onChange={(event) => updateDraftFilterRange('start', event.target.value)}
                      disabled={!draftFilterEnabled}
                    />
                  </Col>
                  <Col md={6}>
                    <Label className="small text-muted">Fecha de finalizacion</Label>
                    <Input
                      type="date"
                      value={formatInputDate(draftFilterRange.end)}
                      onChange={(event) => updateDraftFilterRange('end', event.target.value)}
                      disabled={!draftFilterEnabled}
                    />
                  </Col>
                </Row>
              )}
            </div>
          )}

          {filterTab === 'compare' && (
            <div>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-24h-prev"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_24h_prev'}
                  onChange={() => updateDraftComparePreset('compare_24h_prev')}
                />
                <Label for="compare-24h-prev" check>
                  Comparar las ultimas 24 horas con el periodo anterior
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-24h-week"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_24h_week'}
                  onChange={() => updateDraftComparePreset('compare_24h_week')}
                />
                <Label for="compare-24h-week" check>
                  Comparar las ultimas 24 horas semana a semana
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-7d-prev"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_7d_prev'}
                  onChange={() => updateDraftComparePreset('compare_7d_prev')}
                />
                <Label for="compare-7d-prev" check>
                  Comparar los ultimos 7 dias con el periodo anterior
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-7d-year"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_7d_year'}
                  onChange={() => updateDraftComparePreset('compare_7d_year')}
                />
                <Label for="compare-7d-year" check>
                  Comparar los ultimos 7 dias ano a ano
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-28d-prev"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_28d_prev'}
                  onChange={() => updateDraftComparePreset('compare_28d_prev')}
                />
                <Label for="compare-28d-prev" check>
                  Comparar los ultimos 28 dias con el periodo anterior
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-28d-year"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_28d_year'}
                  onChange={() => updateDraftComparePreset('compare_28d_year')}
                />
                <Label for="compare-28d-year" check>
                  Comparar los ultimos 28 dias ano a ano
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-3m-prev"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_3m_prev'}
                  onChange={() => updateDraftComparePreset('compare_3m_prev')}
                />
                <Label for="compare-3m-prev" check>
                  Comparar los ultimos 3 meses con el periodo anterior
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-3m-year"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_3m_year'}
                  onChange={() => updateDraftComparePreset('compare_3m_year')}
                />
                <Label for="compare-3m-year" check>
                  Comparar los ultimos 3 meses ano a ano
                </Label>
              </FormGroup>
              <FormGroup check className="mb-2">
                <Input
                  type="radio"
                  id="compare-6m-prev"
                  name="compareRange"
                  checked={draftComparePreset === 'compare_6m_prev'}
                  onChange={() => updateDraftComparePreset('compare_6m_prev')}
                />
                <Label for="compare-6m-prev" check>
                  Comparar los ultimos 6 meses con el periodo anterior
                </Label>
              </FormGroup>
              <FormGroup check className="mb-3">
                <Input
                  type="radio"
                  id="compare-custom"
                  name="compareRange"
                  checked={draftComparePreset === 'custom'}
                  onChange={() => {
                    setDraftComparePreset('custom');
                    setDraftCompareEnabled(true);
                  }}
                />
                <Label for="compare-custom" check>
                  Personalizado
                </Label>
              </FormGroup>

              {draftComparePreset === 'custom' && (
                <>
                  <Row className="g-3">
                    <Col md={6}>
                      <Label className="small text-muted">Fecha de inicio</Label>
                      <Input
                        type="date"
                        value={formatInputDate(draftFilterRange.start)}
                        onChange={(event) => updateDraftFilterRange('start', event.target.value)}
                      />
                    </Col>
                    <Col md={6}>
                      <Label className="small text-muted">Fecha de finalizacion</Label>
                      <Input
                        type="date"
                        value={formatInputDate(draftFilterRange.end)}
                        onChange={(event) => updateDraftFilterRange('end', event.target.value)}
                      />
                    </Col>
                  </Row>
                  <div className="text-muted small mt-2">frente a</div>
                  <Row className="g-3">
                    <Col md={6}>
                      <Label className="small text-muted">Fecha de inicio</Label>
                      <Input
                        type="date"
                        value={draftCompareRange ? formatInputDate(draftCompareRange.start) : ''}
                        onChange={(event) => updateDraftCompareRange('start', event.target.value)}
                      />
                    </Col>
                    <Col md={6}>
                      <Label className="small text-muted">Fecha de finalizacion</Label>
                      <Input
                        type="date"
                        value={draftCompareRange ? formatInputDate(draftCompareRange.end) : ''}
                        onChange={(event) => updateDraftCompareRange('end', event.target.value)}
                      />
                    </Col>
                  </Row>
                </>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setFilterModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={applyFilterModal}>
            Aplicar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default FinancialTab;
