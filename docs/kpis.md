# KPIs del Sistema Vecivendo

Este documento define los Indicadores Clave de Rendimiento (KPIs) para dos perfiles principales: **Administradores del Sistema** y **Anunciantes de Pago**. Estos KPIs se basan en el sistema de logs y analíticas implementado en la plataforma.

---

## 📊 KPIs para Administradores del Sistema

Los administradores necesitan una visión global de la plataforma para tomar decisiones estratégicas sobre crecimiento, engagement y optimización de recursos.

### 1. **Métricas de Tráfico Global**

#### 1.1 Visitas Totales a la Plataforma
- **Descripción**: Total de visitas únicas a la plataforma en un período determinado
- **Fuente de Datos**: Colección `logs` con `type = "view"`
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Gráfico de líneas con tendencia temporal
- **Objetivo**: Identificar patrones de crecimiento y picos de tráfico

#### 1.2 Usuarios Activos
- **Descripción**: Número de sesiones únicas (`sessionId`) en un período
- **Fuente de Datos**: Colección `logs` agrupando por `sessionId`
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Gráfico de barras comparativo
- **Objetivo**: Medir el engagement de la plataforma

#### 1.3 Tasa de Retorno
- **Descripción**: Porcentaje de usuarios que regresan a la plataforma
- **Cálculo**: `(Usuarios recurrentes / Total de usuarios) × 100`
- **Fuente de Datos**: Análisis de `sessionId` y `visitorId` en `logs`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Evaluar la retención de usuarios

### 2. **Métricas de Anuncios**

#### 2.1 Total de Anuncios Activos
- **Descripción**: Cantidad de anuncios con `activo = true`
- **Fuente de Datos**: Colección `anuncios`
- **Frecuencia**: Diaria
- **Visualización**: Contador con tendencia
- **Objetivo**: Monitorear el crecimiento del inventario

#### 2.2 Anuncios Publicados por Período
- **Descripción**: Nuevos anuncios creados en un rango de fechas
- **Fuente de Datos**: Colección `anuncios` filtrando por `$createdAt`
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Gráfico de barras
- **Objetivo**: Identificar tendencias de publicación

#### 2.3 Tasa de Conversión de Anuncios
- **Descripción**: Porcentaje de anuncios que generan interacciones (clicks, carrito)
- **Cálculo**: `(Anuncios con interacciones / Total anuncios) × 100`
- **Fuente de Datos**: Colección `logs` con `type = "click"` o `type = "cart_add"`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Evaluar la calidad del contenido publicado

#### 2.4 Anuncios Más Vistos (Top 10)
- **Descripción**: Ranking de anuncios con mayor número de vistas
- **Fuente de Datos**: Colección `logs` agrupando por `anuncioId` y `type = "view"`
- **Frecuencia**: Semanal, Mensual
- **Visualización**: Tabla o lista ordenada
- **Objetivo**: Identificar contenido popular

### 3. **Métricas de Dispositivos y Plataformas**

#### 3.1 Distribución por Tipo de Dispositivo
- **Descripción**: Porcentaje de tráfico desde móvil vs. escritorio
- **Fuente de Datos**: Colección `logs` agrupando por `deviceType`
- **Frecuencia**: Semanal, Mensual
- **Visualización**: Gráfico de pastel o barras de progreso
- **Objetivo**: Optimizar la experiencia según el dispositivo predominante

#### 3.2 Distribución por Sistema Operativo
- **Descripción**: Porcentaje de tráfico por OS (iOS, Android, Windows, macOS, etc.)
- **Fuente de Datos**: Colección `logs` agrupando por `os`
- **Frecuencia**: Mensual
- **Visualización**: Gráfico de barras horizontales
- **Objetivo**: Priorizar compatibilidad y testing

