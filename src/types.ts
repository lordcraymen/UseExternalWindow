export interface WindowFeatures {
  /**
   * Window width in pixels
   */
  width?: number;
  
  /**
   * Window height in pixels
   */
  height?: number;
  
  /**
   * Distance from left edge of screen in pixels
   */
  left?: number;
  
  /**
   * Distance from top edge of screen in pixels
   */
  top?: number;
  
  /**
   * Whether to display the menu bar
   */
  menubar?: boolean | 'yes' | 'no';
  
  /**
   * Whether to display the toolbar
   */
  toolbar?: boolean | 'yes' | 'no';
  
  /**
   * Whether to display the location bar
   */
  location?: boolean | 'yes' | 'no';
  
  /**
   * Whether to display the status bar
   */
  status?: boolean | 'yes' | 'no';
  
  /**
   * Whether the window is resizable
   */
  resizable?: boolean | 'yes' | 'no';
  
  /**
   * Whether to display scrollbars
   */
  scrollbars?: boolean | 'yes' | 'no';
}

export interface UseExternalWindowOptions {
  /**
   * The URL to load in the external window (defaults to 'about:blank')
   */
  url?: string;
  
  /**
   * Window features as an object or string (e.g., { width: 800, height: 600 } or 'width=800,height=600')
   */
  features?: WindowFeatures | string;
  
  /**
   * Window title
   */
  title?: string;
  
  /**
   * Callback when window is opened
   */
  onOpen?: (window: Window) => void;
  
  /**
   * Callback when window is closed
   */
  onClose?: () => void;
  
  /**
   * CSS styles to inject into the external window
   */
  styles?: string;
  
  /**
   * Whether to copy parent window styles to external window
   */
  copyStyles?: boolean;
}

export interface UseExternalWindowReturn {
  /**
   * Portal target element - use with createPortal(children, portalTarget)
   * null when window is closed, valid portal target when open
   */
  portalTarget: Element | DocumentFragment | null;
  
  /**
   * Reference to the external window object
   */
  externalWindow: Window | null;
  
  /**
   * Open the external window
   */
  open: () => void;
  
  /**
   * Close the external window
   */
  close: () => void;
  
  /**
   * Resize the external window
   */
  resize: (width: number, height: number) => void;
  
  /**
   * Move the external window to a new position
   */
  move: (left: number, top: number) => void;
  
  /**
   * Focus the external window (bring it to front)
   */
  focus: () => void;
  
  /**
   * Whether the external window is currently open
   */
  isOpen: boolean;
}

  /**
   * Context value type for accessing external window controls from within the portal
   */
  export interface ExternalWindowContextValue {
    close: () => void;
    move: (left: number, top: number) => void;
    resize: (width: number, height: number) => void;
    focus: () => void;
    externalWindow: Window | null;
  }
