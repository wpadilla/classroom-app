// User Registration Component with Extended Fields
// Uses react-hook-form + zod for validation
// Integrates WhatsApp academy registration

import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Spinner,
  FormFeedback,
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { GCloudService } from '../../services/gcloud/gcloud.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { ProgramService } from '../../services/program/program.service';
import { 
  registrationSchema, 
  RegistrationFormData 
} from '../../schemas/registration.schema';
import {
  DEFAULT_REGISTRATION_VALUES,
  getEnrollmentFromQueryParam,
  getAcademicLevelLabel,
  getEnrollmentTypeLabel,
  getCountryLabel,
} from '../../constants/registration.constants';
import { PersonalInfoSection } from './components/PersonalInfoSection';
import { ChurchInfoSection } from './components/ChurchInfoSection';
import { AcademicInfoSection } from './components/AcademicInfoSection';
import { STUDENT_ONBOARDING_ROUTE } from '../../constants/onboarding.constants';
import { needsStudentOnboarding } from '../../utils/onboarding';
import {
  buildEnrollmentProgramOptions,
  normalizeEnrollmentTypeValue,
  IEnrollmentProgramOption,
} from '../../utils/programEnrollment';

const Register: React.FC = () => {
  const { register: registerUser, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'submitting' | 'whatsapp'>('form');
  const [programOptions, setProgramOptions] = useState<IEnrollmentProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Get enrollment type from query param
  const enrollmentFromParam = getEnrollmentFromQueryParam(searchParams.get('enrollment'));

  // Initialize form with react-hook-form + zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields, isSubmitted },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      documentType: DEFAULT_REGISTRATION_VALUES.documentType,
      documentNumber: '',
      email: '',
      phone: '',
      country: DEFAULT_REGISTRATION_VALUES.country,
      churchName: '',
      pastor: {
        fullName: '',
        phone: '',
      },
      academicLevel: DEFAULT_REGISTRATION_VALUES.academicLevel,
      enrollmentType: enrollmentFromParam,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const programs = await ProgramService.getAllPrograms();
        const enrollmentPrograms = buildEnrollmentProgramOptions(programs);
        setProgramOptions(enrollmentPrograms);

        const normalizedEnrollment = normalizeEnrollmentTypeValue(
          enrollmentFromParam,
          enrollmentPrograms
        );

        setValue('enrollmentType', normalizedEnrollment, {
          shouldDirty: false,
          shouldValidate: false,
        });
      } catch (error) {
        console.error('Error loading programs for registration:', error);
      } finally {
        setLoadingPrograms(false);
      }
    };

    void loadPrograms();
  }, [enrollmentFromParam, setValue]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (needsStudentOnboarding(user)) {
        navigate(STUDENT_ONBOARDING_ROUTE, { replace: true });
        return;
      }

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'student':
          navigate('/student/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Por favor seleccione una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no debe superar los 5MB');
      return;
    }

    setPhotoError('');
    setProfilePhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle take photo (mobile camera)
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'user');
      fileInputRef.current.click();
    }
  };

  // Form submission
  const onSubmit = async (data: RegistrationFormData) => {
    setGeneralError('');
    setRegistrationStep('submitting');

    try {
      let photoUrl = '';

      // Upload photo if provided
      if (profilePhoto) {
        setUploadingPhoto(true);
        try {
          photoUrl = await GCloudService.uploadProfilePhoto(
            profilePhoto,
            data.phone
          );
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Continue without photo
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Register user in the system
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: 'student' as const,
        profilePhoto: photoUrl,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        country: data.country,
        churchName: data.churchName,
        pastor: data.pastor,
        academicLevel: data.academicLevel,
        enrollmentType: data.enrollmentType,
      };

      const success = await registerUser(registrationData);

      if (!success) {
        setGeneralError('Error al registrar. Por favor intente nuevamente.');
        setRegistrationStep('form');
        return;
      }

      // Register with WhatsApp academy (non-blocking)
      setRegistrationStep('whatsapp');
      try {
        await WhatsappService.registerStudentToAcademy({
          firstName: data.firstName,
          lastName: data.lastName,
          documentNumber: data.documentNumber || '',
          email: data.email || '',
          phone: data.phone,
          country: getCountryLabel(data.country),
          churchName: data.churchName,
          pastorName: data.pastor.fullName,
          pastorContact: data.pastor.phone || '',
          academicLevel: getAcademicLevelLabel(data.academicLevel),
          enrollmentType: getEnrollmentTypeLabel(data.enrollmentType),
        });
      } catch (whatsappError) {
        // Log but don't block registration
        console.error('WhatsApp registration error:', whatsappError);
      }

      navigate(STUDENT_ONBOARDING_ROUTE);
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('Error al registrar. Por favor intente nuevamente.');
      setRegistrationStep('form');
    }
  };

  const isDisabled = loading || uploadingPhoto || isSubmitting || registrationStep !== 'form';
  const { ref: passwordRef, ...passwordField } = register('password');
  const { ref: confirmPasswordRef, ...confirmPasswordField } = register('confirmPassword');

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col md={10} lg={8} xl={7} className="mx-auto">
          <Card className="shadow-lg">
            <CardBody className="p-4 p-md-5">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">
                  Academia de Ministros Oasis de Amor
                </h2>
                <p className="text-muted">Inscripción de Estudiante</p>
              </div>

              {/* Error Alert */}
              {generalError && (
                <Alert color="danger" className="mb-3">
                  {generalError}
                </Alert>
              )}

              {/* Loading States */}
              {registrationStep === 'submitting' && (
                <Alert color="info" className="mb-3">
                  <Spinner size="sm" className="me-2" />
                  {uploadingPhoto ? 'Subiendo foto de perfil...' : 'Registrando usuario...'}
                </Alert>
              )}
              {registrationStep === 'whatsapp' && (
                <Alert color="success" className="mb-3">
                  <Spinner size="sm" className="me-2" />
                  Agregando al grupo oficial de WhatsApp...
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Profile Photo */}
                <FormGroup className="text-center mb-4">
                  <div className="mb-3">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="rounded-circle border"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center"
                        style={{ width: '120px', height: '120px' }}
                      >
                        <i className="bi bi-person-fill text-white" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />

                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      type="button"
                      color="outline-primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isDisabled}
                    >
                      <i className="bi bi-upload me-1"></i>
                      Subir Foto
                    </Button>
                    <Button
                      type="button"
                      color="outline-primary"
                      size="sm"
                      onClick={handleTakePhoto}
                      disabled={isDisabled}
                    >
                      <i className="bi bi-camera me-1"></i>
                      Tomar Foto
                    </Button>
                  </div>
                  {photoError && (
                    <div className="text-danger small mt-2">{photoError}</div>
                  )}
                </FormGroup>

                {/* Personal Information Section */}
                <PersonalInfoSection
                  register={register}
                  errors={errors}
                  dirtyFields={dirtyFields}
                  isSubmitted={isSubmitted}
                  watch={watch}
                  setValue={setValue}
                  disabled={isDisabled}
                />

                {/* Church Information Section */}
                <ChurchInfoSection
                  register={register}
                  errors={errors}
                  dirtyFields={dirtyFields}
                  isSubmitted={isSubmitted}
                  disabled={isDisabled}
                />

                {/* Academic Information Section */}
                <AcademicInfoSection
                  register={register}
                  errors={errors}
                  dirtyFields={dirtyFields}
                  isSubmitted={isSubmitted}
                  watch={watch}
                  setValue={setValue}
                  enrollmentOptions={programOptions}
                  loadingEnrollmentOptions={loadingPrograms}
                  disabled={isDisabled}
                />

                {/* Password Section */}
                <h5 className="mb-3 mt-4 text-primary">
                  <i className="bi bi-shield-lock me-2"></i>
                  Contraseña
                </h5>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="password">Contraseña *</Label>
                      <div className="position-relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          placeholder="Mínimo 6 caracteres"
                          {...passwordField}
                          innerRef={passwordRef}
                          invalid={!!errors.password && (isSubmitted || !!dirtyFields.password)}
                          disabled={isDisabled}
                        />
                        <Button
                          type="button"
                          color="link"
                          size="sm"
                          className="position-absolute end-0 top-50 translate-middle-y pe-3"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ zIndex: 10 }}
                          tabIndex={-1}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </div>
                      {(isSubmitted || !!dirtyFields.password) && (
                        <FormFeedback className="d-block">
                          {errors.password?.message}
                        </FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="confirmPassword">Confirmar Contraseña *</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        placeholder="Repita la contraseña"
                        {...confirmPasswordField}
                        innerRef={confirmPasswordRef}
                        invalid={!!errors.confirmPassword && (isSubmitted || !!dirtyFields.confirmPassword)}
                        disabled={isDisabled}
                      />
                      {(isSubmitted || !!dirtyFields.confirmPassword) && (
                        <FormFeedback>{errors.confirmPassword?.message}</FormFeedback>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                {/* Submit Button */}
                <Button
                  type="submit"
                  color="primary"
                  block
                  size="lg"
                  disabled={isDisabled}
                  className="mt-4"
                >
                  {isDisabled ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {uploadingPhoto ? 'Subiendo foto...' : 'Registrando...'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Inscribirse
                    </>
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-0">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-decoration-none fw-bold">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="text-center mt-3">
            <small className="text-muted">
              © 2024 Academia de Ministros Oasis de Amor. Todos los derechos reservados.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
