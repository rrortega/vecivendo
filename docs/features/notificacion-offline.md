# Historia de Usuario: Notificación de Conexión Offline

## Feature: Notificación de Desconexión de Internet

Como usuario de la aplicación
Quiero ser notificado cuando pierda la conexión a internet
Para saber que algunas funcionalidades pueden no estar disponibles

### Background:
  Dado que el usuario está navegando en la aplicación
  Y la aplicación tiene un componente de notificación offline habilitado

---

## Escenario 1: Mostrar notificación cuando se pierde la conexión

```gherkin
Escenario: Usuario pierde conexión a internet
  Dado que el usuario tiene conexión a internet activa
  Cuando el navegador detecta que se perdió la conexión
  Entonces se debe mostrar una barra de notificación fija en la parte inferior
  Y la barra debe tener un fondo rojo con gradiente
  Y debe mostrar el mensaje "Sin conexión a internet. Revisa tu conexión."
  Y debe mostrar un ícono de WiFi desconectado animado
  Y debe mostrar un ícono de cerrar (X)
  Y la notificación debe tener z-index máximo (sobre todo el contenido)
```

---

## Escenario 2: Ocultar menú inferior en móvil cuando no hay conexión

```gherkin
Escenario: Ocultar menú de navegación bottom en móvil
  Dado que el usuario está en un dispositivo móvil
  Y el menú de navegación inferior está visible
  Cuando se detecta que no hay conexión a internet
  Entonces el menú de navegación inferior se debe ocultar con animación
  Y solo debe mostrarse la notificación de offline
```

---

## Escenario 3: Usuario cierra temporalmente la notificación

```gherkin
Escenario: Cerrar notificación con clic
  Dado que la notificación de offline está visible
  Cuando el usuario hace clic en la notificación
  Entonces la notificación debe ocultarse con animación
  Y el menú de navegación inferior debe volver a mostrarse (en móvil)
  Y se debe iniciar un temporizador de 20 segundos
```

---

## Escenario 4: Re-aparecer notificación después de snooze

```gherkin
Escenario: Notificación reaparece después de 20 segundos si sigue offline
  Dado que el usuario cerró la notificación de offline
  Y han pasado 20 segundos desde que se cerró
  Cuando el sistema verifica el estado de conexión
  Y el usuario sigue sin conexión a internet
  Entonces la notificación de offline debe mostrarse nuevamente
  Y el menú de navegación inferior se debe ocultar nuevamente (en móvil)
```

```gherkin
Escenario: Notificación no reaparece si hay conexión
  Dado que el usuario cerró la notificación de offline
  Y han pasado 20 segundos desde que se cerró
  Cuando el sistema verifica el estado de conexión
  Y el usuario ya tiene conexión a internet
  Entonces la notificación no debe mostrarse
  Y el estado de error de conexión se debe limpiar
```

---

## Escenario 5: Mostrar notificación por error de servidor

```gherkin
Escenario: Error de respuesta del servidor
  Dado que el usuario tiene conexión a internet según el navegador
  Cuando una petición al servidor falla por timeout o error de red
  Y se llama a la función reportConnectionError()
  Entonces se debe mostrar la notificación de offline
  Y debe mostrar el mensaje "Sin conexión a internet. Revisa tu conexión."
  Y el menú de navegación inferior se debe ocultar (en móvil)
```

---

## Escenario 6: Restaurar estado cuando vuelve la conexión

```gherkin
Escenario: Conexión restaurada
  Dado que la notificación de offline está visible
  Cuando el navegador detecta que se restauró la conexión
  Entonces la notificación de offline se debe ocultar automáticamente
  Y el menú de navegación inferior debe volver a mostrarse (en móvil)
  Y todos los estados de error deben limpiarse
  Y cualquier temporizador de snooze pendiente debe cancelarse
```

---

## Escenario 7: Error de aplicación muestra página de error personalizada

