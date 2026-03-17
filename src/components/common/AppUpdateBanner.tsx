import React from 'react';
import { Alert, Button, Spinner } from 'reactstrap';
import { useAppUpdate } from '../../contexts/AppUpdateContext';

interface AppUpdateBannerProps {
  className?: string;
}

const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({ className = '' }) => {
  const { isUpdateAvailable, isApplyingUpdate, applyUpdate } = useAppUpdate();

  // if (!isUpdateAvailable) {
  //   return null;
  // }

  return (
    <Alert color="warning" className={`app-update-banner shadow-sm ${className}`.trim()}>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          <div className="fw-semibold mb-1">Hay una nueva versión disponible</div>
          <div className="small mb-0">
            Actualiza la aplicación para usar los últimos cambios, mejoras y correcciones.
          </div>
        </div>

        <Button
          color="dark"
          onClick={() => void applyUpdate()}
          disabled={isApplyingUpdate}
          className="app-update-banner__button"
        >
          {isApplyingUpdate ? (
            <>
              <Spinner size="sm" className="me-2" />
              Actualizando...
            </>
          ) : (
            'Actualizar ahora'
          )}
        </Button>
      </div>
    </Alert>
  );
};

export default AppUpdateBanner;
