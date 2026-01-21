import { useState, useEffect, useCallback, useRef } from 'react';
import { UseExternalWindowOptions, UseExternalWindowReturn } from './types';
import { serializeWindowFeatures } from './windowFeatures';
import { setupPortalContainer } from './portalSetup';
import { resizeWindow, moveWindow, focusWindow, isFullscreenAvailable, requestFullscreen } from './windowManager';

export { serializeWindowFeatures } from './windowFeatures';

/**
 * A React hook for managing external windows in multiscreen UX applications.
 * Returns an HTML element reference that can be used with React's createPortal.
 * 
 * @param options - Configuration options for the external window
 * @returns An object containing the container reference and window controls
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { portalTarget, open, close, isOpen } = useExternalWindow({
 *     title: 'External Window',
 *     features: { width: 800, height: 600 }
 *   });
 *   
 *   return (
 *     <div>
 *       <button onClick={open}>Open Window</button>
 *       {portalTarget ? createPortal(<YourContent />, portalTarget) : null}
 *     </div>
 *   );
 * }
 * ```
 */
export function useExternalWindow(
  options: UseExternalWindowOptions = {}
): UseExternalWindowReturn {
  const {
    url = 'about:blank',
    features: rawFeatures = 'width=800,height=600,left=200,top=200',
    title = 'External Window',
    onOpen,
    onClose,
    styles,
    copyStyles = true,
  } = options;

  // Convert features object to string if needed
  const features = typeof rawFeatures === 'string' 
    ? rawFeatures 
    : serializeWindowFeatures(rawFeatures);

  // State for the portal target (triggers rerender when it changes)
  const [portalTarget, setPortalTarget] = useState<Element | DocumentFragment | null>(null);
  
  // State for tracking if window is open
  const [isOpen, setIsOpen] = useState(false);
  
  // Ref to store the external window object (doesn't trigger rerender)
  const externalWindowRef = useRef<Window | null>(null);
  
  // Ref to store the interval for checking if window is closed
  const checkWindowIntervalRef = useRef<number | null>(null);

  // Ref to store whether fullscreen API is available
  const canFullscreenRef = useRef<boolean>(false);

  /**
   * Open the external window
   */
  const open = useCallback(() => {
    // Don't open if already open
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      externalWindowRef.current.focus();
      return;
    }

    // Open new window
    const newWindow = window.open(url, '_blank', features);
    
    if (!newWindow) {
      console.error('Failed to open external window. It may have been blocked by a popup blocker.');
      return;
    }

    externalWindowRef.current = newWindow;

    // Setup function to create the portal container
    const setupWindow = () => {
      // Check if fullscreen API is available
      canFullscreenRef.current = isFullscreenAvailable(newWindow);

      // Setup portal with styles and shadow DOM
      const { portalContainer } = setupPortalContainer(
        newWindow,
        title,
        styles,
        copyStyles
      );

      // Update state with portal target reference (triggers rerender)
      setPortalTarget(portalContainer);
      setIsOpen(true);

      // Call onOpen callback
      onOpen?.(newWindow);
    };

    // For about:blank, the document is immediately ready
    // For other URLs, we need to wait for the load event
    if (newWindow.document.readyState === 'complete' || url === 'about:blank') {
      // Document is ready, set up immediately
      setupWindow();
    } else {
      // Wait for window to load
      newWindow.addEventListener('load', setupWindow);
    }

    // Poll to check if window is closed
    checkWindowIntervalRef.current = window.setInterval(() => {
      if (newWindow.closed) {
        handleWindowClose();
      }
    }, 500);
  }, [url, features, title, styles, copyStyles, onOpen]);

  /**
   * Close the external window
   */
  const close = useCallback(() => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      externalWindowRef.current.close();
    }
    handleWindowClose();
  }, []);

  /**
   * Resize the external window
   */
  const resize = useCallback((width: number, height: number) => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      resizeWindow(externalWindowRef.current, width, height);
    }
  }, []);

  /**
   * Move the external window to a new position
   */
  const move = useCallback((left: number, top: number) => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      moveWindow(externalWindowRef.current, left, top);
    }
  }, []);

  /**
   * Focus the external window (bring it to front)
   */
  const focus = useCallback(() => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      focusWindow(externalWindowRef.current);
    }
  }, []);

  /**
   * Request fullscreen mode for the external window
   * Returns true if fullscreen was requested, false if API is unavailable or failed
   */
  const fullscreen = useCallback(async (): Promise<boolean> => {
    if (!externalWindowRef.current || externalWindowRef.current.closed) {
      return false;
    }

    return requestFullscreen(externalWindowRef.current);
  }, []);

  /**
   * Handle window close (cleanup)
   */
  const handleWindowClose = useCallback(() => {
    // Clear interval
    if (checkWindowIntervalRef.current !== null) {
      window.clearInterval(checkWindowIntervalRef.current);
      checkWindowIntervalRef.current = null;
    }

    // Update state (triggers rerender)
    setPortalTarget(null);
    setIsOpen(false);
    
    // Clear window ref
    externalWindowRef.current = null;

    // Call onClose callback
    onClose?.();
  }, [onClose]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  return {
    portalTarget,
    externalWindow: externalWindowRef.current,
    open,
    close,
    resize,
    move,
    focus,
    fullscreen,
    canFullscreen: canFullscreenRef.current,
    isOpen,
  };
}
