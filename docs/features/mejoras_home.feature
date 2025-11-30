Feature: Mejoras en la Pantalla de Inicio

  Como usuario
  Quiero una pantalla de inicio más usable y estética
  Para mejorar la experiencia de navegación y la legibilidad

  Scenario: Cambiar entre modo claro y oscuro
    Given que estoy en la página de inicio
    When hago clic en el botón de cambio de tema en la esquina superior derecha del hero
    Then el tema de la aplicación debe cambiar de claro a oscuro o viceversa

  Scenario: Visualizar botón "Ver Marketplace" correctamente
    Given que estoy en la página de inicio en modo claro
    When paso el mouse sobre el botón "Ver Marketplace" de un residencial
    Then el texto y el fondo del botón deben tener colores contrastantes y ser legibles

  Scenario: Visualizar lista de residenciales con un solo elemento
    Given que estoy en la página de inicio
    And hay solo un residencial disponible en la lista (filtrado o total)
    When visualizo la lista de residenciales
    Then el residencial debe mostrarse en formato de lista a todo el ancho en escritorio
    And la imagen debe estar a la izquierda
    And el mapa o dirección debe estar en el medio
    And el texto y botón de acción deben estar a la derecha
    And en dispositivos móviles todos los elementos deben apilarse verticalmente

  Scenario: Visualizar texto del CTA correctamente
    Given que estoy en la página de inicio en modo claro
    When visualizo la sección de CTA "¿Quieres que entremos a organizar...?"
    Then el texto debe ser legible y contrastar adecuadamente con el fondo oscuro

  Scenario: Visualizar textos del Footer correctamente
    Given que estoy en la página de inicio
    When visualizo el footer
    Then los textos "Vecivendo", "Contacto y Asistencia" y "Enlaces Rápidos" deben ser legibles y contrastar con el fondo oscuro
    And los iconos de redes sociales deben mostrarse debajo del texto "Conectando comunidades..."
