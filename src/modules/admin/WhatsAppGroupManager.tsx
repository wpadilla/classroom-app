// WhatsApp Group Manager - Admin Only Component
// Manages all WhatsApp groups associated with classrooms

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
  Input,
  InputGroup,
  InputGroupText,
  Spinner,
  Alert,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { IClassroom, IUser } from '../../models';

const WhatsAppGroupManager: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [allClassrooms, setAllClassrooms] = useState<IClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-group' | 'without-group'>('all');
  
  // Sync modal state
  const [syncModal, setSyncModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<IClassroom | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  // Create group modal state
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  useEffect(() => {
    filterClassrooms();
  }, [searchTerm, filterStatus, allClassrooms]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const data = await ClassroomService.getAllClassrooms();
      setAllClassrooms(data);
      setClassrooms(data);
    } catch (error) {
      console.error('Error loading classrooms:', error);
      toast.error('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const filterClassrooms = () => {
    let filtered = [...allClassrooms];
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.subject.toLowerCase().includes(searchLower) ||
        c.whatsappGroup?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (filterStatus === 'with-group') {
      filtered = filtered.filter(c => c.whatsappGroup);
    } else if (filterStatus === 'without-group') {
      filtered = filtered.filter(c => !c.whatsappGroup);
    }
    
    setClassrooms(filtered);
  };

  const handleCreateGroup = async (classroom: IClassroom) => {
    setSelectedClassroom(classroom);
    setCreateGroupModal(true);
  };

  const confirmCreateGroup = async () => {
    if (!selectedClassroom) return;
    
    try {
      setCreating(true);
      await ClassroomService.createWhatsappGroup(selectedClassroom.id);
      toast.success('Grupo de WhatsApp creado exitosamente');
      setCreateGroupModal(false);
      await loadClassrooms();
    } catch (error: any) {
      console.error('Error creating WhatsApp group:', error);
      toast.error(error.message || 'Error al crear grupo de WhatsApp');
    } finally {
      setCreating(false);
    }
  };

  const handleSyncGroup = async (classroom: IClassroom) => {
    setSelectedClassroom(classroom);
    setSyncModal(true);
  };

  const confirmSyncGroup = async () => {
    if (!selectedClassroom) return;
    
    try {
      setSyncing(true);
      await ClassroomService.syncWhatsappGroup(selectedClassroom.id);
      toast.success('Grupo sincronizado exitosamente');
      setSyncModal(false);
      await loadClassrooms();
    } catch (error: any) {
      console.error('Error syncing WhatsApp group:', error);
      toast.error(error.message || 'Error al sincronizar grupo');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewClassroom = (classroomId: string) => {
    navigate(`/admin/classroom/${classroomId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="success" />
        <p className="mt-3">Cargando grupos...</p>
      </Container>
    );
  }

  const withGroup = allClassrooms.filter(c => c.whatsappGroup).length;
  const withoutGroup = allClassrooms.filter(c => !c.whatsappGroup).length;

  return (
    <Container fluid className="py-3 px-2 px-sm-3">
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <Button
            color="link"
            className="p-0 mb-2 text-decoration-none"
            onClick={() => navigate('/admin/whatsapp')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
          
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">
                <i className="bi bi-people me-2"></i>
                Administración de Grupos
              </h4>
              <p className="text-muted mb-0 small">
                Gestiona los grupos de WhatsApp de tus clases
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="mb-3">
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0">{allClassrooms.length}</h5>
              <small className="text-muted">Total Clases</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0 text-success">{withGroup}</h5>
              <small className="text-muted">Con Grupo</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0 text-warning">{withoutGroup}</h5>
              <small className="text-muted">Sin Grupo</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Progress Bar */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <CardBody className="py-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">Progreso de Configuración</small>
                <small className="text-muted fw-bold">
                  {withGroup}/{allClassrooms.length}
                </small>
              </div>
              <Progress 
                value={(withGroup / (allClassrooms.length || 1)) * 100} 
                color="success"
                className="mb-0"
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col xs="12" md="8" className="mb-2">
          <InputGroup size="sm">
            <InputGroupText>
              <i className="bi bi-search"></i>
            </InputGroupText>
            <Input
              type="text"
              placeholder="Buscar por nombre, materia o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs="12" md="4" className="mb-2">
          <Input
            type="select"
            bsSize="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todas las Clases</option>
            <option value="with-group">Con Grupo WhatsApp</option>
            <option value="without-group">Sin Grupo WhatsApp</option>
          </Input>
        </Col>
      </Row>

      {/* Classrooms Table - Mobile Responsive */}
      {classrooms.length === 0 ? (
        <Alert color="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          No se encontraron clases con los filtros aplicados
        </Alert>
      ) : (
        <Row>
          {/* Desktop View */}
          <Col className="d-none d-md-block">
            <Card className="border-0 shadow-sm">
              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Clase</th>
                        <th className="text-center">Estudiantes</th>
                        <th className="text-center">Estado Grupo</th>
                        <th className="text-center">Participantes</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classrooms.map(classroom => (
                        <tr key={classroom.id}>
                          <td>
                            <div>
                              <div className="fw-bold">{classroom.subject}</div>
                              <small className="text-muted">{classroom.name}</small>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge color="info">
                              {classroom.studentIds?.length || 0}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {classroom.whatsappGroup ? (
                              <Badge color="success">
                                <i className="bi bi-check-circle me-1"></i>
                                Conectado
                              </Badge>
                            ) : (
                              <Badge color="secondary">
                                <i className="bi bi-x-circle me-1"></i>
                                Sin Grupo
                              </Badge>
                            )}
                          </td>
                          <td className="text-center">
                            {classroom.whatsappGroup ? (
                              <Badge color="success" pill>
                                {classroom.whatsappGroup.participantCount || 0}
                              </Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {classroom.whatsappGroup ? (
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  color="outline-primary"
                                  size="sm"
                                  onClick={() => handleSyncGroup(classroom)}
                                  title="Sincronizar grupo"
                                >
                                  <i className="bi bi-arrow-repeat"></i>
                                </Button>
                                <Button
                                  color="outline-secondary"
                                  size="sm"
                                  onClick={() => handleViewClassroom(classroom.id)}
                                  title="Ver detalles"
                                >
                                  <i className="bi bi-eye"></i>
                                </Button>
                              </div>
                            ) : (
                              <Button
                                color="success"
                                size="sm"
                                onClick={() => handleCreateGroup(classroom)}
                              >
                                <i className="bi bi-plus-circle me-1"></i>
                                Crear Grupo
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Mobile View */}
          <Col className="d-md-none">
            {classrooms.map(classroom => (
              <Card key={classroom.id} className="border-0 shadow-sm mb-3">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1 fw-bold">{classroom.subject}</h6>
                      <small className="text-muted">{classroom.name}</small>
                    </div>
                    {classroom.whatsappGroup ? (
                      <Badge color="success">
                        <i className="bi bi-whatsapp"></i>
                      </Badge>
                    ) : (
                      <Badge color="secondary">Sin Grupo</Badge>
                    )}
                  </div>

                  <div className="d-flex gap-3 mb-3 small">
                    <div>
                      <i className="bi bi-people me-1"></i>
                      {classroom.studentIds?.length || 0} estudiantes
                    </div>
                    {classroom.whatsappGroup && (
                      <div>
                        <i className="bi bi-whatsapp me-1"></i>
                        {classroom.whatsappGroup.participantCount || 0} en grupo
                      </div>
                    )}
                  </div>

                  <div className="d-grid gap-2">
                    {classroom.whatsappGroup ? (
                      <>
                        <Button
                          color="outline-primary"
                          size="sm"
                          onClick={() => handleSyncGroup(classroom)}
                        >
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Sincronizar Grupo
                        </Button>
                        <Button
                          color="outline-secondary"
                          size="sm"
                          onClick={() => handleViewClassroom(classroom.id)}
                        >
                          <i className="bi bi-eye me-2"></i>
                          Ver Detalles
                        </Button>
                      </>
                    ) : (
                      <Button
                        color="success"
                        size="sm"
                        onClick={() => handleCreateGroup(classroom)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Crear Grupo de WhatsApp
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </Col>
        </Row>
      )}

      {/* Create Group Confirmation Modal */}
      <Modal 
        isOpen={createGroupModal} 
        toggle={() => setCreateGroupModal(false)}
        centered
      >
        <ModalHeader toggle={() => setCreateGroupModal(false)}>
          Crear Grupo de WhatsApp
        </ModalHeader>
        <ModalBody>
          {selectedClassroom && (
            <>
              <p>
                ¿Desea crear un grupo de WhatsApp para la clase:
              </p>
              <Alert color="info" className="mb-3">
                <strong>{selectedClassroom.subject}</strong><br />
                <small>{selectedClassroom.name}</small><br />
                <small className="text-muted">
                  {selectedClassroom.studentIds?.length || 0} estudiantes serán agregados
                </small>
              </Alert>
              <Alert color="warning" className="mb-0">
                <small>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Asegúrese de que WhatsApp esté conectado antes de crear el grupo.
                </small>
              </Alert>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setCreateGroupModal(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onClick={confirmCreateGroup}
            disabled={creating}
          >
            {creating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Crear Grupo
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Sync Group Modal */}
      <Modal 
        isOpen={syncModal} 
        toggle={() => setSyncModal(false)}
        centered
      >
        <ModalHeader toggle={() => setSyncModal(false)}>
          Sincronizar Grupo
        </ModalHeader>
        <ModalBody>
          {selectedClassroom && (
            <>
              <p>
                ¿Desea sincronizar el grupo de WhatsApp con los estudiantes actuales?
              </p>
              <Alert color="info" className="mb-3">
                <strong>{selectedClassroom.subject}</strong><br />
                <small>{selectedClassroom.name}</small><br />
                <small className="text-muted">
                  Grupo: {selectedClassroom.whatsappGroup?.name}
                </small>
              </Alert>
              <Alert color="warning" className="mb-0">
                <small>
                  <i className="bi bi-info-circle me-2"></i>
                  La sincronización agregará nuevos estudiantes al grupo y marcará los que ya no están inscritos.
                </small>
              </Alert>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setSyncModal(false)}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onClick={confirmSyncGroup}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Sincronizando...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat me-2"></i>
                Sincronizar
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default WhatsAppGroupManager;

