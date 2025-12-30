# API de Registro de Anuncios

## Endpoint: POST /api/ads/register

Endpoint para registrar anuncios desde sistemas externos con autenticación mediante API Key.

### Autenticación

Requiere un header `x-api-key` con una API Key válida.

```bash
x-api-key: your-secret-api-key
```

### Lógica de Upsert

El endpoint implementa lógica inteligente de creación/actualización:

1. **Busca anuncio existente** con:
   - Mismo `titulo`
   - Mismo `precio`
   - Mismo `celular_anunciante`

2. **Si existe:**
   - Actualiza todos los campos
   - Actualiza `last_capture` a la fecha actual
   - Reactiva el anuncio (`activo: true`)
   - Retorna status `200` con `action: "updated"`

3. **Si NO existe:**
   - Crea un nuevo anuncio
   - Establece `last_capture` a la fecha actual
   - Establece `activo: true`
   - Retorna status `201` con `action: "created"`

### Request

#### Headers
```
Content-Type: application/json
x-api-key: your-secret-api-key
```

#### Body (JSON)

**Campos requeridos:**
- `titulo` (string): Título del anuncio
- `precio` (number): Precio del producto/servicio
- `celular_anunciante` (string): Celular del anunciante

**Campos opcionales:**
- `descripcion` (string): Descripción del anuncio
- `categoria` (string): Categoría del producto
- `residencial` (string): ID del residencial
- `imagenes` (array): Array de URLs de imágenes
- `activo` (boolean): Estado del anuncio
- Cualquier otro campo válido del modelo de anuncios

#### Ejemplo de Request

```bash
curl -X POST https://tu-dominio.com/api/ads/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{
    "titulo": "iPhone 13 Pro Max",
    "precio": 15000,
    "celular_anunciante": "5512345678",
    "descripcion": "iPhone en excelente estado",
    "categoria": "Electrónica",
    "residencial": "residencial-id-123",
    "imagenes": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }'
```

### Response

#### Success - Anuncio Creado (201)

```json
{
  "success": true,
  "action": "created",
  "message": "Anuncio creado exitosamente",
  "ad": {
    "$id": "unique-id-123",
    "titulo": "iPhone 13 Pro Max",
    "precio": 15000,
    "last_capture": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Success - Anuncio Actualizado (200)

```json
{
  "success": true,
  "action": "updated",
  "message": "Anuncio actualizado y extendido",
  "ad": {
    "$id": "existing-id-456",
    "titulo": "iPhone 13 Pro Max",
    "precio": 15000,
    "last_capture": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error - API Key Inválida (401)

```json
{
  "error": "API Key inválida o faltante"
}
```

#### Error - Campos Faltantes (400)

```json
{
  "error": "Campos requeridos faltantes",
  "required": ["titulo", "precio", "celular_anunciante"]
}
```

#### Error - Error del Servidor (500)

```json
{
  "error": "Error al procesar el anuncio",
  "details": "Mensaje de error específico"
}
```

### Configuración

1. Agrega la variable de entorno en tu archivo `.env.local`:

```bash
ADS_API_KEY=tu-api-key-super-secreta-aqui
```

2. Genera una API Key segura (ejemplo con Node.js):

```javascript
const crypto = require('crypto');
const apiKey = crypto.randomBytes(32).toString('hex');
console.log(apiKey);
```

### Casos de Uso

#### 1. Scraper de Anuncios
Actualiza automáticamente anuncios capturados de fuentes externas:

```javascript
const anuncios = await scrapeAnuncios();

for (const anuncio of anuncios) {
  await fetch('https://tu-dominio.com/api/ads/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ADS_API_KEY
    },
    body: JSON.stringify(anuncio)
  });
}
```

#### 2. Integración con Sistemas Externos
Sincroniza anuncios desde otros sistemas:

```javascript
async function syncAnuncio(anuncio) {
  const response = await fetch('https://tu-dominio.com/api/ads/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ADS_API_KEY
    },
    body: JSON.stringify({
      titulo: anuncio.title,
      precio: anuncio.price,
      celular_anunciante: anuncio.phone,
      descripcion: anuncio.description,
      categoria: anuncio.category,
      residencial: anuncio.residentialId,
      imagenes: anuncio.images
    })
  });
  
  const result = await response.json();
  console.log(`Anuncio ${result.action}: ${result.ad.$id}`);
}
```

### Seguridad

- ✅ **API Key requerida**: Solo requests autenticados pueden crear/actualizar anuncios
- ✅ **Validación de campos**: Campos requeridos son validados antes de procesar
- ✅ **Upsert inteligente**: Evita duplicados basándose en título, precio y celular
- ✅ **Server-side only**: La API Key nunca se expone al cliente
- ⚠️ **Rotación de API Key**: Cambia la API Key periódicamente por seguridad
- ⚠️ **Rate Limiting**: Considera implementar rate limiting para prevenir abuso

### Notas

- El campo `last_capture` se actualiza automáticamente en cada registro
- Los anuncios existentes se reactivan automáticamente (`activo: true`)
- La búsqueda de duplicados es exacta (título, precio y celular deben coincidir exactamente)
- Todos los campos adicionales del body se guardan en el documento
