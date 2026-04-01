// Admin Dashboard Component

import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardText,
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
import { AppVersionService } from '../../services/app/app-version.service';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';
import { IAppVersionConfig } from '../../models';

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
    activePrograms: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [userStats, programs, currentAppVersion] = await Promise.all([
        UserService.getUserStatistics(),
        ProgramService.getAllPrograms(),
        AppVersionService.getAppVersionConfig(),
      ]);

      setStats({
        totalUsers: userStats.totalUsers,
        totalStudents: userStats.totalStudents,
        totalTeachers: userStats.totalTeachers,
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.isActive).length
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando panel de administración...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="display-6">Panel de Administración</h1>
        <p className="text-muted">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-primary mb-2">
                <i className="bi bi-people-fill"></i>
              </div>
              <CardTitle tag="h5">{stats.totalUsers}</CardTitle>
              <CardText className="text-muted">Usuarios Totales</CardText>
              <Button tag={Link} to="/admin/users" color="primary" size="sm">
                Ver Usuarios
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-success mb-2">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <CardTitle tag="h5">{stats.totalStudents}</CardTitle>
              <CardText className="text-muted">Estudiantes</CardText>
              <Button tag={Link} to="/admin/users?role=student" color="success" size="sm">
                Ver Estudiantes
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-info mb-2">
                <i className="bi bi-person-workspace"></i>
              </div>
              <CardTitle tag="h5">{stats.totalTeachers}</CardTitle>
              <CardText className="text-muted">Profesores</CardText>
              <Button tag={Link} to="/admin/users?role=teacher" color="info" size="sm">
                Ver Profesores
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-warning mb-2">
                <i className="bi bi-collection-fill"></i>
              </div>
              <CardTitle tag="h5">
                {stats.activePrograms}/{stats.totalPrograms}
              </CardTitle>
              <CardText className="text-muted">Programas Activos</CardText>
              <Button tag={Link} to="/admin/programs" color="warning" size="sm">
                Ver Programas
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-lightning-fill text-primary me-2"></i>
                Acciones Rápidas
              </h5>
              <div className="d-grid gap-2">
                <Button tag={Link} to="/admin/users" color="outline-primary">
                  <i className="bi bi-person-plus me-2"></i>
                  Agregar Nuevo Usuario
                </Button>
                <Button tag={Link} to="/admin/programs" color="outline-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Programa
                </Button>
                <Button tag={Link} to="/admin/classrooms" color="outline-primary">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Crear Nueva Clase
                </Button>
                <Button tag={Link} to="/admin/statistics" color="outline-info">
                  <i className="bi bi-graph-up-arrow me-2"></i>
                  Ver Estadisticas
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-whatsapp text-success me-2"></i>
                WhatsApp
              </h5>
              <div className="d-grid gap-2">
                <Button
                  tag={Link}
                  to="/admin/whatsapp"
                  color="outline-success"
                >
                  <i className="bi bi-qr-code me-2"></i>
                  Gestionar WhatsApp
                </Button>
                <Button
                  tag={Link}
                  to="/admin/whatsapp/groups"
                  color="outline-success"
                >
                  <i className="bi bi-people me-2"></i>
                  Administrar Grupos
                </Button>
                <Button
                  tag={Link}
                  to="/admin/whatsapp/bulk-messaging"
                  color="outline-success"
                >
                  <i className="bi bi-send me-2"></i>
                  Enviar Mensaje Masivo
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={7} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-arrow-repeat text-warning me-2"></i>
                Control de versión de la app
              </h5>

              <Alert color="warning" className="small">
                Publica aquí la versión una vez el despliegue ya esté disponible. Si la versión
                remota cambia, los dispositivos verán el banner para forzar la actualización.
              </Alert>

              <div className="rounded-3 bg-light border p-3 mb-3">
                <div className="small text-muted mb-1">Versión publicada actualmente</div>
                <div className="fw-bold fs-5">
                  {appVersionConfig?.version || 'Sin configurar'}
                </div>
                <div className="small text-muted mt-2">
                  {appVersionConfig?.updatedAt
                    ? `Última publicación: ${new Date(appVersionConfig.updatedAt).toLocaleString('es-DO')}`
                    : 'Aún no se ha publicado una versión desde el panel.'}
                </div>
                {appVersionConfig?.updatedByName && (
                  <div className="small text-muted">
                    Publicada por: {appVersionConfig.updatedByName}
                  </div>
                )}
              </div>

              <FormGroup className="mb-3">
                <Label for="appVersion">Versión publicada</Label>
                <Input
                  id="appVersion"
                  type="text"
                  placeholder="Ej: 2026.04.01"
                  value={versionForm.version}
                  onChange={(e) =>
                    setVersionForm((current) => ({ ...current, version: e.target.value }))
                  }
                />
              </FormGroup>

              <FormGroup className="mb-3">
                <Label for="appReleaseNotes">Notas de la actualización</Label>
                <Input
                  id="appReleaseNotes"
                  type="textarea"
                  rows={4}
                  placeholder="Resume aquí los cambios principales que trae esta versión."
                  value={versionForm.releaseNotes}
                  onChange={(e) =>
                    setVersionForm((current) => ({ ...current, releaseNotes: e.target.value }))
                  }
                />
              </FormGroup>

              <Button color="warning" onClick={() => void handleSaveAppVersion()} disabled={savingVersion}>
                {savingVersion ? (
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
        </Col>

        <Col lg={5} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-shield-check text-primary me-2"></i>
                Flujo de actualización
              </h5>
              <div className="small text-muted">
                Cuando un dispositivo detecta una versión distinta a la almacenada localmente,
                se muestra el banner global y la actualización fuerza limpieza de caché,
                service workers y almacenamiento persistente del origen antes de recargar.
              </div>
              <ul className="small text-muted mt-3 mb-0 ps-3">
                <li>Se compara la versión publicada en Firestore con la última usada en el dispositivo.</li>
                <li>Se intenta descargar el service worker más reciente sin usar caché intermedio.</li>
                <li>Al actualizar, se limpia caché, IndexedDB y registros de service worker del origen.</li>
                <li>Luego se recarga la app con una URL cache-busted para traer el build más reciente.</li>
              </ul>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <PWAInstallPrompt />
    </Container>
  );
};

export default AdminDashboard;
