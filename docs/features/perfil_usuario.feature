# language: es
Característica: Perfil de Usuario - Mis Datos

  Como usuario de la plataforma Vecivendo
  Quiero poder actualizar mi información personal y de ubicación
  Para que mis pedidos y entregas sean precisos y pueda personalizar mi experiencia

  Antecedentes:
    Dado que existe una colección de usuarios en Appwrite
    Y cada usuario tiene un perfil con campos: nombre, celular, calle, manzana, lote, casa, descripcion_ubicacion, ubicacion_coords, tema_preferido

  Regla de Negocio: Validación de Perfil
    - El nombre completo es requerido para crear pedidos
    - El celular debe tener al menos 9 dígitos y estar verificado vía OTP
    - La dirección completa (calle, manzana, lote, casa) es requerida para pedidos
    - La ubicación en el mapa debe estar dentro del área del residencial
    - Los cambios se guardan automáticamente al modificar campos

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Los usuarios deben poder actualizar su información personal
  # 2. Los cambios deben guardarse automáticamente
  # 3. La verificación OTP debe funcionar correctamente
  # 4. La ubicación en el mapa debe validarse dentro del área del residencial
  # 5. El tema (modo oscuro/claro) debe persistir entre sesiones
  # 6. Los datos deben persistir al recargar la página

  # ============================================================================
  # ESCENARIOS: ACTUALIZACIÓN DE INFORMACIÓN PERSONAL
  # ============================================================================

  Escenario: Actualizar información del perfil con todos los campos requeridos
    Dado que estoy en la página de perfil
    Cuando ingreso "Juan Perez" en el campo "Nombre completo"
    Y ingreso "Av. Siempre Viva" en el campo "Calle"
    Y ingreso "A" en el campo "Manzana"
    Y ingreso "123" en el campo "Lote"
    Y ingreso "4B" en el campo "Casa/Depto"
    Y ingreso "Casa blanca con rejas" en el campo "Descripción de la ubicación"
    Entonces la información debe guardarse automáticamente
    Y debo ver un indicador de "Guardado" o similar
    Y debo ver los datos actualizados al recargar la página

  Escenario: Guardar automáticamente al cambiar de campo
    Dado que estoy en la página de perfil
    Cuando ingreso "María López" en el campo "Nombre completo"
    Y hago clic fuera del campo (blur)
    Entonces el sistema debe guardar automáticamente el nombre
    Y debo ver un indicador visual de guardado exitoso

  Escenario: Actualizar solo algunos campos del perfil
    Dado que estoy en la página de perfil
    Y ya tengo nombre y dirección guardados
    Cuando modifico solo el campo "Casa/Depto" de "4B" a "5A"
    Entonces solo ese campo debe actualizarse en la base de datos
    Y los demás campos deben permanecer sin cambios

  # ============================================================================
  # ESCENARIOS: PERSISTENCIA DE DATOS
  # ============================================================================

  Escenario: Persistencia de datos del perfil al recargar
    Dado que he guardado mis datos de perfil:
      | Campo                      | Valor                    |
      | Nombre                     | Juan Perez               |
      | Calle                      | Av. Siempre Viva         |
      | Manzana                    | A                        |
      | Lote                       | 123                      |
      | Casa/Depto                 | 4B                       |
      | Descripción de ubicación   | Casa blanca con rejas    |
    Cuando recargo la página
    Entonces todos los campos deben mostrar la información guardada correctamente

  Escenario: Persistencia de datos entre sesiones
    Dado que he actualizado mi perfil
    Y cierro sesión
    Cuando vuelvo a iniciar sesión
    Y accedo a mi perfil
    Entonces debo ver todos mis datos guardados previamente

  # ============================================================================
  # ESCENARIOS: VERIFICACIÓN DE CELULAR (OTP)
  # ============================================================================

  Escenario: Visibilidad del botón de verificación OTP con menos de 9 dígitos
    Dado que estoy en la página de perfil
    Cuando el campo "Celular" tiene menos de 9 dígitos (ej. "12345678")
    Entonces el botón de verificación OTP debe estar oculto
    Y el campo "Celular" debe tener bordes redondeados a la derecha

  Escenario: Visibilidad del botón de verificación OTP con 9 o más dígitos
    Dado que estoy en la página de perfil
    Cuando ingreso un número de celular de 9 o más dígitos (ej. "987654321")
    Entonces el botón de verificación OTP debe ser visible
    Y el campo "Celular" debe integrarse visualmente con el botón
    Y el botón debe mostrar "Verificar" o similar

  Escenario: Enviar código OTP para verificación
    Dado que he ingresado un celular válido "987654321"
    Y el botón de verificación OTP está visible
    Cuando hago clic en el botón "Verificar"
    Entonces el sistema debe enviar un código OTP al número ingresado
    Y debo ver un mensaje "Código enviado a 987654321"
    Y debe aparecer un campo para ingresar el código OTP

  Escenario: Verificar celular con código OTP correcto
    Dado que he recibido un código OTP "123456"
    Y veo el campo para ingresar el código
    Cuando ingreso "123456" en el campo de código
    Y hago clic en "Confirmar"
    Entonces el celular debe marcarse como verificado en la base de datos
    Y debo ver un mensaje "Celular verificado correctamente"
    Y el campo de celular debe mostrar un icono de verificado

  Escenario: Verificar celular con código OTP incorrecto
    Dado que he recibido un código OTP "123456"
    Y veo el campo para ingresar el código
    Cuando ingreso "999999" (código incorrecto)
    Y hago clic en "Confirmar"
    Entonces debo ver un mensaje de error "Código incorrecto. Intenta nuevamente."
    Y el celular NO debe marcarse como verificado
    Y debo poder reintentar

  Escenario: Reenviar código OTP
    Dado que he solicitado un código OTP
    Y no lo he recibido o ha expirado
    Cuando hago clic en "Reenviar código"
    Entonces el sistema debe enviar un nuevo código OTP
    Y debo ver un mensaje "Código reenviado"

  # ============================================================================
  # ESCENARIOS: UBICACIÓN EN EL MAPA
  # ============================================================================

  Escenario: Abrir selector de ubicación en el mapa
    Dado que estoy en la página de perfil
    Cuando hago clic en el botón "Seleccionar ubicación" o en el mapa
    Entonces debe abrirse un modal o vista de mapa
    Y debo ver el círculo del área autorizada del residencial
    Y debo ver un marcador que puedo mover

  Escenario: Validación de ubicación fuera del área autorizada
    Dado que abro el selector de ubicación
    Y se muestra el círculo del área autorizada del residencial
    Cuando intento seleccionar una ubicación fuera del círculo
    Entonces debo ver un mensaje de error "La ubicación debe estar dentro del residencial"
    Y el marcador no debe moverse a la ubicación inválida
    Y no debo poder confirmar la ubicación

  Escenario: Seleccionar ubicación dentro del área autorizada
    Dado que abro el selector de ubicación
    Cuando selecciono una ubicación dentro del círculo del residencial
    Y confirmo la ubicación
    Entonces las coordenadas deben guardarse en el perfil
    Y el mapa de vista previa debe actualizarse con la nueva posición
    Y debo ver un mensaje "Ubicación guardada correctamente"

  Escenario: Visualizar ubicación guardada en el mapa de vista previa
    Dado que he guardado una ubicación en mi perfil
    Cuando accedo a la página de perfil
    Entonces debo ver un mapa de vista previa con mi ubicación marcada
    Y debo poder hacer clic para editar la ubicación

  # ============================================================================
  # ESCENARIOS: CAMBIO DE TEMA (MODO OSCURO/CLARO)
  # ============================================================================

  Escenario: Cambiar a modo oscuro
    Dado que estoy en la página de perfil en modo claro
    Cuando hago clic en el botón "Modo Oscuro" o toggle de tema
    Entonces el tema de la aplicación debe cambiar a modo oscuro
    Y todos los elementos deben adaptarse al tema oscuro
    Y la preferencia debe guardarse en la base de datos

  Escenario: Cambiar a modo claro
    Dado que estoy en la página de perfil en modo oscuro
    Cuando hago clic en el botón "Modo Claro" o toggle de tema
    Entonces el tema de la aplicación debe cambiar a modo claro
    Y todos los elementos deben adaptarse al tema claro
    Y la preferencia debe guardarse en la base de datos

  Escenario: Persistencia de preferencia de tema
    Dado que he activado el modo oscuro
    Cuando recargo la página
    Entonces la página debe cargarse en modo oscuro
    Y la preferencia debe mantenerse

  Escenario: Sincronización de tema entre páginas
    Dado que he activado el modo oscuro en la página de perfil
    Cuando navego a otra página de la aplicación
    Entonces la nueva página debe mostrarse en modo oscuro
    Y el tema debe ser consistente en toda la aplicación

  # ============================================================================
  # ESCENARIOS: VALIDACIÓN DE CAMPOS
  # ============================================================================

  Escenario: Validación de nombre completo requerido
    Dado que estoy en la página de perfil
    Cuando dejo el campo "Nombre completo" vacío
    Y intento crear un pedido
    Entonces debo ver un mensaje "Debes completar tu nombre para crear pedidos"

  Escenario: Validación de formato de celular
    Dado que estoy en la página de perfil
    Cuando ingreso letras en el campo "Celular" (ej. "abc123")
    Entonces el campo debe rechazar las letras
    Y solo debe permitir números

  Escenario: Validación de longitud mínima de celular
    Dado que estoy en la página de perfil
    Cuando ingreso un celular con menos de 9 dígitos
    Entonces el botón de verificación OTP debe permanecer oculto
    Y debo ver un mensaje "El celular debe tener al menos 9 dígitos"

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al guardar perfil
    Dado que estoy en la página de perfil
    Y hay un problema de conexión con Appwrite
    Cuando intento guardar cambios
    Entonces debo ver un mensaje de error "Error al guardar. Intenta nuevamente."
    Y los cambios no deben perderse
    Y debo poder reintentar

  Escenario: Manejo de error al enviar OTP
    Dado que he ingresado un celular válido
    Y hay un problema con el servicio de SMS
    Cuando hago clic en "Verificar"
    Entonces debo ver un mensaje "Error al enviar código. Intenta más tarde."
    Y debo poder reintentar después

  Escenario: Manejo de error al cargar ubicación en el mapa
    Dado que intento abrir el selector de ubicación
    Y hay un error al cargar el mapa
    Cuando hago clic en "Seleccionar ubicación"
    Entonces debo ver un mensaje "Error al cargar el mapa. Intenta nuevamente."
    Y debo poder reintentar
