import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';
import { AppVersionService } from '../services/app/app-version.service';
import {
  buildCacheBustedUrl,
  clearAccessibleCookies,
  clearIndexedDbDatabases,
  clearOriginCaches,
  clearPendingAppVersion,
  getPendingAppVersion,
  getStoredDeviceAppVersion,
  normalizeAppVersion,
  storeDeviceAppVersion,
  storePendingAppVersion,
  unregisterAllServiceWorkers,
} from '../utils/appUpdate';

const UPDATE_CHECK_INTERVAL_MS = 10 * 60 * 1000;

interface AppUpdateContextType {
  isUpdateAvailable: boolean;
  isApplyingUpdate: boolean;
  publishedVersion: string;
  deviceVersion: string;
  releaseNotes: string;
  applyUpdate: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextType>({
  isUpdateAvailable: false,
  isApplyingUpdate: false,
  publishedVersion: '',
  deviceVersion: '',
  releaseNotes: '',
  applyUpdate: async () => {},
  checkForUpdates: async () => {},
});

export const useAppUpdate = (): AppUpdateContextType => useContext(AppUpdateContext);

const isServiceWorkerSupported = (): boolean =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator;

export const AppUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [hasWaitingServiceWorker, setHasWaitingServiceWorker] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [deviceVersion, setDeviceVersion] = useState(() => getStoredDeviceAppVersion());
  const hasInitializedRef = useRef(false);
  const hasReloadedRef = useRef(false);
  const isApplyingUpdateRef = useRef(false);

  useEffect(() => {
    isApplyingUpdateRef.current = isApplyingUpdate;
  }, [isApplyingUpdate]);

  const syncRegistrationState = useCallback((nextRegistration: ServiceWorkerRegistration | null) => {
    if (!nextRegistration) {
      return;
    }

    setRegistration(nextRegistration);
    setHasWaitingServiceWorker(Boolean(nextRegistration.waiting));
  }, []);

  const resolveRegistration = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isServiceWorkerSupported()) {
      return null;
    }

    if (registration) {
      syncRegistrationState(registration);
      return registration;
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      syncRegistrationState(existingRegistration);
      return existingRegistration;
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

  const hardReloadToLatest = useCallback(() => {
    window.location.replace(buildCacheBustedUrl(window.location.href));
  }, []);

  const applyUpdate = useCallback(async () => {
    if (publishedVersion) {
      storePendingAppVersion(publishedVersion);
    }

    setIsApplyingUpdate(true);

    try {
      const activeRegistration = await resolveRegistration();

      if (activeRegistration) {
        try {
          await activeRegistration.update();
          syncRegistrationState(activeRegistration);
        } catch (error) {
          console.error('No se pudo forzar la descarga del nuevo service worker', error);
        }

        activeRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }

      await clearOriginCaches();
      clearAccessibleCookies();
      await clearIndexedDbDatabases();
      await unregisterAllServiceWorkers();
    } catch (error) {
      console.error('No se pudo aplicar la actualización de la aplicación', error);
    } finally {
      hardReloadToLatest();
    }
  }, [hardReloadToLatest, publishedVersion, resolveRegistration, syncRegistrationState]);

  useEffect(() => {
    const unsubscribe = AppVersionService.subscribeToAppVersionConfig((config) => {
      const nextPublishedVersion = normalizeAppVersion(config?.version);
      setPublishedVersion(nextPublishedVersion);
      setReleaseNotes(config?.releaseNotes?.trim() || '');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!publishedVersion) {
      return;
    }

    const pendingVersion = getPendingAppVersion();
    if (pendingVersion && pendingVersion === publishedVersion) {
      storeDeviceAppVersion(publishedVersion);
      clearPendingAppVersion();
      setDeviceVersion(publishedVersion);
      return;
    }

    if (deviceVersion) {
      return;
    }

    const hasServiceWorkerController =
      isServiceWorkerSupported() && Boolean(navigator.serviceWorker.controller);

    if (!hasServiceWorkerController && !hasWaitingServiceWorker) {
      storeDeviceAppVersion(publishedVersion);
      setDeviceVersion(publishedVersion);
    }
  }, [deviceVersion, hasWaitingServiceWorker, publishedVersion]);

  useEffect(() => {
    if (!publishedVersion) {
      return;
    }

    if (normalizeAppVersion(deviceVersion) !== publishedVersion) {
      void checkForUpdates();
    }
  }, [checkForUpdates, deviceVersion, publishedVersion]);

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
      if (isApplyingUpdateRef.current || hasReloadedRef.current) {
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

  const isUpdateAvailable = useMemo(
    () => hasWaitingServiceWorker || (Boolean(publishedVersion) && normalizeAppVersion(deviceVersion) !== publishedVersion),
    [deviceVersion, hasWaitingServiceWorker, publishedVersion]
  );

  return (
    <AppUpdateContext.Provider
      value={{
        isUpdateAvailable,
        isApplyingUpdate,
        publishedVersion,
        deviceVersion,
        releaseNotes,
        applyUpdate,
        checkForUpdates,
      }}
    >
      {children}
    </AppUpdateContext.Provider>
  );
};
