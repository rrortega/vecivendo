# Documentación Técnica de Vecivendo

## 1. Descripción General del Sistema

Vecivendo es un marketplace diseñado para organizar, estructurar y presentar anuncios provenientes de grupos de WhatsApp de residenciales. **El sistema web no escucha ni procesa mensajes directamente**; toda la información llega precargada desde una automatización externa que alimenta Appwrite.

El proyecto web funciona exclusivamente como:

* **Frontend PWA (Next.js)** para presentar catálogo, anuncios y pedidos.
* **Cliente de Appwrite Tables** para leer datos estructurados.
* **Interfaz optimizada para PX, UX y conversión.**

Toda la lógica de procesamiento, clasificación o extracción de datos ocurre fuera del proyecto web.

## 2. Arquitectura General

El sistema web se limita a consumir y presentar datos almacenados en Appwrite. Los módulos principales son:

### 2.1 Appwrite (Tables + Storage + Sites)

* Tables almacena residenciales, anunciantes, anuncios y pedidos.
* Storage guarda imágenes de los anuncios.
* Sites sirve el build de Next.js.

### 2.2 Frontend PWA (Next.js)

Componentes clave:

* Listado de anuncios.
* Vista por categorías.
* Detalle de anuncio.
* Sugerencias del mismo anunciante.
* Flujo de pedido sin autenticación.
* Validación de geolocalización.

### 2.3 Automatización Externa (fuera del alcance del proyecto web)

Aunque no forma parte del proyecto, se documenta brevemente para contexto:

* Procesa mensajes de WhatsApp.
* Extrae campos y guarda en Appwrite.
* Mantiene actualizados los datos del marketplace.

## 3. Modelo de Datos (Appwrite Tables)

El sistema está compuesto por cuatro módulos principales:

### 2.1 Listener de WhatsApp

* Conectado a un número automatizado.
* Escucha mensajes en varios grupos.
* Identifica el grupo y envía cada mensaje crudo al backend vía API.
* Extrae: texto, remitente, grupo, imágenes y fecha.

### 2.2 Backend de Procesamiento

* Stack: Node.js o Python.
* Funciones principales:

  * Identificar si el mensaje es un anuncio.
  * Extraer campos estructurados: título, descripción, precio, moneda, categoría, imágenes.
  * Detectar teléfono del anunciante.
  * Asociar al residencial correspondiente.
  * Registrar anuncios y anunciantes en Appwrite Tables.

### 2.3 Appwrite (Tables + Storage + Sites)

* Usa Tables para modelar entidades de negocio.
* Almacena imágenes en Storage.
* Sirve el frontend con Sites.
* Expone SDK para consultas desde Next.js.

### 2.4 Frontend PWA (Next.js)

* Funcionalidades principales:

  * Catálogo por residencial.
  * Categorías.
  * Detalle de anuncio.
  * Listado de "otros anuncios del mismo anunciante".
  * Flujo de pedido sin registro.
  * Generación de mensaje preformateado y redirección a WhatsApp.
  * Captura de geolocalización.

## 3. Modelo de Datos (Appwrite Tables)

### 3.1 Tabla: residenciales

* **nombre** (string)
* **slug** (string)
* **whatsapp_group_id** (string)
* **ubicacion_centro** (string lat,lng)
* **radio_autorizado_metros** (int)

### 3.2 Tabla: anunciantes

* **telefono_whatsapp** (string)
* **nombre_anunciante** (string, opcional)
* **residencial_id** (relation)
* **ultima_actividad** (datetime)

### 3.3 Tabla: anuncios

* **residencial_id** (relation)
* **anunciante_id** (relation)
* **mensaje_original_id** (string)
* **titulo** (string)
* **descripcion** (string)
* **precio** (float, opcional)
* **moneda** (string)
* **categoria** (string)
* **tipo** (string: producto | servicio)
* **imagenes** (array de file IDs)
* **activo** (bool)
* **metadata_ia** (json)

### 3.4 Tabla: pedidos

* **anuncio_id** (relation)
* **anunciante_id** (relation)
* **residencial_id** (relation)
* **nombre_cliente** (string)
* **direccion_cliente** (string)
* **cantidad** (int, opcional)
* **precio_unitario** (float)
* **precio_total** (float)
* **mensaje_whatsapp_generado** (string)
* **geolocalizacion_cliente** (string lat,lng)
* **distancia_residencial_metros** (float)
* **estado** (string)
* **fecha_creacion** (datetime)

