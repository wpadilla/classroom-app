// Universal User Profile — Mobile-First Redesign
// Sections page (iOS Settings style) with profile sharing feature

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Badge,
  Spinner,
  Progress,
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { ClassroomRestartService } from '../../services/classroom/classroom-restart.service';
import { IUser, IClassroom, IStudentEvaluation, IClassroomHistory, UserRole, IClassroomRun } from '../../models';
import { userSelfEditSchema, UserSelfEditFormData } from '../../schemas/user.schema';
import { toast } from 'react-toastify';
import ProgramsProgressTab from './components/ProgramsProgressTab';
import { useProgramProgress } from '../../hooks/useProgramProgress';
import { UserProfilePdfDownloadButton } from '../../components/pdf/components/UserProfilePdfDownloadButton';
import UserDocumentsSection from '../../components/user-documents/UserDocumentsSection';
import ClassroomRunDetailsModal from '../../components/classroom-runs/ClassroomRunDetailsModal';
import ProfileShareCard from '../../components/student/ProfileShareCard';
import SectionHeader from '../../components/student/SectionHeader';
import GradeRing from '../../components/student/GradeRing';
import { BottomDrawer } from '../../components/mobile/BottomDrawer';
import {
  DOCUMENT_TYPE_OPTIONS,
  ACADEMIC_LEVEL_OPTIONS,
  COUNTRIES,
} from '../../constants/registration.constants';
import { DocumentType, AcademicLevel } from '../../models/registration.model';

