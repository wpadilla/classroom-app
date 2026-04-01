import {
  APP_UPDATE_CACHE_BUST_PARAM,
  DEVICE_APP_VERSION_STORAGE_KEY,
  PENDING_APP_VERSION_STORAGE_KEY,
} from '../constants/appUpdate.constants';

export const normalizeAppVersion = (value?: string | null): string =>
  value?.trim() || '';

export const getStoredDeviceAppVersion = (): string =>
  normalizeAppVersion(localStorage.getItem(DEVICE_APP_VERSION_STORAGE_KEY));

export const storeDeviceAppVersion = (version: string): void => {
  localStorage.setItem(DEVICE_APP_VERSION_STORAGE_KEY, normalizeAppVersion(version));
};

export const getPendingAppVersion = (): string =>
  normalizeAppVersion(sessionStorage.getItem(PENDING_APP_VERSION_STORAGE_KEY));

export const storePendingAppVersion = (version: string): void => {
  sessionStorage.setItem(PENDING_APP_VERSION_STORAGE_KEY, normalizeAppVersion(version));
};

export const clearPendingAppVersion = (): void => {
  sessionStorage.removeItem(PENDING_APP_VERSION_STORAGE_KEY);
};

export const buildCacheBustedUrl = (currentUrl: string): string => {
  const url = new URL(currentUrl, window.location.origin);
  url.searchParams.set(APP_UPDATE_CACHE_BUST_PARAM, `${Date.now()}`);
  return url.toString();
};

export const clearOriginCaches = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
};

export const clearAccessibleCookies = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter(Boolean);

  const hostname = window.location.hostname;
  const hostnameParts = hostname.split('.');
  const rootDomain =
    hostnameParts.length > 2 ? `.${hostnameParts.slice(-2).join('.')}` : `.${hostname}`;

  cookieNames.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain}`;
  });
};

export const clearIndexedDbDatabases = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return;
  }

  const indexedDbFactory = window.indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string }>>;
  };

  if (typeof indexedDbFactory.databases !== 'function') {
    return;
  }

  try {
    const databases = await indexedDbFactory.databases();
    await Promise.all(
      databases
        .map((database) => database.name)
        .filter((databaseName): databaseName is string => Boolean(databaseName))
        .map(
          (databaseName) =>
            new Promise<void>((resolve) => {
              const deleteRequest = indexedDbFactory.deleteDatabase(databaseName);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => resolve();
              deleteRequest.onblocked = () => resolve();
            })
        )
    );
  } catch (error) {
    console.warn('No se pudieron limpiar las bases IndexedDB durante la actualización', error);
  }
};

export const unregisterAllServiceWorkers = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};
