# Guía de Migración de Proyecto Appwrite

Este documento sirve como guía para utilizar el script de migración `scripts/migrate_project.mjs`. Este script facilita la transferencia de la estructura de la base de datos (esquema) y el almacenamiento (storage), así como los datos y archivos, desde un proyecto de Appwrite origen a un proyecto destino.

## Requisitos Previos

1.  **Node.js**: Asegúrate de tener Node.js instalado en tu entorno.
2.  **Dependencias**: El proyecto debe tener instaladas las dependencias, específicamente `node-appwrite` y `dotenv`. Si ya has ejecutado `npm install` en el proyecto `vecivendo`, ya estás listo.
3.  **Proyecto Origen**: El script lee la configuración del proyecto **origen** desde el archivo `.env` en la raíz del proyecto. Asegúrate de que las siguientes variables estén definidas correctamente:
    *   `NEXT_PUBLIC_APPWRITE_ENDPOINT`
    *   `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
    *   `APPWRITE_API_KEY` (Debe tener permisos de lectura sobre los recursos a migrar).

4.  **Proyecto Destino**: Necesitas tener a mano las credenciales del proyecto donde quieres copiar los datos:
    *   **Project ID**: El ID del nuevo proyecto.
    *   **Endpoint**: La URL de la API de Appwrite (ej. `https://cloud.appwrite.io/v1`).
    *   **API Key**: Una API Key del proyecto destino con permisos de **Administrador** (o al menos permisos de escritura y creación para Database y Storage).

## Uso del Script

El script se ejecuta desde la línea de comandos utilizando `node`.

### Sintaxis

```bash
node scripts/migrate_project.mjs \
  --targetProject=<ID_PROYECTO_DESTINO> \
  --targetKey=<API_KEY_DESTINO> \
  --targetEndpoint=<ENDPOINT_DESTINO> \
  [--migrateData=<true|false>]
```

### Parámetros

| Parámetro | Descripción | Requerido |
| :--- | :--- | :--- |
| `--targetProject` | El ID del proyecto de Appwrite destino. | Sí |
| `--targetKey` | La API Key del proyecto destino (con permisos de escritura). | Sí |
| `--targetEndpoint` | El endpoint de la API del proyecto destino. | Sí |
| `--migrateData` | Indica si se deben migrar también los datos (documentos y archivos). Valores: `true` o `false`. Por defecto es `false` (solo estructura). | No |

## Ejemplos

### 1. Migrar solo la estructura (Schema)

Este comando copiará las bases de datos, colecciones, atributos, índices y buckets de almacenamiento, pero **NO** copiará los documentos ni los archivos. Ideal para preparar un entorno de staging o producción vacío.

```bash
node scripts/migrate_project.mjs \
  --targetProject=mi-nuevo-proyecto \
  --targetKey=98sd7f98s7df98s7df... \
  --targetEndpoint=https://cloud.appwrite.io/v1
```

### 2. Migrar estructura y datos

Este comando copiará toda la estructura y luego procederá a copiar todos los archivos del Storage y todos los documentos de las Bases de Datos.

```bash
node scripts/migrate_project.mjs \
  --targetProject=mi-nuevo-proyecto \
  --targetKey=98sd7f98s7df98s7df... \
  --targetEndpoint=https://cloud.appwrite.io/v1 \
  --migrateData=true
```

## Notas Importantes

*   **Identificadores ($id)**: El script intenta preservar los mismos IDs para bases de datos, colecciones, atributos, documentos y archivos. Esto es crucial para mantener la integridad de las relaciones.
*   **Relaciones**: El script crea primero los atributos normales y luego las relaciones en una segunda pasada para evitar errores de dependencias entre colecciones.
*   **Permisos**: Se intentan copiar los permisos tal cual están configurados en el origen.
*   **Datos Existentes**: Si un recurso (base de datos, colección, documento, etc.) ya existe en el destino con el mismo ID, el script lo omitirá y mostrará un mensaje indicando que ya existe. No sobrescribirá datos existentes.
*   **Archivos Temporales**: Durante la migración de archivos del Storage, el script descarga temporalmente los archivos a la carpeta `/tmp` de tu sistema antes de subirlos al destino.

## Solución de Problemas

*   **Error de Permisos (401/403)**: Verifica que la `targetKey` tenga los scopes necesarios (Database Read/Write, Storage Read/Write, etc.).
*   **Error de Dependencia**: Si falla la creación de un atributo de relación, puede ser porque la colección relacionada aún no se ha creado. El script maneja esto creando primero todas las colecciones "vacías" y luego llenando los atributos, pero asegúrate de que el esquema origen sea consistente.
