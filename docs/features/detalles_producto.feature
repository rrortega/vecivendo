# language: es
Característica: Pantalla de Detalles de Producto

  Como usuario de Vecivendo
  Quiero ver el detalle completo de un producto con sus variantes
  Para decidir mi compra y añadirlo al carrito de manera informada

  Antecedentes:
    Dado que existe una página de detalles de producto
    Y los productos pueden tener variantes (ej. tamaño, color, capacidad)
    Y los productos tienen información de precio, descripción, imágenes y reviews

  Regla de Negocio: Variantes de Producto
    - Los productos pueden tener múltiples variantes con precios diferentes
    - Al seleccionar una variante, el precio debe actualizarse automáticamente
    - Solo se puede agregar al carrito si se ha seleccionado una variante (si aplica)
    - Las imágenes pueden cambiar según la variante seleccionada

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. La página debe mostrar toda la información del producto
  # 2. Las variantes deben ser seleccionables y actualizar el precio
  # 3. El usuario debe poder agregar el producto al carrito
  # 4. Las imágenes deben ser visualizables en tamaño completo
  # 5. Las reviews deben ser visibles y legibles

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE INFORMACIÓN DEL PRODUCTO
  # ============================================================================

  Escenario: Visualizar información completa del producto
    Dado que estoy en la pantalla de "Detalles del Producto"
    Entonces debo ver la imagen principal del producto
    Y debo ver el nombre del producto
    Y debo ver el rating promedio (ej. 4.5/5 estrellas)
    Y debo ver el porcentaje de aprobación (ej. "95% de compradores lo recomiendan")
    Y debo ver la cantidad de reviews (ej. "120 reseñas")
    Y debo ver la descripción detallada del producto
    Y debo ver el precio actual destacado
    Y si hay descuento, debo ver el precio anterior tachado

  Escenario: Visualizar producto con descuento
    Dado que estoy viendo un producto con descuento
    Y el precio original es $500
    Y el precio con descuento es $400
    Entonces debo ver "$400" destacado como precio actual
    Y debo ver "$500" tachado como precio anterior
    Y debo ver un badge indicando "20% OFF" o similar

  Escenario: Visualizar producto sin descuento
    Dado que estoy viendo un producto sin descuento
    Entonces debo ver solo el precio actual
    Y NO debo ver precio tachado
    Y NO debo ver badge de descuento

  Escenario: Visualizar galería de imágenes
    Dado que el producto tiene 5 imágenes
    Cuando visualizo la página de detalles
    Entonces debo ver la imagen principal grande
    Y debo ver miniaturas de las otras 4 imágenes
    Cuando hago clic en una miniatura
    Entonces esa imagen debe convertirse en la imagen principal

  Escenario: Ampliar imagen del producto
    Dado que estoy viendo la imagen principal
    Cuando hago clic en la imagen
    Entonces debe abrirse un modal o vista ampliada de la imagen
    Y debo poder hacer zoom o ver la imagen en tamaño completo
    Y debo poder cerrar el modal

  # ============================================================================
  # ESCENARIOS: SELECCIÓN DE VARIANTES
  # ============================================================================

  Escenario: Visualizar selector de variantes
    Dado que estoy viendo un producto con variantes de capacidad (128GB, 256GB, 512GB, 1TB)
    Entonces debo ver un selector de variantes claramente etiquetado
    Y las opciones deben ser: 128GB, 256GB, 512GB, 1TB
    Y debe haber una variante seleccionada por defecto (ej. 128GB)

  Escenario: Seleccionar variante y actualizar precio
    Dado que estoy viendo un producto con variantes
    Y la variante "128GB" cuesta $800
    Y la variante "1TB" cuesta $1200
    Cuando selecciono la variante "1TB"
    Entonces el precio debe actualizarse a $1200
    Y la variante "1TB" debe estar visualmente seleccionada
    Y si hay imagen específica para "1TB", debe mostrarse

  Escenario: Producto sin variantes
    Dado que estoy viendo un producto sin variantes
    Entonces NO debo ver selector de variantes
    Y debo ver directamente el precio único
    Y debo poder agregar al carrito sin seleccionar variante

  Escenario: Variante agotada o no disponible
    Dado que una variante "512GB" está agotada
    Cuando visualizo el selector de variantes
    Entonces la opción "512GB" debe estar deshabilitada
    Y debe mostrar un indicador "Agotado" o similar
    Y no debe permitir seleccionarla

  # ============================================================================
  # ESCENARIOS: AGREGAR AL CARRITO
  # ============================================================================

  Escenario: Añadir producto al carrito con variante seleccionada
    Dado que he seleccionado la variante "256GB"
    Cuando presiono el botón "Agregar al Carrito"
    Entonces el producto con variante "256GB" debe agregarse a mi carrito
    Y debo ver una confirmación visual "Producto agregado al carrito"
    Y el contador del carrito debe incrementarse en 1

  Escenario: Intentar agregar al carrito sin seleccionar variante
    Dado que estoy viendo un producto con variantes
    Y NO he seleccionado ninguna variante
    Cuando intento presionar "Agregar al Carrito"
    Entonces debo ver un mensaje "Por favor selecciona una variante"
    Y el producto NO debe agregarse al carrito

  Escenario: Agregar producto sin variantes al carrito
    Dado que estoy viendo un producto sin variantes
    Cuando presiono "Agregar al Carrito"
    Entonces el producto debe agregarse al carrito directamente
    Y debo ver confirmación

  Escenario: Seleccionar cantidad antes de agregar al carrito
    Dado que estoy en la página de detalles
    Y veo un selector de cantidad (1, 2, 3, ...)
    Cuando selecciono cantidad "3"
    Y presiono "Agregar al Carrito"
    Entonces deben agregarse 3 unidades del producto al carrito
    Y el contador del carrito debe incrementarse en 3

  # ============================================================================
  # ESCENARIOS: REVIEWS Y RATINGS
  # ============================================================================

  Escenario: Visualizar rating promedio
    Dado que el producto tiene 50 reviews
    Y el promedio es 4.5 estrellas
    Entonces debo ver "4.5" junto a las estrellas
    Y debo ver una representación visual de 4.5 estrellas (4 completas, media estrella)
    Y debo ver "(50 reseñas)" o similar

  Escenario: Ver lista de reviews
    Dado que el producto tiene reviews
    Cuando me desplazo a la sección de reviews
    Entonces debo ver las reviews más recientes o más útiles
    Y cada review debe mostrar: nombre del usuario, rating, comentario, fecha

  Escenario: Producto sin reviews
    Dado que el producto no tiene reviews aún
    Entonces debo ver un mensaje "Aún no hay reseñas para este producto"
    Y debo ver una opción "Sé el primero en dejar una reseña" (si he comprado)

  Escenario: Filtrar reviews por rating
    Dado que hay reviews con diferentes ratings
    Cuando selecciono "Solo 5 estrellas"
    Entonces debo ver solo las reviews con 5 estrellas

  # ============================================================================
  # ESCENARIOS: INFORMACIÓN ADICIONAL
  # ============================================================================

  Escenario: Ver especificaciones técnicas
    Dado que el producto tiene especificaciones técnicas
    Cuando me desplazo a la sección de especificaciones
    Entonces debo ver una tabla o lista con:
      | Especificación | Valor          |
      | Marca          | Samsung        |
      | Modelo         | Galaxy S21     |
      | Peso           | 169g           |
      | Dimensiones    | 151.7 x 71.2mm |

  Escenario: Ver política de devolución
    Dado que estoy en la página de detalles
    Entonces debo ver información sobre política de devolución
    Y debe indicar el plazo (ej. "30 días para devoluciones")

  # ============================================================================
  # ESCENARIOS: NAVEGACIÓN
  # ============================================================================

  Escenario: Volver al listado de productos
    Dado que estoy en la página de detalles
    Cuando hago clic en "Volver" o en el breadcrumb
    Entonces debo regresar a la página de listado de productos
    Y debo mantener los filtros que tenía aplicados (si aplica)

  Escenario: Navegar a productos relacionados
    Dado que estoy viendo un producto
    Cuando me desplazo a la sección "Productos relacionados"
    Entonces debo ver 3-5 productos similares
    Cuando hago clic en un producto relacionado
    Entonces debo navegar a la página de detalles de ese producto

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar producto
    Dado que intento acceder a un producto con ID inválido
    Cuando la página intenta cargar
    Entonces debo ver un mensaje "Producto no encontrado"
    Y debo ver un botón para volver al listado

  Escenario: Manejo de error al agregar al carrito
    Dado que intento agregar un producto al carrito
    Y hay un error de conexión
    Entonces debo ver un mensaje "Error al agregar al carrito"
    Y debo poder reintentar

  Escenario: Producto agotado
    Dado que el producto está agotado (stock = 0)
    Entonces el botón "Agregar al Carrito" debe estar deshabilitado
    Y debo ver un mensaje "Producto agotado"
    Y debo ver una opción "Notificarme cuando esté disponible"
