# language: es
Característica: Crear Pedido por WhatsApp

  Como usuario registrado de Vecivendo
  Quiero poder crear un pedido desde el carrito y enviarlo por WhatsApp
  Para solicitar la compra de productos al anunciante de manera rápida y directa

  Antecedentes:
    Dado que existe un sistema de perfiles de usuario en Appwrite
    Y los usuarios deben tener perfil completo para crear pedidos
    Y los pedidos se envían por WhatsApp con información estructurada

  Regla de Negocio: Validación de Perfil para Pedidos
    - El usuario debe tener nombre completo registrado
    - El usuario debe tener celular verificado
    - El usuario debe tener dirección completa (calle, manzana, lote, casa)
    - El usuario debe tener ubicación en el mapa configurada
    - Si falta algún dato, se debe solicitar completar el perfil antes de continuar

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Los usuarios con perfil incompleto deben ser notificados y redirigidos al perfil
  # 2. Los usuarios con perfil completo deben poder crear pedidos exitosamente
  # 3. Cada pedido debe tener un ID único con formato "VV" + timestamp
  # 4. El pedido debe guardarse en la base de datos antes de redirigir a WhatsApp
  # 5. El mensaje de WhatsApp debe incluir toda la información del pedido y del usuario
  # 6. El carrito debe vaciarse después de crear el pedido exitosamente

  # ============================================================================
  # ESCENARIOS: VALIDACIÓN DE PERFIL
  # ============================================================================

  Escenario: Usuario con perfil incompleto intenta crear pedido (sin nombre)
    Dado que tengo productos en mi carrito
    Y mi perfil no tiene nombre completo registrado
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un modal indicando "Debes completar tu perfil para continuar"
    Y el modal debe especificar "Falta: Nombre completo"
    Y debo ver un botón "Ir al perfil ahora"
    Y debo ver un botón "Cancelar"

  Escenario: Usuario con perfil incompleto intenta crear pedido (sin celular verificado)
    Dado que tengo productos en mi carrito
    Y mi perfil tiene nombre pero el celular no está verificado
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un modal indicando "Debes completar tu perfil para continuar"
    Y el modal debe especificar "Falta: Celular verificado"
    Y debo ver un botón "Ir al perfil ahora"

  Escenario: Usuario con perfil incompleto intenta crear pedido (sin dirección)
    Dado que tengo productos en mi carrito
    Y mi perfil tiene nombre y celular verificado
    Pero no tiene dirección completa (calle, manzana, lote, casa)
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un modal indicando "Debes completar tu perfil para continuar"
    Y el modal debe especificar "Falta: Dirección completa"
    Y debo ver un botón "Ir al perfil ahora"

  Escenario: Usuario con perfil incompleto intenta crear pedido (sin ubicación)
    Dado que tengo productos en mi carrito
    Y mi perfil tiene nombre, celular y dirección
    Pero no tiene ubicación en el mapa configurada
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un modal indicando "Debes completar tu perfil para continuar"
    Y el modal debe especificar "Falta: Ubicación en el mapa"
    Y debo ver un botón "Ir al perfil ahora"

  Escenario: Redirigir al perfil desde el modal de validación
    Dado que veo el modal de "Debes completar tu perfil"
    Cuando hago clic en "Ir al perfil ahora"
    Entonces debo ser redirigido a la página de mi perfil
    Y el carrito debe mantenerse con los productos
    Y debo poder volver al carrito después de completar el perfil

  # ============================================================================
  # ESCENARIOS: CREACIÓN EXITOSA DE PEDIDO
  # ============================================================================

  Escenario: Usuario con perfil completo crea pedido exitosamente
    Dado que tengo 2 productos en mi carrito:
      | Producto    | Cantidad | Precio |
      | Producto A  | 2        | $100   |
      | Producto B  | 1        | $50    |
    Y mi perfil está completo con:
      | Campo              | Valor                    |
      | Nombre             | Juan Pérez               |
      | Celular            | 987654321 (verificado)   |
      | Calle              | Av. Principal            |
      | Manzana            | A                        |
      | Lote               | 15                       |
      | Casa               | 3B                       |
      | Ubicación          | -12.0464, -77.0428       |
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces se debe generar un ID de pedido único con formato "VV" seguido del timestamp
    Y el pedido se debe guardar en la base de datos con estado "pendiente"
    Y debo ver un mensaje de confirmación "Pedido creado: VV1234567890"
    Y debo ser redirigido a WhatsApp

  Escenario: Mensaje de WhatsApp contiene información completa del pedido
    Dado que he creado un pedido exitosamente con ID "VV1234567890"
    Cuando soy redirigido a WhatsApp
    Entonces el mensaje predefinido debe incluir:
      """
      Hola, soy Juan Pérez
      
      Quiero hacer el siguiente pedido:
      
      📦 Producto A x2 - $200
      📦 Producto B x1 - $50
      
      Total: $250
      
      📍 Dirección de entrega:
      Calle: Av. Principal
      Manzana: A, Lote: 15, Casa: 3B
      
      🆔 ID de orden: VV1234567890
      
      ¿Cómo puedo realizar el pago?
      """
    Y el número de WhatsApp debe ser el del anunciante o del residencial

  Escenario: Carrito se vacía después de crear pedido exitosamente
    Dado que tengo 3 productos en mi carrito
    Y he creado un pedido exitosamente
    Cuando regreso a la aplicación desde WhatsApp
    Entonces el carrito debe estar vacío
    Y debo poder agregar nuevos productos

  Escenario: Generar ID único para cada pedido
    Dado que creo un pedido a las 10:00:00
    Y el timestamp es 1638360000
    Cuando se genera el ID del pedido
    Entonces el ID debe ser "VV1638360000"
    Y si creo otro pedido 1 segundo después
    Entonces el nuevo ID debe ser "VV1638360001"
    Y ambos IDs deben ser únicos

  # ============================================================================
  # ESCENARIOS: GUARDADO EN BASE DE DATOS
  # ============================================================================

  Escenario: Pedido se guarda correctamente en la base de datos
    Dado que he creado un pedido con ID "VV1234567890"
    Cuando consulto la base de datos
    Entonces debe existir un documento en la colección "pedidos" con:
      | Campo           | Valor                           |
      | id              | VV1234567890                    |
      | userId          | ID del usuario actual           |
      | productos       | Array con los productos         |
      | total           | $250                            |
      | estado          | pendiente                       |
      | direccion       | Dirección completa del usuario  |
      | $createdAt      | Timestamp de creación           |

  Escenario: Consultar historial de pedidos del usuario
    Dado que he creado 3 pedidos en diferentes fechas
    Cuando accedo a mi historial de pedidos
    Entonces debo ver los 3 pedidos ordenados por fecha (más reciente primero)
    Y cada pedido debe mostrar su ID, fecha, total y estado

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al guardar pedido en la base de datos
    Dado que tengo productos en mi carrito
    Y mi perfil está completo
    Y hay un problema de conexión con Appwrite
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un mensaje de error "No se pudo crear el pedido. Intenta nuevamente."
    Y el carrito debe mantener los productos
    Y NO debo ser redirigido a WhatsApp

  Escenario: Manejo de error al generar ID de pedido
    Dado que tengo productos en mi carrito
    Y mi perfil está completo
    Y hay un error al generar el timestamp
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces el sistema debe usar un ID alternativo (UUID o similar)
    Y el pedido debe crearse exitosamente con el ID alternativo

  Escenario: Intentar crear pedido con carrito vacío
    Dado que no tengo productos en mi carrito
    Cuando intento acceder a la página de crear pedido
    Entonces debo ver un mensaje "Tu carrito está vacío"
    Y debo ser redirigido a la página principal o de productos
    Y el botón "Iniciar pedido" debe estar deshabilitado

  Escenario: Manejo de productos eliminados durante el proceso de pedido
    Dado que tengo 2 productos en mi carrito
    Y uno de los productos fue eliminado por el vendedor mientras creo el pedido
    Cuando hago clic en el botón "Iniciar pedido"
    Entonces debo ver un mensaje "Algunos productos ya no están disponibles"
    Y el producto eliminado debe quitarse del carrito
    Y debo poder continuar con los productos restantes

  Escenario: Usuario cancela la redirección a WhatsApp
    Dado que he creado un pedido exitosamente
    Y estoy siendo redirigido a WhatsApp
    Cuando cancelo la redirección o cierro la ventana
    Entonces el pedido debe permanecer guardado en la base de datos
    Y debo poder consultar el pedido en mi historial
    Y el carrito debe estar vacío
