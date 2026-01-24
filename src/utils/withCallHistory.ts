type AnyFn = (...args: any[]) => any;

type WithCallHistory<F extends AnyFn, StoreKey extends PropertyKey, Entry> =
  F & { [K in StoreKey]: Entry[] };

// Overload 1: no transform -> entries are exactly the original args tuple
function withCallHistory<
  F extends AnyFn,
  StoreKey extends PropertyKey = "callHistory"
>(
  fn: F,
  storeName?: StoreKey
): WithCallHistory<F, StoreKey, Parameters<F>>;

// Overload 2: with transform -> entries are whatever transform returns
function withCallHistory<
  F extends AnyFn,
  StoreKey extends PropertyKey = "callHistory",
  Entry = unknown
>(
  fn: F,
  storeName: StoreKey | undefined,
  beforeStorage: (args: Parameters<F>) => Entry
): WithCallHistory<F, StoreKey, Entry>;

// Implementation
function withCallHistory(
  fn: AnyFn,
  storeName: PropertyKey = "callHistory",
  beforeStorage?: (args: any[]) => unknown
) {
  const wrapped = ((...args: any[]) => {
    const entry = beforeStorage ? beforeStorage(args) : args;
    (wrapped as any)[storeName].push(entry);
    return fn(...args);
  }) as any;

  wrapped[storeName] = [];
  return wrapped;
}

export { withCallHistory };