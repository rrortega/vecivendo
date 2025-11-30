# language: es
Característica: Nuevas Funcionalidades de UI y Monetización
  Como usuario de Vecivendo
  Quiero ver una interfaz mejorada y anuncios relevantes
  Para tener una mejor experiencia de navegación y descubrir ofertas

  Regla: Mejoras en Categorías
    Escenario: Visualización de iconos en categorías
      Dado que estoy en la página de inicio
      Cuando observo la barra de categorías
      Entonces cada categoría debe tener un icono representativo
      Y el scrollbar debe ser fino y estético en modo oscuro

  Regla: Anuncios Pagados
    Escenario: Visualización de Banner Promocional
      Dado que hay anuncios pagados activos en el sistema
      Cuando entro a la página de inicio
      Entonces debo ver un banner promocional destacado
      
    Escenario: Navegación desde Banner Externo
      Dado que veo un banner con enlace externo (ej. Google)
      Cuando hago clic en "Ver Oferta"
      Entonces se debe abrir una nueva pestaña con la URL destino

    Escenario: Navegación desde Banner Interno
      Dado que veo un banner con enlace interno a un anuncio
      Cuando hago clic en "Ver Oferta"
      Entonces debo ser redirigido a la página de detalle de ese anuncio dentro de la app

  Regla: Anuncios Antiguos
    Escenario: Advertencia en anuncio antiguo
      Dado que visito un anuncio publicado hace más de 7 días
      Cuando carga la página de detalle
      Entonces debo ver un mensaje de advertencia "Anuncio Antiguo"
      Y el botón de "Contactar" debe estar deshabilitado

  Regla: Sistema de Reseñas
    Escenario: Ver reseñas de un anunciante
      Dado que estoy viendo un anuncio
      Cuando me desplazo al final de la página
      Entonces debo ver la sección "Reseñas del Anunciante"
      Y debo ver el promedio de estrellas y los comentarios de otros vecinos
