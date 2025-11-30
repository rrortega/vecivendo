Feature: Crear Pedido
  Como usuario registrado y con perfil completo
  Quiero poder crear un pedido desde el carrito
  Para enviar mi solicitud de compra al anunciante por WhatsApp

  Scenario: Usuario con perfil incompleto intenta crear pedido
    Given que tengo productos en mi carrito
    And mi perfil tiene campos vacíos (nombre, celular, dirección o ubicación)
    When hago clic en el botón "Iniciar pedido"
    Then debo ver un modal indicando que debo completar mi perfil
    And debo ver un botón para "Ir al perfil ahora"
    And debo ver un botón para "Cancelar"

  Scenario: Usuario con perfil completo crea pedido exitosamente
    Given que tengo productos en mi carrito
    And mi perfil está completo (nombre, celular verificado, dirección y ubicación)
    When hago clic en el botón "Iniciar pedido"
    Then se debe generar un ID de pedido único con formato "VV" seguido del timestamp
    And el pedido se debe guardar en la base de datos
    And debo ver un mensaje de confirmación con el ID del pedido
    And debo ser redirigido a WhatsApp con un mensaje predefinido que incluye:
      | dato | descripción |
      | nombre | Mi nombre completo |
      | dirección | Calle, manzana, lote y casa |
      | pedido | Lista de productos y cantidades |
      | id_orden | El ID generado (VVxxxx) |
