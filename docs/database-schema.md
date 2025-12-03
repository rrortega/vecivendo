# Estructura de Base de Datos Optimizada - Vecivendo

## 📊 Esquema de Relaciones

### 1. **residenciales** (Colección Principal)
Representa cada comunidad/residencial registrado en la plataforma.

**Atributos:**
- `nombre` (string, required) - Nombre del residencial
- `slug` (string, required, unique) - URL-friendly identifier
- `direccion` (string) - Dirección física
- `imagen_url` (string) - URL de la imagen del residencial
- `descripcion` (string) - Descripción del residencial
- `activo` (boolean) - Si el residencial está activo

**Relaciones:**
- `anuncios` (One-to-Many) ← anuncios.residencial
- `grupos_whatsapp` (One-to-Many) ← grupos_whatsapp.residencial
- `avisos_comunidad` (One-to-Many) ← avisos_comunidad.residencial
- `anuncios_pago` (Many-to-Many) ↔ anuncios_pago.residenciales

---

### 2. **grupos_whatsapp** (Nueva Colección)
Grupos de WhatsApp asociados a cada residencial.

**Atributos:**
- `nombre_grupo` (string, required) - Nombre del grupo de WhatsApp
- `whatsapp_group_id` (string) - ID del grupo en WhatsApp
- `descripcion` (string) - Descripción del propósito del grupo
- `activo` (boolean, default: true) - Si el grupo está activo
- `fecha_vinculacion` (datetime) - Cuándo se vinculó el grupo
- `numero_miembros` (integer) - Cantidad de miembros en el grupo

**Relaciones:**
- `residencial` (Many-to-One) → residenciales

**Casos de Uso:**
- Un residencial puede tener múltiples grupos (ventas, avisos, emergencias, etc.)
- Los anuncios pueden originarse de mensajes de estos grupos
- Permite rastrear de qué grupo vino cada anuncio

---

### 3. **anuncios** (Colección de Anuncios)
Anuncios/productos publicados en cada residencial.

**Atributos:**
- `titulo` (string, required) - Título del anuncio
- `descripcion` (string) - Descripción detallada
- `precio` (double) - Precio del producto/servicio
- `moneda` (string) - Código de moneda (MXN, USD, etc.)
- `categoria` (string) - Categoría del producto
- `tipo` (string) - Tipo de anuncio (venta, servicio, etc.)
- `imagenes` (array[string]) - URLs de imágenes
- `activo` (boolean, required) - Si el anuncio está activo
- `mensaje_original_id` (string) - ID del mensaje de WhatsApp original
- `metadata_ia` (string) - Metadatos generados por IA

**Relaciones:**
- `residencial` (Many-to-One) → residenciales
- `anunciante` (Many-to-One) → usuarios (cuando se implemente)
- `grupo_origen` (Many-to-One) → grupos_whatsapp (opcional)

---

### 4. **avisos_comunidad** (Avisos/Alertas)
Avisos importantes para la comunidad.

**Atributos:**
- `titulo` (string, required) - Título del aviso
- `descripcion` (string) - Descripción del aviso
- `nivel` (enum: info, warning, critical) - Nivel de importancia
- `fecha_inicio` (datetime) - Cuándo comienza a mostrarse
- `fecha_fin` (datetime) - Cuándo deja de mostrarse
- `activo` (boolean) - Si el aviso está activo

**Relaciones:**
- `residencial` (Many-to-One) → residenciales

---

### 5. **anuncios_pago** (Anuncios Promocionales)
Banners y anuncios pagados que se muestran en la plataforma.

**Atributos:**
- `titulo` (string, required) - Título del anuncio
- `descripcion` (string) - Descripción
- `imagen_url` (string) - URL de la imagen del banner
- `enlace_destino` (string) - URL a donde redirige
- `fecha_inicio` (datetime) - Inicio de la campaña
- `fecha_fin` (datetime) - Fin de la campaña
- `activo` (boolean) - Si está activo
- `prioridad` (integer) - Orden de visualización

**Relaciones:**
- `residenciales` (Many-to-Many) ↔ residenciales
  - Permite que un anuncio se muestre en múltiples residenciales

---

### 6. **usuarios** (Futura Implementación)
Usuarios registrados en la plataforma.

**Atributos Propuestos:**
- `nombre` (string, required)
- `email` (string, required, unique)
- `telefono` (string)
- `whatsapp` (string)
- `avatar_url` (string)
- `verificado` (boolean)

**Relaciones Propuestas:**
- `mis_anuncios` (One-to-Many) ← anuncios.anunciante
- `residencial_principal` (Many-to-One) → residenciales
- `residenciales_acceso` (Many-to-Many) ↔ residenciales

---

## 🔄 Flujo de Datos: WhatsApp → Plataforma

### Proceso de Importación de Anuncios desde WhatsApp:

1. **Webhook/Bot recibe mensaje** del grupo de WhatsApp
2. **Identifica el grupo** mediante `whatsapp_group_id`
3. **Obtiene el residencial** asociado al grupo
4. **Procesa el mensaje** con IA para extraer:
   - Título
   - Descripción
   - Precio
   - Categoría
   - Imágenes
5. **Crea el anuncio** en la colección `anuncios`:
   - Vincula con `residencial`
   - Vincula con `grupo_origen`
   - Guarda `mensaje_original_id`
   - Almacena `metadata_ia`

### Ventajas de esta Estructura:

✅ **Trazabilidad**: Cada anuncio sabe de qué grupo vino
✅ **Escalabilidad**: Un residencial puede tener múltiples grupos
✅ **Flexibilidad**: Diferentes grupos para diferentes propósitos
✅ **Análisis**: Métricas por grupo (qué grupo genera más anuncios)
✅ **Moderación**: Activar/desactivar grupos específicos

---

## 📝 Queries Comunes

### Obtener todos los grupos de un residencial:
```javascript
const grupos = await databases.listDocuments(
    dbId,
    "grupos_whatsapp",
    [Query.equal("residencial", residencialId)]
);
```

### Obtener anuncios de un grupo específico:
```javascript
const anuncios = await databases.listDocuments(
    dbId,
    "anuncios",
    [
        Query.equal("grupo_origen", grupoId),
        Query.equal("activo", true)
    ]
);
```

### Obtener todos los anuncios de un residencial:
```javascript
const anuncios = await databases.listDocuments(
    dbId,
    "anuncios",
    [
        Query.equal("residencial", residencialId),
        Query.equal("activo", true)
    ]
);
```

---

## 🚀 Próximos Pasos

1. ✅ Crear colección `grupos_whatsapp`
2. ✅ Establecer relación con `residenciales`
3. ⏳ Agregar campo `grupo_origen` a `anuncios`
4. ⏳ Implementar webhook para WhatsApp
5. ⏳ Crear panel de administración de grupos
6. ⏳ Implementar colección `usuarios`
7. ⏳ Sistema de autenticación y permisos

---

## 📊 Diagrama de Relaciones

```
residenciales (1) ──────────── (N) grupos_whatsapp
     │                              │
     │                              │ (opcional)
     │                              │
     └──────── (N) anuncios ────────┘
                   │
                   └──────── (N) usuarios (futuro)

residenciales (N) ←──────→ (N) anuncios_pago

residenciales (1) ──────────── (N) avisos_comunidad
```
