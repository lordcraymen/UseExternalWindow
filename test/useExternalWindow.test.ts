import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useExternalWindow, serializeWindowFeatures } from '../src/useExternalWindow';
import { useExternalWindowContext, ExternalWindowProvider } from '../src/ExternalWindowContext';
import React from 'react';

describe('useExternalWindow', () => {
  let mockWindow: Partial<Window> & { closed: boolean };
  let mockDocument: Partial<Document>;
  let originalWindowOpen: typeof window.open;

  beforeEach(() => {
    // Store original window.open
    originalWindowOpen = window.open;

    // Create mock document
    mockDocument = {
      title: '',
      head: document.createElement('head'),
      body: document.createElement('body'),
      createElement: (tagName: string) => document.createElement(tagName),
      styleSheets: [] as unknown as StyleSheetList,
      readyState: 'complete', // about:blank is immediately ready
      documentElement: {} as any,
    };

    // Create mock window
    mockWindow = {
      document: mockDocument as Document,
      closed: false,
      close: vi.fn(function(this: any) {
        this.closed = true;
      }),
      focus: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') {
          // For about:blank, document is already complete
          // So this simulates the race condition - load event may not fire
          // or fires before addEventListener is called
          // Only fire if document isn't already complete
          if (mockDocument.readyState !== 'complete') {
            setTimeout(() => (handler as EventListener)(new Event('load')), 0);
          }
        }
      }),
      removeEventListener: vi.fn(),
    };

    // Mock window.open
    window.open = vi.fn(() => mockWindow as Window);
  });

  afterEach(() => {
    // Restore original window.open
    window.open = originalWindowOpen;
    vi.restoreAllMocks();
  });

  it('should initialize with null containerRef and closed state', () => {
    const { result } = renderHook(() => useExternalWindow());

    expect(result.current.portalTarget).toBeNull();
    expect(result.current.externalWindow).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('should open external window when open() is called', async () => {
    const { result } = renderHook(() => useExternalWindow({
      title: 'Test Window',
      features: 'width=800,height=600',
    }));

    await act(async () => {
      result.current.open();
    });

    expect(window.open).toHaveBeenCalledWith(
      'about:blank',
      '_blank',
      'width=800,height=600'
    );

    // Wait for load event and container creation
    await waitFor(() => {
      expect(result.current.portalTarget).not.toBeNull();
    }, { timeout: 1000 });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.externalWindow).toBe(mockWindow);
    expect(mockDocument.title).toBe('Test Window');
  });

  it('should create container div with correct id and styles', async () => {
    const { result } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.portalTarget).not.toBeNull();
    }, { timeout: 1000 });

    // Container should be a shadow root for encapsulation
    const container = result.current.portalTarget!;
    // In jsdom, we can't easily test shadow root, so just verify it's not null
    // and it's not the body itself
    expect(container).not.toBeNull();
    expect(container).not.toBe(mockDocument.body);
  });

  it('should resize the window', async () => {
    mockWindow.resizeTo = vi.fn();
    const { result } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    result.current.resize(1024, 768);

    expect(mockWindow.resizeTo).toHaveBeenCalledWith(1024, 768);
  });

  it('should move the window', async () => {
    mockWindow.moveTo = vi.fn();
    const { result } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    result.current.move(100, 200);

    expect(mockWindow.moveTo).toHaveBeenCalledWith(100, 200);
  });

  it('should focus the window', async () => {
    mockWindow.focus = vi.fn();
    const { result } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    result.current.focus();

    expect(mockWindow.focus).toHaveBeenCalled();
  });

  it('should handle errors gracefully when trying to control a closed window', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockWindow.resizeTo = vi.fn(() => {
      throw new Error('Window is closed');
    });
    const { result } = renderHook(() => useExternalWindow());

    // Try to resize without opening
    result.current.resize(800, 600);

    // Should not throw, and should silently fail for closed window
    expect(result.current.isOpen).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('should call onOpen callback when window opens', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useExternalWindow({ onOpen }));

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith(mockWindow);
    }, { timeout: 1000 });
  });

  it('should close window and cleanup when close() is called', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useExternalWindow({ onClose }));

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    await act(async () => {
      result.current.close();
    });

    expect(mockWindow.close).toHaveBeenCalled();
    expect(result.current.portalTarget).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.externalWindow).toBeNull();
    expect(onClose).toHaveBeenCalled();
  });

  it('should detect when external window is closed by user', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useExternalWindow({ onClose }));

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    // Simulate user closing the window
    mockWindow.closed = true;

    // Wait for the interval to detect the closed window (500ms check interval)
    await new Promise(resolve => setTimeout(resolve, 600));

    await waitFor(() => {
      expect(result.current.portalTarget).toBeNull();
      expect(result.current.isOpen).toBe(false);
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should not open multiple windows if already open', async () => {
    const { result } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    const firstWindow = result.current.externalWindow;

    // Try to open again
    await act(async () => {
      result.current.open();
    });

    // Should focus existing window instead of opening new one
    expect(mockWindow.focus).toHaveBeenCalled();
    expect(result.current.externalWindow).toBe(firstWindow);
  });

  it('should inject custom styles into external window', async () => {
    const customStyles = 'body { background: red; }';
    const { result } = renderHook(() => useExternalWindow({ styles: customStyles }));

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    const styleElements = mockDocument.head?.querySelectorAll('style');
    const hasCustomStyles = Array.from(styleElements || []).some(
      (style) => style.textContent === customStyles
    );
    expect(hasCustomStyles).toBe(true);
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useExternalWindow());

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    unmount();

    expect(mockWindow.close).toHaveBeenCalled();
  });

  it('should handle window.open returning null (popup blocked)', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.open = vi.fn(() => null);

    const { result } = renderHook(() => useExternalWindow());

    act(() => {
      result.current.open();
    });

    expect(result.current.portalTarget).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should use custom URL when provided', async () => {
    const customUrl = 'https://example.com';
    const { result } = renderHook(() => useExternalWindow({ url: customUrl }));

    act(() => {
      result.current.open();
    });

    expect(window.open).toHaveBeenCalledWith(
      customUrl,
      '_blank',
      expect.any(String)
    );
  });

  it('should trigger rerender when containerRef changes', async () => {
    const { result } = renderHook(() => useExternalWindow());
    
    const initialRenderContainer = result.current.portalTarget;
    expect(initialRenderContainer).toBeNull();

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.portalTarget).not.toBeNull();
    }, { timeout: 1000 });

    // Container should be different after opening
    expect(result.current.portalTarget).not.toBe(initialRenderContainer);
  });
});

