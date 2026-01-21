/**
 * Utility functions for window control operations
 */

/**
 * Resize the external window
 */
export function resizeWindow(externalWindow: Window, width: number, height: number): void {
  if (externalWindow && !externalWindow.closed) {
    try {
      externalWindow.resizeTo(width, height);
    } catch (e) {
      console.warn('Could not resize external window:', e);
    }
  }
}

/**
 * Move the external window to a new position
 */
export function moveWindow(externalWindow: Window, left: number, top: number): void {
  if (externalWindow && !externalWindow.closed) {
    try {
      externalWindow.moveTo(left, top);
    } catch (e) {
      console.warn('Could not move external window:', e);
    }
  }
}

/**
 * Focus the external window (bring it to front)
 */
export function focusWindow(externalWindow: Window): void {
  if (externalWindow && !externalWindow.closed) {
    try {
      externalWindow.focus();
    } catch (e) {
      console.warn('Could not focus external window:', e);
    }
  }
}

/**
 * Check if fullscreen API is available in the external window
 */
export function isFullscreenAvailable(externalWindow: Window): boolean {
  const docEl = externalWindow.document.documentElement;
  return !!(
    docEl.requestFullscreen ||
    (docEl as any).webkitRequestFullscreen ||
    (docEl as any).mozRequestFullScreen ||
    (docEl as any).msRequestFullscreen
  );
}

/**
 * Request fullscreen mode for the external window
 * Returns true if fullscreen was requested, false if API is unavailable or failed
 */
export async function requestFullscreen(externalWindow: Window): Promise<boolean> {
  if (!externalWindow || externalWindow.closed) {
    return false;
  }

  try {
    const doc = externalWindow.document;
    const docEl = doc.documentElement;

    // Check for various fullscreen API implementations (vendor prefixes)
    const requestFullscreenFn =
      docEl.requestFullscreen ||
      (docEl as any).webkitRequestFullscreen ||
      (docEl as any).mozRequestFullScreen ||
      (docEl as any).msRequestFullscreen;

    if (!requestFullscreenFn) {
      // Fullscreen API not supported on this device/browser
      return false;
    }

    // Call the appropriate fullscreen method
    await requestFullscreenFn.call(docEl);
    return true;
  } catch (e) {
    // Fullscreen request denied or failed
    console.warn('Could not request fullscreen for external window:', e);
    return false;
  }
}
