import React from 'react';
import { useAppUpdate } from '../../contexts/AppUpdateContext';

interface AppUpdateBannerProps {
  className?: string;
}

const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({ className = '' }) => {
  const { isApplyingUpdate, applyUpdate } = useAppUpdate();

  // if (!isUpdateAvailable) {
  //   return null;
  // }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm ${className}`.trim()}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-amber-900 font-semibold text-sm mb-0.5">
            Hay una nueva versión disponible
          </div>
          <div className="text-amber-700 text-xs">
            Actualiza la aplicación para usar los últimos cambios, mejoras y correcciones.
          </div>
        </div>

        <button
          onClick={() => void applyUpdate()}
          disabled={isApplyingUpdate}
          className="shrink-0 flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-semibold px-4 py-2 rounded-lg transition-colors border-0"
        >
          {isApplyingUpdate ? (
            <>
              <i className="bi bi-arrow-repeat animate-spin" />
              Actualizando...
            </>
          ) : (
            'Actualizar ahora'
          )}
        </button>
      </div>
    </div>
  );
};

export default AppUpdateBanner;
