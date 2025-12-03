# language: es
Característica: Analítica de Anuncios y Seguimiento de Tráfico

  Como administrador del sistema y anunciante
  Quiero registrar y visualizar las interacciones con los anuncios (vistas, clicks, carrito)
  Para entender el rendimiento de mis publicaciones y conocer a mi audiencia

  Antecedentes:
    Dado que existe una colección "logs" en Appwrite
    Y la colección tiene los atributos: anuncioId, type, sessionId, deviceType, os, browser, $createdAt

  Regla de Negocio: El registro de vistas debe estar limitado para evitar conteos inflados
    - Las vistas se registran solo si han pasado más de 60 minutos desde la última vista del mismo anuncio por el mismo usuario
    - Los eventos de tipo "click" y "cart_add" se registran siempre sin restricción de tiempo

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Todos los eventos deben registrarse en la colección "logs" de Appwrite
  # 2. Cada evento debe incluir: anuncioId, type, sessionId, deviceType, os, browser
  # 3. Las vistas deben tener rate limiting de 60 minutos
  # 4. Los clicks y agregados al carrito no tienen rate limiting
  # 5. Las métricas deben ser consultables y visualizables en el panel de administración
  # 6. Los datos deben ser precisos y no duplicados artificialmente

  # ============================================================================
  # ESCENARIOS: REGISTRO DE EVENTOS
  # ============================================================================

  Escenario: Registrar una vista de detalle de anuncio por primera vez
    Dado que un visitante accede a la página de detalle del anuncio "A123"
    Y el visitante nunca ha visto este anuncio antes
    Cuando la página termina de cargar completamente
    Entonces el sistema debe registrar un evento en la colección "logs" con:
      | atributo    | valor                                      |
      | anuncioId   | A123                                       |
      | type        | view                                       |
      | sessionId   | ID único de sesión del visitante           |
      | deviceType  | mobile o desktop según el dispositivo      |
      | os          | Sistema Operativo detectado                |
      | browser     | Navegador detectado                        |
    Y el timestamp debe ser la fecha y hora actual

  Escenario: Evitar duplicados de vistas en corto tiempo (Rate Limiting)
    Dado que un visitante vio el anuncio "A123" hace 10 minutos
    Cuando el visitante recarga la página del anuncio "A123"
    Entonces el sistema NO debe registrar un nuevo evento de tipo "view"
    Y el conteo total de vistas debe permanecer inalterado

  Escenario: Registrar vista después de que expire el rate limiting
    Dado que un visitante vio el anuncio "A123" hace 65 minutos
    Cuando el visitante vuelve a acceder a la página del anuncio "A123"
    Entonces el sistema debe registrar un nuevo evento de tipo "view"
    Y el conteo total de vistas debe incrementarse en 1

  Escenario: Registrar interacción de agregar al carrito
    Dado que un visitante está en el detalle del anuncio "A123"
    Cuando hace clic en el botón "Agregar al carrito"
    Entonces el sistema debe registrar un evento de tipo "cart_add"
    Y este evento NO debe tener restricción de tiempo
    Y debe registrarse cada vez que se haga clic en el botón

  Escenario: Registrar múltiples clicks en el mismo anuncio
    Dado que un visitante está en el detalle del anuncio "A123"
    Cuando hace clic en el botón "Agregar al carrito" 3 veces consecutivas
    Entonces el sistema debe registrar 3 eventos separados de tipo "cart_add"
    Y cada evento debe tener su propio timestamp

  Escenario: Registrar vista desde diferentes dispositivos
    Dado que un visitante accede al anuncio "A123" desde un dispositivo móvil
    Y registra una vista
    Cuando el mismo visitante accede al anuncio "A123" desde un dispositivo de escritorio 5 minutos después
    Entonces el sistema NO debe registrar una nueva vista
    Y debe respetar el rate limiting de 60 minutos independientemente del dispositivo

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DE MÉTRICAS
  # ============================================================================

  Escenario: Visualizar métricas básicas en el panel de administración
    Dado que soy un administrador autenticado
    Y existen 50 eventos de tipo "view" para el anuncio "A123"
    Cuando accedo a la pestaña de "Métricas" del anuncio "A123"
    Entonces debo ver el total de vistas: 50
    Y debo ver el total de clicks o agregados al carrito
    Y debo ver gráficos de distribución por:
      | métrica            | visualización       |
      | Fuentes de Tráfico | Barra de progreso   |
      | Sistema Operativo  | Barra de progreso   |
      | Navegador          | Barra de progreso   |
      | Tipo de Dispositivo| Barra de progreso   |

  Escenario: Visualizar métricas cuando no hay datos
    Dado que soy un administrador autenticado
    Y el anuncio "A456" no tiene ningún evento registrado
    Cuando accedo a la pestaña de "Métricas" del anuncio "A456"
    Entonces debo ver el total de vistas: 0
    Y debo ver un mensaje indicando "No hay datos disponibles aún"
    Y los gráficos deben mostrar estado vacío

  Escenario: Filtrar métricas por rango de fechas
    Dado que soy un administrador autenticado
    Y existen eventos registrados para el anuncio "A123" en diferentes fechas
    Cuando selecciono un rango de fechas del 1 al 7 de diciembre
    Entonces debo ver solo las métricas de eventos registrados en ese rango
    Y el total de vistas debe reflejar únicamente los eventos del período seleccionado

  # ============================================================================
  # ESCENARIOS: CASOS DE ERROR
  # ============================================================================

  Escenario: Manejo de error al registrar evento por fallo de red
    Dado que un visitante accede al anuncio "A123"
    Y el servicio de Appwrite no está disponible
    Cuando se intenta registrar el evento de vista
    Entonces el sistema debe manejar el error silenciosamente
    Y no debe interrumpir la experiencia del usuario
    Y debe intentar registrar el evento nuevamente si la conexión se restablece

  Escenario: Manejo de datos incompletos en el registro de evento
    Dado que un visitante accede al anuncio "A123"
    Y no se puede detectar el sistema operativo o navegador
    Cuando se intenta registrar el evento de vista
    Entonces el sistema debe registrar el evento con valores por defecto "unknown"
    Y el evento debe incluir todos los demás campos disponibles

  Escenario: Visualizar métricas sin permisos de administrador
    Dado que soy un usuario regular (no administrador)
    Cuando intento acceder a la pestaña de "Métricas" de un anuncio
    Entonces debo ver un mensaje de error "No tienes permisos para ver esta información"
    O debo ser redirigido a la página de inicio
