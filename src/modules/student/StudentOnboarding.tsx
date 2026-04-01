import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Container, Button, Form, Spinner } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useForm, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { IClassroom } from '../../models';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/user.service';
import { ProgramService } from '../../services/program/program.service';
import { StudentOnboardingService } from '../../services/onboarding/student-onboarding.service';
import {
  studentOnboardingSchema,
  StudentOnboardingFormData,
} from '../../schemas/student-onboarding.schema';
import { PersonalInfoSection } from '../auth/components/PersonalInfoSection';
import { ChurchInfoSection } from '../auth/components/ChurchInfoSection';
import { AcademicInfoSection } from '../auth/components/AcademicInfoSection';
import InternalFormationClassStep from './components/InternalFormationClassStep';
import {
  getAcademicLevelLabel,
  getEnrollmentTypeLabel,
} from '../../constants/registration.constants';
import {
  INTERNAL_FORMATION_CHURCH,
  INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
} from '../../constants/onboarding.constants';
import {
  buildEnrollmentProgramOptions,
  IEnrollmentProgramOption,
  normalizeEnrollmentTypeValue,
} from '../../utils/programEnrollment';
import { isInternalFormationEnrollment } from '../../utils/onboarding';
import './StudentOnboarding.css';

type OnboardingStepId =
  | 'personal'
  | 'academic'
  | 'church'
  | 'completedHistory'
  | 'currentEnrollment'
  | 'review';

interface IOnboardingStep {
  id: OnboardingStepId;
  label: string;
  description: string;
  isComplete: boolean;
}

const defaultValues: StudentOnboardingFormData = {
  firstName: '',
  lastName: '',
  documentType: 'NationalId',
  documentNumber: '',
  email: '',
  phone: '',
  country: 'DO',
  churchName: '',
  pastor: {
    fullName: '',
    phone: '',
  },
  academicLevel: 'HighSchool',
  enrollmentType: INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
  completedInternalClassroomIds: [],
  currentInternalClassroomId: '',
};

const stepFieldMap: Partial<Record<OnboardingStepId, Path<StudentOnboardingFormData>[]>> = {
  personal: ['firstName', 'lastName', 'documentType', 'documentNumber', 'phone', 'country', 'email'],
  academic: ['academicLevel', 'enrollmentType'],
  church: ['churchName', 'pastor.fullName', 'pastor.phone'],
};

const StudentOnboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>('personal');
  const [internalProgramName, setInternalProgramName] = useState('Formación Interna');
  const [internalClassrooms, setInternalClassrooms] = useState<IClassroom[]>([]);
  const [existingInternalHistoryClassroomIds, setExistingInternalHistoryClassroomIds] = useState<string[]>([]);
  const [existingInternalEnrollmentClassroomIds, setExistingInternalEnrollmentClassroomIds] = useState<string[]>([]);
  const [programOptions, setProgramOptions] = useState<IEnrollmentProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasInitializedStep = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    clearErrors,
    setError,
    formState: { errors, dirtyFields, isSubmitted },
  } = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(studentOnboardingSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const documentNumber = watch('documentNumber');
  const phone = watch('phone');
  const country = watch('country');
  const churchName = watch('churchName');
  const pastorName = watch('pastor.fullName');
  const pastorPhone = watch('pastor.phone');
  const academicLevel = watch('academicLevel');
  const enrollmentType = watch('enrollmentType');
  const watchedCompletedInternalClassroomIds = watch('completedInternalClassroomIds');
  const currentInternalClassroomId = watch('currentInternalClassroomId') || '';
  const completedInternalClassroomIds = useMemo(
    () => watchedCompletedInternalClassroomIds ?? [],
    [watchedCompletedInternalClassroomIds]
  );

  const isInternalProgram = isInternalFormationEnrollment(enrollmentType);
  const reviewChurchName = isInternalProgram
    ? INTERNAL_FORMATION_CHURCH.churchName
    : churchName;
  const reviewPastorName = isInternalProgram
    ? INTERNAL_FORMATION_CHURCH.pastorName
    : pastorName;
  const reviewPastorPhone = isInternalProgram
    ? INTERNAL_FORMATION_CHURCH.pastorPhone
    : pastorPhone;
  const personalComplete = Boolean(
    firstName?.trim() &&
      lastName?.trim() &&
      documentNumber?.trim() &&
      phone?.trim() &&
      country?.trim()
  );
  const academicComplete = Boolean(academicLevel?.trim() && enrollmentType?.trim());
  const churchComplete = isInternalProgram || Boolean(churchName?.trim() && pastorName?.trim());

  const completedHistoryOptions = useMemo(
    () =>
      internalClassrooms.filter(
        (classroom) =>
          !existingInternalHistoryClassroomIds.includes(classroom.id) &&
          !existingInternalEnrollmentClassroomIds.includes(classroom.id) &&
          classroom.id !== currentInternalClassroomId
      ),
    [
      currentInternalClassroomId,
      existingInternalEnrollmentClassroomIds,
      existingInternalHistoryClassroomIds,
      internalClassrooms,
    ]
  );

  const currentEnrollmentOptions = useMemo(() => {
    const blockedClassroomIds = new Set([
      ...existingInternalHistoryClassroomIds,
      ...completedInternalClassroomIds,
    ]);

    return internalClassrooms.filter(
      (classroom) =>
        (classroom.isActive || classroom.id === currentInternalClassroomId) &&
        (!blockedClassroomIds.has(classroom.id) || classroom.id === currentInternalClassroomId)
    );
  }, [
    completedInternalClassroomIds,
    currentInternalClassroomId,
    existingInternalHistoryClassroomIds,
    internalClassrooms,
  ]);

  const steps = useMemo<IOnboardingStep[]>(() => {
    const sortableSteps: IOnboardingStep[] = [
      {
        id: 'personal' as const,
        label: 'Perfil',
        description: 'Datos personales y contacto.',
        isComplete: personalComplete,
      },
      {
        id: 'academic' as const,
        label: 'Programa',
        description: 'Nivel académico y programa.',
        isComplete: academicComplete,
      },
      {
        id: 'church' as const,
        label: 'Cobertura',
        description: 'Iglesia y liderazgo pastoral.',
        isComplete: churchComplete,
      },
    ].filter((step) => step.id !== 'church' || !isInternalProgram);

    const prioritizedCoreSteps = [...sortableSteps].sort((stepA, stepB) => {
      if (stepA.isComplete !== stepB.isComplete) {
        return stepA.isComplete ? 1 : -1;
      }

      return sortableSteps.findIndex((step) => step.id === stepA.id) -
        sortableSteps.findIndex((step) => step.id === stepB.id);
    });

    const dynamicSteps = [...prioritizedCoreSteps];

    if (isInternalProgram) {
      dynamicSteps.push(
        {
          id: 'completedHistory' as const,
          label: 'Historial',
          description: 'Clases ya impartidas pendientes.',
          isComplete: completedInternalClassroomIds.length > 0 || completedHistoryOptions.length === 0,
        },
        {
          id: 'currentEnrollment' as const,
          label: 'Inscripción',
          description: 'Clase activa que cursarás.',
          isComplete: Boolean(currentInternalClassroomId) || currentEnrollmentOptions.length === 0,
        }
      );
    }

    dynamicSteps.push({
      id: 'review' as const,
      label: 'Confirmar',
      description: 'Revisión final del onboarding.',
      isComplete: false,
    });

    return dynamicSteps;
  }, [
    academicComplete,
    churchComplete,
    completedHistoryOptions.length,
    completedInternalClassroomIds.length,
    currentEnrollmentOptions.length,
    currentInternalClassroomId,
    isInternalProgram,
    personalComplete,
  ]);

  const currentStepIndex = Math.max(
    steps.findIndex((step) => step.id === currentStepId),
    0
  );
  const currentStep = steps[currentStepIndex];
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

  const getClassroomLabel = (classroomId?: string) =>
    internalClassrooms.find((classroom) => classroom.id === classroomId)?.name || 'Sin clase seleccionada';

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadOnboarding = async () => {
      try {
        setLoading(true);
        setLoadingPrograms(true);
        const [profile, catalog, programs] = await Promise.all([
          UserService.getUserById(user.id),
          StudentOnboardingService.getInternalFormationCatalog(),
          ProgramService.getAllPrograms(),
        ]);

        if (!profile) {
          toast.error('No se pudo cargar tu perfil');
          navigate('/student/dashboard', { replace: true });
          return;
        }

        const enrollmentPrograms = buildEnrollmentProgramOptions(programs);
        const normalizedEnrollmentType = normalizeEnrollmentTypeValue(
          profile.enrollmentType || INTERNAL_FORMATION_PROGRAM_FALLBACK_NAME,
          enrollmentPrograms
        );
        const internalClassroomIds = new Set(catalog.classrooms.map((classroom) => classroom.id));
        const existingHistoryIds = (profile.completedClassrooms || [])
          .filter((entry) => internalClassroomIds.has(entry.classroomId))
          .map((entry) => entry.classroomId);
        const activeInternalEnrollment =
          (profile.enrolledClassrooms || []).find((classroomId) => internalClassroomIds.has(classroomId)) || '';
        const activeInternalEnrollments = (profile.enrolledClassrooms || []).filter((classroomId) =>
          internalClassroomIds.has(classroomId)
        );

        setProgramOptions(enrollmentPrograms);
        setInternalProgramName(catalog.program?.name || 'Formación Interna');
        setInternalClassrooms(catalog.classrooms);
        setExistingInternalHistoryClassroomIds(existingHistoryIds);
        setExistingInternalEnrollmentClassroomIds(activeInternalEnrollments);
        setPhotoPreview(profile.profilePhoto || user.profilePhoto || '');
        setProfilePhoto(null);
        setPhotoError('');

        reset({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          documentType: profile.documentType || 'NationalId',
          documentNumber: profile.documentNumber || '',
          email: profile.email || '',
          phone: profile.phone || '',
          country: profile.country || 'DO',
          churchName: profile.churchName || '',
          pastor: {
            fullName: profile.pastor?.fullName || '',
            phone: profile.pastor?.phone || '',
          },
          academicLevel: profile.academicLevel || 'HighSchool',
          enrollmentType: normalizedEnrollmentType,
          completedInternalClassroomIds: [],
          currentInternalClassroomId: activeInternalEnrollment,
        });
      } catch (error) {
        console.error('Error loading onboarding:', error);
        toast.error('Error al cargar el onboarding');
      } finally {
        setLoading(false);
        setLoadingPrograms(false);
      }
    };

    void loadOnboarding();
  }, [navigate, reset, user?.id, user?.profilePhoto]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasInitializedStep.current && steps.length > 0) {
      setCurrentStepId(steps[0].id);
      hasInitializedStep.current = true;
      return;
    }

    if (!steps.some((step) => step.id === currentStepId) && steps.length > 0) {
      setCurrentStepId(steps[0].id);
    }
  }, [currentStepId, loading, steps]);

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    if(currentStep.id === 'review') {
      stepRefs.current[currentStep.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'end',
      });
      return;
    }
    stepRefs.current[currentStep.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentStep?.id]);

  useEffect(() => {
    if (!isInternalProgram) {
      return;
    }

    setValue('churchName', INTERNAL_FORMATION_CHURCH.churchName, {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue('pastor.fullName', INTERNAL_FORMATION_CHURCH.pastorName, {
      shouldDirty: true,
      shouldValidate: false,
    });
    setValue('pastor.phone', INTERNAL_FORMATION_CHURCH.pastorPhone, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [isInternalProgram, setValue]);

  useEffect(() => {
    if (
      currentInternalClassroomId &&
      completedInternalClassroomIds.includes(currentInternalClassroomId)
    ) {
      setValue(
        'completedInternalClassroomIds',
        completedInternalClassroomIds.filter((classroomId) => classroomId !== currentInternalClassroomId),
        { shouldDirty: true }
      );
    }
  }, [completedInternalClassroomIds, currentInternalClassroomId, setValue]);

  const handlePhotoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecciona una imagen válida.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no debe superar los 5MB.');
      event.target.value = '';
      return;
    }

    setPhotoError('');
    setProfilePhoto(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview((reader.result as string) || '');
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePickPhoto = useCallback(() => {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
  }, []);

  const handleTakePhoto = useCallback(() => {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.setAttribute('capture', 'user');
    fileInputRef.current.click();
  }, []);

  const validateCurrentEnrollmentStep = (): boolean => {
    if (!isInternalProgram) {
      clearErrors('currentInternalClassroomId');
      return true;
    }

    if (currentEnrollmentOptions.length > 0 && !currentInternalClassroomId) {
      setError('currentInternalClassroomId', {
        type: 'manual',
        message: 'Selecciona la clase en la que deseas inscribirte.',
      });
      return false;
    }

    clearErrors('currentInternalClassroomId');
    return true;
  };

  const handleStepAdvance = async () => {
    if (!currentStep) {
      return;
    }

    if (currentStep.id === 'currentEnrollment' && !validateCurrentEnrollmentStep()) {
      return;
    }

    const fieldsToValidate = stepFieldMap[currentStep.id];
    if (fieldsToValidate) {
      const isValid = await trigger(fieldsToValidate, { shouldFocus: true });
      if (!isValid) {
        return;
      }
    }

    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) {
      return;
    }

    startTransition(() => {
      setCurrentStepId(nextStep.id);
    });
  };

  const handleStepBack = () => {
    const previousStep = steps[currentStepIndex - 1];
    if (!previousStep) {
      return;
    }

    startTransition(() => {
      setCurrentStepId(previousStep.id);
    });
  };

  const handleToggleCompletedClassroom = (classroomId: string) => {
    const nextIds = completedInternalClassroomIds.includes(classroomId)
      ? completedInternalClassroomIds.filter((selectedId) => selectedId !== classroomId)
      : [...completedInternalClassroomIds, classroomId];

    setValue('completedInternalClassroomIds', nextIds, { shouldDirty: true });
  };

  const handleSelectCurrentClassroom = (classroomId: string) => {
    setValue('currentInternalClassroomId', classroomId, { shouldDirty: true });
    clearErrors('currentInternalClassroomId');
  };

  const onSubmit = async (data: StudentOnboardingFormData) => {
    console.log('user submitted data:', data, user, validateCurrentEnrollmentStep()); // Debug log for submitted form data
    if (!user?.id) {
      return;
    }

    if (!validateCurrentEnrollmentStep()) {
      return;
    }

    try {
      setSaving(true);
      const updatedUser = await StudentOnboardingService.completeOnboarding(user.id, data);

      let userToCache = updatedUser;
      if (profilePhoto) {
        try {
          const photoUrl = await UserService.updateProfilePhoto(user.id, profilePhoto);
          userToCache = {
            ...updatedUser,
            profilePhoto: photoUrl,
          };
        } catch (photoUploadError) {
          console.error('Error updating onboarding profile photo:', photoUploadError);
          toast.warn('El onboarding se completó, pero no se pudo subir la foto de perfil.');
        }
      }

      AuthService.cacheUser(userToCache);
      await refreshUser();
      toast.success('Onboarding completado exitosamente');
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('No se pudo completar el onboarding');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep?.id) {
      case 'personal':
        return (
          <PersonalInfoSection
            register={register}
            errors={errors}
            dirtyFields={dirtyFields}
            isSubmitted={isSubmitted}
            watch={watch}
            setValue={setValue}
            disabled={saving}
            profilePhotoSection={{
              previewUrl: photoPreview,
              errorMessage: photoError,
              inputRef: fileInputRef,
              disabled: saving,
              onChange: handlePhotoChange,
              onPickPhoto: handlePickPhoto,
              onTakePhoto: handleTakePhoto,
            }}
          />
        );
      case 'academic':
        return (
          <AcademicInfoSection
            register={register}
            errors={errors}
            dirtyFields={dirtyFields}
            isSubmitted={isSubmitted}
            watch={watch}
            setValue={setValue}
            enrollmentOptions={programOptions}
            loadingEnrollmentOptions={loadingPrograms}
            disabled={saving}
          />
        );
      case 'church':
        return (
          <ChurchInfoSection
            register={register}
            errors={errors}
            dirtyFields={dirtyFields}
            isSubmitted={isSubmitted}
            disabled={saving}
          />
        );
      case 'completedHistory':
        return (
          <InternalFormationClassStep
            variant="history"
            programName={internalProgramName}
            options={completedHistoryOptions}
            existingHistoryCount={existingInternalHistoryClassroomIds.length}
            currentEnrollmentCount={existingInternalEnrollmentClassroomIds.length}
            selectedClassroomIds={completedInternalClassroomIds}
            onToggleClassroom={handleToggleCompletedClassroom}
          />
        );
      case 'currentEnrollment':
        return (
          <InternalFormationClassStep
            variant="current"
            programName={internalProgramName}
            options={currentEnrollmentOptions}
            selectedClassroomId={currentInternalClassroomId}
            errorMessage={errors.currentInternalClassroomId?.message}
            onSelectClassroom={handleSelectCurrentClassroom}
          />
        );
      case 'review':
        return (
          <div className="student-onboarding-review-grid">
            <div className="student-onboarding-review-card">
              <h6 className="student-onboarding-review-card__title">Perfil</h6>
              <p className="student-onboarding-review-card__content">
                {firstName} {lastName}
                {'\n'}{phone}
                {'\n'}{watch('email') || 'Sin correo electrónico'}
              </p>
            </div>

            <div className="student-onboarding-review-card">
              <h6 className="student-onboarding-review-card__title">
                {isInternalProgram ? 'Cobertura asignada' : 'Cobertura ministerial'}
              </h6>
              <p className="student-onboarding-review-card__content">
                {reviewChurchName}
                {'\n'}{reviewPastorName}
                {'\n'}{reviewPastorPhone || 'Sin teléfono pastoral'}
              </p>
            </div>

            <div className="student-onboarding-review-card">
              <h6 className="student-onboarding-review-card__title">Ruta académica</h6>
              <p className="student-onboarding-review-card__content">
                {getAcademicLevelLabel(academicLevel || 'HighSchool')}
                {'\n'}{getEnrollmentTypeLabel(enrollmentType)}
              </p>
            </div>

            {isInternalProgram && (
              <div className="student-onboarding-review-card">
                <h6 className="student-onboarding-review-card__title">Clases</h6>
                <p className="student-onboarding-review-card__content">
                  Historial nuevo:{' '}
                  {completedInternalClassroomIds.length > 0
                    ? completedInternalClassroomIds.map((classroomId) => getClassroomLabel(classroomId)).join(', ')
                    : 'Ninguna'}
                  {'\n'}Inscripción actual: {getClassroomLabel(currentInternalClassroomId)}
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="student-onboarding-page">
        <Container className="student-onboarding-loading">
          <div className="text-center">
            <Spinner color="primary" />
            <p className="mt-3 mb-0 text-muted">Preparando tu onboarding...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="student-onboarding-page">
      <Container fluid className="px-0 py-0 !min-h-[calc(100vh-66px)]">
        <motion.section
          className="student-onboarding-shell"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="student-onboarding-hero">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="student-onboarding-hero__eyebrow">Onboarding de estudiante</p>
                <h1 className="student-onboarding-hero__title">Completa lo pendiente y seguimos.</h1>
              </div>
              <div className="student-onboarding-metric">
                <i className="bi bi-signpost-split"></i>
                <span>
                  Paso {currentStepIndex + 1} de {steps.length}
                </span>
              </div>
            </div>

            <p className="student-onboarding-hero__text mb-0">
              Terminaremos tu perfil, tu programa y, si aplica, la organización de tus clases dentro
              de la academia.
            </p>
          </div>

          <div className="student-onboarding-progress">
            <div className="student-onboarding-progress__bar">
              <div
                className="student-onboarding-progress__fill"
                style={{ width: `${progressValue}%` }}
              />
            </div>

            <div className="student-onboarding-steps">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  ref={(element) => {
                    stepRefs.current[step.id] = element;
                  }}
                  className={`student-onboarding-step-pill ${step.id === currentStep?.id ? 'is-active' : ''}`}
                >
                  <span className="student-onboarding-step-pill__index">{index + 1}</span>
                  <strong className="block text-sm font-semibold">{step.label}</strong>
                  <p className="student-onboarding-step-label">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            
          </Form>
          
        </motion.section>
      </Container>
      <div className="student-onboarding-footer">
              <div className="student-onboarding-footer__actions">
                <Button
                  type="button"
                  color="light"
                  onClick={handleStepBack}
                  disabled={saving || currentStepIndex === 0}
                  className={currentStepIndex === 0 ? 'student-onboarding-footer__ghost' : ''}
                >
                  Atrás
                </Button>

                {currentStep?.id === 'review' ? (
                  <Button color="primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-2"></i>
                        Finalizar
                      </>
                    )}
                  </Button>
                ) : (
                  <Button color="primary" type="button" onClick={handleStepAdvance} disabled={saving}>
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
    </div>
  );
};

export default StudentOnboarding;
