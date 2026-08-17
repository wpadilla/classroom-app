// Admin Dashboard Component

import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  FormGroup,
  Label,
  Input,
  Alert
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ProgramService } from '../../services/program/program.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { AppVersionService } from '../../services/app/app-version.service';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';
import { IAppVersionConfig } from '../../models';
import './AdminDashboard.css';

type ShortcutTone = 'blue' | 'indigo' | 'violet' | 'amber' | 'green';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalPrograms: number;
  activePrograms: number;
  totalClassrooms: number;
  activeClassrooms: number;
}

interface VersionFormValues {
  version: string;
  releaseNotes: string;
}

interface DashboardShortcutProps {
  title: string;
  description: string;
  icon: string;
  to: string;
  tone: ShortcutTone;
  value: string;
}

interface DashboardActionProps {
  title: string;
  description: string;
  icon: string;
  to: string;
  tone?: 'primary' | 'success';
}

const DashboardShortcut: React.FC<DashboardShortcutProps> = ({
  title,
  description,
  icon,
  to,
  tone,
  value,
}) => (
  <Link
    to={to}
    className={`admin-shortcut admin-shortcut--${tone}`}
    aria-label={`Abrir ${title}`}
  >
    <div className="admin-shortcut__top">
      <span className="admin-shortcut__icon" aria-hidden="true">
        <i className={`bi ${icon}`}></i>
      </span>
      <i className="bi bi-arrow-up-right admin-shortcut__arrow" aria-hidden="true"></i>
    </div>
    <div className="admin-shortcut__content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <span className="admin-shortcut__value">{value}</span>
  </Link>
);

const DashboardAction: React.FC<DashboardActionProps> = ({
  title,
  description,
  icon,
  to,
  tone = 'primary',
}) => (
  <Link to={to} className={`admin-action admin-action--${tone}`}>
    <span className="admin-action__icon" aria-hidden="true">
      <i className={`bi ${icon}`}></i>
    </span>
    <span className="admin-action__copy">
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <i className="bi bi-chevron-right admin-action__arrow" aria-hidden="true"></i>
  </Link>
);

const DashboardHero: React.FC<{ firstName?: string; stats: DashboardStats }> = ({
  firstName,
  stats,
}) => (
  <header className="admin-dashboard__hero">
    <div className="admin-dashboard__hero-copy">
      <span className="admin-dashboard__eyebrow">
        <i className="bi bi-grid-1x2-fill" aria-hidden="true"></i>
        Panel de administración
      </span>
      <h1>Hola, {firstName || 'Administrador'}</h1>
      <p>Gestiona las operaciones principales del aula desde un solo lugar.</p>
    </div>

    <div className="admin-dashboard__hero-summary" aria-label="Resumen general">
      <div>
        <strong>{stats.totalUsers}</strong>
        <span>usuarios</span>
      </div>
      <div>
        <strong>{stats.activeClassrooms}</strong>
        <span>clases activas</span>
      </div>
      <div>
        <strong>{stats.activePrograms}</strong>
        <span>programas activos</span>
      </div>
    </div>
  </header>
);

const PrimaryShortcuts: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <section className="admin-dashboard__section" aria-labelledby="primary-shortcuts-title">
    <div className="admin-dashboard__section-heading">
      <div>
        <span className="admin-dashboard__section-kicker">Navegación</span>
        <h2 id="primary-shortcuts-title">Accesos principales</h2>
      </div>
      <p>Las herramientas que más utilizas, siempre a mano.</p>
    </div>

    <div className="admin-shortcuts-grid">
      <DashboardShortcut
        title="Clases"
        description="Calendario, aulas y evaluaciones"
        icon="bi-easel2-fill"
        to="/admin/classrooms"
        tone="blue"
        value={`${stats.activeClassrooms} de ${stats.totalClassrooms} activas`}
      />
      <DashboardShortcut
        title="Programas"
        description="Planes de estudio y asignaturas"
        icon="bi-collection-fill"
        to="/admin/programs"
        tone="indigo"
        value={`${stats.activePrograms} de ${stats.totalPrograms} activos`}
      />
      <DashboardShortcut
        title="Usuarios"
        description="Estudiantes, profesores y personal"
        icon="bi-people-fill"
        to="/admin/users"
        tone="violet"
        value={`${stats.totalUsers} registrados`}
      />
      <DashboardShortcut
        title="Estadísticas"
        description="Indicadores, avances y reportes"
        icon="bi-bar-chart-line-fill"
        to="/admin/statistics"
        tone="amber"
        value="Ver indicadores"
      />
      <DashboardShortcut
        title="WhatsApp"
        description="Conexión, grupos y comunicaciones"
        icon="bi-whatsapp"
        to="/admin/whatsapp"
        tone="green"
        value="Abrir herramientas"
      />
    </div>
  </section>
);

