// Offline Sync Badge Component
// Shows pending operations count and sync button

import React from 'react';
import { Badge, Button, Spinner } from 'reactstrap';
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
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <Badge color="warning" pill>
        <i className="bi bi-cloud-upload me-1"></i>
        {pendingOperations} pendiente{pendingOperations !== 1 ? 's' : ''}
      </Badge>
      
      {showButton && !isOffline && (
        <Button
          color="warning"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          title="Sincronizar operaciones pendientes"
        >
          {syncing ? (
            <>
              <Spinner size="sm" className="me-1" />
              Sincronizando...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-1"></i>
              Sincronizar
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default OfflineSyncBadge;
