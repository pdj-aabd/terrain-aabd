/* Service worker minimal : rend l'app ouvrable sans réseau (couloirs, sous-sol).
 * Les ENVOIS hors ligne ne sont pas gérés ici mais par la file d'attente de l'app
 * (localStorage), ce qui permet de prévenir l'utilisateur explicitement. */
/* Le stockage de cache est partagé par TOUTE l'origine (github.io du compte) : d'autres
 * apps de l'hôtel y vivent. On ne touche donc jamais qu'aux caches portant notre préfixe. */
const PREFIXE = 'adagio-terrain-';
const CACHE = PREFIXE + 'v3';   // à incrémenter à chaque publication
const FICHIERS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) =>
        Promise.all(
          ks.filter((k) => k.startsWith(PREFIXE) && k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // Jamais de cache sur les appels au script Google : ils doivent toujours être frais.
  if (u.hostname.indexOf('script.google.com') >= 0) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copie = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
