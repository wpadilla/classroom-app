import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth/auth.service';

const PhoneQuickLoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessingQuickLogin, setIsProcessingQuickLogin] = React.useState(false);

  const cleanedSearch = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete('phone');
    const serializedParams = params.toString();
    return serializedParams ? `?${serializedParams}` : '';
  }, [location.search]);

  React.useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const phone = params.get('phone')?.trim();

    if (!phone) {
      return;
    }

    let isCancelled = false;

    const attemptQuickLogin = async () => {
      setIsProcessingQuickLogin(true);

      try {
        let response = await AuthService.login({
          identifier: phone,
          password: phone,
        });

        if (!response.success && phone.length > 10) {
          const truncatedPhone = phone.slice(-10);
          const retryResponse = await AuthService.login({
            identifier: truncatedPhone,
            password: truncatedPhone,
          });
          if (retryResponse.success) {
            response = retryResponse;
          }
        }

        if (isCancelled) {
          return;
        }

        if (response.success) {
          await refreshUser();

          navigate(
            {
              pathname: '/',
              search: cleanedSearch,
            },
            { replace: true }
          );
          return;
        }

        navigate('/login', {
          replace: true,
          state: {
            from: {
              pathname: location.pathname,
              search: cleanedSearch,
            },
          },
        });
      } finally {
        if (!isCancelled) {
          setIsProcessingQuickLogin(false);
        }
      }
    };

    void attemptQuickLogin();

    return () => {
      isCancelled = true;
    };
  }, [cleanedSearch, isAuthenticated, loading, location.pathname, location.search, navigate, refreshUser]);

  if (loading || isProcessingQuickLogin) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PhoneQuickLoginGate;
