import React from 'react';
import { toast } from 'react-toastify';
import { usePwaInstall } from '../../contexts/PwaInstallContext';

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { canInstall, promptInstall } = usePwaInstall();
  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    const outcome = await promptInstall();

    if (outcome === 'dismissed') {
      toast.info('Puedes instalar la app más adelante desde este mismo botón.');
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleInstall()}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 ${className}`.trim()}
        title="Instalar aplicación"
        aria-label="Instalar aplicación"
      >
        <i className="bi bi-download text-sm"></i>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className={`inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 ${className}`.trim()}
    >
      <i className="bi bi-download"></i>
      Instalar app
    </button>
  );
};

export default PWAInstallButton;
