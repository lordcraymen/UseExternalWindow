import React from 'react';
import { createPortal } from 'react-dom';
import { useExternalWindow } from '../useExternalWindow';
import { ExternalWindowProvider, useExternalWindowContext } from '../ExternalWindowContext';

/**
 * Example component demonstrating basic usage of useExternalWindow
 */
export function BasicExample() {
  const { portalTarget, open, close, isOpen } = useExternalWindow({
    title: 'My External Window',
    features: {
      width: 800,
      height: 600
    }
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Basic Example</h1>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={open}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          {isOpen ? 'Focus External Window' : 'Open External Window'}
        </button>
        <button 
          onClick={close}
          disabled={!isOpen}
          style={{ padding: '10px 20px' }}
        >
          Close External Window
        </button>
      </div>
      
      {portalTarget && createPortal(
        <div style={{ padding: '20px' }}>
          <h1>Hello from External Window!</h1>
          <p>This content is rendered in a separate window.</p>
          <button onClick={close}>Close This Window</button>
        </div>,
        portalTarget
      )}
    </div>
  );
}

  /**
   * Example component demonstrating using ExternalWindowContext to access controls
   * from within the portal content (e.g., undock/redock buttons inside the window)
   */
  export function ContextExample() {
    const { portalTarget, open, close, isOpen, resize, move, focus, fullscreen, canFullscreen, externalWindow } = useExternalWindow({
      title: 'Undockable Window',
      features: {
        width: 600,
        height: 400,
        left: 300,
        top: 300
      }
    });

    return (
      <div style={{ padding: '20px' }}>
        <h1>Context Example</h1>
        <p>Click "Open" to undock this section into a separate window.</p>
        <p>Notice the "Redock" button lives inside the external window - it can call close()!</p>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={open}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            {isOpen ? '✓ Open in Window' : 'Undock to Window'}
          </button>
          <span style={{ marginLeft: '10px' }}>
            Status: {isOpen ? '🪟 Undocked' : '📦 Docked'}
          </span>
        </div>
      
        {portalTarget && createPortal(
          <ExternalWindowProvider value={{ close, resize, move, focus, fullscreen, canFullscreen, externalWindow }}>
            <UndockableContent />
          </ExternalWindowProvider>,
          portalTarget
        )}
      </div>
    );
  }

  /**
   * Content that lives inside the external window and uses useExternalWindowContext
   * to access window controls like close/resize
   */
  function UndockableContent() {
    const { close, resize } = useExternalWindowContext();
    const [isDark, setIsDark] = React.useState(false);

    return (
      <div 
        style={{
          padding: '30px',
          background: isDark ? '#1e1e1e' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <h1>Undocked Content</h1>
        <p>This content is running in a separate window.</p>
        <p>The buttons below call functions from the hook - they live in the portal!</p>
      
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => close()}
            style={{
              padding: '10px 20px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔗 Redock Window
          </button>
        
          <button 
            onClick={() => resize(800, 600)}
            style={{
              padding: '10px 20px',
              background: '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📐 Resize to 800x600
          </button>
        
          <button 
            onClick={() => resize(1200, 800)}
            style={{
              padding: '10px 20px',
              background: '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🖥️ Fullscreen-ish
          </button>
        
          <button 
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: '10px 20px',
              background: isDark ? '#ffaa00' : '#444444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    );
  }
/**
 * Example component demonstrating advanced usage with styling and callbacks
 */
export function AdvancedExample() {
  const [openCount, setOpenCount] = React.useState(0);
  const [closeCount, setCloseCount] = React.useState(0);

  const { portalTarget, open, close, isOpen } = useExternalWindow({
    title: 'Styled External Window',
    features: {
      width: 1000,
      height: 700,
      left: 200,
      top: 100,
      menubar: false,
      toolbar: false
    },
    copyStyles: true,
    styles: `
      body {
        margin: 0;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
      }
    `,
    onOpen: (win: Window) => {
      console.log('Window opened:', win);
      setOpenCount(prev => prev + 1);
    },
    onClose: () => {
      console.log('Window closed');
      setCloseCount(prev => prev + 1);
    },
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Advanced Example</h1>
      <p>Opens: {openCount} | Closes: {closeCount}</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={open}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Open Styled Window
        </button>
        <button 
          onClick={close}
          disabled={!isOpen}
          style={{ padding: '10px 20px' }}
        >
          Close Window
        </button>
      </div>
      
      {portalTarget && createPortal(
        <div>
          <h1>Styled External Window</h1>
          <p>This window has custom styling applied!</p>
          <ul>
            <li>Gradient background</li>
            <li>Custom colors</li>
            <li>Parent styles copied</li>
          </ul>
          <button 
            onClick={close}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Close This Window
          </button>
        </div>,
        portalTarget
      )}
    </div>
  );
}

/**
 * Example component demonstrating fullscreen API
 */
export function FullscreenExample() {
  const { portalTarget, open, close, isOpen, resize, move, focus, fullscreen, canFullscreen, externalWindow } = useExternalWindow({
    title: 'Fullscreen Window',
    features: {
      width: 800,
      height: 600,
      left: 200,
      top: 200
    }
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Fullscreen Example</h1>
      <p>Demonstrates the fullscreen API - gracefully handles devices that don't support it.</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={open}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          {isOpen ? 'Focus Window' : 'Open Window'}
        </button>
        <button 
          onClick={close}
          disabled={!isOpen}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Close Window
        </button>
      </div>
      
      {portalTarget && createPortal(
        <ExternalWindowProvider value={{ close, resize, move, focus, fullscreen, canFullscreen, externalWindow }}>
          <FullscreenContent onClose={close} canFullscreen={canFullscreen} />
        </ExternalWindowProvider>
        ,
        portalTarget
      )}
    </div>
  );
}

function FullscreenContent({ onClose, canFullscreen }: { onClose: () => void; canFullscreen: boolean }) {
  const { fullscreen, externalWindow } = useExternalWindowContext();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  React.useEffect(() => {
    if (!externalWindow) return;
    
    const handleFullscreenChange = () => {
      const doc = externalWindow.document as any;
      const isInFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isInFullscreen);
    };
    
    externalWindow.document.addEventListener('fullscreenchange', handleFullscreenChange);
    externalWindow.document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    externalWindow.document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    externalWindow.document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      externalWindow.document.removeEventListener('fullscreenchange', handleFullscreenChange);
      externalWindow.document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      externalWindow.document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      externalWindow.document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [externalWindow]);
  
  const handleToggleFullscreen = async () => {
    if (isFullscreen) {
      // Exit fullscreen
      const doc = externalWindow?.document as any;
      if (doc) {
        const exitFullscreen = 
          doc.exitFullscreen ||
          doc.webkitExitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.msExitFullscreen;
        
        if (exitFullscreen) {
          try {
            await exitFullscreen.call(doc);
          } catch (err) {
            console.warn('Failed to exit fullscreen:', err);
          }
        }
      }
    } else {
      // Enter fullscreen
      await fullscreen();
    }
  };
  
  return (
    <div 
      style={{
        padding: '30px',
        background: '#1a1a1a',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div>
        <h1>Fullscreen Window</h1>
        <p>This window has fullscreen support!</p>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          Note: Fullscreen requires user interaction and may not be supported on all devices 
          (e.g., mobile Safari). The fullscreen() method gracefully returns false if unavailable.
        </p>
        {isFullscreen && (
          <p style={{ fontSize: '14px', color: '#4CAF50', marginTop: '10px' }}>
            ✓ Currently in fullscreen mode
          </p>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {canFullscreen && (
          <button 
            onClick={handleToggleFullscreen}
            style={{
              padding: '10px 20px',
              background: isFullscreen ? '#FF9800' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {isFullscreen ? '🔻 Exit Fullscreen' : '🖥️ Go Fullscreen'}
          </button>
        )}
        
        {!canFullscreen && (
          <div style={{ padding: '10px 20px', color: '#aaa', fontSize: '14px' }}>
            Fullscreen API not available on this device
          </div>
        )}
        
        <button 
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

/**
 * Example component demonstrating multi-window setup
 */
export function MultiWindowExample() {
  const monitor1 = useExternalWindow({
    title: 'Monitor 1',
    features: {
      width: 800,
      height: 600,
      left: 100,
      top: 100
    }
  });
  
  const monitor2 = useExternalWindow({
    title: 'Monitor 2',
    features: {
      width: 800,
      height: 600,
      left: 950,
      top: 100
    }
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Multi-Window Example</h1>
      <div style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={monitor1.open}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            Open Monitor 1
          </button>
          <button 
            onClick={monitor1.close}
            disabled={!monitor1.isOpen}
            style={{ padding: '10px 20px' }}
          >
            Close Monitor 1
          </button>
          <span style={{ marginLeft: '10px' }}>
            Status: {monitor1.isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>
        
        <div>
          <button 
            onClick={monitor2.open}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            Open Monitor 2
          </button>
          <button 
            onClick={monitor2.close}
            disabled={!monitor2.isOpen}
            style={{ padding: '10px 20px' }}
          >
            Close Monitor 2
          </button>
          <span style={{ marginLeft: '10px' }}>
            Status: {monitor2.isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>
      </div>
      
      {monitor1.portalTarget && createPortal(
        <div style={{ padding: '20px', background: '#e3f2fd' }}>
          <h1>Monitor 1</h1>
          <p>This is the first external window.</p>
          <button onClick={monitor1.close}>Close</button>
        </div>,
        monitor1.portalTarget
      )}
      
      {monitor2.portalTarget && createPortal(
        <div style={{ padding: '20px', background: '#f3e5f5' }}>
          <h1>Monitor 2</h1>
          <p>This is the second external window.</p>
          <button onClick={monitor2.close}>Close</button>
        </div>,
        monitor2.portalTarget
      )}
    </div>
  );
}
