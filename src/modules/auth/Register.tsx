// User Registration Component with Photo Upload

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FormFeedback
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { IRegistrationData } from '../../models';
import { GCloudService } from '../../services/gcloud/gcloud.service';

const Register: React.FC = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<IRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof IRegistrationData, string>>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error
    if (errors[name as keyof IRegistrationData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setGeneralError('');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        profilePhoto: 'Por favor seleccione una imagen válida'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        profilePhoto: 'La imagen no debe superar los 5MB'
      }));
      return;
    }

    setProfilePhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    // This would open camera on mobile devices
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'user');
      fileInputRef.current.click();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IRegistrationData, string>> = {};
    
    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ingrese un número de teléfono válido';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setGeneralError('');
    
    try {
      let photoUrl = '';
      
      // Upload photo if provided
      if (profilePhoto) {
        setUploadingPhoto(true);
        try {
          photoUrl = await GCloudService.uploadProfilePhoto(
            profilePhoto,
            formData.phone // Use phone as temporary ID
          );
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Continue without photo
        } finally {
          setUploadingPhoto(false);
        }
      }
      
      // Register user
      const registrationData: IRegistrationData = {
        ...formData,
        profilePhoto: photoUrl
      };
      
      const success = await register(registrationData);
      
      if (!success) {
        setGeneralError('Error al registrar. Por favor intente nuevamente.');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('Error al registrar. Por favor intente nuevamente.');
    }
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col md={8} lg={6} xl={5} className="mx-auto">
          <Card className="shadow-lg">
            <CardBody className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Instituto Cristiano</h2>
                <p className="text-muted">Registro de Estudiante</p>
              </div>

              {generalError && (
                <Alert color="danger" className="mb-3">
                  {generalError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Profile Photo */}
                <FormGroup className="text-center mb-4">
                  <div className="mb-3">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="rounded-circle"
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
                    >
                      <i className="bi bi-upload me-1"></i>
                      Subir Foto
                    </Button>
                    <Button
                      type="button"
                      color="outline-primary"
                      size="sm"
                      onClick={handleTakePhoto}
                    >
                      <i className="bi bi-camera me-1"></i>
                      Tomar Foto
                    </Button>
                  </div>
                  {errors.profilePhoto && (
                    <div className="text-danger small mt-2">{errors.profilePhoto}</div>
                  )}
                </FormGroup>

                {/* Personal Information */}
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="firstName">Nombre *</Label>
                      <Input
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={handleChange}
                        invalid={!!errors.firstName}
                        disabled={loading || uploadingPhoto}
                      />
                      <FormFeedback>{errors.firstName}</FormFeedback>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="lastName">Apellido *</Label>
                      <Input
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder="Pérez"
                        value={formData.lastName}
                        onChange={handleChange}
                        invalid={!!errors.lastName}
                        disabled={loading || uploadingPhoto}
                      />
                      <FormFeedback>{errors.lastName}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="phone">Teléfono *</Label>
                  <Input
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder="8091234567"
                    value={formData.phone}
                    onChange={handleChange}
                    invalid={!!errors.phone}
                    disabled={loading || uploadingPhoto}
                  />
                  <FormFeedback>{errors.phone}</FormFeedback>
                </FormGroup>

                <FormGroup>
                  <Label for="email">Correo Electrónico (Opcional)</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    invalid={!!errors.email}
                    disabled={loading || uploadingPhoto}
                  />
                  <FormFeedback>{errors.email}</FormFeedback>
                </FormGroup>

                {/* Password */}
                <FormGroup>
                  <Label for="password">Contraseña *</Label>
                  <div className="position-relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      invalid={!!errors.password}
                      disabled={loading || uploadingPhoto}
                    />
                    <Button
                      type="button"
                      color="link"
                      size="sm"
                      className="position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ zIndex: 10 }}
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  <FormFeedback>{errors.password}</FormFeedback>
                </FormGroup>

                <FormGroup>
                  <Label for="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    placeholder="Repita la contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    invalid={!!errors.confirmPassword}
                    disabled={loading || uploadingPhoto}
                  />
                  <FormFeedback>{errors.confirmPassword}</FormFeedback>
                </FormGroup>

                <Button
                  type="submit"
                  color="primary"
                  block
                  size="lg"
                  disabled={loading || uploadingPhoto}
                  className="mt-4"
                >
                  {loading || uploadingPhoto ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {uploadingPhoto ? 'Subiendo foto...' : 'Registrando...'}
                    </>
                  ) : (
                    'Registrarse'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-0">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="text-center mt-3">
            <small className="text-muted">
              © 2024 Instituto Cristiano. Todos los derechos reservados.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
