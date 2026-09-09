// Z-Book — minimal service worker
// শুধু app shell (index.html) ক্যাশ করে, যাতে ব্রাউজার এটাকে
// "installable" হিসেবে চেনে। Firebase ডাটা (posts/chat) সবসময়
// লাইভ ইন্টারনেট থেকেই আসবে — এটা শুধু অ্যাপ খোলাটা দ্রুত/নির্ভরযোগ্য করে।

const CACHE_NAME = 'zbook-shell-v2';
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

  // index.html (এবং root path) সব সময় নেটওয়ার্ক থেকে আগে আনার চেষ্টা করে —
  // যাতে কোড আপডেট করলে সাথে সাথেই ইউজার নতুন ভার্সন পায়। নেট না থাকলে
  // তখনই পুরনো ক্যাশড কপি দেখানো হয় (অফলাইন সাপোর্ট)।
  const isAppShell = url.pathname.endsWith('/index.html') || url.pathname.endsWith('/z-book/') || url.pathname.endsWith('/z-book');
  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((fresh) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, fresh.clone()));
          return fresh;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match('./index.html'))
      );
    })
  );
});
