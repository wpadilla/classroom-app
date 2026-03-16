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
  Badge,
  Spinner,
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IUser, IClassroomHistory, IClassroom, IProgram, IUserDocument } from '../../../models';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/user/user.service';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { ProgramService } from '../../../services/program/program.service';
import { GCloudService } from '../../../services/gcloud/gcloud.service';
import { userEditSchema, UserEditFormData } from '../../../schemas/user.schema';
import { useProgramProgress } from '../../../hooks/useProgramProgress';
import { toast } from 'react-toastify';
import { UserProfilePdfDownloadButton } from '../../../components/pdf/components/UserProfilePdfDownloadButton';
import { validateFileSize } from '../../../utils/fileUtils';
import InfoTab from './user-detail/InfoTab';
import HistoryTab from './user-detail/HistoryTab';
import ProgressTab from './user-detail/ProgressTab';
import EnrolledTab from './user-detail/EnrolledTab';
import DocumentsTab from './user-detail/DocumentsTab';
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
  const { user: authUser } = useAuth();
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

  const [documents, setDocuments] = useState<IUserDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const canManageDocuments = authUser?.role === 'admin' || authUser?.role === 'teacher';

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
      pastorName: '',
      pastorPhone: '',
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
            pastorName: currentUser.pastor?.fullName || '',
            pastorPhone: currentUser.pastor?.phone || '',
          }
        : defaultFormValues,
    [currentUser, defaultFormValues]
  );

  // Form
  const {
    register,
    handleSubmit,
    reset,
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
  const { ref: pastorNameRef, ...pastorNameField } = register('pastorName');
  const { ref: pastorPhoneRef, ...pastorPhoneField } = register('pastorPhone');
  const { ref: passwordRef, ...passwordField } = register('password');

  const handleStartEdit = () => setEditMode(true);
  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    reset(formValues);
  }, [formValues, reset]);

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
        pastorName: targetUser.pastor?.fullName || '',
        pastorPhone: targetUser.pastor?.phone || '',
      });
    },
    [reset]
  );

  // Load data on open
  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Fetch fresh user data
      const freshUser = await UserService.getUserById(userId);
      if (freshUser) {
        setCurrentUser(freshUser);
        resetForm(freshUser);
        setDocuments(freshUser.documents || []);
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
  }, [calculateProgress, resetForm]);

  useEffect(() => {
    if (isOpen && user) {
      setCurrentUser(user);
      resetForm(user);
      setDocuments(user.documents || []);
      setPhotoPreview(user.profilePhoto || '');
      void loadData(user.id);
    } else if (!isOpen) {
      setCurrentUser(null);
      setDocuments([]);
      setEditMode(mode === 'edit');
      setActiveTab('info');
    }
  }, [isOpen, loadData, mode, resetForm, user]);

  const getFilenameFromUrl = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  };

  const handleUploadDocument = async (file: File) => {
    if (!currentUser) return;

    if (!validateFileSize(file, 50)) {
      toast.error('El documento no debe superar los 50MB');
      return;
    }

    setUploadingDocument(true);
    try {
      const url = await GCloudService.uploadFile(file, `user-${currentUser.id}`);
      const newDoc: IUserDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        url,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedBy: authUser?.id || currentUser.id,
        uploadedAt: new Date(),
      };

      const nextDocs = [...documents, newDoc];
      setDocuments(nextDocs);
      await UserService.updateUser(currentUser.id, { documents: nextDocs });
      toast.success('Documento subido exitosamente');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRenameDocument = async (doc: IUserDocument) => {
    if (!currentUser) return;
    const nextName = window.prompt('Nombre del documento', doc.name)?.trim();
    if (!nextName || nextName === doc.name) return;

    const nextDocs = documents.map(d =>
      d.id === doc.id ? { ...d, name: nextName, updatedAt: new Date() } : d
    );

    try {
      setDocuments(nextDocs);
      await UserService.updateUser(currentUser.id, { documents: nextDocs });
      toast.success('Documento actualizado');
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error('Error al actualizar el documento');
    }
  };

  const handleDeleteDocument = async (doc: IUserDocument) => {
    if (!currentUser) return;
    if (!window.confirm('¿Desea eliminar este documento?')) return;

    setDeletingDocumentId(doc.id);
    try {
      const nextDocs = documents.filter(d => d.id !== doc.id);
      setDocuments(nextDocs);
      await UserService.updateUser(currentUser.id, { documents: nextDocs });

      const filename = getFilenameFromUrl(doc.url);
      if (filename) {
        await GCloudService.deletePhoto(filename);
      }
      toast.success('Documento eliminado');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleDownloadDocument = (doc: IUserDocument) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
        pastor: data.pastorName || data.pastorPhone
          ? { fullName: data.pastorName || '', phone: data.pastorPhone || '' }
          : undefined,
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
              <NavItem>
                <NavLink
                  className={activeTab === 'documents' ? 'active' : ''}
                  onClick={() => setActiveTab('documents')}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-folder me-1"></i>
                  Documentos
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab}>
              <TabPane tabId="info">
                <InfoTab
                  currentUser={currentUser}
                  photoPreview={photoPreview}
                  uploadingPhoto={uploadingPhoto}
                  fileInputRef={fileInputRef}
                  onPhotoChange={handlePhotoChange}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  editMode={editMode}
                  onSubmit={onSubmit}
                  handleSubmit={handleSubmit}
                  errors={errors}
                  isDirty={isDirty}
                  saving={saving}
                  fields={{
                    firstNameField,
                    firstNameRef,
                    lastNameField,
                    lastNameRef,
                    phoneField,
                    phoneRef,
                    emailField,
                    emailRef,
                    roleField,
                    roleRef,
                    isTeacherField,
                    isTeacherRef,
                    isActiveField,
                    isActiveRef,
                    documentTypeField,
                    documentTypeRef,
                    documentNumberField,
                    documentNumberRef,
                    countryField,
                    countryRef,
                    churchNameField,
                    churchNameRef,
                    academicLevelField,
                    academicLevelRef,
                    pastorNameField,
                    pastorNameRef,
                    pastorPhoneField,
                    pastorPhoneRef,
                    passwordField,
                    passwordRef,
                  }}
                  documentTypeOptions={DOCUMENT_TYPE_OPTIONS}
                  academicLevelOptions={ACADEMIC_LEVEL_OPTIONS}
                  countries={COUNTRIES}
                />
              </TabPane>

              <TabPane tabId="history">
                <HistoryTab
                  currentUser={currentUser}
                  classrooms={classrooms}
                  programs={programs}
                  historyForm={historyForm}
                  setHistoryForm={setHistoryForm}
                  editingHistory={editingHistory}
                  addingHistory={addingHistory}
                  saving={saving}
                  startAddHistory={startAddHistory}
                  startEditHistory={startEditHistory}
                  cancelHistoryEdit={cancelHistoryEdit}
                  saveHistoryEntry={saveHistoryEntry}
                  deleteHistoryEntry={deleteHistoryEntry}
                  getGradeColor={getGradeColor}
                  getStatusBadge={getStatusBadge}
                />
              </TabPane>

              <TabPane tabId="progress">
                <ProgressTab
                  loading={loadingProgress}
                  programProgress={programProgress}
                  getGradeColor={getGradeColor}
                />
              </TabPane>

              <TabPane tabId="enrolled">
                <EnrolledTab
                  currentUser={currentUser}
                  classrooms={classrooms}
                  programs={programs}
                />
              </TabPane>

              <TabPane tabId="documents">
                <DocumentsTab
                  documents={documents}
                  canManage={!!canManageDocuments}
                  uploading={uploadingDocument}
                  deletingId={deletingDocumentId}
                  onUpload={handleUploadDocument}
                  onDelete={handleDeleteDocument}
                  onRename={handleRenameDocument}
                  onDownload={handleDownloadDocument}
                />
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
