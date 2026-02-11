// No-op shim for node:async_hooks in Chrome extension service worker.
// LangGraph uses AsyncLocalStorage for tracing — not needed in this context.
export class AsyncLocalStorage<T> {
  getStore(): T | undefined {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run<R>(_store: T, fn: (...args: any[]) => R, ...args: any[]): R {
    return fn(...args);
  }
  enterWith(_store: T): void {}
  disable(): void {}
}
