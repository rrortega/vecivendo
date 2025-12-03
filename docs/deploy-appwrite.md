# Guía de Despliegue en Appwrite

Esta guía detalla los pasos necesarios para configurar y desplegar el backend de Vecivendo utilizando Appwrite.

## Prerrequisitos

1.  **Instancia de Appwrite**: Necesitas tener una instancia de Appwrite corriendo. Puede ser:
    *   Appwrite Cloud (https://cloud.appwrite.io/)
    *   Una instancia auto-alojada (Self-hosted) en tu propio servidor (DigitalOcean, AWS, etc.).
2.  **Appwrite CLI**: Recomendado para gestionar despliegues y configuraciones desde la terminal.
    *   Instalación: `npm install -g appwrite-cli`
    *   Login: `appwrite login`

## Configuración del Proyecto

1.  **Crear Proyecto**: En tu consola de Appwrite, crea un nuevo proyecto (ej. `vecivendo`).
2.  **ID del Proyecto**: Copia el `Project ID` y agrégalo a tus variables de entorno en el frontend (`.env.local`):
    ```env
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu_project_id
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 # o tu endpoint
    ```

## Base de Datos y Colecciones

El sistema utiliza una base de datos principal (ej. `vecivendo-db`). Asegúrate de crearla y configurar las siguientes colecciones:

### 1. Colección `configuracion_global`
*   **Propósito**: Almacenar configuraciones generales del sitio (redes sociales, contacto).
*   **Permisos**: Lectura pública (`role:all`), Escritura solo Admin (`role:member` con etiqueta admin o equipo admin).
*   **Atributos**:
    *   `whatsapp_asistencia` (string)
    *   `email_soporte` (string, email)
    *   `facebook_url` (string, url)
    *   `instagram_url` (string, url)
    *   `twitter_url` (string, url)

### 2. Colección `residenciales`
*   **Propósito**: Almacenar la información de los residenciales.
*   **Permisos**: Lectura pública, Escritura Admin.
*   **Atributos**:
    *   `nombre` (string, required)
    *   `slug` (string, required, unique)
    *   `direccion` (string)
    *   `country` (string, ej. "MX")
    *   `moneda` (string, ej. "MXN") - *Opcional si se requiere*
    *   `phone_prefix` (string)
    *   `ubicacion_centro_lat` (float)
    *   `ubicacion_centro_lng` (float)
    *   `radio_autorizado_metros` (integer)
    *   `grupos_whatsapp` (relationship: one-to-many con `grupos_whatsapp`)
    *   `active` (boolean)

### 3. Colección `grupos_whatsapp`
*   **Propósito**: Grupos de WhatsApp asociados a residenciales.
*   **Permisos**: Lectura pública, Escritura Admin.
*   **Atributos**:
    *   `name` (string)
    *   `wspp_id` (string)
    *   `residencial` (relationship: many-to-one con `residenciales`)

### 4. Colección `messages` (Mensajes)
*   **Propósito**: Historial de mensajes o notificaciones.
*   **Atributos**: Según requerimientos del sistema de mensajería.

## Storage (Almacenamiento)

Crea un bucket para almacenar imágenes (logos, banners, etc.).
*   **Bucket ID**: Configura este ID en tus variables de entorno si es necesario.
*   **Permisos**: Lectura pública (`role:all`).

## Funciones (Functions)

Si utilizas Appwrite Functions para lógica del servidor (ej. cron jobs, procesar pagos):
1.  Navega al directorio de funciones.
2.  Despliega usando el CLI: `appwrite functions deploy`.

## Autenticación y Usuarios

1.  **Admin**: Crea tu usuario administrador manualmente o mediante registro.
2.  **Etiquetas (Labels)**: Para acceder al panel de administración (`/console`), el usuario debe tener la etiqueta `admin`. Puedes asignarla desde la consola de Appwrite en la sección "Auth" > "Users" > Seleccionar usuario > "Labels".

## Verificación

1.  Levanta tu aplicación frontend localmente.
2.  Intenta iniciar sesión en `/console`.
3.  Verifica que carguen los datos de las colecciones.

## Solución de Problemas Comunes

*   **Error 401 (Unauthorized)**: Revisa los permisos de la colección (Settings > Permissions). Asegúrate de que el rol `admin` o el usuario específico tenga permisos de Lectura/Escritura según corresponda.
*   **CORS**: Si estás en desarrollo local, añade `localhost` como plataforma web en tu proyecto de Appwrite (Overview > Platforms > Add Platform > Web).

---
*Documento generado para Vecivendo.*
