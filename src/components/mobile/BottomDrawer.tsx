import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from 'reactstrap';

/**
 * BottomDrawer Component
 * 
 * iOS-style bottom sheet for mobile interfaces.
 * Features:
 * - Slide-up animation with spring physics
 * - Drag-to-dismiss with velocity threshold
 * - Backdrop click to close
 * - Escape key to close
 * - Safe area insets for iPhone notch
 * - Auto-focus trap
 * 
 * @example
 * ```tsx
 * <BottomDrawer
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirmation"
 * >
 *   <p>Are you sure you want to continue?</p>
 * </BottomDrawer>
 * ```
 */

export interface BottomDrawerProps {
  /** Controls drawer visibility */
  isOpen: boolean;
  
  /** Callback when drawer should close */
  onClose: () => void;
  
  /** Optional title displayed in header */
  title?: string;
  
  /** Drawer content */
  children: React.ReactNode;
  
  /** Height mode: 'auto' (content-based) or 'full' (90vh) */
  height?: 'auto' | 'full';
  
  /** Hide close button (user must use onClose prop) */
  hideCloseButton?: boolean;
  
  /** Additional CSS classes for drawer content */
  className?: string;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  hideCloseButton = false,
  className = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap - focus drawer when opened
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  /**
   * Handle drag end - close drawer if dragged down with sufficient velocity
   */
  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldClose = info.velocity.y > 500 || info.offset.y > 150;
    if (shouldClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="position-fixed top-0 start-0 w-100 h-100 bg-black"
            style={{
              zIndex: 1050,
              opacity: 0.5,
            }}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`position-fixed start-0 w-100 bg-white ${className}`}
            style={{
              bottom: 0,
              zIndex: 1051,
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
              maxHeight: height === 'full' ? '90vh' : 'auto',
              // GPU acceleration
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
          >
            {/* Drag Handle */}
            <div 
              className="d-flex justify-content-center pt-2 pb-2"
              style={{ cursor: 'grab' }}
            >
              <div
                className="bg-secondary rounded-pill"
                style={{
                  width: '40px',
                  height: '4px',
                  opacity: 0.3,
                }}
              />
            </div>

            {/* Header */}
            {(title || !hideCloseButton) && (
              <div 
                className="d-flex align-items-center justify-content-between px-3 pb-3 border-bottom"
                style={{ minHeight: '48px' }}
              >
                {title && (
                  <h5 
                    id="drawer-title" 
                    className="mb-0 fw-bold"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    {title}
                  </h5>
                )}
                {!hideCloseButton && (
                  <Button
                    close
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                      position: title ? 'absolute' : 'relative',
                      right: title ? '1rem' : 'auto',
                      fontSize: '1.5rem',
                    }}
                  />
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-auto"
              style={{
                maxHeight: height === 'full' ? 'calc(90vh - 80px)' : '70vh',
                // Safe area insets for iPhone notch
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawer;
