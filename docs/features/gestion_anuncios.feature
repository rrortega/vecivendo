# language: es
Característica: Gestión de Anuncios y Publicidad

  Como administrador del sistema
  Quiero poder crear, editar y gestionar anuncios gratis y de pago
  Para mantener el contenido de la plataforma actualizado y relevante

  Antecedentes:
    Dado que existe una colección "anuncios" para anuncios gratis en Appwrite
    Y existe una colección "publicidad" para anuncios de pago en Appwrite
    Y solo los administradores tienen permisos para crear y gestionar anuncios

  Regla de Negocio: Gestión de Anuncios
    - Los anuncios gratis tienen vigencia definida por "dias_vigencia" (por defecto 7 días)
    - Los anuncios de pago pueden tener vigencia personalizada
    - Los administradores pueden activar/desactivar anuncios manualmente
    - El botón de agregar debe adaptarse al dispositivo (escritorio vs móvil)

  # ============================================================================
  # CRITERIOS DE ACEPTACIÓN GENERALES
  # ============================================================================
  # 1. Los administradores deben poder crear anuncios gratis y de pago
  # 2. El botón de agregar debe ser responsivo (texto en escritorio, FAB en móvil)
  # 3. Los formularios deben validar todos los campos requeridos
  # 4. Los anuncios deben guardarse correctamente en Appwrite
  # 5. Los administradores deben poder editar y eliminar anuncios existentes
  # 6. Los errores deben manejarse apropiadamente sin perder datos del formulario

  # ============================================================================
  # ESCENARIOS: VISUALIZACIÓN DEL BOTÓN DE AGREGAR
  # ============================================================================

  Escenario: Visualización del botón de agregar en escritorio
    Dado que soy un administrador autenticado
    Y estoy en la página de "Anuncios Gratis" o "Publicidad"
    Y estoy visualizando la plataforma en un dispositivo de escritorio (ancho > 768px)
    Entonces debo ver el botón "Agregar" en la parte superior derecha de la lista
    Y el botón debe tener un texto visible que diga "Agregar" o "Nuevo Anuncio"
    Y debe tener un icono de "más" (+) junto al texto

  Escenario: Visualización del botón de agregar en móvil
    Dado que soy un administrador autenticado
    Y estoy en la página de "Anuncios Gratis" o "Publicidad"
    Y estoy visualizando la plataforma en un dispositivo móvil (ancho <= 768px)
    Entonces debo ver un botón flotante (FAB) en la esquina inferior derecha
    Y el botón debe ser redondo y contener un icono de "más" (+)
    Y el botón debe estar siempre visible al hacer scroll

  Escenario: Hacer clic en el botón de agregar
    Dado que estoy en la página de "Anuncios Gratis"
    Cuando hago clic en el botón "Agregar"
    Entonces debo ser redirigido a la página de creación de anuncios gratis
    Y debo ver un formulario vacío listo para completar

  # ============================================================================
  # ESCENARIOS: CREACIÓN DE ANUNCIOS GRATIS
  # ============================================================================

  Escenario: Creación exitosa de un anuncio gratis con todos los campos
    Dado que estoy en la página de creación de anuncios gratis
    Cuando completo el formulario con los siguientes datos:
      | Campo         | Valor                  |
      | Título        | Venta de Garage        |
      | Precio        | 500                    |
      | Categoría     | Otros                  |
      | Descripción   | Varios artículos       |
      | Días Vigencia | 7                      |
      | Imágenes      | 3 imágenes cargadas    |
    Y presiono el botón "Guardar"
    Entonces el sistema debe guardar el anuncio en la colección "anuncios"
    Y debo ver un mensaje de éxito "Anuncio creado correctamente"
    Y debo ser redirigido a la lista de anuncios gratis
    Y el nuevo anuncio debe aparecer en la lista

  Escenario: Creación de anuncio gratis con vigencia personalizada
    Dado que estoy en la página de creación de anuncios gratis
    Cuando completo el formulario con días de vigencia = 14
    Y presiono "Guardar"
    Entonces el anuncio debe guardarse con vigencia de 14 días
    Y la fecha de caducidad debe calcularse como $updatedAt + 14 días

  Escenario: Cargar múltiples imágenes en anuncio gratis
    Dado que estoy en el formulario de creación de anuncios gratis
    Cuando cargo 5 imágenes
    Entonces debo ver las 5 imágenes en vista previa
    Y debo poder eliminar imágenes individuales
    Y debo poder reordenar las imágenes
    Y al guardar, todas las imágenes deben subirse a Appwrite Storage

  # ============================================================================
  # ESCENARIOS: CREACIÓN DE ANUNCIOS DE PAGO (PUBLICIDAD)
  # ============================================================================

  Escenario: Creación exitosa de un anuncio de pago (Publicidad)
    Dado que estoy en la página de creación de publicidad
    Cuando completo el formulario con los siguientes datos:
      | Campo         | Valor                  |
      | Título        | Promo Pizza            |
      | Cliente       | Pizzería Luigi         |
      | Imagen        | imagen_promo.jpg       |
      | URL Destino   | https://pizzeria.com   |
      | Estado        | Activo                 |
      | Vigencia      | 30 días                |
    Y presiono el botón "Guardar"
    Entonces el sistema debe guardar el anuncio en la colección "publicidad"
    Y debo ver un mensaje de éxito "Publicidad creada correctamente"
    Y debo ser redirigido a la lista de publicidad
    Y el nuevo anuncio debe aparecer en la lista con estado "Activo"

  Escenario: Crear publicidad con fecha de inicio y fin
    Dado que estoy en el formulario de creación de publicidad
    Cuando establezco fecha de inicio: 01/12/2024
    Y establezco fecha de fin: 31/12/2024
    Y completo los demás campos requeridos
    Y presiono "Guardar"
    Entonces la publicidad debe guardarse con las fechas especificadas
    Y solo debe mostrarse a los usuarios entre esas fechas

  # ============================================================================
  # ESCENARIOS: VALIDACIÓN DE FORMULARIOS
  # ============================================================================

  Escenario: Validación de campo título requerido
    Dado que estoy en el formulario de creación de anuncios
    Cuando intento guardar el formulario sin completar el campo "Título"
    Entonces el sistema no debe guardar el anuncio
    Y debo ver un mensaje de error "El título es requerido"
    Y el campo "Título" debe resaltarse en rojo

  Escenario: Validación de campo precio requerido
    Dado que estoy en el formulario de creación de anuncios gratis
    Cuando intento guardar sin completar el campo "Precio"
    Entonces debo ver un mensaje de error "El precio es requerido"
    Y el formulario no debe enviarse

  Escenario: Validación de formato de precio
    Dado que estoy en el formulario de creación de anuncios
    Cuando ingreso un precio con letras "abc"
    Y intento guardar
    Entonces debo ver un mensaje de error "El precio debe ser un número válido"
    Y el formulario no debe enviarse

  Escenario: Validación de categoría requerida
    Dado que estoy en el formulario de creación de anuncios gratis
    Cuando intento guardar sin seleccionar una categoría
    Entonces debo ver un mensaje de error "La categoría es requerida"

  Escenario: Validación de tamaño máximo de imagen
    Dado que estoy en el formulario de creación
    Cuando intento cargar una imagen de 10MB
    Y el límite es 5MB
    Entonces debo ver un mensaje de error "La imagen no debe superar 5MB"
    Y la imagen no debe cargarse

  # ============================================================================
  # ESCENARIOS: EDICIÓN DE ANUNCIOS
  # ============================================================================

  Escenario: Editar un anuncio gratis existente
    Dado que estoy en la lista de anuncios gratis
    Y existe un anuncio "Venta de Garage"
    Cuando hago clic en el botón de editar del anuncio
    Entonces debo ser redirigido al formulario de edición
    Y todos los campos deben estar pre-llenados con los datos actuales
    Cuando modifico el título a "Venta de Garage - Actualizado"
    Y presiono "Guardar"
    Entonces el anuncio debe actualizarse en la base de datos
    Y debo ver un mensaje "Anuncio actualizado correctamente"

  Escenario: Actualizar imágenes de un anuncio existente
    Dado que estoy editando un anuncio que tiene 3 imágenes
    Cuando elimino 1 imagen
    Y agrego 2 imágenes nuevas
    Y presiono "Guardar"
    Entonces el anuncio debe tener 4 imágenes en total
    Y las imágenes eliminadas deben borrarse de Appwrite Storage

  # ============================================================================
  # ESCENARIOS: ACTIVACIÓN/DESACTIVACIÓN DE ANUNCIOS
  # ============================================================================

  Escenario: Desactivar un anuncio activo
    Dado que estoy en la lista de anuncios
    Y existe un anuncio activo "Producto A"
    Cuando hago clic en el toggle de activación
    Entonces el anuncio debe cambiar a estado "inactivo"
    Y debo ver una confirmación "Anuncio desactivado"
    Y el anuncio no debe mostrarse a los usuarios finales

  Escenario: Activar un anuncio desactivado
    Dado que estoy en la lista de anuncios
    Y existe un anuncio inactivo "Producto B"
    Cuando hago clic en el toggle de activación
    Entonces el anuncio debe cambiar a estado "activo"
    Y debo ver una confirmación "Anuncio activado"
    Y el anuncio debe mostrarse a los usuarios finales

  # ============================================================================
  # ESCENARIOS: ELIMINACIÓN DE ANUNCIOS
  # ============================================================================

  Escenario: Eliminar un anuncio con confirmación
    Dado que estoy en la lista de anuncios
    Y existe un anuncio "Producto C"
    Cuando hago clic en el botón de eliminar
    Entonces debo ver un modal de confirmación "¿Estás seguro de eliminar este anuncio?"
    Cuando confirmo la eliminación
    Entonces el anuncio debe eliminarse de la base de datos
    Y las imágenes asociadas deben eliminarse de Appwrite Storage
    Y debo ver un mensaje "Anuncio eliminado correctamente"

  Escenario: Cancelar eliminación de anuncio
    Dado que estoy en el modal de confirmación de eliminación
    Cuando hago clic en "Cancelar"
    Entonces el modal debe cerrarse
    Y el anuncio NO debe eliminarse
    Y debo volver a la lista de anuncios

  # ============================================================================
  # ESCENARIOS: FILTRADO Y BÚSQUEDA
  # ============================================================================

  Escenario: Filtrar anuncios por estado (activo/inactivo)
    Dado que estoy en la lista de anuncios
    Y hay 10 anuncios activos y 5 inactivos
    Cuando selecciono el filtro "Solo activos"
    Entonces debo ver solo los 10 anuncios activos

  Escenario: Buscar anuncios por título
    Dado que estoy en la lista de anuncios
    Cuando escribo "Garage" en el campo de búsqueda
    Entonces debo ver solo los anuncios que contengan "Garage" en el título

  # ============================================================================
  # ESCENARIOS: MANEJO DE ERRORES
  # ============================================================================

  Escenario: Manejo de errores de servidor al guardar
    Dado que estoy en el formulario de creación de anuncios
    Y el servicio de Appwrite no está disponible
    Cuando completo el formulario y presiono "Guardar"
    Entonces debo ver un mensaje de error "Error al guardar el anuncio. Intenta nuevamente."
    Y los datos del formulario deben mantenerse para permitir un reintento
    Y no debo ser redirigido

  Escenario: Manejo de error al cargar imagen
    Dado que estoy en el formulario de creación
    Cuando intento cargar una imagen corrupta
    Entonces debo ver un mensaje "Error al cargar la imagen. Intenta con otra."
    Y la imagen no debe agregarse al formulario

  Escenario: Manejo de sesión expirada
    Dado que estoy en el formulario de creación de anuncios
    Y mi sesión de administrador ha expirado
    Cuando intento guardar el anuncio
    Entonces debo ver un mensaje "Tu sesión ha expirado. Por favor inicia sesión nuevamente."
    Y debo ser redirigido a la página de login
    Y los datos del formulario deben guardarse temporalmente (si es posible)
