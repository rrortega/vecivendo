Feature: Mejoras en el Listado de Categorías y Filtros

  Como usuario de la plataforma en desktop
  Quiero ver las categorías y filtros en una barra lateral izquierda
  Para poder navegar y filtrar los anuncios de manera más eficiente

  Scenario: Ver categorías en sidebar en desktop
    Given que estoy en la página de listado de anuncios de un residencial
    When accedo desde un dispositivo desktop
    Then debo ver una barra lateral a la izquierda con la lista de categorías
    And la lista de categorías debe permitir seleccionar una categoría para filtrar

  Scenario: Filtrar por rango de precios
    Given que estoy en la página de listado de anuncios
    When ajusto el slider de rango de precios en el sidebar
    Then los anuncios mostrados deben actualizarse para mostrar solo aquellos dentro del rango seleccionado

  Scenario: Filtrar por fecha de publicación
    Given que estoy en la página de listado de anuncios
    When selecciono un filtro de fecha (ej. "Última semana", "Último mes")
    Then los anuncios mostrados deben corresponder a la fecha de publicación seleccionada

  Scenario: Ordenar anuncios
    Given que estoy en la página de listado de anuncios
    When selecciono una opción de ordenamiento (ej. "Precio: Menor a Mayor", "Más recientes")
    Then los anuncios deben reordenarse según el criterio seleccionado

  Scenario: Diseño responsive en móviles
    Given que estoy en la página de listado de anuncios
    When accedo desde un dispositivo móvil
    Then el sidebar debe estar oculto o colapsado
    And debo poder acceder a las categorías y filtros mediante un menú o botón accesible
