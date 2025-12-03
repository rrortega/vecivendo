# language: es
Característica: Pantalla Descubrir / Inicio

  Como usuario de Vecivendo
  Quiero ver promociones, productos destacados y navegar por categorías
  Para descubrir ofertas y artículos de interés en mi residencial

  Antecedentes:
    Dado que existe una página de inicio/descubrir
    Y hay productos y anuncios disponibles en el residencial
    Y existen categorías de productos configuradas

  Regla de Negocio: Visualización de Productos
    - Los productos deben mostrarse en tarjetas con imagen, título, precio y estado
    - Los productos caducados o desactivados no deben mostrarse
    - Las categorías deben ser dinámicas según los productos disponibles
    - La navegación debe ser fluida y responsiva

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. La página debe mostrar header fijo con título, búsqueda y carrito
  # 2. Debe mostrar banners de promoción si están configurados
  # 3. Debe mostrar categorías en chips horizontales con scroll
  # 4. Debe mostrar productos en grid responsivo (1 columna móvil, 2-3 escritorio)
  # 5. La barra de navegación inferior debe estar siempre visible
  # 6. Los filtros por categoría deben funcionar correctamente

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE ELEMENTOS PRINCIPALES
  # ============================================================================

  Escenario: Visualizar página de descubrir completa
    Dado que estoy en la pantalla "Descubrir"
    Cuando la página carga completamente
    Entonces debo ver un header fijo con el título "Descubrir"
    Y debo ver un icono de búsqueda en el header
    Y debo ver un icono de carrito con badge mostrando la cantidad de productos
    Y debo ver un banner de promoción (si está configurado)
    Y debo ver una sección de categorías con chips (Todos, Electrónica, Hogar, etc.)
    Y debo ver un listado de productos destacados en tarjetas verticales
    Y debo ver una barra de navegación inferior con: Inicio, Buscar, Favoritos, Perfil

  Escenario: Visualizar header con carrito vacío
    Dado que estoy en la pantalla "Descubrir"
    Y no tengo productos en el carrito
    Cuando visualizo el header
    Entonces el icono del carrito debe mostrarse sin badge
    O el badge debe mostrar "0"

  Escenario: Visualizar header con productos en el carrito
    Dado que estoy en la pantalla "Descubrir"
    Y tengo 3 productos en el carrito
    Cuando visualizo el header
    Entonces el icono del carrito debe mostrar un badge con "3"
    Y el badge debe ser visible y destacado

  Escenario: Visualizar banner de promoción
    Dado que estoy en la pantalla "Descubrir"
    Y existe un banner de promoción activo
    Cuando la página carga
    Entonces debo ver el banner con imagen y texto promocional
    Y el banner debe ser clickeable
    Y debe redirigir a la página de la promoción al hacer clic

  Escenario: Visualizar página sin banner de promoción
    Dado que estoy en la pantalla "Descubrir"
    Y no existe un banner de promoción activo
    Cuando la página carga
    Entonces no debo ver la sección de banner
    Y debo ver directamente las categorías y productos

  # ============================================================================
  # ESCENARIOS: CATEGORÍAS
  # ============================================================================

  Escenario: Visualizar categorías disponibles
    Dado que estoy en la pantalla "Descubrir"
    Y existen productos en las categorías: Electrónica, Hogar, Ropa
    Cuando visualizo la sección de categorías
    Entonces debo ver chips para: Todos, Electrónica, Hogar, Ropa
    Y el chip "Todos" debe estar seleccionado por defecto
    Y debo poder hacer scroll horizontal si hay muchas categorías

  Escenario: Filtrar productos por categoría
    Dado que estoy en la pantalla "Descubrir"
    Y hay 10 productos en total
    Y 4 productos pertenecen a la categoría "Electrónica"
    Cuando selecciono la categoría "Electrónica"
    Entonces el listado de productos debe mostrar solo los 4 productos de "Electrónica"
    Y el chip "Electrónica" debe estar resaltado visualmente
    Y el chip "Todos" debe estar desmarcado

  Escenario: Volver a mostrar todos los productos
    Dado que estoy viendo productos filtrados por "Electrónica"
    Cuando selecciono la categoría "Todos"
    Entonces el listado debe mostrar todos los productos sin filtro
    Y el chip "Todos" debe estar resaltado
    Y el chip "Electrónica" debe estar desmarcado

  Escenario: Filtrar categoría sin productos
    Dado que estoy en la pantalla "Descubrir"
    Y la categoría "Deportes" no tiene productos disponibles
    Cuando selecciono la categoría "Deportes"
    Entonces debo ver un mensaje "No hay productos disponibles en esta categoría"
    Y debo ver un botón para volver a "Todos"

  Escenario: Scroll horizontal en categorías
    Dado que estoy en la pantalla "Descubrir"
    Y hay 10 categorías disponibles
    Cuando visualizo la sección de categorías en móvil
    Entonces debo poder hacer scroll horizontal para ver todas las categorías
    Y el scroll debe ser fluido

  # ============================================================================
  # ESCENARIOS: LISTADO DE PRODUCTOS
  # ============================================================================

  Escenario: Visualizar productos en grid responsivo
    Dado que estoy en la pantalla "Descubrir"
    Y hay 12 productos disponibles
    Cuando visualizo en dispositivo móvil
    Entonces los productos deben mostrarse en 1 columna
    Cuando visualizo en tablet
    Entonces los productos deben mostrarse en 2 columnas
    Cuando visualizo en escritorio
    Entonces los productos deben mostrarse en 3 columnas

  Escenario: Visualizar tarjeta de producto completa
    Dado que estoy en la pantalla "Descubrir"
    Cuando visualizo una tarjeta de producto
    Entonces cada tarjeta debe mostrar:
      | Elemento          | Descripción                    |
      | Imagen            | Imagen principal del producto  |
      | Título            | Nombre del producto            |
      | Precio            | Precio en formato moneda       |
      | Categoría         | Categoría del producto         |
      | Botón favorito    | Icono de corazón               |
    Y la tarjeta debe ser clickeable

  Escenario: Navegación a detalle de producto
    Dado que veo un producto "Laptop HP" en el listado
    Cuando hago clic en la tarjeta del producto
    Entonces debo ser redirigido a la pantalla de "Detalles del Producto"
    Y debo ver toda la información detallada del producto "Laptop HP"

  Escenario: Visualizar productos sin imagen
    Dado que estoy en la pantalla "Descubrir"
    Y un producto no tiene imagen asociada
    Cuando visualizo el listado
    Entonces el producto debe mostrar una imagen placeholder por defecto
    Y el resto de la información debe mostrarse normalmente

  # ============================================================================
  # ESCENARIOS: AGREGAR A FAVORITOS DESDE LISTADO
  # ============================================================================

  Escenario: Agregar producto a favoritos desde el listado
    Dado que estoy en la pantalla "Descubrir"
    Y veo un producto "Producto A" que NO está en favoritos
    Cuando hago clic en el icono de corazón del producto
    Entonces el producto debe agregarse a mis favoritos
    Y el icono debe cambiar a estado "relleno"
    Y debo ver una notificación "Agregado a favoritos"

  Escenario: Quitar producto de favoritos desde el listado
    Dado que estoy en la pantalla "Descubrir"
    Y veo un producto "Producto A" que YA está en favoritos
    Cuando hago clic en el icono de corazón del producto
    Entonces el producto debe quitarse de mis favoritos
    Y el icono debe cambiar a estado "vacío"
    Y debo ver una notificación "Eliminado de favoritos"

  # ============================================================================
  # ESCENARIOS: BÚSQUEDA
  # ============================================================================

  Escenario: Acceder a la búsqueda desde el header
    Dado que estoy en la pantalla "Descubrir"
    Cuando hago clic en el icono de búsqueda
    Entonces debo ser redirigido a la página de búsqueda
    O debe abrirse un campo de búsqueda expandido

  Escenario: Acceder al carrito desde el header
    Dado que estoy en la pantalla "Descubrir"
    Cuando hago clic en el icono del carrito
    Entonces debo ser redirigido a la página del carrito
    Y debo ver los productos que he agregado

  # ============================================================================
  # ESCENARIOS: NAVEGACIÓN INFERIOR
  # ============================================================================

  Escenario: Navegar a favoritos desde la barra inferior
    Dado que estoy en la pantalla "Descubrir"
    Cuando hago clic en "Favoritos" en la barra de navegación inferior
    Entonces debo ser redirigido a la página de favoritos
    Y el icono de "Favoritos" debe estar resaltado

  Escenario: Navegar a perfil desde la barra inferior
    Dado que estoy en la pantalla "Descubrir"
    Cuando hago clic en "Perfil" en la barra de navegación inferior
    Entonces debo ser redirigido a la página de mi perfil
    Y el icono de "Perfil" debe estar resaltado

  Escenario: Navegar a búsqueda desde la barra inferior
    Dado que estoy en la pantalla "Descubrir"
    Cuando hago clic en "Buscar" en la barra de navegación inferior
    Entonces debo ser redirigido a la página de búsqueda
    Y el icono de "Buscar" debe estar resaltado

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR Y ESTADOS VACÍOS
  # ============================================================================

  Escenario: Visualizar página sin productos disponibles
    Dado que estoy en la pantalla "Descubrir"
    Y no hay productos disponibles en el residencial
    Cuando la página carga
    Entonces debo ver un mensaje "No hay productos disponibles en este momento"
    Y debo ver una ilustración o icono representativo
    Y debo ver un botón para "Actualizar" o "Volver más tarde"

  Escenario: Manejo de error al cargar productos
    Dado que estoy en la pantalla "Descubrir"
    Y hay un problema de conexión con el servidor
    Cuando la página intenta cargar los productos
    Entonces debo ver un mensaje de error "Error al cargar los productos"
    Y debo ver un botón para "Reintentar"
    Y al hacer clic en "Reintentar" debe intentar cargar nuevamente

  Escenario: Manejo de error al filtrar por categoría
    Dado que estoy en la pantalla "Descubrir"
    Y selecciono una categoría
    Y hay un error al filtrar
    Cuando intento filtrar
    Entonces debo ver un mensaje de error "Error al filtrar productos"
    Y debo poder volver a "Todos" para ver todos los productos

  Escenario: Scroll infinito o paginación de productos
    Dado que estoy en la pantalla "Descubrir"
    Y hay más de 20 productos disponibles
    Cuando hago scroll hasta el final de la lista
    Entonces deben cargarse más productos automáticamente (scroll infinito)
    O debo ver un botón "Cargar más" para ver más productos
