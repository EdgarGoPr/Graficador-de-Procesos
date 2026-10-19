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
  },
  {
    id: 'PST-035',
    modulo: 'Navegación & Experiencia de Usuario',
    titulo: 'Reestructuración y Compactación de Barra Superior con Menús Desplegables Profesionales',
    historiaUsuario: 'Como usuario de ProcesStudio en pantallas estándar o portátiles, quiero una barra superior limpia y compacta organizada en menús desplegables jerárquicos (Vistas & Matrices, Herramientas) y botones de utilidad en iconos con tooltip, para acceder a todas las 18 funcionalidades del sistema con 1 solo clic sin desborde horizontal ni necesidad de múltiples monitores.',
    criteriosAceptacion: '1. Pestañas de acceso directo para "Proyectos" y "Lienzo BPMN".\n2. Menú desplegable flotante "Vistas & Matrices" que agrupa Flujograma, Matriz SIPOC, Matriz RACI y Documento & Reporte.\n3. Menú desplegable flotante "Herramientas" que agrupa Presentación Prezi (F5), Auditor de Calidad, Simulador de Flujos, Comparador de Versiones y Navegador de Subprocesos.\n4. Grupo de utilidades compactas en formato icono con tooltip (Deshacer, Rehacer, Ver Carpeta, Temas y Modo Claro/Oscuro).\n5. Acciones principales destacadas (Exportar, Nuevo y Guardar con indicador animado de cambios pendientes).\n6. Reducción de más del 65% del ancho total de la barra con cierre automático al hacer clic afuera (click outside listener).',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-036',
    modulo: 'UI / UX & Presentación',
    titulo: 'Iconos Compactos en Encabezado, Separación de Propiedades (Contenido vs Estilo) y Visibilidad de Elementos en Presentación',
    historiaUsuario: 'Como modelador de procesos, quiero botones de acción icon-only en la barra superior, un panel lateral derecho organizado con pestañas dedicadas para Contenido/Datos y Estilo/Apariencia, y una visualización destacada y en primer plano de todos los elementos durante el modo presentación tipo Prezi, para tener una experiencia de diseño ágil, limpia y sin interferencias visuales.',
    criteriosAceptacion: '1. Los botones de Exportar, Nuevo y Guardar en la cabecera superior muestran exclusivamente sus iconos representativos con tooltips contextuales y estados de guardado/animación.\n2. El panel lateral de propiedades de nodos separa limpiamente la edición de información BPMN (ID, Título, Descripción, Rol, SLA, SIPOC, Riesgos) y personalización visual (Paletas de color, opacidad, bordes, encabezados, tipografía, orientación y bloqueo de dimensiones) mediante pestañas "Contenido & Datos" y "Estilo & Apariencia".\n3. Corrección de la jerarquía de capas (z-index y ordenamiento de nodos de fondo a primer plano: Swimlane -> Subproceso -> Tareas -> Compuertas -> Eventos) en el modo presentación tipo Prezi para garantizar que todas las tarjetas de proceso sean visibles con nitidez y resplandor activo sobre los carriles.',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-037',
    modulo: 'Sincronización & Versionado Multi-Equipo',
    titulo: 'Sistema de Versionado Inmutable Multi-Equipo (Casa/Trabajo), Agrupación de Macroprocesos y Detección Automática de Última Versión',
    historiaUsuario: 'Como usuario que modela procesos alternando entre la PC de su casa y la del trabajo mediante sincronización con Git, quiero que la aplicación guarde las nuevas versiones o revisiones como archivos inmutables independientes y agrupe automáticamente los procesos en el Gestor permitiéndome abrir con un solo clic la versión más reciente disponible, para erradicar por completo los conflictos de merge en Git y trabajar de forma transparente y segura entre múltiples dispositivos.',
    criteriosAceptacion: '1. Creación del servicio processVersionManager para cálculo de semver, normalización de claves canónicas y agrupación inteligente de archivos JSON en ProcessGroupSummary.\n2. La tarjeta de proyecto en el Dashboard agrupa todas las versiones de un mismo proceso, destacando un badge "vX.X (Última versión)", botón primario "Abrir Última Versión" y acordeón desplegable con el historial completo de archivos y revisiones.\n3. Incorporación del modal NewRevisionModal en el encabezado para guardar nuevas versiones inmutables con incremento semántico (Menor, Parche, Mayor), etiqueta de dispositivo (PC Casa, PC Trabajo, Personalizado) y descripción de cambios para trazabilidad ISO 9001.\n4. Integración del banner NewerVersionBanner en el lienzo BPMN que detecta si el archivo cargado tiene una versión más nueva sincronizada en disco y ofrece actualizarla al instante con un clic.',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-038',
    modulo: 'UI / UX & Presentación',
    titulo: 'Personalización de Color de Fondo, Trasparencia y Trama de Cuadrícula en Modo Presentación (Prezi)',
    historiaUsuario: 'Como presentador o expositor de procesos ante autoridades, quiero personalizar el color de fondo del lienzo en modo presentación (eligiendo entre presets como Negro Profundo OLED, Grafito Slate, Blanco Puro, Gris Papel, o un color HEX personalizado) y alternar el tipo de cuadrícula (puntos, líneas, cruces o liso), para adaptar la estética visual a proyectores, salas de reuniones o pantallas OLED con máxima legibilidad.',
    criteriosAceptacion: '1. Incorporación de menú desplegable con botón de paleta en la cabecera del Modo Presentación con 6 presets optimizados (OLED, Slate, Midnight, Blanco Puro, Gris Papel, Crema Cálido) y selector nativo de color HEX.\n2. Selector de trama de fondo dinámico que permite alternar entre variantes Dots, Lines, Cross y None (liso).\n3. Cálculo automático de contraste para el color de los puntos/líneas de la cuadrícula según la luminancia del fondo.\n4. Persistencia automática de la configuración de fondo en localStorage para conservar las preferencias del expositor en sesiones futuras.',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-039',
    modulo: 'Presentación & Navegación',
    titulo: 'Orden Secuencial Manual y Tiempos Individuales por Paso en Modo Presentación',
    historiaUsuario: 'Como expositor y facilitador de procesos, quiero poder definir un número de orden secuencial manual en las actividades (manteniendo el orden topológico automático por defecto) y fijar una duración específica en segundos para cada paso durante el modo Auto-Play, para adaptar el ritmo y la narrativa de la presentación a pasos complejos o introductorios sin quedar limitado a un único temporizador global.',
    criteriosAceptacion: '1. Propiedades de nodo presentationOrder (número de orden secuencial) y presentationDurationSeconds (duración en segundos) en BpmnNodeData.\n2. Extractor de secuencia topológica que prioriza los números de orden manuales cuando están definidos y utiliza el orden de flujo y geometría por defecto cuando no lo están.\n3. Panel de Propiedades del Nodo en la pestaña "Contenido & Datos" con sección dedicada "Modo Presentación (Secuencia & Tiempo)".\n4. Panel lateral del Modo Presentación con control directo en vivo para ajustar el número de orden y tiempo de permanencia del paso activo.\n5. Temporizador dinámico de Auto-Play que sincroniza automáticamente el tiempo restante con la duración individual de cada tarjeta o el tiempo base global seleccionado.\n6. Línea de tiempo con scrubber dots diferenciados para pasos con duración individual e indicador de tiempo restante vs tiempo total del paso.',
    fechaImplementacion: '2026-09-22',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-040',
    modulo: 'Gestión de Versiones y Repositorio / Proyectos',
    titulo: 'Exclusión de Archivos de Proyectos Locales de Git (.gitignore)',
    historiaUsuario: 'Como usuario y desarrollador de ProcesStudio, quiero que Git ignore y desindexe los archivos JSON de proyectos de procesos en la carpeta de proyectos, para evitar que el trabajo y modificaciones locales de proyectos generen cambios o conflictos innecesarios en el control de versiones del código fuente.',
    criteriosAceptacion: '1. Configuración de directivas en .gitignore para ignorar archivos en MiAppProcesos_USB/Proyectos/* y Proyectos/*.\n2. Conservación del directorio en el repositorio mediante el marcador .gitkeep.\n3. Desindexación en Git de los archivos JSON de proyectos previamente rastreados sin borrarlos del disco local (git rm --cached).\n4. Verificación de que crear o editar proyectos JSON no genere avisos en git status.\n5. Preservación física intacta de los archivos existentes en la máquina local.',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-041',
    modulo: 'Lienzo BPMN & Minimapa / UI',
    titulo: 'Navegación Interactiva por Clic en Minimapa, Representación Geométrica BPMN Fiel y Ajuste de Etiqueta Marco',
    historiaUsuario: 'Como modelador de procesos, quiero navegar por el lienzo haciendo clic o arrastrando directamente en el minimapa, ver la silueta geométrica real de cada elemento (círculos para eventos, rombos para compuertas y rectángulos para tareas) e identificar el marco legal como "Marco" en las propiedades de la tarjeta, para tener una orientación espacial precisa y una interfaz limpia.',
    criteriosAceptacion: '1. Clic en cualquier área del minimapa desplaza y centra suavemente la vista del lienzo hacia esas coordenadas (setCenter con animación).\n2. Clic directo sobre un nodo en el minimapa centra la vista en dicho nodo y lo selecciona automáticamente abriendo su panel de propiedades.\n3. Soporte para arrastre (pannable) y zoom con la rueda del ratón (zoomable) directo en el minimapa.\n4. Eventos de inicio, fin, checkpoint de calidad y temporizador se representan con silueta circular concéntrica en el minimapa.\n5. Compuertas exclusivas y paralelas se representan fielmente como rombos/diamantes.\n6. Nodos seleccionados muestran contorno activo y resplandor de alta visibilidad.\n7. La etiqueta "Marco Legal" en el panel lateral de propiedades se actualiza a "Marco".',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-042',
    modulo: 'Lienzo BPMN & Subprocesos Multinivel',
    titulo: 'Inserción en Centro de Pantalla, Subprocesos Multinivel Recursivos (N Niveles) y Estandarización Gráfica BPMN',
    historiaUsuario: 'Como modelador y arquitecto de procesos, quiero que los nuevos elementos añadidos desde la paleta aparezcan en el centro del viewport visible actual, poder ingresar recursivamente a cualquier subproceso para ver y editar su diagrama interno con su distribución original (permitiendo anidar subprocesos hasta N niveles de profundidad con navegación adelante/atrás fluida), y que todas las figuras sigan rigurosamente las normas estándar de diagramación de procesos BPMN 2.0 / ISO 5807 (marcador [+] de subproceso colapsado, eventos circulares y compuertas en rombo), para diseñar arquitecturas de procesos jerárquicas complejas con máxima ergonomía y rigor normativo.',
    criteriosAceptacion: '1. Los nuevos elementos creados desde la barra lateral se ubican dinámicamente en el centro exacto de la pantalla/viewport actual del usuario considerando el nivel de zoom y desplazamiento (pan) mediante screenToFlowPosition.\n2. Ingreso a subprocesos con doble clic sobre la tarjeta, mediante el botón estándar BPMN [+] en la base o mediante la acción explícita "Ingresar" en el pie de la tarjeta.\n3. Soporte multinivel recursivo para anidar subprocesos dentro de otros subprocesos hasta N niveles de profundidad sin restricciones de arquitectura.\n4. Al ingresar a un subproceso comprimido previamente, se restauran las tarjetas en su distribución y coordenadas relativas espaciales originales.\n5. Barra de navegación jerárquica (Breadcrumbs) superior fija en el lienzo que muestra la ruta completa de niveles (Inicio > Subproceso A > Subproceso B...), botón de retorno rápido al nivel anterior y salto directo a cualquier nivel intermedio.\n6. Plena capacidad de edición en cualquier nivel interno del subproceso: agregar actividades, conectar flechas, editar propiedades, crear nuevos subprocesos internos y eliminar elementos.\n7. Cumplimiento de estándares de modelado BPMN 2.0: marcador oficial [+] en base de subprocesos colapsados, eventos de inicio en círculo simple, eventos de fin en círculo grueso y compuertas en rombo.',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-043',
    modulo: 'Subprocesos & Jerarquías Recursivas',
    titulo: 'Aislamiento Contextual de Creación, Compresión y Edición en Subprocesos Anidados (N Niveles)',
    historiaUsuario: 'Como modelador de procesos, quiero que al crear, comprimir, descomprimir o editar subprocesos y elementos estando dentro de un subproceso, los cambios se apliquen estricta y exclusivamente en el lienzo del subproceso activo actual en vez de volcarse sobre el proceso principal raíz, para garantizar la consistencia jerárquica de diagramas anidados complejos.',
    criteriosAceptacion: '1. La acción de comprimir actividades seleccionadas en un subproceso (compressSelection) opera sobre el grafo del nivel activo (getActiveGraph) reemplazando los nodos únicamente dentro del subproceso actual mediante updateGraphForPath.\n2. La descompresión de subprocesos (decompressSubProcess) despliega las actividades directamente en el nivel donde se encuentra ubicado el nodo.\n3. La creación de nuevos subprocesos (addNode) pre-inicializa de inmediato su estructura interna subProcessCanvas y subProcessSteps con flujo estándar inicial persistido.\n4. El panel lateral de propiedades (PropertiesPanel) lee y edita los nodos y conectores del grafo activo sin importar el nivel de profundidad del subproceso.\n5. La barra de herramientas de selección (SelectionToolbar), las acciones de copiar/pegar y el modal de compresión respetan el contexto del subproceso activo.',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-044',
    modulo: 'Carriles Organizativos & Swimlanes',
    titulo: 'Personalización Integral y Gestión Dinámica de Carriles Organizativos (Swimlanes)',
    historiaUsuario: 'Como modelador y analista de procesos, quiero personalizar libremente las opciones de carriles organizativos (swimlanes), pudiendo crear nuevos carriles, editar nombres de áreas, roles responsables, sistemas TI y colores tanto desde el panel de propiedades como desde un modal centralizado de gestión, para reflejar fielmente la estructura departamental y organizativa de la institución.',
    criteriosAceptacion: '1. El selector de Carril Organizativo (Swimlane) en el panel de propiedades incluye acciones rápidas para crear nuevo carril (+ Nuevo), editar el carril activo (Editar) y acceder a la administración global (⚙ Gestionar).\n2. El menú desplegable incorpora las opciones interactivas "+ Crear nuevo carril..." y "⚙ Gestionar y reordenar carriles...".\n3. Editor rápido en línea en el panel de propiedades para modificar nombre de área, rol/puesto responsable, sistema informático y color de carril con actualización en tiempo real.\n4. Formulario en línea para crear y asignar un nuevo carril directamente a la actividad seleccionada en un solo paso.\n5. Modal integral de gestión (ManageLanesModal) con listado completo de carriles, reordenamiento vertical (subir/bajar), edición detallada, alta de nuevos carriles con selector de paleta y eliminación segura con reasignación automática de actividades.\n6. Sincronización bidireccional automática: los cambios de carriles impactan en cascada en todas las tarjetas de actividad vinculadas, en los carriles de fondo del lienzo y en las matrices SIPOC y RACI.',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-045',
    modulo: 'Generalización de Interfaz, Herramientas, Responsable y Carriles desde Cero',
    titulo: 'Transición a Herramientas, Nuevo Campo Responsable, Conservación de Marco, Plazos Activables, Carriles por Título y Experiencia Generalizada',
    historiaUsuario: 'Como usuario y modelador de procesos, quiero una experiencia generalizada libre de menciones forzadas a normas ISO o prescripciones legales, donde las tarjetas nuevas tengan campos limpios con texto de guía sutil en gris ("detrás" del cursor sin tener que borrar ejemplos previos), los proyectos comiencen con 0 carriles para crearlos únicamente por título desde cero con memoria por proceso, los plazos sean opcionales y activables con interruptor, y el concepto "Sistema TI" se denomine "Herramienta", conservando el campo "Marco" para normas o procedimientos aplicables.',
    criteriosAceptacion: '1. Sustitución transversal del término y concepto "Sistema TI" por "Herramienta" (con icono de herramienta Wrench) en paneles de propiedades, tarjetas del lienzo, paleta lateral y modales.\n2. Incorporación del nuevo campo "Responsable" en el modelo de datos, tarjeta del lienzo (con icono User) y panel de propiedades.\n3. Preservación del campo "Marco" (data.legalFramework) para encuadre normativo, procedimental o de instructivos con marcador de posición genérico.\n4. Proyectos nuevos inician con 0 carriles organizativos (lanes: []) con memoria y persistencia por proyecto en formato JSON.\n5. Creación de carriles en un solo paso solicitando únicamente el Título del carril (con paleta de color opcional) en PropertiesPanel, ManageLanesModal y SwimlaneBackground.\n6. Plazo de ejecución activable/desactivable mediante casilla interactiva con etiquetas generalizadas ("Plazo de Ejecución", "Plazo Estricto / Crítico") ocultando insignias SLA cuando está inactivo.\n7. Eliminación de todas las referencias normativas rígidas (ISO 9001, ISO 8601, ISO 19510, prescripción legal) en textos visibles de la interfaz.\n8. Textos predeterminados limpios en tarjetas y formularios: campos inicializados en vacío con texto en gris (placeholder) sin ejemplos ("ej:") permitiendo escribir inmediatamente sin necesidad de borrar.',
    fechaImplementacion: '2026-10-14',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-046',
    modulo: 'Lienzo BPMN 2.0 & Jerarquías de Proceso',
    titulo: 'Campo Link en Tarjetas, Nomenclatura Jerárquica Pxx-Nxx y Barra Permanente de Procesos Anidados',
    historiaUsuario: 'Como usuario y analista de procesos, quiero que las tarjetas posean un campo Link con botón directo para abrir enlaces web o documentación externa en el navegador, que las Service Tasks se diferencien de las User Tasks (SRV vs TSK), que todas las tarjetas utilicen una nomenclatura jerárquica con código de proceso y nivel (P01-N00-..., P02-N01-...), y que la barra superior de navegación entre procesos anidados permanezca disponible en todo momento con siglas compactas (P01N00, P02N01) que se expanden al seleccionarlas mostrando título y nivel.',
    criteriosAceptacion: '1. Nuevo campo Link en el modelo BpmnNodeData, editable en PropertiesPanel con icono, campo URL y botón de prueba rápida.\n2. Pequeño botón interactivo con icono ExternalLink en la cabecera de las tarjetas (TaskNode y SubProcessNode) que abre la URL en el navegador externo predeterminado sin seleccionar ni mover la tarjeta.\n3. Nomenclatura específica y diferenciada para tareas de servicio (SRV) frente a tareas de usuario (TSK).\n4. Nomenclaturas estructuradas por código de proceso y nivel de anidamiento: P01-N00-TSK-01 para el proceso padre, y numeración secuencial única para cada nuevo subproceso (P02-N01-TSK-01, P02-N01-SRV-01, etc.).\n5. Pre-inicialización de flujos estándar de nuevos subprocesos con la nomenclatura jerárquica correspondiente a su código y nivel.\n6. Barra de navegación superior fija y permanente en el lienzo que nunca desaparece al estar en el proceso padre.\n7. Los procesos no seleccionados se muestran con sus siglas compactas (P01N00, P02N01, P03N01...) y navegan directamente al hacer clic.\n8. El proceso seleccionado actualmente se expande mostrando su icono distintivo (Home/Layers), sigla, título y nivel (Nivel 0, Nivel 1...).\n9. Botón Volver para subir un nivel cuando se encuentra dentro de un subproceso anidado.',
    fechaImplementacion: '2026-10-15',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-047',
    modulo: 'Lienzo BPMN 2.0 & Enrutamiento de Conexiones',
    titulo: 'Punto de Control Interactivo de Contracurva en Conexiones con Snapping Magnético',
    historiaUsuario: 'Como modelador y diagramador de procesos, quiero un punto de control interactivo en el centro de las líneas de conexión que me permita manipular el lugar exacto donde realiza la contracurva (quiebre o transición vertical) tanto en el eje X como arquearla en el eje Y, para poder alinear visualmente múltiples caídas verticales que convergen en una misma tarjeta y esquivar obstáculos o tarjetas intermedias con curvas Bézier armónicas.',
    criteriosAceptacion: '1. Punto de control circular interactivo en el centro de las líneas de flujo (SequenceFlowEdge) visible al seleccionar la línea o pasar el cursor por encima.\n2. Arrastre bidireccional libre (X, Y) con cursor interactivo grab/grabbing y retroalimentación táctil/visual en tiempo real.\n3. Desplazamiento horizontal (eje X) que modula el lugar exacto de la contracurva (punto de inflexión) permitiendo alinear perfectamente las caídas verticales de múltiples líneas que ingresan a un mismo nodo.\n4. Desplazamiento vertical (eje Y) que genera un arco bicúbico C1 suave para rodear o esquivar tarjetas intermedias sin quiebres ni esquinas agudas.\n5. Snapping magnético automático en el eje X: se atrae a los puntos de contracurva de líneas vecinas a menos de 10px para facilitar una alineación visual perfecta.\n6. Restablecimiento instantáneo de curvatura automática mediante doble clic sobre el punto de control o mediante el botón "Restablecer" en el panel de propiedades.\n7. Soporte completo de historial Deshacer / Rehacer (Ctrl+Z / Ctrl+Y) antes de cada manipulación.\n8. Persistencia garantizada en el esquema JSON del proyecto (edge.data.controlPoint: { x, y }) y reflejo idéntico en las exportaciones gráficas SVG/PNG.',
    fechaImplementacion: '2026-10-16',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-048',
    modulo: 'Lienzo BPMN 2.0 & Enrutamiento de Conexiones',
    titulo: 'Rodeo Automático de Tarjetas y Ajuste Multi-Punto (1 a 4) en Conexiones',
    historiaUsuario: 'Como modelador y diagramador de procesos, quiero que las conexiones que se dirigen hacia atrás rodeen automáticamente las tarjetas sin atravesarlas, y poder definir entre 1 y 4 puntos de control en las propiedades de la conexión para manipular libremente la trayectoria de la línea en el lienzo.',
    criteriosAceptacion: '1. Rodeo automático perimetral: cuando una tarjeta se conecta hacia otra que está antes en el flujo (conexión retrógrada o bucle de retorno), la conexión rodea el exterior de las tarjetas origen, destino e intermedias por encima o por debajo con margen de seguridad sin atravesar ningún nodo.\n2. Selector de cantidad de puntos en PropertiesPanel: permite configurar 1, 2, 3 o 4 puntos de ajuste (por defecto 1 punto) con persistencia en el proyecto.\n3. Manejadores interactivos multi-punto en el lienzo (SequenceFlowEdge): se muestran de 1 a 4 puntos identificados numéricamente (1..4) al seleccionar o pasar el cursor sobre la línea.\n4. Arrastre independiente y suave: cada punto se puede desplazar en X e Y de forma independiente con cálculo de curvatura continua C1 (spline bicúbico/multicúbico Bézier).\n5. Snapping magnético por punto: alineación automática con puntos de control de conexiones vecinas a menos de 10px.\n6. Restablecimiento flexible: doble clic en el lienzo o botón "Restablecer" en el panel de propiedades para volver al trazado automático perimetral.\n7. Fidelidad idéntica en exportaciones: el motor de generación SVG (imageExportService) replica exactamente la trayectoria perimetral y los puntos de control configurados.\n8. Integración con Deshacer/Rehacer (Ctrl+Z / Ctrl+Y) y esquema de persistencia JSON en proyectos.',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-049',
    modulo: 'Estandarización BPMN & Denominadores de 3 Letras',
    titulo: 'Estandarización Universal de Denominadores de 3 Letras para Todos los Nodos BPMN',
    historiaUsuario: 'Como arquitecto y modelador de procesos, quiero que cada tipo de evento, tarjeta, compuerta o ítem del proceso cuente siempre con su propio denominador estándar unívoco de exactamente 3 letras, diferenciando explícitamente eventos de inicio (INI) y fin (FIN), compuertas exclusivas (GTW) y paralelas (PAR), puntos de control de calidad (QCP), carriles (CAR) y notas adhesivas (NOT), para asegurar una nomenclatura jerárquica homogénea, predecible y sin colisiones en los códigos de identificación de todo el sistema.',
    criteriosAceptacion: '1. Diferenciación estricta de eventos: StartEvent asigna prefijo INI (ej. P01-N00-INI-01) y EndEvent asigna FIN (ej. P01-N00-FIN-01).\n2. Diferenciación de compuertas: ExclusiveGateway utiliza GTW y ParallelGateway utiliza PAR.\n3. Puntos de control de calidad estandarizados a 3 letras: QualityCheckpointEvent utiliza QCP (ej. P01-N00-QCP-01).\n4. Carriles organizacionales (Swimlanes) estandarizados a 3 letras: PoolLane utiliza CAR (ej. P01-N00-CAR-01).\n5. Notas adhesivas / Post-its estandarizadas a 3 letras: StickyNote utiliza NOT (ej. P01-N00-NOT-01).\n6. Coherencia con tareas preexistentes de 3 letras: UserTask (TSK), ServiceTask (SRV), ManualTask (MNL), TimerBoundaryEvent (TMR) y SubProcess (SUB).\n7. Generación automática y correlativa en processHierarchyService.formatHierarchicalStandardId() respetando los nuevos denominadores.\n8. Actualización de plantillas de nuevos subprocesos en useCanvasStore y proyectos predeterminados en defaultProjects.\n9. Actualización de insignias de fallback en todos los componentes visuales de nodo (StartEventNode, EndEventNode, GatewayNode, QualityCheckpointNode, SwimlaneNode, StickyNoteNode y TaskNode).\n10. Actualización de filtros de calidad en el navegador jerárquico de procesos (ProcessHierarchyNavigator).',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-050',
    modulo: 'Lienzo BPMN 2.0 & Enrutamiento de Conexiones',
    titulo: 'Posicionamiento Deslizable y Ajuste Interactivo de Etiquetas sobre la Línea de Conexión',
    historiaUsuario: 'Como modelador y diagramador de procesos, quiero poder modificar la posición de la etiqueta de cualquier conexión arrastrándola directamente en el lienzo o mediante un deslizador en el panel de propiedades, asegurando que permanezca siempre situada sobre la línea de conexión adaptándose a su curvatura o al movimiento de las tarjetas conectadas.',
    criteriosAceptacion: '1. Arrastre directo en el lienzo: la etiqueta de conexión (conditionText) cuenta con cursor interactivo grab/grabbing e icono sutil GripVertical, permitiendo arrastrarla a lo largo de la línea.\n2. Restricción estricta sobre la trayectoria: el algoritmo getClosestRatioOnSvgPath proyecta la posición del cursor directamente sobre el trazo SVG de la conexión, asegurando que la pastilla de la etiqueta se mantenga 100% sobre la línea en todo momento.\n3. Propiedad paramétrica relativa: se almacena la posición como proporción (labelPosition entre 0.05 y 0.95), garantizando que si se mueven las tarjetas o se modifica la curvatura de la línea, la etiqueta mantenga su posición relativa sobre el trazo.\n4. Control en PropertiesPanel: deslizador porcentual de posición (5% a 95%), botones de salto rápido (Inicio 20%, Centro 50%, Final 80%) y botón Centrar para restablecer la etiqueta al punto medio.\n5. Restablecimiento rápido: doble clic sobre la etiqueta en el lienzo para devolverla al centro de la línea.\n6. Integración con Deshacer/Rehacer (Ctrl+Z / Ctrl+Y) antes de cada manipulación.\n7. Fidelidad idéntica en exportaciones gráficas SVG, PNG y PDF (imageExportService y pdfDiagramExportService).\n8. Persistencia garantizada en el esquema JSON de proyectos.',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-051',
    modulo: 'Lienzo BPMN 2.0 & Jerarquía de Procesos',
    titulo: 'Resaltado Progresivo en Barra de Procesos, Notas Redimensionables y Vinculación con Tarjeta',
    historiaUsuario: 'Como analista y modelador de procesos, quiero que la barra de navegación de procesos resalte en un color degradado con opacidad progresiva la ruta de anidación donde estoy parado (opacándose más hacia la raíz), y en las notas adhesivas poder redimensionar su tamaño libremente, vincularlas opcionalmente a cualquier tarjeta del diagrama mediante una línea punteada y que el campo Responsable se complete automáticamente con el asignado a dicha tarjeta vinculada, para contar con una clara orientación contextual jerárquica y una documentación contextual ágil y articulada con las actividades.',
    criteriosAceptacion: '1. Barra de navegación jerárquica (SubProcessBreadcrumbs): cálculo de distancia jerárquica de cada elemento de la ruta activa respecto al nivel actual.\n2. Resaltado cromático progresivo: el proceso actual en el que se está parado se destaca con el color de acento y fondo al 100%, mientras que los procesos contenedores/ancestros reducen proporcionalmente su opacidad hasta la raíz, dejando las ramas paralelas en tono neutral.\n3. Notas adhesivas redimensionables (StickyNoteNode): integración de NodeResizer con límites mínimos (160x110px), permitiendo ajustar libremente ancho y alto en el lienzo.\n4. Vinculación opcional con tarjeta: selector desplegable en PropertiesPanel para asociar una nota a cualquier tarjeta o ítem del proceso activo, o conexión directa entre conectores en el lienzo.\n5. Conector punteado de asociación: línea de transición discontinua (strokeDasharray: "4,4") sin punta de flecha ni obligatoriedad de asignación.\n6. Herencia automática de Responsable: el pie de la nota refleja en tiempo real el Responsable de la tarjeta asociada (o su rol funcional) y se actualiza ante cualquier modificación.\n7. Si la nota no está vinculada, permite ingresar o mostrar un responsable manual o el texto "Sin responsable".\n8. Exportación gráfica fiel: soporte de dimensiones redimensionadas y líneas punteadas de asociación en exportaciones SVG, PNG y PDF (imageExportService y pdfDiagramExportService).\n9. Persistencia de campos en el archivo de proyecto JSON (relatedNodeId y isAssociation).',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-052',
    modulo: 'Lienzo BPMN 2.0 & Enrutamiento de Conexiones',
    titulo: 'Corrección de Bucle en Conexiones Cercanas y Movimiento Suave de Nodos',
    historiaUsuario: 'Como diseñador y modelador de procesos, quiero que las conexiones entre tarjetas que se encuentran muy cerca no formen bucles o rodeos inferiores indeseados, y que el movimiento de las tarjetas al arrastrarlas sea completamente fluido, suave y sin encasillarse de forma trabada, quedando exactamente colocadas en las coordenadas donde las suelto, para diagramar con máxima precisión visual y comodidad de uso.',
    criteriosAceptacion: '1. Enrutamiento en tarjetas cercanas: las conexiones horizontales estándar (Right -> Left) con targetX > sourceX se procesan siempre como flujo directo hacia adelante sin importar la proximidad entre tarjetas.\n2. Supresión de falsos bucles retrógrados: isBackwardConnection solo se activa cuando la tarjeta destino está efectivamente situada detrás de la de origen (targetX <= sourceX).\n3. Cálculo proporcional de curvatura: los puntos de control Bezier escalan con la distancia efectiva (Math.max(4, Math.min(distance * 0.45, 140))), evitando sobrepasos o nudos cuando las tarjetas están pegadas.\n4. Movimiento fluido 60 FPS: eliminación de la atracción magnética invasiva que forzaba a las tarjetas de actividad a saltar bruscamente entre ranuras predefinidas durante el arrastre.\n5. Posicionamiento milimétrico exacto: las tarjetas quedan colocadas exactamente donde el usuario suelta el cursor del ratón.\n6. Supresión de latencia CSS: eliminación de transition-all en contenedores de nodos y desactivación de transiciones espaciales en .react-flow__node, logrando una respuesta 1:1 instantánea.\n7. Preservación del acoplamiento 0px entre carriles (PoolLane) y de las guías visuales punteadas de alineación (AlignmentGuidesOverlay).',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-053',
    modulo: 'Lienzo BPMN 2.0 & Barra de Navegación',
    titulo: 'Eliminación de Barra Flotante Superpuesta para Despeje de la Navegación de Procesos',
    historiaUsuario: 'Como usuario y diagramador de procesos, quiero que al copiar elementos o interactuar con el lienzo no aparezca una barra flotante superpuesta sobre la barra de navegación de procesos (breadcrumbs), para que el hilo jerárquico de procesos se mantenga siempre visible y despejado sin obstrucciones visuales.',
    criteriosAceptacion: '1. Desmontaje completo de SelectionToolbar: eliminación del componente flotante en ProcessCanvas, suprimiendo la barra persistente que emergía al poblar el portapapeles.\n2. Despeje total de la barra de navegación: los breadcrumbs de subprocesos (SubProcessBreadcrumbs) permanecen 100% visibles y libres de superposición en toda su extensión horizontal.\n3. Preservación integral de atajos de copiar y pegar: las combinaciones universales Ctrl+C y Ctrl+V continúan funcionando fluidamente con notificaciones toast informativas.\n4. Mantenimiento de acciones de control: las funciones de fijado, compresión de subprocesos, orientación y eliminación permanecen plenamente disponibles en el panel de propiedades lateral (PropertiesPanel) y controles superiores.',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-054',
    modulo: 'Lienzo BPMN 2.0 & Enfoque de Subprocesos',
    titulo: 'Centrado Inteligente y Enfoque en Start Event al Entrar a un Subproceso',
    historiaUsuario: 'Como analista y diagramador de procesos, quiero que siempre que ingrese o navegue a un subproceso la vista del lienzo centre automáticamente el proceso lo más posible, y en caso de que el proceso sea muy largo para el nivel de zoom actual, sitúe automáticamente la primera ficha de evento de inicio (Start Event) al centro vertical y a la izquierda de la pantalla, para visualizar de forma óptima e inmediata la secuencia del flujo de trabajo.',
    criteriosAceptacion: '1. Detección automática al navegar en subprocesos: el visor ejecuta el centrado inteligente al ingresar a un subproceso o cambiar de nivel jerárquico (subProcessPath.length > 0).\n2. Exclusión de carriles organizacionales: el cálculo del cuadro delimitador del proceso (bounding box) excluye los nodos PoolLane de fondo, considerando únicamente las tarjetas operativas (tareas, compuertas, eventos y notas).\n3. Centrado suave en procesos que caben en pantalla: si el ancho del proceso cabe dentro del ancho visible de la ventana al nivel de zoom actual, la cámara se centra suavemente (setCenter) en el punto medio exacto del proceso sin alterar el zoom.\n4. Enfoque al centro a la izquierda para procesos extensos: si el proceso es más largo que el ancho disponible de la pantalla al zoom actual, la primera ficha Start Event (o el nodo más a la izquierda si no hubiese evento de inicio) se posiciona centrada en el eje Y (viewportHeight / 2) y a la izquierda en el eje X con margen visual cómodo (~140-180px).\n5. Respeto al zoom del usuario: se preserva el nivel de zoom actual del lienzo sin reducciones forzadas ni saltos abruptos.\n6. Estabilidad de edición: el efecto no interfiere ni reposiciona la cámara mientras el usuario arrastra nodos, edita propiedades o modela dentro del subproceso.\n7. Transición animada fluida: la transición de cámara se realiza con una interpolación suave (duration: 400ms).',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-055',
    modulo: 'Lienzo BPMN 2.0 & Jerarquía de Procesos',
    titulo: 'Ajuste de Colores y Alto Contraste en Textos de la Barra de Navegación de Procesos',
    historiaUsuario: 'Como analista y modelador de procesos, quiero que los textos de la barra de navegación de subprocesos resalten con nitidez y alto contraste independientemente de si uso un tema claro o un tema oscuro, diferenciando claramente el proceso activo, los procesos ancestros en la ruta jerárquica y los procesos inactivos, para leer e interactuar cómodamente con el árbol de procesos en todo momento.',
    criteriosAceptacion: '1. Detección automática de luminosidad: el componente SubProcessBreadcrumbs adapta su paleta cromática en tiempo real según el tema activo (isDark de useUiStore).\n2. Máximo contraste en modo claro (Sandpaper, Nordic Studio): los procesos ancestros muestran texto índigo profundo (#312e81) y bordes definidos (#4f46e5), eliminando textos lavanda pálidos casi invisibles.\n3. Resalte premium en proceso activo: sigla en negro azulado (text-indigo-950 font-black), título nítido (text-slate-900) e insignia de nivel en pastilla sólida de alto impacto (bg-indigo-600 text-white font-bold).\n4. Definición en procesos inactivos: texto reforzado en text-slate-700 con efecto hover text-indigo-700.\n5. Visibilidad nocturna en modo oscuro: texto índigo luminoso (#e0e7ff) en ancestros y blanco brillante en proceso activo con bordes de alta visibilidad.\n6. Botón de retorno (Volver): texto contrastado en text-slate-800 (modo claro) y text-slate-100 (modo oscuro) con bordes reforzados.\n7. Separadores chevron: visibilidad mejorada en ambas modalidades cromáticas.',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-056',
    modulo: 'Lienzo BPMN 2.0 & Personalización de Tarjetas',
    titulo: 'Propagación Jerárquica Global de Estilos de Tarjeta en "Mismo tipo"',
    historiaUsuario: 'Como modelador y diseñador de procesos, quiero que al aplicar un cambio de color, tema predefinido o estilo con la opción "Mismo tipo" seleccionada, la modificación se propague a todas las tarjetas del mismo tipo en todo el proyecto, abarcando los procesos padre (nivel raíz y superiores) y los procesos anidados (subprocesos hijos y ramas paralelas), para mantener una identidad visual y taxonomía homogénea en todo el mapa de procesos corporativo.',
    criteriosAceptacion: '1. Alcance jerárquico universal para Mismo tipo: al seleccionar Mismo tipo (same_type) en el panel de propiedades, las modificaciones cromáticas se propagan por todo el árbol del proyecto (currentProject).\n2. Soporte para procesos padre: las tarjetas del mismo tipo ubicadas en la raíz o en niveles superiores adquieren inmediatamente el nuevo estilo.\n3. Soporte para subprocesos anidados: la función updateNodesDeep recorre recursivamente todos los subprocesos (subProcessCanvas.nodes) e instantáneas comprimidas (compressedSnapshot.nodes) a cualquier nivel N de profundidad.\n4. Propiedades estilísticas contempladas: color de fondo, opacidad, color de borde, color de cabecera, modo de visualización, orientación y dimensiones.\n5. Preservación de carriles: los carriles organizacionales (PoolLane) no se ven alterados ni sobreescritos por la propagación de estilos de tarjetas operativas.\n6. Ámbito individual preservado: la opción "Solo este" continúa afectando de manera exclusiva a la tarjeta seleccionada en el nivel activo.\n7. Soporte para el ámbito "Todos": la opción "Todos" actualiza todas las tarjetas operativas en todo el modelo jerárquico manteniendo homogeneidad global.\n8. Integración con Deshacer/Rehacer (Ctrl+Z / Ctrl+Y): se genera un snapshot de historial atómico para revertir o rehacer la modificación global en un solo paso.',
    fechaImplementacion: '2026-10-19',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-057',
    modulo: 'Lienzo BPMN 2.0 & Enfoque de Procesos',
    titulo: 'Centrado Inteligente y Enfoque en Start Event para Procesos Padre y Raíz',
    historiaUsuario: 'Como analista y diagramador de procesos, quiero que el centrado inteligente y enfoque en la primera ficha Start Event se aplique también al proceso principal (raíz) y al regresar a cualquier proceso padre en la jerarquía, asegurando una experiencia de visualización coherente, predecible y orientada al inicio del flujo en todos los niveles del proyecto.',
    criteriosAceptacion: '1. Cobertura universal de niveles: el efecto de centrado se activa ante cualquier cambio de nivel jerárquico, incluyendo la navegación a subprocesos hijos, el ascenso a procesos padre ("Volver") y el retorno al proceso raíz.\n2. Encuadre al inicio del flujo en procesos extensos: si el proceso padre o raíz es más ancho que la ventana al nivel de zoom actual, la primera ficha Start Event se sitúa centrada verticalmente (viewportHeight / 2) y a la izquierda de la pantalla (~140-180px) para comenzar a leer el diagrama naturalmente hacia la derecha.\n3. Centrado geométrico en diagramas breves: si el proceso padre o raíz cabe dentro de la ventana al nivel de zoom actual, la vista centra la totalidad de las tarjetas operativas de forma suave.\n4. Exclusión de carriles (PoolLane): los swimlanes de fondo no deforman el cálculo de dimensiones ni el posicionamiento del flujo operativo.\n5. Preservación estricta del zoom: el nivel de zoom configurado por el usuario no se modifica ni se resetea.\n6. Estabilidad durante el modelado: el centrado no se re-ejecuta mientras el usuario arrastra tarjetas, crea conexiones o edita propiedades dentro del mismo nivel de proceso.\n7. Carga inicial orientada: al abrir un proyecto, el proceso raíz se encuadra automáticamente de forma óptima sin necesidad de desplazamientos manuales.',
    fechaImplementacion: '2026-10-19',
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
