# Brief de diseño para Figma — Krypton

## Propósito del producto

Diseñar un dashboard SPA responsivo para que un equipo de ingeniería cloud pueda vigilar el estado de servidores, revisar tendencias de consumo y configurar servicios sin perder contexto. La interfaz corresponde a una **demostración académica**: las métricas, alertas y acciones son datos simulados, no telemetría ni operaciones reales.

## Persona principal

**Leonardo Perez — administrador Cloud / DevOps**

- **Perfil:** usuaria técnica que administra servicios desplegados en varios proveedores cloud.
- **Metas:** detectar degradaciones rápido, comparar CPU y memoria, encontrar una instancia y resolver alertas con seguridad.
- **Frustraciones:** paneles saturados de datos, estados difíciles de distinguir y reinicios que pueden ejecutarse por error.
- **Escenario de uso:** desde escritorio revisa la disponibilidad diaria; desde el móvil recibe una alerta, localiza una instancia y confirma o cancela una acción.

## Estructura del dashboard

### Zona 1 — navegación

- Sidebar persistente en escritorio, plegable a iconos y presentada como panel desplegable en móvil/tableta.
- Marca y espacio de trabajo en la parte superior; enlaces a **Resumen**, **Servidores**, **Métricas** y **Actividad**.
- El elemento seleccionado tiene un acento verde bosque. El breadcrumb «Inicio / [sección]» indica dónde se encuentra la persona.
- Perfil y ayuda al pie del sidebar.
- Header superior persistente con botón de menú, breadcrumb, búsqueda de instancias, acceso a alertas, selector de tema y botón principal para configurar un servicio.

### Zona 2 — contenido dinámico

- **Resumen:** saludo contextual y selector de entorno; cuatro indicadores (instancias, CPU, memoria y disponibilidad); gráfica de CPU/memoria; tráfico de red; alertas recientes y vista rápida de servidores.
- **Servidores:** tabla de instancias con estado, CPU, memoria, región, última actualización y acciones. Incluye búsqueda, filtro de estado, paginación y estado sin resultados.
- **Métricas:** uso de recursos, gráfica amplia y recomendación basada en un umbral de CPU.
- **Actividad y alertas:** línea de tiempo de eventos recientes, severidad y estado de resolución.
- Las rutas cambian dentro de la SPA; conservar el header y el sidebar al navegar.

### Zona 3 — interacción y acciones críticas

- **Drawer de configuración:** nombre del servicio, región, fecha de mantenimiento, notas y switch de escalado automático. Acciones para cancelar o guardar.
- **Diálogo de confirmación:** antes de reiniciar una instancia, indicar cuál se verá afectada y explicar la interrupción. La acción principal es destructiva; cancelar debe ser igual de visible.
- Mostrar un toast de resultado y el estado temporal de carga luego de guardar o reiniciar.

## Wireframes de baja fidelidad

### Escritorio — marco sugerido: 1440 × 1000

```text
┌───────────────────┬─────────────────────────────────────────────────────────────┐
│ Marca / espacio   │ Header: breadcrumb | búsqueda | alertas | tema | configurar │
│ Sidebar           ├─────────────────────────────────────────────────────────────┤
│ Resumen (activo)  │ Título de página                    Entorno                 │
│ Servidores        │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ Métricas          │ │Instancias│ │ CPU      │ │ Memoria  │ │Uptime    │        │
│ Actividad         │ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                   │ ┌────────────────────────┐ ┌──────────┐ ┌───────────────┐ │
│ Ayuda / perfil    │ │Gráfica CPU + memoria  24h│ │Red      │ │Alertas        │ │
│                   │ └────────────────────────┘ └──────────┘ └───────────────┘ │
│                   │ ┌─────────────────────────────────────────────────────────┐ │
│                   │ │ Servidores recientes                                      │ │
│                   │ └─────────────────────────────────────────────────────────┘ │
└───────────────────┴─────────────────────────────────────────────────────────────┘
```

### Móvil — marco sugerido: 390 × 844

```text
┌───────────────────────────────────┐
│ ☰  Inicio / Resumen   alertas  tema│
│ Resumen de infraestructura         │
│ Estado general de servicios        │
│ ┌─────────────────────────────────┐│
│ │ Instancias activas              ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ Uso de CPU                      ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ Memoria                         ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ Disponibilidad                  ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ Gráfica de recursos             ││
│ └─────────────────────────────────┘│
│ Alertas                            │
│ Servidores recientes               │
└───────────────────────────────────┘
```

