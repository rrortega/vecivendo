# language: es

Característica: Gestión de Favoritos
  Como usuario de Vecivendo
  Quiero poder marcar anuncios como favoritos
  Para poder acceder a ellos fácilmente más tarde

  Regla: Los favoritos se guardan localmente en el dispositivo del usuario

  Escenario: Agregar un anuncio a favoritos
    Dado que estoy en la página de inicio o en la página de detalles de un anuncio
    Y veo un anuncio que me interesa
    Cuando hago clic en el icono de corazón del anuncio
    Entonces el icono de corazón debe cambiar a color rojo
    Y debo ver una notificación que dice "Agregado a favoritos"
    Y el ID del anuncio debe guardarse en mi almacenamiento local

  Escenario: Eliminar un anuncio de favoritos desde el listado
    Dado que tengo un anuncio marcado como favorito
    Cuando hago clic nuevamente en el icono de corazón del anuncio
    Entonces el icono de corazón debe volver a su estado original (sin relleno)
    Y debo ver una notificación que dice "Eliminado de favoritos"
    Y el ID del anuncio debe eliminarse de mi almacenamiento local

  Escenario: Ver la lista de favoritos
    Dado que tengo anuncios marcados como favoritos
    Cuando hago clic en el icono de corazón en el encabezado
    Entonces debo ser redirigido a la página de "Mis Favoritos"
    Y debo ver una lista de todos los anuncios que he marcado como favoritos
    Y la barra de navegación inferior debe ser visible en dispositivos móviles
    Y el pie de página general debe estar oculto en dispositivos móviles

  Escenario: Lista de favoritos vacía
    Dado que no tengo ningún anuncio marcado como favorito
    Cuando voy a la página de "Mis Favoritos"
    Entonces debo ver un mensaje indicando que no tengo favoritos aún
    Y debo ver un botón para explorar anuncios

  Escenario: Eliminar un anuncio de favoritos desde la página de favoritos
    Dado que estoy en la página de "Mis Favoritos"
    Cuando hago clic en el icono de corazón de un anuncio
    Entonces el anuncio debe permanecer en la lista momentáneamente (o hasta recargar)
    Y el icono debe indicar que ya no es favorito
    Y al recargar la página, el anuncio ya no debe aparecer en la lista
