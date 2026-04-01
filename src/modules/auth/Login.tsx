import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
} from 'reactstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { IAuthCredentials, IAuthUser, IRegistrationData } from '../../models';
import { AuthService } from '../../services/auth/auth.service';
import { STUDENT_ONBOARDING_ROUTE } from '../../constants/onboarding.constants';
import { needsStudentOnboarding } from '../../utils/onboarding';

interface LoginProps {
  mode?: 'login' | 'create';
}

const roleDashboardMap: Record<IAuthUser['role'], string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
};

const Login: React.FC<LoginProps> = ({ mode = 'login' }) => {
  const { loading, isAuthenticated, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateMode = mode === 'create';
  const redirectedFrom = location.state?.from?.pathname;

  const [credentials, setCredentials] = useState<IAuthCredentials>({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(isCreateMode);
  const [submitting, setSubmitting] = useState(false);

  const postAuthPath = useMemo(
    () => (authUser: IAuthUser): string => {
      if (needsStudentOnboarding(authUser)) {
        return STUDENT_ONBOARDING_ROUTE;
      }

      if (
        redirectedFrom &&
        redirectedFrom !== '/login' &&
        redirectedFrom !== '/register'
      ) {
        return redirectedFrom;
      }

      return roleDashboardMap[authUser.role];
    },
    [redirectedFrom]
  );

  useEffect(() => {
    setError('');
    setShowPassword(isCreateMode);
    setCredentials({
      identifier: '',
      password: '',
    });
  }, [isCreateMode]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(postAuthPath(user), { replace: true });
    }
  }, [isAuthenticated, loading, navigate, postAuthPath, user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setCredentials((previous) => ({
      ...previous,
      [name]: value,
    }));
    setError('');

    if (name === 'identifier' && !isCreateMode && !showPassword) {
      setCredentials((previous) => ({
        ...previous,
        password: '',
      }));
    }
  };

  const finalizeSession = async (authUser?: IAuthUser) => {
    await refreshUser();

    if (authUser) {
      navigate(postAuthPath(authUser), { replace: true });
    }
  };

  const handleLoginSubmit = async () => {
    if (!credentials.identifier.trim()) {
      setError('Ingresa tu teléfono o correo electrónico.');
      return;
    }

    if (!showPassword) {
      const silentAttempt = await AuthService.login({
        identifier: credentials.identifier.trim(),
        password: credentials.identifier.trim(),
      });

      if (silentAttempt.success) {
        toast.success(silentAttempt.message || 'Inicio de sesión exitoso');
        await finalizeSession(silentAttempt.user);
        return;
      }

      if (silentAttempt.error === 'Contraseña incorrecta') {
        setShowPassword(true);
        setError('');
        return;
      }

      setError(silentAttempt.error || 'No pudimos iniciar tu sesión.');
      return;
    }

    if (!credentials.password.trim()) {
      setError('Ingresa tu contraseña.');
      return;
    }

    const response = await AuthService.login({
      identifier: credentials.identifier.trim(),
      password: credentials.password,
    });

    if (!response.success) {
      setError(response.error || 'Credenciales inválidas. Intenta nuevamente.');
      return;
    }

    toast.success(response.message || 'Inicio de sesión exitoso');
    await finalizeSession(response.user);
  };

  const handleCreateAccountSubmit = async () => {
    if (!credentials.identifier.trim()) {
      setError('Ingresa tu Teléfono/Whatsapp.');
      return;
    }

    if (!credentials.password.trim()) {
      setError('Define la contraseña con la que crearás tu cuenta.');
      return;
    }

    if (credentials.password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const registrationData: IRegistrationData = {
      firstName: '',
      lastName: '',
      phone: credentials.identifier.trim(),
      password: credentials.password,
      confirmPassword: credentials.password,
      role: 'student',
      email: undefined,
      documentType: undefined,
      documentNumber: undefined,
      country: undefined,
      churchName: undefined,
      pastor: undefined,
      academicLevel: undefined,
      enrollmentType: undefined,
    };

    const response = await AuthService.register(registrationData);

    if (!response.success) {
      setError(response.error || 'No se pudo crear la cuenta.');
      return;
    }

    toast.success('Cuenta creada correctamente. Vamos a completar tus datos.');
    await finalizeSession(response.user);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isCreateMode) {
        await handleCreateAccountSubmit();
      } else {
        await handleLoginSubmit();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const identifierLabel = isCreateMode ? 'Teléfono / WhatsApp' : 'Teléfono o Correo Electrónico';
  const identifierPlaceholder = isCreateMode
    ? 'Ej: 8091234567'
    : 'Ej: 8091234567 o correo@ejemplo.com';
  const heading = isCreateMode ? 'Crear cuenta' : 'Iniciar sesión';
  const helperText = isCreateMode
    ? 'Crea tu acceso con tu teléfono y tu contraseña. Después completarás el resto de tus datos en el onboarding.'
    : 'Escribe tu teléfono o correo. Si también es tu contraseña, podrás entrar de inmediato.';
  const isBusy = loading || submitting;

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <CardBody className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Academia de Ministros Oasis de Amor</h2>
                <p className="text-muted mb-0">Sistema de Gestión Académica</p>
              </div>

              <div className="mb-4 text-center">
                <h4 className="mb-2">{heading}</h4>
                <p className="text-muted mb-0 small">{helperText}</p>
              </div>

              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="identifier">{identifierLabel}</Label>
                  <Input
                    type={isCreateMode ? 'tel' : 'text'}
                    name="identifier"
                    id="identifier"
                    placeholder={identifierPlaceholder}
                    value={credentials.identifier}
                    onChange={handleChange}
                    required
                    disabled={isBusy}
                  />
                </FormGroup>

                {(showPassword || isCreateMode) ? (
                  <FormGroup>
                    <Label for="password">Contraseña</Label>
                    <div className="position-relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        placeholder={isCreateMode ? 'Crea tu contraseña' : 'Ingresa tu contraseña'}
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        disabled={isBusy}
                      />
                      <Button
                        type="button"
                        color="link"
                        size="sm"
                        className="position-absolute end-0 top-50 translate-middle-y text-decoration-none"
                        onClick={() => setShowPassword((previous) => !previous)}
                        style={{ zIndex: 10 }}
                        disabled={isBusy}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </Button>
                    </div>
                  </FormGroup>
                ) : (
                  <Alert color="light" className="border small text-muted py-2 px-3">
                    Si no entra automáticamente, te pediremos la contraseña en el siguiente paso.
                  </Alert>
                )}

                <Button
                  type="submit"
                  color="primary"
                  block
                  size="lg"
                  disabled={isBusy}
                  className="mt-4"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {isCreateMode ? 'Creando cuenta...' : 'Ingresando...'}
                    </>
                  ) : isCreateMode ? (
                    'Crear cuenta'
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="d-grid gap-2 text-center">
                {isCreateMode ? (
                  <Link to="/login" className="btn btn-outline-primary">
                    Ya tengo cuenta
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-outline-primary">
                    Crear cuenta
                  </Link>
                )}

                {!isCreateMode && (
                  <Link to="/forgot-password" className="text-decoration-none text-muted small">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Al continuar, aceptas nuestros{' '}
                  <Link to="/terms" className="text-decoration-none">
                    Términos de Servicio
                  </Link>{' '}
                  y{' '}
                  <Link to="/privacy" className="text-decoration-none">
                    Política de Privacidad
                  </Link>
                </small>
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

export default Login;
