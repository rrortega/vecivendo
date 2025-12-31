// Service Worker para Vecivendo PWA
const CACHE_NAME = 'vecivendo-v1';
const OFFLINE_URL = '/offline.html';

// Recursos que siempre queremos cachear
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/apple-touch-icon.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Forzar que el nuevo SW tome control inmediatamente si el usuario lo solicita
                console.log('[SW] Skip waiting on install');
                return self.skipWaiting();
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Estrategia de caché: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    // Solo manejar requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorar requests a APIs externas y a la consola de administración
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/console') ||
        url.pathname.startsWith('/_next/webpack-hmr')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, la guardamos en caché
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Si falla el network, intentamos desde caché
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si es una navegación y no hay caché, mostrar página offline
                if (event.request.mode === 'navigate') {
                    const cache = await caches.open(CACHE_NAME);
                    return cache.match('/') || new Response('Sin conexión', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }

                throw new Error('No cache available');
            })
    );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// ===== PUSH NOTIFICATIONS =====

// Recibir push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {
        title: 'Vecivendo',
        body: 'Tienes una nueva notificación',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'default',
        data: {},
    };

    // Intentar parsear los datos del push
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[SW] Push payload:', payload);

            // Formato de Appwrite
            data = {
                title: payload.title || data.title,
                body: payload.body || payload.message || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                tag: payload.tag || payload.id || data.tag,
                data: payload.data || payload,
                image: payload.image || null,
            };
        } catch (e) {
            // Si no es JSON, usar el texto plano
            data.body = event.data.text() || data.body;
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
        vibrate: [100, 50, 100],
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Abrir',
            },
            {
                action: 'close',
                title: 'Cerrar',
            },
        ],
    };

    // Agregar imagen si existe
    if (data.image) {
        options.image = data.image;
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    event.notification.close();

    // Si el usuario hizo clic en "Cerrar", no hacer nada más
    if (event.action === 'close') {
        return;
    }

    // Obtener la URL a abrir
    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || notificationData.link || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Buscar si ya hay una ventana abierta con la app
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Navegar a la URL y enfocar
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Manejar cierre de notificación (deslizar para descartar)
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
});