#### 3.3 Distribución por Navegador
- **Descripción**: Porcentaje de tráfico por navegador (Chrome, Safari, Firefox, etc.)
- **Fuente de Datos**: Colección `logs` agrupando por `browser`
- **Frecuencia**: Mensual
- **Visualización**: Gráfico de barras horizontales
- **Objetivo**: Detectar problemas de compatibilidad

### 4. **Métricas de Residenciales**

#### 4.1 Residenciales Activos
- **Descripción**: Cantidad de residenciales con `activo = true`
- **Fuente de Datos**: Colección `residenciales`
- **Frecuencia**: Diaria
- **Objetivo**: Monitorear la expansión geográfica

#### 4.2 Anuncios por Residencial
- **Descripción**: Promedio y distribución de anuncios por residencial
- **Fuente de Datos**: Colección `anuncios` agrupando por `residencial`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de barras o tabla
- **Objetivo**: Identificar residenciales con mayor actividad

#### 4.3 Tráfico por Residencial
- **Descripción**: Visitas totales por residencial
- **Fuente de Datos**: Colección `logs` cruzando con `anuncios.residencial`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Evaluar el engagement por comunidad

### 5. **Métricas de Publicidad Pagada**

#### 5.1 Anuncios de Pago Activos
- **Descripción**: Cantidad de anuncios pagados con `activo = true`
- **Fuente de Datos**: Colección `anuncios_pago`
- **Frecuencia**: Diaria
- **Objetivo**: Monitorear campañas activas

#### 5.2 Impresiones de Anuncios Pagados
- **Descripción**: Total de vistas de banners publicitarios
- **Fuente de Datos**: Colección `logs` con `type = "view"` para `anuncioPagoId`
- **Frecuencia**: Diaria
- **Objetivo**: Medir el alcance de la publicidad

#### 5.3 CTR (Click-Through Rate) de Anuncios Pagados
- **Descripción**: Porcentaje de clicks sobre impresiones
- **Cálculo**: `(Clicks / Impresiones) × 100`
- **Fuente de Datos**: Colección `logs` con `type = "click"` vs `type = "view"`
- **Frecuencia**: Diaria, Semanal
- **Objetivo**: Evaluar la efectividad de los anuncios pagados

### 6. **Métricas de Rendimiento del Sistema**

#### 6.1 Tiempo de Carga Promedio
- **Descripción**: Tiempo promedio de carga de páginas clave
- **Fuente de Datos**: Métricas de performance del navegador (si se implementa)
- **Frecuencia**: Diaria
- **Objetivo**: Optimizar la experiencia del usuario

#### 6.2 Tasa de Errores
- **Descripción**: Porcentaje de eventos que fallaron al registrarse
- **Fuente de Datos**: Logs de errores del sistema
- **Frecuencia**: Diaria
- **Objetivo**: Identificar problemas técnicos

---

## 💰 KPIs para Anunciantes de Pago

Los anunciantes de pago necesitan métricas específicas para evaluar el retorno de inversión (ROI) de sus campañas publicitarias en la plataforma.

### 1. **Métricas de Alcance**

#### 1.1 Impresiones Totales
- **Descripción**: Número total de veces que el anuncio fue mostrado
- **Fuente de Datos**: Colección `logs` con `type = "view"` y `anuncioPagoId` específico
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Gráfico de líneas con tendencia temporal
- **Objetivo**: Medir el alcance de la campaña
- **Meta Sugerida**: Depende del presupuesto y duración de la campaña

#### 1.2 Alcance Único
- **Descripción**: Número de usuarios únicos que vieron el anuncio
- **Fuente de Datos**: Colección `logs` agrupando por `sessionId` o `visitorId`
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Contador con comparativa de períodos
- **Objetivo**: Evaluar la penetración de la campaña
- **Meta Sugerida**: Maximizar el alcance único vs. impresiones repetidas

#### 1.3 Frecuencia de Exposición
- **Descripción**: Promedio de veces que un usuario único ve el anuncio
- **Cálculo**: `Impresiones Totales / Alcance Único`
- **Frecuencia**: Semanal
- **Objetivo**: Balancear la repetición sin saturar al usuario
- **Meta Sugerida**: 3-5 veces por usuario

