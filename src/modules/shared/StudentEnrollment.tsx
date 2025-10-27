// Mobile-First Student Enrollment Component
// Can be used by both Teachers and Admins

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Input,
  InputGroup,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner,
  ListGroup,
  ListGroupItem,
  FormGroup,
  Label,
  Form
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { IClassroom, IUser } from '../../models';
import { toast } from 'react-toastify';

interface StudentEnrollmentProps {
  classroom: IClassroom;
  onUpdate?: () => void;
}

const StudentEnrollment: React.FC<StudentEnrollmentProps> = ({ classroom, onUpdate }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<IUser[]>([]);
  const [allStudents, setAllStudents] = useState<IUser[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollModal, setEnrollModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  // New student form
  const [newStudentModal, setNewStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, [classroom]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all students
      const allStudentsList = await UserService.getUsersByRole('student');
      setAllStudents(allStudentsList);
      
      // Load enrolled students
      if (classroom.studentIds && classroom.studentIds.length > 0) {
        const enrolledList = allStudentsList.filter(s => 
          classroom.studentIds?.includes(s.id)
        );
        setEnrolledStudents(enrolledList);
      }
      
      // Filter available students
      const availableStudents = allStudentsList.filter(s => 
        !classroom.studentIds?.includes(s.id)
      );
      setStudents(availableStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Seleccione al menos un estudiante');
      return;
    }
    
    try {
      setSaving(true);
      
      // Add students to classroom
      for (const studentId of selectedStudents) {
        await ClassroomService.addStudentToClassroom(classroom.id, studentId);
      }
      
      toast.success(`${selectedStudents.length} estudiantes agregados`);
      setEnrollModal(false);
      setSelectedStudents([]);
      
      if (onUpdate) onUpdate();
      await loadData();
    } catch (error) {
      console.error('Error adding students:', error);
      toast.error('Error al agregar estudiantes');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('¿Está seguro de remover este estudiante de la clase?')) {
      return;
    }
    
    try {
      await ClassroomService.removeStudentFromClassroom(classroom.id, studentId);
      toast.success('Estudiante removido de la clase');
      
      if (onUpdate) onUpdate();
      await loadData();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Error al remover estudiante');
    }
  };

  const handleCreateStudent = async () => {
    // Validation
    if (!newStudentForm.firstName || !newStudentForm.lastName || 
        !newStudentForm.phone || !newStudentForm.password) {
      toast.error('Complete todos los campos requeridos');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create new student
      const studentId = await UserService.createUser({
        ...newStudentForm,
        role: 'student',
        isTeacher: false,
        isActive: true,
        enrolledClassrooms: [classroom.id],
        completedClassrooms: [],
        teachingClassrooms: [],
        taughtClassrooms: []
      });
      
      // Add to classroom
      await ClassroomService.addStudentToClassroom(classroom.id, studentId);
      
      toast.success('Estudiante creado y agregado a la clase');
      setNewStudentModal(false);
      setNewStudentForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: ''
      });
      
      if (onUpdate) onUpdate();
      await loadData();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(error.message || 'Error al crear estudiante');
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailableStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return fullName.includes(query) || 
           s.phone.includes(query) || 
           (s.email || '').toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner color="primary" />
        <p className="mt-2">Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-First Card Design */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0">
              <i className="bi bi-people-fill me-2"></i>
              Estudiantes ({enrolledStudents.length})
            </h5>
            <div className="btn-group mt-2 mt-sm-0">
              <Button 
                color="primary" 
                size="sm"
                onClick={() => setEnrollModal(true)}
              >
                <i className="bi bi-person-plus-fill me-1"></i>
                <span className="d-none d-sm-inline">Agregar</span>
              </Button>
              <Button 
                color="success" 
                size="sm"
                onClick={() => setNewStudentModal(true)}
              >
                <i className="bi bi-person-badge-fill me-1"></i>
                <span className="d-none d-sm-inline">Nuevo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {enrolledStudents.length === 0 ? (
            <Alert color="info" className="m-3">
              <i className="bi bi-info-circle me-2"></i>
              No hay estudiantes inscritos en esta clase
            </Alert>
          ) : (
            <ListGroup flush>
              {enrolledStudents.map((student, index) => (
                <ListGroupItem key={student.id} className="px-3 py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center flex-grow-1">
                      <div className="position-relative">
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={student.firstName}
                            className="rounded-circle"
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'cover' 
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <span className="fw-bold">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                        )}
                        <span className="position-absolute top-0 start-0 badge rounded-pill bg-secondary">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="ms-3">
                        <div className="fw-bold">
                          {student.firstName} {student.lastName}
                        </div>
                        <small className="text-muted d-block">
                          <i className="bi bi-phone me-1"></i>
                          {student.phone}
                        </small>
                        {student.email && (
                          <small className="text-muted d-block">
                            <i className="bi bi-envelope me-1"></i>
                            {student.email}
                          </small>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      color="danger"
                      size="sm"
                      outline
                      onClick={() => handleRemoveStudent(student.id)}
                      className="ms-2"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </ListGroupItem>
              ))}
            </ListGroup>
          )}
        </CardBody>
      </Card>

      {/* Add Students Modal - Mobile Optimized */}
      <Modal 
        isOpen={enrollModal} 
        toggle={() => setEnrollModal(false)}
        className="modal-fullscreen-sm-down"
      >
        <ModalHeader toggle={() => setEnrollModal(false)}>
          Agregar Estudiantes Existentes
        </ModalHeader>
        <ModalBody>
          <InputGroup className="mb-3">
            <InputGroupText>
              <i className="bi bi-search"></i>
            </InputGroupText>
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredAvailableStudents.length === 0 ? (
              <Alert color="warning">
                No hay estudiantes disponibles para agregar
              </Alert>
            ) : (
              <ListGroup>
                {filteredAvailableStudents.map(student => (
                  <ListGroupItem key={student.id} className="p-2">
                    <FormGroup check className="mb-0">
                      <Label check className="d-flex align-items-center">
                        <Input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(
                                selectedStudents.filter(id => id !== student.id)
                              );
                            }
                          }}
                        />
                        <div className="ms-2">
                          <strong>{student.firstName} {student.lastName}</strong>
                          <small className="d-block text-muted">
                            {student.phone}
                          </small>
                        </div>
                      </Label>
                    </FormGroup>
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={() => setEnrollModal(false)}
          >
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onClick={handleAddStudents}
            disabled={saving || selectedStudents.length === 0}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Agregando...
              </>
            ) : (
              <>Agregar ({selectedStudents.length})</>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create New Student Modal - Mobile Optimized */}
      <Modal 
        isOpen={newStudentModal} 
        toggle={() => setNewStudentModal(false)}
        className="modal-fullscreen-sm-down"
      >
        <ModalHeader toggle={() => setNewStudentModal(false)}>
          Crear Nuevo Estudiante
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="firstName">Nombre *</Label>
              <Input
                type="text"
                id="firstName"
                value={newStudentForm.firstName}
                onChange={(e) => setNewStudentForm({
                  ...newStudentForm,
                  firstName: e.target.value
                })}
                placeholder="Ingrese el nombre"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="lastName">Apellido *</Label>
              <Input
                type="text"
                id="lastName"
                value={newStudentForm.lastName}
                onChange={(e) => setNewStudentForm({
                  ...newStudentForm,
                  lastName: e.target.value
                })}
                placeholder="Ingrese el apellido"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="phone">Teléfono *</Label>
              <Input
                type="tel"
                id="phone"
                value={newStudentForm.phone}
                onChange={(e) => setNewStudentForm({
                  ...newStudentForm,
                  phone: e.target.value
                })}
                placeholder="809-555-0000"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="email">Correo Electrónico</Label>
              <Input
                type="email"
                id="email"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm({
                  ...newStudentForm,
                  email: e.target.value
                })}
                placeholder="correo@ejemplo.com (opcional)"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="password">Contraseña *</Label>
              <Input
                type="password"
                id="password"
                value={newStudentForm.password}
                onChange={(e) => setNewStudentForm({
                  ...newStudentForm,
                  password: e.target.value
                })}
                placeholder="Mínimo 6 caracteres"
              />
            </FormGroup>
            
            <Alert color="info">
              <i className="bi bi-info-circle me-2"></i>
              El estudiante será creado y agregado automáticamente a esta clase
            </Alert>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={() => setNewStudentModal(false)}
          >
            Cancelar
          </Button>
          <Button 
            color="success" 
            onClick={handleCreateStudent}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              'Crear y Agregar'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default StudentEnrollment;
