import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SyncService } from '../services/offline/sync.service';

interface OfflineContextType {
    isOffline: boolean;
    pendingOperations: number;
    syncPending: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
    isOffline: false,
    pendingOperations: 0,
    syncPending: async () => {}
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [pendingOperations, setPendingOperations] = useState(SyncService.getPendingCount());

    const updatePendingCount = () => {
        setPendingOperations(SyncService.getPendingCount());
    };

    const syncPending = async () => {
        if (isOffline) {
            toast.warning('No hay conexión a internet');
            return;
        }

        try {
            toast.info('Sincronizando operaciones pendientes...');
            await SyncService.syncPendingOperations();
            updatePendingCount();
        } catch (error) {
            console.error('Error syncing operations:', error);
            toast.error('Error al sincronizar operaciones');
        }
    };

    useEffect(() => {
        const handleOnline = async () => {
            setIsOffline(false);
            toast.info('Conexión restaurada');
            
            // Auto-sync pending operations when connection is restored
            if (SyncService.hasPendingOperations()) {
                await syncPending();
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
            toast.warning('Modo sin conexión activado');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Update pending count on mount
        updatePendingCount();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline, pendingOperations, syncPending }}>
            {children}
        </OfflineContext.Provider>
    );
};
