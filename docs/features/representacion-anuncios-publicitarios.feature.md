# Característica: Representación de Anuncios Publicitarios de Pago

## Descripción
Como usuario de la plataforma, quiero ver anuncios publicitarios de pago integrados de forma natural en la experiencia de navegación, para conocer ofertas relevantes mientras exploro productos de mi comunidad.

Como anunciante, quiero que mis anuncios de pago se muestren de diferentes formas según su tipo, para maximizar la visibilidad y el engagement con mi audiencia objetivo.

---

## Historia de Usuario 1: Anuncios tipo Banner

**Como** administrador de la plataforma  
**Quiero** que los anuncios de tipo banner se muestren de forma prominente en la parte superior de la página de anuncios  
**Para** maximizar la visibilidad para los anunciantes que pagan por este formato premium

### Escenario 1.1: Mostrar banner único en el top de la página
```gherkin
Dado que existen anuncios de pago de tipo "banner" activos
Y el usuario accede a la página principal de anuncios de una residencial
Cuando la página carga completamente
Entonces se muestra un banner aleatorio en la parte superior de la lista de productos
Y el banner muestra la imagen del anuncio en formato 2.65:1
Y el banner incluye una etiqueta visible de "Publicidad"
```

### Escenario 1.2: Mostrar banners intercalados cada 13 anuncios
```gherkin
Dado que existen múltiples anuncios de pago de tipo "banner" que coinciden con el filtro de categoría
Y la lista de productos gratuitos tiene más de 13 elementos
Cuando la página muestra los productos
Entonces se inserta un banner de pago cada 13 anuncios gratuitos
Y los banners insertados rotan entre los anuncios de pago disponibles
```

### Escenario 1.3: Filtrado por categoría
```gherkin
Dado que existen anuncios de pago de tipo "banner" asociados a categorías específicas
Cuando el usuario aplica un filtro de categoría "electronica"
Entonces solo se muestran banners que no tengan categorías asignadas
O banners que tengan la categoría "electronica" en su lista de categorías
```

### Escenario 1.4: Registro de vista del banner
```gherkin
Dado que se muestra un banner de anuncio de pago
Cuando el banner se hace visible en el viewport del usuario (50% visible)
Entonces se registra una vista en la métrica del anuncio
Y el contador de "vistas" del anuncio se incrementa en 1
```

### Escenario 1.5: Registro de click en el banner
```gherkin
Dado que se muestra un banner de anuncio de pago
Cuando el usuario hace click en el banner
Entonces se registra un click en la métrica del anuncio
Y el contador de "clicks" del anuncio se incrementa en 1
Y el usuario es redirigido al enlace de destino del anuncio
```

---

## Historia de Usuario 2: Anuncios tipo Embedded

**Como** administrador de la plataforma  
**Quiero** que los anuncios de tipo embedded se mezclen visualmente con los anuncios gratuitos  
**Para** ofrecer una experiencia de publicidad nativa menos intrusiva

### Escenario 2.1: Mostrar anuncios embedded mezclados con productos
```gherkin
Dado que existen anuncios de pago de tipo "embedded" activos
Y la lista de productos gratuitos tiene más de 13 elementos
Cuando la página muestra los productos
Entonces se inserta un anuncio embedded cada 13 productos gratuitos
Y el anuncio embedded tiene el mismo tamaño y formato que los productos regulares
```

### Escenario 2.2: Badge ADV visible en anuncios embedded
```gherkin
Dado que se muestra un anuncio de tipo "embedded"
Cuando el anuncio es visible en la página
Entonces muestra un badge prominente con el texto "ADV"
Y el badge tiene un color distintivo (ámbar/naranja)
Y el badge incluye una animación de pulso para mayor visibilidad
```

### Escenario 2.3: Compatibilidad con modo grid y lista
```gherkin
Dado que se muestran anuncios de tipo "embedded" en la grilla
Cuando el usuario cambia entre modo "grid" y modo "lista"
Entonces los anuncios embedded se adaptan al mismo formato
Y mantienen la proporción y estilos equivalentes a los productos regulares
```

### Escenario 2.4: Registro de métricas en embedded
```gherkin
Dado que se muestra un anuncio embedded
Cuando el anuncio se hace visible en el viewport (30% visible)
Entonces se registra una vista en la métrica del anuncio
Y cuando el usuario hace click en el anuncio
Entonces se registra un click en la métrica del anuncio
```

---

## Historia de Usuario 3: Anuncios tipo Cross (Promoción Cruzada)

**Como** administrador de la plataforma  
**Quiero** que los anuncios de tipo cross se muestren dentro de la página de detalle de anuncios gratuitos  
**Para** aprovechar el contexto de compra y ofrecer productos complementarios

### Escenario 3.1: Mostrar anuncio cross en página de detalle
```gherkin
Dado que existe un anuncio de pago de tipo "cross" activo
Y el anuncio cross tiene una categoría que coincide con el anuncio gratuito
Cuando el usuario visita la página de detalle de un anuncio gratuito
Entonces se muestra el anuncio cross debajo de la información del vendedor
Y antes de la sección de productos relacionados
```