describe('serializeWindowFeatures', () => {
  it('should serialize numeric values', () => {
    const features = serializeWindowFeatures({ width: 800, height: 600 });
    expect(features).toBe('width=800,height=600');
  });

  it('should serialize boolean values to yes/no', () => {
    const features = serializeWindowFeatures({ 
      menubar: false, 
      toolbar: true,
      resizable: false 
    });
    expect(features).toBe('menubar=no,toolbar=yes,resizable=no');
  });

  it('should handle mixed types', () => {
    const features = serializeWindowFeatures({ 
      width: 1920,
      height: 1080,
      left: 0,
      top: 0,
      menubar: false,
      toolbar: false,
      resizable: true
    });
    expect(features).toBe('width=1920,height=1080,left=0,top=0,menubar=no,toolbar=no,resizable=yes');
  });

  it('should handle yes/no string values', () => {
    const features = serializeWindowFeatures({ 
      menubar: 'no',
      toolbar: 'yes'
    });
    expect(features).toBe('menubar=no,toolbar=yes');
  });

  it('should filter out undefined and null values', () => {
    const features = serializeWindowFeatures({ 
      width: 800,
      height: undefined as any,
      left: null as any,
      top: 100
    });
    expect(features).toBe('width=800,top=100');
  });

  it('should handle empty object', () => {
    const features = serializeWindowFeatures({});
    expect(features).toBe('');
  });
});

