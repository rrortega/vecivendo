# Estructura de Base de Datos - Vecivendo

Documentación actualizada automáticamente basada en la estructura real de Appwrite.

## 📊 Colecciones y Esquemas

### 1. **residenciales**
Representa cada comunidad/residencial registrado en la plataforma.

**Atributos:**
- `nombre` (string, required)
- `slug` (string, required)
- `direccion` (string, required)
- `ciudad` (string)
- `provincia_estado` (string, required)
- `codigo_postal` (string)
- `country` (string, required)
- `moneda` (string)
- `phone_prefix` (string)
- `descripcion` (string)
- `activo` (boolean)
- `portada` (url) - Imagen de portada del residencial

**Relaciones:**
- Referenciado por: `anuncios`, `grupos_whatsapp`, `avisos_comunidad`, `anunciantes`, `contenidos`

---

### 2. **anuncios**
Anuncios gratuitos publicados en los residenciales.

**Atributos:**
- `titulo` (string, required)
- `descripcion` (string, size: 5000)
- `precio` (double)
- `moneda` (string)
- `categoria` (string) - Array de etiquetas/categorías
- `tipo` (string) - 'venta', 'servicio', etc.
- `imagenes` (string[]) - Array de URLs de imágenes
- `activo` (boolean)
- `destacado` (boolean)
- `fecha_publicacion` (datetime)
- `dias_vigencia` (integer)
- `vistas` (integer)
- `clics` (integer)
- `contactos` (integer)
- `mensaje_original_id` (string)
- `metadata_ia` (string, size: 5000)
- `telefono_contacto` (string)

**Relaciones:**
- `residencial_id` (Many-to-One) → residenciales
- `anunciante_id` (Many-to-One) → anunciantes
- `grupo_origen_id` (Many-to-One) → grupos_whatsapp

---

### 3. **anuncios_pago**
Anuncios pagados/promocionales.

**Atributos:**
- `titulo` (string, required)
- `descripcion` (string, size: 1000)
- `imagen_url` (url, required)
- `enlace_destino` (url)
- `fecha_inicio` (datetime, required)
- `fecha_fin` (datetime, required)
- `activo` (boolean)
- `prioridad` (integer)
- `ubicacion` (string) - 'home', 'sidebar', etc.
- `tipo_publicidad` (string)
- `clicks` (integer)
- `impresiones` (integer)
- `inversion` (double)
- `estado_pago` (string)

**Relaciones:**
- `residenciales` (Many-to-Many) ↔ residenciales
- `cliente_id` (Many-to-One) → anunciantes

---

### 4. **grupos_whatsapp**
Grupos de WhatsApp vinculados a residenciales.

**Atributos:**
- `nombre_grupo` (string, required)
- `whatsapp_group_id` (string, required)
- `link_invitacion` (url)
- `descripcion` (string)
- `activo` (boolean)
- `fecha_vinculacion` (datetime)
- `numero_miembros` (integer)
- `reglas` (string, size: 2000)
- `tipo_grupo` (string)

**Relaciones:**
- `residencial_id` (Many-to-One) → residenciales

---

### 5. **avisos_comunidad**
Avisos importantes para los residentes.

**Atributos:**
- `titulo` (string, required)
- `descripcion` (string, size: 2000)
- `nivel` (string) - 'info', 'alerta', 'urgente'
- `fecha_inicio` (datetime)
- `fecha_fin` (datetime)
- `activo` (boolean)
- `alcance` (string)

**Relaciones:**
- `residencial_id` (Many-to-One) → residenciales

---

### 6. **anunciantes**
Usuarios o entidades que publican anuncios.

**Atributos:**
- `nombre_anunciante` (string)
- `telefono_whatsapp` (string, required)
- `email` (email)
- `ultima_actividad` (datetime)
- `estado` (string)
- `notas` (string)

**Relaciones:**
- `residencial_id` (Many-to-One) → residenciales

---

### 7. **contenidos**
Artículos, noticias y páginas estáticas (CMS).

**Atributos:**
- `titulo` (string, required)
- `slug` (string, required)
- `contenido` (string, size: 10000) - Markdown
- `extracto` (string, size: 500)
- `tipo` (string) - 'articulo', 'pagina', 'noticia'
- `categoria` (string)
- `estado` (string) - 'borrador', 'publicado'
- `imagen_destacada` (url)
- `tags` (string[])
- `fecha_publicacion` (datetime)
- `autor_nombre` (string)

**Relaciones:**
- `residencial_id` (Many-to-One) → residenciales (opcional, null = global)

---

### 8. **mensajes_whatsapp**
Registro de mensajes procesados desde WhatsApp.

**Atributos:**
- `whatsapp_message_id` (string, required)
- `telefono_remitente` (string)
- `texto` (string, size: 2000)
- `adjuntos` (string, size: 5000) - JSON string
- `fecha_mensaje` (datetime)
- `procesado` (boolean)
- `error_proceso` (string)

**Relaciones:**
- `grupo_id` (Many-to-One) → grupos_whatsapp
- `anuncio_id` (One-to-One) → anuncios (si generó un anuncio)

---

### 9. **reviews**
Reseñas y calificaciones de anuncios.

**Atributos:**
- `rating` (integer, required) - 1 a 5
- `comentario` (string, size: 1000)
- `autor_nombre` (string, required)
- `fecha` (datetime)
- `estado` (string) - 'pendiente', 'aprobado'

**Relaciones:**
- `anuncio_id` (Many-to-One) → anuncios

---

### 10. **logs**
Registro de eventos y analíticas.

**Atributos:**
- `event_type` (string, required) - 'view', 'click', 'print'
- `ad_type` (string, required) - 'free', 'paid'
- `timestamp` (datetime)
- `ip_address` (string)
- `user_agent` (string)
- `metadata` (string, size: 2000) - JSON string

**Relaciones:**
- `ad_id` (string) - ID del anuncio (polimórfico: anuncios o anuncios_pago)
- `user_id` (string) - ID del usuario (si aplica)

---

### 11. **pedidos**
Registro de pedidos o intenciones de compra.

**Atributos:**
- `cantidad` (integer)
- `total` (double)
- `estado` (string)
- `fecha_pedido` (datetime)
- `notas` (string)
- `datos_contacto` (string)

**Relaciones:**
- `anuncio_id` (Many-to-One) → anuncios
- `comprador_id` (Many-to-One) → anunciantes (opcional)

---

## 📝 Notas Adicionales

- Todos los documentos incluyen automáticamente los campos de sistema: `$id`, `$createdAt`, `$updatedAt`, `$permissions`.
- Las fechas se manejan en formato ISO 8601.
- Los campos de tipo `relationship` en Appwrite manejan la integridad referencial.
