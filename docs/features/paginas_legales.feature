# language: es
Característica: Páginas Legales y de Información
  Como usuario visitante o registrado de Vecivendo
  Quiero poder acceder a la documentación legal y corporativa (Términos, Privacidad, Sobre Nosotros)
  Para entender las reglas de uso, cómo se manejan mis datos y la misión del proyecto

  Regla: El contenido debe estar disponible públicamente sin necesidad de autenticación

  Escenario: Acceder a Términos y Condiciones desde el footer
    Dado que estoy en la página de inicio de Vecivendo
    Y me desplazo hasta el pie de página (footer)
    Cuando hago clic en el enlace "Términos y Condiciones"
    Entonces debería ser redirigido a la página "/legal/terminos-y-condiciones"
    Y debería ver el título "Términos y Condiciones"
    Y debería ver el contenido renderizado desde el archivo markdown correspondiente

  Escenario: Acceder a Política de Privacidad desde el footer
    Dado que estoy en la página de inicio
    Y me desplazo hasta el pie de página
    Cuando hago clic en el enlace "Política de Privacidad"
    Entonces debería ser redirigido a la página "/legal/politica-de-privacidad"
    Y debería ver el título "Política de Privacidad"
    Y debería ver la información sobre protección de datos

  Escenario: Acceder a Sobre Nosotros desde el footer
    Dado que estoy en la página de inicio
    Y me desplazo hasta el pie de página
    Cuando hago clic en el enlace "Sobre Nosotros"
    Entonces debería ser redirigido a la página "/legal/sobre-nosotros"
    Y debería ver la misión y visión de Vecivendo

  Escenario: Navegación entre páginas legales
    Dado que estoy viendo la página de "Términos y Condiciones"
    Cuando hago clic en "Política de Privacidad" en el footer
    Entonces debería navegar correctamente a la página de política de privacidad

  Escenario: Intento de acceso a un documento legal inexistente
    Dado que intento acceder directamente a la URL "/legal/documento-inexistente"
    Entonces debería ver la página de error 404 estándar de la aplicación
    O debería ver un mensaje indicando que el contenido no existe
