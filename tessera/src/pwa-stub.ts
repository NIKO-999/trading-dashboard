// Stand-in for 'virtual:pwa-register' in the single-file build, where service workers are unavailable.
export function registerSW(_options?: unknown) {
  return (_reload?: boolean) => Promise.resolve();
}
