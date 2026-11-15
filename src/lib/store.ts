import { useSyncExternalStore } from "react";

/** Minimal external store: one source of truth per domain, read in React with a selector. */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  const get = () => state;
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    subs.forEach((f) => f());
  };
  const subscribe = (f: () => void) => {
    subs.add(f);
    return () => void subs.delete(f);
  };
  /** Selectors must return primitives or existing references (not new objects). */
  function use<U>(select: (s: T) => U): U {
    return useSyncExternalStore(subscribe, () => select(state), () => select(initial));
  }
  return { get, set, subscribe, use };
}
