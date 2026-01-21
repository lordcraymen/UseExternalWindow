# useExternalWindow

A React hook for managing external windows in multiscreen UX applications. Perfect for creating dashboard applications, multi-monitor setups, or any scenario where you need to render React components in separate browser windows.

## Features

- 🪟 **Easy window management** - Open, close, and manage external windows with a simple hook
- 🔄 **Reactive state** - Returns HTML element reference as state, triggering rerenders when windows open/close
- 🎨 **Style synchronization** - Automatically copies parent window styles or inject custom CSS
- 🎯 **Portal-ready** - Works seamlessly with React's `createPortal`
- 📦 **TypeScript support** - Full type definitions included
- ✅ **Well-tested** - Comprehensive unit tests with Vitest
- 🪶 **Lightweight** - Zero dependencies (besides React peer dependencies)

## Installation

```bash
npm install @your-scope/use-external-window
```

```bash
yarn add @your-scope/use-external-window
```

```bash
pnpm add @your-scope/use-external-window
```

## Usage

### Basic Example

```tsx
import { useExternalWindow } from '@your-scope/use-external-window';
import { createPortal } from 'react-dom';

function MyComponent() {
  const { portalTarget, open, close, isOpen } = useExternalWindow({
    title: 'My External Window',
    features: {
      width: 800,
      height: 600,
      left: 200,
      top: 200
    }
  });

  return (
    <div>
      <button onClick={open}>Open External Window</button>
      <button onClick={close} disabled={!isOpen}>
        Close External Window
      </button>
      
      {portalTarget && createPortal(
        <div>
          <h1>Hello from External Window!</h1>
          <p>This content is rendered in a separate window.</p>
        </div>,
        portalTarget
      )}
    </div>
  );
}
```

### Advanced Example with Callbacks

```tsx
import { useExternalWindow } from '@your-scope/use-external-window';
import { createPortal } from 'react-dom';

function Dashboard() {
  const { portalTarget, open, close, isOpen, externalWindow } = useExternalWindow({
    title: 'Dashboard Monitor 2',
    features: {
      width: 1920,
      height: 1080,
      left: 1920,
      top: 0,
      menubar: false,
      toolbar: false
    },
    copyStyles: true,
    styles: `
      body {
        margin: 0;
        padding: 20px;
        background: #1a1a1a;
        color: white;
      }
    `,
    onOpen: (win) => {
      console.log('External window opened:', win);
      // You can interact with the window object here
      win.moveTo(1920, 0);
    },
    onClose: () => {
      console.log('External window closed');
      // Cleanup or save state
    },
  });

  return (
    <div>
      <h1>Main Dashboard</h1>
      <button onClick={open}>
        {isOpen ? 'Focus External Monitor' : 'Open External Monitor'}
      </button>
      
      {portalTarget && createPortal(
        <MonitorContent />,
        portalTarget
      )}
    </div>
  );
}

function MonitorContent() {
  return (
    <div>
      <h1>External Monitor Content</h1>
      <p>This is rendered on the second screen</p>
    </div>
  );
}
```
{
      width: 1920,
      height: 1080,
      left: 0,
      top: 0
    }
  });
  
  const monitor2 = useExternalWindow({
    title: 'Monitor 2',
    features: {
      width: 1920,
      height: 1080,
      left: 1920,
      top: 0
    }
    title: 'Monitor 1',
    features: 'width=1920,height=1080,left=0,top=0',
  });
  
  const monitor2 = useExternalWindow({
    title: 'Monitor 2',
    features: 'width=1920,height=1080,left=1920,top=0',
  });

  return (
    <div>
      <button onClick={monitor1.open}>Open Monitor 1</button>
      <button onClick={monitor2.open}>Open Monitor 2</button>
      
      {monitor1.portalTarget && createPortal(
        <Screen1Content />,
        monitor1.portalTarget
      )}
      
      {monitor2.portalTarget && createPortal(
        <Screen2Content />,
        monitor2.portalTarget
      )}
    </div>
  );
}
```
WindowFeatures \| string` | `'width=800,height=600,left=200,top=200'` | Window features as object or
## API Reference

