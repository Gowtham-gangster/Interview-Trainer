/** Runs before React so Android Chrome can capture install prompt + register SW early. */
export function PwaBootstrapScript() {
  const script = `
(function () {
  if (typeof window === 'undefined') return;

  window.__PWA_DEFERRED_PROMPT__ = null;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.__PWA_DEFERRED_PROMPT__ = event;
    window.dispatchEvent(new Event('pwa-installprompt-ready'));
  });

  window.addEventListener('appinstalled', function () {
    window.__PWA_DEFERRED_PROMPT__ = null;
    window.dispatchEvent(new Event('pwa-installprompt-ready'));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(function () {});
  }
})();
`.trim()

  return (
    <script
      id="pwa-bootstrap"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  )
}