### 2. **Métricas de Interacción**

#### 2.1 Clicks Totales
- **Descripción**: Número total de clicks en el anuncio
- **Fuente de Datos**: Colección `logs` con `type = "click"` y `anuncioPagoId` específico
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Gráfico de barras
- **Objetivo**: Medir el interés generado
- **Meta Sugerida**: Depende del CTR objetivo

#### 2.2 CTR (Click-Through Rate)
- **Descripción**: Porcentaje de clicks sobre impresiones
- **Cálculo**: `(Clicks / Impresiones) × 100`
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Indicador de porcentaje con tendencia
- **Objetivo**: Evaluar la efectividad del diseño y mensaje
- **Meta Sugerida**: 
  - Excelente: > 5%
  - Bueno: 2-5%
  - Regular: 1-2%
  - Bajo: < 1%

#### 2.3 Tasa de Engagement
- **Descripción**: Porcentaje de usuarios que interactuaron con el anuncio
- **Cálculo**: `(Usuarios que hicieron click / Alcance Único) × 100`
- **Frecuencia**: Semanal
- **Objetivo**: Medir la calidad de la audiencia alcanzada

### 3. **Métricas de Conversión**

#### 3.1 Conversiones Totales
- **Descripción**: Número de acciones deseadas completadas (ej: agregar al carrito, contacto)
- **Fuente de Datos**: Colección `logs` con `type = "cart_add"` o eventos personalizados
- **Frecuencia**: Diaria, Semanal, Mensual
- **Visualización**: Contador con tendencia
- **Objetivo**: Medir el impacto directo en ventas/leads

#### 3.2 Tasa de Conversión
- **Descripción**: Porcentaje de clicks que resultaron en conversión
- **Cálculo**: `(Conversiones / Clicks) × 100`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Evaluar la calidad del tráfico generado
- **Meta Sugerida**: 
  - Excelente: > 10%
  - Bueno: 5-10%
  - Regular: 2-5%
  - Bajo: < 2%

#### 3.3 Costo por Click (CPC)
- **Descripción**: Costo promedio por cada click recibido
- **Cálculo**: `Inversión Total / Clicks Totales`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Optimizar el presupuesto
- **Meta Sugerida**: Minimizar el CPC manteniendo calidad

#### 3.4 Costo por Conversión (CPA)
- **Descripción**: Costo promedio por cada conversión lograda
- **Cálculo**: `Inversión Total / Conversiones Totales`
- **Frecuencia**: Semanal, Mensual
- **Objetivo**: Evaluar el ROI de la campaña
- **Meta Sugerida**: Debe ser menor al valor de vida del cliente (LTV)

#### 3.5 ROI (Retorno de Inversión)
- **Descripción**: Retorno económico de la campaña
- **Cálculo**: `((Ingresos Generados - Inversión) / Inversión) × 100`
- **Frecuencia**: Mensual, Al finalizar campaña
- **Objetivo**: Justificar la inversión publicitaria
- **Meta Sugerida**: > 200% (por cada $1 invertido, generar $3)

### 4. **Métricas de Audiencia**

#### 4.1 Distribución por Residencial
- **Descripción**: Porcentaje de impresiones por residencial
- **Fuente de Datos**: Colección `logs` cruzando con `anuncios_pago.residenciales`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de barras o mapa de calor
- **Objetivo**: Identificar residenciales con mejor respuesta

#### 4.2 Distribución por Dispositivo
- **Descripción**: Porcentaje de impresiones y clicks por tipo de dispositivo
- **Fuente de Datos**: Colección `logs` agrupando por `deviceType`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de pastel
- **Objetivo**: Optimizar el diseño del anuncio según dispositivo

