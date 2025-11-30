# language: es
Característica: Pantalla Product Details
  Como usuario
  Quiero ver el detalle de un producto y sus variantes
  Para decidir mi compra y añadirlo al carrito

  Escenario: Visualización de información del producto
    Dado que estoy en la pantalla de "Product Details"
    Entonces debo ver la imagen principal del producto
    Y debo ver el nombre, rating, porcentaje de aprobación y cantidad de reviews
    Y debo ver la descripción detallada
    Y debo ver el precio actual y el precio tachado (si aplica)
    Y debo ver un selector de variantes (ej. capacidad)

  Escenario: Selección de variante
    Dado que estoy viendo un producto con variantes
    Cuando selecciono la variante "1TB"
    Entonces el precio debe actualizarse al correspondiente a "1TB"

  Escenario: Añadir al carrito
    Dado que he seleccionado una variante
    Cuando presiono el botón "Add to Cart"
    Entonces el producto debe agregarse a mi carrito
    Y debo ver una confirmación visual de la acción
