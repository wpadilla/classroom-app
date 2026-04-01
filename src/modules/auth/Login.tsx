import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      setError('Ingresa tu Teléfono/WhatsApp.');
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
    ? 'Crea tu acceso y completa el resto de tus datos en el onboarding.'
    : 'Escribe tu teléfono o correo. Si también es tu contraseña, entrarás de inmediato.';
  const isBusy = loading || submitting;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-0 py-12">
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 p-6 sm:p-6 border border-gray-100"
        >
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 flex items-center justify-center overflow-hidden p-2">
              <img src="/logo.png" alt="Logo AMOA" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 leading-tight tracking-tight mb-1">
              Academia de Ministros<br />Oasis de Amor
            </h1>
            <p className="text-sm font-medium text-blue-400">Sistema de Gestión Académica</p>
          </div>

          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{heading}</h3>
            <p className="text-sm text-gray-500 m-0 leading-relaxed px-2">{helperText}</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                  <i className="bi bi-exclamation-circle-fill mt-0.5 text-red-500" />
                  <p className="m-0 flex-1">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">
                {identifierLabel}
              </label>
              <input
                type={isCreateMode ? 'tel' : 'text'}
                name="identifier"
                id="identifier"
                placeholder={identifierPlaceholder}
                value={credentials.identifier}
                onChange={handleChange}
                required
                disabled={isBusy}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            {(showPassword || isCreateMode) ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    placeholder={isCreateMode ? 'Crea tu contraseña' : 'Ingresa tu contraseña'}
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    disabled={isBusy}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isBusy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider bg-transparent border-0 disabled:opacity-50"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-center">
                <span className="text-xs text-blue-700 font-medium">
                  Si no entra automáticamente, te pediremos la contraseña en el siguiente paso.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed mt-2 border-0 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin text-lg" />
                  {isCreateMode ? 'Procesando...' : 'Autenticando...'}
                </>
              ) : isCreateMode ? (
                'Crear cuenta'
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="shrink-0 mx-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">O</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 text-center">
            {isCreateMode ? (
              <Link to="/login" className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors no-underline">
                Ya tengo cuenta
              </Link>
            ) : (
              <Link to="/register" className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors no-underline">
                Crear cuenta nueva
              </Link>
            )}

            {!isCreateMode && (
              <Link to="/forgot-password" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mt-2 no-underline">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center px-4">
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Al continuar, aceptas nuestros{' '}
            <Link to="/terms" className="text-blue-500 hover:underline">Términos de Servicio</Link> y{' '}
            <Link to="/privacy" className="text-blue-500 hover:underline">Política de Privacidad</Link>
          </p>
          <div className="mt-6 text-[10px] uppercase tracking-widest font-bold text-gray-300">
            © {new Date().getFullYear()} AMOA. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
