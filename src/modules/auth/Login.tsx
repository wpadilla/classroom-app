// Universal Login Component

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Spinner
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { IAuthCredentials } from '../../models';

const Login: React.FC = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [credentials, setCredentials] = useState<IAuthCredentials>({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/admin';

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Navigate to appropriate dashboard based on role
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!credentials.identifier || !credentials.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    // Attempt login
    const success = await login(credentials);
    
    if (!success) {
      setError('Credenciales inválidas. Por favor intente nuevamente.');
    } else {
      // Redirect to intended page or dashboard
      navigate(from, { replace: true });
    }
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Row className="w-100">
        <Col md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow-lg">
            <CardBody className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Instituto Cristiano</h2>
                <p className="text-muted">Sistema de Gestión Académica</p>
              </div>

              <h4 className="text-center mb-4">Iniciar Sesión</h4>

              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="identifier">
                    Teléfono o Correo Electrónico
                  </Label>
                  <Input
                    type="text"
                    name="identifier"
                    id="identifier"
                    placeholder="Ej: 8091234567 o correo@ejemplo.com"
                    value={credentials.identifier}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="password">
                    Contraseña
                  </Label>
                  <div className="position-relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      placeholder="Ingrese su contraseña"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
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
                </FormGroup>

                <Button
                  type="submit"
                  color="primary"
                  block
                  size="lg"
                  disabled={loading}
                  className="mt-4"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-2">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Regístrate aquí
                  </Link>
                </p>
                <p className="mb-0">
                  <Link to="/forgot-password" className="text-decoration-none text-muted">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </p>
              </div>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Al iniciar sesión, aceptas nuestros{' '}
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
              © 2024 Instituto Cristiano. Todos los derechos reservados.
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
