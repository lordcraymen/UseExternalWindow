import { useState, useEffect, useCallback, useRef } from 'react';
import { UseExternalWindowOptions, UseExternalWindowReturn, WindowFeatures } from './types';

/**
 * Convert WindowFeatures object to window.open() features string
 * @param features - WindowFeatures object
 * @returns Serialized features string
 */
export function serializeWindowFeatures(features: WindowFeatures): string {
  return Object.entries(features)
    .map(([key, value]) => {
      if (value === undefined || value === null) {
        return null;
      }
      
      // Convert boolean to yes/no string
      if (typeof value === 'boolean') {
        return `${key}=${value ? 'yes' : 'no'}`;
      }
      
      // Use value as-is for numbers and 'yes'/'no' strings
      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join(',');
}

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

  /**
   * Copy styles from parent window to external window
   */
  const copyStylesToWindow = useCallback((externalWindow: Window) => {
    if (!copyStyles) return;

    try {
      // Copy all stylesheet links
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = externalWindow.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            externalWindow.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = externalWindow.document.createElement('style');
            Array.from(styleSheet.cssRules).forEach((rule) => {
              style.appendChild(externalWindow.document.createTextNode(rule.cssText));
            });
            externalWindow.document.head.appendChild(style);
          }
        } catch (e) {
          // Cross-origin stylesheets will throw - safely ignore
          console.warn('Could not copy stylesheet:', e);
        }
      });
    } catch (e) {
      console.error('Error copying styles:', e);
    }
  }, [copyStyles]);

  /**
   * Copy styles into shadow root for encapsulated styling
   */
  const copyStylesIntoShadowRoot = useCallback((shadowRoot: ShadowRoot) => {
    try {
      // Copy all stylesheet links and inline styles into shadow root
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            shadowRoot.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = document.createElement('style');
            Array.from(styleSheet.cssRules).forEach((rule) => {
              style.appendChild(document.createTextNode(rule.cssText));
            });
            shadowRoot.appendChild(style);
          }
        } catch (e) {
          // Cross-origin stylesheets will throw - safely ignore
          console.warn('Could not copy stylesheet into shadow root:', e);
        }
      });
    } catch (e) {
      console.error('Error copying styles into shadow root:', e);
    }
  }, []);

  /**
   * Inject custom styles into the external window
   */
  const injectCustomStyles = useCallback((externalWindow: Window, customStyles?: string) => {
    if (!customStyles) return;

    const style = externalWindow.document.createElement('style');
    style.textContent = customStyles;
    externalWindow.document.head.appendChild(style);
  }, []);

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
    
    // Set isOpen immediately after window opens successfully
    // This must be outside the load event to avoid race conditions with about:blank
    setIsOpen(true);

    // Wait for window to load
    newWindow.addEventListener('load', () => {
      // Set title
      newWindow.document.title = title;

      // Copy styles from parent window
      copyStylesToWindow(newWindow);

      // Inject custom styles
      injectCustomStyles(newWindow, styles);

      // Create a host element in the body and attach a shadow root
      // This provides encapsulation so external scripts can't interfere with React content
      const host = newWindow.document.createElement('div');
      host.id = 'react-portal-host';
      const shadowRoot = host.attachShadow({ mode: 'open' });
      newWindow.document.body.appendChild(host);

      // Copy styles into the shadow root so they're available to React content
      if (copyStyles) {
        copyStylesIntoShadowRoot(shadowRoot);
      }
      if (styles) {
        const style = newWindow.document.createElement('style');
        style.textContent = styles;
        shadowRoot.appendChild(style);
      }

      // Use shadow root as the portal container
      const container = shadowRoot as unknown as Element;

      // Update state with portal target reference (triggers rerender)
      setPortalTarget(container);

      // Call onOpen callback
      onOpen?.(newWindow);
    });

    // Poll to check if window is closed
    checkWindowIntervalRef.current = window.setInterval(() => {
      if (newWindow.closed) {
        handleWindowClose();
      }
    }, 500);
  }, [url, features, title, styles, copyStyles, copyStylesToWindow, injectCustomStyles, copyStylesIntoShadowRoot, onOpen]);

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
      try {
        externalWindowRef.current.resizeTo(width, height);
      } catch (e) {
        console.warn('Could not resize external window:', e);
      }
    }
  }, []);

  /**
   * Move the external window to a new position
   */
  const move = useCallback((left: number, top: number) => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      try {
        externalWindowRef.current.moveTo(left, top);
      } catch (e) {
        console.warn('Could not move external window:', e);
      }
    }
  }, []);

  /**
   * Focus the external window (bring it to front)
   */
  const focus = useCallback(() => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      try {
        externalWindowRef.current.focus();
      } catch (e) {
        console.warn('Could not focus external window:', e);
      }
    }
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
    isOpen,
  };
}
