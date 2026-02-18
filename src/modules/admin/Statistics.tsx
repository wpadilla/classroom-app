import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Button,
  Spinner,
  Alert,
} from 'reactstrap';
import { StatisticsService } from '../../services/statistics/statistics.service';
import { IStatisticsDashboard } from '../../models';
import StatisticsOverview from './components/statistics/StatisticsOverview';
import EnrollmentTab from './components/statistics/EnrollmentTab';
import AcademicPerformanceTab from './components/statistics/AcademicPerformanceTab';
import AttendanceTab from './components/statistics/AttendanceTab';
import ProgramAnalyticsTab from './components/statistics/ProgramAnalyticsTab';
import TeacherAnalyticsTab from './components/statistics/TeacherAnalyticsTab';
import DemographicsTab from './components/statistics/DemographicsTab';
import FinancialTab from './components/statistics/FinancialTab';
import TrendsTab from './components/statistics/TrendsTab';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: 'bi-grid-1x2-fill' },
  { id: 'enrollment', label: 'Inscripciones', icon: 'bi-person-plus-fill' },
  { id: 'academic', label: 'Rendimiento', icon: 'bi-mortarboard-fill' },
  { id: 'attendance', label: 'Asistencia', icon: 'bi-calendar-check-fill' },
  { id: 'programs', label: 'Programas', icon: 'bi-collection-fill' },
  { id: 'teachers', label: 'Profesores', icon: 'bi-person-workspace' },
  { id: 'demographics', label: 'Demografia', icon: 'bi-globe2' },
  { id: 'financial', label: 'Financiero', icon: 'bi-cash-stack' },
  { id: 'trends', label: 'Tendencias', icon: 'bi-graph-up-arrow' },
];

const Statistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<IStatisticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await StatisticsService.getDashboardData();
      setData(dashboard);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Error al cargar las estadisticas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando estadisticas...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert color="danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
        <Button color="primary" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-2"></i>Reintentar
        </Button>
      </Container>
    );
  }

  if (!data) return null;

  return (
    <Container fluid className="py-4 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-6 mb-1">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Estadisticas
          </h1>
          <p className="text-muted mb-0">
            Analisis completo de la academia
            {data.generatedAt && (
              <small className="ms-2">
                (Actualizado: {new Date(data.generatedAt).toLocaleString('es-DO')})
              </small>
            )}
          </p>
        </div>
        <Button color="outline-primary" onClick={loadData} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
        </Button>
      </div>

      <Nav tabs className="mb-4 flex-nowrap overflow-auto">
        {TABS.map((tab) => (
          <NavItem key={tab.id}>
            <NavLink
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <i className={`bi ${tab.icon} me-1`}></i>
              <span className="d-none d-md-inline">{tab.label}</span>
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={activeTab}>
        <TabPane tabId="overview">
          <StatisticsOverview data={data} />
        </TabPane>
        <TabPane tabId="enrollment">
          <EnrollmentTab data={data.enrollment} />
        </TabPane>
        <TabPane tabId="academic">
          <AcademicPerformanceTab data={data.academic} />
        </TabPane>
        <TabPane tabId="attendance">
          <AttendanceTab data={data.attendance} />
        </TabPane>
        <TabPane tabId="programs">
          <ProgramAnalyticsTab data={data.programs} />
        </TabPane>
        <TabPane tabId="teachers">
          <TeacherAnalyticsTab data={data.teachers} />
        </TabPane>
        <TabPane tabId="demographics">
          <DemographicsTab data={data.demographics} />
        </TabPane>
        <TabPane tabId="financial">
          <FinancialTab data={data.financial} />
        </TabPane>
        <TabPane tabId="trends">
          <TrendsTab data={data.trends} />
        </TabPane>
      </TabContent>
    </Container>
  );
};

export default Statistics;
