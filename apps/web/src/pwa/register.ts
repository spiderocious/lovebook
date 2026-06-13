// Thin wrapper around vite-plugin-pwa's virtual registration module, isolated so
// the rest of the app never imports the virtual id directly (keeps typecheck
// happy without the virtual module present and gives us one swap point).

export function registerServiceWorker(): void {
  // Registers in dev too (devOptions.enabled in vite.config) so push + offline
  // are testable on localhost. The virtual module is provided by vite-plugin-pwa.
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // SW unsupported or registration failed — the app still works online.
    });
}
