// Offline Sync Badge Component
// Shows pending operations count and sync button

import React from 'react';
import { useOffline } from '../../contexts/OfflineContext';
import { toast } from 'react-toastify';

interface OfflineSyncBadgeProps {
  className?: string;
  showButton?: boolean;
}

const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({ 
  className = '', 
  showButton = true 
}) => {
  const { isOffline, pendingOperations, syncPending } = useOffline();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    if (isOffline) {
      toast.warning('No hay conexión a internet');
      return;
    }

    try {
      setSyncing(true);
      await syncPending();
    } finally {
      setSyncing(false);
    }
  };

  if (pendingOperations === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-200">
        <i className="bi bi-cloud-upload" />
        <span>{pendingOperations} pendiente{pendingOperations !== 1 ? 's' : ''}</span>
      </div>
      
      {showButton && !isOffline && (
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Sincronizar operaciones pendientes"
          className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed px-3 py-1 rounded-full text-xs font-medium border-0 transition-colors"
        >
          {syncing ? (
            <>
              <i className="bi bi-arrow-repeat animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat" />
              <span>Sincronizar</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default OfflineSyncBadge;
