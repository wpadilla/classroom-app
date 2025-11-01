// WhatsApp Manager - Admin Only Component
// Manages WhatsApp session connection and provides overview of groups

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { IWhatsappSession, IClassroom } from '../../models';
const sessionId = 'bibleAssistant';

const WhatsAppManager: React.FC = () => {
  const navigate = useNavigate();

  // Session state
  const [session, setSession] = useState<IWhatsappSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // QR Modal state
  const [qrModal, setQrModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  
  // Classrooms with WhatsApp groups
  const [classroomsWithGroups, setClassroomsWithGroups] = useState<IClassroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  useEffect(() => {
    loadSessionStatus();
    loadClassroomsWithGroups();
  }, []);

  const loadSessionStatus = async () => {
    try {
      setLoading(true);
      const sessionData = await WhatsappService.getSessionStatus();
      setSession(sessionData);
      
      // If QR code is available, show modal
      if (sessionData.status === 'qr' && sessionData.qrCode) {
        setQrCode(sessionData.qrCode);
        setQrModal(true);
      }
    } catch (error) {
      console.error('Error loading session status:', error);
      setSession({
        sessionId: sessionId,
        status: 'disconnected'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClassroomsWithGroups = async () => {
    try {
      setLoadingClassrooms(true);
      const allClassrooms = await ClassroomService.getAllClassrooms();
      const withGroups = allClassrooms.filter(c => c.whatsappGroup);
      setClassroomsWithGroups(withGroups);
    } catch (error) {
      console.error('Error loading classrooms:', error);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const newSession = await WhatsappService.initializeSession();
      setSession(newSession);
      
      if (newSession.status === 'qr' && newSession.qrCode) {
        setQrCode(newSession.qrCode);
        setQrModal(true);
        toast.info('Escanea el código QR con WhatsApp');
      } else if (newSession.status === 'connected') {
        toast.success('WhatsApp conectado exitosamente');
      }
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Error al conectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Está seguro que desea desconectar WhatsApp?')) {
      return;
    }
    
    try {
      setDisconnecting(true);
      await WhatsappService.closeSession(false);
      setSession({
        sessionId: sessionId,
        status: 'disconnected'
      });
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Error al desconectar WhatsApp');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRestart = async () => {
    try {
      setConnecting(true);
      await WhatsappService.restartSession(true);
      await loadSessionStatus();
      toast.info('Reiniciando sesión de WhatsApp...');
    } catch (error) {
      console.error('Error restarting WhatsApp:', error);
      toast.error('Error al reiniciar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return 'success';
      case 'connecting':
      case 'qr':
        return 'warning';
      case 'disconnected':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'authenticated':
        return 'Autenticado';
      case 'connecting':
        return 'Conectando...';
      case 'qr':
        return 'Esperando QR';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return 'bi-check-circle-fill';
      case 'connecting':
      case 'qr':
        return 'bi-clock';
      case 'disconnected':
        return 'bi-x-circle-fill';
      default:
        return 'bi-question-circle-fill';
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="success" />
        <p className="mt-3">Cargando estado de WhatsApp...</p>
      </Container>
    );
  }

  const isConnected = session?.status === 'connected' || session?.status === 'authenticated';

  return (
    <Container fluid className="py-3 px-2 px-sm-3">
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <Button
            color="link"
            className="p-0 mb-2 text-decoration-none"
            onClick={() => navigate('/admin/dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver al Panel
          </Button>
          
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">
                <i className="bi bi-whatsapp text-success me-2"></i>
                Administración de WhatsApp
              </h4>
              <p className="text-muted mb-0 small">
                Gestiona la conexión y grupos de WhatsApp
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Session Status Card */}
      <Row className="mb-3">
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-phone me-2"></i>
                Estado de Conexión
              </h6>
            </CardHeader>
            <CardBody>
              <div className="text-center py-3">
                <div className="display-1 mb-3">
                  <i className={`bi ${getStatusIcon(session?.status || 'disconnected')} text-${getStatusColor(session?.status || 'disconnected')}`}></i>
                </div>
                
                <Badge 
                  color={getStatusColor(session?.status || 'disconnected')} 
                  className="mb-3 px-3 py-2"
                  style={{ fontSize: '1rem' }}
                >
                  {getStatusText(session?.status || 'disconnected')}
                </Badge>
                
                {session?.phoneNumber && (
                  <p className="text-muted mb-0">
                    <i className="bi bi-phone me-2"></i>
                    {session.phoneNumber}
                  </p>
                )}
                
                {session?.connectedAt && (
                  <p className="text-muted small mb-0">
                    Conectado desde: {new Date(session.connectedAt).toLocaleString('es-DO')}
                  </p>
                )}
              </div>
              
              <div className="d-grid gap-2 mt-3">
                {!isConnected ? (
                  <Button
                    color="success"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-power me-2"></i>
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      color="warning"
                      onClick={handleRestart}
                      disabled={connecting}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Reiniciar Sesión
                    </Button>
                    <Button
                      color="danger"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Desconectando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-power me-2"></i>
                          Desconectar
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Estadísticas
              </h6>
            </CardHeader>
            <CardBody>
              {loadingClassrooms ? (
                <div className="text-center py-4">
                  <Spinner size="sm" color="primary" />
                </div>
              ) : (
                <Row className="text-center">
                  <Col xs="6" className="mb-3">
                    <div className="display-4 text-success mb-2">
                      {classroomsWithGroups.length}
                    </div>
                    <small className="text-muted">Grupos Activos</small>
                  </Col>
                  <Col xs="6" className="mb-3">
                    <div className="display-4 text-primary mb-2">
                      {classroomsWithGroups.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0)}
                    </div>
                    <small className="text-muted">Estudiantes en Grupos</small>
                  </Col>
                </Row>
              )}
              
              <div className="d-grid gap-2 mt-3">
                <Button
                  color="outline-success"
                  onClick={() => navigate('/admin/whatsapp/groups')}
                >
                  <i className="bi bi-people me-2"></i>
                  Administrar Grupos
                </Button>
                <Button
                  color="outline-success"
                  onClick={() => navigate('/admin/whatsapp/bulk-messaging')}
                  disabled={!isConnected}
                >
                  <i className="bi bi-send me-2"></i>
                  Enviar Mensajes Masivos
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Connection Instructions */}
      {!isConnected && (
        <Row>
          <Col>
            <Alert color="info">
              <h6 className="alert-heading">
                <i className="bi bi-info-circle me-2"></i>
                Instrucciones de Conexión
              </h6>
              <ol className="mb-0 ps-3">
                <li>Haz clic en "Conectar WhatsApp"</li>
                <li>Escanea el código QR con tu teléfono</li>
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a Configuración → Dispositivos vinculados</li>
                <li>Toca "Vincular un dispositivo" y escanea el código</li>
                <li>Una vez conectado, podrás administrar grupos y enviar mensajes</li>
              </ol>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Recent Groups */}
      {isConnected && classroomsWithGroups.length > 0 && (
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Grupos Recientes
                </h6>
                <Button
                  color="link"
                  size="sm"
                  onClick={() => navigate('/admin/whatsapp/groups')}
                >
                  Ver Todos
                </Button>
              </CardHeader>
              <CardBody className="p-0">
                <div className="list-group list-group-flush">
                  {classroomsWithGroups.slice(0, 5).map(classroom => (
                    <div
                      key={classroom.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => navigate(`/admin/classroom/${classroom.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{classroom.subject}</h6>
                          <small className="text-muted">
                            {classroom.whatsappGroup?.name}
                          </small>
                        </div>
                        <div className="text-end">
                          <Badge color="success" className="mb-1">
                            <i className="bi bi-whatsapp me-1"></i>
                            {classroom.whatsappGroup?.participantCount || 0}
                          </Badge>
                          <br />
                          <small className="text-muted">
                            {classroom.studentIds?.length || 0} estudiantes
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* QR Code Modal */}
      <Modal 
        isOpen={qrModal} 
        toggle={() => setQrModal(false)}
        centered
        className="modal-dialog-scrollable"
      >
        <ModalHeader toggle={() => setQrModal(false)}>
          Escanea el Código QR
        </ModalHeader>
        <ModalBody className="text-center">
          {qrCode ? (
            <>
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="img-fluid mb-3"
                style={{ maxWidth: '300px' }}
              />
              <Alert color="info" className="mb-0">
                <small>
                  <strong>Instrucciones:</strong><br />
                  1. Abre WhatsApp en tu teléfono<br />
                  2. Ve a Configuración → Dispositivos vinculados<br />
                  3. Toca "Vincular un dispositivo"<br />
                  4. Escanea este código QR
                </small>
              </Alert>
            </>
          ) : (
            <Spinner color="success" />
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setQrModal(false)}>
            Cerrar
          </Button>
          <Button color="primary" onClick={loadSessionStatus}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualizar Estado
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default WhatsAppManager;

