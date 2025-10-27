// Admin Classroom List - Mobile First Design

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Input,
  InputGroup,
  InputGroupText,
  Spinner,
  Alert
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { ProgramService } from '../../services/program/program.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IProgram, IUser } from '../../models';
import { toast } from 'react-toastify';

const ClassroomList: React.FC = () => {
  const navigate = useNavigate();
  
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<Map<string, IProgram>>(new Map());
  const [teachers, setTeachers] = useState<Map<string, IUser>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all classrooms
      const classroomsData = await ClassroomService.getAllClassrooms();
      setClassrooms(classroomsData);
      
      // Load programs
      const programsData = await ProgramService.getAllPrograms();
      const programsMap = new Map<string, IProgram>();
      programsData.forEach(program => {
        programsMap.set(program.id, program);
      });
      setPrograms(programsMap);
      
      // Load teachers
      const teachersData = await UserService.getUsersByRole('teacher');
      const teachersMap = new Map<string, IUser>();
      teachersData.forEach(teacher => {
        teachersMap.set(teacher.id, teacher);
      });
      setTeachers(teachersMap);
      
    } catch (error) {
      console.error('Error loading classrooms:', error);
      toast.error('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const filteredClassrooms = classrooms.filter(classroom => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      classroom.name.toLowerCase().includes(searchLower) ||
      classroom.subject.toLowerCase().includes(searchLower) ||
      teachers.get(classroom.teacherId)?.firstName.toLowerCase().includes(searchLower) ||
      teachers.get(classroom.teacherId)?.lastName.toLowerCase().includes(searchLower);
    
    // Program filter
    const matchesProgram = filterProgram === 'all' || classroom.programId === filterProgram;
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && classroom.isActive) ||
      (filterStatus === 'inactive' && !classroom.isActive);
    
    return matchesSearch && matchesProgram && matchesStatus;
  });

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando clases...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3 px-2 px-sm-3">
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Gestión de Clases</h4>
            <Button
              color="primary"
              size="sm"
              onClick={() => navigate('/admin/programs')}
            >
              <i className="bi bi-plus-circle me-1"></i>
              <span className="d-none d-sm-inline">Nueva Clase</span>
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters - Mobile Optimized */}
      <Row className="mb-3">
        <Col xs="12" className="mb-2">
          <InputGroup size="sm">
            <InputGroupText>
              <i className="bi bi-search"></i>
            </InputGroupText>
            <Input
              type="text"
              placeholder="Buscar por nombre, materia o profesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs="6" className="mb-2">
          <Input
            type="select"
            size="sm"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
          >
            <option value="all">Todos los Programas</option>
            {Array.from(programs.values()).map(program => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </Input>
        </Col>
        <Col xs="6" className="mb-2">
          <Input
            type="select"
            size="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </Input>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="mb-3">
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0">{classrooms.length}</h5>
              <small className="text-muted">Total</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0 text-success">
                {classrooms.filter(c => c.isActive).length}
              </h5>
              <small className="text-muted">Activas</small>
            </CardBody>
          </Card>
        </Col>
        <Col xs="4">
          <Card className="text-center border-0 shadow-sm">
            <CardBody className="py-2">
              <h5 className="mb-0 text-danger">
                {classrooms.filter(c => !c.isActive).length}
              </h5>
              <small className="text-muted">Inactivas</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Classroom Cards - Mobile First */}
      {filteredClassrooms.length === 0 ? (
        <Alert color="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          No se encontraron clases con los filtros aplicados
        </Alert>
      ) : (
        <Row>
          {filteredClassrooms.map(classroom => {
            const program = programs.get(classroom.programId);
            const teacher = teachers.get(classroom.teacherId);
            
            return (
              <Col key={classroom.id} xs="12" md="6" lg="4" className="mb-3">
                <Card 
                  className="h-100 border-0 shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/classroom/${classroom.id}`)}
                >
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold">{classroom.subject}</h6>
                        <p className="text-muted small mb-0">{classroom.name}</p>
                      </div>
                      <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                        {classroom.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      <small className="text-muted d-block">
                        <i className="bi bi-folder me-1"></i>
                        {program?.name || 'Sin programa'}
                      </small>
                      <small className="text-muted d-block">
                        <i className="bi bi-person me-1"></i>
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Sin profesor'}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <small className="text-muted">
                        <i className="bi bi-people me-1"></i>
                        {classroom.studentIds?.length || 0} estudiantes
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-calendar-week me-1"></i>
                        {classroom.modules?.length || 0} módulos
                      </small>
                      {classroom.whatsappGroup && (
                        <Badge color="success" className="ms-2">
                          <i className="bi bi-whatsapp"></i>
                        </Badge>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default ClassroomList;
