import React, { useEffect, useState } from 'react';
import {
  Container,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Button,
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
import { ManagementHero, ManagementSkeleton, TopProgressBar } from '../../components/common/ManagementWorkspace';
import '../../styles/management-workspace.css';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: 'bi-grid-1x2-fill', description: 'Indicadores clave y una lectura rápida del estado de la academia.' },
  { id: 'enrollment', label: 'Inscripciones', icon: 'bi-person-plus-fill', description: 'Crecimiento, retención y distribución de las inscripciones.' },
  { id: 'academic', label: 'Rendimiento', icon: 'bi-mortarboard-fill', description: 'Promedios, aprobación y estudiantes con mejor desempeño.' },
  { id: 'attendance', label: 'Asistencia', icon: 'bi-calendar-check-fill', description: 'Asistencia general, alertas y comportamiento por clase.' },
  { id: 'programs', label: 'Programas', icon: 'bi-collection-fill', description: 'Uso, avance y resultados de cada programa académico.' },
  { id: 'teachers', label: 'Profesores', icon: 'bi-person-workspace', description: 'Carga académica y resultados asociados a los profesores.' },
  { id: 'demographics', label: 'Demografía', icon: 'bi-globe2', description: 'Distribución geográfica, académica y por tipo de inscripción.' },
  { id: 'financial', label: 'Financiero', icon: 'bi-cash-stack', description: 'Ingresos, pagos pendientes y desempeño de los KPIs financieros.' },
  { id: 'trends', label: 'Tendencias', icon: 'bi-graph-up-arrow', description: 'Comparación histórica entre rondas y evolución de resultados.' },
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

  const activeTabDefinition = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <Container fluid className="management-workspace management-workspace--analytics statistics-workspace" aria-busy={loading}>
      <TopProgressBar active={loading} label="Actualizando estadísticas…" tone="analytics" />
      <ManagementHero
        eyebrow="Inteligencia académica"
        title="Estadísticas"
        description="Explora indicadores académicos, operativos y financieros sin perder el contexto entre secciones."
        icon="bi-graph-up-arrow"
        tone="analytics"
        meta={data?.generatedAt ? (
          <span>
            <i className="bi bi-clock-history me-1" />
            Actualizado {new Date(data.generatedAt).toLocaleString('es-DO')}
          </span>
        ) : (
          <span><i className="bi bi-cloud-arrow-down me-1" />Preparando indicadores</span>
        )}
        actions={(
          <Button color="light" onClick={loadData} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2" />Actualizar datos
          </Button>
        )}
      />

      {error ? (
        <Alert color="danger" className="statistics-error" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {error}
          </div>
          <Button color="danger" outline size="sm" onClick={loadData} disabled={loading}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {!data ? (
        <ManagementSkeleton rows={5} />
      ) : (
        <>
          <nav className="statistics-tabs-shell" aria-label="Secciones de estadísticas">
            <Nav tabs className="statistics-tabs flex-nowrap">
              {TABS.map((tab) => (
                <NavItem key={tab.id}>
                  <NavLink
                    tag="button"
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>
                    <span>{tab.label}</span>
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </nav>

          <div className="statistics-tab-intro">
            <span className="statistics-tab-intro__icon"><i className={`bi ${activeTabDefinition.icon}`} /></span>
            <div>
              <h2>{activeTabDefinition.label}</h2>
              <p>{activeTabDefinition.description}</p>
            </div>
          </div>

          <TabContent activeTab={activeTab} className="statistics-tab-content">
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
        </>
      )}
    </Container>
  );
};

export default Statistics;
