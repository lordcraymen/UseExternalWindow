import React, { createContext, ReactNode } from 'react';
import type { ExternalWindowContextValue } from './types';

/**
 * React Context for external window controls.
 * Allows components rendered in the portal to control the window they're in.
 * 
 * @example
 * ```tsx
 * // Inside a component rendered via createPortal to the external window:
 * function ExternalWindowContent() {
 *   const { close } = useExternalWindowContext();
 *   return <button onClick={close}>Redock</button>;
 * }
 * ```
 */
export const ExternalWindowContext = createContext<ExternalWindowContextValue | null>(null);

/**
 * Provider component that makes window controls available to children.
 * Wrap your portal content with this provider.
 */
export function ExternalWindowProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ExternalWindowContextValue;
}) {
  return (
    <ExternalWindowContext.Provider value={value}>
      {children}
    </ExternalWindowContext.Provider>
  );
}

/**
 * Hook to access external window controls from within the portal.
 * Must be used within an ExternalWindowProvider.
 * 
 * @returns The external window context value with control functions
 * @throws Error if used outside of ExternalWindowProvider
 * 
 * @example
 * ```tsx
 * function MyExternalContent() {
 *   const { close, resize, focus } = useExternalWindowContext();
 *   return (
 *     <div>
 *       <button onClick={() => resize(800, 600)}>Fit</button>
 *       <button onClick={() => close()}>Close Window</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useExternalWindowContext(): ExternalWindowContextValue {
  const context = React.useContext(ExternalWindowContext);
  if (!context) {
    throw new Error(
      'useExternalWindowContext must be used within an ExternalWindowProvider. ' +
      'Make sure to wrap your portal content with <ExternalWindowProvider value={...}>'
    );
  }
  return context;
}
