# language: es
Característica: Páginas Legales y de Información

  Como usuario visitante o registrado de Vecivendo
  Quiero poder acceder a la documentación legal y corporativa
  Para entender las reglas de uso, cómo se manejan mis datos y la misión del proyecto

  Antecedentes:
    Dado que existen archivos markdown con contenido legal en la carpeta `/docs/legal`
    Y existe una ruta dinámica `/legal/[slug]` para renderizar estos documentos
    Y el contenido debe estar disponible públicamente sin autenticación

  Regla de Negocio: Accesibilidad de Contenido Legal
    - El contenido legal debe ser accesible sin necesidad de autenticación
    - Los documentos deben renderizarse desde archivos markdown
    - El diseño debe ser responsivo y legible
    - Debe haber navegación clara desde el footer

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Los usuarios deben poder acceder a Términos, Privacidad y Sobre Nosotros
  # 2. El contenido debe renderizarse correctamente desde markdown
  # 3. El diseño debe ser legible en modo claro y oscuro
  # 4. Debe haber navegación entre páginas legales
  # 5. Los errores 404 deben manejarse apropiadamente

  # ============================================================================
  # ESCENARIOS: ACCESO A PÁGINAS LEGALES
  # ============================================================================

  Escenario: Acceder a Términos y Condiciones desde el footer
    Dado que estoy en la página de inicio de Vecivendo
    Y me desplazo hasta el pie de página (footer)
    Cuando hago clic en el enlace "Términos y Condiciones"
    Entonces debería ser redirigido a la página "/legal/terminos-y-condiciones"
    Y debería ver el título "Términos y Condiciones"
    Y debería ver el contenido renderizado desde el archivo markdown correspondiente
    Y el contenido debe incluir secciones como: Aceptación, Uso del Servicio, Responsabilidades

  Escenario: Acceder a Política de Privacidad desde el footer
    Dado que estoy en la página de inicio
    Y me desplazo hasta el pie de página
    Cuando hago clic en el enlace "Política de Privacidad"
    Entonces debería ser redirigido a la página "/legal/politica-de-privacidad"
    Y debería ver el título "Política de Privacidad"
    Y debería ver la información sobre protección de datos
    Y el contenido debe incluir: Recopilación de datos, Uso de datos, Derechos del usuario

  Escenario: Acceder a Sobre Nosotros desde el footer
    Dado que estoy en la página de inicio
    Y me desplazo hasta el pie de página
    Cuando hago clic en el enlace "Sobre Nosotros"
    Entonces debería ser redirigido a la página "/legal/sobre-nosotros"
    Y debería ver el título "Sobre Nosotros"
    Y debería ver la misión y visión de Vecivendo
    Y debería ver información sobre el equipo o la historia del proyecto

  Escenario: Acceso directo mediante URL
    Dado que conozco la URL de una página legal
    Cuando navego directamente a "/legal/terminos-y-condiciones"
    Entonces la página debe cargarse correctamente
    Y debo ver el contenido de Términos y Condiciones

  # ============================================================================
  # ESCENARIOS: RENDERIZADO DE CONTENIDO MARKDOWN
  # ============================================================================

  Escenario: Renderizar markdown con formato correcto
    Dado que estoy en una página legal
    Cuando el contenido markdown incluye:
      - Encabezados (H1, H2, H3)
      - Listas numeradas y con viñetas
      - Enlaces
      - Texto en negrita e itálica
    Entonces todos estos elementos deben renderizarse correctamente
    Y el formato debe ser legible y profesional

  Escenario: Renderizar contenido en modo claro
    Dado que estoy en una página legal en modo claro
    Entonces el texto debe ser oscuro sobre fondo claro
    Y los encabezados deben tener buen contraste
    Y los enlaces deben ser visibles y clickeables

  Escenario: Renderizar contenido en modo oscuro
    Dado que estoy en una página legal en modo oscuro
    Entonces el texto debe ser claro sobre fondo oscuro
    Y todos los elementos deben adaptarse al tema oscuro
    Y la legibilidad debe mantenerse

  # ============================================================================
  # ESCENARIOS: NAVEGACIÓN ENTRE PÁGINAS LEGALES
  # ============================================================================

  Escenario: Navegación entre páginas legales desde el footer
    Dado que estoy viendo la página de "Términos y Condiciones"
    Cuando hago clic en "Política de Privacidad" en el footer
    Entonces debería navegar correctamente a la página de política de privacidad
    Y el contenido debe actualizarse sin recargar toda la página (si es SPA)

  Escenario: Volver a la página de inicio desde una página legal
    Dado que estoy en una página legal
    Cuando hago clic en el logo de Vecivendo o en "Inicio" en el header
    Entonces debo ser redirigido a la página de inicio
    Y la página legal debe cerrarse

  Escenario: Breadcrumb o navegación clara
    Dado que estoy en una página legal
    Entonces debo ver un breadcrumb o indicador de ubicación (ej. "Inicio > Legal > Términos")
    Y debo poder hacer clic en cualquier nivel para navegar

  # ============================================================================
  # ESCENARIOS: HEADER Y FOOTER EN PÁGINAS LEGALES
  # ============================================================================

  Escenario: Visualizar header adaptativo en página legal
    Dado que estoy en una página legal
    Entonces debo ver un header con el logo de Vecivendo
    Y debo ver un botón de alternancia de modo oscuro/claro
    Y el header debe ser responsivo

  Escenario: Visualizar footer en página legal
    Dado que estoy en una página legal
    Cuando me desplazo al final de la página
    Entonces debo ver el footer del sitio
    Y debo poder navegar a otras páginas legales desde el footer

  # ============================================================================
  # ESCENARIOS: RESPONSIVIDAD
  # ============================================================================

  Escenario: Visualizar página legal en móvil
    Dado que accedo a una página legal desde un móvil
    Entonces el contenido debe adaptarse al ancho de la pantalla
    Y el texto debe ser legible sin zoom
    Y no debe haber scroll horizontal

  Escenario: Visualizar página legal en tablet
    Dado que accedo a una página legal desde una tablet
    Entonces el diseño debe aprovechar el ancho disponible
    Y el texto debe tener un ancho máximo para mejor legibilidad

  Escenario: Visualizar página legal en escritorio
    Dado que accedo a una página legal desde escritorio
    Entonces el contenido debe centrarse con un ancho máximo (ej. 800px)
    Y debe haber espaciado adecuado a los lados

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Intento de acceso a un documento legal inexistente
    Dado que intento acceder directamente a la URL "/legal/documento-inexistente"
    Entonces debería ver la página de error 404 estándar de la aplicación
    O debería ver un mensaje indicando "Contenido no encontrado"
    Y debo ver un botón para volver a la página de inicio

  Escenario: Error al cargar archivo markdown
    Dado que hay un error al leer el archivo markdown
    Cuando intento acceder a una página legal
    Entonces debo ver un mensaje "Error al cargar el contenido"
    Y debo ver un botón para "Reintentar"
    Y debo poder volver a la página de inicio

  Escenario: Archivo markdown vacío o sin contenido
    Dado que un archivo markdown legal está vacío
    Cuando accedo a esa página legal
    Entonces debo ver un mensaje "Contenido no disponible"
    O debo ver un placeholder indicando que el contenido está en desarrollo

  # ============================================================================
  # ESCENARIOS: SEO Y METADATOS
  # ============================================================================

  Escenario: Metadatos correctos en páginas legales
    Dado que accedo a la página de "Términos y Condiciones"
    Entonces el título de la pestaña del navegador debe ser "Términos y Condiciones | Vecivendo"
    Y la meta descripción debe incluir información relevante sobre los términos
    Y las meta tags deben estar configuradas correctamente para SEO

  Escenario: URLs amigables y consistentes
    Dado que navego entre páginas legales
    Entonces las URLs deben ser amigables y descriptivas:
      - /legal/terminos-y-condiciones
      - /legal/politica-de-privacidad
      - /legal/sobre-nosotros
    Y deben ser consistentes en formato (kebab-case)
