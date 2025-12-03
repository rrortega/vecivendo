# language: es
Característica: Paginación de Anuncios en Home Residencial

  Como usuario del residencial
  Quiero poder paginar los anuncios y cambiar la cantidad de anuncios por página
  Para poder navegar más fácilmente por el catálogo de productos sin sobrecarga

  Antecedentes:
    Dado que existe una página de listado de anuncios por residencial
    Y hay suficientes anuncios para requerir paginación

  Regla de Negocio: Paginación
    - Por defecto se muestran 10 anuncios por página
    - El usuario puede cambiar a 20, 50 o 100 anuncios por página
    - La paginación debe mantenerse al aplicar filtros
    - Al cambiar filtros, la página debe resetear a la primera

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Debe haber controles de paginación visibles cuando hay múltiples páginas
  # 2. El usuario debe poder cambiar la cantidad de items por página
  # 3. La paginación debe funcionar correctamente con filtros
  # 4. El estado de la página debe reflejarse en la URL (opcional)
  # 5. Debe haber indicadores claros de página actual y total de páginas

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DEL PAGINADOR
  # ============================================================================

  Escenario: Ver paginador cuando hay múltiples páginas
    Dado que estoy en el home del residencial
    Y hay 25 anuncios en total
    Y se muestran 10 anuncios por página por defecto
    Entonces debo ver un paginador al final de la lista de anuncios
    Y el paginador debe mostrar: Anterior, 1, 2, 3, Siguiente
    Y la página 1 debe estar marcada como activa
    Y debo ver un indicador "Mostrando 1-10 de 25"

  Escenario: No mostrar paginador cuando hay pocos anuncios
    Dado que estoy en el home del residencial
    Y hay solo 8 anuncios en total
    Y se muestran 10 anuncios por página
    Entonces NO debo ver el paginador
    Y debo ver todos los 8 anuncios en una sola página

  Escenario: Ver selector de items por página
    Dado que estoy en el home del residencial
    Y hay más de 10 anuncios
    Entonces debo ver un selector para cambiar la cantidad de anuncios por página
    Y las opciones deben ser: 10, 20, 50, 100
    Y la opción "10" debe estar seleccionada por defecto

  # ============================================================================
  # ESCENARIOS: NAVEGACIÓN ENTRE PÁGINAS
  # ============================================================================

  Escenario: Cambiar a la página siguiente
    Dado que estoy en el home del residencial
    Y estoy en la página 1
    Y hay 3 páginas en total
    Cuando hago clic en el botón "Siguiente" o en el número "2"
    Entonces debo ver los anuncios correspondientes a la página 2
    Y el indicador de página actual debe actualizarse a "2"
    Y debo ver "Mostrando 11-20 de 25"
    Y la página debe hacer scroll hacia arriba automáticamente

  Escenario: Cambiar a la página anterior
    Dado que estoy en la página 2
    Cuando hago clic en el botón "Anterior" o en el número "1"
    Entonces debo ver los anuncios de la página 1
    Y el indicador debe mostrar "Mostrando 1-10 de 25"

  Escenario: Navegar a una página específica
    Dado que estoy en la página 1
    Y hay 5 páginas en total
    Cuando hago clic en el número "4"
    Entonces debo ver los anuncios de la página 4
    Y el indicador debe mostrar "Mostrando 31-40 de 50"

  Escenario: Deshabilitar botón "Anterior" en primera página
    Dado que estoy en la página 1
    Entonces el botón "Anterior" debe estar deshabilitado
    Y no debe permitir hacer clic

  Escenario: Deshabilitar botón "Siguiente" en última página
    Dado que estoy en la última página (ej. página 3 de 3)
    Entonces el botón "Siguiente" debe estar deshabilitado
    Y no debe permitir hacer clic

  # ============================================================================
  # ESCENARIOS: CAMBIAR ITEMS POR PÁGINA
  # ============================================================================

  Escenario: Cambiar a 20 items por página
    Dado que estoy en el home del residencial
    Y hay 50 anuncios en total
    Y actualmente se muestran 10 por página
    Cuando selecciono "20" en el selector de items por página
    Entonces la lista de anuncios debe recargarse mostrando hasta 20 anuncios
    Y el número de páginas disponibles debe recalcularse de 5 a 3
    Y debo estar en la página 1
    Y debo ver "Mostrando 1-20 de 50"

  Escenario: Cambiar a 50 items por página
    Dado que estoy viendo 10 items por página
    Y hay 50 anuncios en total
    Cuando selecciono "50" en el selector
    Entonces debo ver los 50 anuncios en una sola página
    Y el paginador debe ocultarse (solo 1 página)

  Escenario: Cambiar a 100 items por página con menos anuncios
    Dado que hay 30 anuncios en total
    Cuando selecciono "100" en el selector
    Entonces debo ver los 30 anuncios en una sola página
    Y el paginador debe ocultarse

  Escenario: Persistencia de preferencia de items por página
    Dado que he seleccionado "20" items por página
    Cuando recargo la página
    Entonces la preferencia debe mantenerse
    Y debo seguir viendo 20 items por página

  # ============================================================================
  # ESCENARIOS: PAGINACIÓN CON FILTROS
  # ============================================================================

  Escenario: Mantener filtros al cambiar de página
    Dado que he aplicado un filtro de categoría "Electrónica"
    Y el filtro resulta en 25 anuncios
    Y estoy en la página 1
    Cuando cambio a la página 2
    Entonces los filtros deben mantenerse aplicados
    Y debo ver los anuncios 11-20 de la categoría "Electrónica"

  Escenario: Resetear a página 1 al aplicar nuevo filtro
    Dado que estoy en la página 3
    Cuando aplico un nuevo filtro de precio
    Entonces la paginación debe resetear a la página 1
    Y debo ver los primeros resultados del filtro aplicado

  Escenario: Resetear a página 1 al cambiar búsqueda
    Dado que estoy en la página 2 de una búsqueda
    Cuando realizo una nueva búsqueda
    Entonces debo volver a la página 1
    Y debo ver los primeros resultados de la nueva búsqueda

  Escenario: Paginación con múltiples filtros activos
    Dado que tengo filtros de categoría "Hogar" y precio "$100-$500" activos
    Y los resultados son 15 anuncios
    Cuando navego entre páginas
    Entonces todos los filtros deben mantenerse
    Y solo debo ver anuncios que cumplan ambos criterios

  # ============================================================================
  # ESCENARIOS: INDICADORES VISUALES
  # ============================================================================

  Escenario: Mostrar indicador de rango de resultados
    Dado que estoy en la página 2 de 5
    Y se muestran 10 items por página
    Y hay 50 anuncios en total
    Entonces debo ver un indicador "Mostrando 11-20 de 50"
    Y el indicador debe actualizarse al cambiar de página

  Escenario: Mostrar números de página con puntos suspensivos
    Dado que hay 20 páginas en total
    Y estoy en la página 10
    Entonces el paginador debe mostrar: Anterior, 1, ..., 9, 10, 11, ..., 20, Siguiente
    Y no debe mostrar todos los números de página para evitar saturación

  Escenario: Resaltar página actual
    Dado que estoy en la página 3
    Entonces el número "3" debe estar resaltado visualmente
    Y debe tener un color o estilo diferente a los demás números

  # ============================================================================
  # ESCENARIOS: RESPONSIVIDAD
  # ============================================================================

  Escenario: Paginador en móvil
    Dado que accedo desde un dispositivo móvil
    Y hay múltiples páginas
    Entonces el paginador debe adaptarse al ancho de la pantalla
    Y puede mostrar solo: Anterior, página actual, Siguiente
    Y los números de página pueden ocultarse para ahorrar espacio

  Escenario: Selector de items en móvil
    Dado que accedo desde móvil
    Entonces el selector de items por página debe ser táctil y fácil de usar
    Y debe abrirse un menú desplegable al tocarlo

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al cargar página
    Dado que intento navegar a la página 2
    Y hay un error de conexión
    Entonces debo ver un mensaje "Error al cargar anuncios"
    Y debo permanecer en la página actual
    Y debo poder reintentar

  Escenario: Navegación a página inexistente
    Dado que intento acceder directamente a la URL con página 999
    Y solo hay 5 páginas
    Entonces debo ser redirigido a la página 1
    O debo ver un mensaje "Página no encontrada"

  Escenario: Actualización de resultados mientras estoy en una página
    Dado que estoy en la página 3 de 5
    Y un administrador elimina varios anuncios
    Y ahora solo hay 2 páginas
    Cuando recargo la página
    Entonces debo ser redirigido a la página 2 (última disponible)
    Y debo ver los anuncios correctos
