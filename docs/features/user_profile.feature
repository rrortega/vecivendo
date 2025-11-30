Feature: Perfil de Usuario - Mis Datos

  Como usuario de la plataforma
  Quiero poder actualizar mi información personal y de ubicación
  Para que mis pedidos y entregas sean precisos

  Scenario: Actualizar información del perfil con todos los campos requeridos
    Given que estoy en la página de perfil
    When ingreso "Juan Perez" en el campo "Nombre completo"
    And ingreso "Av. Siempre Viva" en el campo "Calle"
    And ingreso "A" en el campo "Manzana"
    And ingreso "123" en el campo "Lote"
    And ingreso "4B" en el campo "Casa/Depto"
    And ingreso "Casa blanca con rejas" en el campo "Descripción de la ubicación"
    Then la información debe guardarse automáticamente
    And debo ver los datos actualizados al recargar la página

  Scenario: Persistencia de datos del perfil
    Given que he guardado mis datos de perfil
    When recargo la página
    Then los campos "Nombre", "Calle", "Manzana", "Lote", "Casa/Depto" y "Descripción" deben mostrar la información guardada

  Scenario: Visibilidad del botón de verificación OTP
    Given que estoy en la página de perfil
    When el campo "Celular" tiene menos de 9 dígitos
    Then el botón de verificación OTP debe estar oculto
    And el campo "Celular" debe tener bordes redondeados a la derecha
    When ingreso un número de celular de 9 o más dígitos
    Then el botón de verificación OTP debe ser visible
    And el campo "Celular" debe integrarse visualmente con el botón

  Scenario: Validación de ubicación en el mapa
    Given que abro el selector de ubicación
    And se muestra el círculo del área autorizada del residencial
    When intento seleccionar una ubicación fuera del círculo
    Then debo ver un mensaje de error "La ubicación debe estar dentro del residencial"
    And el marcador no debe moverse a la ubicación inválida
    When selecciono una ubicación dentro del círculo
    And confirmo la ubicación
    Then el mapa de vista previa debe actualizarse con la nueva posición

  Scenario: Cambio de tema (Modo Oscuro)
    Given que estoy en la página de perfil
    When hago clic en el botón "Modo Oscuro"
    Then el tema de la aplicación debe cambiar (claro/oscuro)
    And la preferencia debe guardarse para futuras visitas
