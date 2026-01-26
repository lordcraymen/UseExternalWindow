/**
 * withRecovery(openPopup, options?)
 *
 * - openPopup(state) should open (or re-open) the popup and return a Window reference.
 *   You control how you call window.open() inside openPopup.
 *
 * - Detects:
 *   1) user closed the popup (win.closed === true)  -> emits "closed"
 *   2) popup became cross-origin / DOM inaccessible -> emits "lost", then closes it and reopens -> emits "recovered"
 *
 * - Tracks "window UI state" (best-effort): screenX/screenY/outerWidth/outerHeight, name, lastSeenHref (if readable)
 *
 * - Optional cooperative exit signal:
 *   If the popup (your code) posts {type:"POPUP_EXIT"} to the opener, we emit "exit"
 */

interface RecoveryOptions {
  pollMs?: number;
  lostAfterMs?: number;
  targetOrigin?: string;
  debug?: boolean;
}

interface RecoveryState {
  name: string | undefined;
  bounds: { x: number | undefined; y: number | undefined; w: number | undefined; h: number | undefined };
  lastSeenHref: string | undefined;
  lastGoodAt: number;
  lastLossAt: number;
  exitSignaled: boolean;
}

export function withRecovery(openPopup: (state: RecoveryState) => Window, options: RecoveryOptions = {}) {
  const {
    pollMs = 250,
    lostAfterMs = 0, // 0 = recover immediately when detected; >0 = require sustained loss for N ms
  } = options;

  const emitter = new EventTarget();

  const state: RecoveryState = {
    name: undefined,
    bounds: { x: undefined, y: undefined, w: undefined, h: undefined },
    lastSeenHref: undefined,
    lastGoodAt: 0,
    lastLossAt: 0,
    exitSignaled: false,
  };

  let win: Window | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let messageHandler: ((e: MessageEvent) => void) | null = null;
  let closedByManager = false;

  function safeRead(fn: () => any) {
    try {
      return { ok: true, value: fn() };
    } catch (err) {
      return { ok: false, err };
    }
  }

  function snapshotUiState(w: Window) {
    // These are generally readable even cross-origin, but we still guard.
    const x = safeRead(() => w.screenX);
    const y = safeRead(() => w.screenY);
    const ow = safeRead(() => w.outerWidth);
    const oh = safeRead(() => w.outerHeight);
    const nm = safeRead(() => w.name);

    if (nm.ok) state.name = nm.value;
    if (x.ok) state.bounds.x = x.value;
    if (y.ok) state.bounds.y = y.value;
    if (ow.ok) state.bounds.w = ow.value;
    if (oh.ok) state.bounds.h = oh.value;

    // Only readable same-origin; used purely as a “still accessible” probe.
    const href = safeRead(() => w.location.href);
    if (href.ok) state.lastSeenHref = href.value;

    return href.ok; // "accessible" signal
  }

  function dispatch(type: string, detail: any) {
    emitter.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function attachMessageListener() {
    if (messageHandler) return;

    messageHandler = (e: MessageEvent) => {
      // If you know the popup's origin, validate it here.
      // if (targetOrigin !== "*" && e.origin !== targetOrigin) return;

      const msg = e.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "POPUP_EXIT") {
        state.exitSignaled = true;
        dispatch("exit", { reason: msg.reason ?? "unknown", state: structuredClone(state) });
      }

      if (msg.type === "POPUP_UI_STATE" && msg.bounds) {
        // Cooperative state snapshot from popup (optional)
        state.bounds = { ...state.bounds, ...msg.bounds };
        if (typeof msg.name === "string") state.name = msg.name;
      }
    };

    window.addEventListener("message", messageHandler);
  }

  function detachMessageListener() {
    if (!messageHandler) return;
    window.removeEventListener("message", messageHandler);
    messageHandler = null;
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    detachMessageListener();
  }

  function closeCurrent() {
    if (!win) return;
    closedByManager = true;
    try {
      win.close();
    } catch {}
  }

  function openNew(reason: string) {
    closedByManager = false;
    state.exitSignaled = false;

    const next = openPopup(structuredClone(state));
    if (!next || typeof next !== "object") {
      throw new Error("openPopup(state) must return a Window reference");
    }

    win = next;

    // Capture name immediately if available
    const nm = safeRead(() => win!.name);
    if (nm.ok) state.name = nm.value;

    state.lastGoodAt = Date.now();
    state.lastLossAt = 0;

    dispatch("open", { reason, win, state: structuredClone(state) });
    return win;
  }

  function isClosed(w: Window) {
    const c = safeRead(() => w.closed);
    return c.ok ? c.value : false;
  }

  function tick() {
    if (!win) return;

    // If user closed it
    if (isClosed(win)) {
      stop();
      dispatch("closed", {
        byManager: closedByManager,
        exitSignaled: state.exitSignaled,
        state: structuredClone(state),
      });
      return;
    }

    // Update state + probe accessibility
    const accessible = snapshotUiState(win);

    const now = Date.now();
    if (accessible) {
      state.lastGoodAt = now;
      state.lastLossAt = 0;
      return;
    }

    // Not accessible (likely cross-origin or otherwise blocked)
    if (!state.lastLossAt) state.lastLossAt = now;

    const lostFor = now - state.lastLossAt;
    if (lostAfterMs > 0 && lostFor < lostAfterMs) return;

    dispatch("lost", { lostForMs: lostFor, state: structuredClone(state) });

    // Reclaim/recreate while the old one is still open.
    // Best-effort close (may fail if user agent blocks it, but usually works if you opened it).
    closeCurrent();
    openNew("recovery");
    dispatch("recovered", { state: structuredClone(state) });
  }

  function start() {
    attachMessageListener();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, pollMs);
  }

  // Public controller API
  const controller = {
    get window() {
      return win;
    },
    get state() {
      return structuredClone(state);
    },
    open(reason: string = "initial") {
      openNew(reason);
      start();
      return win;
    },
    close() {
      stop();
      closeCurrent();
    },
    on(type: string, handler: EventListener, options?: AddEventListenerOptions) {
      emitter.addEventListener(type, handler, options);
      return () => emitter.removeEventListener(type, handler, options);
    },
  };

  return controller;
}

/* --------------------------
   OPTIONAL: popup-side helper
   Include this in the popup page (same-origin) if you want an explicit "exit" signal.
--------------------------- */
export function installPopupExitSignal({ reason = "user_navigation", targetOrigin = "*" }: { reason?: string; targetOrigin?: string } = {}) {
  function send(type: string, payload: any) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type, ...payload }, targetOrigin);
      }
    } catch {}
  }

  // Fires on navigations away / bfcache transitions; good “I’m leaving” signal.
  window.addEventListener("pagehide", () => {
    send("POPUP_EXIT", { reason });
  });

  // Optional: share UI state
  setInterval(() => {
    send("POPUP_UI_STATE", {
      name: window.name,
      bounds: { x: window.screenX, y: window.screenY, w: window.outerWidth, h: window.outerHeight },
    });
  }, 500);
}
