# language: es
Característica: Carrito de Compra y Checkout

  Como usuario de Vecivendo
  Quiero gestionar mi carrito de compras y proceder al pago
  Para finalizar mi compra de manera eficiente

  Antecedentes:
    Dado que existe un sistema de carrito de compras en localStorage o estado global
    Y los productos pueden agregarse, modificarse y eliminarse del carrito

  Regla de Negocio: Gestión del Carrito
    - El carrito debe persistir entre sesiones usando localStorage
    - Los precios deben recalcularse automáticamente al cambiar cantidades
    - Los códigos promocionales deben validarse antes de aplicarse
    - El botón de checkout debe estar habilitado solo si hay productos en el carrito

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. El carrito debe mostrar todos los productos agregados con su información completa
  # 2. Los usuarios deben poder modificar cantidades de productos
  # 3. Los usuarios deben poder eliminar productos del carrito
  # 4. El resumen de costos debe actualizarse automáticamente
  # 5. Los códigos promocionales deben validarse y aplicarse correctamente
  # 6. El proceso de checkout debe ser claro y funcional

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DEL CARRITO
  # ============================================================================

  Escenario: Visualizar carrito con productos
    Dado que tengo 3 productos en el carrito
    Cuando entro a la pantalla "Mi Carrito"
    Entonces debo ver el listado de 3 productos
    Y cada producto debe mostrar su miniatura, nombre, variante (si aplica) y precio unitario
    Y debo ver el resumen de costos con Subtotal, Delivery Fee, Discount y Total
    Y el botón "Iniciar pedido" debe estar habilitado

  Escenario: Visualizar carrito vacío
    Dado que no tengo productos en el carrito
    Cuando entro a la pantalla "Mi Carrito"
    Entonces debo ver un mensaje indicando "Tu carrito está vacío"
    Y debo ver un botón para "Continuar comprando" o similar
    Y el botón "Iniciar pedido" debe estar deshabilitado o no visible

  Escenario: Visualizar carrito con un solo producto
    Dado que tengo 1 producto en el carrito
    Cuando entro a la pantalla "Mi Carrito"
    Entonces debo ver el producto con toda su información
    Y el resumen de costos debe mostrar el precio correcto
    Y el botón "Iniciar pedido" debe estar habilitado

  # ============================================================================
  # ESCENARIOS: MODIFICACIÓN DE CANTIDADES
  # ============================================================================

  Escenario: Incrementar cantidad de un producto
    Dado que estoy en el carrito
    Y tengo un producto "Producto A" con cantidad 1 y precio unitario $100
    Cuando incremento la cantidad del producto a 2
    Entonces la cantidad debe actualizarse a 2
    Y el subtotal del producto debe ser $200
    Y el total general debe recalcularse automáticamente

  Escenario: Decrementar cantidad de un producto
    Dado que estoy en el carrito
    Y tengo un producto "Producto A" con cantidad 3 y precio unitario $100
    Cuando decremento la cantidad del producto a 2
    Entonces la cantidad debe actualizarse a 2
    Y el subtotal del producto debe ser $200
    Y el total general debe recalcularse automáticamente

  Escenario: Decrementar cantidad a cero elimina el producto
    Dado que estoy en el carrito
    Y tengo un producto "Producto A" con cantidad 1
    Cuando decremento la cantidad del producto a 0
    Entonces el producto debe eliminarse del carrito
    Y debo ver una notificación "Producto eliminado del carrito"
    Y el total general debe recalcularse

  Escenario: Validar cantidad máxima disponible
    Dado que estoy en el carrito
    Y tengo un producto "Producto A" con stock disponible de 5 unidades
    Y la cantidad actual en el carrito es 5
    Cuando intento incrementar la cantidad a 6
    Entonces debo ver un mensaje de error "Stock insuficiente"
    Y la cantidad debe permanecer en 5
    Y no debe permitirse incrementar más

  # ============================================================================
  # ESCENARIOS: ELIMINACIÓN DE PRODUCTOS
  # ============================================================================

  Escenario: Eliminar un producto del carrito
    Dado que estoy en el carrito
    Y tengo 3 productos
    Cuando hago clic en el botón de eliminar del "Producto A"
    Entonces el "Producto A" debe eliminarse del carrito
    Y debo ver solo 2 productos restantes
    Y el total general debe recalcularse sin el "Producto A"

  Escenario: Eliminar el último producto del carrito
    Dado que estoy en el carrito
    Y tengo solo 1 producto
    Cuando hago clic en el botón de eliminar
    Entonces el carrito debe quedar vacío
    Y debo ver el mensaje "Tu carrito está vacío"
    Y el botón "Iniciar pedido" debe estar deshabilitado

  # ============================================================================
  # ESCENARIOS: CÓDIGOS PROMOCIONALES
  # ============================================================================

  Escenario: Aplicar código promocional válido
    Dado que estoy en el carrito
    Y tengo productos con un subtotal de $500
    Y tengo un código promocional válido "DESCUENTO10" que da 10% de descuento
    Cuando ingreso el código "DESCUENTO10" en el campo correspondiente
    Y hago clic en "Aplicar"
    Entonces debo ver el mensaje "Código promocional aplicado"
    Y el descuento debe ser $50
    Y el total debe ser $450 (más delivery fee si aplica)

  Escenario: Intentar aplicar código promocional inválido
    Dado que estoy en el carrito
    Y tengo productos en el carrito
    Cuando ingreso el código "INVALIDO123" en el campo correspondiente
    Y hago clic en "Aplicar"
    Entonces debo ver el mensaje "Código promocional inválido"
    Y no debe aplicarse ningún descuento
    Y el total debe permanecer sin cambios

  Escenario: Intentar aplicar código promocional expirado
    Dado que estoy en el carrito
    Y tengo productos en el carrito
    Y existe un código "EXPIRADO" que ya caducó
    Cuando ingreso el código "EXPIRADO" en el campo correspondiente
    Y hago clic en "Aplicar"
    Entonces debo ver el mensaje "Este código ha expirado"
    Y no debe aplicarse ningún descuento

  Escenario: Remover código promocional aplicado
    Dado que estoy en el carrito
    Y tengo un código promocional "DESCUENTO10" aplicado
    Cuando hago clic en el botón de remover código promocional
    Entonces el descuento debe eliminarse
    Y el total debe recalcularse sin el descuento
    Y el campo de código promocional debe quedar vacío

  # ============================================================================
  # ESCENARIOS: PROCESO DE CHECKOUT
  # ============================================================================

  Escenario: Proceder al checkout con productos en el carrito
    Dado que estoy en el carrito
    Y tengo al menos 1 producto
    Cuando presiono el botón "Iniciar pedido"
    Entonces debo ser redirigido a la página de checkout o creación de pedido
    Y la información del carrito debe transferirse correctamente

  Escenario: Intentar proceder al checkout con carrito vacío
    Dado que estoy en el carrito
    Y no tengo productos
    Cuando intento presionar el botón "Iniciar pedido"
    Entonces el botón debe estar deshabilitado
    Y no debe ocurrir ninguna acción

  Escenario: Botón de inicio de pedido personalizado con WhatsApp
    Dado que estoy en el carrito
    Y tengo productos con un total de $500
    Cuando visualizo el botón "Iniciar pedido"
    Entonces el botón debe mostrar el texto "Iniciar pedido"
    Y debe mostrar el total "$500"
    Y debe mostrar un icono de WhatsApp
    Y al hacer clic debe iniciar el flujo de pedido por WhatsApp

  # ============================================================================
  # ESCENARIOS: PERSISTENCIA Y NAVEGACIÓN
  # ============================================================================

  Escenario: Persistencia del carrito al recargar la página
    Dado que tengo 3 productos en el carrito
    Cuando recargo la página del carrito
    Entonces debo ver los mismos 3 productos
    Y las cantidades y totales deben mantenerse correctos

  Escenario: Navegar desde el carrito a la página principal
    Dado que estoy en la página del carrito
    Cuando hago clic en el botón "Home" o navego a la página principal
    Entonces debo ser redirigido a la página principal
    Y el carrito debe mantener sus productos

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al actualizar cantidad por fallo de red
    Dado que estoy en el carrito
    Y hay un problema de conexión
    Cuando intento cambiar la cantidad de un producto
    Entonces debo ver un mensaje de error "Error al actualizar el carrito"
    Y la cantidad debe revertirse al valor anterior

  Escenario: Manejo de producto eliminado o no disponible
    Dado que tengo un producto "Producto A" en el carrito
    Y el producto fue eliminado o desactivado por el vendedor
    Cuando recargo la página del carrito
    Entonces debo ver un mensaje indicando "Producto A ya no está disponible"
    Y el producto debe eliminarse automáticamente del carrito
    Y el total debe recalcularse

  Escenario: Manejo de cambio de precio de producto
    Dado que tengo un producto "Producto A" en el carrito con precio $100
    Y el vendedor cambió el precio a $120
    Cuando recargo la página del carrito
    Entonces debo ver el precio actualizado $120
    Y debo ver una notificación "El precio de Producto A ha cambiado"
    Y el total debe recalcularse con el nuevo precio
