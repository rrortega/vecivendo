# language: es
Característica: Compartir Anuncio

  Como usuario de la plataforma Vecivendo
  Quiero poder compartir un anuncio con otras personas
  Para aumentar la visibilidad del anuncio y ayudar a difundir productos interesantes

  Antecedentes:
    Dado que existe una funcionalidad de compartir en las páginas de detalle de anuncios
    Y la funcionalidad debe adaptarse según las capacidades del dispositivo

  Regla de Negocio: Compartir Adaptativo
    - En dispositivos con API nativa de compartir: usar la funcionalidad nativa
    - En dispositivos sin API nativa: mostrar modal con opciones de compartir
    - El enlace compartido debe incluir título y URL del anuncio
    - Las opciones de compartir deben incluir: Copiar enlace, WhatsApp, Facebook, Twitter

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. El botón de compartir debe ser visible y accesible
  # 2. Debe detectar si el dispositivo soporta API nativa de compartir
  # 3. El modal de compartir debe tener opciones claras y funcionales
  # 4. Copiar enlace debe funcionar correctamente
  # 5. Compartir en redes sociales debe abrir las URLs correctas

  # ============================================================================
  # ESCENARIOS: COMPARTIR CON API NATIVA (MÓVIL)
  # ============================================================================

  Escenario: Compartir usando API nativa en dispositivo compatible
    Dado que estoy en la página de detalles de un anuncio "Venta de Laptop"
    Y mi dispositivo soporta la funcionalidad de compartir nativa (navigator.share)
    Cuando hago clic en el botón de "Compartir"
    Entonces se debe abrir el menú nativo de compartir del dispositivo
    Y el mensaje compartido debe incluir el título "Venta de Laptop"
    Y el mensaje debe incluir el enlace completo del anuncio
    Y el usuario puede elegir la app para compartir (WhatsApp, Email, etc.)

  Escenario: Compartir exitosamente usando API nativa
    Dado que he abierto el menú nativo de compartir
    Cuando selecciono una aplicación (ej. WhatsApp)
    Y completo el proceso de compartir
    Entonces el anuncio debe compartirse exitosamente
    Y debo volver a la página de detalles del anuncio

  Escenario: Cancelar compartir desde API nativa
    Dado que he abierto el menú nativo de compartir
    Cuando cancelo o cierro el menú sin compartir
    Entonces el menú debe cerrarse
    Y debo volver a la página de detalles sin cambios

  # ============================================================================
  # ESCENARIOS: COMPARTIR CON MODAL (ESCRITORIO/NO SOPORTADO)
  # ============================================================================

  Escenario: Mostrar modal de compartir en dispositivo sin API nativa
    Dado que estoy en la página de detalles de un anuncio
    Y mi dispositivo NO soporta la funcionalidad de compartir nativa
    Cuando hago clic en el botón de "Compartir"
    Entonces se debe mostrar un modal con opciones de compartir
    Y las opciones deben incluir:
      | Opción          | Icono         |
      | Copiar enlace   | Icono de link |
      | WhatsApp        | Logo WhatsApp |
      | Facebook        | Logo Facebook |
      | Twitter         | Logo Twitter  |
    Y el modal debe tener un botón de cerrar (X)

  Escenario: Cerrar modal de compartir
    Dado que el modal de compartir está abierto
    Cuando hago clic en el botón de cerrar (X) o fuera del modal
    Entonces el modal debe cerrarse
    Y debo volver a la página de detalles del anuncio

  # ============================================================================
  # ESCENARIOS: COPIAR ENLACE
  # ============================================================================

  Escenario: Copiar enlace desde el modal
    Dado que el modal de compartir está abierto
    Cuando hago clic en la opción "Copiar enlace"
    Entonces el enlace completo del anuncio se debe copiar al portapapeles
    Y se debe mostrar una notificación "Enlace copiado al portapapeles"
    Y la notificación debe desaparecer después de 3 segundos

  Escenario: Verificar enlace copiado
    Dado que he copiado el enlace al portapapeles
    Cuando pego el enlace en otra aplicación
    Entonces el enlace debe ser la URL completa del anuncio
    Y debe incluir el dominio, residencial y ID del anuncio
    Y el formato debe ser: "https://vecivendo.com/residencial/anuncio/123"

  Escenario: Manejo de error al copiar enlace
    Dado que el modal de compartir está abierto
    Y el navegador no soporta la API de portapapeles
    Cuando hago clic en "Copiar enlace"
    Entonces debo ver un mensaje "No se pudo copiar. Copia manualmente:"
    Y debo ver el enlace en un campo de texto seleccionable
    Y debo poder seleccionar y copiar manualmente

  # ============================================================================
  # ESCENARIOS: COMPARTIR EN REDES SOCIALES
  # ============================================================================

  Escenario: Compartir en WhatsApp desde el modal
    Dado que el modal de compartir está abierto
    Cuando hago clic en la opción "WhatsApp"
    Entonces se debe abrir una nueva pestaña con la URL de WhatsApp Web
    Y la URL debe incluir el texto pre-llenado con el título y enlace del anuncio
    Y el formato debe ser: "https://wa.me/?text=Venta de Laptop - https://vecivendo.com/residencial/anuncio/123"

  Escenario: Compartir en Facebook desde el modal
    Dado que el modal de compartir está abierto
    Cuando hago clic en la opción "Facebook"
    Entonces se debe abrir una nueva pestaña con la URL de compartir de Facebook
    Y la URL debe incluir el enlace del anuncio como parámetro
    Y el formato debe ser: "https://www.facebook.com/sharer/sharer.php?u=https://vecivendo.com/residencial/anuncio/123"

  Escenario: Compartir en Twitter desde el modal
    Dado que el modal de compartir está abierto
    Cuando hago clic en la opción "Twitter"
    Entonces se debe abrir una nueva pestaña con la URL de compartir de Twitter
    Y la URL debe incluir el texto y enlace del anuncio
    Y el formato debe ser: "https://twitter.com/intent/tweet?text=Venta de Laptop&url=https://vecivendo.com/residencial/anuncio/123"

  Escenario: Nueva pestaña se abre correctamente
    Dado que he hecho clic en una opción de red social
    Cuando se abre la nueva pestaña
    Entonces la pestaña actual (con el anuncio) debe permanecer abierta
    Y debo poder volver fácilmente a la pestaña del anuncio

  # ============================================================================
  # ESCENARIOS: BOTÓN DE COMPARTIR
  # ============================================================================

  Escenario: Visualizar botón de compartir en página de detalles
    Dado que estoy en la página de detalles de un anuncio
    Entonces debo ver un botón de "Compartir" claramente visible
    Y el botón debe tener un icono de compartir (flechas o similar)
    Y debe estar ubicado cerca del título o en la barra de acciones

  Escenario: Hover sobre botón de compartir
    Dado que veo el botón de "Compartir"
    Cuando paso el mouse sobre el botón
    Entonces debe haber un efecto visual de hover
    Y puede mostrar un tooltip "Compartir anuncio"

  # ============================================================================
  # ESCENARIOS: REGISTRO DE COMPARTIDOS (ANALYTICS)
  # ============================================================================

  Escenario: Registrar evento de compartir
    Dado que estoy en la página de detalles de un anuncio
    Cuando comparto el anuncio exitosamente
    Entonces el sistema debe registrar un evento de tipo "share" en los logs
    Y el evento debe incluir el ID del anuncio
    Y debe incluir el método de compartir (nativo, whatsapp, facebook, twitter, copiar)

  Escenario: Visualizar contador de compartidos (opcional)
    Dado que un anuncio ha sido compartido 10 veces
    Cuando visualizo la página de detalles
    Entonces puede mostrarse un contador "Compartido 10 veces"
    Y el contador debe ser visible para el anunciante en el panel de métricas

  # ============================================================================
  # ESCENARIOS: RESPONSIVIDAD
  # ============================================================================

  Escenario: Modal de compartir en móvil
    Dado que abro el modal de compartir en móvil
    Entonces el modal debe ocupar la mayor parte de la pantalla
    Y los botones deben ser grandes y fáciles de tocar
    Y debe haber espaciado adecuado entre opciones

  Escenario: Modal de compartir en escritorio
    Dado que abro el modal de compartir en escritorio
    Entonces el modal debe ser de tamaño mediano y centrado
    Y debe tener un ancho máximo (ej. 400px)
    Y debe verse estético y profesional

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al abrir API nativa
    Dado que mi dispositivo soporta API nativa
    Pero hay un error al invocarla
    Cuando hago clic en "Compartir"
    Entonces debe mostrarse el modal de compartir como fallback
    Y debo poder compartir usando las opciones del modal

  Escenario: Manejo de bloqueador de pop-ups
    Dado que tengo un bloqueador de pop-ups activo
    Cuando intento compartir en una red social
    Entonces debo ver un mensaje "Habilita pop-ups para compartir"
    O el enlace debe abrirse en la misma pestaña

  Escenario: Compartir anuncio eliminado o no disponible
    Dado que intento compartir un anuncio que fue eliminado
    Cuando alguien hace clic en el enlace compartido
    Entonces debe ver un mensaje "Este anuncio ya no está disponible"
    Y debe poder navegar a la página principal