```gherkin
Escenario: Error de aplicación con problemas de conexión
  Dado que el usuario está navegando en la aplicación
  Cuando ocurre un error de JavaScript relacionado con fetch o network
  Entonces se debe mostrar la página de error personalizada
  Y debe mostrar el ícono de WiFi desconectado grande
  Y debe mostrar el título "¡Ups! Problemas de conexión"
  Y debe mostrar el mensaje "Parece que tienes problemas con tu conexión a internet"
  Y debe mostrar un botón "Reintentar"
  Y debe mostrar un botón "Ir al inicio"
  Y debe mostrar información sobre contenido disponible offline
```

```gherkin
Escenario: Error de aplicación genérico
  Dado que el usuario está navegando en la aplicación
  Cuando ocurre un error de JavaScript no relacionado con conexión
  Entonces se debe mostrar la página de error personalizada
  Y debe mostrar el título "Algo salió mal"
  Y debe mostrar el mensaje "Ha ocurrido un error inesperado"
  Y debe mostrar un botón "Reintentar"
  Y debe mostrar un botón "Ir al inicio"
```

---

## Escenario 8: Página no encontrada (404) personalizada

```gherkin
Escenario: Usuario navega a página inexistente
  Dado que el usuario está navegando en la aplicación
  Cuando intenta acceder a una URL que no existe
  Entonces se debe mostrar la página 404 personalizada
  Y debe mostrar el código "404" grande
  Y debe mostrar el título "Página no encontrada"
  Y debe mostrar el mensaje "La página que buscas no existe o ha sido movida"
  Y debe mostrar un botón "Volver atrás"
  Y debe mostrar un botón "Ir al inicio"
```

---

## Escenario 9: PWA funciona offline con datos en caché

```gherkin
Escenario: Navegación offline con contenido cacheado
  Dado que el usuario ha visitado previamente páginas de la aplicación
  Y las páginas están guardadas en el caché del navegador
  Cuando el usuario pierde conexión a internet
  Entonces debe poder navegar a las páginas previamente visitadas
  Y debe ver el contenido guardado en caché
  Y debe ver la notificación de offline en la parte inferior
  Y la aplicación no debe mostrar errores genéricos de Next.js
```

---

## Criterios de Aceptación Generales

1. ✅ La notificación debe ser fixed en el bottom de la pantalla
2. ✅ La notificación debe tener z-index máximo (9999)
3. ✅ El menú de navegación inferior se oculta solo en móvil cuando hay notificación
4. ✅ La notificación es clickeable para cerrarla
5. ✅ Después de 20 segundos de cerrada, reaparece si sigue offline
6. ✅ Error de servidor también muestra la notificación
7. ✅ Al restaurarse la conexión, todo vuelve a la normalidad automáticamente
8. ✅ Las animaciones son suaves (spring animation)
9. ✅ La página de error es personalizada y amigable
10. ✅ La página 404 es personalizada y consistente con el diseño
11. ✅ La aplicación no muestra errores genéricos de Next.js
12. ✅ El contenido cacheado está disponible offline

---

## Notas Técnicas

### Componentes Involucrados:
- `ConnectionContext.jsx` - Maneja el estado global de conexión
- `OfflineNotification.jsx` - Componente visual de la notificación
- `BottomNav.jsx` - Menú de navegación inferior que se oculta
- `error.js` - Página de error personalizada
- `not-found.js` - Página 404 personalizada

### API del Contexto:
```javascript
const { 
  isOffline,           // boolean - Estado real de conexión del navegador
  showOfflineMessage,  // boolean - Si se debe mostrar la notificación
  dismissMessage,      // function - Cerrar temporalmente la notificación
  reportConnectionError // function - Reportar error de servidor/conexión
} = useConnection();
```

### Uso para Reportar Errores de Servidor:
```javascript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('Server error');
} catch (error) {
  reportConnectionError(); // Muestra la notificación
}
```

### Estructura de Archivos:
```
src/
├── context/
│   └── ConnectionContext.jsx    # Contexto de estado de conexión
├── components/
│   └── ui/
│       ├── OfflineNotification.jsx  # Notificación bottom fixed
│       └── BottomNav.jsx            # Menú bottom que se oculta offline
└── app/
    └── (site)/
        ├── error.js      # Página de error personalizada
        ├── not-found.js  # Página 404 personalizada
        └── layout.js     # Layout con ConnectionProvider
```
