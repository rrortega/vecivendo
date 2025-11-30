Feature: Compartir Anuncio
  Como usuario de la plataforma
  Quiero poder compartir un anuncio con otras personas
  Para aumentar la visibilidad del anuncio

  Scenario: Compartir usando API nativa (Móvil/Soportado)
    Given que estoy en la página de detalles de un anuncio
    And mi dispositivo soporta la funcionalidad de compartir nativa
    When hago clic en el botón de "Compartir"
    Then se debe abrir el menú nativo de compartir del dispositivo
    And el mensaje compartido debe incluir el título y el enlace del anuncio

  Scenario: Compartir usando Modal (Escritorio/No soportado)
    Given que estoy en la página de detalles de un anuncio
    And mi dispositivo NO soporta la funcionalidad de compartir nativa
    When hago clic en el botón de "Compartir"
    Then se debe mostrar un modal con opciones de compartir
    And las opciones deben incluir "Copiar enlace", "WhatsApp", "Facebook" y "Twitter"

  Scenario: Copiar enlace desde el Modal
    Given que el modal de compartir está abierto
    When hago clic en la opción "Copiar enlace"
    Then el enlace del anuncio se debe copiar al portapapeles
    And se debe mostrar una notificación indicando que el enlace fue copiado

  Scenario: Compartir en Redes Sociales desde el Modal
    Given que el modal de compartir está abierto
    When hago clic en una opción de red social (ej. WhatsApp)
    Then se debe abrir una nueva pestaña con la URL de compartir de la red social correspondiente
    And la URL debe incluir el enlace del anuncio pre-llenado
