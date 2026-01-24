type IdentityTransform<Args extends unknown[]> = (args: Args) => Args;

// Overloads for better type inference
function withCallHistory<
  F extends (...args: any[]) => any,
  H extends string | symbol = 'callHistory'
>(
  fn: F,
  onBeforeStorage?: undefined,
  historyReference?: H
): typeof fn & { [P in H]: Parameters<F>[] };

function withCallHistory<
  F extends (...args: any[]) => any,
  R extends unknown[],
  H extends string | symbol = 'callHistory'
>(
  fn: F,
  onBeforeStorage: (args: Parameters<F>) => R,
  historyReference?: H
): typeof fn & { [P in H]: R[] };

function withCallHistory<
  F extends (...args: any[]) => any,
  Transform extends (args: Parameters<F>) => unknown[] = IdentityTransform<Parameters<F>>,
  H extends string | symbol = 'callHistory'
>(
  fn: F,
  onBeforeStorage?: Transform,
  historyReference: H = 'callHistory' as H  
){
  type HistoryEntry = ReturnType<Transform>;
  const callHistory: HistoryEntry[] = [];
  const transform: Transform = (onBeforeStorage ?? ((args => args) as IdentityTransform<Parameters<F>>)) as Transform;

  const wrappedFunction = (...args: Parameters<F>): ReturnType<F> => {
    callHistory.push(transform(args) as HistoryEntry);
    return fn(...args);
  };

  type Wrapped = typeof wrappedFunction & {
    [P in H]: HistoryEntry[]
  };

  (wrappedFunction as any)[historyReference] = callHistory;

  return wrappedFunction as Wrapped;
}

export { withCallHistory };