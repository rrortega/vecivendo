Feature: Paginación de Anuncios en Home Residencial

  Como usuario del residencial
  Quiero poder paginar los anuncios y cambiar la cantidad de anuncios por página
  Para poder navegar más fácilmente por el catálogo de productos

  Scenario: Ver paginador y selector de items por página
    Given que estoy en el home del residencial
    And hay más anuncios de los que caben en una página
    Then debo ver un paginador al final de la lista de anuncios
    And debo ver un selector para cambiar la cantidad de anuncios por página (10, 20, 50, 100)

  Scenario: Cambiar de página
    Given que estoy en el home del residencial
    And hay suficientes anuncios para múltiples páginas
    When hago clic en el botón de la página siguiente
    Then debo ver los anuncios correspondientes a la siguiente página
    And el indicador de página actual debe actualizarse

  Scenario: Cambiar items por página
    Given que estoy en el home del residencial
    When selecciono "20" en el selector de items por página
    Then la lista de anuncios debe recargarse mostrando hasta 20 anuncios
    And el número de páginas disponibles debe recalcularse

  Scenario: Paginación con filtros
    Given que he aplicado un filtro (por ejemplo, categoría o búsqueda)
    When cambio de página
    Then los filtros deben mantenerse aplicados en la nueva página
