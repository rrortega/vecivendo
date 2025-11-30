# language: es
Característica: Pantalla Discover / Home
  Como usuario
  Quiero ver promociones y productos destacados
  Para descubrir ofertas y artículos de interés

  Escenario: Visualización de elementos principales
    Dado que estoy en la pantalla "Discover"
    Entonces debo ver un header fijo con el título "Discover"
    Y debo ver un icono de búsqueda y un acceso al carrito con badge
    Y debo ver un banner de promoción "Clearance Sales"
    Y debo ver una sección de categorías con chips (All, Smartphones, etc.)
    Y debo ver un listado de productos destacados en tarjetas verticales
    Y debo ver una barra de navegación inferior con las opciones: Home, Search, Favorites, Profile

  Escenario: Filtrado por categoría
    Dado que estoy en la pantalla "Discover"
    Cuando selecciono la categoría "Smartphones"
    Entonces el listado de productos debe mostrar solo smartphones
    Y el chip "Smartphones" debe estar resaltado visualmente

  Escenario: Navegación a detalle de producto
    Dado que veo un producto en el listado
    Cuando hago tap en la tarjeta del producto
    Entonces debo ser redirigido a la pantalla de "Product Details" del producto seleccionado