#### 4.3 Distribución por Sistema Operativo
- **Descripción**: Porcentaje de impresiones por OS
- **Fuente de Datos**: Colección `logs` agrupando por `os`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de barras
- **Objetivo**: Adaptar el contenido a la plataforma predominante

#### 4.4 Distribución por Navegador
- **Descripción**: Porcentaje de impresiones por navegador
- **Fuente de Datos**: Colección `logs` agrupando por `browser`
- **Frecuencia**: Semanal
- **Objetivo**: Detectar problemas de visualización

### 5. **Métricas Temporales**

#### 5.1 Rendimiento por Día de la Semana
- **Descripción**: Impresiones y clicks por día de la semana
- **Fuente de Datos**: Colección `logs` agrupando por día de `timestamp`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de líneas o barras
- **Objetivo**: Identificar los días con mejor rendimiento

#### 5.2 Rendimiento por Hora del Día
- **Descripción**: Impresiones y clicks por hora
- **Fuente de Datos**: Colección `logs` agrupando por hora de `timestamp`
- **Frecuencia**: Semanal
- **Visualización**: Gráfico de calor (heatmap)
- **Objetivo**: Optimizar horarios de mayor actividad

#### 5.3 Tendencia de Rendimiento
- **Descripción**: Evolución de métricas clave a lo largo de la campaña
- **Fuente de Datos**: Colección `logs` con series temporales
- **Frecuencia**: Diaria
- **Visualización**: Gráfico de líneas múltiples
- **Objetivo**: Detectar patrones y ajustar estrategia

### 6. **Métricas de Calidad**

#### 6.1 Tasa de Rebote
- **Descripción**: Porcentaje de usuarios que hicieron click pero salieron inmediatamente
- **Fuente de Datos**: Análisis de sesiones después del click
- **Frecuencia**: Semanal
- **Objetivo**: Evaluar la relevancia del anuncio
- **Meta Sugerida**: < 40%

#### 6.2 Tiempo de Permanencia Post-Click
- **Descripción**: Tiempo promedio que un usuario pasa en la página de destino
- **Fuente de Datos**: Análisis de sesiones (si se implementa)
- **Frecuencia**: Semanal
- **Objetivo**: Medir el interés real generado
- **Meta Sugerida**: > 2 minutos

#### 6.3 Páginas Vistas Post-Click
- **Descripción**: Promedio de páginas vistas después de hacer click en el anuncio
- **Fuente de Datos**: Análisis de sesiones
- **Frecuencia**: Semanal
- **Objetivo**: Evaluar el engagement post-click
- **Meta Sugerida**: > 3 páginas

---

## 📈 Dashboard Recomendado para Administradores

### Vista Principal
1. **Resumen Ejecutivo** (Cards superiores)
   - Total de visitas (hoy, esta semana, este mes)
   - Usuarios activos (hoy, esta semana, este mes)
   - Anuncios activos
   - Anuncios de pago activos

2. **Gráficos de Tendencia**
   - Visitas en los últimos 30 días (línea)
   - Anuncios publicados por semana (barras)
   - Distribución de dispositivos (pastel)

3. **Tablas de Datos**
   - Top 10 anuncios más vistos
   - Residenciales con mayor actividad
   - Anuncios de pago con mejor CTR

### Vista de Analíticas Avanzadas
- Filtros por fecha, residencial, tipo de dispositivo
- Comparativas entre períodos
- Exportación de datos en CSV/Excel

---

## 📊 Dashboard Recomendado para Anunciantes de Pago

### Vista Principal
1. **Resumen de Campaña** (Cards superiores)
   - Impresiones totales
   - Clicks totales
   - CTR actual
   - Conversiones totales
   - ROI estimado

2. **Gráficos de Rendimiento**
   - Impresiones y clicks en los últimos 30 días (línea dual)
   - CTR por día (línea)
   - Distribución por residencial (barras)
   - Distribución por dispositivo (pastel)

