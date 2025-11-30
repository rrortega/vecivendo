Feature: Centro de Ayuda
  Como usuario de Vecivendo
  Quiero acceder a un centro de ayuda
  Para resolver mis dudas sobre el uso de la plataforma

  Scenario: Ver la página principal del centro de ayuda
    Given que estoy en cualquier página de la plataforma
    When navego a "/centro-de-ayuda"
    Then debo ver una barra de búsqueda
    And debo ver las categorías de ayuda
    And debo ver una lista de artículos destacados o recientes

  Scenario: Buscar un artículo de ayuda
    Given que estoy en la página del centro de ayuda
    When escribo "cómo vender" en la barra de búsqueda
    Then debo ver una lista de artículos relacionados con "cómo vender"

  Scenario: Filtrar artículos por categoría
    Given que estoy en la página del centro de ayuda
    When hago clic en la categoría "Vender"
    Then debo ver solo los artículos relacionados con la categoría "Vender"

  Scenario: Leer un artículo de ayuda
    Given que estoy en la lista de resultados o en la página principal del centro de ayuda
    When hago clic en un artículo
    Then debo ser redirigido a la página de detalle del artículo
    And debo ver el título del artículo
    And debo ver el contenido del artículo paso a paso
