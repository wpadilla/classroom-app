import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { BottomDrawer } from '../mobile/BottomDrawer';
import { useIsMobile } from '../../hooks/useMediaQuery';

/**
 * Dialog Component
 * 
 * Responsive dialog wrapper that automatically renders:
 * - Reactstrap Modal on desktop (>= 768px)
 * - BottomDrawer on mobile (< 768px)
 * 
 * Provides a unified API for both variants, handling responsive behavior
 * automatically based on viewport size.
 * 
 * @example
 * ```tsx
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <p>Are you sure you want to continue?</p>
 *   <div className="d-flex gap-2 justify-content-end mt-3">
 *     <Button color="secondary" onClick={onClose}>Cancel</Button>
 *     <Button color="primary" onClick={handleConfirm}>Confirm</Button>
 *   </div>
 * </Dialog>
 * ```
 */

export interface DialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Dialog title */
  title?: string;
  
  /** Dialog content */
  children: React.ReactNode;
  
  /** Optional footer content (buttons, actions) */
  footer?: React.ReactNode;
  
  /** Size of dialog (desktop only) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Make dialog fullscreen on mobile */
  fullScreen?: boolean;
  
  /** Additional CSS classes for dialog content */
  className?: string;
  
  /** Hide close button (user must use onClose callback) */
  hideCloseButton?: boolean;
  
  /** Disable backdrop click to close */
  disableBackdropClose?: boolean;
  
  /** Center dialog vertically (desktop only) */
  centered?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  fullScreen = false,
  className = '',
  hideCloseButton = false,
  disableBackdropClose = false,
  centered = true,
}) => {
  const isMobile = useIsMobile();

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!disableBackdropClose) {
      onClose();
    }
  };

  // Mobile: Render BottomDrawer
  if (isMobile) {
    return (
      <BottomDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        height={fullScreen ? 'full' : 'auto'}
        hideCloseButton={hideCloseButton}
        className={className}
      >
        <div className="p-3">
          {children}
        </div>
        
        {footer && (
          <div 
            className="border-top p-3 bg-white"
            style={{
              position: 'sticky',
              bottom: 0,
              marginTop: 'auto',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            {footer}
          </div>
        )}
      </BottomDrawer>
    );
  }

  // Desktop: Render Reactstrap Modal
  return (
    <Modal
      isOpen={isOpen}
      toggle={disableBackdropClose ? undefined : handleBackdropClick}
      size={size}
      centered={centered}
      backdrop={disableBackdropClose ? 'static' : true}
      keyboard={!disableBackdropClose}
      className={className}
    >
      {title && (
        <ModalHeader toggle={hideCloseButton ? undefined : onClose}>
          {title}
        </ModalHeader>
      )}
      
      <ModalBody>
        {children}
      </ModalBody>
      
      {footer && (
        <ModalFooter>
          {footer}
        </ModalFooter>
      )}
    </Modal>
  );
};

export default Dialog;
