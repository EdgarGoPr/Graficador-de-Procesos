const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const userStories = [
  {
    id: 'PST-001',
    modulo: 'Arquitectura & Persistencia',
    titulo: 'Arquitectura Portable USB Zero-AppData y Persistencia JSON',
    historiaUsuario: 'Como usuario de ProcesStudio, quiero que la aplicación funcione en modo portable desde cualquier pendrive o carpeta sin requerir instalación ni escribir en %APPDATA% ni en el Registro de Windows, para poder transportar y ejecutar mis proyectos de procesos en cualquier equipo corporativo de forma segura y autónoma.',
    criteriosAceptacion: '1. Los datos de sesión y caché de Electron se redirigen a MiAppProcesos_USB/data/.\n2. Todos los proyectos se guardan y leen como archivos .json en MiAppProcesos_USB/Proyectos/.\n3. Los nombres de archivo se sanitizan automáticamente en formato AAAA-MM-DD_proc-<titulo>-v<version>.json.\n4. No se deja ningún residuo en el registro de Windows ni en carpetas del usuario del sistema.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-002',
    modulo: 'Dashboard & Gestión',
    titulo: 'Panel Dashboard de Gestión de Proyectos y Carga Dinámica',
    historiaUsuario: 'Como analista de procesos, quiero un panel principal que liste todos los proyectos disponibles en la unidad USB con sus métricas clave (Lead Time, riesgos, checkpoints y fecha), para poder abrir, duplicar, crear o eliminar proyectos de forma intuitiva.',
    criteriosAceptacion: '1. Vista en cuadrícula responsiva con tarjetas de proyecto.\n2. Cálculo en tiempo real de Lead Time total (horas y días hábiles), cantidad de riesgos operativos y checkpoints QC.\n3. Botón para crear nuevo proyecto con modal guiado (título, responsable, unidad operativa).\n4. Acciones directas de duplicar, descargar JSON y eliminar proyecto.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-003',
    modulo: 'Lienzo BPMN 2.0',
    titulo: 'Pizarra de Modelado BPMN 2.0 y Tarjetas de Actividad Inteligentes',
    historiaUsuario: 'Como modelador de procesos, quiero un lienzo infinito interactivo con soporte de estándares BPMN 2.0 e ISO 19510 (eventos, tareas de usuario, servicios TI, tareas manuales y compuertas), para diagramar flujos de trabajo operativos con rigor normativo.',
    criteriosAceptacion: '1. Paleta lateral con arrastrar y soltar (Drag & Drop) de nodos BPMN al lienzo.\n2. Tarjetas con tipografía moderna, insignias de ID estándar (INI, TSK, GTW, QC), rol y sistema TI.\n3. Conexiones interactivas (Sequence Flow) con puntos de anclaje (handles) magnéticos.\n4. Panel lateral de propiedades para editar metadatos, SLAs, marco legal, entradas y salidas.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-004',
    modulo: 'Lienzo BPMN 2.0',
    titulo: 'Carriles Funcionales (Swimlanes) con Redimensionamiento y Colores',
    historiaUsuario: 'Como diseñador organizacional, quiero definir carriles funcionales (swimlanes) como tarjetas nativas que delimiten responsabilidades por área o rol, para estructurar visualmente qué departamento ejecuta cada fase del proceso.',
    criteriosAceptacion: '1. Carriles creados como nodos nativos en capa de fondo (Z-Index negativo).\n2. Botones integrados para mover carriles arriba/abajo trasladando automáticamente las tarjetas contenidas.\n3. Redimensionamiento horizontal y vertical intuitivo.\n4. Paleta de colores temáticos personalizables por carril.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-005',
    modulo: 'Lienzo BPMN 2.0',
    titulo: 'Motor de Atracción Magnética y Guías Inteligentes de Alineación',
    historiaUsuario: 'Como usuario que busca diagramas prolijos, quiero que el lienzo cuente con atracción magnética y guías visuales en tiempo real durante el arrastre, para alinear y apilar tarjetas y carriles con precisión geométrica sin esfuerzo manual.',
    criteriosAceptacion: '1. Guías visuales inteligentes (líneas de alineación vertical y horizontal) que aparecen dinámicamente al coincidir bordes o centros.\n2. Snapping magnético real que ajusta las coordenadas (X, Y) al aproximarse a una distancia umbral (16px).\n3. Acoplamiento magnético carril con carril con contacto exacto de 0px de separación.\n4. Botón de 1-clic para auto-alinear y organizar todos los carriles verticalmente.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-006',
    modulo: 'Subprocesos & Jerarquías',
    titulo: 'Compresión y Descompresión Jerárquica de Subprocesos',
    historiaUsuario: 'Como arquitecto de procesos complejos, quiero seleccionar un conjunto de actividades y comprimirlas en un Subproceso Procedimental (y descomprimirlas cuando lo requiera), para abstraer la complejidad y mantener diagramas limpios y modulares.',
    criteriosAceptacion: '1. Validación topológica estricta que exige un único punto de entrada y salida para permitir la compresión.\n2. Empaquetado de nodos y aristas internas dentro de la estructura de datos del subproceso.\n3. Modal de doble clic para visualizar y editar el contenido interno del subproceso.\n4. Acción de descompresión (Unpack) que restaura los nodos originales en el lienzo principal.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-007',
    modulo: 'Edición & Productividad',
    titulo: 'Copiar, Pegar y Duplicación Rápida con Portapapeles Inteligente',
    historiaUsuario: 'Como usuario frecuente, quiero copiar y pegar selecciones múltiples de tarjetas y conexiones mediante atajos de teclado (Ctrl+C / Ctrl+V), para acelerar la construcción de patrones de procesos repetitivos.',
    criteriosAceptacion: '1. Atajo Ctrl+C copia las tarjetas seleccionadas y sus conexiones internas al portapapeles en memoria.\n2. Atajo Ctrl+V pega los elementos con IDs únicos nuevos y un desplazamiento visual (+40px, +40px).\n3. Notificación flotante (toast) confirmando la cantidad de elementos copiados y pegados.\n4. Atajo Delete / Backspace para eliminar elementos seleccionados.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-008',
    modulo: 'Lienzo BPMN 2.0',
    titulo: 'Bloqueo y Fijación de Posición de Tarjetas y Pizarra (Modo Candado)',
    historiaUsuario: 'Como usuario que revisa o presenta diagramas, quiero fijar y bloquear tarjetas individuales o la pizarra completa, para evitar que se muevan elementos por arrastres accidentales con el ratón.',
    criteriosAceptacion: '1. Botón de candado en la barra flotante de selección y atajo Ctrl+L para fijar elementos seleccionados.\n2. Las tarjetas bloqueadas impiden el arrastre individual (draggable = false) mostrando icono de candado.\n3. Botón de bloqueo global en barra superior para navegar y hacer zoom sin alterar posiciones.\n4. Las posiciones (X, Y) se guardan con precisión exacta en el JSON y persisten al reabrir la app.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-009',
    modulo: 'Calidad ISO 9001',
    titulo: 'Generación Automática de Matriz SIPOC de Alta Dirección',
    historiaUsuario: 'Como auditor o responsable de calidad, quiero una vista dedicada que genere automáticamente la Matriz SIPOC (Proveedores, Entradas, Proceso, Salidas, Clientes) a partir del flujo modelado, para cumplir con el análisis de contexto de ISO 9001:2015.',
    criteriosAceptacion: '1. Pestaña independiente "Matriz SIPOC" en la navegación principal.\n2. Tabla de 5 columnas (Suppliers, Inputs, Process Steps, Outputs, Customers) derivada de los metadatos de las tarjetas.\n3. Identificación automática de roles precedentes como proveedores y roles sucesores como clientes.\n4. Resumen cuantitativo de entradas, salidas y actores involucrados.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-010',
    modulo: 'Calidad ISO 9001',
    titulo: 'Calculadora de Tiempos de Ciclo (Lead Time) y Plazos Legales',
    historiaUsuario: 'Como gestor administrativo, quiero que el sistema calcule automáticamente el tiempo total de ciclo en horas y días hábiles y controle los plazos perentorios de prescripción legal, para asegurar el cumplimiento de SLAs y normativas.',
    criteriosAceptacion: '1. Motor de cálculo topológico que suma tiempos de actividades en serie y ramas paralelas.\n2. Conversión automática entre horas administrativas, días hábiles y días corridos (ISO 8601).\n3. Detección de plazos fatales/perentorios con alertas visuales destacadas.\n4. Resumen ejecutivo de tiempos visible en el Dashboard y en los reportes técnicos.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-011',
    modulo: 'Calidad ISO 9001',
    titulo: 'Matriz de Riesgos Operativos y Controles Mitigantes (Cláusula 6.1)',
    historiaUsuario: 'Como oficial de cumplimiento, quiero registrar riesgos operativos asociados a cada actividad con su nivel de impacto, probabilidad y control mitigante obligatorio, para satisfacer los requisitos de gestión de riesgos de ISO 9001.',
    criteriosAceptacion: '1. Formulario en el panel de propiedades para agregar múltiples riesgos por tarea.\n2. Asignación de ID de riesgo (ej. RSK-01), probabilidad (Baja/Media/Alta) e impacto.\n3. Definición de control mitigante y sistema informático responsable.\n4. Tabla consolidada de matriz de riesgos en la ficha técnica del proceso.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-012',
    modulo: 'Calidad ISO 9001',
    titulo: 'Matriz de Decisiones y Lógica de Bifurcación (Gateways)',
    historiaUsuario: 'Como analista funcional, quiero documentar formalmente las condiciones de bifurcación de cada compuerta exclusiva y paralela, para que las reglas de negocio queden explícitas en el manual de procedimientos.',
    criteriosAceptacion: '1. Extracción automática de todas las compuertas (Gateways) del diagrama.\n2. Identificación del rol evaluador y desglose de cada opción de resolución con su texto de condición y nodo destino.\n3. Texto de condición visible sobre las flechas en el lienzo y en el flujograma.\n4. Matriz formal de decisiones tabulada en la ficha técnica.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-013',
    modulo: 'Documentación & Reportes',
    titulo: 'Documento Estructurado del Proceso y Manual Jerárquico',
    historiaUsuario: 'Como responsable de calidad, quiero una vista que presente el proceso completo como un documento formal estructurado de texto en orden jerárquico (Macroproceso -> Carriles/Roles -> Actividades detalladas), para disponer de un manual de procedimientos completo.',
    criteriosAceptacion: '1. Encabezado formal con control de documentos ISO 9001 (código, versión, fecha, objetivo y marco legal).\n2. Desglose jerárquico por carril donde cada actividad muestra ID estándar, tipo BPMN, título, descripción operativa completa, rol, sistema TI, inputs, outputs, QC y riesgos.\n3. Historial de revisiones y bloques de firmas técnicas de modelado y aprobación.\n4. Vista con diseño tipográfico formal para lectura clara.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-014',
    modulo: 'Documentación & Reportes',
    titulo: 'Impresión en PDF del Documento Técnico con Estilos Formales',
    historiaUsuario: 'Como usuario administrativo, quiero imprimir o guardar en PDF el manual estructurado de texto con saltos de página limpios y formato A4 vertical, para distribuirlo o archivarlo formalmente en la organización.',
    criteriosAceptacion: '1. Botón "Imprimir Documento en PDF" en la barra de acciones superior.\n2. Estilos CSS @media print optimizados para A4 portrait con márgenes de 1.2cm.\n3. Reglas de page-break-inside: avoid que evitan que las fichas de tareas o tablas se corten a la mitad.\n4. Encabezados de tabla repetidos automáticamente al cambiar de página.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-015',
    modulo: 'Documentación & Reportes',
    titulo: 'Impresión Gráfica del Diagrama BPMN en Formato Apaisado (Landscape)',
    historiaUsuario: 'Como modelador, quiero poder imprimir el diagrama BPMN 2.0 tal cual está diseñado en la pizarra en una hoja apaisada horizontal, para presentar el mapa gráfico a directivos en alta resolución.',
    criteriosAceptacion: '1. Selector interno en la pestaña Documento & Diagrama para alternar a "Diagrama del Proceso (Mapa Gráfico)".\n2. Renderizado interactivo con controles de zoom y ajuste de vista.\n3. Botón "Imprimir Diagrama (PDF Apaisado)" configurado con @page { size: landscape }.\n4. Ocultamiento automático de barras de herramientas y controles al imprimir.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-016',
    modulo: 'Flujograma Descendente',
    titulo: 'Pestaña Independiente de Flujograma con Auto-Layout Top-to-Bottom',
    historiaUsuario: 'Como usuario que requiere una lectura lineal simple del proceso, quiero una pestaña independiente con un flujograma descendente estructurado 100% de forma automática, para comprender la secuencia sin lidiar con la distribución manual del lienzo.',
    criteriosAceptacion: '1. Nueva pestaña "Flujograma" en la barra de navegación principal.\n2. Algoritmo determinista DAG que posiciona los eventos de inicio arriba (Y=0) y distribuye los nodos hacia abajo en capas sucesivas.\n3. Cero superposiciones: ningún nodo queda sobre otro ni se tocan entre sí.\n4. Conexiones limpias de salida inferior (bottom) a entrada superior (top).',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-017',
    modulo: 'Flujograma Descendente',
    titulo: 'Nodos Simplificados de Flujograma (Solo Título) y Conexiones sin Cruces',
    historiaUsuario: 'Como lector operativo, quiero que las tarjetas del flujograma muestren únicamente el título y el ID estándar, y que las flechas no pasen por arriba ni por abajo de los nodos, para una lectura visual limpia y despejada.',
    criteriosAceptacion: '1. Tarjetas compactas (260px x 70px) con tipografía destacada mostrando solo el Título del ítem e ID estándar.\n2. Icono semántico y geometría BPMN (óvalos redondeados para eventos, rectángulos para tareas y cajas doradas para decisiones).\n3. Enrutamiento smoothstep ortogonal que evita cruces sobre los cuerpos de las tarjetas.\n4. Enlaces de bucle / retroceso con trazado lateral punteado diferenciado en color ámbar.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-018',
    modulo: 'Flujograma Descendente',
    titulo: 'Impresión en PDF Multipágina del Flujograma Descendente',
    historiaUsuario: 'Como usuario que necesita entregar el flujograma impreso, quiero imprimirlo en PDF extendido en múltiples páginas A4 continuas si el proceso es largo, para no perder legibilidad.',
    criteriosAceptacion: '1. Botón "Imprimir en PDF (Multipágina)" en la barra superior del flujograma.\n2. Encabezado formal visible únicamente en la impresión con título del proceso, código, versión y fecha.\n3. Estilos CSS adaptados para dividir el flujo vertical a lo largo de varias páginas A4 sin cortar elementos.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-019',
    modulo: 'Interfaz & Personalización',
    titulo: 'Sistema de Temas Personalizables (Modo Oscuro, Claro y Paleta Antigravity)',
    historiaUsuario: 'Como usuario, quiero alternar entre Modo Oscuro y Modo Claro con un solo clic, y personalizar colores de fondo de pizarra y acentos, para trabajar cómodamente en diferentes condiciones de iluminación.',
    criteriosAceptacion: '1. Botón de alternancia rápida Sol/Luna en la barra superior.\n2. Modal de personalización de temas con presets (Antigravity Dark, Slate Blue, Minimal Light, Cyberpunk Neon).\n3. Selector de color de fondo del lienzo con guardado en almacenamiento local.\n4. MiniMap y guías que adaptan sus colores dinámicamente según el tema seleccionado.',
    fechaImplementacion: '2026-09-01',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-020',
    modulo: 'Packaging & Seguridad Windows',
    titulo: 'Lanzador Nativo Portable (.exe) con Manifiesto y Firma Digital Authenticode',
    historiaUsuario: 'Como usuario de Windows 10/11, quiero un ejecutable nativo (.exe) firmado digitalmente que inicie la aplicación directamente sin requerir scripts .bat ni generar advertencias bloqueantes de SmartScreen o Smart App Control, para una experiencia de usuario fluida y profesional.',
    criteriosAceptacion: '1. Ejecutable ProcesStudio.exe compilado en C# con metadatos completos (producto, versión 1.0, compañía).\n2. Manifiesto incrustado asInvoker compatible con Windows 10 y 11.\n3. Certificado digital Authenticode aplicado al binario reconocido en las propiedades del archivo.\n4. Eliminación de todos los archivos .bat para operar exclusivamente con el ejecutable nativo en MiAppProcesos_USB/.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-021',
    modulo: 'DevOps & Metodología',
    titulo: 'Cadena de Compilación Automática y Auto-Push Git tras cada Cambio',
    historiaUsuario: 'Como equipo de desarrollo, quiero que cada cambio aprobado active automáticamente la sincronización de archivos (sync-dist), la generación del backlog Excel y el push al repositorio remoto en GitHub, para mantener la máxima trazabilidad y sincronización en la nube.',
    criteriosAceptacion: '1. Script sync-dist.cjs clona automáticamente los bundles compilados a MiAppProcesos_USB/App/dist/.\n2. Script generate-user-stories.cjs mantiene actualizado el archivo HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx.\n3. Directiva permanente de Plan de Ruta previo obligatorio ante cualquier solicitud.\n4. Auto-Push automático a origin/main inmediatamente tras verificar cada funcionalidad aprobada.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-022',
    modulo: 'Packaging & Compatibilidad macOS',
    titulo: 'Lanzador Nativo Portable para macOS (ProcesStudio.app)',
    historiaUsuario: 'Como usuario del sistema operativo Apple macOS (Macbook / iMac), quiero disponer de un paquete de aplicación nativo ProcesStudio.app ejecutable con doble clic y totalmente funcional, para abrir mis proyectos de procesos JSON en macOS con la misma facilidad que en Windows.',
    criteriosAceptacion: '1. Creación del bundle oficial ProcesStudio.app con estructura estándar Contents/Info.plist y Contents/MacOS/ProcesStudio.\n2. Ejecutable nativo compatible con procesadores Intel y Apple Silicon (M1/M2/M3/M4).\n3. Resolución automática de la carpeta ../Proyectos/ para persistencia local de archivos .json.\n4. Soporte complementario del script ProcesStudio_Mac.command para ejecución por terminal.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-023',
    modulo: 'Flujograma & Impresión',
    titulo: 'Renderizador de Impresión Multipágina Vectorial para Flujograma en PDF',
    historiaUsuario: 'Como usuario administrativo, quiero que al imprimir el diagrama de flujo en PDF la salida esté perfectamente centrada, oculte la interfaz de la aplicación y se extienda a lo largo de tantas páginas A4 como sea necesario con saltos limpios sin cortar tarjetas, para obtener un documento impreso profesional y completo.',
    criteriosAceptacion: '1. Ocultamiento total de la barra de navegación Header durante la impresión mediante clase print:hidden.\n2. Motor de renderizado vectorial FlowchartPrintDocument con estructura descendente nivel por nivel.\n3. Centrado automático horizontal de cada nivel en la hoja A4 con flechas SVG continuas y etiquetas de condición.\n4. Soporte nativo de paginación vertical con reglas page-break-inside: avoid en cada bloque.\n5. Selector de Vista Paginada para previsualizar el PDF en pantalla antes de imprimir.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-024',
    modulo: 'Edición & Productividad',
    titulo: 'Sistema de Historial Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y) Paso a Paso',
    historiaUsuario: 'Como usuario y modelador de procesos, quiero poder deshacer y rehacer con Ctrl+Z y Ctrl+Y (o mediante botones en la barra superior) cada uno de los movimientos y modificaciones realizadas en la sesión paso a paso, para rectificar errores o experimentar con el diagrama con total libertad y seguridad.',
    criteriosAceptacion: '1. Registro inmutable de instantáneas previas (snapshots) en una pila de historial con límite de hasta 50 estados.\n2. Captura única de estado al iniciar arrastre de tarjetas (onNodeDragStart) evitando saturación de memoria.\n3. Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y / Ctrl+Shift+Z) paso a paso en movimientos, adición/eliminación de nodos, conexiones, cambios de estilo y carriles.\n4. Botones visuales Deshacer y Rehacer en la barra superior (Header) con estados activos/deshabilitados e información contextual.\n5. Aislamiento de eventos de teclado en inputs y textareas para preservar el deshacer nativo de texto.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-025',
    modulo: 'Flujograma & Impresión',
    titulo: 'Paginación Vertical y Saltos de Hoja Irrestrictos en PDF de Flujograma',
    historiaUsuario: 'Como usuario y auditor de calidad, quiero que al imprimir el Flujograma en PDF la salida se expanda de forma natural y automática a lo largo de tantas páginas A4 como demande la extensión del diagrama, para que ningún nivel o actividad sea truncado a una sola hoja por restricciones de altura o desborde del lienzo.',
    criteriosAceptacion: '1. Reseteo global de altura, posicionamiento y overflow en @media print para todos los ancestros SPA (html, body, #root, .h-screen, main, .overflow-*).\n2. Estructuración en bloques naturales independientes (.flowchart-level-block) con break-inside: avoid y page-break-inside: avoid.\n3. Contenedor de impresión dedicado (.flowchart-print-container) con ancho al 100% y visualización limpia sin solapamientos.\n4. Soporte de exportación a PDF multipágina probado y verificado tanto en navegadores como en Electron portable.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-026',
    modulo: 'Calidad ISO 9001 & Auditoría BPMN',
    titulo: 'Auditor de Calidad y Linter Topológico BPMN 2.0 / ISO 9001 con Score de Salud',
    historiaUsuario: 'Como auditor de calidad y oficial de cumplimiento, quiero una herramienta de diagnóstico en 1-clic que escanee todo el diagrama BPMN 2.0 y evalúe la completitud normativa (eventos iniciales/finales, compuertas sin salida, actividades sin rol o SLA, ciclos infinitos y controles de riesgo), asignando un puntaje de salud del 0 al 100% y permitiendo saltar directamente a la tarjeta infractora, para garantizar procesos 100% conformes y sin errores estructurales.',
    criteriosAceptacion: '1. Motor linter determinista offline que analiza nodos, conexiones, SLAs, riesgos y roles sin requerir internet.\n2. Cálculo de puntuación de salud (Health Score 0-100%) con clasificación visual (Excelente, Bueno, Regular, Crítico).\n3. Clasificación de hallazgos por severidad (Crítico / Error, Advertencia, Sugerencia).\n4. Botón "Localizar" en cada hallazgo que centra y resalta automáticamente la tarjeta en el lienzo.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-027',
    modulo: 'Lienzo & Colaboración',
    titulo: 'Notas Adhesivas (Sticky Notes / Post-its) en el Lienzo',
    historiaUsuario: 'Como analista o facilitador de talleres de procesos, quiero agregar notas adhesivas flotantes (post-its) de colores con texto libre en cualquier área de la pizarra, para registrar comentarios de reuniones, dudas operativas o recordatorios de diseño sin alterar la lógica formal del flujo BPMN.',
    criteriosAceptacion: '1. Nuevo elemento interactivo "Nota Adhesiva" arrastrable desde la paleta lateral.\n2. Edición de texto inline instantánea al hacer foco o doble clic en la nota.\n3. Selector dinámico de colores de fondo estilo post-it (amarillo, azul, verde, rosa, púrpura, naranja).\n4. Exclusión transparente del flujo de secuencia BPMN formal pero guardado persistente en el archivo JSON del proyecto.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-028',
    modulo: 'Gobernanza Organizacional',
    titulo: 'Matriz RACI Interactiva y Exportación a Excel (.xlsx)',
    historiaUsuario: 'Como gerente o líder de transformación, quiero una pestaña con la Matriz RACI (Responsable, Aprobador, Consultado, Informado) calculada automáticamente cruzando actividades y roles, con edición de celdas en tiempo real y exportación directa a Excel (.xlsx), para clarificar el gobierno de responsabilidades del proceso.',
    criteriosAceptacion: '1. Pestaña independiente "Matriz RACI" en la barra de navegación principal.\n2. Cálculo matricial automático cruzando cada actividad con los roles operativos del proceso.\n3. Interactividad para alternar asignaciones (R, A, C, I o vacío) con clic en celda.\n4. Exportación directa a hoja de cálculo Excel (.xlsx) 100% offline con formato corporativo y leyendas claras.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-029',
    modulo: 'Interoperabilidad & Exportación',
    titulo: 'Centro Unificado de Exportación Multiformato (PNG 300 DPI, SVG, BPMN 2.0 XML, Word .doc)',
    historiaUsuario: 'Como profesional de procesos, quiero un centro de exportación centralizado que me permita descargar mi proyecto en imágenes de alta resolución (PNG 300 DPI / SVG vectorial), archivo estándar XML BPMN 2.0 (ISO 19510) y manual operativo en Microsoft Word (.doc), para compartir mi trabajo con cualquier herramienta corporativa sin depender de conexión a internet.',
    criteriosAceptacion: '1. Modal unificado "Centro de Exportación" accesible desde el menú superior.\n2. Exportación a imagen PNG HD y SVG vectorial escalable sin pérdida de nitidez.\n3. Generación de archivo BPMN 2.0 XML estándar (ISO 19510) compatible con Camunda, Signavio y Bizagi.\n4. Generación y descarga de Manual de Procedimientos en formato Microsoft Word (.doc) con tablas e índice formal.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-030',
    modulo: 'Simulación & Optimización',
    titulo: 'Simulador de Procesos con Detección de Cuellos de Botella y Mapa de Calor (Heatmap)',
    historiaUsuario: 'Como ingeniero de optimización o Black Belt Lean, quiero ejecutar simulaciones de eventos discretos con diferentes volúmenes de casos y turnos de trabajo para identificar cuellos de botella y colorear un mapa de calor dinámico sobre el lienzo, para saber dónde se concentran las colas de espera y tiempos muertos.',
    criteriosAceptacion: '1. Simulador de eventos discretos con parámetros configurables (número de casos, horas diarias, capacidad de recursos).\n2. Detección automática de la actividad que representa el cuello de botella crítico y cálculo de costos y tiempos de espera.\n3. Botón "Aplicar Mapa de Calor en el Lienzo" que tiñe los nodos de verde (rápido) a rojo intenso (saturado/crítico).\n4. Botón de 1-clic para restaurar los colores originales del proyecto.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-031',
    modulo: 'Control de Versiones & Auditoría',
    titulo: 'Comparador Visual de Versiones JSON (Visual Diff Tool)',
    historiaUsuario: 'Como auditor o líder de proyecto, quiero comparar el proyecto actual con cualquier versión previa o archivo JSON externo para ver un resumen de actividades agregadas, modificadas o eliminadas y diferencias campo por campo, para auditar cambios antes de publicar una nueva versión.',
    criteriosAceptacion: '1. Modal de comparación con selector de archivo JSON de versión previa o base.\n2. Análisis comparativo instantáneo mostrando métricas de elementos añadidos, eliminados y modificados.\n3. Tabla detallada con etiquetas de colores (verde para agregados, rojo para eliminados, ámbar para modificados).\n4. Inspección expandible campo por campo destacando valor anterior vs. valor actual.',
    fechaImplementacion: '2026-09-11',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-032',
    modulo: 'Diseño & Exportación de Diagramas',
    titulo: 'Sistema de Hojas de Impresión Multi-Página (Recuadros Punteados A4/Carta/A3) y Exportación PDF',
    historiaUsuario: 'Como analista o líder de procesos, quiero configurar recuadros punteados en el lienzo que delimiten hojas de impresión en formatos estándar (A4, Carta, A3 en horizontal/vertical) pudiendo moverlos y ajustarlos a gusto, para generar un documento PDF de alta calidad que contenga todas las hojas configuradas con nomenclatura estandarizada sin hojas en blanco.',
    criteriosAceptacion: '1. Recuadros punteados interactivos en el lienzo con identificación de hoja (Hoja 1, Hoja 2, etc.), arrastre para reposicionar y tiradores en esquinas para redimensionar.\n2. Selector de formatos de hoja (A4, Carta, A3) y orientaciones (Horizontal / Vertical).\n3. Botones de acción rápida: "+ Agregar Hoja", "Auto-Encuadrar" y "Ocultar Hojas".\n4. Generación nativa en cliente de PDF multi-página mediante jsPDF sin hojas en blanco ni distorsiones.\n5. Nomenclatura automática de archivo PDF con referencia al proyecto: AAAA-MM-DD_proc-<codigo>_<titulo>_diagrama.pdf.\n6. Integración en el Centro de Exportación y en el visor de Diagrama del Proceso.',
    fechaImplementacion: '2026-09-17',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-033',
    modulo: 'Lienzo BPMN & Enrutamiento',
    titulo: 'Enrutamiento Inteligente con Evasión Automática de Obstáculos en Conexiones BPMN',
    historiaUsuario: 'Como modelador y documentador de procesos, quiero que las líneas de conexión (Sequence Flow) esquiven automáticamente cualquier tarjeta o nodo intermedio sin pasar nunca por encima ni por debajo de ellos, adaptándose en tiempo real durante el arrastre y diseño del lienzo, para mantener flujos visualmente impecables, legibles y 100% profesionales.',
    criteriosAceptacion: '1. Motor de enrutamiento ortogonal A* integrado que detecta cajas delimitadoras de tarjetas con margen de seguridad de 22px.\n2. Evasión reactiva y suave en tiempo real al arrastrar, crear o desplazar nodos y compuertas.\n3. Esquinas con redondeo ergonómico (fillets de 10px) y trayectorias sin cruces invasivos sobre elementos.\n4. Soporte unificado en lienzo interactivo y vista de impresión/exportación multi-página a PDF.\n5. Exclusión inteligente de contenedores de carril (PoolLanes) para permitir que los flujos transiten libremente por el fondo de los carriles.',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-034',
    modulo: 'Presentación & Navegación',
    titulo: 'Modo Presentación Dinámica e Interactiva tipo Prezi con Zoom Animado y Panel de Contenido Ordenado',
    historiaUsuario: 'Como expositor, auditor o analista de procesos, quiero una sección de presentación inmersiva que recorra el diagrama paso a paso con animaciones de cámara cinemáticas (zoom dinámico centrado en cada tarjeta) y un panel lateral derecho estructurado con todo el contenido del paso (responsable, SLA, sistemas TI, entradas/salidas, riesgos y normativa), para exponer y capacitar sobre los flujos de trabajo de forma clara, ordenada y profesional.',
    criteriosAceptacion: '1. Extractor de secuencia topológica automática que ordena las actividades desde el Evento de Inicio hasta el Fin respetando bifurcaciones y carriles.\n2. Animación fluida de cámara (ReactFlow setCenter con zoom 1.35) y resplandor focal (spotlight) sobre la tarjeta activa con atenuación del entorno.\n3. Panel lateral derecho estructurado con código estándar, rol, título, descripción, métricas de tiempo/SLA, sistemas TI, entradas (inputs), entregables (outputs), marco legal/ISO 9001, riesgos operativos y enlaces de navegación del flujo.\n4. Barra de reproducción flotante con controles de Inicio, Anterior, Siguiente, selector de diapositivas y modo Auto-Play con temporizador configurable.\n5. Control completo por teclado (←, →, Espacio para pausar/reanudar, Home, End, F para pantalla completa, Esc para salir y F5/Shift+P para abrir desde el lienzo).',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  }
];

