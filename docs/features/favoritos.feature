# language: es
Característica: Gestión de Favoritos

  Como usuario de Vecivendo
  Quiero poder marcar anuncios como favoritos
  Para poder acceder a ellos fácilmente más tarde y no perder de vista productos de mi interés

  Antecedentes:
    Dado que existe un sistema de favoritos que guarda los IDs en localStorage
    Y los usuarios pueden agregar/quitar favoritos desde cualquier página

  Regla de Negocio: Almacenamiento de Favoritos
    - Los favoritos se guardan localmente en el dispositivo del usuario usando localStorage
    - Los favoritos persisten entre sesiones del navegador
    - No hay límite en la cantidad de favoritos que un usuario puede tener
    - Los favoritos son específicos por dispositivo/navegador

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Los usuarios deben poder agregar/quitar anuncios de favoritos con un solo clic
  # 2. El estado de favorito debe reflejarse visualmente en el icono de corazón
  # 3. Los favoritos deben persistir entre sesiones
  # 4. La página de favoritos debe mostrar todos los anuncios guardados
  # 5. Los anuncios eliminados o caducados deben manejarse correctamente en favoritos

  # ============================================================================
  # ESCENARIOS: AGREGAR A FAVORITOS
  # ============================================================================

  Escenario: Agregar un anuncio a favoritos desde la página de inicio
    Dado que estoy en la página de inicio
    Y veo un anuncio "Producto A" que NO está en favoritos
    Cuando hago clic en el icono de corazón del anuncio
    Entonces el icono de corazón debe cambiar a color rojo (relleno)
    Y debo ver una notificación "Agregado a favoritos"
    Y el ID del anuncio debe guardarse en localStorage
    Y el contador de favoritos debe incrementarse en 1

  Escenario: Agregar un anuncio a favoritos desde la página de detalles
    Dado que estoy en la página de detalles del anuncio "Producto A"
    Y el anuncio NO está en favoritos
    Cuando hago clic en el icono de corazón
    Entonces el icono debe cambiar a estado "relleno"
    Y debo ver una notificación "Agregado a favoritos"
    Y el anuncio debe guardarse en localStorage

  Escenario: Agregar múltiples anuncios a favoritos
    Dado que estoy en la página de inicio
    Cuando agrego 5 anuncios diferentes a favoritos
    Entonces todos los 5 anuncios deben guardarse en localStorage
    Y el contador de favoritos debe mostrar "5"
    Y todos los iconos de corazón deben estar en estado "relleno"

  # ============================================================================
  # ESCENARIOS: ELIMINAR DE FAVORITOS
  # ============================================================================

  Escenario: Eliminar un anuncio de favoritos desde el listado
    Dado que tengo un anuncio "Producto A" marcado como favorito
    Y estoy en la página de inicio
    Cuando hago clic nuevamente en el icono de corazón del anuncio
    Entonces el icono de corazón debe volver a su estado original (sin relleno)
    Y debo ver una notificación "Eliminado de favoritos"
    Y el ID del anuncio debe eliminarse de localStorage
    Y el contador de favoritos debe decrementarse en 1

  Escenario: Eliminar un anuncio de favoritos desde la página de detalles
    Dado que estoy en la página de detalles del anuncio "Producto A"
    Y el anuncio YA está en favoritos
    Cuando hago clic en el icono de corazón
    Entonces el icono debe cambiar a estado "vacío"
    Y debo ver una notificación "Eliminado de favoritos"
    Y el anuncio debe eliminarse de localStorage

  Escenario: Eliminar un anuncio de favoritos desde la página de favoritos
    Dado que estoy en la página de "Mis Favoritos"
    Y tengo 3 anuncios en favoritos
    Cuando hago clic en el icono de corazón de un anuncio
    Entonces el icono debe cambiar a estado "vacío"
    Y debo ver una notificación "Eliminado de favoritos"
    Y al recargar la página, el anuncio ya no debe aparecer en la lista
    Y debo ver solo 2 anuncios restantes

  # ============================================================================
  # ESCENARIOS: PÁGINA DE FAVORITOS
  # ============================================================================

  Escenario: Ver la lista de favoritos con anuncios
    Dado que tengo 5 anuncios marcados como favoritos
    Cuando hago clic en el icono de corazón en el encabezado o navego a "/favoritos"
    Entonces debo ser redirigido a la página de "Mis Favoritos"
    Y debo ver una lista de los 5 anuncios que he marcado como favoritos
    Y cada anuncio debe mostrar su imagen, título, precio y estado
    Y la barra de navegación inferior debe ser visible en dispositivos móviles
    Y el pie de página general debe estar oculto en dispositivos móviles

  Escenario: Lista de favoritos vacía
    Dado que no tengo ningún anuncio marcado como favorito
    Cuando voy a la página de "Mis Favoritos"
    Entonces debo ver un mensaje indicando "Aún no tienes favoritos"
    Y debo ver una ilustración o icono representativo
    Y debo ver un botón para "Explorar anuncios" o "Ir al inicio"
    Y al hacer clic debe redirigirme a la página de inicio

  Escenario: Visualizar contador de favoritos en el header
    Dado que tengo 3 anuncios en favoritos
    Cuando visualizo el header de cualquier página
    Entonces el icono de favoritos debe mostrar un badge con "3"
    O debe tener un indicador visual de que hay favoritos

  Escenario: Navegar a detalles desde la página de favoritos
    Dado que estoy en la página de "Mis Favoritos"
    Cuando hago clic en un anuncio
    Entonces debo ser redirigido a la página de detalles del anuncio
    Y el icono de corazón debe estar en estado "relleno"

  # ============================================================================
  # ESCENARIOS: PERSISTENCIA
  # ============================================================================

  Escenario: Persistencia de favoritos al recargar la página
    Dado que he agregado 3 anuncios a favoritos
    Cuando recargo la página de inicio
    Entonces los 3 anuncios deben seguir marcados como favoritos
    Y los iconos de corazón deben estar en estado "relleno"
    Y el contador de favoritos debe mostrar "3"

  Escenario: Persistencia de favoritos al cerrar y abrir el navegador
    Dado que he agregado 5 anuncios a favoritos
    Y cierro el navegador
    Cuando vuelvo a abrir el navegador y accedo a Vecivendo
    Entonces los 5 anuncios deben seguir en favoritos
    Y debo poder verlos en la página de "Mis Favoritos"

  Escenario: Sincronización de estado de favorito entre páginas
    Dado que estoy en la página de inicio
    Y agrego un anuncio "Producto A" a favoritos
    Cuando navego a la página de detalles del "Producto A"
    Entonces el icono de corazón debe estar en estado "relleno"
    Y debe reflejar que ya está en favoritos

  # ============================================================================
  # ESCENARIOS: MANEJO DE ANUNCIOS ELIMINADOS O CADUCADOS
  # ============================================================================

  Escenario: Visualizar anuncio caducado en favoritos
    Dado que tengo un anuncio "Producto A" en favoritos
    Y el anuncio ha caducado
    Cuando accedo a la página de "Mis Favoritos"
    Entonces debo ver el anuncio "Producto A" con una etiqueta "Caducado"
    Y el anuncio debe estar visualmente diferenciado (ej. opacidad reducida)
    Y no debe permitir agregar al carrito

  Escenario: Visualizar anuncio eliminado en favoritos
    Dado que tengo un anuncio "Producto A" en favoritos
    Y el anuncio fue eliminado por el vendedor
    Cuando accedo a la página de "Mis Favoritos"
    Entonces debo ver un mensaje "Producto A ya no está disponible"
    O el anuncio debe mostrarse con estado "No disponible"
    Y debo poder eliminarlo de favoritos fácilmente

  Escenario: Limpiar favoritos de anuncios eliminados automáticamente
    Dado que tengo 5 anuncios en favoritos
    Y 2 de ellos fueron eliminados
    Cuando accedo a la página de "Mis Favoritos"
    Y hago clic en "Limpiar no disponibles" (si existe esta opción)
    Entonces los 2 anuncios eliminados deben quitarse de favoritos
    Y debo ver solo los 3 anuncios disponibles

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar favoritos
    Dado que tengo anuncios en favoritos
    Y hay un problema de conexión al cargar los detalles
    Cuando accedo a la página de "Mis Favoritos"
    Entonces debo ver un mensaje "Error al cargar favoritos"
    Y debo ver un botón para "Reintentar"
    Y los IDs de favoritos deben mantenerse en localStorage

  Escenario: Manejo de localStorage lleno
    Dado que el localStorage del navegador está casi lleno
    Cuando intento agregar un nuevo anuncio a favoritos
    Entonces debo ver un mensaje "No se pudo agregar a favoritos. Espacio insuficiente."
    Y debo poder eliminar favoritos antiguos para liberar espacio

  Escenario: Manejo de localStorage deshabilitado
    Dado que el navegador tiene localStorage deshabilitado
    Cuando intento agregar un anuncio a favoritos
    Entonces debo ver un mensaje "La función de favoritos requiere habilitar el almacenamiento local"
    Y debo ver instrucciones para habilitar localStorage

  # ============================================================================
  # ESCENARIOS: RESPONSIVIDAD
  # ============================================================================

  Escenario: Visualizar favoritos en dispositivo móvil
    Dado que estoy en la página de "Mis Favoritos" en móvil
    Entonces los anuncios deben mostrarse en 1 columna
    Y la barra de navegación inferior debe estar visible
    Y el footer general debe estar oculto

  Escenario: Visualizar favoritos en escritorio
    Dado que estoy en la página de "Mis Favoritos" en escritorio
    Entonces los anuncios deben mostrarse en grid de 2-3 columnas
    Y el footer general debe estar visible
    Y la navegación debe ser mediante el header
