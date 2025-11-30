# language: es
Característica: Pantalla My Cart / Checkout
  Como usuario
  Quiero gestionar mi carrito y proceder al pago
  Para finalizar mi compra

  Escenario: Visualización del carrito
    Dado que tengo productos en el carrito
    Cuando entro a la pantalla "My Cart"
    Entonces debo ver el listado de productos con su miniatura, nombre, variante y precio
    Y debo ver el resumen de costos (Subtotal, Delivery Fee, Discount, Total)

  Escenario: Modificar cantidad
    Dado que estoy en el carrito
    Cuando incremento la cantidad de un producto
    Entonces el subtotal y el total deben recalcularse automáticamente

  Escenario: Aplicar código promocional
    Dado que tengo un código promocional válido
    Cuando ingreso el código en el campo correspondiente
    Entonces debo ver el mensaje "Promocode applied"
    Y el descuento debe reflejarse en el resumen de costos

  Escenario: Proceder al Checkout
    Dado que he revisado mi pedido
    Cuando presiono el botón "Checkout"
    Entonces debo iniciar el flujo de pago
