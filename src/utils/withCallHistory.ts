function withCallHistory<F extends (...args: any[]) => any>(
  fn: F,
  Store: typeof Array = Array,
) {
  const store = new Store<Parameters<F>>();
  
  const wrapped = ((...args: Parameters<F>) => {
    store.push(args);
    return fn(...args);
  }) as F;

  return [wrapped, store]
}

export { withCallHistory };