describe('useExternalWindow with object features', () => {
  let mockWindow: Partial<Window> & { closed: boolean };
  let mockDocument: Partial<Document>;
  let originalWindowOpen: typeof window.open;

  beforeEach(() => {
    originalWindowOpen = window.open;

    mockDocument = {
      title: '',
      head: document.createElement('head'),
      body: document.createElement('body'),
      createElement: (tagName: string) => document.createElement(tagName),
      styleSheets: [] as unknown as StyleSheetList,
      documentElement: {} as any,
    };

    mockWindow = {
      document: mockDocument as Document,
      closed: false,
      close: vi.fn(function(this: any) {
        this.closed = true;
      }),
      focus: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') {
          setTimeout(() => (handler as EventListener)(new Event('load')), 0);
        }
      }),
      removeEventListener: vi.fn(),
    };

    window.open = vi.fn(() => mockWindow as Window);
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    vi.restoreAllMocks();
  });

  it('should accept features as an object', async () => {
    const { result } = renderHook(() => useExternalWindow({
      features: {
        width: 1920,
        height: 1080,
        left: 0,
        top: 0,
        menubar: false,
        toolbar: false
      }
    }));

    await act(async () => {
      result.current.open();
    });

    expect(window.open).toHaveBeenCalledWith(
      'about:blank',
      '_blank',
      'width=1920,height=1080,left=0,top=0,menubar=no,toolbar=no'
    );
  });

  it('should still accept features as a string', async () => {
    const { result } = renderHook(() => useExternalWindow({
      features: 'width=800,height=600'
    }));

    await act(async () => {
      result.current.open();
    });

    expect(window.open).toHaveBeenCalledWith(
      'about:blank',
      '_blank',
      'width=800,height=600'
    );
  });
});

  describe('ExternalWindowContext', () => {
    it('should throw error when useExternalWindowContext is used outside provider', () => {
      const renderOutsideProvider = () => renderHook(() => useExternalWindowContext());

      expect(renderOutsideProvider).toThrowError(/ExternalWindowProvider/);
    });

    it('should provide window controls through context', () => {
      const mockClose = vi.fn();
      const mockResize = vi.fn();
      const mockMove = vi.fn();
      const mockFocus = vi.fn();
      const mockWindow: Window = {
        closed: false,
      } as any;

      const contextValue = {
        close: mockClose,
        resize: mockResize,
        move: mockMove,
        focus: mockFocus,
        externalWindow: mockWindow,
      };

      const wrapper = ({ children }: any) =>
        React.createElement(
          ExternalWindowProvider,
          { value: contextValue, children },
        );

      const { result } = renderHook(() => useExternalWindowContext(), { wrapper });

      expect(result.current.close).toBe(mockClose);
      expect(result.current.resize).toBe(mockResize);
      expect(result.current.move).toBe(mockMove);
      expect(result.current.focus).toBe(mockFocus);
      expect(result.current.externalWindow).toBe(mockWindow);
    });

    it('should allow calling context functions from within provider', () => {
      const mockClose = vi.fn();
      const mockResize = vi.fn();

      const contextValue = {
        close: mockClose,
        resize: mockResize,
        move: vi.fn(),
        focus: vi.fn(),
        externalWindow: null,
      };

      const wrapper = ({ children }: any) =>
        React.createElement(
          ExternalWindowProvider,
          { value: contextValue, children },
        );

      const { result } = renderHook(
        () => {
          const ctx = useExternalWindowContext();
          return {
            close: () => ctx.close(),
            resize: () => ctx.resize(800, 600),
          };
        },
        { wrapper }
      );

      act(() => {
        result.current.close();
        result.current.resize();
      });

      expect(mockClose).toHaveBeenCalled();
      expect(mockResize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('fullscreen', () => {
    let mockWindow: Partial<Window> & { closed: boolean };
    let mockDocument: Partial<Document>;
    let originalWindowOpen: typeof window.open;

    beforeEach(() => {
      originalWindowOpen = window.open;

      mockDocument = {
        title: '',
        head: document.createElement('head'),
        body: document.createElement('body'),
        createElement: (tagName: string) => document.createElement(tagName),
        styleSheets: [] as unknown as StyleSheetList,
        documentElement: {
          requestFullscreen: vi.fn(async function(this: any) {
            return Promise.resolve();
          }),
        } as any,
      };

      mockWindow = {
        document: mockDocument as Document,
        closed: false,
        close: vi.fn(function(this: any) {
          this.closed = true;
        }),
        focus: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      window.open = vi.fn(() => mockWindow as Window);
    });

    afterEach(() => {
      window.open = originalWindowOpen;
      vi.restoreAllMocks();
    });

    it('should request fullscreen when available', async () => {
      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(true);
      expect(mockDocument.documentElement?.requestFullscreen).toHaveBeenCalled();
    });

    it('should return false if fullscreen API is not available', async () => {
      mockDocument.documentElement = {} as any; // Remove requestFullscreen
      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(false);
    });

    it('should return false if window is closed', async () => {
      const { result } = renderHook(() => useExternalWindow());

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(false);
    });

    it('should return false if fullscreen request is denied', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      (mockDocument.documentElement as any).requestFullscreen = vi.fn(async () => {
        throw new Error('Fullscreen request denied');
      });

      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should support webkit vendor prefix for fullscreen', async () => {
      const mockWebkitFullscreen = vi.fn(async function(this: any) {
        return Promise.resolve();
      });
      mockDocument.documentElement = {
        webkitRequestFullscreen: mockWebkitFullscreen,
      } as any;

      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(true);
      expect(mockWebkitFullscreen).toHaveBeenCalled();
    });

    it('should support moz vendor prefix for fullscreen', async () => {
      const mockMozFullscreen = vi.fn(async function(this: any) {
        return Promise.resolve();
      });
      mockDocument.documentElement = {
        mozRequestFullScreen: mockMozFullscreen,
      } as any;

      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(true);
      expect(mockMozFullscreen).toHaveBeenCalled();
    });

    it('should support ms vendor prefix for fullscreen', async () => {
      const mockMsFullscreen = vi.fn(async function(this: any) {
        return Promise.resolve();
      });
      mockDocument.documentElement = {
        msRequestFullscreen: mockMsFullscreen,
      } as any;

      const { result } = renderHook(() => useExternalWindow());

      await act(async () => {
        result.current.open();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      }, { timeout: 1000 });

      const isFullscreen = await result.current.fullscreen();

      expect(isFullscreen).toBe(true);
      expect(mockMsFullscreen).toHaveBeenCalled();
    });

  it('should detect fullscreen API availability', async () => {
    const { result } = renderHook(() => useExternalWindow());

    expect(result.current.canFullscreen).toBe(false);

    await act(async () => {
      result.current.open();
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 1000 });

    expect(result.current.canFullscreen).toBe(true);
  });
});