const FrequentOperations: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <Card className="admin-dashboard-card h-100">
    <CardBody>
      <div className="admin-dashboard-card__heading">
        <span className="admin-dashboard-card__heading-icon">
          <i className="bi bi-lightning-charge-fill" aria-hidden="true"></i>
        </span>
        <div>
          <h2>Operaciones frecuentes</h2>
          <p>Accede rápidamente a las tareas administrativas del día a día.</p>
        </div>
      </div>
      <div className="admin-action-list">
        <DashboardAction
          title="Gestionar clases"
          description="Crea una clase o revisa las que están en curso."
          icon="bi-calendar2-plus"
          to="/admin/classrooms"
        />
        <DashboardAction
          title="Administrar usuarios"
          description={`${stats.totalStudents} estudiantes y ${stats.totalTeachers} profesores registrados.`}
          icon="bi-person-plus"
          to="/admin/users"
        />
        <DashboardAction
          title="Organizar programas"
          description="Edita programas, materias y su secuencia académica."
          icon="bi-journal-plus"
          to="/admin/programs"
        />
      </div>
    </CardBody>
  </Card>
);

const CommunicationActions: React.FC = () => (
  <Card className="admin-dashboard-card admin-dashboard-card--whatsapp h-100">
    <CardBody>
      <div className="admin-dashboard-card__heading">
        <span className="admin-dashboard-card__heading-icon admin-dashboard-card__heading-icon--success">
          <i className="bi bi-whatsapp" aria-hidden="true"></i>
        </span>
        <div>
          <h2>Comunicación</h2>
          <p>Gestiona tus canales de WhatsApp.</p>
        </div>
      </div>
      <div className="admin-action-list">
        <DashboardAction
          title="Administrar grupos"
          description="Vincula las clases con sus grupos."
          icon="bi-people"
          to="/admin/whatsapp/groups"
          tone="success"
        />
        <DashboardAction
          title="Enviar mensaje masivo"
          description="Comunícate con varios grupos a la vez."
          icon="bi-send"
          to="/admin/whatsapp/bulk-messaging"
          tone="success"
        />
        <DashboardAction
          title="Configurar conexión"
          description="Revisa el estado de la sesión de WhatsApp."
          icon="bi-qr-code"
          to="/admin/whatsapp"
          tone="success"
        />
      </div>
    </CardBody>
  </Card>
);

const DashboardOperations: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <Row className="g-3 admin-dashboard__operations">
    <Col lg={7}>
      <FrequentOperations stats={stats} />
    </Col>
    <Col lg={5}>
      <CommunicationActions />
    </Col>
  </Row>
);

interface VersionEditorProps {
  config: IAppVersionConfig | null;
  form: VersionFormValues;
  saving: boolean;
  onChange: (field: keyof VersionFormValues, value: string) => void;
  onSave: () => void;
}

const VersionEditor: React.FC<VersionEditorProps> = ({
  config,
  form,
  saving,
  onChange,
  onSave,
}) => (
  <Card className="admin-dashboard-card h-100">
    <CardBody>
      <h5 className="mb-3">
        <i className="bi bi-arrow-repeat text-warning me-2"></i>
        Control de versión de la app
      </h5>

      <Alert color="warning" className="small">
        Publica aquí la versión una vez el despliegue ya esté disponible. Si la versión remota
        cambia, los dispositivos verán el banner para forzar la actualización.
      </Alert>

      <div className="rounded-3 bg-light border p-3 mb-3">
        <div className="small text-muted mb-1">Versión publicada actualmente</div>
        <div className="fw-bold fs-5">{config?.version || 'Sin configurar'}</div>
        <div className="small text-muted mt-2">
          {config?.updatedAt
            ? `Última publicación: ${new Date(config.updatedAt).toLocaleString('es-DO')}`
            : 'Aún no se ha publicado una versión desde el panel.'}
        </div>
        {config?.updatedByName && (
          <div className="small text-muted">Publicada por: {config.updatedByName}</div>
        )}
      </div>

      <FormGroup className="mb-3">
        <Label for="appVersion">Versión publicada</Label>
        <Input
          id="appVersion"
          type="text"
          placeholder="Ej: 2026.04.01"
          value={form.version}
          onChange={(event) => onChange('version', event.target.value)}
        />
      </FormGroup>

      <FormGroup className="mb-3">
        <Label for="appReleaseNotes">Notas de la actualización</Label>
        <Input
          id="appReleaseNotes"
          type="textarea"
          rows={4}
          placeholder="Resume aquí los cambios principales que trae esta versión."
          value={form.releaseNotes}
          onChange={(event) => onChange('releaseNotes', event.target.value)}
        />
      </FormGroup>

      <Button color="warning" onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Spinner size="sm" className="me-2" />
            Publicando...
          </>
        ) : (
          <>
            <i className="bi bi-cloud-arrow-up me-2"></i>
            Publicar nueva versión
          </>
        )}
      </Button>
    </CardBody>
  </Card>
);

