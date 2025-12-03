# Característica: Dashboard de KPIs para Administrador

## Historia de Usuario

**Como** administrador del sistema Vecivendo  
**Quiero** visualizar KPIs en tiempo real con filtros de fecha y residencial  
**Para** tomar decisiones informadas sobre el estado y rendimiento de la plataforma

---

## Antecedentes

```gherkin
Característica: Dashboard de KPIs para Administrador
  Como administrador del sistema
  Quiero acceder a un dashboard completo de KPIs
  Para monitorear el rendimiento de la plataforma en tiempo real

  Antecedentes:
    Dado que soy un administrador autenticado
    Y tengo acceso al panel de administración
    Y existen datos en las colecciones: anuncios, logs, pedidos, anuncios_pago, reviews
```

---

## Escenarios de Aceptación

### Escenario 1: Acceso al Dashboard
```gherkin
Escenario: Acceder al dashboard de KPIs desde el menú
  Dado que estoy en el panel de administración
  Cuando hago clic en "Dashboard KPIs" en el menú lateral
  Entonces debo ser redirigido a "/console/dashboard"
  Y debo ver el título "Dashboard de KPIs"
  Y debo ver el subtítulo "Métricas en tiempo real del sistema"
```

### Escenario 2: Visualización de KPIs de Anuncios
```gherkin
Escenario: Ver KPIs de la sección de Anuncios
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Anuncios"
  Y debo ver el KPI "Anuncios Activos" con un valor numérico
  Y debo ver el KPI "Tasa de Crecimiento" con un porcentaje
  Y debo ver el KPI "Próximos a Vencer" con un valor numérico
  Y debo ver un indicador de tendencia (↑, ↓, o -) para cada KPI
  Y debo ver el porcentaje de cambio vs período anterior
```

### Escenario 3: Visualización de KPIs de Engagement
```gherkin
Escenario: Ver KPIs de la sección de Engagement
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Engagement"
  Y debo ver el KPI "Total de Visualizaciones"
  Y debo ver el KPI "Visualizaciones Únicas"
  Y debo ver el KPI "Total de Clics"
  Y debo ver el KPI "CTR (Tasa de Clics)" en formato porcentaje
  Y cada KPI debe mostrar comparación con período anterior
```

### Escenario 4: Visualización de KPIs de Pedidos
```gherkin
Escenario: Ver KPIs de la sección de Pedidos
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Pedidos"
  Y debo ver el KPI "Total de Pedidos"
  Y debo ver el KPI "Valor Total" en formato de moneda
  Y debo ver el KPI "Ticket Promedio" en formato de moneda
  Y debo ver el KPI "Tasa de Conversión" en formato porcentaje
```

### Escenario 5: Visualización de KPIs de Usuarios
```gherkin
Escenario: Ver KPIs de la sección de Usuarios
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Usuarios"
  Y debo ver el KPI "Anunciantes Activos"
  Y debo ver el KPI "Nuevos Anunciantes"
```

### Escenario 6: Visualización de KPIs de Publicidad Pagada
```gherkin
Escenario: Ver KPIs de la sección de Publicidad Pagada
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Publicidad Pagada"
  Y debo ver el KPI "Anuncios Pagados Activos"
  Y debo ver el KPI "Impresiones"
  Y debo ver el KPI "CTR de Publicidad" en formato porcentaje
```

### Escenario 7: Visualización de KPIs de Calidad
```gherkin
Escenario: Ver KPIs de la sección de Calidad
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver la sección "Calidad"
  Y debo ver el KPI "Total de Reseñas"
  Y debo ver el KPI "Calificación Promedio" con un decimal
```

---

## Escenarios de Filtros

### Escenario 8: Usar filtro rápido "Hoy"
```gherkin
Escenario: Filtrar KPIs por el día de hoy
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el botón "Hoy" en los filtros de fecha
  Entonces el botón "Hoy" debe estar resaltado visualmente
  Y todos los KPIs deben actualizarse
  Y debo ver solo datos del día actual
  Y las comparaciones deben ser con el día anterior
```

### Escenario 9: Usar filtro rápido "Últimos 7 días"
```gherkin
Escenario: Filtrar KPIs por los últimos 7 días
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el botón "Últimos 7 días"
  Entonces el botón debe estar resaltado
  Y todos los KPIs deben mostrar datos de los últimos 7 días
  Y las comparaciones deben ser con los 7 días anteriores a ese período
```

