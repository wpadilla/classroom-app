import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { usePwaInstall } from '../../contexts/PwaInstallContext';

const PWAInstallPrompt: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();

  useEffect(() => {
    if (!canInstall || isInstalled) {
      setModalOpen(false);
      return;
    }

    checkShowPrompt();
  }, [canInstall, isInstalled]);

  const checkShowPrompt = () => {
      const lastShownDate = localStorage.getItem('pwaPromptLastShown');
      const daysInterval = 4;

      if (!lastShownDate) {
          setModalOpen(true);
          return;
      }

      const lastShown = new Date(lastShownDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastShown.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= daysInterval) {
          setModalOpen(true);
      }
  };

  const handleInstallClick = async () => {
    const outcome = await promptInstall();

    if (outcome === 'accepted') {
      // User accepted the install prompt
    } else {
      // User dismissed the install prompt
    }

    setModalOpen(false);

    // If they dismiss, we record the date so we don't show it for another X days.
    // If they accept, the app will likely restart or open in standalone mode,
    // but recording it doesn't hurt.
    localStorage.setItem('pwaPromptLastShown', new Date().toISOString());
  };

  const handleClose = () => {
      setModalOpen(false);
      localStorage.setItem('pwaPromptLastShown', new Date().toISOString());
  };

  if (!modalOpen || !canInstall || isInstalled) return null;

  return (
    <Modal isOpen={modalOpen} toggle={handleClose} centered backdrop="static">
      <ModalHeader toggle={handleClose}>Instalar Aplicación</ModalHeader>
      <ModalBody>
        <p>
          Instala nuestra aplicación para una mejor experiencia.
          Podrás acceder más rápido y usarla sin conexión.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          Más tarde
        </Button>
        <Button color="primary" onClick={handleInstallClick}>
          Instalar Ahora
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PWAInstallPrompt;
