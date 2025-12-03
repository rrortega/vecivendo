# language: es
Característica: Mejoras en la Página de Detalles del Anuncio

  Como usuario de Vecivendo
  Quiero ver información detallada sobre la caducidad del anuncio y tener una mejor experiencia de usuario
  Para poder tomar decisiones de compra informadas y navegar cómodamente

  Antecedentes:
    Dado que existe una colección "anuncios" en Appwrite
    Y cada anuncio tiene los atributos: $updatedAt, dias_vigencia, activo, titulo, precio, descripcion, imagenes

  Regla de Negocio: Caducidad de Anuncios
    - Los anuncios tienen una vigencia definida por el atributo "dias_vigencia" (por defecto 7 días)
    - La vigencia se calcula desde la fecha de última actualización ($updatedAt)
    - Los anuncios caducados o desactivados no permiten agregar al carrito

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. La página debe mostrar la fecha de publicación/actualización del anuncio
  # 2. Debe mostrar un contador de tiempo restante hasta la caducidad
  # 3. Los anuncios caducados o desactivados deben deshabilitar el botón de agregar al carrito
  # 4. Los usuarios deben poder agregar/quitar anuncios de favoritos
  # 5. Las reseñas deben mostrarse en un modal con scroll completo
  # 6. La interfaz debe ser responsiva y funcional en móvil y escritorio

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE INFORMACIÓN DEL ANUNCIO
  # ============================================================================

  Escenario: Ver fecha de caducidad y contador de anuncio activo
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio fue actualizado hace 2 días
    Y tiene una vigencia de 7 días
    Cuando la página carga completamente
    Entonces debo ver la fecha de publicación o actualización del anuncio
    Y debo ver un contador que indique "Quedan 5 días" o similar
    Y el botón "Agregar al carrito" debe estar habilitado

  Escenario: Ver anuncio próximo a caducar (menos de 24 horas)
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio fue actualizado hace 6 días y 20 horas
    Y tiene una vigencia de 7 días
    Cuando la página carga completamente
    Entonces debo ver un mensaje destacado indicando "Quedan 4 horas" o similar
    Y el mensaje debe tener un estilo visual que llame la atención (ej. color naranja o rojo)
    Y el botón "Agregar al carrito" debe estar habilitado

  Escenario: Ver anuncio caducado
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio fue actualizado hace 8 días
    Y tiene una vigencia de 7 días
    Cuando la página carga completamente
    Entonces debo ver un mensaje indicando "Este anuncio ha caducado"
    Y el botón "Agregar al carrito" debe estar deshabilitado
    Y no debo poder agregar el producto al carrito

  Escenario: Ver anuncio desactivado manualmente
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio tiene el atributo "activo" en false
    Cuando la página carga completamente
    Entonces debo ver un mensaje indicando "Este anuncio no está disponible"
    Y el botón "Agregar al carrito" debe estar deshabilitado
    Y no debo poder agregar el producto al carrito

  Escenario: Ver detalles de anuncio sin imágenes
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio no tiene imágenes asociadas
    Cuando la página carga completamente
    Entonces debo ver una imagen placeholder por defecto
    Y debo poder ver el resto de la información del anuncio normalmente

  Escenario: Ver detalles de anuncio con múltiples imágenes
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio tiene 5 imágenes
    Cuando la página carga completamente
    Entonces debo ver un carrusel o galería de imágenes
    Y debo poder navegar entre las imágenes
    Y debo poder hacer clic en una imagen para verla en tamaño completo

  # ============================================================================
  # ESCENARIOS: GESTIÓN DE FAVORITOS
  # ============================================================================

  Escenario: Agregar anuncio a favoritos desde la página de detalles
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio NO está en mis favoritos
    Cuando hago clic en el botón de corazón sobre la imagen
    Entonces el anuncio debe agregarse a mis favoritos
    Y el icono del corazón debe cambiar a estado "relleno"
    Y debo ver una notificación de confirmación "Agregado a favoritos"

  Escenario: Quitar anuncio de favoritos desde la página de detalles
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio YA está en mis favoritos
    Cuando hago clic en el botón de corazón sobre la imagen
    Entonces el anuncio debe eliminarse de mis favoritos
    Y el icono del corazón debe cambiar a estado "vacío"
    Y debo ver una notificación de confirmación "Eliminado de favoritos"

  Escenario: Persistencia de favoritos al recargar la página
    Dado que he agregado el anuncio "A123" a mis favoritos
    Cuando recargo la página de detalles del anuncio "A123"
    Entonces el icono del corazón debe mostrarse en estado "relleno"
    Y el anuncio debe seguir en mi lista de favoritos

  # ============================================================================
  # ESCENARIOS: MODAL DE RESEÑAS
  # ============================================================================

  Escenario: Abrir modal de reseñas con contenido
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio tiene 10 reseñas
    Cuando hago clic en el botón "Ver reseñas" o similar
    Entonces debe abrirse un modal de reseñas
    Y el modal debe ocupar la altura completa de la página (o casi completa)
    Y debo ver las 10 reseñas dentro del modal
    Y la barra inferior de "Agregar al carrito" debe ocultarse mientras el modal esté abierto

  Escenario: Hacer scroll en el modal de reseñas
    Dado que el modal de reseñas está abierto
    Y hay más reseñas de las que caben en la pantalla
    Cuando hago scroll dentro del modal
    Entonces debo poder ver todas las reseñas desplazándome
    Y el scroll debe ser fluido y no afectar la página de fondo

  Escenario: Cerrar modal de reseñas
    Dado que el modal de reseñas está abierto
    Cuando hago clic en el botón de cerrar (X) o fuera del modal
    Entonces el modal debe cerrarse
    Y la barra inferior de "Agregar al carrito" debe volver a mostrarse
    Y debo volver a la página de detalles del anuncio

  Escenario: Ver modal de reseñas sin reseñas disponibles
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio no tiene reseñas
    Cuando hago clic en el botón "Ver reseñas" o similar
    Entonces debe abrirse el modal
    Y debo ver un mensaje indicando "Aún no hay reseñas para este anuncio"
    Y debo poder cerrar el modal normalmente

  # ============================================================================
  # ESCENARIOS: AGREGAR AL CARRITO
  # ============================================================================

  Escenario: Agregar anuncio activo al carrito
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio está activo y no ha caducado
    Cuando hago clic en el botón "Agregar al carrito"
    Entonces el producto debe agregarse al carrito
    Y debo ver una notificación de confirmación
    Y el contador del carrito debe incrementarse en 1

  Escenario: Intentar agregar anuncio caducado al carrito
    Dado que estoy en la página de detalles del anuncio "A123"
    Y el anuncio ha caducado
    Cuando intento hacer clic en el botón "Agregar al carrito"
    Entonces el botón debe estar deshabilitado
    Y no debe ocurrir ninguna acción
    Y debo ver un mensaje indicando que el anuncio no está disponible

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar detalles del anuncio
    Dado que intento acceder a la página de detalles del anuncio "A999"
    Y el anuncio no existe en la base de datos
    Cuando la página intenta cargar
    Entonces debo ver un mensaje de error "Anuncio no encontrado"
    Y debo ver un botón para volver a la página principal o de búsqueda

  Escenario: Manejo de error de red al cargar detalles
    Dado que intento acceder a la página de detalles de un anuncio
    Y hay un problema de conexión con el servidor
    Cuando la página intenta cargar
    Entonces debo ver un mensaje de error "Error al cargar el anuncio"
    Y debo ver un botón para reintentar la carga

  Escenario: Manejo de error al agregar a favoritos
    Dado que estoy en la página de detalles del anuncio "A123"
    Y hay un problema de conexión al intentar agregar a favoritos
    Cuando hago clic en el botón de corazón
    Entonces debo ver un mensaje de error "No se pudo agregar a favoritos"
    Y el estado del icono no debe cambiar
    Y debo poder reintentar la acción