### Escenario 10: Usar filtro rápido "Últimos 30 días"
```gherkin
Escenario: Filtrar KPIs por los últimos 30 días (por defecto)
  Dado que accedo al dashboard por primera vez
  Entonces el filtro "Últimos 30 días" debe estar activo por defecto
  Y debo ver datos de los últimos 30 días
  Y las comparaciones deben ser con los 30 días anteriores
```

### Escenario 11: Usar filtro rápido "Últimos 90 días"
```gherkin
Escenario: Filtrar KPIs por los últimos 90 días
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el botón "Últimos 90 días"
  Entonces todos los KPIs deben mostrar datos de los últimos 90 días
  Y las comparaciones deben ser con los 90 días anteriores
```

### Escenario 12: Usar filtro "Este mes"
```gherkin
Escenario: Filtrar KPIs por el mes actual
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el botón "Este mes"
  Entonces debo ver datos desde el día 1 del mes actual hasta hoy
  Y las comparaciones deben ser con el mismo período del mes anterior
```

### Escenario 13: Usar filtro "Mes anterior"
```gherkin
Escenario: Filtrar KPIs por el mes anterior completo
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el botón "Mes anterior"
  Entonces debo ver datos del mes anterior completo
  Y las comparaciones deben ser con el mes anterior a ese
```

### Escenario 14: Usar rango de fechas personalizado
```gherkin
Escenario: Filtrar KPIs con rango de fechas personalizado
  Dado que estoy en el dashboard de KPIs
  Cuando selecciono "2024-01-01" como fecha de inicio
  Y selecciono "2024-01-31" como fecha de fin
  Y hago clic en el botón "Aplicar"
  Entonces debo ver datos del 1 al 31 de enero de 2024
  Y las comparaciones deben ser con un período de igual duración anterior
  Y el filtro "Personalizado" debe estar activo
```

### Escenario 15: Validación de rango personalizado inválido
```gherkin
Escenario: Intentar aplicar un rango de fechas inválido
  Dado que estoy en el dashboard de KPIs
  Cuando selecciono "2024-01-31" como fecha de inicio
  Y selecciono "2024-01-01" como fecha de fin
  Y hago clic en el botón "Aplicar"
  Entonces el botón "Aplicar" debe estar deshabilitado
  Y no debo poder aplicar el filtro
```

---

## Escenarios de Filtro por Residencial

### Escenario 16: Ver todos los residenciales
```gherkin
Escenario: Filtrar por todos los residenciales (por defecto)
  Dado que accedo al dashboard por primera vez
  Entonces el filtro de residencial debe mostrar "Todos los residenciales"
  Y debo ver datos agregados de todos los residenciales
```

### Escenario 17: Filtrar por un residencial específico
```gherkin
Escenario: Seleccionar un residencial específico
  Dado que estoy en el dashboard de KPIs
  Cuando hago clic en el dropdown de residenciales
  Entonces debo ver una lista de todos los residenciales ordenados alfabéticamente
  Cuando selecciono "Residencial Las Palmas"
  Entonces el dropdown debe mostrar "Residencial Las Palmas"
  Y todos los KPIs deben actualizarse
  Y debo ver solo datos de "Residencial Las Palmas"
```

### Escenario 18: Volver a ver todos los residenciales
```gherkin
Escenario: Cambiar de un residencial específico a todos
  Dado que estoy filtrando por "Residencial Las Palmas"
  Cuando hago clic en el dropdown de residenciales
  Y selecciono "Todos los residenciales"
  Entonces debo ver datos agregados de todos los residenciales nuevamente
```

---

## Escenarios de Gráficos

### Escenario 19: Visualizar gráfico de anuncios por categoría
```gherkin
Escenario: Ver distribución de anuncios por categoría
  Dado que estoy en el dashboard de KPIs
  Y existen anuncios en diferentes categorías
  Cuando la página termina de cargar
  Entonces debo ver un gráfico de barras titulado "Anuncios por Categoría"
  Y el gráfico debe mostrar una barra por cada categoría
  Y cada barra debe tener la altura proporcional al número de anuncios
```

### Escenario 20: Visualizar gráfico de engagement por dispositivo
```gherkin
Escenario: Ver distribución de engagement por tipo de dispositivo
  Dado que estoy en el dashboard de KPIs
  Y existen logs de diferentes dispositivos
  Cuando la página termina de cargar
  Entonces debo ver un gráfico de dona titulado "Engagement por Dispositivo"
  Y el gráfico debe mostrar porcentajes para mobile, desktop y tablet
  Y debo poder ver tooltips al pasar el mouse sobre cada sección
```

