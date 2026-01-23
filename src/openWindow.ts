import type { WindowFeatures } from "./types";
import { serializeWindowFeatures } from "./windowFeatures";

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

interface AfterClosedEvent {
    type: "afterClosed";
    windowName?: string;
}

// Map custom event names to their event interfaces
type CustomWindowEventMap = {
    create: CreateEvent;
    navigation: NavigationEvent;
    afterClosed: AfterClosedEvent;
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

const noop = () => { };

function openWindow(url: string = "", name: string = "", features: WindowFeatures = {}, events: WindowEventHandlers = {}): () => void {

    const windowRef = window.open(url, name, serializeWindowFeatures(features));
    // return early noop if window failed to open
    if (!windowRef) { return noop; }



    const eventList: (() => void)[] = []

    //monkey patch close to remove all event listeners before closing
    const originalClose = windowRef.close;
    windowRef.close = function (): void {
        while (eventList.length) { eventList.pop()!(); }
        const windowRefName = windowRef.name || undefined;
        windowRef.close = originalClose;
        windowRef.close();
        events.afterClosed && events.afterClosed({ type: "afterClosed", windowName: windowRefName });
    };

    //monkey patch addEventListener to track added event listeners
    const originalAddEventListener = windowRef?.addEventListener;

    windowRef.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        originalAddEventListener.call(this, type, listener, options);
        eventList.push(() => {
            this.removeEventListener(type, listener, options);
        });
    };


    for (const [eventName, eventHandler] of Object.entries(events) as [AllWindowEvents, WindowEventHandler<any>][]) {
        if (eventName === "create" || eventName === "navigation" || eventName === "afterClosed") {
            // Skip custom events in addEventListener - they're called directly
            continue;
        }
        windowRef.addEventListener(eventName, eventHandler as EventListener);
    }


    //dispatch create event
    events.create && events.create({ type: "create", windowRef });

    return () => windowRef.close();
}

export { openWindow };