3. **Métricas de Conversión**
   - Tasa de conversión
   - Costo por click (CPC)
   - Costo por conversión (CPA)
   - Retorno de inversión (ROI)

### Vista de Audiencia
- Distribución demográfica (si está disponible)
- Distribución por dispositivo, OS, navegador
- Mapa de calor de actividad por hora/día

### Vista de Optimización
- Recomendaciones basadas en datos
- Comparativa con benchmarks de la industria
- Alertas de bajo rendimiento

---

## 🎯 Metas y Benchmarks Sugeridos

### Para Administradores
| Métrica | Meta Mensual | Benchmark |
|---------|--------------|-----------|
| Crecimiento de usuarios activos | +10% | Industria: 5-15% |
| Tasa de retención | > 40% | Industria: 30-50% |
| Anuncios nuevos publicados | +15% | Depende del tamaño |
| Tiempo de carga promedio | < 3 segundos | Estándar web: < 3s |

### Para Anunciantes de Pago
| Métrica | Meta | Benchmark |
|---------|------|-----------|
| CTR | > 3% | Display ads: 0.5-2% |
| Tasa de conversión | > 5% | E-commerce: 2-5% |
| ROI | > 200% | Publicidad digital: 150-300% |
| Tasa de rebote | < 40% | Estándar web: 40-60% |

---

## 🔄 Frecuencia de Revisión Recomendada

### Administradores
- **Diaria**: Visitas, usuarios activos, errores del sistema
- **Semanal**: Anuncios publicados, top anuncios, tráfico por residencial
- **Mensual**: Tendencias generales, ROI de publicidad, planificación estratégica

### Anunciantes de Pago
- **Diaria**: Impresiones, clicks, CTR, conversiones
- **Semanal**: Análisis de audiencia, optimización de horarios
- **Mensual**: ROI, evaluación de campaña, planificación futura

---

## 📝 Notas de Implementación

### Consideraciones Técnicas
1. **Rate Limiting**: Las vistas tienen un límite de 60 minutos para evitar conteos inflados
2. **Eventos sin límite**: Los clicks y agregados al carrito se registran siempre
3. **Privacidad**: Los datos deben ser anónimos y cumplir con regulaciones de privacidad
4. **Performance**: Los queries deben estar optimizados con índices apropiados

### Queries Recomendados
```javascript
// Ejemplo: Obtener impresiones de un anuncio de pago
const impresiones = await databases.listDocuments(
    dbId,
    "logs",
    [
        Query.equal("anuncioPagoId", anuncioId),
        Query.equal("type", "view"),
        Query.greaterThanEqual("timestamp", fechaInicio),
        Query.lessThanEqual("timestamp", fechaFin)
    ]
);

// Ejemplo: Calcular CTR
const clicks = await databases.listDocuments(
    dbId,
    "logs",
    [
        Query.equal("anuncioPagoId", anuncioId),
        Query.equal("type", "click"),
        Query.greaterThanEqual("timestamp", fechaInicio),
        Query.lessThanEqual("timestamp", fechaFin)
    ]
);

const ctr = (clicks.total / impresiones.total) * 100;
```

### Índices Necesarios
- `idx_anuncio_time`: (anuncioId, timestamp)
- `idx_type`: (type)
- `idx_session_time`: (sessionId, timestamp)
- `idx_anuncio_pago_time`: (anuncioPagoId, timestamp) - si se implementa

---

## 🚀 Próximos Pasos

1. **Implementar dashboards**: Crear interfaces visuales para ambos perfiles
2. **Automatizar reportes**: Enviar reportes semanales/mensuales por email
3. **Alertas inteligentes**: Notificar cuando las métricas caen por debajo de umbrales
4. **Exportación de datos**: Permitir descarga de reportes en CSV/PDF
5. **Integración con herramientas**: Conectar con Google Analytics, Meta Pixel, etc.
6. **Machine Learning**: Predecir tendencias y recomendar optimizaciones
