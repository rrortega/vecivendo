# language: es

Característica: Gestión de Contenidos en Panel de Administración
  Como administrador del sistema
  Quiero gestionar contenidos (artículos, FAQs, blog)
  Para mantener actualizado el centro de ayuda y la información del sitio

  Antecedentes:
    Dado que soy un administrador autenticado
    Y estoy en el panel de administración

  # ==========================================
  # ESCENARIO 1: Listar Contenidos
  # ==========================================

  Escenario: Ver lista de contenidos existentes
    Cuando navego a la sección "Contenidos"
    Entonces debo ver una tabla con los contenidos existentes
    Y cada fila debe mostrar: título, tipo, categoría, estado y fecha de actualización
    Y debo ver controles de paginación si hay más de 10 contenidos

  Escenario: Paginar lista de contenidos
    Dado que hay más de 10 contenidos en el sistema
    Cuando estoy en la página 1 de contenidos
    Y hago clic en "Siguiente"
    Entonces debo ver los contenidos de la página 2
    Y el indicador de página debe mostrar "Página 2 de X"

  Escenario: Filtrar contenidos por tipo
    Dado que existen contenidos de diferentes tipos
    Cuando selecciono "FAQs" en el filtro de tipo
    Entonces solo debo ver contenidos de tipo "faqs"
    Y el contador debe mostrar solo los contenidos filtrados

  Escenario: Filtrar contenidos por categoría
    Dado que existen contenidos de diferentes categorías
    Cuando selecciono "General" en el filtro de categoría
    Entonces solo debo ver contenidos de la categoría "General"

  Escenario: Filtrar contenidos por estado
    Dado que existen contenidos activos e inactivos
    Cuando selecciono "Activos" en el filtro de estado
    Entonces solo debo ver contenidos con estado activo

  Escenario: Buscar contenidos por título
    Dado que existen múltiples contenidos
    Cuando escribo "publicar" en el campo de búsqueda
    Entonces debo ver solo contenidos cuyo título o descripción contenga "publicar"
    Y la búsqueda debe ser insensible a mayúsculas/minúsculas

  Escenario: Combinar múltiples filtros
    Dado que existen contenidos variados
    Cuando selecciono tipo "help", categoría "Registro" y estado "Activos"
    Entonces debo ver solo contenidos que cumplan los tres criterios
    Y si no hay resultados, debo ver el mensaje "No se encontraron contenidos"

  Escenario: Navegar a edición desde lista
    Dado que estoy viendo la lista de contenidos
    Cuando hago clic en una fila de contenido
    Entonces debo ser redirigido a la página de edición de ese contenido

  # ==========================================
  # ESCENARIO 2: Crear Nuevo Contenido
  # ==========================================

  Escenario: Acceder a formulario de creación desde desktop
    Dado que estoy en la lista de contenidos en un dispositivo desktop
    Cuando hago clic en el botón "Crear Nuevo" en la esquina superior derecha
    Entonces debo ser redirigido a la página de creación de contenidos

  Escenario: Acceder a formulario de creación desde mobile
    Dado que estoy en la lista de contenidos en un dispositivo móvil
    Cuando hago clic en el botón flotante (FAB) con ícono "+"
    Entonces debo ser redirigido a la página de creación de contenidos

  Escenario: Crear contenido con todos los campos requeridos
    Dado que estoy en la página de creación de contenidos
    Cuando completo los siguientes campos:
      | Campo            | Valor                                    |
      | Título           | ¿Cómo publicar un anuncio?               |
      | Descripción      | Guía paso a paso para publicar anuncios  |
      | Tipo             | help                                     |
      | Categoría        | Publicación                              |
      | Contenido        | # Pasos\n1. Ir a anuncios\n2. Crear     |
      | Estado           | Activo                                   |
    Y hago clic en "Crear Contenido"
    Entonces el contenido debe ser creado exitosamente
    Y debo ser redirigido a la lista de contenidos
    Y debo ver el nuevo contenido en la lista

  Escenario: Generación automática de slug
    Dado que estoy en la página de creación de contenidos
    Cuando escribo "¿Cómo Publicar un Anuncio?" en el campo título
    Y hago clic fuera del campo título
    Entonces el campo slug debe mostrar "como-publicar-un-anuncio"
    Y el campo slug debe ser de solo lectura

  Escenario: Slug con caracteres especiales y acentos
    Dado que estoy en la página de creación de contenidos
    Cuando escribo "Política de Privacidad & Términos" en el campo título
    Y hago clic fuera del campo título
    Entonces el campo slug debe mostrar "politica-de-privacidad-terminos"
    Y no debe contener caracteres especiales ni acentos

  Escenario: Crear contenido con campos opcionales
    Dado que estoy en la página de creación de contenidos
    Cuando completo solo los campos requeridos
    Y agrego "https://ejemplo.com/imagen.jpg" en foto URL
    Y agrego "anuncio, publicar, ayuda" en palabras clave
    Y hago clic en "Crear Contenido"
    Entonces el contenido debe ser creado con los campos opcionales incluidos

  Escenario: Vista previa de markdown en desktop
    Dado que estoy en la página de creación en desktop
    Cuando escribo "# Título\n**Negrita**" en el editor markdown
    Entonces debo ver la vista previa renderizada en el panel derecho
    Y el título debe mostrarse como H1
    Y "Negrita" debe mostrarse en negrita

  Escenario: Alternar entre edición y vista previa en mobile
    Dado que estoy en la página de creación en móvil
    Cuando hago clic en el botón "Vista Previa"
    Entonces debo ver el contenido markdown renderizado
    Y no debo ver el editor de texto
    Cuando hago clic en el botón "Editar"
    Entonces debo ver el editor de texto
    Y no debo ver la vista previa

  Escenario: Validación de campos requeridos
    Dado que estoy en la página de creación de contenidos
    Cuando intento crear un contenido sin completar el título
    Y hago clic en "Crear Contenido"
    Entonces debo ver el mensaje "El título es requerido"
    Y el contenido no debe ser creado

  Esquema del escenario: Validar todos los campos requeridos
    Dado que estoy en la página de creación de contenidos
    Cuando dejo vacío el campo "<campo>"
    Y hago clic en "Crear Contenido"
    Entonces debo ver el mensaje "<mensaje_error>"
    Y el contenido no debe ser creado

    Ejemplos:
      | campo           | mensaje_error                |
      | Título          | El título es requerido       |
      | Descripción     | La descripción es requerida  |
      | Contenido       | El contenido es requerido    |
      | Categoría       | La categoría es requerida    |

  Escenario: Cancelar creación de contenido
    Dado que estoy en la página de creación de contenidos
    Y he completado algunos campos
    Cuando hago clic en "Cancelar"
    Entonces debo ser redirigido a la lista de contenidos
    Y los cambios no deben ser guardados

  Escenario: Límite de caracteres en descripción
    Dado que estoy en la página de creación de contenidos
    Cuando escribo más de 500 caracteres en la descripción
    Entonces el campo debe limitar la entrada a 500 caracteres
    Y debo ver un contador "500/500 caracteres"

  # ==========================================
  # ESCENARIO 3: Editar Contenido Existente
  # ==========================================

  Escenario: Cargar datos de contenido existente
    Dado que existe un contenido con ID "abc123"
    Cuando navego a la página de edición de ese contenido
    Entonces todos los campos deben estar pre-llenados con los valores actuales
    Y el campo slug debe ser de solo lectura

  Escenario: Actualizar contenido exitosamente
    Dado que estoy editando un contenido existente
    Cuando modifico el título a "Nuevo Título Actualizado"
    Y modifico la descripción
    Y hago clic en "Guardar Cambios"
    Entonces el contenido debe ser actualizado en la base de datos
    Y debo ser redirigido a la lista de contenidos
    Y debo ver el contenido con los cambios aplicados

  Escenario: Slug no modificable en edición
    Dado que estoy editando un contenido existente
    Entonces el campo slug debe estar deshabilitado
    Y debo ver el mensaje "El slug no se puede modificar después de crear el contenido"

  Escenario: Activar/desactivar contenido
    Dado que estoy editando un contenido activo
    Cuando desactivo el toggle de "Contenido activo"
    Y hago clic en "Guardar Cambios"
    Entonces el contenido debe marcarse como inactivo
    Y no debe aparecer en el sitio público

  Escenario: Cambiar tipo de contenido
    Dado que estoy editando un contenido de tipo "help"
    Cuando cambio el tipo a "faqs"
    Y hago clic en "Guardar Cambios"
    Entonces el contenido debe actualizarse con el nuevo tipo

  Escenario: Error al guardar cambios
    Dado que estoy editando un contenido
    Y hay un problema de conexión con la base de datos
    Cuando intento guardar los cambios
    Entonces debo ver un mensaje de error claro
    Y los cambios no deben perderse del formulario
    Y debo poder reintentar guardar

  Escenario: Eliminar contenido
    Dado que estoy editando un contenido
    Cuando hago clic en el botón "Eliminar"
    Entonces debo ver una confirmación "¿Estás seguro de que deseas eliminar este contenido?"
    Cuando confirmo la eliminación
    Entonces el contenido debe ser eliminado de la base de datos
    Y debo ser redirigido a la lista de contenidos
    Y el contenido no debe aparecer en la lista

  Escenario: Cancelar eliminación de contenido
    Dado que estoy editando un contenido
    Cuando hago clic en el botón "Eliminar"
    Y cancelo la confirmación
    Entonces el contenido no debe ser eliminado
    Y debo permanecer en la página de edición

  Escenario: Volver a lista sin guardar
    Dado que estoy editando un contenido
    Y he realizado cambios sin guardar
    Cuando hago clic en el botón "Volver" o "Cancelar"
    Entonces debo ser redirigido a la lista de contenidos
    Y los cambios no guardados deben perderse

  # ==========================================
  # ESCENARIO 4: Casos de Error
  # ==========================================

  Escenario: Error al cargar contenido inexistente
    Dado que intento editar un contenido con ID que no existe
    Cuando navego a la página de edición
    Entonces debo ver un mensaje "Error al cargar el contenido"

  Escenario: Error de red al crear contenido
    Dado que estoy creando un nuevo contenido
    Y hay un problema de conexión
    Cuando intento crear el contenido
    Entonces debo ver un mensaje de error específico
    Y el botón debe volver a estar habilitado para reintentar

  Escenario: URL de foto inválida
    Dado que estoy creando o editando un contenido
    Cuando ingreso "no-es-una-url" en el campo foto URL
    Entonces el navegador debe marcar el campo como inválido
    Y no debo poder enviar el formulario

  # ==========================================
  # ESCENARIO 5: Responsive y UX
  # ==========================================

  Escenario: Tabla responsive en mobile
    Dado que estoy viendo la lista de contenidos en móvil
    Entonces la tabla debe ser scrollable horizontalmente
    Y todos los datos deben ser legibles

  Escenario: FAB visible solo en mobile
    Dado que estoy en la lista de contenidos
    Cuando estoy en desktop
    Entonces no debo ver el botón flotante (FAB)
    Cuando estoy en móvil
    Entonces debo ver el FAB en la esquina inferior derecha

  Escenario: Estados de carga
    Dado que estoy cargando la lista de contenidos
    Entonces debo ver un spinner de carga
    Cuando los datos se cargan
    Entonces el spinner debe desaparecer
    Y debo ver la tabla con datos

  Escenario: Indicadores de guardado
    Dado que estoy guardando un contenido
    Entonces el botón debe mostrar "Guardando..." con un spinner
    Y el botón debe estar deshabilitado
    Cuando el guardado completa
    Entonces debo ser redirigido automáticamente

  # ==========================================
  # ESCENARIO 6: Markdown Features
  # ==========================================

  Escenario: Soporte de GitHub Flavored Markdown
    Dado que estoy editando contenido markdown
    Cuando escribo una tabla en formato markdown
    Entonces la vista previa debe mostrar la tabla correctamente formateada

  Escenario: Listas de tareas en markdown
    Dado que estoy editando contenido markdown
    Cuando escribo "- [ ] Tarea pendiente\n- [x] Tarea completada"
    Entonces la vista previa debe mostrar checkboxes
    Y la tarea completada debe tener un check

  Escenario: Enlaces en markdown
    Dado que estoy editando contenido markdown
    Cuando escribo "[Vecivendo](https://vecivendo.com)"
    Entonces la vista previa debe mostrar un enlace clickeable
