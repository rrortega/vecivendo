# language: es
Característica: Mejoras en la Pantalla de Inicio

  Como usuario de Vecivendo
  Quiero una pantalla de inicio usable, estética y funcional
  Para mejorar mi experiencia de navegación y encontrar fácilmente residenciales

  Antecedentes:
    Dado que existe una página de inicio pública en "/"
    Y la página muestra residenciales disponibles y secciones informativas

  Regla de Negocio: Experiencia de Usuario
    - El tema (claro/oscuro) debe ser configurable y persistente
    - Los textos deben ser legibles en ambos temas
    - Los botones deben tener estados hover claros y accesibles
    - El diseño debe ser responsivo en todos los dispositivos

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. El botón de cambio de tema debe funcionar correctamente
  # 2. Todos los textos deben ser legibles con buen contraste
  # 3. Los botones deben tener estados hover visibles
  # 4. El diseño debe adaptarse a móvil, tablet y escritorio
  # 5. Las imágenes y mapas deben cargarse correctamente

  # ============================================================================
  # ESCENARIOS: CAMBIO DE TEMA
  # ============================================================================

  Escenario: Cambiar de modo claro a modo oscuro
    Dado que estoy en la página de inicio en modo claro
    Cuando hago clic en el botón de cambio de tema en la esquina superior derecha del hero
    Entonces el tema de la aplicación debe cambiar a modo oscuro
    Y todos los elementos deben adaptarse al tema oscuro
    Y la preferencia debe guardarse en localStorage

  Escenario: Cambiar de modo oscuro a modo claro
    Dado que estoy en la página de inicio en modo oscuro
    Cuando hago clic en el botón de cambio de tema
    Entonces el tema debe cambiar a modo claro
    Y todos los elementos deben adaptarse al tema claro

  Escenario: Persistencia del tema al recargar
    Dado que he activado el modo oscuro
    Cuando recargo la página
    Entonces la página debe cargarse en modo oscuro
    Y el botón de tema debe reflejar el estado actual

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE BOTONES
  # ============================================================================

  Escenario: Visualizar botón "Ver Marketplace" correctamente en modo claro
    Dado que estoy en la página de inicio en modo claro
    Cuando paso el mouse sobre el botón "Ver Marketplace" de un residencial
    Entonces el texto y el fondo del botón deben tener colores contrastantes
    Y el texto debe ser legible
    Y debe haber un efecto visual de hover (cambio de color de borde o similar)

  Escenario: Visualizar botón "Ver Marketplace" correctamente en modo oscuro
    Dado que estoy en la página de inicio en modo oscuro
    Cuando paso el mouse sobre el botón "Ver Marketplace"
    Entonces el botón debe tener buen contraste con el fondo oscuro
    Y el texto debe permanecer legible
    Y el efecto hover debe ser visible

  Escenario: Hacer clic en "Ver Marketplace"
    Dado que veo un residencial "Los Pinos"
    Cuando hago clic en el botón "Ver Marketplace"
    Entonces debo ser redirigido al marketplace del residencial "Los Pinos"
    Y debo ver los anuncios de ese residencial

  # ============================================================================
  # ESCENARIOS: LISTA DE RESIDENCIALES
  # ============================================================================

  Escenario: Visualizar lista de residenciales con múltiples elementos
    Dado que estoy en la página de inicio
    Y hay 5 residenciales disponibles
    Cuando visualizo la lista de residenciales
    Entonces debo ver los 5 residenciales en formato de tarjetas o grid
    Y cada residencial debe mostrar: imagen, nombre, ubicación y botón de acción

  Escenario: Visualizar lista de residenciales con un solo elemento en escritorio
    Dado que estoy en la página de inicio en escritorio
    Y hay solo un residencial disponible en la lista
    Cuando visualizo la lista de residenciales
    Entonces el residencial debe mostrarse en formato de lista a todo el ancho
    Y la imagen debe estar a la izquierda
    Y el mapa o dirección debe estar en el medio
    Y el texto y botón de acción deben estar a la derecha
    Y el diseño debe ser horizontal y espacioso

  Escenario: Visualizar lista de residenciales con un solo elemento en móvil
    Dado que estoy en la página de inicio en móvil
    Y hay solo un residencial disponible
    Cuando visualizo la lista
    Entonces todos los elementos deben apilarse verticalmente:
      - Imagen arriba
      - Información en el medio
      - Botón de acción abajo
    Y el diseño debe ocupar todo el ancho disponible

  Escenario: Visualizar residencial sin imagen
    Dado que un residencial no tiene imagen configurada
    Cuando visualizo la lista de residenciales
    Entonces debo ver una imagen placeholder por defecto
    Y el resto de la información debe mostrarse normalmente

  # ============================================================================
  # ESCENARIOS: SECCIÓN CTA (CALL TO ACTION)
  # ============================================================================

  Escenario: Visualizar texto del CTA correctamente en modo claro
    Dado que estoy en la página de inicio en modo claro
    Cuando visualizo la sección de CTA "¿Quieres que entremos a organizar...?"
    Entonces el texto debe ser legible y contrastar adecuadamente con el fondo
    Y el texto debe tener un gradiente de rojo a blanco (según diseño)
    Y debe ser fácil de leer

  Escenario: Visualizar texto del CTA correctamente en modo oscuro
    Dado que estoy en la página de inicio en modo oscuro
    Cuando visualizo la sección de CTA
    Entonces el texto debe contrastar con el fondo oscuro
    Y debe ser completamente legible

  Escenario: Hacer clic en el botón del CTA
    Dado que estoy en la sección de CTA
    Cuando hago clic en el botón de acción (si existe)
    Entonces debo ser redirigido a la página de contacto o formulario correspondiente

  # ============================================================================
  # ESCENARIOS: FOOTER
  # ============================================================================

  Escenario: Visualizar textos del Footer correctamente en modo claro
    Dado que estoy en la página de inicio en modo claro
    Cuando visualizo el footer
    Entonces los textos "Vecivendo", "Contacto y Asistencia" y "Enlaces Rápidos" deben ser legibles
    Y deben contrastar con el fondo del footer
    Y el texto "Vecivendo" debe tener un gradiente de rojo a blanco

  Escenario: Visualizar textos del Footer correctamente en modo oscuro
    Dado que estoy en la página de inicio en modo oscuro
    Cuando visualizo el footer
    Entonces todos los textos deben ser legibles con buen contraste
    Y los enlaces deben ser clickeables y visibles

  Escenario: Visualizar iconos de redes sociales en el footer
    Dado que estoy en el footer
    Cuando visualizo la sección de redes sociales
    Entonces los iconos deben mostrarse debajo del texto "Conectando comunidades..."
    Y cada icono debe ser clickeable
    Y deben redirigir a las redes sociales correspondientes

  Escenario: Navegar a páginas legales desde el footer
    Dado que estoy en el footer
    Cuando hago clic en "Términos y Condiciones"
    Entonces debo ser redirigido a la página de términos
    Cuando hago clic en "Política de Privacidad"
    Entonces debo ser redirigido a la página de privacidad

  # ============================================================================
  # ESCENARIOS: RESPONSIVIDAD
  # ============================================================================

  Escenario: Visualizar página de inicio en móvil
    Dado que accedo a la página de inicio desde un móvil
    Entonces todos los elementos deben apilarse verticalmente
    Y el texto debe ser legible sin zoom
    Y los botones deben ser fáciles de tocar (tamaño adecuado)

  Escenario: Visualizar página de inicio en tablet
    Dado que accedo a la página de inicio desde una tablet
    Entonces el diseño debe adaptarse al tamaño de pantalla intermedio
    Y los residenciales pueden mostrarse en 2 columnas
    Y todos los elementos deben ser accesibles

  Escenario: Visualizar página de inicio en escritorio
    Dado que accedo a la página de inicio desde escritorio
    Entonces el diseño debe aprovechar el ancho completo
    Y los residenciales pueden mostrarse en 3 columnas o más
    Y debe haber espaciado adecuado entre elementos

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar residenciales
    Dado que intento acceder a la página de inicio
    Y hay un error al cargar los residenciales desde la base de datos
    Entonces debo ver un mensaje "Error al cargar residenciales"
    Y debo ver un botón para "Reintentar"

  Escenario: Visualizar página sin residenciales disponibles
    Dado que no hay residenciales registrados en el sistema
    Cuando accedo a la página de inicio
    Entonces debo ver un mensaje "No hay residenciales disponibles en este momento"
    Y debo ver información de contacto para registrar un residencial