### Escenario 3.2: Presentación visual del anuncio cross
```gherkin
Dado que se muestra un anuncio cross en la página de detalle
Cuando el anuncio es visible
Entonces muestra el encabezado "También te puede interesar"
Y incluye una etiqueta distintiva "Patrocinado"
Y muestra la imagen, título y descripción del anuncio
Y tiene un botón de acción "Ver más" con flecha animada
```

### Escenario 3.3: Matching por categoría
```gherkin
Dado que el anuncio gratuito pertenece a la categoría "hogar"
Y existen anuncios cross con categorías ["hogar", "electronica"] y ["moda"]
Cuando se carga la página de detalle
Entonces solo se muestra un anuncio cross que incluya "hogar" en sus categorías
O un anuncio cross sin categorías asignadas (aplica a todas)
```

### Escenario 3.4: Sin anuncio cross disponible
```gherkin
Dado que no existen anuncios de pago de tipo "cross" activos
O ninguno coincide con la categoría del anuncio gratuito
Cuando el usuario visita la página de detalle del anuncio
Entonces no se muestra la sección de promoción cruzada
Y el layout no se ve afectado por espacios vacíos
```

---

## Historia de Usuario 4: Tracking de Métricas

**Como** anunciante  
**Quiero** que se registren todas las vistas y clicks de mis anuncios de pago  
**Para** poder analizar el rendimiento de mis campañas publicitarias

### Escenario 4.1: Registro de vista usando IntersectionObserver y sessionStorage
```gherkin
Dado que se renderiza un componente de anuncio de pago (banner, embedded, o cross)
Y no existe una entrada en sessionStorage con la clave "paid_ad_viewed_{adId}"
Cuando el anuncio alcanza el umbral de visibilidad requerido en el viewport
  | Tipo     | Umbral |
  | banner   | 50%    |
  | embedded | 30%    |
  | cross    | 50%    |
Entonces se envía una petición POST a /api/paid-ads/track
Con el cuerpo: { adId: "xxx", type: "view" }
Y el campo "vistas" del anuncio en la base de datos se incrementa en 1
Y se guarda "paid_ad_viewed_{adId}" = "true" en sessionStorage
Y la vista NO se registra de nuevo aunque el usuario haga scroll y vuelva a ver el anuncio
```

### Escenario 4.2: Prevención de vistas duplicadas por scroll
```gherkin
Dado que el usuario ya visualizó un anuncio de pago en esta sesión
Y existe una entrada "paid_ad_viewed_{adId}" = "true" en sessionStorage
Cuando el anuncio vuelve a ser visible por scroll o lazy loading
Entonces NO se envía una nueva petición de tracking
Y el contador de vistas NO se incrementa
```

### Escenario 4.3: Registro de click
```gherkin
Dado que se muestra un anuncio de pago
Cuando el usuario hace click en cualquier parte interactiva del anuncio
Entonces se envía una petición POST a /api/paid-ads/track
Con el cuerpo: { adId: "xxx", type: "click" }
Y el campo "clicks" del anuncio en la base de datos se incrementa en 1
Y el usuario es redirigido al link de destino después de registrar el click
```

### Escenario 4.3: Manejo de enlaces externos vs internos
```gherkin
Dado que un anuncio de pago tiene un link de destino
Cuando el link comienza con "http" o "https"
Entonces se marca como enlace externo
Y se abre en una nueva pestaña con rel="noopener noreferrer sponsored"
Y se muestra un indicador visual de enlace externo

Cuando el link es una ruta relativa (ej: "/ofertas")
Entonces se navega internamente sin abrir nueva pestaña
```

---

## Criterios de Aceptación Generales

1. **Rendimiento**: La carga de anuncios de pago no debe bloquear la carga del contenido principal
2. **Accesibilidad**: Todos los anuncios deben ser navegables por teclado y tener textos alt apropiados
3. **Responsive**: Los anuncios deben adaptarse correctamente a dispositivos móviles, tablets y desktop
4. **Consistencia Visual**: Los estilos de los anuncios deben seguir el sistema de diseño existente
5. **Filtrado Correcto**: Los anuncios solo deben mostrarse si están activos, dentro de su período de vigencia, y coinciden con los filtros aplicados
6. **Indicadores Claros**: Todos los anuncios de pago deben estar claramente identificados como publicidad
7. **Tracking Único**: Las vistas no deben duplicarse si el usuario hace scroll múltiples veces sobre el mismo anuncio

---

## Notas Técnicas

- **API Endpoint Público**: `GET /api/paid-ads/public?type=<type>&category=<slug>&residentialId=<id>&limit=<n>`
- **API Endpoint Tracking**: `POST /api/paid-ads/track` con body `{ adId, type: "view" | "click" }`
- **Colección Appwrite**: `anuncios_pago`
- **Campos de Métricas**: `vistas` (integer), `clicks` (integer)
