# language: es
Característica: Mejoras en el Listado de Categorías y Filtros

  Como usuario de la plataforma
  Quiero ver categorías y filtros organizados y accesibles
  Para poder navegar y filtrar los anuncios de manera eficiente

  Antecedentes:
    Dado que existe una página de listado de anuncios por residencial
    Y hay categorías y filtros disponibles para organizar los anuncios

  Regla de Negocio: Diseño Responsivo de Filtros
    - En escritorio: sidebar izquierdo con categorías y filtros
    - En móvil: categorías y filtros accesibles mediante botón o menú colapsable
    - Los filtros deben aplicarse en tiempo real sin recargar la página
    - Los filtros activos deben ser visibles y removibles fácilmente

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Las categorías deben mostrarse en sidebar en escritorio
  # 2. Los filtros de precio, fecha y ordenamiento deben funcionar correctamente
  # 3. El diseño debe ser responsivo y adaptarse a móvil
  # 4. Los filtros deben combinarse correctamente (AND logic)
  # 5. Debe haber una opción para limpiar todos los filtros

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE CATEGORÍAS EN ESCRITORIO
  # ============================================================================

  Escenario: Ver categorías en sidebar en desktop
    Dado que estoy en la página de listado de anuncios de un residencial
    Y accedo desde un dispositivo desktop (ancho > 1024px)
    Entonces debo ver una barra lateral a la izquierda con la lista de categorías
    Y cada categoría debe mostrar su nombre y un icono representativo
    Y la lista de categorías debe permitir seleccionar una categoría para filtrar
    Y el sidebar debe ser fijo al hacer scroll

  Escenario: Seleccionar una categoría desde el sidebar
    Dado que estoy en el sidebar de categorías en desktop
    Y hay anuncios en las categorías: Electrónica (5), Hogar (3), Ropa (2)
    Cuando hago clic en la categoría "Electrónica"
    Entonces el listado debe mostrar solo los 5 anuncios de "Electrónica"
    Y la categoría "Electrónica" debe estar resaltada visualmente
    Y debo ver un indicador "Mostrando 5 anuncios en Electrónica"

  Escenario: Deseleccionar categoría para ver todos los anuncios
    Dado que tengo la categoría "Electrónica" seleccionada
    Cuando hago clic nuevamente en "Electrónica" o en "Todas las categorías"
    Entonces el filtro de categoría debe removerse
    Y debo ver todos los anuncios sin filtro de categoría

  # ============================================================================
  # ESCENARIOS: FILTRO POR RANGO DE PRECIOS
  # ============================================================================

  Escenario: Filtrar por rango de precios con slider
    Dado que estoy en la página de listado de anuncios
    Y hay anuncios con precios entre $10 y $1000
    Cuando ajusto el slider de rango de precios a $100 - $500
    Entonces los anuncios mostrados deben actualizarse para mostrar solo aquellos con precio entre $100 y $500
    Y debo ver el rango seleccionado "$100 - $500" visible
    Y el contador de resultados debe actualizarse

  Escenario: Filtrar por precio mínimo solamente
    Dado que estoy en el filtro de precios
    Cuando establezco el precio mínimo en $200
    Y dejo el precio máximo sin límite
    Entonces debo ver solo anuncios con precio >= $200

  Escenario: Filtrar por precio máximo solamente
    Dado que estoy en el filtro de precios
    Cuando establezco el precio máximo en $300
    Y dejo el precio mínimo en 0
    Entonces debo ver solo anuncios con precio <= $300

  Escenario: Limpiar filtro de precio
    Dado que tengo un filtro de precio activo ($100 - $500)
    Cuando hago clic en "Limpiar filtro de precio" o reseteo el slider
    Entonces el filtro de precio debe removerse
    Y debo ver todos los anuncios sin restricción de precio

  # ============================================================================
  # ESCENARIOS: FILTRO POR FECHA DE PUBLICACIÓN
  # ============================================================================

  Escenario: Filtrar por "Última semana"
    Dado que estoy en la página de listado de anuncios
    Y hay anuncios publicados en diferentes fechas
    Cuando selecciono el filtro de fecha "Última semana"
    Entonces los anuncios mostrados deben corresponder solo a los publicados en los últimos 7 días
    Y debo ver un indicador "Mostrando anuncios de la última semana"

  Escenario: Filtrar por "Último mes"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono el filtro de fecha "Último mes"
    Entonces debo ver solo anuncios publicados en los últimos 30 días

  Escenario: Filtrar por "Hoy"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono el filtro de fecha "Hoy"
    Entonces debo ver solo anuncios publicados el día de hoy

  Escenario: Filtrar por rango de fechas personalizado
    Dado que estoy en el filtro de fecha
    Cuando selecciono fecha inicio: 01/12/2024
    Y selecciono fecha fin: 07/12/2024
    Entonces debo ver solo anuncios publicados entre esas fechas

  # ============================================================================
  # ESCENARIOS: ORDENAMIENTO DE ANUNCIOS
  # ============================================================================

  Escenario: Ordenar por "Más recientes"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono la opción de ordenamiento "Más recientes"
    Entonces los anuncios deben reordenarse por fecha de publicación descendente
    Y el anuncio más reciente debe aparecer primero

  Escenario: Ordenar por "Precio: Menor a Mayor"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono "Precio: Menor a Mayor"
    Entonces los anuncios deben reordenarse por precio ascendente
    Y el anuncio más barato debe aparecer primero

  Escenario: Ordenar por "Precio: Mayor a Menor"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono "Precio: Mayor a Menor"
    Entonces los anuncios deben reordenarse por precio descendente
    Y el anuncio más caro debe aparecer primero

  Escenario: Ordenar por "Más populares"
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono "Más populares"
    Entonces los anuncios deben ordenarse por número de vistas o interacciones
    Y el anuncio más visto debe aparecer primero

  # ============================================================================
  # ESCENARIOS: COMBINACIÓN DE FILTROS
  # ============================================================================

  Escenario: Aplicar múltiples filtros simultáneamente
    Dado que estoy en la página de listado de anuncios
    Cuando selecciono la categoría "Electrónica"
    Y establezco el rango de precio $100 - $500
    Y selecciono el filtro de fecha "Última semana"
    Entonces debo ver solo anuncios que cumplan TODOS los criterios:
      - Categoría: Electrónica
      - Precio: entre $100 y $500
      - Publicados en la última semana
    Y debo ver todos los filtros activos listados

  Escenario: Limpiar todos los filtros a la vez
    Dado que tengo múltiples filtros activos (categoría, precio, fecha)
    Cuando hago clic en "Limpiar todos los filtros"
    Entonces todos los filtros deben removerse
    Y debo ver todos los anuncios sin restricciones
    Y el contador de resultados debe mostrar el total

  # ============================================================================
  # ESCENARIOS: DISEÑO RESPONSIVO EN MÓVILES
  # ============================================================================

  Escenario: Visualización de filtros en móvil
    Dado que estoy en la página de listado de anuncios
    Y accedo desde un dispositivo móvil (ancho <= 768px)
    Entonces el sidebar debe estar oculto o colapsado
    Y debo ver un botón "Filtros" o icono de filtro en el header
    Y el listado de anuncios debe ocupar todo el ancho

  Escenario: Abrir panel de filtros en móvil
    Dado que estoy en móvil
    Cuando hago clic en el botón "Filtros"
    Entonces debe abrirse un panel modal o drawer con todos los filtros
    Y debo poder seleccionar categorías, precio, fecha y ordenamiento
    Y debe haber un botón "Aplicar filtros" al final

  Escenario: Aplicar filtros desde el panel móvil
    Dado que he abierto el panel de filtros en móvil
    Cuando selecciono una categoría "Hogar"
    Y establezco un rango de precio
    Y hago clic en "Aplicar filtros"
    Entonces el panel debe cerrarse
    Y el listado debe actualizarse con los filtros aplicados
    Y debo ver un badge en el botón "Filtros" indicando cuántos filtros están activos

  Escenario: Cerrar panel de filtros sin aplicar
    Dado que he abierto el panel de filtros en móvil
    Cuando hago clic en "Cancelar" o fuera del panel
    Entonces el panel debe cerrarse
    Y los filtros NO deben aplicarse
    Y el listado debe permanecer sin cambios

  # ============================================================================
  # ESCENARIOS: INDICADORES VISUALES
  # ============================================================================

  Escenario: Mostrar contador de resultados
    Dado que estoy en la página de listado
    Y tengo filtros aplicados que resultan en 8 anuncios
    Entonces debo ver un mensaje "Mostrando 8 resultados"
    Y el contador debe actualizarse al cambiar filtros

  Escenario: Mostrar filtros activos como chips removibles
    Dado que tengo filtros activos (Categoría: Electrónica, Precio: $100-$500)
    Entonces debo ver chips o badges para cada filtro activo
    Y cada chip debe tener un botón "X" para removerlo
    Cuando hago clic en la "X" de un chip
    Entonces ese filtro específico debe removerse

  Escenario: Mensaje cuando no hay resultados
    Dado que he aplicado filtros muy restrictivos
    Y no hay anuncios que cumplan los criterios
    Entonces debo ver un mensaje "No se encontraron anuncios con estos filtros"
    Y debo ver un botón "Limpiar filtros" para empezar de nuevo

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar categorías
    Dado que intento acceder a la página de listado
    Y hay un error al cargar las categorías desde la base de datos
    Entonces debo ver un mensaje "Error al cargar categorías"
    Y debo poder ver los anuncios sin filtro de categoría
    Y debo poder reintentar cargar las categorías

  Escenario: Manejo de error al aplicar filtros
    Dado que intento aplicar filtros
    Y hay un problema de conexión
    Entonces debo ver un mensaje "Error al aplicar filtros"
    Y los filtros anteriores deben mantenerse
    Y debo poder reintentar