const UserProfile: React.FC = () => {
  const { user, updatePassword, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState<IUser | null>(null);
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<IClassroom[]>([]);
  const [teachingClassrooms, setTeachingClassrooms] = useState<IClassroom[]>([]);
  const [evaluations, setEvaluations] = useState<IStudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherRuns, setTeacherRuns] = useState<IClassroomRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<IClassroomRun | null>(null);
  const [runDetailsModal, setRunDetailsModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(false);

  // Modal/drawer states
  const [passwordModal, setPasswordModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const defaultFormValues = useMemo<UserSelfEditFormData>(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserSelfEditFormData>({
    resolver: zodResolver(userSelfEditSchema),
    defaultValues: defaultFormValues,
  });

  const { ref: firstNameRef, ...firstNameField } = register('firstName');
  const { ref: lastNameRef, ...lastNameField } = register('lastName');
  const { ref: phoneRef, ...phoneField } = register('phone');
  const { ref: emailRef, ...emailField } = register('email');
  const { ref: documentTypeRef, ...documentTypeField } = register('documentType');
  const { ref: documentNumberRef, ...documentNumberField } = register('documentNumber');
  const { ref: countryRef, ...countryField } = register('country');
  const { ref: churchNameRef, ...churchNameField } = register('churchName');
  const { ref: academicLevelRef, ...academicLevelField } = register('academicLevel');
  const { ref: pastorNameRef, ...pastorNameField } = register('pastorName');
  const { ref: pastorPhoneRef, ...pastorPhoneField } = register('pastorPhone');

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const userProfile = await UserService.getUserById(user.id);
      if (userProfile) {
        setProfile(userProfile);
        reset({
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          email: userProfile.email || '',
          phone: userProfile.phone,
          documentType: userProfile.documentType || '',
          documentNumber: userProfile.documentNumber || '',
          country: userProfile.country || 'DO',
          churchName: userProfile.churchName || '',
          academicLevel: userProfile.academicLevel || '',
          pastorName: userProfile.pastor?.fullName || '',
          pastorPhone: userProfile.pastor?.phone || '',
        });

        // Parallel data loading
        const promises: Promise<any>[] = [
          EvaluationService.getStudentEvaluations(user.id),
        ];

        if (userProfile.enrolledClassrooms?.length) {
          promises.push(
            Promise.all(
              userProfile.enrolledClassrooms.map((id) => ClassroomService.getClassroomById(id))
            )
          );
        }

        if (userProfile.teachingClassrooms?.length) {
          promises.push(
            Promise.all(
              userProfile.teachingClassrooms.map((id) => ClassroomService.getClassroomById(id))
            )
          );
        }

        if (userProfile.isTeacher || userProfile.role === 'teacher' || userProfile.role === 'admin') {
          promises.push(ClassroomRestartService.getTeacherRuns(user.id));
        }

        const results = await Promise.all(promises);

        setEvaluations(results[0] || []);

        let resultIdx = 1;
        if (userProfile.enrolledClassrooms?.length) {
          setEnrolledClassrooms(
            (results[resultIdx] || []).filter((c: any) => c !== null)
          );
          resultIdx++;
        }
        if (userProfile.teachingClassrooms?.length) {
          setTeachingClassrooms(
            (results[resultIdx] || []).filter((c: any) => c !== null)
          );
          resultIdx++;
        }
        if (userProfile.isTeacher || userProfile.role === 'teacher' || userProfile.role === 'admin') {
          setTeacherRuns(results[resultIdx] || []);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [reset, user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Handlers (kept from original)
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const success = await updatePassword(newPassword);
    if (success) {
      setPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione una imagen válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPhotoModal(true);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !user) return;
    try {
      setUploadingPhoto(true);
      const photoUrl = await UserService.updateProfilePhoto(user.id, selectedPhoto);
      if (profile) setProfile({ ...profile, profilePhoto: photoUrl });
      await refreshUser();
      toast.success('Foto de perfil actualizada');
      setPhotoModal(false);
      setSelectedPhoto(null);
      setPhotoPreview('');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email || '',
      phone: profile.phone,
      documentType: profile.documentType || '',
      documentNumber: profile.documentNumber || '',
      country: profile.country || 'DO',
      churchName: profile.churchName || '',
      academicLevel: profile.academicLevel || '',
      pastorName: profile.pastor?.fullName || '',
      pastorPhone: profile.pastor?.phone || '',
    });
    setEditDrawer(false);
  };

  const handleProfileSave = async (data: UserSelfEditFormData) => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const updates: Partial<IUser> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
        documentType: (data.documentType || undefined) as DocumentType,
        documentNumber: data.documentNumber || undefined,
        country: data.country || undefined,
        churchName: data.churchName || undefined,
        academicLevel: (data.academicLevel || undefined) as AcademicLevel,
        pastor:
          data.pastorName || data.pastorPhone
            ? { fullName: data.pastorName || '', phone: data.pastorPhone || '' }
            : undefined,
      };
      await UserService.updateUser(profile.id, updates);
      const nextProfile = { ...profile, ...updates } as IUser;
      setProfile(nextProfile);
      await refreshUser();
      toast.success('Perfil actualizado');
      setEditDrawer(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShareProfile = async () => {
    if (!shareCardRef.current || !profile) return;
    try {
      setSharingProfile(true);

      // Temporarily make visible for capture
      const el = shareCardRef.current;
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = '-1';
      el.style.opacity = '1';

      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(el, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#1e3a8a',
      });

      // Restore hidden
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      el.style.zIndex = '';
      el.style.opacity = '';

      if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'perfil-amoa.png', { type: 'image/png' });
        await navigator.share({ title: 'Mi Perfil — AMOA', files: [file] });
      } else {
        const link = document.createElement('a');
        link.download = 'perfil-amoa.png';
        link.href = dataUrl;
        link.click();
      }
      toast.success('Perfil compartido');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing profile:', error);
        toast.error('Error al compartir el perfil');
      }
    } finally {
      setSharingProfile(false);
    }
  };

  const calculateOverallGrade = (): number => {
    if (evaluations.length === 0) return 0;
    const completedEvaluations = evaluations.filter((e) => e.status === 'evaluated');
    if (completedEvaluations.length === 0) return 0;
    const totalPercentage = completedEvaluations.reduce((sum, e) => sum + e.percentage, 0);
    return totalPercentage / completedEvaluations.length;
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700';
      case 'teacher': return 'bg-blue-50 text-blue-700';
      case 'student': return 'bg-indigo-50 text-indigo-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'danger';
  };

  const { overallStats: hookStats, calculateProgress } = useProgramProgress();

  useEffect(() => {
    if (profile) {
      calculateProgress(profile);
    }
  }, [profile, calculateProgress]);

  // Share card stats
  const shareStats = useMemo(
    () => ({
      averageGrade: calculateOverallGrade(),
      totalClasses:
        (profile?.completedClassrooms?.length || 0) + enrolledClassrooms.length,
      completedPrograms: hookStats.completedPrograms, // Obtenido desde useProgramProgress (100% de progreso)
      currentEnrollments: enrolledClassrooms.length,
      attendanceRate: (() => {
        let present = 0,
          total = 0;
        evaluations.forEach((e) => {
          if (e.attendanceRecords) {
            present += e.attendanceRecords.filter((r) => r.isPresent).length;
            total += e.attendanceRecords.length;
          }
        });
        return total > 0 ? (present / total) * 100 : 0;
      })(),
    }),
    [evaluations, enrolledClassrooms, profile]
  );

  if (loading) {
    return (
      <div className="px-1 py-4 animate-pulse space-y-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-8 text-center">
        <i className="bi bi-exclamation-triangle text-red-400 text-4xl mb-3 block" />
        <p className="text-red-600 font-medium">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="pb-6 -mx-3 -my-6">
      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-800 px-5 pt-6 pb-8 rounded-b-[28px] shadow-lg"
      >
        {/* Photo + Name */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative mb-3">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/10">
                <i className="bi bi-person-fill text-white text-4xl" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-0 active:scale-95 transition-transform"
            >
              <i className="bi bi-camera-fill text-blue-600 text-sm" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          <h1 className="text-white text-xl font-bold text-center">
            {profile.firstName} {profile.lastName}
          </h1>

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white`}>
              {getRoleLabel(profile.role)}
            </span>
            {profile.isTeacher && profile.role !== 'teacher' && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-400/30 text-blue-100">
                También Profesor
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                profile.isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'
              }`}
            >
              {profile.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Stat chips row */}
        {evaluations.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className="text-white text-lg font-bold">
                {calculateOverallGrade().toFixed(0)}%
              </div>
              <div className="text-blue-200 text-[10px]">Promedio</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className="text-white text-lg font-bold">
                {enrolledClassrooms.length}
              </div>
              <div className="text-blue-200 text-[10px]">Inscritas</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className="text-white text-lg font-bold">
                {profile.completedClassrooms?.length || 0}
              </div>
              <div className="text-blue-200 text-[10px]">Completadas</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions Row */}
      <div className="px-4 -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center justify-around">
          <button
            onClick={handleShareProfile}
            disabled={sharingProfile}
            className="flex flex-col items-center gap-1 bg-transparent border-0 active:opacity-70 disabled:opacity-40"
          >
            {sharingProfile ? (
              <i className="bi bi-hourglass-split text-blue-500 animate-spin" />
            ) : (
              <i className="bi bi-share text-blue-500" />
            )}
            <span className="text-[10px] text-gray-500 font-medium">Compartir</span>
          </button>

          <div className="w-px h-8 bg-gray-100" />

          <button
            onClick={() => setPasswordModal(true)}
            className="flex flex-col items-center gap-1 bg-transparent border-0 active:opacity-70"
          >
            <i className="bi bi-key text-amber-500" />
            <span className="text-[10px] text-gray-500 font-medium">Contraseña</span>
          </button>

          <div className="w-px h-8 bg-gray-100" />

          <UserProfilePdfDownloadButton user={profile}>
            <button className="flex flex-col items-center gap-1 bg-transparent border-0 active:opacity-70">
              <i className="bi bi-file-earmark-pdf text-red-500" />
              <span className="text-[10px] text-gray-500 font-medium">PDF</span>
            </button>
          </UserProfilePdfDownloadButton>

          <div className="w-px h-8 bg-gray-100" />

          <button
            onClick={() => {
              setEditDrawer(true);
              setEditMode(true);
            }}
            className="flex flex-col items-center gap-1 bg-transparent border-0 active:opacity-70"
          >
            <i className="bi bi-pencil text-emerald-500" />
            <span className="text-[10px] text-gray-500 font-medium">Editar</span>
          </button>
        </div>
      </div>

      <div className="px-4">
        {/* Personal Info — Read-only section */}
        <SectionHeader icon="bi-person" title="Información Personal" defaultOpen={true}>
          <div className="space-y-3">
            {[
              { label: 'Teléfono', value: profile.phone, icon: 'bi-telephone' },
              { label: 'Correo', value: profile.email || 'No registrado', icon: 'bi-envelope' },
              { label: 'Documento', value: profile.documentNumber || 'No registrado', icon: 'bi-card-text' },
              { label: 'País', value: profile.country || 'No registrado', icon: 'bi-globe' },
              { label: 'Iglesia', value: profile.churchName || 'No registrado', icon: 'bi-building' },
              { label: 'Nivel Académico', value: profile.academicLevel || 'No registrado', icon: 'bi-mortarboard' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <i className={`bi ${item.icon} text-gray-400 text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400">{item.label}</div>
                  <div className="text-sm font-medium text-gray-700 truncate">{item.value}</div>
                </div>
              </div>
            ))}

            {/* Pastor info */}
            {(profile.pastor?.fullName || profile.pastor?.phone) && (
              <div className="bg-gray-50 rounded-xl p-3 mt-2">
                <div className="text-[11px] text-gray-400 mb-1.5 font-medium">Información del Pastor</div>
                <div className="text-sm text-gray-700">
                  {profile.pastor.fullName || 'No registrado'}
                </div>
                {profile.pastor.phone && (
                  <div className="text-xs text-gray-500 mt-0.5">{profile.pastor.phone}</div>
                )}
              </div>
            )}
          </div>
        </SectionHeader>

        {/* Enrolled Classes (students) */}
        {(profile.role === 'student' || enrolledClassrooms.length > 0) && (
          <SectionHeader
            icon="bi-book"
            title="Clases Inscritas"
            badge={enrolledClassrooms.length}
            defaultOpen={enrolledClassrooms.length > 0}
          >
            {enrolledClassrooms.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-book text-gray-300 text-2xl mb-2 block" />
                <p className="text-gray-400 text-sm">No está inscrito en ninguna clase</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {enrolledClassrooms.map((classroom) => {
                  const evaluation = evaluations.find((e) => e.classroomId === classroom.id);
                  return (
                    <div
                      key={classroom.id}
                      className="shrink-0 w-[220px] bg-white rounded-xl border border-gray-100 shadow-sm p-3"
                    >
                      <div className="text-sm font-bold text-gray-900 truncate mb-0.5">
                        {classroom.subject}
                      </div>
                      <div className="text-xs text-gray-400 mb-2 truncate">{classroom.name}</div>
                      {evaluation && (
                        <div className="flex items-center gap-3">
                          <GradeRing value={evaluation.percentage || 0} size={32} strokeWidth={3} />
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">
                              {(evaluation.percentage || 0).toFixed(0)}%
                            </span>{' '}
                            promedio
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionHeader>
        )}

        {/* Teaching Classes (teachers/admins) */}
        {(profile.role === 'teacher' || profile.role === 'admin' || profile.isTeacher) && (
          <SectionHeader
            icon="bi-easel"
            title="Clases Actuales"
            badge={teachingClassrooms.length}
            defaultOpen={false}
          >
            {teachingClassrooms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No tiene clases asignadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teachingClassrooms.map((classroom) => {
                  const completedModules = classroom.modules?.filter((m) => m.isCompleted).length || 0;
                  const totalModules = classroom.modules?.length || 0;
                  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

                  return (
                    <div
                      key={classroom.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">
                            {classroom.subject}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{classroom.name}</div>
                        </div>
                        <Badge
                          color={classroom.isActive ? 'success' : 'secondary'}
                          className="shrink-0"
                        >
                          {classroom.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>
                          <i className="bi bi-people me-1" />
                          {classroom.studentIds?.length || 0}
                        </span>
                        <span>
                          <i className="bi bi-journal me-1" />
                          {completedModules}/{totalModules}
                        </span>
                        {classroom.schedule && (
                          <span>
                            <i className="bi bi-clock me-1" />
                            {classroom.schedule.dayOfWeek} {classroom.schedule.time}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={progress}
                          color={progress >= 75 ? 'success' : progress >= 50 ? 'warning' : 'danger'}
                          style={{ height: '4px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionHeader>
        )}

        {/* Teacher Runs History */}
        {(profile.role === 'teacher' || profile.role === 'admin' || profile.isTeacher) &&
          teacherRuns.length > 0 && (
            <SectionHeader
              icon="bi-archive"
              title="Historial de Ejecuciones"
              badge={teacherRuns.length}
              defaultOpen={false}
            >
              <div className="space-y-2">
                {teacherRuns.map((run) => {
                  const passedStudents =
                    run.statistics.distribution.excellent +
                    run.statistics.distribution.good +
                    run.statistics.distribution.regular;

                  return (
                    <button
                      key={run.id}
                      onClick={() => {
                        setSelectedRun(run);
                        setRunDetailsModal(true);
                      }}
                      className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-left active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                              #{run.runNumber}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {run.classroomSubject}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{run.programName}</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-sm font-bold text-gray-700">
                            {run.statistics.averageGrade.toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {passedStudents}/{run.totalStudents}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionHeader>
          )}

        {/* History */}
        <SectionHeader
          icon="bi-clock-history"
          title="Historial"
          badge={
            (profile.completedClassrooms?.length || 0) + (profile.taughtClassrooms?.length || 0)
          }
          defaultOpen={false}
        >
          {(() => {
            const studentHistory = profile.completedClassrooms || [];
            const teacherHistory = profile.taughtClassrooms || [];
            const combinedHistory = [...studentHistory, ...teacherHistory].sort(
              (a, b) =>
                new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
            );

            if (combinedHistory.length === 0) {
              return (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No hay historial</p>
                </div>
              );
            }

            return (
              <div className="relative ml-3">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                {combinedHistory.map((history, index) => (
                  <div
                    key={`${history.classroomId}-${history.role}-${index}`}
                    className="relative flex items-start gap-3 pb-4 last:pb-0"
                  >
                    <div
                      className={`relative z-10 w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${
                        history.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : history.status === 'dropped'
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-red-500 border-red-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {history.classroomName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            history.role === 'teacher'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {history.role === 'teacher' ? 'Prof.' : 'Est.'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {history.programName} ·{' '}
                        {new Date(history.completionDate).toLocaleDateString('es-ES', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {history.role === 'student' && history.finalGrade !== undefined && (
                        <div className="mt-1">
                          <GradeRing value={history.finalGrade} size={28} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionHeader>

        {/* Documents */}
        <SectionHeader icon="bi-folder2-open" title="Documentos" defaultOpen={false}>
          <UserDocumentsSection documents={profile.documents || []} canManage={false} />
        </SectionHeader>

        {/* Programs Progress */}
        <SectionHeader icon="bi-graph-up" title="Progreso en Programas" defaultOpen={false}>
          <ProgramsProgressTab user={profile} showDetails={true} compact={false} />
        </SectionHeader>
      </div>

      {/* Profile Share Card (off-screen) */}
      {profile && <ProfileShareCard ref={shareCardRef} user={profile} stats={shareStats} />}

      {/* Edit Profile Bottom Drawer */}
      <BottomDrawer
        isOpen={editDrawer}
        onClose={handleCancelEdit}
        title="Editar Perfil"
        height="full"
      >
        <div className="p-4">
          <Form onSubmit={handleSubmit(handleProfileSave)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label className="text-xs text-gray-500">Nombre</Label>
                  <Input {...firstNameField} innerRef={firstNameRef} invalid={!!errors.firstName} />
                  <FormFeedback>{errors.firstName?.message}</FormFeedback>
                </FormGroup>
                <FormGroup>
                  <Label className="text-xs text-gray-500">Apellido</Label>
                  <Input {...lastNameField} innerRef={lastNameRef} invalid={!!errors.lastName} />
                  <FormFeedback>{errors.lastName?.message}</FormFeedback>
                </FormGroup>
              </div>

              <FormGroup>
                <Label className="text-xs text-gray-500">Teléfono</Label>
                <Input {...phoneField} innerRef={phoneRef} invalid={!!errors.phone} />
                <FormFeedback>{errors.phone?.message}</FormFeedback>
              </FormGroup>

              <FormGroup>
                <Label className="text-xs text-gray-500">Correo Electrónico</Label>
                <Input {...emailField} innerRef={emailRef} invalid={!!errors.email} />
                <FormFeedback>{String(errors.email?.message || '')}</FormFeedback>
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label className="text-xs text-gray-500">Tipo Documento</Label>
                  <Input type="select" {...documentTypeField} innerRef={documentTypeRef}>
                    <option value="">Seleccionar...</option>
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label className="text-xs text-gray-500">Nro. Documento</Label>
                  <Input
                    {...documentNumberField}
                    innerRef={documentNumberRef}
                    placeholder="000-0000000-0"
                  />
                </FormGroup>
              </div>

              <FormGroup>
                <Label className="text-xs text-gray-500">País</Label>
                <Input type="select" {...countryField} innerRef={countryRef}>
                  <option value="">Seleccionar...</option>
                  {COUNTRIES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label className="text-xs text-gray-500">Iglesia</Label>
                <Input {...churchNameField} innerRef={churchNameRef} placeholder="Nombre de la iglesia" />
              </FormGroup>

              <FormGroup>
                <Label className="text-xs text-gray-500">Nivel Académico</Label>
                <Input type="select" {...academicLevelField} innerRef={academicLevelRef}>
                  <option value="">Seleccionar...</option>
                  {ACADEMIC_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Input>
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label className="text-xs text-gray-500">Pastor</Label>
                  <Input {...pastorNameField} innerRef={pastorNameRef} placeholder="Nombre" />
                </FormGroup>
                <FormGroup>
                  <Label className="text-xs text-gray-500">Tel. Pastor</Label>
                  <Input
                    {...pastorPhoneField}
                    innerRef={pastorPhoneRef}
                    invalid={!!errors.pastorPhone}
                    placeholder="Teléfono"
                  />
                  <FormFeedback>{errors.pastorPhone?.message}</FormFeedback>
                </FormGroup>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pb-4">
              <Button color="secondary" className="flex-1" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button
                color="primary"
                className="flex-1"
                type="submit"
                disabled={savingProfile || !isDirty}
              >
                {savingProfile ? <Spinner size="sm" className="me-1" /> : null}
                Guardar
              </Button>
            </div>
          </Form>
        </div>
      </BottomDrawer>

      {/* Password Change Modal */}
      <Modal isOpen={passwordModal} toggle={() => setPasswordModal(false)}>
        <ModalHeader toggle={() => setPasswordModal(false)}>Cambiar Contraseña</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="newPassword">Nueva Contraseña</Label>
              <Input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </FormGroup>
            <FormGroup>
              <Label for="confirmPassword">Confirmar Contraseña</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPasswordModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handlePasswordChange}>
            Cambiar Contraseña
          </Button>
        </ModalFooter>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal isOpen={photoModal} toggle={() => setPhotoModal(false)}>
        <ModalHeader toggle={() => setPhotoModal(false)}>
          Actualizar Foto de Perfil
        </ModalHeader>
        <ModalBody className="text-center">
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="img-fluid rounded" style={{ maxHeight: '300px' }} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPhotoModal(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handlePhotoUpload} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <>
                <Spinner size="sm" className="me-2" />
                Subiendo...
              </>
            ) : (
              'Actualizar Foto'
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <ClassroomRunDetailsModal
        isOpen={runDetailsModal}
        onClose={() => setRunDetailsModal(false)}
        run={selectedRun}
      />
    </div>
  );
};

export default UserProfile;
