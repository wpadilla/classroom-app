import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_FALLBACK_DELAY_MS = 4000;

interface AppUpdateContextType {
  isUpdateAvailable: boolean;
  isApplyingUpdate: boolean;
  applyUpdate: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextType>({
  isUpdateAvailable: false,
  isApplyingUpdate: false,
  applyUpdate: async () => {},
  checkForUpdates: async () => {},
});

export const useAppUpdate = (): AppUpdateContextType => useContext(AppUpdateContext);

const isServiceWorkerSupported = (): boolean =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator;

export const AppUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const hasInitializedRef = useRef(false);
  const hasReloadedRef = useRef(false);

  const syncRegistrationState = useCallback((nextRegistration: ServiceWorkerRegistration | null) => {
    if (!nextRegistration) {
      return;
    }

    setRegistration(nextRegistration);
    setIsUpdateAvailable(Boolean(nextRegistration.waiting));
  }, []);

  const resolveRegistration = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isServiceWorkerSupported()) {
      return null;
    }

    if (registration) {
      syncRegistrationState(registration);
      return registration;
    }

    try {
      const readyRegistration = await navigator.serviceWorker.ready;
      syncRegistrationState(readyRegistration);
      return readyRegistration;
    } catch (error) {
      console.error('No se pudo obtener el registro del service worker', error);
      return null;
    }
  }, [registration, syncRegistrationState]);

  const checkForUpdates = useCallback(async () => {
    const activeRegistration = await resolveRegistration();
    if (!activeRegistration) {
      return;
    }

    try {
      await activeRegistration.update();
      syncRegistrationState(activeRegistration);
    } catch (error) {
      console.error('No se pudo buscar una nueva versión de la aplicación', error);
    }
  }, [resolveRegistration, syncRegistrationState]);

  const applyUpdate = useCallback(async () => {
    const activeRegistration = await resolveRegistration();
    if (!activeRegistration) {
      window.location.reload();
      return;
    }

    setIsApplyingUpdate(true);

    try {
      if (!activeRegistration.waiting) {
        await activeRegistration.update();
        syncRegistrationState(activeRegistration);
      }

      if (activeRegistration.waiting) {
        window.setTimeout(() => {
          if (!hasReloadedRef.current) {
            window.location.reload();
          }
        }, RELOAD_FALLBACK_DELAY_MS);

        activeRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error('No se pudo aplicar la nueva versión de la aplicación', error);
      setIsApplyingUpdate(false);
    }
  }, [resolveRegistration, syncRegistrationState]);

  useEffect(() => {
    if (!isServiceWorkerSupported() || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    serviceWorkerRegistration.register({
      onSuccess: syncRegistrationState,
      onUpdate: syncRegistrationState,
    });

    void resolveRegistration();
  }, [resolveRegistration, syncRegistrationState]);

  useEffect(() => {
    if (!isServiceWorkerSupported()) {
      return;
    }

    const handleControllerChange = () => {
      if (hasReloadedRef.current) {
        return;
      }

      hasReloadedRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!isServiceWorkerSupported()) {
      return;
    }

    const handleWindowFocus = () => {
      void checkForUpdates();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates();
      }
    };

    const handleOnline = () => {
      void checkForUpdates();
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void checkForUpdates();
      }
    }, UPDATE_CHECK_INTERVAL_MS);

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return (
    <AppUpdateContext.Provider
      value={{
        isUpdateAvailable,
        isApplyingUpdate,
        applyUpdate,
        checkForUpdates,
      }}
    >
      {children}
    </AppUpdateContext.Provider>
  );
};
