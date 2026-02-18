// UserDetailModal Component
// Comprehensive user management modal for admins
// Features: edit profile, manage classroom history, view program progress

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Card,
  CardBody,
  Table,
  Badge,
  Progress,
  Spinner,
  Alert,
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IUser, IClassroomHistory, IClassroom, IProgram } from '../../../models';
import { UserService } from '../../../services/user/user.service';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { ProgramService } from '../../../services/program/program.service';
import { userEditSchema, UserEditFormData } from '../../../schemas/user.schema';
import { useProgramProgress, ProgramProgress } from '../../../hooks/useProgramProgress';
import { toast } from 'react-toastify';
import { UserProfilePdfDownloadButton } from '../../../components/pdf/components/UserProfilePdfDownloadButton';
import { 
  DOCUMENT_TYPE_OPTIONS, 
  ACADEMIC_LEVEL_OPTIONS,
  COUNTRIES,
} from '../../../constants/registration.constants';

interface UserDetailModalProps {
  isOpen: boolean;
  toggle: () => void;
  user: IUser | null;
  onSave?: (updatedUser: IUser) => void;
  mode?: 'view' | 'edit';
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  toggle,
  user,
  onSave,
  mode = 'view',
}) => {
  // State
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [editMode, setEditMode] = useState(mode === 'edit');
  
  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  // History editing state
  const [editingHistory, setEditingHistory] = useState<IClassroomHistory | null>(null);
  const [addingHistory, setAddingHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    classroomId: '',
    enrollmentDate: '',
    completionDate: '',
    finalGrade: 0,
    status: 'completed' as 'completed' | 'dropped' | 'failed',
  });

  // Program progress hook
  const { programProgress, loading: loadingProgress, calculateProgress } = useProgramProgress();

  const defaultFormValues = useMemo<UserEditFormData>(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'student',
      isTeacher: false,
      isActive: true,
      password: '',
      documentType: '',
      documentNumber: '',
      country: 'DO',
      churchName: '',
      academicLevel: '',
    }),
    []
  );

  const formValues = useMemo<UserEditFormData>(
    () =>
      currentUser
        ? {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email || '',
            phone: currentUser.phone,
            role: currentUser.role,
            isTeacher: currentUser.isTeacher,
            isActive: currentUser.isActive,
            password: '',
            documentType: currentUser.documentType || '',
            documentNumber: currentUser.documentNumber || '',
            country: currentUser.country || 'DO',
            churchName: currentUser.churchName || '',
            academicLevel: currentUser.academicLevel || '',
          }
        : defaultFormValues,
    [currentUser, defaultFormValues]
  );

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: defaultFormValues,
    values: formValues,
    resetOptions: { keepDefaultValues: true },
  });

  const { ref: firstNameRef, ...firstNameField } = register('firstName');
  const { ref: lastNameRef, ...lastNameField } = register('lastName');
  const { ref: phoneRef, ...phoneField } = register('phone');
  const { ref: emailRef, ...emailField } = register('email');
  const { ref: roleRef, ...roleField } = register('role');
  const { ref: isTeacherRef, ...isTeacherField } = register('isTeacher');
  const { ref: isActiveRef, ...isActiveField } = register('isActive');
  const { ref: documentTypeRef, ...documentTypeField } = register('documentType');
  const { ref: documentNumberRef, ...documentNumberField } = register('documentNumber');
  const { ref: countryRef, ...countryField } = register('country');
  const { ref: churchNameRef, ...churchNameField } = register('churchName');
  const { ref: academicLevelRef, ...academicLevelField } = register('academicLevel');
  const { ref: passwordRef, ...passwordField } = register('password');

  // Form watch is available if needed for debugging
  // const formData = watch();

  const resetForm = useCallback(
    (targetUser: IUser) => {
      reset({
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email || '',
        phone: targetUser.phone,
        role: targetUser.role,
        isTeacher: targetUser.isTeacher,
        isActive: targetUser.isActive,
        password: '',
        documentType: targetUser.documentType || '',
        documentNumber: targetUser.documentNumber || '',
        country: targetUser.country || 'DO',
        churchName: targetUser.churchName || '',
        academicLevel: targetUser.academicLevel || '',
      });
    },
    [reset]
  );

  // Load data on open
  useEffect(() => {
    if (isOpen && user) {
      // Immediately reset form with user data (before async fetch)
      setCurrentUser(user);
      resetForm(user);
      setPhotoPreview(user.profilePhoto || '');
      // Then load fresh data from server
      void loadData(user.id);
    } else if (!isOpen) {
      // Reset state when modal closes
      setCurrentUser(null);
      setEditMode(mode === 'edit');
      setActiveTab('info');
    }
  }, [isOpen, mode, resetForm, user]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch fresh user data
      const freshUser = await UserService.getUserById(userId);
      console.log('Fetched user data:', freshUser);
      if (freshUser) {
        setCurrentUser(freshUser);
        resetForm(freshUser);
        setPhotoPreview(freshUser.profilePhoto || '');
      }

      // Load reference data
      const [allClassrooms, allPrograms] = await Promise.all([
        ClassroomService.getAllClassrooms(),
        ProgramService.getAllPrograms(),
      ]);
      setClassrooms(allClassrooms);
      setPrograms(allPrograms);

      // Calculate progress
      if (freshUser) {
        await calculateProgress(freshUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoUrl = await UserService.updateProfilePhoto(currentUser.id, file);
      setPhotoPreview(photoUrl);
      setCurrentUser(prev => prev ? { ...prev, profilePhoto: photoUrl } : null);
      toast.success('Foto actualizada');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle save user
  const onSubmit = async (data: UserEditFormData) => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const updates: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
        role: data.role,
        isTeacher: data.isTeacher,
        isActive: data.isActive,
        // Extended fields
        documentType: data.documentType || undefined,
        documentNumber: data.documentNumber || undefined,
        country: data.country || undefined,
        churchName: data.churchName || undefined,
        academicLevel: data.academicLevel || undefined,
      };

      if (data.password) {
        updates.password = data.password;
      }

      await UserService.updateUser(currentUser.id, updates);
      
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      
      if (onSave) {
        onSave(updatedUser);
      }
      
      toast.success('Usuario actualizado');
      setEditMode(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Handle add/edit history
  const saveHistoryEntry = async () => {
    if (!currentUser || !historyForm.classroomId) return;

    const classroom = classrooms.find(c => c.id === historyForm.classroomId);
    const program = programs.find(p => p.id === classroom?.programId);

    if (!classroom) {
      toast.error('Clase no encontrada');
      return;
    }

    const newEntry: IClassroomHistory = {
      classroomId: historyForm.classroomId,
      classroomName: classroom.name,
      programId: classroom.programId,
      programName: program?.name || 'Sin programa',
      role: 'student',
      enrollmentDate: new Date(historyForm.enrollmentDate),
      completionDate: new Date(historyForm.completionDate),
      finalGrade: historyForm.finalGrade,
      status: historyForm.status,
    };

    setSaving(true);
    try {
      let completedClassrooms = [...(currentUser.completedClassrooms || [])];

      if (editingHistory) {
        // Update existing
        completedClassrooms = completedClassrooms.map(c =>
          c.classroomId === editingHistory.classroomId ? newEntry : c
        );
      } else {
        // Add new
        completedClassrooms.push(newEntry);
      }

      await UserService.updateUser(currentUser.id, { completedClassrooms });
      setCurrentUser(prev => prev ? { ...prev, completedClassrooms } : null);
      
      toast.success(editingHistory ? 'Historial actualizado' : 'Clase agregada al historial');
      cancelHistoryEdit();
      
      // Recalculate progress
      if (currentUser) {
        await calculateProgress({ ...currentUser, completedClassrooms });
      }
    } catch (error) {
      console.error('Error saving history:', error);
      toast.error('Error al guardar historial');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete history entry
  const deleteHistoryEntry = async (classroomId: string) => {
    if (!currentUser) return;

    if (!window.confirm('¿Está seguro de eliminar esta clase del historial?')) {
      return;
    }

    setSaving(true);
    try {
      const completedClassrooms = (currentUser.completedClassrooms || []).filter(
        c => c.classroomId !== classroomId
      );

      await UserService.updateUser(currentUser.id, { completedClassrooms });
      setCurrentUser(prev => prev ? { ...prev, completedClassrooms } : null);
      toast.success('Clase eliminada del historial');
      
      // Recalculate progress
      await calculateProgress({ ...currentUser, completedClassrooms });
    } catch (error) {
      console.error('Error deleting history:', error);
      toast.error('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  // Start editing history entry
  const startEditHistory = (entry: IClassroomHistory) => {
    setEditingHistory(entry);
    setHistoryForm({
      classroomId: entry.classroomId,
      enrollmentDate: new Date(entry.enrollmentDate).toISOString().split('T')[0],
      completionDate: new Date(entry.completionDate).toISOString().split('T')[0],
      finalGrade: entry.finalGrade || 0,
      status: entry.status,
    });
  };

  // Start adding new history
  const startAddHistory = () => {
    setAddingHistory(true);
    setHistoryForm({
      classroomId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      completionDate: new Date().toISOString().split('T')[0],
      finalGrade: 0,
      status: 'completed',
    });
  };

  // Cancel history edit
  const cancelHistoryEdit = () => {
    setEditingHistory(null);
    setAddingHistory(false);
    setHistoryForm({
      classroomId: '',
      enrollmentDate: '',
      completionDate: '',
      finalGrade: 0,
      status: 'completed',
    });
  };

  // Get role badge
  const getRoleBadge = (role: string, isTeacher: boolean) => {
    if (role === 'admin') return <Badge color="danger">Administrador</Badge>;
    if (isTeacher) return <Badge color="info">Profesor</Badge>;
    if (role === 'teacher') return <Badge color="info">Profesor</Badge>;
    return <Badge color="primary">Estudiante</Badge>;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge color="success">Completado</Badge>;
      case 'dropped': return <Badge color="warning">Retirado</Badge>;
      case 'failed': return <Badge color="danger">Reprobado</Badge>;
      default: return <Badge color="secondary">{status}</Badge>;
    }
  };

  // Get grade color
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  if (!currentUser && !loading) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" backdrop="static">
      <ModalHeader toggle={toggle}>
        <i className="bi bi-person-badge me-2"></i>
        {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Cargando...'}
        {currentUser && (
          <span className="ms-2">
            {getRoleBadge(currentUser.role, currentUser.isTeacher)}
            {!currentUser.isActive && <Badge color="secondary" className="ms-1">Inactivo</Badge>}
          </span>
        )}
      </ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : currentUser && (
          <>
            <Nav tabs className="mb-3">
              <NavItem>
                <NavLink
                  className={activeTab === 'info' ? 'active' : ''}
                  onClick={() => setActiveTab('info')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person me-1"></i>
                  Información
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'history' ? 'active' : ''}
                  onClick={() => setActiveTab('history')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-journal-text me-1"></i>
                  Historial de Clases
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'progress' ? 'active' : ''}
                  onClick={() => setActiveTab('progress')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-graph-up me-1"></i>
                  Progreso en Programas
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'enrolled' ? 'active' : ''}
                  onClick={() => setActiveTab('enrolled')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-book me-1"></i>
                  Clases Actuales
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab}>
              {/* Info Tab */}
              <TabPane tabId="info">
                <Row>
                  {/* Photo Column */}
                  <Col md={3} className="text-center mb-3">
                    <div className="position-relative d-inline-block">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="rounded-circle border"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center"
                          style={{ width: '150px', height: '150px' }}
                        >
                          <i className="bi bi-person-fill text-white" style={{ fontSize: '4rem' }}></i>
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      
                      <Button
                        color="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <Spinner size="sm" />
                        ) : (
                          <i className="bi bi-camera"></i>
                        )}
                      </Button>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">ID: {currentUser.id.slice(0, 8)}...</small>
                    </div>
                  </Col>

                  {/* Form Column */}
                  <Col md={9}>
                    <div className="d-flex justify-content-end mb-3">
                      {!editMode ? (
                        <Button color="primary" size="sm" onClick={() => setEditMode(true)}>
                          <i className="bi bi-pencil me-1"></i>
                          Editar
                        </Button>
                      ) : (
                        <Button color="secondary" size="sm" onClick={() => {
                          setEditMode(false);
                          reset(formValues);
                        }}>
                          Cancelar
                        </Button>
                      )}
                    </div>

                    <Form key={currentUser?.id || 'new'} onSubmit={handleSubmit(onSubmit)}>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Nombre</Label>
                            <Input
                              {...firstNameField}
                              innerRef={firstNameRef}
                              invalid={!!errors.firstName}
                              disabled={!editMode}
                            />
                            <FormFeedback>{errors.firstName?.message}</FormFeedback>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Apellido</Label>
                            <Input
                              {...lastNameField}
                              innerRef={lastNameRef}
                              invalid={!!errors.lastName}
                              disabled={!editMode}
                            />
                            <FormFeedback>{errors.lastName?.message}</FormFeedback>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Teléfono</Label>
                            <Input
                              {...phoneField}
                              innerRef={phoneRef}
                              invalid={!!errors.phone}
                              disabled={!editMode}
                            />
                            <FormFeedback>{errors.phone?.message}</FormFeedback>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Email</Label>
                            <Input
                              {...emailField}
                              innerRef={emailRef}
                              invalid={!!errors.email}
                              disabled={!editMode}
                            />
                            <FormFeedback>{String(errors.email?.message || '')}</FormFeedback>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Rol</Label>
                            <Input
                              type="select"
                              {...roleField}
                              innerRef={roleRef}
                              disabled={!editMode}
                            >
                              <option value="student">Estudiante</option>
                              <option value="teacher">Profesor</option>
                              <option value="admin">Administrador</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup check className="mt-4">
                            <Input
                              type="checkbox"
                              {...isTeacherField}
                              innerRef={isTeacherRef}
                              disabled={!editMode}
                            />
                            <Label check>Es Profesor</Label>
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup check className="mt-4">
                            <Input
                              type="checkbox"
                              {...isActiveField}
                              innerRef={isActiveRef}
                              disabled={!editMode}
                            />
                            <Label check>Activo</Label>
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Extended Registration Fields */}
                      <hr className="my-3" />
                      <h6 className="text-muted mb-3">Información Adicional</h6>
                      <Row>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Tipo de Documento</Label>
                            <Input
                              type="select"
                              {...documentTypeField}
                              innerRef={documentTypeRef}
                              disabled={!editMode}
                            >
                              <option value="">Seleccionar...</option>
                              {DOCUMENT_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Número de Documento</Label>
                            <Input
                              {...documentNumberField}
                              innerRef={documentNumberRef}
                              disabled={!editMode}
                              placeholder="000-0000000-0"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label>País</Label>
                            <Input
                              type="select"
                              {...countryField}
                              innerRef={countryRef}
                              disabled={!editMode}
                            >
                              <option value="">Seleccionar...</option>
                              {COUNTRIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Iglesia</Label>
                            <Input
                              {...churchNameField}
                              innerRef={churchNameRef}
                              disabled={!editMode}
                              placeholder="Nombre de la iglesia"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Nivel Académico</Label>
                            <Input
                              type="select"
                              {...academicLevelField}
                              innerRef={academicLevelRef}
                              disabled={!editMode}
                            >
                              <option value="">Seleccionar...</option>
                              {ACADEMIC_LEVEL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      {editMode && (
                        <>
                          <hr />
                          <Row>
                            <Col md={6}>
                              <FormGroup>
                                <Label>Nueva Contraseña (dejar vacío para no cambiar)</Label>
                                <Input
                                  type="password"
                                  {...passwordField}
                                  innerRef={passwordRef}
                                  invalid={!!errors.password}
                                  placeholder="••••••"
                                />
                                <FormFeedback>{String(errors.password?.message || '')}</FormFeedback>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Button
                            type="submit"
                            color="success"
                            disabled={saving || !isDirty}
                          >
                            {saving ? <Spinner size="sm" /> : <i className="bi bi-check me-1"></i>}
                            Guardar Cambios
                          </Button>
                        </>
                      )}
                    </Form>
                  </Col>
                </Row>
              </TabPane>

              {/* History Tab */}
              <TabPane tabId="history">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Historial de Clases Completadas</h6>
                  <Button color="success" size="sm" onClick={startAddHistory} disabled={addingHistory}>
                    <i className="bi bi-plus me-1"></i>
                    Agregar Clase
                  </Button>
                </div>

                {/* Add/Edit Form */}
                {(addingHistory || editingHistory) && (
                  <Card className="mb-3 bg-light">
                    <CardBody>
                      <h6>{editingHistory ? 'Editar Clase' : 'Agregar Clase al Historial'}</h6>
                      <Row>
                        <Col md={4}>
                          <FormGroup>
                            <Label>Clase</Label>
                            <Input
                              type="select"
                              value={historyForm.classroomId}
                              onChange={e => setHistoryForm(prev => ({ ...prev, classroomId: e.target.value }))}
                              disabled={!!editingHistory}
                            >
                              <option value="">Seleccionar...</option>
                              {programs.map(program => {
                                // Get history classroom IDs
                                const historyClassroomIds = new Set(
                                  (currentUser?.completedClassrooms || []).map(h => h.classroomId)
                                );
                                // Filter out classrooms already in history (unless editing)
                                const availableClassrooms = classrooms
                                  .filter(c => c.programId === program.id)
                                  .filter(c => editingHistory || !historyClassroomIds.has(c.id));
                                
                                if (availableClassrooms.length === 0) return null;
                                
                                return (
                                  <optgroup key={program.id} label={program.name}>
                                    {availableClassrooms.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </optgroup>
                                );
                              })}
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label>Fecha Inscripción</Label>
                            <Input
                              type="date"
                              value={historyForm.enrollmentDate}
                              onChange={e => setHistoryForm(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label>Fecha Finalización</Label>
                            <Input
                              type="date"
                              value={historyForm.completionDate}
                              onChange={e => setHistoryForm(prev => ({ ...prev, completionDate: e.target.value }))}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label>Calificación</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={historyForm.finalGrade}
                              onChange={e => setHistoryForm(prev => ({ ...prev, finalGrade: Number(e.target.value) }))}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={2}>
                          <FormGroup>
                            <Label>Estado</Label>
                            <Input
                              type="select"
                              value={historyForm.status}
                              onChange={e => setHistoryForm(prev => ({ ...prev, status: e.target.value as any }))}
                            >
                              <option value="completed">Completado</option>
                              <option value="dropped">Retirado</option>
                              <option value="failed">Reprobado</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>
                      <div className="d-flex gap-2">
                        <Button color="success" size="sm" onClick={saveHistoryEntry} disabled={saving || !historyForm.classroomId}>
                          {saving ? <Spinner size="sm" /> : <i className="bi bi-check me-1"></i>}
                          Guardar
                        </Button>
                        <Button color="secondary" size="sm" onClick={cancelHistoryEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* History Table */}
                {(currentUser.completedClassrooms?.length || 0) > 0 ? (
                  <Table size="sm" bordered striped hover>
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Programa</th>
                        <th>Inscripción</th>
                        <th>Finalización</th>
                        <th>Calificación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUser.completedClassrooms?.map((entry, idx) => (
                        <tr key={idx}>
                          <td>{entry.classroomName}</td>
                          <td><small className="text-muted">{entry.programName}</small></td>
                          <td>{new Date(entry.enrollmentDate).toLocaleDateString()}</td>
                          <td>{new Date(entry.completionDate).toLocaleDateString()}</td>
                          <td>
                            {entry.finalGrade !== undefined && (
                              <Badge color={getGradeColor(entry.finalGrade)}>
                                {entry.finalGrade}%
                              </Badge>
                            )}
                          </td>
                          <td>{getStatusBadge(entry.status)}</td>
                          <td>
                            <Button
                              color="link"
                              size="sm"
                              className="p-0 me-2"
                              onClick={() => startEditHistory(entry)}
                            >
                              <i className="bi bi-pencil text-primary"></i>
                            </Button>
                            <Button
                              color="link"
                              size="sm"
                              className="p-0"
                              onClick={() => deleteHistoryEntry(entry.classroomId)}
                            >
                              <i className="bi bi-trash text-danger"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert color="info">No hay clases en el historial</Alert>
                )}
              </TabPane>

              {/* Progress Tab */}
              <TabPane tabId="progress">
                {loadingProgress ? (
                  <div className="text-center py-4">
                    <Spinner color="primary" />
                    <p className="mt-2">Calculando progreso...</p>
                  </div>
                ) : programProgress.length > 0 ? (
                  <Row>
                    {programProgress.map((prog: ProgramProgress) => (
                      <Col md={6} key={prog.program.id} className="mb-3">
                        <Card>
                          <CardBody>
                            <h6 className="mb-3">
                              <i className="bi bi-journal-bookmark me-2"></i>
                              {prog.program.name}
                            </h6>
                            
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <small>Progreso: {prog.completedClassrooms}/{prog.totalClassrooms} clases</small>
                                <small className="fw-bold">{prog.progressPercentage}%</small>
                              </div>
                              <Progress
                                value={prog.progressPercentage}
                                color={prog.progressPercentage === 100 ? 'success' : 'primary'}
                              />
                            </div>

                            {prog.averageGrade > 0 && (
                              <div className="mb-3">
                                <Badge color={getGradeColor(prog.averageGrade)} className="me-2">
                                  Promedio: {prog.averageGrade}%
                                </Badge>
                                {prog.enrolledClassrooms > 0 && (
                                  <Badge color="info">
                                    {prog.enrolledClassrooms} en curso
                                  </Badge>
                                )}
                              </div>
                            )}

                            <details>
                              <summary className="text-muted small mb-2" style={{ cursor: 'pointer' }}>
                                Ver detalle de clases
                              </summary>
                              <Table size="sm" borderless className="mb-0">
                                <tbody>
                                  {prog.classroomDetails.map((detail, idx) => (
                                    <tr key={idx}>
                                      <td className="ps-0">
                                        {detail.status === 'completed' && <i className="bi bi-check-circle text-success me-1"></i>}
                                        {detail.status === 'enrolled' && <i className="bi bi-play-circle text-primary me-1"></i>}
                                        {detail.status === 'not-started' && <i className="bi bi-circle text-muted me-1"></i>}
                                        <small>{detail.classroom.name}</small>
                                      </td>
                                      <td className="text-end pe-0">
                                        {detail.finalGrade !== undefined && (
                                          <Badge color={getGradeColor(detail.finalGrade)} size="sm">
                                            {detail.finalGrade}%
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </details>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Alert color="info">
                    No hay progreso en programas registrado
                  </Alert>
                )}
              </TabPane>

              {/* Currently Enrolled Tab */}
              <TabPane tabId="enrolled">
                <h6 className="mb-3">Clases en las que está inscrito actualmente</h6>
                {(currentUser.enrolledClassrooms?.length || 0) > 0 ? (
                  <Table size="sm" bordered striped>
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Programa</th>
                        <th>Profesor</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUser.enrolledClassrooms?.map(classroomId => {
                        const classroom = classrooms.find(c => c.id === classroomId);
                        const program = programs.find(p => p.id === classroom?.programId);
                        return classroom ? (
                          <tr key={classroomId}>
                            <td>{classroom.name}</td>
                            <td><small className="text-muted">{program?.name || '-'}</small></td>
                            <td><small>-</small></td>
                            <td>
                              <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                                {classroom.isActive ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </td>
                          </tr>
                        ) : null;
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <Alert color="info">No está inscrito en ninguna clase actualmente</Alert>
                )}

                {currentUser.isTeacher && (
                  <>
                    <h6 className="mb-3 mt-4">Clases que imparte como profesor</h6>
                    {(currentUser.teachingClassrooms?.length || 0) > 0 ? (
                      <Table size="sm" bordered striped>
                        <thead>
                          <tr>
                            <th>Clase</th>
                            <th>Programa</th>
                            <th>Estudiantes</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentUser.teachingClassrooms?.map(classroomId => {
                            const classroom = classrooms.find(c => c.id === classroomId);
                            const program = programs.find(p => p.id === classroom?.programId);
                            return classroom ? (
                              <tr key={classroomId}>
                                <td>{classroom.name}</td>
                                <td><small className="text-muted">{program?.name || '-'}</small></td>
                                <td>{classroom.studentIds?.length || 0}</td>
                                <td>
                                  <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                                    {classroom.isActive ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </td>
                              </tr>
                            ) : null;
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert color="info">No imparte ninguna clase actualmente</Alert>
                    )}
                  </>
                )}
              </TabPane>
            </TabContent>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {user && (
          <UserProfilePdfDownloadButton user={user}>
            <Button color="outline-primary" size="sm" tag="span">
              <i className="bi bi-file-earmark-pdf me-2"></i>
              Descargar PDF
            </Button>
          </UserProfilePdfDownloadButton>
        )}
        <Button color="secondary" onClick={toggle}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UserDetailModal;
