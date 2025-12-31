# Historia de Usuario: Push Notifications

## Feature: Notificaciones Push de la PWA

Como usuario de Vecivendo
Quiero recibir notificaciones push en mi dispositivo
Para estar informado de nuevos anuncios, mensajes y novedades importantes

### Background:
  Dado que el usuario tiene la PWA instalada
  Y el navegador soporta Push Notifications
  Y el Service Worker está registrado

---

## Escenario 1: Usuario activa notificaciones por primera vez

```gherkin
Escenario: Activar notificaciones push
  Dado que el usuario no tiene notificaciones activadas
  Y está en la página de perfil o configuración
  Cuando hace clic en "Activar" notificaciones
  Entonces el navegador debe solicitar permiso de notificaciones
  Y si el usuario acepta, se debe crear una suscripción push
  Y la suscripción se debe enviar al servidor
  Y el botón debe cambiar a "Desactivar"
  Y debe mostrarse el ícono de campana activa
```

---

## Escenario 2: Usuario recibe una notificación push

```gherkin
Escenario: Recibir notificación de Appwrite
  Dado que el usuario tiene notificaciones activadas
  Y Appwrite envía una notificación push
  Cuando el Service Worker recibe el evento push
  Entonces debe mostrar la notificación en el dispositivo
  Y la notificación debe tener:
    | Campo    | Descripción                          |
    | Título   | El título enviado por Appwrite       |
    | Cuerpo   | El mensaje enviado por Appwrite      |
    | Ícono    | El ícono de la aplicación            |
    | Vibración| Patrón de vibración [100, 50, 100]   |
    | Acciones | Botones "Abrir" y "Cerrar"           |
```

---

## Escenario 3: Usuario hace clic en la notificación

```gherkin
Escenario: Abrir aplicación desde notificación
  Dado que hay una notificación visible
  Cuando el usuario hace clic en la notificación
  O hace clic en el botón "Abrir"
  Entonces la notificación se debe cerrar
  Y se debe abrir la aplicación en la URL especificada
  Y si la app ya está abierta, se debe enfocar esa ventana
  Y si la app no está abierta, se debe abrir una nueva ventana
```

```gherkin
Escenario: Cerrar notificación sin abrir
  Dado que hay una notificación visible
  Cuando el usuario hace clic en el botón "Cerrar"
  O desliza la notificación para descartarla
  Entonces la notificación se debe cerrar
  Y no se debe abrir ninguna ventana
```

---

## Escenario 4: Usuario desactiva notificaciones

```gherkin
Escenario: Desactivar notificaciones push
  Dado que el usuario tiene notificaciones activadas
  Cuando hace clic en "Desactivar"
  Entonces se debe cancelar la suscripción push
  Y se debe notificar al servidor
  Y el botón debe cambiar a "Activar"
  Y el usuario ya no debe recibir notificaciones push
```

---

## Escenario 5: Usuario deniega permisos

```gherkin
Escenario: Permiso de notificaciones denegado
  Dado que el usuario nunca ha dado permiso de notificaciones
  Cuando intenta activar notificaciones
  Y el navegador muestra el diálogo de permiso
  Y el usuario hace clic en "Bloquear" o "Denegar"
  Entonces se debe mostrar un mensaje de error
  Y el toggle debe mostrar "Notificaciones bloqueadas"
  Y debe indicar cómo habilitarlas desde configuración del navegador
```

---

## Escenario 6: Navegador no soporta push

```gherkin
Escenario: Navegador sin soporte
  Dado que el navegador no soporta Push Notifications
  O no soporta Service Workers
  Cuando el componente PushNotificationToggle se renderiza
  Entonces no debe mostrarse ningún control
  Y no debe haber errores en consola
```

---

## Criterios de Aceptación Generales

1. ✅ Las notificaciones se reciben cuando la app está cerrada
2. ✅ Las notificaciones se reciben cuando la app está en segundo plano
3. ✅ El usuario puede activar/desactivar desde la UI
4. ✅ Se muestra feedback visual del estado actual
5. ✅ Los permisos denegados se manejan graciosamente
6. ✅ Al hacer clic en notificación, se abre la app en la URL correcta
7. ✅ Las suscripciones se guardan en el servidor
8. ✅ Compatible con el formato de notificaciones de Appwrite

---

## Notas Técnicas

### Archivos Involucrados:
- `public/sw.js` - Manejo de eventos push y notificationclick
- `src/hooks/usePushNotifications.js` - Hook para manejar suscripciones
- `src/components/ui/PushNotificationToggle.jsx` - Componentes UI
- `src/app/api/push/vapid-key/route.js` - Endpoint para clave VAPID
- `src/app/api/push/subscribe/route.js` - Guardar suscripción
- `src/app/api/push/unsubscribe/route.js` - Eliminar suscripción

### Configuración Requerida:

1. **Variables de Entorno:**
```env
# Clave VAPID pública (obtener de Appwrite Console)
VAPID_PUBLIC_KEY=BEl62i...tu-clave-aqui
```

2. **En Appwrite Console:**
   - Ir a Settings > Push Notifications
   - Generar claves VAPID
   - Copiar la clave pública al .env

### Formato de Notificación de Appwrite:
```json
{
  "title": "Nuevo anuncio en tu comunidad",
  "body": "Juan publicó un nuevo artículo",
  "icon": "/icon-192x192.png",
  "image": "https://...",
  "data": {
    "url": "/mx-cun-jds6/anuncio/123",
    "type": "new_ad"
  }
}
```

### Uso del Hook:
```javascript
const {
  isSupported,  // boolean - Si el navegador soporta push
  permission,   // 'default' | 'granted' | 'denied'
  isSubscribed, // boolean - Si está suscrito actualmente
  isLoading,    // boolean - Operación en progreso
  error,        // string | null - Mensaje de error
  subscribe,    // function - Activar notificaciones
  unsubscribe,  // function - Desactivar notificaciones
} = usePushNotifications();
```

### Uso del Componente:
```jsx
// Versión completa (para páginas de configuración)
<PushNotificationToggle className="mb-4" />

// Versión compacta (para headers)
<PushNotificationButton />
```