### 3.5 Tabla: mensajes_whatsapp (opcional)

* **whatsapp_message_id** (string)
* **residencial_id** (relation)
* **telefono_remitente** (string)
* **texto** (string)
* **adjuntos** (json)
* **fecha_mensaje** (datetime)
* **procesado** (bool)
* **anuncio_id** (relation, opcional)

## 4. Requisitos de UX y UI

La interfaz de Vecivendo debe ser ligera, clara y enfocada en transacciones rápidas entre vecinos. La experiencia debe favorecer la simplicidad por encima de cualquier complejidad visual innecesaria.

### 4.1 Principios de UX

* **Zero-friction UX:** sin registro, sin cuentas, sin pasos extra.
* **Consistencia:** mismas posiciones para botones principales, tarjetas y modales.
* **Acceso rápido al contenido:** el usuario debe ver anuncios apenas entra.
* **Flujo de pedido claro:** 3 pasos como máximo antes de ir a WhatsApp.
* **Legibilidad:** tamaños adecuados, uso moderado de colores, contraste alto.
* **Optimizado para móvil:** el 90% de los usuarios accederá desde smartphones.

### 4.2 Elementos clave de UI

* Cabecera con selector de residencial (si aplica).
* Tarjetas limpias con:

  * Imagen principal.
  * Título.
  * Precio.
  * Indicador de tipo (producto o servicio).
  * Indicador de categoría.
* Paginación por scroll infinito.
* Botón "Pedir por WhatsApp" siempre visible en el detalle del anuncio.
* Modal de pedido limpio y con inputs grandes.
* Pantallas neutras para estados vacíos.

### 4.3 Wireframes en texto (ASCII)

#### Home / Catálogo

```
+----------------------------------------+
|  Residencial: Las Palmas (selector)    |
+----------------------------------------+
| [Imagen]  Título producto   $ Precio   |
| [Imagen]  Título servicio  Desde $XX   |
| [Imagen]  ...                          |
| Scroll infinito                        |
+----------------------------------------+
```

#### Detalle de anuncio

```
+----------------------------------------+
| < Volver                               |
| [ Imagen principal del anuncio ]        |
+----------------------------------------+
| Título del anuncio                      |
| Precio                                  |
| Categoría  | Tipo                        |
| Descripción                              |
+----------------------------------------+
| Otros anuncios del mismo vecino         |
| [imagen + título + precio]              |
| [imagen + título + precio]              |
+----------------------------------------+
|  Botón: PEDIR POR WHATSAPP             |
+----------------------------------------+
```

#### Modal de pedido

```
+----------------------------------------+
| Hacer Pedido                            |
+----------------------------------------+
| Cantidad (si aplica) [   ]              |
| Nombre completo      [           ]      |
| Dirección MZ/LT/Casa [           ]      |
| Botón: CONFIRMAR PEDIDO                |
+----------------------------------------+
```

#### Validación de geolocalización

```
Solicitando ubicación...
Si está fuera del radio: "Este servicio es solo para vecinos del residencial."
```

## 5. Flujo del Usuario (Frontend Next.js)

Flujo del Usuario (Frontend Next.js)

### 5.1 Catálogo y navegación

* Catálogo filtrado por residencial.
* Búsqueda y categorías.
* Página de detalle del anuncio.
* Módulo de "más anuncios del mismo anunciante".

### 5.2 Flujo de pedido

1. Usuario abre anuncio.
2. Selecciona cantidad (si aplica).
3. Completa formulario rápido.
4. El navegador solicita geolocalización.
5. Se verifica distancia al residencial.
6. Si está permitido, se crea el pedido en Appwrite.
7. Se genera mensaje y se redirige a `wa.me`.

## 6. Reglas de Negocio

* Solo vecinos dentro del radio pueden generar pedidos.
* Anuncio pertenece al residencial del grupo.
* El anunciante se identifica por su número WhatsApp.
* Un pedido es siempre 1 anunciante → 1 anuncio.

## 7. Estructura del Proyecto Next.js

```
vecivendo/
  app/
    [residencial]/
      page.jsx
      anuncio/[id]/page.jsx
      pedido/page.jsx
  components/
  hooks/
  lib/
    appwrite.js
  styles/
  public/
```

 