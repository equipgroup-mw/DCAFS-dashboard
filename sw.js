self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('dcafs-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/DCAFS.png',
        '/EQUIP.html',
        '/EQUIP.png',
        '/EquipLogo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