### Escenario 21: Visualizar gráfico de pedidos por estado
```gherkin
Escenario: Ver distribución de pedidos por estado
  Dado que estoy en el dashboard de KPIs
  Y existen pedidos en diferentes estados
  Cuando la página termina de cargar
  Entonces debo ver un gráfico de barras titulado "Pedidos por Estado"
  Y el gráfico debe mostrar barras para: Pendiente, Confirmado, En proceso, Completado, Cancelado
```

### Escenario 22: Visualizar gráfico de distribución de calificaciones
```gherkin
Escenario: Ver distribución de calificaciones de reseñas
  Dado que estoy en el dashboard de KPIs
  Y existen reseñas con diferentes calificaciones
  Cuando la página termina de cargar
  Entonces debo ver un gráfico de barras titulado "Distribución de Calificaciones"
  Y el gráfico debe mostrar barras para 1, 2, 3, 4 y 5 estrellas
```

---

## Escenarios de Actualización en Tiempo Real

### Escenario 23: Actualización automática al crear un anuncio
```gherkin
Escenario: Ver actualización en tiempo real cuando se crea un anuncio
  Dado que estoy viendo el dashboard de KPIs
  Y el KPI "Anuncios Activos" muestra "50"
  Cuando se crea un nuevo anuncio activo en la base de datos
  Entonces el KPI "Anuncios Activos" debe actualizarse automáticamente a "51"
  Y no debo necesitar refrescar la página manualmente
```

### Escenario 24: Actualización automática al registrar una visualización
```gherkin
Escenario: Ver actualización en tiempo real cuando se registra una vista
  Dado que estoy viendo el dashboard de KPIs
  Y el KPI "Total de Visualizaciones" muestra "1000"
  Cuando se registra una nueva visualización en la colección logs
  Entonces el KPI "Total de Visualizaciones" debe actualizarse automáticamente a "1001"
```

### Escenario 25: Actualización automática al crear un pedido
```gherkin
Escenario: Ver actualización en tiempo real cuando se crea un pedido
  Dado que estoy viendo el dashboard de KPIs
  Y el KPI "Total de Pedidos" muestra "25"
  Cuando se crea un nuevo pedido en la base de datos
  Entonces el KPI "Total de Pedidos" debe actualizarse automáticamente a "26"
  Y el KPI "Valor Total" debe incrementarse con el monto del nuevo pedido
  Y el KPI "Ticket Promedio" debe recalcularse automáticamente
```

### Escenario 26: Indicador de actualización en tiempo real
```gherkin
Escenario: Ver indicador de que la actualización en tiempo real está activa
  Dado que estoy en el dashboard de KPIs
  Cuando la página termina de cargar
  Entonces debo ver un indicador en la parte inferior
  Y el indicador debe mostrar "Actualización en tiempo real activada"
  Y debe tener un punto verde parpadeante
```

---

## Escenarios de Estados de Carga y Error

### Escenario 27: Estado de carga inicial
```gherkin
Escenario: Ver indicador de carga al acceder al dashboard
  Dado que accedo al dashboard de KPIs por primera vez
  Cuando la página comienza a cargar
  Entonces debo ver un spinner de carga
  Y no debo ver los KPIs hasta que los datos estén listos
```

### Escenario 28: Manejo de error al cargar datos
```gherkin
Escenario: Ver mensaje de error cuando falla la carga de datos
  Dado que estoy intentando acceder al dashboard de KPIs
  Cuando ocurre un error al obtener datos de Appwrite
  Entonces debo ver un mensaje de error en rojo
  Y el mensaje debe indicar "Error al cargar los KPIs: [descripción del error]"
  Y no debo ver los KPIs ni gráficos
```

### Escenario 29: Gráfico sin datos disponibles
```gherkin
Escenario: Ver mensaje cuando un gráfico no tiene datos
  Dado que estoy en el dashboard de KPIs
  Y no existen datos para una categoría específica
  Cuando la página termina de cargar
  Entonces debo ver el título del gráfico
  Y debo ver el mensaje "No hay datos disponibles"
  Y no debo ver un gráfico vacío
```

---

## Escenarios de Responsive Design

### Escenario 30: Visualización en móvil
```gherkin
Escenario: Ver dashboard en dispositivo móvil
  Dado que accedo al dashboard desde un dispositivo móvil (< 768px)
  Cuando la página termina de cargar
  Entonces los KPIs deben mostrarse en una sola columna
  Y los filtros deben apilarse verticalmente
  Y los gráficos deben ajustarse al ancho de la pantalla
```

