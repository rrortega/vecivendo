# Historia de Usuario: Actualización de PWA

## Feature: Detección y Actualización de Nueva Versión de la PWA

Como usuario de la aplicación Vecivendo
Quiero ser notificado cuando haya una nueva versión disponible
Para poder actualizar y disfrutar de las mejoras y correcciones más recientes

### Background:
  Dado que el usuario tiene la PWA instalada en su dispositivo
  Y la aplicación tiene un Service Worker registrado

---

## Escenario 1: Service Worker se registra correctamente

```gherkin
Escenario: Registro exitoso del Service Worker
  Dado que el usuario abre la aplicación por primera vez
  Y el navegador soporta Service Workers
  Cuando la aplicación carga completamente
  Entonces el Service Worker debe registrarse correctamente
  Y los recursos estáticos deben guardarse en caché
  Y la aplicación debe funcionar offline con el contenido cacheado
```

---

## Escenario 2: Detectar nueva versión disponible

```gherkin
Escenario: Nueva versión detectada
  Dado que el usuario tiene la PWA instalada con un Service Worker activo
  Y se ha desplegado una nueva versión de la aplicación
  Cuando el Service Worker detecta cambios en el servidor
  Entonces debe descargar el nuevo Service Worker en segundo plano
  Y debe marcar la nueva versión como "waiting"
  Y debe mostrar una notificación al usuario
```

---

## Escenario 3: Mostrar notificación de actualización

```gherkin
Escenario: Notificación de actualización visible
  Dado que hay una nueva versión del Service Worker esperando
  Cuando la aplicación detecta el estado "waiting"
  Entonces debe mostrar una notificación en la parte superior de la pantalla
  Y la notificación debe tener el título "¡Nueva versión disponible!"
  Y debe mostrar el mensaje "Hay mejoras y correcciones listas para ti"
  Y debe mostrar un ícono de estrellas/sparkles
  Y debe mostrar un botón "Actualizar ahora"
  Y debe mostrar un botón para cerrar la notificación
```

---

## Escenario 4: Usuario actualiza la aplicación

```gherkin
Escenario: Actualización exitosa
  Dado que la notificación de actualización está visible
  Cuando el usuario hace clic en "Actualizar ahora"
  Entonces se debe enviar un mensaje SKIP_WAITING al Service Worker
  Y el nuevo Service Worker debe tomar control
  Y la página debe recargarse automáticamente
  Y el usuario debe ver la nueva versión de la aplicación
```

---

## Escenario 5: Usuario descarta la notificación

```gherkin
Escenario: Descartar notificación temporalmente
  Dado que la notificación de actualización está visible
  Cuando el usuario hace clic en el botón de cerrar (X)
  Entonces la notificación debe ocultarse
  Y la nueva versión debe seguir esperando en segundo plano
  Y la notificación debe volver a aparecer al recargar la página
```

---

## Escenario 6: Verificación periódica de actualizaciones

```gherkin
Escenario: Verificación automática cada 60 minutos
  Dado que el usuario tiene la PWA abierta
  Y han pasado 60 minutos desde la última verificación
  Cuando el temporizador se activa
  Entonces el Service Worker debe verificar si hay actualizaciones
  Y si hay una nueva versión, debe mostrar la notificación
```

```gherkin
Escenario: Verificación al volver a la pestaña
  Dado que el usuario tiene la aplicación abierta en una pestaña
  Y la pestaña está en segundo plano
  Cuando el usuario vuelve a la pestaña (visibilitychange)
  Entonces el Service Worker debe verificar si hay actualizaciones
```

---

## Escenario 7: Caché de recursos estáticos

```gherkin
Escenario: Recursos estáticos se cachean
  Dado que el Service Worker se instala por primera vez
  Cuando la instalación se completa
  Entonces los siguientes recursos deben estar en caché:
    | Recurso |
    | / |
    | /manifest.json |
    | /icon-192x192.png |
    | /icon-512x512.png |
    | /apple-touch-icon.png |
```

---

## Escenario 8: Estrategia de caché Network First

```gherkin
Escenario: Contenido se obtiene del network primero
  Dado que el usuario tiene conexión a internet
  Cuando navega a una página
  Entonces el contenido se debe obtener del servidor (network)
  Y el contenido se debe guardar en caché
  Y si el servidor no responde, se debe usar el caché
```

```gherkin
Escenario: Fallback a caché cuando no hay red
  Dado que el usuario no tiene conexión a internet
  Cuando navega a una página previamente visitada
  Entonces el contenido se debe obtener del caché
  Y la experiencia debe ser transparente para el usuario
```

---

## Escenario 9: Limpieza de caché antiguo

```gherkin
Escenario: Eliminar cachés obsoletos
  Dado que hay una nueva versión del Service Worker
  Cuando el nuevo SW se activa
  Entonces debe eliminar todos los cachés con nombres diferentes al actual
  Y debe mantener solo el caché de la versión actual (CACHE_NAME)
```

---

## Criterios de Aceptación Generales

1. ✅ La PWA debe registrar un Service Worker al cargar
2. ✅ Debe detectar automáticamente cuando hay nueva versión
3. ✅ Debe mostrar notificación atractiva con opción de actualizar
4. ✅ El usuario puede descartar la notificación
5. ✅ Al actualizar, la página se recarga con la nueva versión
6. ✅ Los recursos estáticos se cachean para uso offline
7. ✅ La estrategia de caché es Network First con fallback a Cache
8. ✅ Se verifican actualizaciones cada 60 minutos y al volver a la pestaña
9. ✅ Los cachés antiguos se eliminan al activar nueva versión
10. ✅ Las rutas de API y consola NO se cachean

---

## Notas Técnicas

### Archivos Involucrados:
- `public/sw.js` - Service Worker principal
- `src/hooks/useServiceWorker.js` - Hook para manejar el ciclo de vida del SW
- `src/components/ui/UpdatePrompt.jsx` - Componente visual de notificación
- `src/app/(site)/layout.js` - Layout que incluye el UpdatePrompt

### Flujo de Actualización:
```
1. Nuevo deploy → nueva versión de sw.js
2. Service Worker detecta cambios (updatefound event)
3. Nuevo SW se instala en segundo plano
4. Estado cambia a "installed" → hook detecta "waiting"
5. Se muestra UpdatePrompt al usuario
6. Usuario hace clic en "Actualizar ahora"
7. Se envía mensaje SKIP_WAITING al SW
8. Nuevo SW toma control (controllerchange event)
9. Página se recarga automáticamente
```

### Configuración del Service Worker:
```javascript
const CACHE_NAME = 'vecivendo-v1'; // Cambiar nombre para forzar actualización

// Lo que SÍ se cachea:
- Páginas HTML visitadas
- Recursos estáticos (iconos, manifest)
- _next/static/* (JS, CSS)

// Lo que NO se cachea:
- Rutas /api/*
- Rutas /console/*
- Hot Module Replacement (_next/webpack-hmr)
```

### Uso Manual del Hook:
```javascript
const { 
  showUpdatePrompt,    // boolean - Si se debe mostrar la notificación
  updateServiceWorker, // function - Activar la nueva versión
  dismissUpdatePrompt, // function - Cerrar temporalmente
  isRegistered,        // boolean - Si el SW está registrado
} = useServiceWorker();
```
