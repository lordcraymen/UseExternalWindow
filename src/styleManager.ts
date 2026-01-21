/**
 * Utility functions for managing styles in external windows and shadow roots
 */

/**
 * Copy styles from parent window to external window
 */
export function copyStylesToWindow(externalWindow: Window): void {
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
}

/**
 * Copy styles into shadow root for encapsulated styling
 */
export function copyStylesIntoShadowRoot(shadowRoot: ShadowRoot): void {
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
}

/**
 * Inject custom styles into the external window
 */
export function injectCustomStyles(externalWindow: Window, customStyles?: string): void {
  if (!customStyles) return;

  const style = externalWindow.document.createElement('style');
  style.textContent = customStyles;
  externalWindow.document.head.appendChild(style);
}

/**
 * Inject custom styles into shadow root
 */
export function injectCustomStylesToShadowRoot(shadowRoot: ShadowRoot, customStyles?: string): void {
  if (!customStyles) return;

  const style = shadowRoot.ownerDocument.createElement('style');
  style.textContent = customStyles;
  shadowRoot.appendChild(style);
}