### `useExternalWindow(options?: UseExternalWindowOptions): UseExternalWindowReturn`

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'about:blank'` | The URL to load in the external window |
| `features` | `string` | `'width=800,height=600,left=200,top=200'` | Window features string (size, position, etc.) |
| `title` | `string` | `'External Window'` | Window title |
| `onOpen` | `(window: Window) => void` | `undefined` | Callback when window is opened |
| `onClose` | `() => void` | `undefined` | Callback when window is closed |
| `styles` | `string` | `undefined` | CSS styles to inject into the external window |
| `copyStyles` | `boolean` | `true` | Whether to copy parent window styles to external window |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `portalTarget` | `Element \| DocumentFragment \| null` | Portal target for `createPortal` - `null` when window is closed, valid target when open. This is **state**, so components rerender when it changes. |
| `externalWindow` | `Window \| null` | Reference to the external window object |
| `open` | `() => void` | Function to open the external window |
| `close` | `() => void` | Function to close the external window |
| `resize` | `(width: number, height: number) => void` | Resize the external window |
| `move` | `(left: number, top: number) => void` | Move the external window to a new position |
| `focus` | `() => void` | Focus the external window (bring it to front) |
| `isOpen` | `boolean` | Whether the external window is currently open |

## Window Features

The `features` option accepts either an object (`WindowFeatures`) or a string.

```tsx
const { open } = useExternalWindow({
  features: {
    width: 1920,
    height: 1080,
    left: 1920,
    top: 0,
    menubar: false,
    toolbar: false,
```tsx
const { open } = useExternalWindow({
  features: 'width=1920,height=1080,left=1920,top=0,menubar=no,toolbar=no'
});
```

### Common Options

- `width=800` - Window width in pixels
- `height=600` - Window height in pixels
### WindowFeatures Interface

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Window width in pixels |
| `height` | `number` | Window height in pixels |
| `left` | `number` | Distance from left edge of screen |
| `top` | `number` | Distance from top edge of screen |
| `menubar` | `boolean \| 'yes' \| 'no'` | Display menu bar |
| `toolbar` | `boolean \| 'yes' \| 'no'` | Display toolbar |
| `location` | `boolean \| 'yes' \| 'no'` | Display location bar |
| `status` | `boolean \| 'yes' \| 'no'` | Display status bar |
| `resizable` | `boolean \| 'yes' \| 'no'` | Allow window resizing |
| `scrollbars` | `boolean \| 'yes' \| 'no'` | Show scrollbars if content overflows |

### Using String (Legacy)

The `features` option also accepts a comma-separated string
|----------|------|-------------|
| `containerRef` | `HTMLElement \| null` | HTML element reference for `createPortal` - `null` when window is closed, valid element when open. This is **state**, so components rerender when it changes. |
| `externalWindow` | `Window \| null` | Reference to the external window object |
| `open` | `() => void` | Function to open the external window |
| `close` | `() => void` | Function to close the external window |
| `isOpen` | `boolean` | Whether the external window is currently open |

## Window Features

The `features` option accepts a comma-separated list of window features. Common options include:

- `width=800` - Window width in pixels
- `height=600` - Window height in pixels
- `left=200` - Distance from left edge of screen
- `top=200` - Distance from top edge of screen
- `menubar=no` - Hide menu bar
- `toolbar=no` - Hide toolbar
- `location=no` - Hide location bar
- `status=no` - Hide status bar
- `resizable=yes` - Allow window resizing
- `scrollbars=yes` - Show scrollbars if content overflows

Example:
```tsx
const { open } = useExternalWindow({
  features: 'width=1920,height=1080,left=1920,top=0,menubar=no,toolbar=no'
});
```

## Key Behaviors

### State Management
The `portalTarget` is returned as **state**, which means:
- When the window opens, `portalTarget` changes from `null` to a valid portal target
- When the window closes, `portalTarget` changes back to `null`
- These changes trigger component rerenders automatically
- Perfect for conditional rendering: `{portalTarget && createPortal(content, portalTarget)}`

### Window Lifecycle
- Opening an already-open window will focus it instead of opening a new one
- The hook automatically detects when users close the window manually
- Cleanup happens automatically when the component unmounts
- An interval checks every 500ms if the external window was closed by the user

### Style Synchronization
- By default (`copyStyles: true`), all parent window styles are copied to the external window
- This includes both linked stylesheets and inline styles
- Cross-origin stylesheets are safely ignored
- Custom styles can be injected via the `styles` option

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```
{
    width: 1920,
    height: 1080,
    left: secondMonitorX,
    top: 0
  }
### Test

```bash
npm test
```

### Test with UI

```bash
npm run test:ui
```

### Test Coverage

```bash
npm run test:coverage
```

## Browser Support

Works in all modern browsers that support:
- React 16.8+ (Hooks)
- `window.open()` API
- Not blocked by popup blockers (user interaction required)

## Common Issues

### Popup Blockers
External windows may be blocked by popup blockers. Always call `open()` in response to a user action (e.g., button click).

### Security Restrictions
If loading a URL with a different origin, some browser features may be restricted due to CORS policies.

### Multi-Monitor Positioning
The `left` and `top` features position the window relative to the primary monitor. For multi-monitor setups, you may need to calculate positions based on screen dimensions:

```tsx
const secondMonitorX = window.screen.width; // Assumes second monitor is to the right
const { open } = useExternalWindow({
  features: `width=1920,height=1080,left=${secondMonitorX},top=0`
});
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
