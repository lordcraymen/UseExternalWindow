# Fullscreen API Example

The `useExternalWindow` hook now includes a `fullscreen()` method that requests fullscreen mode for the external window.

## Features

- **Graceful degradation**: Returns `false` if the fullscreen API is not available (e.g., on mobile Safari)
- **Vendor prefix support**: Automatically handles webkit, moz, and ms prefixes
- **Error handling**: Catches fullscreen request denials and other errors
- **Async**: Returns a Promise that resolves to a boolean

## Usage

```tsx
import { useExternalWindow } from './src/useExternalWindow';
import { createPortal } from 'react-dom';

function MyComponent() {
  const { 
    portalTarget, 
    open, 
    close, 
    isOpen,
    fullscreen 
  } = useExternalWindow({
    title: 'My External Window',
    features: { width: 1920, height: 1080 }
  });

  const handleFullscreen = async () => {
    const isFullscreen = await fullscreen();
    if (isFullscreen) {
      console.log('Fullscreen mode activated');
    } else {
      console.log('Fullscreen API not available or request denied');
    }
  };

  return (
    <div>
      <button onClick={open}>Open Window</button>
      <button onClick={handleFullscreen}>Go Fullscreen</button>
      <button onClick={close}>Close Window</button>
      
      {portalTarget && createPortal(
        <div>External Window Content</div>,
        portalTarget
      )}
    </div>
  );
}
```

## With Context

You can also use fullscreen through the context provider:

```tsx
import { ExternalWindowProvider, useExternalWindowContext } from './src/ExternalWindowContext';

function WindowControls() {
  const { fullscreen } = useExternalWindowContext();
  
  return (
    <button onClick={async () => {
      const success = await fullscreen();
      console.log(success ? 'Fullscreen enabled' : 'Fullscreen not available');
    }}>
      Fullscreen
    </button>
  );
}

function MyApp() {
  const window = useExternalWindow();
  
  return (
    <ExternalWindowProvider value={window}>
      {/* Portal content and controls */}
    </ExternalWindowProvider>
  );
}
```

## Browser Support

The method supports:
- Standard `requestFullscreen()` (modern browsers)
- `webkitRequestFullscreen()` (Safari, older Chrome/Edge)
- `mozRequestFullScreen()` (Firefox)
- `msRequestFullscreen()` (Internet Explorer/older Edge)

## Return Value

- **`true`**: Fullscreen request was successful
- **`false`**: API not available, request denied, or window is closed

## Notes

- The fullscreen request requires user input (click, tap, etc.) - it cannot be called programmatically without user interaction
- Mobile Safari doesn't support fullscreen for external windows
- Some browsers may require permissions or show confirmation dialogs
