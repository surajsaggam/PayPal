/**
 * Lightweight Zustand-compatible store factory for standalone Vitest execution
 * before `pnpm install` populates node_modules.
 */

export type StateCreator<T> = (
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  getState: () => T
) => T;

export interface StoreApi<T> {
  <U = T>(selector?: (state: T) => U): U;
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

export function create<T extends object>(initializer: StateCreator<T>): StoreApi<T> {
  let state: T;
  const listeners = new Set<(state: T) => void>();

  const setState = (partial: Partial<T> | ((s: T) => Partial<T>)) => {
    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    state = Object.assign({}, state, nextPartial);
    listeners.forEach((l) => l(state));
  };

  const getState = () => state;

  const subscribe = (listener: (s: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  const useStore = (<U = T>(selector?: (s: T) => U): U => {
    return selector ? selector(state) : (state as unknown as U);
  }) as StoreApi<T>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
