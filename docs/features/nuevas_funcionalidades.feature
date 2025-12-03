# language: es
Característica: Nuevas Funcionalidades de UI y Monetización

  Como usuario de Vecivendo
  Quiero ver una interfaz mejorada con iconos en categorías y anuncios pagados relevantes
  Para tener una mejor experiencia de navegación y descubrir ofertas destacadas

  Antecedentes:
    Dado que existe un sistema de categorías con iconos
    Y existe un sistema de anuncios pagados (publicidad)
    Y existe un sistema de validación de vigencia de anuncios

  Regla de Negocio: Anuncios y Promociones
    - Los anuncios pagados deben mostrarse en banners destacados
    - Los anuncios antiguos (>7 días) deben mostrar advertencia
    - Las categorías deben tener iconos representativos
    - Los enlaces externos deben abrirse en nueva pestaña

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Las categorías deben mostrar iconos representativos
  # 2. Los banners de anuncios pagados deben ser visibles y clickeables
  # 3. Los anuncios antiguos deben mostrar advertencia clara
  # 4. El sistema de reseñas debe ser funcional y visible
  # 5. La navegación debe diferenciar entre enlaces internos y externos

  # ============================================================================
  # ESCENARIOS: MEJORAS EN CATEGORÍAS
  # ============================================================================

  Escenario: Visualización de iconos en categorías
    Dado que estoy en la página de inicio o listado de anuncios
    Cuando observo la barra de categorías
    Entonces cada categoría debe tener un icono representativo:
      | Categoría    | Icono sugerido        |
      | Electrónica  | Laptop o chip         |
      | Hogar        | Casa                  |
      | Ropa         | Camiseta              |
      | Deportes     | Balón                 |
      | Otros        | Puntos suspensivos    |
    Y los iconos deben ser visibles y claros

  Escenario: Scrollbar estético en modo oscuro
    Dado que estoy en modo oscuro
    Y la barra de categorías tiene scroll horizontal
    Cuando hago scroll en las categorías
    Entonces el scrollbar debe ser fino y estético
    Y debe contrastar sutilmente con el fondo oscuro
    Y no debe ser intrusivo visualmente

  Escenario: Hover sobre categoría con icono
    Dado que veo las categorías con iconos
    Cuando paso el mouse sobre una categoría
    Entonces debe haber un efecto visual de hover
    Y el icono y texto deben resaltarse

  # ============================================================================
  # ESCENARIOS: ANUNCIOS PAGADOS (BANNERS)
  # ============================================================================

  Escenario: Visualización de Banner Promocional en página de inicio
    Dado que hay anuncios pagados activos en el sistema
    Y estoy en la página de inicio del residencial
    Cuando la página carga completamente
    Entonces debo ver un banner promocional destacado
    Y el banner debe mostrar: imagen, título, descripción breve
    Y debe tener un botón "Ver Oferta" o similar

  Escenario: Visualización de múltiples banners en carrusel
    Dado que hay 3 anuncios pagados activos
    Cuando visualizo la sección de banners
    Entonces debo ver un carrusel con los 3 banners
    Y debo poder navegar entre ellos con flechas o dots
    Y el carrusel debe auto-avanzar cada 5 segundos

  Escenario: Banner sin anuncios pagados activos
    Dado que no hay anuncios pagados activos
    Cuando accedo a la página de inicio
    Entonces no debo ver la sección de banners
    O debo ver un banner por defecto de Vecivendo

  Escenario: Navegación desde Banner Externo
    Dado que veo un banner con enlace externo (ej. "https://google.com")
    Cuando hago clic en "Ver Oferta"
    Entonces se debe abrir una nueva pestaña del navegador
    Y la URL destino debe ser "https://google.com"
    Y la pestaña actual debe permanecer abierta

  Escenario: Navegación desde Banner Interno
    Dado que veo un banner con enlace interno a un anuncio (ej. "/residencial/anuncio/123")
    Cuando hago clic en "Ver Oferta"
    Entonces debo ser redirigido a la página de detalle de ese anuncio dentro de la app
    Y NO debe abrirse una nueva pestaña
    Y debo ver los detalles completos del anuncio

  Escenario: Registro de click en banner (analytics)
    Dado que veo un banner promocional
    Cuando hago clic en "Ver Oferta"
    Entonces el sistema debe registrar un evento de tipo "click" en los logs
    Y el evento debe asociarse al ID del anuncio pagado

  # ============================================================================
  # ESCENARIOS: ANUNCIOS ANTIGUOS
  # ============================================================================

  Escenario: Advertencia en anuncio antiguo (más de 7 días)
    Dado que visito un anuncio publicado hace más de 7 días
    Cuando carga la página de detalle
    Entonces debo ver un mensaje de advertencia destacado "Anuncio Antiguo" o "Este anuncio tiene más de 7 días"
    Y el mensaje debe tener un color llamativo (ej. naranja o amarillo)
    Y debe estar visible en la parte superior de la página

  Escenario: Botón de contactar deshabilitado en anuncio antiguo
    Dado que estoy viendo un anuncio antiguo (>7 días)
    Cuando intento interactuar con el botón de "Contactar" o "Agregar al carrito"
    Entonces el botón debe estar deshabilitado
    Y debe mostrar un tooltip "Este anuncio ha caducado"
    Y no debe permitir agregar al carrito

  Escenario: Anuncio reciente (menos de 7 días)
    Dado que visito un anuncio publicado hace 3 días
    Cuando carga la página de detalle
    Entonces NO debo ver ninguna advertencia de "Anuncio Antiguo"
    Y el botón de "Contactar" o "Agregar al carrito" debe estar habilitado

  Escenario: Cálculo de vigencia basado en $updatedAt
    Dado que un anuncio fue creado hace 10 días
    Pero fue actualizado hace 2 días
    Cuando visualizo el anuncio
    Entonces el sistema debe calcular la vigencia desde la fecha de actualización ($updatedAt)
    Y NO debe mostrar advertencia de anuncio antiguo
    Y el anuncio debe estar activo

  # ============================================================================
  # ESCENARIOS: SISTEMA DE RESEÑAS
  # ============================================================================

  Escenario: Ver reseñas de un anunciante en página de detalle
    Dado que estoy viendo un anuncio del anunciante "Juan Pérez"
    Y "Juan Pérez" tiene 5 reseñas
    Cuando me desplazo al final de la página de detalle
    Entonces debo ver la sección "Reseñas del Anunciante"
    Y debo ver el promedio de estrellas (ej. 4.5/5)
    Y debo ver los 5 comentarios de otros vecinos

  Escenario: Ver reseñas sin comentarios disponibles
    Dado que estoy viendo un anuncio de un anunciante nuevo
    Y el anunciante no tiene reseñas aún
    Cuando me desplazo a la sección de reseñas
    Entonces debo ver un mensaje "Este anunciante aún no tiene reseñas"
    Y debo ver una opción para "Ser el primero en dejar una reseña" (si he comprado)

  Escenario: Visualizar promedio de estrellas
    Dado que un anunciante tiene las siguientes reseñas: 5, 4, 5, 3, 5 estrellas
    Cuando visualizo la sección de reseñas
    Entonces el promedio debe mostrar 4.4 estrellas
    Y debe haber una representación visual (estrellas rellenas/vacías)

  Escenario: Leer reseña completa
    Dado que veo la lista de reseñas
    Cuando hago clic en "Leer más" en una reseña larga
    Entonces debe expandirse para mostrar el comentario completo
    Y debo poder colapsarla nuevamente

  Escenario: Dejar una reseña (si he comprado)
    Dado que he realizado una compra al anunciante "Juan Pérez"
    Y estoy viendo un anuncio de "Juan Pérez"
    Cuando accedo a la sección de reseñas
    Entonces debo ver un botón "Dejar una reseña"
    Cuando hago clic en el botón
    Entonces debe abrirse un formulario para calificar (estrellas) y comentar

  Escenario: No poder dejar reseña sin haber comprado
    Dado que NO he realizado ninguna compra al anunciante
    Cuando accedo a la sección de reseñas
    Entonces NO debo ver el botón "Dejar una reseña"
    O el botón debe estar deshabilitado con tooltip "Debes realizar una compra primero"

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar banner
    Dado que hay un error al cargar los anuncios pagados
    Cuando accedo a la página de inicio
    Entonces no debo ver la sección de banners
    O debo ver un banner placeholder
    Y el resto de la página debe cargarse normalmente

  Escenario: Manejo de error al cargar reseñas
    Dado que hay un error de conexión al cargar reseñas
    Cuando accedo a la sección de reseñas
    Entonces debo ver un mensaje "Error al cargar reseñas"
    Y debo ver un botón "Reintentar"

  Escenario: Banner con URL inválida
    Dado que un banner tiene una URL destino inválida o rota
    Cuando hago clic en "Ver Oferta"
    Entonces debo ver un mensaje de error "Enlace no disponible"
    Y no debe abrirse ninguna pestaña rota
