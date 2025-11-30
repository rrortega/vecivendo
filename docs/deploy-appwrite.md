# Guía de Despliegue y Configuración en Appwrite

Esta guía detalla los pasos necesarios para configurar el backend de Appwrite para el proyecto Vecivendo y preparar el entorno para su despliegue.

## 1. Requisitos Previos

*   **Instancia de Appwrite**: Necesitas tener acceso a una instancia de Appwrite. Puede ser:
    *   **Appwrite Cloud**: La opción más sencilla (https://cloud.appwrite.io).
    *   **Auto-alojado**: Una instancia corriendo en tu propio servidor o localmente mediante Docker.
*   **Node.js**: Versión 18 o superior instalada en tu entorno local para ejecutar los scripts de configuración.
*   **Git**: Para clonar el repositorio.

## 2. Configuración del Proyecto en Appwrite

1.  **Crear Proyecto**:
    *   Accede a tu consola de Appwrite.
    *   Crea un nuevo proyecto llamado `Vecivendo`.
    *   Anota el `Project ID`.

2.  **Crear API Key**:
    *   Ve a la sección **Overview** > **Integrations** > **API Keys**.
    *   Crea una nueva API Key (ej. nombre: `Setup Script`).
    *   Asigna los siguientes permisos (Scopes) para permitir que los scripts configuren la base de datos:
        *   `databases.read`, `databases.write`
        *   `collections.read`, `collections.write`
        *   `attributes.read`, `attributes.write`
        *   `documents.read`, `documents.write`
        *   `indexes.read`, `indexes.write`
        *   `users.read`, `users.write`
    *   Copia la `API Key Secret`.

3.  **Crear Base de Datos**:
    *   Ve a la sección **Databases**.
    *   Crea una nueva base de datos.
    *   Nombre: `Vecivendo DB`
    *   Database ID: `vecivendo-db` (Recomendado para coincidir con los scripts, si usas otro ID deberás configurarlo en las variables de entorno).

## 3. Configuración de Variables de Entorno

En tu entorno local (y posteriormente en tu servidor de producción), necesitas configurar las variables de entorno.

1.  Crea un archivo `.env.local` en la raíz del proyecto (puedes copiar `.env.example`).
2.  Configura las siguientes variables:

```bash
# Endpoint de Appwrite (ej. https://cloud.appwrite.io/v1 o tu IP local)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

# ID del Proyecto creado
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu_project_id

# ID de la Base de Datos
NEXT_PUBLIC_APPWRITE_DATABASE=vecivendo-db

# API Key creada en el paso anterior (Solo necesaria para scripts de setup y funciones del servidor)
APPWRITE_API_KEY=tu_api_key_secreta
```

## 4. Inicialización del Esquema de Base de Datos

El proyecto incluye scripts automatizados para crear la estructura de la base de datos (colecciones, atributos y relaciones). Ejecútalos en el siguiente orden desde la raíz del proyecto:

### Paso 1: Esquema Principal
Ejecuta el script que define las colecciones principales (`residenciales`, `anuncios`, `pedidos`, etc.):

```bash
node scripts/init_appwrite_schema.mjs
```

### Paso 2: Colecciones de Soporte
Ejecuta los scripts para configurar colecciones adicionales:

```bash
# Configuración global y contenidos (FAQs, Términos, etc.)
node setup_config_content.mjs

# Avisos de la comunidad
node setup_avisos.mjs

# Grupos de WhatsApp
node setup_whatsapp_groups.mjs
```

### Paso 3: Configurar Relaciones
Para asegurar que todas las relaciones entre colecciones estén correctamente enlazadas:

```bash
node setup_relationships.mjs
```

## 5. Carga de Datos de Prueba (Seeding)

Para poblar la base de datos con información inicial, útil para verificar que todo funcione correctamente:

1.  **Crear Residenciales**:
    ```bash
    node scripts/seed_residential.js
    ```

2.  **Crear Anuncios de Ejemplo**:
    ```bash
    node seed_anuncios.mjs
    ```

3.  **Crear Contenido de Ayuda**:
    ```bash
    node seed_help_center.mjs
    ```

## 6. Despliegue del Frontend

La aplicación es un proyecto **Next.js**, por lo que puede desplegarse en cualquier plataforma compatible.

### Opción A: Vercel (Recomendado)
1.  Sube tu código a GitHub/GitLab/Bitbucket.
2.  Importa el proyecto en Vercel.
3.  En la configuración del proyecto en Vercel, añade las variables de entorno:
    *   `NEXT_PUBLIC_APPWRITE_ENDPOINT`
    *   `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
    *   `NEXT_PUBLIC_APPWRITE_DATABASE`
    *   *(No incluyas `APPWRITE_API_KEY` en el frontend a menos que uses Server Actions o API Routes que la requieran explícitamente)*.
4.  Despliega.

### Opción B: Docker
Puedes construir una imagen Docker para desplegar en cualquier VPS o contenedor.

```bash
# Construir imagen
docker build -t vecivendo-app .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APPWRITE_ENDPOINT=... \
  -e NEXT_PUBLIC_APPWRITE_PROJECT_ID=... \
  vecivendo-app
```

## 7. Verificación Final

1.  Accede a la URL de tu aplicación desplegada.
2.  Verifica que la página de inicio cargue los banners y productos (esto confirma la conexión con Appwrite).
3.  Intenta navegar a las diferentes secciones.
