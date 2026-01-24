import type { WindowFeatures } from "./types";
import { serializeWindowFeatures } from "./windowFeatures";
import { withCallHistory } from "./utils/withCallHistory";

// Define custom event interfaces
interface CreateEvent {
    type: "create";
    windowRef: Window;
}

interface NavigationEvent {
    type: "navigation";
    url: string;
    windowRef: Window;
}

interface OwnershipLostEvent {
    type: "ownershipLost";
    windowName?: string;
}

interface AfterClosedEvent {
    type: "afterClosed";
    windowName?: string;
}

// Map custom event names to their event interfaces
type CustomWindowEventMap = {
    create: CreateEvent;
    navigation: NavigationEvent;
    afterClosed: AfterClosedEvent;
    ownershipLost: OwnershipLostEvent;
};

type CustomWindowEvents = keyof CustomWindowEventMap;
type AllWindowEvents = keyof WindowEventMap | CustomWindowEvents;

type WindowEventHandler<K extends AllWindowEvents> = 
    K extends keyof WindowEventMap 
        ? (this: Window, ev: WindowEventMap[K]) => any
        : K extends keyof CustomWindowEventMap
        ? (ev: CustomWindowEventMap[K]) => void
        : never;

type WindowEventHandlers = {
    [K in AllWindowEvents]?: WindowEventHandler<K>;
};

function openWindow(url: string = "", name: string = "", features: WindowFeatures = {}, events: WindowEventHandlers = {}): Window | null {

    const windowRef = window.open(url, name, serializeWindowFeatures(features));
    // return early noop if window failed to open
    if (!windowRef) { return null }

    //monkey patch close to remove all event listeners before closing

    // monkey patch addEventListener to track added event listeners using withCallHistory
    windowRef.addEventListener = withCallHistory(windowRef.addEventListener);
    for (const [eventName, eventHandler] of Object.entries(events) as [AllWindowEvents, WindowEventHandler<any>][]) {
        if (eventName === "create" || eventName === "navigation" || eventName === "afterClosed") {
            // Skip custom events in addEventListener - they're called directly
            continue;
        }
        windowRef.addEventListener(eventName, eventHandler as EventListener);
    }

    const originalClose = windowRef.close;
    windowRef.close = function (): void {
        const events = (windowRef.addEventListener as any).callHistory
        while (events.length) { windowRef.removeEventListener(...(events.pop() as any[])); }
        const windowRefName = windowRef.name || undefined;
        windowRef.close = originalClose;
        windowRef.close();
        events.afterClosed && events.afterClosed({ type: "afterClosed", windowName: windowRefName });
    };


    //dispatch create event
    events.create && events.create({ type: "create", windowRef });

    return windowRef
}

function withNavigationTracking(openWindowFn: typeof openWindow): typeof openWindow {
    return function (url: string = "", name: string = "", features: WindowFeatures = {}, events: WindowEventHandlers = {}): Window | null {
        const navigationHandler = events.navigation;
        let lastUrl = url;
        events.navigation = function (ev: NavigationEvent): void {
            if (ev.url !== lastUrl) {
                lastUrl = ev.url;
                navigationHandler && navigationHandler(ev);
            }
        };
        const windowRef = openWindowFn(url, name, features, events);

        // poll the window's location to detect navigation changes
        //if the window is navigated to a different origin, this will throw a cross-origin error which we catch and ignore
        if (windowRef) {
            const pollInterval = 500;
            const poller = setInterval(() => {
                try {
                    const currentUrl = windowRef.location.href;
                    if (currentUrl !== lastUrl) {
                        lastUrl = currentUrl;
                        events.navigation && events.navigation({ type: "navigation", url: currentUrl, windowRef });
                    }
                } catch (e) {
                    windowRef.dispatchEvent(new Event("ownershipLost"));
                    //cross-origin navigation detected, stop polling
                    clearInterval(poller);
                }
            }, pollInterval);
        }
        return windowRef;
    };
}

export { openWindow, withNavigationTracking };