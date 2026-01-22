import type { WindowFeatures } from "./types";
import { serializeWindowFeatures } from "./windowFeatures";

type WindowEvent = () => void;

type WindowEventMap = {
    load: WindowEvent;
    beforeunload: WindowEvent;
    unload: WindowEvent;
    focus: WindowEvent;
    blur: WindowEvent;
    resize: WindowEvent;
    scroll: WindowEvent;
    error: WindowEvent;
    contentload: WindowEvent;
    loadend: WindowEvent;
};

const noop = () => {};


function openWindow(url: string = "", name: string = "", features: WindowFeatures = {}, events: Partial<WindowEventMap> = {}): () => void {
    const windowRef = window.open(url, name, serializeWindowFeatures(features));
    if (!windowRef) {   return noop;}
    const eventCleanup: Set<() => void> = new Set();
    
    const originalAddEventListener = windowRef?.addEventListener;
    if (windowRef && originalAddEventListener) {
        windowRef.addEventListener = function<K extends keyof WindowEventMap>(type: K, listener: WindowEventMap[K], options?: boolean | AddEventListenerOptions): void {
            originalAddEventListener.call(this, type, listener, options);
            eventCleanup.add(() => {
                this.removeEventListener(type, listener, options);
            });
        };
    }

    if (windowRef) {
        for (const [eventName, eventHandler] of Object.entries(events) as [keyof WindowEventMap, WindowEvent][]) {
            if (eventHandler) {
                (windowRef as any)[eventName] = eventHandler;
                eventCleanup.add(() => { (windowRef as any)[eventName] = null; });
            }
        }
    }

    return () => {
        eventCleanup.forEach(cleanup => cleanup());
        windowRef.close();
    };
}

export { openWindow };