### Escenario 31: Visualización en tablet
```gherkin
Escenario: Ver dashboard en tablet
  Dado que accedo al dashboard desde una tablet (768px - 1024px)
  Cuando la página termina de cargar
  Entonces los KPIs deben mostrarse en 2 columnas
  Y los filtros deben estar en una fila
```

### Escenario 32: Visualización en desktop
```gherkin
Escenario: Ver dashboard en desktop
  Dado que acceso al dashboard desde un desktop (> 1024px)
  Cuando la página termina de cargar
  Entonces los KPIs deben mostrarse en 3-4 columnas
  Y los filtros deben estar en una fila horizontal
  Y debo aprovechar todo el ancho de la pantalla
```

---

## Escenarios de Formato de Datos

### Escenario 33: Formato de números
```gherkin
Escenario: Ver números formateados con separadores de miles
  Dado que estoy en el dashboard de KPIs
  Y un KPI tiene el valor 1500
  Entonces debo ver "1,500" con separador de miles
```

### Escenario 34: Formato de moneda
```gherkin
Escenario: Ver valores monetarios en formato dominicano
  Dado que estoy en el dashboard de KPIs
  Y el KPI "Valor Total" tiene el valor 25000
  Entonces debo ver "RD$25,000.00" o formato equivalente
```

### Escenario 35: Formato de porcentajes
```gherkin
Escenario: Ver porcentajes con un decimal
  Dado que estoy en el dashboard de KPIs
  Y el KPI "CTR" tiene el valor 3.456
  Entonces debo ver "3.5%"
```

---

## Escenarios de Comparación de Períodos

### Escenario 36: Tendencia positiva
```gherkin
Escenario: Ver indicador de tendencia positiva
  Dado que estoy en el dashboard de KPIs
  Y el valor actual de "Anuncios Activos" es 60
  Y el valor del período anterior era 50
  Entonces debo ver una flecha verde hacia arriba (↑)
  Y debo ver "+20.0%" en verde
```

### Escenario 37: Tendencia negativa
```gherkin
Escenario: Ver indicador de tendencia negativa
  Dado que estoy en el dashboard de KPIs
  Y el valor actual de "Total de Pedidos" es 40
  Y el valor del período anterior era 50
  Entonces debo ver una flecha roja hacia abajo (↓)
  Y debo ver "20.0%" en rojo (sin signo negativo)
```

### Escenario 38: Sin cambio
```gherkin
Escenario: Ver indicador cuando no hay cambio
  Dado que estoy en el dashboard de KPIs
  Y el valor actual es igual al del período anterior
  Entonces debo ver un guion gris (-)
  Y debo ver "0.0%" en gris
```

### Escenario 39: Comparación desde cero
```gherkin
Escenario: Ver comparación cuando el período anterior era cero
  Dado que estoy en el dashboard de KPIs
  Y el valor actual de un KPI es 10
  Y el valor del período anterior era 0
  Entonces debo ver una flecha verde hacia arriba (↑)
  Y debo ver "+100.0%"
```

---

## Casos de Borde

### Escenario 40: Dashboard sin datos en ninguna colección
```gherkin
Escenario: Ver dashboard cuando no hay datos en el sistema
  Dado que accedo al dashboard de KPIs
  Y no existen datos en ninguna colección
  Cuando la página termina de cargar
  Entonces todos los KPIs deben mostrar "0"
  Y los gráficos deben mostrar "No hay datos disponibles"
  Y no debe haber errores en la consola
```

### Escenario 41: Filtro con rango que no tiene datos
```gherkin
Escenario: Aplicar filtro de fecha sin datos en ese rango
  Dado que estoy en el dashboard de KPIs
  Cuando selecciono un rango de fechas futuro
  Y hago clic en "Aplicar"
  Entonces todos los KPIs deben mostrar "0"
  Y no debe haber errores
```

### Escenario 42: Residencial sin anuncios
```gherkin
Escenario: Filtrar por un residencial que no tiene anuncios
  Dado que estoy en el dashboard de KPIs
  Cuando selecciono un residencial que no tiene anuncios
  Entonces el KPI "Anuncios Activos" debe mostrar "0"
  Y otros KPIs relacionados deben mostrar "0"
  Y no debe haber errores
```

---

## Notas de Implementación

- Todos los textos están en español
- Los KPIs se calculan en el cliente usando datos de Appwrite
- La actualización en tiempo real usa Appwrite Realtime SDK
- Los gráficos usan la librería `recharts`
- El formato de moneda usa `es-DO` (República Dominicana)
- Compatible con modo claro y oscuro
- Límite de 5000 documentos por colección para evitar sobrecarga