function generateExcel() {
  console.log('📊 Generando archivo Excel de Historias de Usuario...');

  // Create worksheet data
  const headers = [
    'ID',
    'Módulo / Componente',
    'Título del Desarrollo',
    'Historia de Usuario (User Story)',
    'Criterios de Aceptación (Acceptance Criteria)',
    'Fecha de Implementación',
    'Estado'
  ];

  const rows = userStories.map(story => [
    story.id,
    story.modulo,
    story.titulo,
    story.historiaUsuario,
    story.criteriosAceptacion,
    story.fechaImplementacion,
    story.estado
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column widths
  worksheet['!cols'] = [
    { wch: 12 },  // ID
    { wch: 26 },  // Módulo
    { wch: 38 },  // Título
    { wch: 65 },  // Historia de Usuario
    { wch: 75 },  // Criterios de Aceptación
    { wch: 22 },  // Fecha
    { wch: 24 }   // Estado
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historias de Usuario');

  // Paths
  const rootPath = path.resolve(__dirname, '../HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx');
  const usbPath = path.resolve(__dirname, '../MiAppProcesos_USB/HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx');

  // Write files
  XLSX.writeFile(workbook, rootPath);
  console.log(`✓ Archivo generado en raíz: ${rootPath}`);

  if (fs.existsSync(path.dirname(usbPath))) {
    XLSX.writeFile(workbook, usbPath);
    console.log(`✓ Archivo sincronizado en USB: ${usbPath}`);
  }

  console.log(`✅ Total de Historias de Usuario registradas: ${userStories.length}`);
}

generateExcel();
