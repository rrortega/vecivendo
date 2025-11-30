Feature: Mejoras en la Página de Detalles del Anuncio

  Como usuario de Vecivendo
  Quiero ver información detallada sobre la caducidad del anuncio y tener una mejor experiencia de usuario en la página de detalles
  Para poder tomar decisiones de compra informadas y navegar cómodamente

  Scenario: Ver fecha de caducidad y contador
    Given que estoy en la página de detalles de un anuncio
    Then debo ver la fecha de publicación o actualización del anuncio
    And debo ver un contador que indique cuánto tiempo falta para que el anuncio caduque (7 días desde la actualización)

  Scenario: Anuncio caducado o desactivado
    Given que estoy en la página de detalles de un anuncio
    And el anuncio ha caducado o está desactivado
    Then el botón de "Agregar al carrito" debe estar deshabilitado
    And no debo poder agregar el producto al carrito

  Scenario: Agregar a favoritos desde detalles
    Given que estoy en la página de detalles de un anuncio
    When hago clic en el botón de corazón sobre la imagen
    Then el anuncio debe agregarse a mis favoritos
    And el icono del corazón debe cambiar de estado (relleno)
    And si vuelvo a hacer clic, el anuncio debe eliminarse de mis favoritos

  Scenario: Ver reseñas en modal ampliado
    Given que estoy en la página de detalles de un anuncio
    When abro el modal de reseñas
    Then el modal debe ocupar la altura completa de la página (o casi completa)
    And debo poder hacer scroll dentro del modal para ver todas las reseñas
    And la barra inferior de "Agregar al carrito" debe ocultarse mientras el modal esté abierto
