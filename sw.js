// Кэширует оболочку приложения, чтобы при повторном открытии оно грузилось мгновенно.
// Версию кэша поднимай при каждом обновлении файлов — иначе браузер отдаст старое.
const CACHE = 'paper-mail-v25';

// Пути ОТНОСИТЕЛЬНЫЕ, без ведущего слеша. Так приложение работает и в корне домена
// (github.io), и в подпапке (локальный сервер) — абсолютный путь ушёл бы в корень
// сервера, где файлов нет.
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/img/icon_fox.webp',
  './assets/img/icon_bird.webp',
  './assets/img/icon_bunny.webp',
  './assets/img/icon_butterfly.webp',
  './assets/img/icon_dino.webp',
  './assets/img/icon_penguin.webp',
  './assets/img/wall_default.webp',
  './assets/img/wall_fox_sunset.webp',
  './assets/img/wall_white.webp',
  './assets/img/wall_black.webp',
  './assets/img/wall_pink.webp',
  './assets/img/wall_purple.webp',
  './assets/img/wall_green.webp',
  './assets/img/wall_teal.webp',
  './assets/img/bg_auth.webp',
  './assets/img/bg_chats.webp',
  './assets/img/bg_feed.webp',
  './assets/img/bg_settings.webp',
  './assets/img/bg_account.webp',
  './assets/video/splash-poster.webp',
  './assets/video/splash-short-poster.webp',
  './assets/video/splash-short.mp4',
];

// Куда установлен sw.js — от этого адреса и считаются все относительные пути.
const BASE = self.registration.scope;
const at = (path) => new URL(path, BASE).href;

self.addEventListener('install', (e) => {
  // Кладём поштучно: отсутствие одного файла не должно рушить весь кэш.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(SHELL.map((p) =>
        c.add(at(p)).catch((err) => console.warn('[sw] не закэшировано:', p, err))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) return;

  // index.html — сначала сеть: иначе после деплоя пользователь сидит на старой версии.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(at('./index.html')))
    );
    return;
  }

  // Статика — сначала кэш, она не меняется без смены имени файла.
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok && url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
