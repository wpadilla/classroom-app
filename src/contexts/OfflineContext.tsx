import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface OfflineContextType {
    isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({
    isOffline: false,
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            toast.info('Conexión restaurada');
        };

        const handleOffline = () => {
            setIsOffline(true);
            toast.warning('Modo sin conexión activado');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline }}>
            {children}
        </OfflineContext.Provider>
    );
};
