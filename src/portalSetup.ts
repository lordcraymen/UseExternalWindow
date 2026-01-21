import { copyStylesToWindow, injectCustomStyles, copyStylesIntoShadowRoot, injectCustomStylesToShadowRoot } from './styleManager';

/**
 * Interface for portal setup result
 */
export interface PortalSetupResult {
  portalContainer: Element;
  shadowRoot: ShadowRoot;
}

/**
 * Setup the portal container with shadow DOM encapsulation
 */
export function setupPortalContainer(
  externalWindow: Window,
  title: string,
  styles?: string,
  copyStyles: boolean = true
): PortalSetupResult {
  // Set title
  externalWindow.document.title = title;

  // Copy styles from parent window
  copyStylesToWindow(externalWindow);

  // Inject custom styles into main window
  injectCustomStyles(externalWindow, styles);

  // Create a host element in the body and attach a shadow root
  // This provides encapsulation so external scripts can't interfere with React content
  const host = externalWindow.document.createElement('div');
  host.id = 'react-portal-host';
  const shadowRoot = host.attachShadow({ mode: 'open' });
  externalWindow.document.body.appendChild(host);

  // Copy styles into the shadow root so they're available to React content
  if (copyStyles) {
    copyStylesIntoShadowRoot(shadowRoot);
  }

  // Inject custom styles into shadow root
  injectCustomStylesToShadowRoot(shadowRoot, styles);

  // Use shadow root as the portal container
  const container = shadowRoot as unknown as Element;

  return { portalContainer: container, shadowRoot };
}
