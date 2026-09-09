// Z-Book — minimal service worker
// শুধু app shell (index.html) ক্যাশ করে, যাতে ব্রাউজার এটাকে
// "installable" হিসেবে চেনে। Firebase ডাটা (posts/chat) সবসময়
// লাইভ ইন্টারনেট থেকেই আসবে — এটা শুধু অ্যাপ খোলাটা দ্রুত/নির্ভরযোগ্য করে।

const CACHE_NAME = 'zbook-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // শুধু GET রিকোয়েস্টের জন্য; Firebase-এর নিজের রিকোয়েস্ট (auth/firestore)
  // ছুঁয়ে দেখি না, সেগুলো সরাসরি নেটওয়ার্কে যাক।
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match('./index.html'))
      );
    })
  );
});
