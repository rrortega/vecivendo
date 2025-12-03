# language: es
Característica: Centro de Ayuda

  Como usuario de Vecivendo
  Quiero acceder a un centro de ayuda completo
  Para resolver mis dudas sobre el uso de la plataforma de manera autónoma

  Antecedentes:
    Dado que existe una página de centro de ayuda en la ruta "/centro-de-ayuda"
    Y existen artículos de ayuda organizados por categorías

  Regla de Negocio: Organización del Centro de Ayuda
    - Los artículos deben estar organizados por categorías (Comprar, Vender, Cuenta, etc.)
    - La búsqueda debe ser sensible a mayúsculas/minúsculas y acentos
    - Los artículos deben estar paginados si hay más de 10 resultados
    - Los artículos destacados deben mostrarse en la página principal

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. La página principal debe mostrar barra de búsqueda, categorías y artículos destacados
  # 2. La búsqueda debe funcionar en tiempo real o con botón de búsqueda
  # 3. Los filtros por categoría deben actualizar la lista de artículos
  # 4. Los artículos deben ser legibles y estar bien formateados
  # 5. La navegación debe ser intuitiva y responsiva

  # ============================================================================
  # ESCENARIOS: NAVEGACIÓN Y VISUALIZACIÓN
  # ============================================================================

  Escenario: Ver la página principal del centro de ayuda
    Dado que estoy en cualquier página de la plataforma
    Cuando navego a "/centro-de-ayuda"
    Entonces debo ver un encabezado con el título "Centro de Ayuda"
    Y debo ver una barra de búsqueda prominente
    Y debo ver las categorías de ayuda disponibles (ej. Comprar, Vender, Cuenta)
    Y debo ver una lista de artículos destacados o recientes
    Y debo ver un botón de alternancia de modo oscuro/claro

  Escenario: Ver categorías disponibles
    Dado que estoy en la página del centro de ayuda
    Cuando visualizo la sección de categorías
    Entonces debo ver al menos las siguientes categorías:
      | Categoría       | Icono representativo |
      | Comprar         | Carrito o similar    |
      | Vender          | Etiqueta o similar   |
      | Mi Cuenta       | Usuario o similar    |
      | Pagos           | Dinero o similar     |
      | Seguridad       | Escudo o similar     |
    Y cada categoría debe ser clickeable

  Escenario: Ver artículos destacados en la página principal
    Dado que estoy en la página del centro de ayuda
    Y existen 5 artículos marcados como destacados
    Cuando la página carga completamente
    Entonces debo ver los 5 artículos destacados
    Y cada artículo debe mostrar su título y una breve descripción
    Y debo poder hacer clic en cualquier artículo para ver su contenido completo

  # ============================================================================
  # ESCENARIOS: BÚSQUEDA DE ARTÍCULOS
  # ============================================================================

  Escenario: Buscar artículos con resultados
    Dado que estoy en la página del centro de ayuda
    Cuando escribo "cómo vender" en la barra de búsqueda
    Y presiono Enter o hago clic en el botón de búsqueda
    Entonces debo ver una lista de artículos relacionados con "cómo vender"
    Y los resultados deben resaltar las palabras clave buscadas
    Y debo ver el número total de resultados encontrados

  Escenario: Buscar artículos sin resultados
    Dado que estoy en la página del centro de ayuda
    Cuando escribo "xyz123abc" en la barra de búsqueda
    Y presiono Enter o hago clic en el botón de búsqueda
    Entonces debo ver un mensaje indicando "No se encontraron resultados para 'xyz123abc'"
    Y debo ver sugerencias de búsqueda o categorías populares
    Y debo poder limpiar la búsqueda fácilmente

  Escenario: Búsqueda con caracteres especiales y acentos
    Dado que estoy en la página del centro de ayuda
    Cuando escribo "cómo créar ánuncio" en la barra de búsqueda
    Entonces debo ver resultados que coincidan con "como crear anuncio"
    Y la búsqueda debe ser insensible a acentos y mayúsculas

  Escenario: Limpiar búsqueda
    Dado que he realizado una búsqueda de "vender"
    Y veo los resultados de búsqueda
    Cuando hago clic en el botón de limpiar búsqueda (X)
    Entonces la barra de búsqueda debe vaciarse
    Y debo volver a ver la página principal con artículos destacados

  # ============================================================================
  # ESCENARIOS: FILTRADO POR CATEGORÍA
  # ============================================================================

  Escenario: Filtrar artículos por categoría
    Dado que estoy en la página del centro de ayuda
    Y existen 15 artículos en total
    Y 5 artículos pertenecen a la categoría "Vender"
    Cuando hago clic en la categoría "Vender"
    Entonces debo ver solo los 5 artículos relacionados con "Vender"
    Y la categoría "Vender" debe estar visualmente marcada como activa
    Y debo ver un indicador mostrando "5 artículos en Vender"

  Escenario: Cambiar de categoría
    Dado que estoy viendo artículos de la categoría "Vender"
    Cuando hago clic en la categoría "Comprar"
    Entonces debo ver solo los artículos relacionados con "Comprar"
    Y la categoría "Comprar" debe estar marcada como activa
    Y la categoría "Vender" debe desmarcarse

  Escenario: Ver todas las categorías (quitar filtro)
    Dado que estoy viendo artículos de la categoría "Vender"
    Cuando hago clic en "Todas las categorías" o botón similar
    Entonces debo ver todos los artículos sin filtro
    Y ninguna categoría debe estar marcada como activa

  Escenario: Filtrar categoría sin artículos
    Dado que estoy en la página del centro de ayuda
    Y la categoría "Seguridad" no tiene artículos
    Cuando hago clic en la categoría "Seguridad"
    Entonces debo ver un mensaje "No hay artículos disponibles en esta categoría"
    Y debo poder volver a todas las categorías fácilmente

  # ============================================================================
  # ESCENARIOS: LECTURA DE ARTÍCULOS
  # ============================================================================

  Escenario: Leer un artículo completo
    Dado que estoy en la lista de resultados o en la página principal del centro de ayuda
    Cuando hago clic en el artículo "Cómo crear un anuncio"
    Entonces debo ser redirigido a la página de detalle del artículo
    Y debo ver el título "Cómo crear un anuncio"
    Y debo ver el contenido completo del artículo con formato markdown
    Y debo ver un botón para volver al centro de ayuda

  Escenario: Navegación dentro de un artículo largo
    Dado que estoy leyendo un artículo con múltiples secciones
    Cuando hago scroll hacia abajo
    Entonces debo poder navegar por todas las secciones del artículo
    Y debe haber un botón de "Volver arriba" visible
    Y el contenido debe ser legible en móvil y escritorio

  Escenario: Volver al centro de ayuda desde un artículo
    Dado que estoy leyendo un artículo
    Cuando hago clic en el botón "Volver" o en el breadcrumb
    Entonces debo regresar a la página del centro de ayuda
    Y debo ver la misma vista que tenía antes (búsqueda o categoría activa)

  # ============================================================================
  # ESCENARIOS: PAGINACIÓN
  # ============================================================================

  Escenario: Ver paginación cuando hay muchos artículos
    Dado que estoy en la página del centro de ayuda
    Y hay 25 artículos en total
    Y se muestran 10 artículos por página
    Cuando la página carga
    Entonces debo ver los primeros 10 artículos
    Y debo ver controles de paginación (1, 2, 3, Siguiente)
    Y la página 1 debe estar marcada como activa

  Escenario: Navegar a la siguiente página
    Dado que estoy en la página 1 del centro de ayuda
    Y hay 3 páginas en total
    Cuando hago clic en "Siguiente" o en el número "2"
    Entonces debo ver los artículos de la página 2
    Y la página 2 debe estar marcada como activa
    Y debo poder volver a la página 1

  Escenario: Resetear paginación al cambiar categoría
    Dado que estoy en la página 2 de "Todas las categorías"
    Cuando hago clic en la categoría "Vender"
    Entonces debo ver la página 1 de la categoría "Vender"
    Y la paginación debe resetearse

  # ============================================================================
  # ESCENARIOS: MODO OSCURO/CLARO
  # ============================================================================

  Escenario: Cambiar a modo oscuro
    Dado que estoy en el centro de ayuda en modo claro
    Cuando hago clic en el botón de alternancia de tema
    Entonces la página debe cambiar a modo oscuro
    Y todos los textos deben ser legibles con el fondo oscuro
    Y la preferencia debe guardarse en localStorage

  Escenario: Persistencia del modo oscuro
    Dado que he activado el modo oscuro en el centro de ayuda
    Cuando recargo la página
    Entonces la página debe cargarse en modo oscuro
    Y la preferencia debe mantenerse

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar artículos
    Dado que intento acceder al centro de ayuda
    Y hay un problema de conexión con el servidor
    Cuando la página intenta cargar
    Entonces debo ver un mensaje de error "Error al cargar los artículos"
    Y debo ver un botón para reintentar la carga

  Escenario: Manejo de artículo no encontrado
    Dado que intento acceder directamente a un artículo con ID inválido
    Cuando la página intenta cargar el artículo
    Entonces debo ver un mensaje "Artículo no encontrado"
    Y debo ver un botón para volver al centro de ayuda

  Escenario: Manejo de búsqueda con caracteres especiales
    Dado que estoy en la barra de búsqueda
    Cuando escribo caracteres especiales como "<script>alert('test')</script>"
    Entonces la búsqueda debe sanitizar la entrada
    Y no debe ejecutar ningún código malicioso
    Y debe mostrar resultados seguros o mensaje de "sin resultados"