En tableta (por ejemplo, 768 px), reorganizar el Bento Grid a dos columnas y abrir la navegación como panel lateral cuando se necesite. En móvil, mantener tarjetas y controles en una sola columna; la tabla de servidores se desplaza horizontalmente sin ensanchar el viewport.

## Sistema visual y tokens

- **Estilo:** SaaS técnico, sobrio y escaneable. La jerarquía se obtiene con tipografía, espacio y estados; reservar el color intenso para acciones, navegación y alertas.
- **Paleta clara:** fondo `#f5f7fb`, superficie `#ffffff`, texto `#172338`, texto secundario `#748198`, bordes `#e6eaf1` y verde bosque `#176b61` para navegación activa, acciones y gráficos. Verde, ámbar y rojo mantienen estados correctos, avisos y alertas claramente diferenciados.
- **Modo oscuro:** fondo gris carbón neutro `#171a18`, superficies `#222622` y `#292e2a`, texto claro `#edf1ed` y acento verde menta `#77c4ad`. Responder a la preferencia del sistema; permitir alternancia manual desde el header.
- **Tipografía:** Segoe UI o sans serif de sistema. Títulos compactos y métricas grandes; etiquetas de ejes y ayudas pequeñas, pero legibles.
- **Contenedores:** paneles blancos/oscuros con borde fino, radio de 9 px y sombra discreta; espaciado común entre 13 y 16 px.
- **Gráficas e iconos:** líneas y SVG sencillos, iconos monocromáticos consistentes. Acompañar el color de un estado con texto o símbolo.
- **Toque:** objetivos de al menos 44 × 44 px en móvil. Mostrar foco de teclado de forma inequívoca.
- **Movimiento:** hover, apertura de drawer/modal y confirmación entre 200 y 350 ms; respetar `prefers-reduced-motion`.

## Componentes y estados para prototipar

- Navegación: default, hover, activo, colapsado, abierto en móvil.
- Botones: default, hover, focus visible, disabled y loading con spinner.
- Búsqueda, selectores, fecha y textarea: vacío, completado, focus, disabled y validación.
- Switch: desactivado, activado, focus y disabled.
- Tabla: estados en línea, aviso, sin conexión y reiniciando; paginación deshabilitada al inicio/final; búsqueda sin coincidencias.
- Feedback: toast de éxito/error, drawer abierto/cerrado, modal de confirmación, modal cancelado y reinicio en progreso.
- Tema: preferencia del sistema, claro manual y oscuro manual.

## Flujo sugerido para el prototipo clickable

1. **Resumen → Servidores:** seleccionar “Ver todos”, escribir un nombre, filtrar por estado y avanzar/volver de página.
2. **Configurar:** abrir el drawer desde el header o desde una instancia; editar un campo; guardar y observar el estado de carga y el toast. También probar cancelar y `Escape`.
3. **Acción crítica:** seleccionar “Reiniciar” en una fila, comprobar que el diálogo identifica la instancia, cancelar; volver a abrir y confirmar para mostrar carga y resultado.
4. **Preferencias:** plegar el sidebar en escritorio, abrir/cerrar la navegación en móvil y alternar el tema claro/oscuro.

## Checklist de las cinco dimensiones IxD

| Dimensión | Decisión de diseño |
|---|---|
| **1D · Palabras** | Etiquetas directas; microcopia explica la interrupción antes de reiniciar y describe estados sin depender de abreviaturas. |
| **2D · Representaciones visuales** | Bento Grid para métricas, gráficos con leyenda, iconografía consistente, breadcrumb y colores funcionales acompañados por texto. |
| **3D · Objetos físicos** | Controles táctiles claros, foco visible, áreas de acción amplias y desplazamiento horizontal de la tabla en móvil. |
| **4D · Tiempo** | Feedback de carga y toast; transiciones cortas para drawer, diálogo, botones y hover; compatibilidad con movimiento reducido. |
| **5D · Comportamiento** | Búsqueda, filtros y paginación coherentes; configuración editable; confirmación previa a la acción crítica; cancelación y tecla Escape para salir de paneles. |

## Relación con la implementación

La página se implementa en HTML semántico, CSS nativo (Grid para la cuadrícula Bento y Flexbox para barras y controles) y JavaScript sin frameworks. Las reglas parten de móvil y progresan en `min-width`: dos columnas desde 620 px y navegación persistente con cuatro columnas desde 900 px; hay ajustes de cabecera para anchos de 520 px o menos. Los gráficos, estados y acciones son demostrativos y no se conectan a servicios cloud reales.