const UpdateFlow: React.FC = () => (
  <Card className="admin-dashboard-card h-100">
    <CardBody>
      <h5 className="mb-3">
        <i className="bi bi-shield-check text-primary me-2"></i>
        Flujo de actualización
      </h5>
      <div className="small text-muted">
        Cuando un dispositivo detecta una versión distinta a la almacenada localmente, se muestra
        el banner global y la actualización fuerza limpieza de caché, service workers y
        almacenamiento persistente del origen antes de recargar.
      </div>
      <ul className="small text-muted mt-3 mb-0 ps-3">
        <li>Se compara la versión publicada en Firestore con la última usada en el dispositivo.</li>
        <li>Se intenta descargar el service worker más reciente sin usar caché intermedio.</li>
        <li>Al actualizar, se limpia caché, IndexedDB y registros de service worker del origen.</li>
        <li>Luego se recarga la app con una URL cache-busted para traer el build más reciente.</li>
      </ul>
    </CardBody>
  </Card>
);

const AppMaintenance: React.FC<VersionEditorProps> = (props) => (
  <section aria-labelledby="app-maintenance-title">
    <div className="admin-dashboard__section-heading admin-dashboard__section-heading--maintenance">
      <div>
        <span className="admin-dashboard__section-kicker">Mantenimiento</span>
        <h2 id="app-maintenance-title">Actualización de la aplicación</h2>
      </div>
      <p>Publica y comunica nuevas versiones de forma segura.</p>
    </div>

    <Row className="g-3">
      <Col lg={7} className="mb-3">
        <VersionEditor {...props} />
      </Col>
      <Col lg={5} className="mb-3">
        <UpdateFlow />
      </Col>
    </Row>
  </section>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingVersion, setSavingVersion] = useState(false);
  const [appVersionConfig, setAppVersionConfig] = useState<IAppVersionConfig | null>(null);
  const [versionForm, setVersionForm] = useState({
    version: '',
    releaseNotes: '',
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalPrograms: 0,
    activePrograms: 0,
    totalClassrooms: 0,
    activeClassrooms: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [userStats, programs, classrooms, currentAppVersion] = await Promise.all([
        UserService.getUserStatistics(),
        ProgramService.getAllPrograms(),
        ClassroomService.getAllClassrooms(),
        AppVersionService.getAppVersionConfig(),
      ]);

      setStats({
        totalUsers: userStats.totalUsers,
        totalStudents: userStats.totalStudents,
        totalTeachers: userStats.totalTeachers,
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.isActive).length,
        totalClassrooms: classrooms.length,
        activeClassrooms: classrooms.filter(classroom => classroom.isActive).length,
      });
      setAppVersionConfig(currentAppVersion);
      setVersionForm({
        version: currentAppVersion?.version || '',
        releaseNotes: currentAppVersion?.releaseNotes || '',
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppVersion = async () => {
    if (!user) {
      toast.error('Debes tener una sesión válida para publicar una versión.');
      return;
    }

    if (!versionForm.version.trim()) {
      toast.error('Debes indicar la versión que se va a publicar.');
      return;
    }

    try {
      setSavingVersion(true);
      await AppVersionService.upsertAppVersionConfig({
        version: versionForm.version,
        releaseNotes: versionForm.releaseNotes,
        updatedBy: user.id,
        updatedByName: `${user.firstName} ${user.lastName}`.trim(),
      });

      const refreshedConfig = await AppVersionService.getAppVersionConfig();
      setAppVersionConfig(refreshedConfig);
      setVersionForm({
        version: refreshedConfig?.version || versionForm.version.trim(),
        releaseNotes: refreshedConfig?.releaseNotes || versionForm.releaseNotes.trim(),
      });
      toast.success('Versión publicada correctamente.');
    } catch (error) {
      console.error('Error saving app version:', error);
      toast.error('No se pudo publicar la versión de la aplicación.');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleVersionFormChange = (field: keyof VersionFormValues, value: string) => {
    setVersionForm((current) => ({ ...current, [field]: value }));
  };

  if (loading) {
    return (
      <Container className="admin-dashboard-loading py-5 text-center">
        <span className="admin-dashboard-loading__icon">
          <Spinner size="sm" color="primary" />
        </span>
        <p className="mt-3 mb-1 fw-semibold">Preparando tu panel</p>
        <small className="text-muted">Estamos organizando la información administrativa.</small>
      </Container>
    );
  }

  return (
    <Container fluid="xl" className="admin-dashboard py-4 py-lg-5">
      <DashboardHero firstName={user?.firstName} stats={stats} />
      <PrimaryShortcuts stats={stats} />
      <DashboardOperations stats={stats} />
      <AppMaintenance
        config={appVersionConfig}
        form={versionForm}
        saving={savingVersion}
        onChange={handleVersionFormChange}
        onSave={() => void handleSaveAppVersion()}
      />
      <PWAInstallPrompt />
    </Container>
  );
};

export default AdminDashboard;
