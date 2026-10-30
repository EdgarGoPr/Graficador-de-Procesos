# ProcesStudio (BPMN 2.0 & ISO 9001:2015)

Aplicación web para el modelado, diagnóstico, compresión jerárquica y documentación técnica de procesos administrativos, sancionatorios y legales complejos.

- **Acceso web:** https://graficador-de-procesos.vercel.app/
- **Manual de uso:** [`docs/MANUAL_DE_USO.pdf`](docs/MANUAL_DE_USO.pdf)

---

## 1. Matriz de Cumplimiento de Estándares

| Estándar | Aplicación | Implementación |
| :--- | :--- | :--- |
| **ISO/IEC 11179** | Metadatos y nomenclatura | Código técnico en inglés con tipado estricto: `camelCase` en variables/JSON, `PascalCase` en componentes y tipos, `UPPER_SNAKE_CASE` en enums. |
| **ISO 8601** | Fechas, tiempos y SLA | Formato UTC extendido y plazos (`P10D`, `PT48H`), distinguiendo días hábiles de corridos. |
| **ISO/IEC 19510 (BPMN 2.0)** | Modelado de procesos | Nodos estándar: eventos, tareas, compuertas XOR/AND, subprocesos, pools y swimlanes. |
| **ISO 9001:2015** | Enfoque de procesos y riesgos | Matriz SIPOC (cl. 4.4), puntos de control de calidad y matriz de riesgos (cl. 6.1). |

---

## 2. Módulos Principales

- **Proyectos:** dashboard con lead time, conteo de nodos, puntos de calidad y riesgos; crear, abrir, duplicar, eliminar, importar y descargar respaldo JSON.
- **Lienzo:** swimlanes, paleta de nodos, conectores condicionales, auto-orden y generación desde texto/plantillas.
- **Vistas & Manual PDF:** Manual PDF estandarizado, Matriz SIPOC, Matriz RACI y Flujograma Secuencial.
- **Herramientas:** Auditor de Calidad, Simulador, Comparador de versiones, Presentación, Bóveda Documental IA y Tutorial.
- **Consola de Administración:** usuarios, permisos por módulo y por proyecto, catálogos ABM y auditoría.

---

## 3. Desarrollo Local

Requisitos: Node.js 20+ y npm.

```bash
npm install
cp .env.example .env   # completar variables
npm run dev            # http://localhost:5173/
npm run build          # compila (tsc + vite) y regenera HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx
```

### Variables de entorno

Ver [`.env.example`](.env.example). Las variables `VITE_*` se incrustan en el JavaScript compilado: no uses en producción credenciales con privilegios altos.

### Esquema de base de datos (Neon)

```bash
node --env-file=.env scripts/setup-neon-db.cjs
```

---

## 4. Despliegue

El despliegue en producción se realiza automáticamente en **Vercel** (`https://graficador-de-procesos.vercel.app/`) con cada `git push` a la rama `main`, utilizando la configuración declarada en [`vercel.json`](vercel.json).

---

## 5. Persistencia

- **Navegador:** los proyectos se guardan en `localStorage` y pueden respaldarse o moverse entre equipos con **Descargar respaldo JSON** e **Importar JSON**.
- **Neon PostgreSQL (opcional):** si hay una cadena de conexión configurada, usuarios, permisos, auditoría y proyectos se persisten en la nube.
