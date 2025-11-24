import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

const PWAInstallPrompt: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);

      checkShowPrompt();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        // Already installed
        return;
    }

    // Development simulation
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        console.log('Simulating beforeinstallprompt for development');
        const mockEvent = {
          preventDefault: () => {},
          prompt: () => {
            const accepted = window.confirm("Development Mode: Install this app?\n\nClick OK to simulate 'accepted', Cancel for 'dismissed'.");
            (mockEvent as any)._userOutcome = accepted ? 'accepted' : 'dismissed';
          },
          userChoice: {
            then: (resolve: any) => {
              const outcome = (mockEvent as any)._userOutcome || 'dismissed';
              resolve({ outcome });
            }
          }
        };
        handleBeforeInstallPrompt(mockEvent as unknown as Event);
      }, 2000); // Wait 2 seconds to simulate loading

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // User accepted the install prompt
    } else {
      // User dismissed the install prompt
    }

    // We no longer need the prompt. Clear it to avoid multiple clicks.
    setDeferredPrompt(null);
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

  if (!modalOpen || !deferredPrompt) return null;

  return (
    <Modal isOpen={modalOpen} toggle={handleClose} centered>
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
