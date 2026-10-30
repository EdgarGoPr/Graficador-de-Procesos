# Plan de Acción Integral: Plataforma Corporativa de Graficación Optimizada, Documentación PDF Automatizada, Gobernanza de Usuarios, ABMs Maestros, UX Amigable y Tutorial Interactivo

> **Documento:** Plan de Acción Maestro para el Desarrollo Final de ProcesStudio  
> **Versión:** 2.0.0 (Propuesta de Hoja de Ruta Final) | **Fecha:** 2026-10-30  
> **Alineación Normativa:** Directivas Obligatorias de Desarrollo (`AGENTS.md` y `.agents/rules/directivas.md`), Estándar BPMN 2.0 (ISO/IEC 19510), Gestión de Calidad ISO 9001:2015 (Control de Cambios y Trazabilidad) y Seguridad de la Información ISO/IEC 27001 (Control de Accesos).  
> **Historias de Usuario:** `PST-069` a `PST-082` (Implementadas) | **Nuevas Historias Planificadas:** `PST-083`, `PST-084`, `PST-085`, `PST-086`, `PST-087`, `PST-088` (Desarrollo Final Integral v2.0).

---

## 1. Visión y Objetivos del Sistema de Usuarios

El propósito fundamental de esta evolución es transformar **ProcesStudio** en una plataforma corporativa gobernada por **Control de Acceso Basado en Roles (RBAC)**, **Permisos Granulares por Lienzo (Lienzo / Proyecto)** y **Máxima Seguridad de Identidad**, garantizando:

1. **Ingreso Obligatorio Previo (Auth Gatekeeper):** El acceso a ProcesStudio requiere **siempre e ineludiblemente el inicio de sesión previo**. Se suprime el acceso como invitado/anónimo: si el usuario no ha iniciado sesión, la aplicación presenta una pantalla bloqueante de autenticación (sin opción de cerrar o saltar) impidiendo visualizar o interactuar con el Dashboard o Lienzos hasta estar debidamente autenticado.
2. **Cuenta de Administrador Principal y Confidencialidad de UI (Zero-Disclosure):** La cuenta principal con rol `ADMIN` queda asociada internamente al correo configurado por la organización (`egdeprada@gmail.com`), permitiendo el ingreso directo mediante el flujo estándar de **Google Sign-In**. **La interfaz de usuario no debe mostrar, insinuar ni exponer correos electrónicos particulares ni del administrador en botones, textos explicativos ni tarjetas**, resguardando estrictamente la privacidad y la estética corporativa.
3. **Flujo Estándar Canónico de Google Sign-In:** El botón de acceso presenta exclusivamente la etiqueta canónica oficial **"Continuar con Google"**. Al presionarlo, se dispara el flujo estándar de autenticación de Google (Google Identity Services / selector de cuentas). Tras seleccionar la cuenta de Google, el sistema identifica internamente las credenciales y concede rol `ADMIN` o `USER` de forma transparente.
4. **Ocultamiento Estricto de Lienzos No Asignados (*Zero-Visibility*):** Un usuario regular (`USER`) **no debe ver ni tener conocimiento de ningún lienzo que no le haya sido asignado explícitamente**. Los proyectos no asignados o desasignados se filtran de raíz en el Dashboard (no aparecen en tarjetas, métricas ni resultados de búsqueda). Si un usuario no posee lienzos asignados, el catálogo muestra un estado vacío institucional. Asimismo, cualquier intento de acceso forzado a un lienzo no asignado será rechazado de inmediato. El Administrador mantiene la visibilidad completa de todos los procesos para su gestión y asignación.
5. **Acceso Restringido y Gobernado:** Eliminación del auto-registro libre. Solo los usuarios debidamente habilitados por el Administrador pueden acceder a la plataforma. Los nuevos interesados dispondrán de un flujo formal de **Solicitud de Habilitación**.
5. **Identidad Corporativa y Google Sign-In:** Soporte dual para ingreso mediante correo electrónico y credenciales locales seguras, o a través de **Google OAuth 2.0 / Google Identity Services (GIS)** con reconocimiento automático de la cuenta administradora `egdeprada@gmail.com`.
6. **Restablecimiento de Contraseñas Exclusivo por el Administrador:** El **Administrador es el único facultado para generar y autorizar el reseteo de contraseñas**. El usuario puede emitir la solicitud desde la pantalla de login, pero **no podrá ingresar hasta que el Administrador le informe el código de 6 dígitos generado por el sistema**. Una vez informado, el usuario ingresa dicho código como contraseña provisoria y el sistema lo obliga inmediatamente a definir su nueva contraseña y confirmarla.
7. **Permisos Granulares por Lienzo:** Capacidad del Administrador para asignar o desasignar proyectos a usuarios con tres niveles de control:
   - **Solo Lectura:** Inspección visual y exportación; edición bloqueada.
   - **Comentarios:** El usuario **únicamente puede interactuar con Notas Adhesivas (`StickyNote`)**, colocándolas y editándolas sobre el lienzo para sugerencias o revisiones, sin alterar en absoluto el flujo BPMN ni los carriles.
   - **Editor:** Autoridad completa para diseñar diagramas BPMN, gestionar carriles, compuertas, SLAs, IA y guardar versiones.
8. **Trazabilidad Absoluta y Logs de Auditoría (Exclusivo Administrador):** Registro inmutable en base de datos de cada interacción del sistema, accesible exclusivamente por usuarios con rol Administrador, con **generación de informe oficial foliado y certificado en PDF (ISO 9001)** con sello SHA-256.
9. **Arquitectura 100% Web Cloud Nativa:** Operación como aplicación Web moderna (React, TypeScript, Vite) con backend relacional serverless en **Neon PostgreSQL**, accesible mediante cualquier navegador.
10. **Bloqueo Suave de Concurrencia (*Canvas Soft-Locking*) [Sugerencia 1]:** Prevención de colisiones entre editores mediante adquisición de candado temporal con latido de 60s. Si un usuario ya edita un lienzo, a los demás se les abre en modo *Solo Lectura* con notificación.
11. **Cierre de Sesión por Inactividad (*Idle Timeout*) [Sugerencia 2]:** Bloqueo automático de pantalla tras 30 minutos de inactividad del usuario, requiriendo reingreso de contraseña para retomar.
12. **Doble Factor de Autenticación (2FA / TOTP) para Administradores [Sugerencia 6]:** Segundo factor obligatorio mediante Google/Microsoft Authenticator para cuentas con privilegios administrativos.

---

## 2. Diagrama Conceptual de la Arquitectura

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PROCESSTUDIO AUTH & RBAC                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         [ PANTALLA DE ACCESO ]                          [ ESTADO NO HABILITADO ]
    ├── Login Email + Contraseña                                    │
    ├── Botón Oficial "Login con Google"                            ▼
    ├── "Solicitar Reseteo de Contraseña"             [ Formulario de Solicitud ]
    │     └── Queda en espera de código               ──► Solicitar Habilitación al Admin
    └── "¿No tienes cuenta? Solicitar Habilitación"                 │
                                                                    │
                    ┌───────────────────────────────────────────────┘
                    ▼
     [ REVISIÓN DEL ADMINISTRADOR (CON 2FA OBLIGATORIO) ]
     ├── Aprobar/Rechazar Solicitudes de Habilitación
     ├── Generar Código de 6 Dígitos de Reseteo (El Admin se lo informa al usuario)
     └── Asignar Proyectos y Permisos Iniciales
                    │
         ┌──────────┴────────────────────────┐
         ▼                                   ▼
 ┌──────────────────────┐        ┌────────────────────────────────────────────────┐
 │  ROL ADMINISTRADOR   │        │                  ROL USUARIO                   │
 ├──────────────────────┤        ├────────────────────────────────────────────────┤
 │ • 2FA TOTP Activado  │        │ • Ingreso con código ➔ Cambio forzado clave    │
 │ • Consola Admin      │        │ • Dashboard filtrado (Solo lienzos asignados)  │
 │ • Solicitudes Pend.  │        │ • Nivel por Lienzo:                            │
 │ • Generar Claves     │        │   ├── 👁️ Solo Lectura: Ver y exportar          │
 │ • Asignación Lienzos │        │   ├── 💬 Comentarios: SOLO Notas Adhesivas     │
 │ • Logs de Auditoría  │        │   └── ✏️ Editor: Modelado BPMN (con candado)   │
 │ • Reporte PDF ISO    │        │ • Timeout por inactividad (30 min)             │
 └──────────┬───────────┘        └────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                       REGISTRO CENTRALIZADO DE AUDITORÍA                       │
 │ 📜 Inmutable | Filtrable por Usuario, Lienzo y Fecha | Reporte Foliado PDF/XLS │
 └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Esquema de Base de Datos y Persistencia

Se añaden las estructuras de seguridad en **Neon PostgreSQL** (a través de `@neondatabase/serverless`) con persistencia relacional en la nube y caché de sesión web en navegador.

### 3.1. DDL Relacional en Neon PostgreSQL (`scripts/auth_schema.sql`)

```sql
-- ============================================================================
-- PROCESSTUDIO - MÓDULO DE AUTENTICACIÓN, GOBERNANZA Y AUDITORÍA
-- ============================================================================

-- 1. Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,             -- Nulo si el usuario solo usa Google OAuth
    full_name VARCHAR(150) NOT NULL,
    organization_unit VARCHAR(160) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    google_id VARCHAR(100) NULL UNIQUE,
    avatar_url VARCHAR(500) NULL,
    
    -- Gobernanza de Reseteo de Contraseñas (Exclusivo Administrador)
    reset_request_status VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (reset_request_status IN ('NONE', 'REQUESTED', 'CODE_ISSUED')),
    reset_requested_at TIMESTAMPTZ NULL,
    reset_code VARCHAR(6) NULL,                   -- Código temporal de 6 dígitos generado por el Admin
    reset_code_expires_at TIMESTAMPTZ NULL,       -- Expiración del código
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Segundo Factor de Autenticación (2FA / TOTP)
    totp_secret VARCHAR(64) NULL,                 -- Clave secreta Base32 para TOTP (Google/Microsoft Auth)
    is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Solicitudes de Habilitación de Nuevas Cuentas (Sin auto-registro directo)
CREATE TABLE IF NOT EXISTS user_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    organization_unit VARCHAR(160) NOT NULL,
    justification TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Asignación Granular de Permisos por Lienzo (Proyecto)
CREATE TABLE IF NOT EXISTS project_user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    project_file_name VARCHAR(120) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('READ_ONLY', 'COMMENTS', 'EDITOR')),
    assigned_by UUID REFERENCES app_users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_file_name)
);

-- 4. Candados Temporales de Concurrencia Suave para Lienzos (Soft-Locking)
CREATE TABLE IF NOT EXISTS canvas_active_locks (
    project_file_name VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 5. Registro Centralizado e Inmutable de Logs de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NULL REFERENCES app_users(id),
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action_type VARCHAR(60) NOT NULL,
    target_resource VARCHAR(200) NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_client VARCHAR(45) NULL
);

-- Índices de Rendimiento para Consultas de Auditoría y Filtros del Dashboard
CREATE INDEX IF NOT EXISTS idx_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_user_perms_user_id ON project_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_project ON project_user_permissions(project_file_name);
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON canvas_active_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
```

### 3.2. Adaptador de Sesión Web y Seguridad (`SecurityStorageService`)
- Ubicación: `src/services/securityStorageService.ts`
- Persistencia: Conexión cloud con **Neon PostgreSQL** y almacenamiento seguro de token de sesión en el navegador (`localStorage` / `sessionStorage`) con expiración automática.

---

## 4. Especificación Funcional de Componentes y Flujos

### 4.1. Flujo de Ingreso y Login con Google
1. **Modal de Autenticación (`AuthModal.tsx`):**
   - Campos: Correo electrónico y Contraseña.
   - Botón destacado con estilo oficial de Google: **"Continuar con Google"**.
   - Acceso con Google Identity Services (GIS) en web o mediante protocolo de autenticación seguro en Electron.
   - Enlace: *"¿Olvidaste tu contraseña? Restablecer contraseña"*.
   - Botón secundario: *"¿No tienes cuenta habilitada? Solicitar Habilitación"*.
2. **Validación de Identidad:**
   - Si el usuario se loguea por Google:
     - El token valida el correo (`email`) y su identificador (`google_id`).
     - Si el correo **existe y está ACTIVO** en `app_users`, se inicia la sesión y se registra `AUTH_LOGIN_GOOGLE` en los logs.
     - Si el correo **no está registrado o está pendiente**, el sistema bloquea el ingreso y muestra el mensaje: *"Tu correo no cuenta con habilitación activa en ProcesStudio. Por favor, solicita acceso a continuación."* completando automáticamente el formulario de solicitud con su nombre y correo de Google.

### 4.2. Flujo de "Solicitar Habilitación" (Cero Auto-Registro Libre)
1. **Modal `RequestAccessModal.tsx`:**
   - Formulario limpio y profesional:
     - Nombre y Apellido.
     - Correo electrónico institucional.
     - Unidad Organizativa / Dependencia.
     - Motivo o Justificación del requerimiento de acceso.
   - Al enviar:
     - Se registra en `user_access_requests` con estado `PENDING`.
     - Se dispara el evento de auditoría `ACCESS_REQUEST_SUBMITTED`.
     - El usuario recibe un mensaje de éxito: *"Tu solicitud de habilitación ha sido remitida al Administrador para su evaluación."*

### 4.3. Flujo de Restablecimiento de Contraseñas Exclusivo por Administrador
1. **Solicitud de Reseteo por el Usuario (`RequestPasswordResetModal.tsx`):**
   - El usuario presiona en la pantalla de login: *"¿Olvidaste tu contraseña? Solicitar restablecimiento"*.
   - Introduce su correo electrónico registrado.
   - El sistema actualiza en `app_users`: `reset_request_status = 'REQUESTED'` y `reset_requested_at = NOW()`.
   - Se muestra un diálogo informativo claro e ineludible al usuario:  
     *"Tu solicitud de restablecimiento ha sido enviada al Administrador. No podrás acceder hasta que el Administrador apruebe la solicitud y te informe el código numérico de 6 dígitos generado por el sistema."*
   - Se dispara el evento de auditoría `AUTH_RESET_REQUESTED_BY_USER`.
2. **Generación del Código por el Administrador (`AdminConsoleModal.tsx`):**
   - El Administrador es el **único facultado** para generar y autorizar el reseteo de claves.
   - En la Consola de Administración (pestaña *"Usuarios / Reseteo de Claves"*), el Administrador revisa las solicitudes pendientes o selecciona a cualquier usuario activo y presiona **"Generar Código de 6 Dígitos"**.
   - El sistema calcula un código aleatorio criptográfico de 6 dígitos (ej. `839201`), lo almacena en `app_users.reset_code` con expiración temporal, marca `reset_request_status = 'CODE_ISSUED'` y setea `must_change_password = true`.
   - La pantalla del Administrador muestra el código generado con un botón para copiar al portapapeles, para que el Administrador se lo informe formalmente al usuario por canal institucional seguro (correo, llamada o mensajería interna).
   - Se registra el evento de auditoría `AUTH_RESET_CODE_GENERATED_BY_ADMIN`.
3. **Ingreso del Usuario con Código de 6 Dígitos:**
   - Una vez informado del código por el Administrador, el usuario ingresa a la pantalla de login principal.
   - Escribe su correo electrónico y el **código de 6 dígitos en el campo de contraseña**.
   - El sistema valida el código y la vigencia temporal. Al autenticar, intercepta la sesión impidiendo el ingreso ordinario.
4. **Cambio Forzado Obligatorio de Contraseña (`ForcePasswordChangeModal.tsx`):**
   - Se abre un modal de pantalla bloqueante con los siguientes campos obligatorios:
     1. Código de 6 dígitos informado por el Administrador (para validación de posesión).
     2. Nueva Contraseña (mínimo 8 caracteres, alfanumérica).
     3. Confirmación de Nueva Contraseña.
   - Una vez validadas las reglas de seguridad, se calcula el nuevo `password_hash`, se anula el `reset_code`, se setea `must_change_password = false`, `reset_request_status = 'NONE'` y se registra `AUTH_PASSWORD_CHANGED_SUCCESS` en la auditoría.
   - El usuario queda autenticado y es dirigido a su Dashboard de lienzos asignados.

### 4.4. Bloqueo Suave de Concurrencia (*Canvas Soft-Locking*) [Sugerencia 1]
1. **Adquisición de Candado de Edición:**
   - Cuando un usuario con permiso de `Editor` abre un lienzo, el sistema registra un registro en `canvas_active_locks` con `expires_at = NOW() + INTERVAL '5 minutes'`.
   - Mientras el editor permanezca en la pantalla, se emite un latido (*heartbeat*) automático cada 60 segundos que extiende `expires_at`.
2. **Protección contra Sobrescrituras:**
   - Si otro usuario con rol de editor intenta abrir el mismo lienzo mientras el candado está vigente por otro usuario:
     - El lienzo se abre automáticamente en modo **`Solo Lectura`**.
     - Se muestra una barra de advertencia persistente en la cabecera:  
       *"⚠️ Este lienzo está siendo editado activamente por [Nombre del Usuario]. Tu sesión ha sido abierta en modo Solo Lectura para prevenir pérdida de datos."*
3. **Liberación del Candado:**
   - Al cerrar el lienzo, navegar al Dashboard o cerrar la pestaña del navegador, el candado se elimina de forma inmediata de la tabla `canvas_active_locks`.

### 4.5. Cierre de Sesión por Inactividad (*Idle Session Timeout*) [Sugerencia 2]
1. **Monitoreo de Actividad:**
   - El servicio `idleTimeoutService.ts` escucha eventos de interacción (`mousemove`, `keydown`, `pointerdown`, `scroll`).
   - El temporizador está configurado en un umbral estricto de **30 minutos**.
2. **Alerta Preventiva y Bloqueo:**
   - A los 28 minutos de inactividad, se despliega una notificación flotante con cuenta regresiva: *"Tu sesión se suspenderá en 2 minutos por inactividad. Haz clic para continuar."*
   - A los 30 minutos, se bloquea la interfaz con un protector opaco de seguridad, solicitando reingreso de contraseña o confirmación con Google para reanudar el trabajo, evitando exposición en puestos compartidos.

### 4.6. Autenticación de Doble Factor (2FA / TOTP) para Administradores [Sugerencia 6]
1. **Enrolamiento de Dispositivo:**
   - En la primera sesión del Administrador (o en su panel de seguridad), el sistema genera un secreto criptográfico Base32 y muestra un código QR estándar (RFC 6238).
   - El Administrador escanea el código con Google Authenticator, Microsoft Authenticator o Authy, e ingresa el primer código de verificación para activar `is_totp_enabled = true`.
2. **Desafío en el Inicio de Sesión:**
   - Al iniciar sesión con credenciales de Administrador (o cuenta de Google asociada al rol `ADMIN`), tras superar el primer factor se despliega la pantalla obligatoria de validación TOTP de 6 dígitos.
   - Sin el ingreso correcto del código temporal generado por la app móvil, el sistema no otorga token de Administrador ni acceso a la Consola de Administración.


---

## 5. Matriz de Roles y Gobernanza por Lienzo

### 5.1. Rol Administrador (`ADMIN`)
- **Visibilidad Global:** Acceso total a todos los lienzos de trabajo.
- **Consola de Administración (`AdminConsoleModal.tsx`)**:
  - **Pestaña Solicitudes de Habilitación:** Lista reactiva de pedidos con detalle de usuario, área y justificación. Botones "Aprobar como Usuario / Administrador" y "Rechazar con observaciones".
  - **Pestaña Usuarios del Sistema:** Alta manual, desactivación/reactivación de usuarios, reseteo forzado de contraseñas.
  - **Pestaña Asignación de Lienzos:** Matriz interactiva donde el Administrador selecciona un usuario y un lienzo, definiendo su nivel de permiso (`Solo Lectura`, `Comentarios`, `Editor`). Botón de desasignación instantánea.
  - **Pestaña Logs de Auditoría:** Visor centralizado y filtrable.

### 5.2. Rol Usuario (`USER`)
- **Dashboard Personalizado (`ProjectDashboard.tsx`):**
  - El listado de proyectos se filtra estrictamente para mostrar **únicamente los lienzos asignados al usuario por el Administrador**.
  - Si un usuario no tiene proyectos asignados, se le muestra un mensaje claro con botón para solicitar asignación de lienzos.
  - Cada tarjeta de proyecto exhibe una insignia con su nivel de permiso:
    - `[👁️ Solo Lectura]`
    - `[💬 Comentarios]`
    - `[✏️ Editor]`

### 5.3. Comportamiento del Lienzo según Nivel de Permiso

| Capacidad / Herramienta | 👁️ Solo Lectura | 💬 Comentarios | ✏️ Editor |
| :--- | :---: | :---: | :---: |
| Navegar y hacer zoom en el lienzo | ✅ Sí | ✅ Sí | ✅ Sí |
| Inspeccionar propiedades de actividades | ✅ Modo Lectura | ✅ Modo Lectura | ✅ Edición total |
| Arrastrar actividades BPMN (Tareas, Compuertas, Eventos) | ❌ Bloqueado | ❌ Bloqueado | ✅ Sí |
| Crear o modificar carriles funcionales (Swimlanes) | ❌ Bloqueado | ❌ Bloqueado | ✅ Sí |
| **Colocar y editar Notas Adhesivas (`StickyNote`)** | ❌ Bloqueado | **✅ HABILITADO** | ✅ Sí |
| Asignar nota a un nodo del proceso (`relatedNodeId`) | ❌ Bloqueado | **✅ HABILITADO** | ✅ Sí |
| Eliminar o modificar el flujo existente de proceso | ❌ Bloqueado | ❌ Bloqueado | ✅ Sí |
| Asistente de IA y Recomendaciones Radiales | ❌ Bloqueado | ❌ Bloqueado | ✅ Sí |
| Guardar cambios en el proyecto | ❌ Bloqueado | ✅ Guarda Notas | ✅ Guarda Todo |
| Exportar a PDF / PNG / Word / BPMN XML | ✅ Sí | ✅ Sí | ✅ Sí |

#### Detalle Técnico del Modo Comentarios:
- En `SidebarPalette.tsx`, cuando el permiso es `COMMENTS`, **se deshabilitan visual y funcionalmente todos los grupos de paleta excepto "Anotaciones y Artefactos -> StickyNote"**.
- En `ProcessCanvas.tsx`, los eventos de arrastre (*drag & drop*) rechazan cualquier nodo cuyo tipo sea distinto a `StickyNote`.
- Los nodos existentes tienen su bandera `draggable` y `selectable` protegida contra alteraciones destructivas.
- Toda nota colocada por el usuario registra automáticamente:
  - Nombre del autor (`authorName`), correo y fecha.
  - Generación de log de auditoría: `CANVAS_COMMENT_ADDED`.

---

## 6. Registro Centralizado de Logs de Auditoría

### 6.1. Acceso Exclusivo de Administrador
El panel de logs estará completamente oculto e inaccesible para usuarios regulares. Solo usuarios con `role === 'ADMIN'` disponen del botón de acceso a la Consola de Auditoría en la cabecera (`Header.tsx`).

### 6.2. Catálogo de Acciones Auditadas

| Categoría | Código de Acción | Descripción del Evento |
| :--- | :--- | :--- |
| **Autenticación** | `AUTH_LOGIN_SUCCESS` | Inicio de sesión exitoso con correo y contraseña. |
| **Autenticación** | `AUTH_LOGIN_GOOGLE` | Inicio de sesión exitoso mediante Google OAuth. |
| **Autenticación** | `AUTH_LOGIN_FAILED` | Intento fallido de inicio de sesión (credenciales incorrectas). |
| **Autenticación** | `AUTH_LOGOUT` | Cierre de sesión voluntario del usuario. |
| **Autenticación** | `AUTH_RESET_REQUESTED` | Usuario solicita restablecimiento de contraseña al Administrador. |
| **Autenticación** | `AUTH_RESET_CODE_ISSUED` | Administrador autoriza y genera código numérico de 6 dígitos. |
| **Autenticación** | `AUTH_PASSWORD_CHANGED` | Contraseña actualizada con éxito tras ingresar código de 6 dígitos informado. |
| **Autenticación** | `AUTH_2FA_VERIFIED` | Verificación exitosa de token TOTP de 6 dígitos para Administrador. |
| **Habilitación** | `ACCESS_REQUEST_SUBMITTED` | Usuario envía formulario solicitando alta en el sistema. |
| **Habilitación** | `ACCESS_REQUEST_APPROVED` | Administrador aprueba solicitud y asigna rol inicial. |
| **Habilitación** | `ACCESS_REQUEST_REJECTED` | Administrador rechaza solicitud de usuario. |
| **Gobernanza** | `CANVAS_PERMISSION_ASSIGNED` | Administrador asigna o modifica permiso de un lienzo a un usuario. |
| **Gobernanza** | `CANVAS_PERMISSION_REMOVED` | Administrador desasigna un lienzo a un usuario. |
| **Concurrencia** | `CANVAS_LOCK_ACQUIRED` | Usuario con permiso Editor toma candado de edición sobre el lienzo. |
| **Concurrencia** | `CANVAS_LOCK_RELEASED` | Candado de edición liberado voluntariamente o por expiración de latido. |
| **Lienzo** | `CANVAS_OPENED` | Apertura de un lienzo para visualización o trabajo. |
| **Lienzo** | `CANVAS_COMMENT_ADDED` | Usuario agrega una Nota Adhesiva (`StickyNote`) con observaciones. |
| **Lienzo** | `CANVAS_COMMENT_UPDATED` | Modificación de texto o vinculación de una nota. |
| **Lienzo** | `CANVAS_PROJECT_SAVED` | Guardado de nueva versión del proceso por un editor. |
| **Lienzo** | `CANVAS_EXPORT_GENERATED` | Exportación del diagrama en PDF, Word, BPMN o PNG. |

### 6.3. Interfaz del Visor de Logs (`AuditLogsView.tsx`)
- Filtros reactivos combinables:
  - Selector de Usuario / Correo.
  - Selector de Categoría de Acción (Acceso, Lienzos, Comentarios, Gobernanza, Concurrencia).
  - Selector de Proyecto / Lienzo específico.
  - Selector de Rango de Fechas (Desde - Hasta).
- Buscador textual sobre detalles y metadatos.
- **Botón de Exportación a Excel (.xlsx):** Descarga del informe tabular de auditoría listo para procesamiento y análisis.

### 6.4. Generación de Informe Foliado y Certificado en PDF (ISO 9001:2015) [Sugerencia 7]
1. **Emisión de Documento Oficial:**
   - Botón destacado en el visor de logs: **"Exportar Informe Foliado PDF (ISO 9001)"**.
   - Motor generador con `jspdf` que maqueta un reporte formal con numeración de páginas foliadas (*Página X de Y*).
2. **Estructura Normativa del Reporte:**
   - **Encabezado Institucional:** Logotipo de ProcesStudio, código de control documental (`AUD-ISO-9001-XXXX`), fecha de emisión y usuario administrador solicitante.
   - **Criterios de Alcance:** Rango cronológico auditado, usuarios y procesos comprendidos.
   - **Matriz de Trazabilidad:** Tabla formateada con marcas de tiempo en formato ISO 8601, identidad del operador, rol, acción ejecutada, recurso objetivo y resumen de cambios.
   - **Sello Criptográfico de Integridad:** Cálculo de hash SHA-256 sobre el cuerpo del reporte para verificar inmutabilidad documental.
   - **Bloque de Firmas:** Espacio formal para rúbrica del Auditor de Calidad y del Responsable del Sistema.


---

## 7. Historias de Usuario a Incorporar en Excel (`generate-user-stories.cjs`)

Conforme a la **Directiva 4**, estas historias se registrarán con su numeración correlativa inmediata a partir de `PST-069`:

```javascript
[
  {
    id: 'PST-069',
    modulo: 'Autenticación & Acceso',
    titulo: 'Login con Google, Correo y Solicitud de Habilitación de Cuenta',
    historiaUsuario: 'Como usuario corporativo, quiero ingresar a ProcesStudio mediante mi correo o cuenta de Google y contar con un formulario para solicitar habilitación al administrador sin registro público directo, para asegurar un acceso controlado y gobernado a los procesos de la organización.',
    criteriosAceptacion: '1. Pantalla de login con campos de Email/Contraseña y botón oficial de Continuar con Google.\n2. Bloqueo de auto-registro libre; botón Solicitar Habilitación con modal guiado (Nombre, Email, Área y Justificación).\n3. Solicitud registrada en estado PENDING para aprobación del Administrador.\n4. Rechazo amigable si un correo de Google no se encuentra previamente habilitado en el sistema.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-070',
    modulo: 'Seguridad & Credenciales',
    titulo: 'Solicitud y Generación Administrativa de Código de 6 Dígitos con Cambio Forzado de Contraseña',
    historiaUsuario: 'Como usuario que olvidó su clave, quiero solicitar el restablecimiento al administrador para que este genere un código de 6 dígitos que me informe formalmente y me sirva para ingresar, obligándome inmediatamente a establecer una nueva contraseña con confirmación, para garantizar un reseteo plenamente gobernado.',
    criteriosAceptacion: '1. Botón "Solicitar restablecimiento" en la pantalla de login que deja al usuario en espera y registra la petición en estado REQUESTED.\n2. El Administrador es el único facultado para aprobar y generar el código criptográfico de 6 dígitos en su consola.\n3. El Administrador comunica el código informado al usuario por canal corporativo seguro.\n4. Ingreso del código de 6 dígitos en el campo de contraseña del login.\n5. Intercepción inmediata de la sesión mediante modal bloqueante ForcePasswordChangeModal.\n6. Exigencia de validación: código informado, nueva contraseña y confirmación coincidente.\n7. Actualización segura del hash y registro del evento en los logs de auditoría.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-071',
    modulo: 'Gobernanza & RBAC',
    titulo: 'Consola de Administración, Asignación de Lienzos con Matriz de Permisos y 2FA',
    historiaUsuario: 'Como administrador de ProcesStudio, quiero una consola centralizada protegida por doble factor de autenticación (2FA / TOTP) para gestionar usuarios, aprobar solicitudes y asignar o desasignar lienzos de trabajo con permisos de Solo Lectura, Comentarios o Editor, para gobernar con precisión los accesos a la propiedad intelectual de la empresa.',
    criteriosAceptacion: '1. Panel AdminConsoleModal accesible únicamente para usuarios con rol ADMIN tras superar validación TOTP de 6 dígitos.\n2. Pestaña de revisión de solicitudes de habilitación con botones de Aprobar y Rechazar.\n3. Matriz de asignación de lienzos por usuario con selector de niveles: Solo Lectura, Comentarios y Editor.\n4. Acción de desasignación con 1-clic que revoca el acceso del usuario a dicho lienzo.\n5. El dashboard de los usuarios regulares solo muestra los proyectos que les fueron asignados.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-072',
    modulo: 'Lienzo BPMN & Colaboración',
    titulo: 'Lienzo Restringido en Modo Comentarios (Uso Exclusivo de Notas Adhesivas)',
    historiaUsuario: 'Como usuario revisor con permiso de Comentarios sobre un lienzo, quiero poder colocar y editar únicamente Notas Adhesivas sobre el diagrama sin poder alterar el flujo BPMN ni los carriles, para formular observaciones y recomendaciones sin desconfigurar el proceso.',
    criteriosAceptacion: '1. En modo Comentarios, la paleta lateral bloquea todas las tareas, compuertas y carriles, habilitando únicamente el nodo Nota (StickyNote).\n2. El lienzo impide el arrastre o eliminación de actividades preexistentes.\n3. La nota colocada incluye automáticamente autor, fecha y opción de vinculación a una actividad del proceso.\n4. El guardado en este modo preserva intacta la estructura BPMN y actualiza únicamente las anotaciones.\n5. Registro automático de auditoría CANVAS_COMMENT_ADDED.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-073',
    modulo: 'Auditoría & Calidad ISO 9001',
    titulo: 'Registro Centralizado de Logs de Auditoría y Reporte Foliado Certificado PDF (ISO 9001)',
    historiaUsuario: 'Como administrador y responsable de calidad ISO 9001, quiero un registro inmutable y filtrable de todas las interacciones de los usuarios en el sistema, con generación de un reporte foliado oficial en PDF, para auditar accesos, comentarios y modificaciones ante entes certificadores.',
    criteriosAceptacion: '1. Tabla audit_logs en Neon con registro append-only de autenticación, notas, ediciones y permisos.\n2. Visor de auditoría integrado en la consola de administración con filtros por fecha, usuario, acción y proyecto.\n3. Acceso estrictamente vedado para usuarios que no sean administradores.\n4. Botón de exportación del historial tabular a archivo Excel (.xlsx).\n5. Botón de generación de informe foliado oficial en PDF (ISO 9001) con encabezado normativo, código de control, sello criptográfico SHA-256 y bloque de firmas.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-074',
    modulo: 'Concurrencia, Sesión & 2FA',
    titulo: 'Bloqueo Suave de Concurrencia (Soft-Locking), Timeout por Inactividad y Doble Factor (2FA)',
    historiaUsuario: 'Como usuario y administrador de ProcesStudio, quiero contar con candados temporales en lienzos para evitar sobrescrituras entre editores, cierre automático de sesión tras 30 minutos de inactividad y segundo factor de autenticación (2FA / TOTP) para administradores, para garantizar la integridad operativa y la protección de datos corporativos.',
    criteriosAceptacion: '1. Adquisición automática de candado con latido (heartbeat) de 60s al abrir lienzo en modo Editor; otros usuarios ingresan en Solo Lectura con aviso persistente.\n2. Liberación inmediata de candado al cerrar el lienzo, salir o expirar el latido.\n3. Temporizador de inactividad de 30 minutos con alerta previa a los 28 min y bloqueo de pantalla con cortina de seguridad.\n4. Enrolamiento con código QR y validación obligatoria de token TOTP de 6 dígitos para el rol Administrador.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-075',
    modulo: 'Autenticación Mandatoria & Ocultamiento de Lienzos',
    titulo: 'Barrera de Entrada Obligatoria, Admin egdeprada@gmail.com y Ocultamiento de Lienzos No Asignados',
    historiaUsuario: 'Como director de seguridad y administrador de ProcesStudio, quiero que el sistema requiera obligatoriamente iniciar sesión antes de mostrar cualquier pantalla, que mi cuenta de Google egdeprada@gmail.com esté configurada como Administrador principal con acceso automático, y que los usuarios regulares no vean bajo ningún concepto ningún lienzo que no tengan asignado, para impedir el acceso anónimo y resguardar la confidencialidad de los procesos.',
    criteriosAceptacion: '1. Al cargar la aplicación sin sesión activa (currentUser === null), el sistema despliega de forma obligatoria y bloqueante el modal de acceso AuthModal en modo pantalla completa sin opción de cerrar o cancelar.\n2. Se bloquea totalmente el renderizado y acceso al Dashboard de Proyectos y al Canvas hasta que la autenticación sea exitosa.\n3. Configuración del correo egdeprada@gmail.com como usuario Administrador principal por defecto con reconocimiento automático de rol ADMIN en Google Login.\n4. Ocultamiento total en el Dashboard: los usuarios con rol USER no ven ningún lienzo que no tengan explícitamente asignado en la matriz de permisos.\n5. Si un usuario no tiene lienzos asignados, el Dashboard muestra un estado vacío institucional impidiendo el acceso a diagramas ajenos.\n6. Rechazo automático con redirección al Dashboard si un usuario intenta forzar la carga de un proyecto no asignado.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-076',
    modulo: 'Seguridad & UI Confidencialidad',
    titulo: 'Limpieza Estética, Confidencialidad UI y Flujo Canónico de Google Sign-In',
    historiaUsuario: 'Como director de seguridad y usuario corporativo, quiero que la interfaz de acceso elimine subtítulos técnicos, textos que expongan códigos de reseteo o correos electrónicos particulares, y ofrezca el botón oficial "Continuar con Google", para garantizar una estética premium y la máxima confidencialidad.',
    criteriosAceptacion: '1. Supresión del subtítulo de gobernanza en AuthModal.\n2. Simplificación del campo de contraseña (etiqueta CONTRASEÑA y placeholder de puntos discretos).\n3. Botón oficial "Continuar con Google" sin correos expuestos.\n4. Reconocimiento interno y automático de egdeprada@gmail.com como ADMIN.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-077',
    modulo: 'Seguridad & Autenticación Google OAuth',
    titulo: 'Integración en Vivo de Google OAuth 2.0 con Redirección a accounts.google.com y Captura de Token',
    historiaUsuario: 'Como usuario de ProcesStudio, quiero que al presionar "Continuar con Google" el navegador me redirija a la pantalla oficial de Google Accounts (accounts.google.com) y retorne con mi sesión verificada, para iniciar sesión con mi cuenta de Google de forma real, segura y conforme a las normas de OAuth 2.0.',
    criteriosAceptacion: '1. Configuración de Credenciales: Incorporación del identificador oficial de cliente (Google Client ID) en variables de entorno VITE_GOOGLE_CLIENT_ID.\n2. Redirección Oficial: Al pulsar "Continuar con Google", el navegador navega a https://accounts.google.com/o/oauth2/v2/auth con scopes de email, profile y openid.\n3. Captura Automática de Retorno: Al regresar desde Google con fragmento #access_token=..., el sistema extrae el token y limpia la URL de forma segura.\n4. Consulta de Perfil: Consulta exitosa al endpoint oficial https://www.googleapis.com/oauth2/v3/userinfo para obtener correo, nombre e imagen verificados.\n5. Autenticación Transparente: Si el correo corresponde al Administrador configurado (egdeprada@gmail.com), se garantiza el acceso con rol ADMIN; si es otro usuario habilitado, con rol USER.',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-078',
    modulo: 'Identidad, Versión & Trazabilidad',
    titulo: 'Indicador de Versión Dinámica Global en Esquina Inferior Derecha (V xx.xx.xx)',
    historiaUsuario: 'Como usuario y auditor de ProcesStudio, quiero visualizar permanentemente la versión de la aplicación en formato "V xx.xx.xx" en la esquina inferior derecha de la pantalla, para verificar la versión exacta en ejecución en cualquier momento y garantizar la trazabilidad de los desarrollos.',
    criteriosAceptacion: '1. Visualización permanente en la esquina inferior derecha (fixed bottom, right) con diseño discreto, estilizado y no obstructivo.\n2. Formato estandarizado con padding de dos dígitos "V xx.xx.xx" (ej. V 01.05.01).\n3. Visible de forma consistente tanto en la pantalla de inicio de sesión (Gatekeeper) como en el espacio de trabajo activo.\n4. Centralización en src/constants/version.ts y sincronización con el campo version de package.json.\n5. Criterio de incremento semántico a partir de esta entrega según magnitud del cambio (Mayor / Menor / Parche).',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-079',
    modulo: 'Gobernanza & Gestión de Usuarios',
    titulo: 'Alta y Edición Integral de Usuarios por el Administrador desde la Consola',
    historiaUsuario: 'Como administrador de ProcesStudio, quiero dar de alta nuevos usuarios directamente y editar los datos, roles, unidades organizativas y estados de los usuarios existentes desde la Consola de Administración, para gobernar el directorio corporativo de manera ágil sin depender exclusivamente de solicitudes previas.',
    criteriosAceptacion: '1. Botón "+ Nuevo Usuario" en la pestaña Usuarios & Claves con formulario modal guiado (Nombre, Email, Área, Rol ADMIN/USER y Contraseña inicial o Código provisorio de 6 dígitos).\n2. Botón "Editar" en la tabla de usuarios que permite modificar nombre, unidad organizativa, rol del sistema y estado (ACTIVE / INACTIVE / BLOCKED).\n3. Opción para forzar el cambio de contraseña en el próximo ingreso o sobrescribir contraseña al editar.\n4. Salvaguardas de seguridad: no permitir auto-bloqueo ni auto-degradación de rol del Administrador en sesión activa; validación estricta de formato y unicidad de correo electrónico.\n5. Persistencia relacional en Neon PostgreSQL con sincronización local y registro de auditoría inmutable (USER_CREATED_BY_ADMIN y USER_UPDATED_BY_ADMIN).',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-080',
    modulo: 'Gobernanza & Colaboración por Proyecto',
    titulo: 'Gestión Descentralizada de Participantes y Permisos desde el Proyecto (Creador y Administradores)',
    historiaUsuario: 'Como usuario creador de un proceso o administrador de ProcesStudio, quiero gestionar los participantes y sus niveles de permiso (Solo Lectura, Comentarios, Editor) directamente desde el propio proyecto mediante un botón dedicado, para colaborar ágilmente sin depender exclusivamente de la consola central del administrador.',
    criteriosAceptacion: '1. Botón de acceso directo "Participantes" (icono Users) visible en la tarjeta del proyecto en el Dashboard y en la cabecera del lienzo cuando el proceso está abierto.\n2. Autorización Dual: Habilitado para usuarios con rol ADMIN y para el usuario creador/autor del proyecto; oculto o bloqueado para otros usuarios.\n3. Modal ProjectParticipantsModal con visualización de participantes actuales, cambio rápido de nivel de permiso (READ_ONLY, COMMENTS, EDITOR) y revocación de acceso.\n4. Asignador de nuevos participantes con buscador de usuarios activos del sistema y selector de rol de colaboración.\n5. Persistencia relacional en Neon PostgreSQL (project_user_permissions) y fallback local, con registro inmutable de auditoría (CANVAS_PERMISSION_ASSIGNED y CANVAS_PERMISSION_REMOVED).',
    fechaImplementacion: '2026-10-28',
    estado: 'Implementado / Producción'
  }
];
```

---

## 8. Estado de Sugerencias de Gestión de Usuarios

Las recomendaciones técnicas evaluadas han sido clasificadas e integradas al alcance de acuerdo a la decisión de diseño:

### 1. Bloqueo Suave de Concurrencia (*Canvas Soft-Locking*) — [✅ INCORPORADO AL ALCANCE PRINCIPAL]
- **Implementación:** Tabla `canvas_active_locks` en Neon, adquisición automática de candado para rol `Editor` con latido (*heartbeat*) de 60 segundos. Si otro editor intenta ingresar, el lienzo se abre en modo `Solo Lectura` con alerta informativa de edición concurrente.

### 2. Cierre de Sesión por Inactividad (*Idle Session Timeout*) — [✅ INCORPORADO AL ALCANCE PRINCIPAL]
- **Implementación:** Servicio global de monitoreo de actividad con temporizador de 30 minutos. Notificación preventiva a los 28 minutos y bloqueo con pantalla de seguridad a los 30 minutos requiriendo reingreso de credenciales.

### 6. Autenticación de Doble Factor (2FA / TOTP) para Administradores — [✅ INCORPORADO AL ALCANCE PRINCIPAL]
- **Implementación:** Enrolamiento con código QR estándar RFC 6238 para Google Authenticator o Microsoft Authenticator. Desafío de token dinámico de 6 dígitos obligatorio al iniciar sesión como Administrador para acceder a la Consola y herramientas de gobernanza.

### 7. Exportación Foliada de Auditoría para Certificaciones ISO 9001 — [✅ INCORPORADO AL ALCANCE PRINCIPAL]
- **Implementación:** Botón de generación con `jspdf` de informe oficial foliado (*Página X de Y*), membretado, con código de control documental (`AUD-ISO-9001`), rango auditado, matriz de trazabilidad, cálculo de hash criptográfico de integridad SHA-256 y bloque de firmas para auditoría de calidad.

---

### Sugerencias Adicionales para Fases Futuras

### 3. Resiliencia de Conexión de Red (*Network Resilience & Reconnection*)
- Reintento automático exponencial y caché de estado en navegador para las credenciales y permisos del usuario activo.

### 4. Vinculación Inteligente de Comentarios a Carriles y Roles
- Asignación de rol o carril responsable al redactar una Nota Adhesiva (`StickyNote`).

### 5. Integración de Correo Transaccional (Resend API / SMTP Institucional)
- Despacho automático de notificaciones a casillas corporativas si se configuran variables de entorno SMTP/Resend.

### 8. Enlace de Activación de Un Solo Uso (*Magic Invite Link*)
- Generación de token temporal de acceso directo de un solo uso al aprobar una solicitud de habilitación.

---

## 9. Hoja de Ruta de Ejecución Técnica Específica

1. **Configuración de la Cuenta de Administrador Principal (`egdeprada@gmail.com`):**
   - **`scripts/auth_schema.sql`:** Actualizar la semilla DDL de inserción inicial para que el administrador sea `egdeprada@gmail.com` con nombre "Edgar González de Prada" y rol `ADMIN`.
   - **`src/services/authService.ts`:**
     - Modificar la inicialización para sembrar `egdeprada@gmail.com` con rol `ADMIN`.
     - Migración automática: si existe un usuario previo `admin@processtudio.com` en Neon o `localStorage`, migrar automáticamente sus asignaciones y privilegios hacia `egdeprada@gmail.com`.
     - **Reconocimiento en Google Login (`loginWithGoogle`):** Cuando la credencial o el correo verificado de Google sea `egdeprada@gmail.com`, el sistema garantiza automáticamente el rol `ADMIN` (activo de inmediato, sin requerir aprobación de terceros).
2. **Implementación de Barrera de Acceso Obligatoria (Auth Gatekeeper):**
   - **`src/App.tsx`:**
     - Si `currentUser === null` (no hay usuario con sesión activa en `useAuthStore`), la aplicación **no monta el Dashboard ni el Lienzo**.
     - En su lugar, se renderiza la pantalla de autenticación central con diseño de alta gama y fondo blur envolvente.
   - **`src/components/auth/AuthModal.tsx`:**
     - Modo `gatekeeper`: Ocultar el botón `X` de cerrar y evitar el cierre por clic externo mientras no exista una sesión activa.
     - Opciones disponibles para el usuario:
       - **Botón Oficial de Google Login** (Acceso con 1-clic con `egdeprada@gmail.com` para administrador o cualquier usuario habilitado).
       - **Formulario de Email y Contraseña**.
       - **"¿Olvidaste tu contraseña?"**: Solicitar restablecimiento (queda en espera del código de 6 dígitos que el Administrador generará en su consola).
       - **"¿No tienes cuenta? Solicitar Habilitación"**: Formulario guiado de solicitud de acceso institucional.
3. **Ocultamiento Total de Lienzos No Asignados (*Zero-Visibility*):**
   - **`src/services/permissionService.ts`:**
     - `getAssignedProjectFileNamesSync(user)`: para usuarios `USER`, retornar estrictamente los lienzos con asignación activa en `['READ_ONLY', 'COMMENTS', 'EDITOR']`. Excluir todo lienzo desasignado o no vinculado. Para `ADMIN`, retornar `'ALL'`.
   - **`src/components/dashboard/ProjectDashboard.tsx`:**
     - Filtrar estrictamente `visibleProjects`.
     - Si `visibleProjects.length === 0`, desplegar un estado vacío institucional: *"No tienes lienzos asignados actualmente. Solicita asignación al Administrador del sistema para acceder a tus procesos."*
   - **`src/components/canvas/ProcessCanvas.tsx`:**
     - Salvaguarda: si `currentUser.role === 'USER'` y el lienzo abierto no cuenta con asignación válida, abortar la visualización y conmutar a la vista Dashboard con mensaje de denegación de acceso.
4. **Limpieza Estética y Supresión de Textos en el Modal de Acceso (PST-076):**
   - **`src/components/auth/AuthModal.tsx`:**
     - **Quitar subtítulo de cabecera:** Remover la línea *"Gobernanza, Roles y Calidad ISO 9001"*, dejando la cabecera limpia con el título principal.
     - **Simplificar campo de contraseña:**
       - Cambiar la etiqueta a **"CONTRASEÑA"** (removiendo *"O CÓDIGO DE 6 DÍGITOS"*).
       - Cambiar el placeholder a **"••••••••"** (removiendo *"o código de 6 dígitos"*).
       *(Nota: si el usuario ingresa su código provisorio de 6 dígitos en este campo, el sistema seguirá reconociéndolo internamente para forzar el cambio de clave, pero sin exponerlo en el texto).*
     - **Limpiar botón de Google:** Texto canónico oficial **"Continuar con Google"** (sin correos entre paréntesis).
     - **Eliminar pie informativo:** Quitar por completo el texto *"El correo egdeprada@gmail.com ingresa automáticamente como ADMIN"*.
     - **Flujo Estándar Canónico de Google Sign-In:** Al pulsar *"Continuar con Google"*, se activa el selector/flujo normal de Google (Google Identity Services / selector oficial de cuenta). El servicio procesa el resultado internamente sin exponer credenciales en la interfaz.
   - **`src/components/dashboard/ProjectDashboard.tsx`:**
     - En el estado vacío para usuarios sin procesos, mantener la leyenda formal sin correos particulares: *"Actualmente no cuentas con lienzos habilitados para lectura, comentarios o edición. Solicita al Administrador del Sistema la asignación correspondiente de tus procesos."*
   - **`src/services/authService.ts`:**
     - Reconocimiento administrativo interno y transparente para `egdeprada@gmail.com` tras la autenticación de Google, sin pre-condicionar ni exhibir el correo en la interfaz pública.
5. **Integración en Vivo de Google OAuth 2.0 con Redirección a accounts.google.com y Captura de Token (PST-077):**
   - **`.env`:** Registrar el identificador oficial de cliente provisto:  
     `VITE_GOOGLE_CLIENT_ID=724069436598-8pqlisa1k2cv3u8ik2t252pdmtm79n1u.apps.googleusercontent.com`
   - **`src/components/auth/AuthModal.tsx`:**
     - Al pulsar *"Continuar con Google"*, el sistema construye la URL oficial de Google OAuth 2.0 y redirige el navegador directamente a:  
       `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=email%20profile%20openid&prompt=select_account`
     - El usuario experimenta la pantalla nativa de inicio de sesión y consentimiento de Google (`accounts.google.com`).
   - **`src/services/googleAuthService.ts` / `src/store/useAuthStore.ts` / `App.tsx`:**
     - Al retornar Google con el fragmento de URL `#access_token=...`:
       1. Extrae de forma segura el access token.
       2. Limpia la barra de direcciones con `history.replaceState`.
       3. Realiza la consulta a la API de perfil oficial de Google (`https://www.googleapis.com/oauth2/v3/userinfo`).
       4. Transfiere el perfil verificado `{ email, fullName, googleId, avatarUrl }` a `AuthService.loginWithGoogle()`.
       5. Si el correo devuelto es `egdeprada@gmail.com`, accede de inmediato como **`ADMIN`**; si es otro usuario habilitado, como **`USER`**.
6. **Indicador de Versión Dinámica Global en Esquina Inferior Derecha (PST-078) [✅ IMPLEMENTADO]:**
   - **`src/constants/version.ts`:**
     - Definir la fuente única de verdad del versionado semántico corporativo: `APP_VERSION = '1.5.1'`.
     - Exportar helper `getFormattedAppVersion()` que retorna el formato canónico solicitado: `V 01.05.01` (con padding de dos dígitos por segmento `xx.xx.xx`).
   - **`package.json`:**
     - Sincronizar el campo `"version": "1.5.1"`.
   - **`src/components/common/VersionBadge.tsx`:**
     - Componente sutil, estético y no obstructivo anclado en la esquina inferior derecha (`fixed bottom-2.5 right-3.5 z-40`).
     - Tipografía monoespaciada legible, fondo translúcido suave con borde tenue para adaptarse tanto a fondos claros como oscuros, sin colisionar con botones ni paneles.
   - **`src/App.tsx`:**
     - Renderizar `<VersionBadge />` de forma omnipresente: visible tanto en el portal de acceso/login (Gatekeeper) como en el espacio de trabajo principal de ProcesStudio.
   - **Criterio de Incremento Semántico a partir de ahora:**
     - **Mayor (`XX.00.00`):** Cambios de arquitectura mayores o rediseños estructurales.
     - **Menor (`01.XX.00`):** Incorporación de nuevos módulos o funcionalidades de peso.
     - **Parche (`01.05.XX`):** Correcciones, ajustes de interfaz, optimizaciones y evoluciones puntuales.
7. **Alta y Edición Integral de Usuarios por el Administrador (PST-079) [✅ IMPLEMENTADO]:**
   - **`src/services/authService.ts`:**
     - Incorporar método `createUserByAdmin(adminUser: AppUser, data: CreateUserPayload)`:
       - Valida que `adminUser.role === 'ADMIN'`.
       - Valida formato de correo y que no exista previamente en `app_users` (Neon y local).
       - Permite definir contraseña directa (hash con `hashPassword`) o generar código provisorio de 6 dígitos con `must_change_password = true` y expiración a 7 días.
       - Inserta el registro en Neon PostgreSQL (`app_users`) y en `localStorage`.
       - Registra evento de auditoría `USER_CREATED_BY_ADMIN`.
     - Incorporar método `updateUserByAdmin(adminUser: AppUser, targetUserId: string, data: UpdateUserPayload)`:
       - Valida permisos administrativos.
       - Salvaguarda: impide que el administrador en sesión activa se desactive o se degrade a sí mismo de `ADMIN` a `USER`.
       - Valida no duplicidad de correo en caso de actualización de email.
       - Actualiza campos: `full_name`, `organization_unit`, `role`, `status`, y opcionalmente `password_hash` / `must_change_password`.
       - Si el usuario editado es el usuario actual, refresca el estado en `useAuthStore`.
       - Registra evento de auditoría `USER_UPDATED_BY_ADMIN` con el detalle de campos modificados.
   - **`src/components/admin/UserFormModal.tsx`:**
     - Modal dedicado con diseño premium, tabs y validaciones:
       - Modo **Crear**: Título *"Alta de Nuevo Usuario Corporativo"*, campos limpios, selector de rol (`ADMIN` / `USER`), selector de área/dependencia y opción de clave (Código provisorio de 6 dígitos o Contraseña manual).
       - Modo **Editar**: Título *"Modificación de Usuario"*, precarga de datos, badges de estado, toggles de estado y clave.
   - **`src/components/admin/AdminConsoleModal.tsx`:**
     - En la cabecera de la pestaña *"Usuarios & Claves"*, incorporar botón destacado **"+ Nuevo Usuario"** con icono `UserPlus`.
     - En cada fila de la tabla de usuarios, incorporar botón **"Editar"** con icono `Pencil` junto a las acciones existentes.
     - Diálogo de éxito con código de 6 dígitos en caso de que se haya seleccionado contraseña temporal generada.
   - **Incremento de Versión Semántica:**
     - Elevar versión de la aplicación a `1.6.0` (indicador `V 01.06.00`).
   - **Sincronización:**
     - Compilación limpia (`npm run build`), registro de 79 historias de usuario en Excel y auto-push Git.

8. **Gestión Descentralizada de Participantes y Permisos desde el Proyecto (PST-080) [✅ IMPLEMENTADO]:**
   - **`src/types/project.ts`:**
     - Enriquecer `ProjectDocumentControl` y `ProjectSummary` con campos opcionales `createdByEmail?: string` y `createdByUserId?: string` para trazabilidad de autoría.
   - **`src/services/permissionService.ts`:**
     - Implementar `canUserManageProjectParticipants(user: AppUser | null, project: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null): boolean`: valida si el usuario es `ADMIN` o el creador del proyecto.
     - Adaptar `assignPermission` y `removePermission` para permitir la ejecución tanto a `ADMIN` como al creador del proyecto validado.
     - Incorporar método `listProjectParticipants(projectFileName: string)` que cruza las asignaciones activas con los perfiles en `app_users` devolviendo nombre, email, área y nivel de permiso.
   - **`src/components/modals/ProjectParticipantsModal.tsx`:**
     - Modal dedicado de gobernanza por proyecto:
       - Cabecera con datos del proceso: Título, Código (`PRC-XXXX`), Versión y Creador.
       - Lista de participantes con avatar, área y selector de nivel (`READ_ONLY`, `COMMENTS`, `EDITOR`).
       - Botón de remoción de participante (con protección del creador).
       - Sección para agregar nuevo participante con buscador de usuarios y asignación con 1-clic.
   - **`src/components/dashboard/ProjectCard.tsx`:**
     - En el pie de acciones, junto a Duplicar y Eliminar, incorporar botón con icono `Users` ("Participantes y Permisos"), condicionado a `canManageParticipants`.
   - **`src/components/layout/Header.tsx`:**
     - En la barra superior del lienzo, incorporar botón "Participantes" cuando el proyecto está activo, permitiendo gestionar los accesos sin salir al Dashboard.
   - **`src/components/modals/NewProjectModal.tsx` & `src/store/useProjectStore.ts`:**
     - Al crear un proyecto, sellar `createdByEmail: currentUser.email`, `createdByUserId: currentUser.id` y conceder automáticamente permiso `EDITOR` al creador en la base de datos.
   - **Incremento de Versión Semántica:**
     - Versión de la aplicación elevada a `1.7.0` (indicador `V 01.07.00`).
   - **Sincronización:**
     - Compilación limpia (`npm run build`), registro de 80 historias de usuario en Excel y auto-push Git.

9. **Edición de Metadatos del Proyecto por el Dueño y Limpieza Visual de Interfaz (PST-081) [✅ IMPLEMENTADO]:**
   - **1. Edición de Datos de la Tarjeta del Proyecto por el Dueño / Administrador:**
     - **Componente Modal `src/components/modals/EditProjectModal.tsx`:**
       - Formulario modal guiado con estilo Antigravity IDE (glassmorphism, animaciones fluidas).
       - Campos editables:
         - **Título Formal del Procedimiento** (`documentTitle`)
         - **Código Documental** (`documentCode`) (ej. `PRC-9413`)
         - **Responsable / Autor del Modelado** (`authorName`)
         - **Unidad Organizativa / Dependencia** (`organizationUnit`)
         - **Objetivo / Alcance del Proceso** (`processObjective`)
       - Carga de datos directamente del archivo JSON con `StorageService.loadProject(fileName)`.
       - Al guardar:
         - Actualiza los campos de `documentControl` en el objeto del proyecto.
         - Sincroniza el nombre y organización de la piscina principal (`pool_1.name = documentTitle`, `organization = organizationUnit`).
         - Guarda los cambios en disco/almacenamiento mediante `StorageService.saveProject(updatedProject)`.
         - Si el proyecto editado coincide con el proyecto activo en lienzo (`currentProject.fileName === fileName`), actualiza reactivamente el estado en `useProjectStore` para sincronizar la interfaz sin recargas.
         - Refresca el listado de proyectos con `refreshProjectList()`.
         - Registra el evento de auditoría `PROJECT_METADATA_UPDATED`.
     - **Integración en `src/components/dashboard/ProjectCard.tsx`:**
       - Condicionar la acción a `canManage = PermissionService.canUserManageProjectParticipants(currentUser, group)` (habilitado para Administradores y Dueño/Creador del proyecto).
       - Agregar botón con icono `Pencil` en el pie de la tarjeta (junto a Duplicar, Eliminar, Participantes y Abrir).
       - Agregar botón de edición rápida (Pencil) junto al título en la tarjeta al hacer hover.
     - **Integración en `src/components/layout/Header.tsx`:**
       - Permitir al dueño o administrador abrir el modal de edición de metadatos directamente haciendo clic en el título o en un icono `Pencil` junto al título del proyecto en la barra superior.
   - **2. Limpieza del Logo Corporativo (`src/components/common/LogoPS.tsx`):**
     - Retirar el badge `"v2.9"`.
     - Retirar el texto de subtítulo `"BPMN 2.0 • ISO 9001:2015"`.
     - Mantener el imagotipo estilizado PS y la marca tipográfica `"Proces"` + `"Studio"`.
   - **3. Remoción de Botones "Base de Datos" y "Almacenamiento" (`src/components/dashboard/ProjectDashboard.tsx`):**
     - Eliminar el botón `"Base de Datos"` de la barra de acciones superior del Dashboard.
     - Eliminar el botón `"Almacenamiento"` / `"Abrir Carpeta"` de la barra de acciones superior del Dashboard.
     - Mantener los botones operativos limpios: `"Actualizar"` (Refresh), `"Importar JSON"` y `"+ Nuevo Proyecto"`.
   - **4. Remoción del Cartel "Neon PostgreSQL Cloud • Activo" y Depuración del Subtítulo (`src/components/dashboard/ProjectDashboard.tsx`):**
     - Eliminar el bloque/badge superior que muestra `"Neon PostgreSQL Cloud • Activo"` (y los badges alternativos de entorno web/portable).
     - Depurar el subtítulo debajo de `"Gestor de Proyectos de Procesos"` removiendo `" desde cualquier computador en la nube"`, dejando el texto limpio:  
       *"Modelado, visualización y auditoría de procesos BPMN 2.0 e ISO 9001:2015."*
   - **5. Remoción de la Línea Vertical al lado de "Consola Admin" (`src/components/layout/Header.tsx`):**
     - Retirar la clase de borde `border-l border-theme-border/70` y el padding lateral en el contenedor previo a `"Consola Admin"`, logrando una transición visual despejada y sin separadores residuales.
   - **Incremento de Versión Semántica:**
     - Elevar versión de la aplicación a `1.8.0` (indicador `V 01.08.00`).
   - **Sincronización:**
     - Compilación limpia (`npm run build`), registro de 81 historias de usuario en Excel (`PST-081`) y auto-push Git tras aprobación.

10. **Rediseño de Layout y Cabecera Ergonómica (PST-082 - Versión 1.9.0) [✅ IMPLEMENTADO]:**
   - **Diagnóstico del Estado Actual:**
     - El encabezado superior (`Header.tsx`) presentaba una marcada descompensación en pantallas de escritorio: grandes vacíos negativos entre el logotipo y el selector central de vistas, mientras que el extremo derecho concentraba múltiples contenedores rectangulares inconexos (`[Carpeta | Paleta | Tema]`, `[+]`, `[Consola Admin]`, `[Usuario]`, `[Logout]`).
     - Al alternar entre el Dashboard (sin proyecto) y el Lienzo (con proyecto cargado), la barra sufría saltos bruscos de contenido y acumulación de botones.
   - **Propuestas de Diseño y Disposición Presentadas al Usuario:**
     - **Opción 1: "Studio Balanced" (Clúster Unificado & Menú de Perfil Integrado - Estilo Figma / Linear) [SELECCIONADA POR EL USUARIO]:**
       - **Izquierda:** Logo corporativo `[PS ProcesStudio]` + Badge contextual en Dashboard (`Gestor de Procesos & BPMN 2.0`) / Breadcrumb interactivo del proyecto activo con ficha, chip de versión y permiso.
       - **Centro:** Cápsula de navegación segmentada centrada y balanceada `[ Proyectos ]` | `[ Lienzo BPMN ]` | `[ Vistas & Matrices ▾ ]` (+ menú de `Herramientas ▾` contextual).
       - **Derecha:** Clúster de acciones de trabajo agrupadas (`[Deshacer/Rehacer]`, `[Exportar]`, `[Participantes]`, `[Guardar]`) + Botón destacado `[+ Nuevo Proceso]` + **Menú Desplegable de Usuario Integrado** (`UserProfileMenu.tsx`).
       - **Menú de Perfil de Usuario (`UserProfileMenu.tsx`):** Avatar interactivo con inicial/foto + nombre + rol que al hacer clic despliega ordenadamente: *Tarjeta de usuario, Consola Admin (destacada si es ADMIN), Selector de Modo Oscuro/Claro, Selector de Temas Antigravity, Abrir Carpeta Local y Cerrar Sesión*, eliminando por completo el amontonamiento de botones sueltos en la barra.
     - **Opción 2: "Workbench Pro" (Alineación por Flujo de Trabajo Natural - Estilo VS Code / Miro).**
     - **Opción 3: "Top Executive" (Barra Dual / Jerarquía de 2 Niveles - Estilo Microsoft 365 / Lucidchart).**
   - **Criterios Técnicos de Implementación Cumplidos:**
     - Creación de `src/components/layout/UserProfileMenu.tsx` con accesibilidad, click-outside y glassmorphism.
     - Refactorización de `src/components/layout/Header.tsx` para eliminar contenedores redundantes e integrar la navegación balanceada.
     - Transiciones fluidas en hover/focus con tokens CSS del tema activo.
     - Incremento de versión semántica a `1.9.0` (indicador visual `V 01.09.00`).
     - Sincronización de 82 historias de usuario en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` (`PST-082`), compilación limpia (`npm run build`) y auto-push Git tras la aprobación.

---

## 11. Plan Maestro de Desarrollo Final (Versión 2.0): Los 6 Pilares Estratégicos

Con el objetivo de consolidar a **ProcesStudio** como la plataforma definitiva para graficar y documentar procesos ahorrando días enteros de trabajo operativo, se establece la presente **Hoja de Ruta de Desarrollo Final**, estructurada en **6 Pilares Fundamentales** más una batería de sugerencias de alto impacto:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                 PROCESSTUDIO 2.0 - ARQUITECTURA DE DESARROLLO FINAL                      │
├───────────────────────────────────────────┬──────────────────────────────────────────────┤
│ 1. GRAFICACIÓN ULTRA-OPTIMIZADA           │ 2. DOCUMENTACIÓN PDF AUTOMATIZADA (ISO 9001) │
│ • Generador IA: Texto/Voz ➔ Diagrama BPMN │ • Ficha Complementaria Editable + Auto-IA    │
│ • Magic Auto-Layout (Alineación 1-Clic)   │ • Compilador PDF Nativo Integral (jspdf):    │
│ • Biblioteca de Plantillas Reutilizables  │   Portada + Mapa + Pasos + SIPOC + RACI + QR │
├───────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 3. GOBERNANZA TOTAL DE USUARIOS Y ROLES   │ 4. CENTRO MAESTRO DE ABMs CORPORATIVOS       │
│ • Ciclo de vida completo de Usuarios      │ • ABM Unidades Organizativas / Dependencias  │
│ • Permisos por Área / Grupo Organizativo  │ • ABM Roles / Cargos (Carriles Estándar)     │
│ • Flujo de Aprobación y Firma Documental  │ • ABM Normativas / Leyes y Sistemas / Forms  │
│ • Reasignación de Procesos Huérfanos      │ • ABM Riesgos Tipo + Papelera de Proyectos   │
├───────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 5. UX AMIGABLE Y VELOCIDAD DE USO         │ 6. TUTORIAL INTERACTIVO & ACADEMIA INTEGRADA │
│ • Autocompletado desde ABMs en 1 clic     │ • Tour Guiado Interactivo (Spotlight Paso a  │
│ • Paleta Rápida de Comandos (Ctrl + K)    │   Paso sobre la interfaz real)               │
│ • Medidor de Salud Documental (%)         │ • Centro de Aprendizaje Ilustrado por Temas  │
└───────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

### Pilar 1: Optimización Extrema de Herramientas de Graficación en el Lienzo (`PST-083`)
*(Diagnóstico: El lienzo ya cuenta con paleta BPMN 2.0, carriles dinámicos, asistente radial IA, compresión de subprocesos, simulación y modo presentación. Se proponen 3 aceleradores clave para reducir de horas a minutos el armado inicial de cualquier diagrama).*

1. **Generador Automático de Diagramas desde Texto o Voz ("Texto a BPMN con 1 Clic" - `TextToDiagramModal.tsx`):**
   - El usuario pega un borrador de relevamiento, escribe una descripción libre (ej. *"El ciudadano presenta el reclamo en Mesa de Entradas, luego Legales revisa si cumple requisitos; si cumple pasa a Resolución, si no se archiva"*) o usa un audio grabado en la Bóveda.
   - El motor analiza el texto y **construye automáticamente en el lienzo** los carriles funcionales (`Swimlanes`), el evento de inicio, las tareas secuenciales, las compuertas de decisión con sus caminos *"Sí / No"*, los SLAs estimados y el evento de fin.
2. **Embellecedor y Auto-Alineación Matemática con 1 Clic ("Magic Auto-Layout"):**
   - Botón directo en la barra del lienzo: **`✨ Auto-Ordenar Lienzo`**.
   - Algoritmo topológico que distribuye horizontalmente las actividades de izquierda a derecha según su secuencia lógica, centra verticalmente cada nodo dentro de su carril correspondiente, ajusta automáticamente el ancho/alto de los carriles y limpia cruces innecesarios de conectores.
3. **Biblioteca de Plantillas de Procesos Pre-Armadas (`ProcessTemplatesModal.tsx`):**
   - Posibilidad de iniciar un proyecto desde una **Plantilla Estándar** (ej. *Proceso de Compras / Contrataciones*, *Atención de Reclamos / Mesa de Entradas*, *Aprobación de Expedientes / Dictamen Legal*, *Onboarding de Personal*) o **Guardar cualquier lienzo actual como Plantilla Corporativa** reutilizable por el equipo.

---

### Pilar 2: Generador Automatizado de Documentación Estandarizada en PDF (`PST-084`)
*(Objetivo: Que el usuario no tenga que redactar en Word ni maquetar manualmente. Todo lo graficado + una sección complementaria asistida se transforma con 1 clic en el Manual Oficial de Procedimientos en PDF).*

1. **Sección de Información Complementaria del Documento ("Ficha Enriquecida del Manual" en `TechnicalReportView.tsx`):**
   - Se incorpora un panel editable y persistente dentro del proyecto (`documentControl.manualMetadata`) donde el usuario puede agregar o completar (con botón **"✨ Autocompletar con IA según lo graficado"**):
     - **Alcance Detallado** (Dónde inicia y dónde termina operativamente el procedimiento).
     - **Definiciones, Siglas y Glosario Técnico**.
     - **Políticas de Operación y Reglas de Negocio Generales**.
     - **Indicadores Clave de Desempeño (KPIs sugeridos y métricas de SLA)**.
     - **Anexos, Formularios y Registros Vinculados**.
     - **Cuadro de Responsabilidades de Firma** (*Elaboró*, *Revisó*, *Aprobó* con cargo y fecha).
2. **Motor Compilador de Manual Oficial en PDF Nativo (`src/services/pdfFullManualExportService.ts`):**
   - Basado en `jspdf` (generación directa de archivo `.pdf` descargable sin depender de la impresión del navegador, con foliado exacto `Página X de Y`, encabezados normativos ISO 9001 en todas las hojas y tabla de contenidos automática).
   - **Estructura Estandarizada del PDF Generado Automáticamente:**
     - **Sección 1 — Portada y Ficha de Control Documental:** Membrete institucional, Código, Versión, Vigencia, Unidad Organizativa, Autor, Estado de Aprobación y Cuadro de Firmas.
     - **Sección 2 — Identificación del Proceso:** Objetivo, Alcance, Marco Normativo / Legal aplicable, Glosario y Políticas de Operación.
     - **Sección 3 — Mapa Gráfico del Proceso (Diagrama BPMN 2.0):** Renderizado vectorial/alta resolución del diagrama graficado en el lienzo, ajustado automáticamente a página.
     - **Sección 4 — Descripción Detallada de Actividades (Paso a Paso):** Tabla secuencial e inventario detallado agrupado por Carril/Responsable, indicando para cada nodo: *N° de Paso, Nombre de Actividad, Tipo BPMN, Área/Rol Responsable, Descripción Operativa, Tiempo SLA, Sistemas/Formularios utilizados, Entradas/Salidas, Nivel de Riesgo y Punto de Control*.
     - **Sección 5 — Matrices de Calidad Automatizadas:**
       - **Matriz SIPOC** completa (Proveedores, Entradas, Proceso, Salidas, Clientes).
       - **Matriz RACI** de roles y responsabilidades (*Responsable, Aprobador, Consultado, Informado*).
       - **Matriz de Riesgos Operativos y Controles de Calidad**.
     - **Sección 6 — Historial de Versiones y Sello Criptográfico SHA-256:** Tabla de control de cambios y pie de certificación de integridad.

---

### Pilar 3: Gestión Completa de Usuarios, Roles, Grupos y Ciclo de Aprobación (`PST-085`)
*(Diagnóstico: Ya existe Auth Gatekeeper, Google Sign-In, Reseteo por Admin con 6 dígitos, 2FA, matriz por lienzo y auditoría. Se completa el ciclo empresarial de usuarios y permisos).*

1. **ABM Integral del Ciclo de Vida de Usuarios (en `AdminConsoleModal.tsx`):**
   - **Alta, Modificación, Suspensión Temporal (`INACTIVE`), Bloqueo (`BLOCKED`) y Baja Segura / Eliminación de Usuarios** con asistente de **Reasignación de Propiedad**: si se elimina o desactiva un usuario que era creador de proyectos, el sistema permite transferir la titularidad de sus procesos a otro usuario o al Administrador con un clic.
   - **Buscador multicriterio, filtros por Unidad Organizativa, Rol y Estado**, y exportación del padrón de usuarios a Excel/PDF.
2. **Permisos por Unidad Organizativa / Grupos de Trabajo:**
   - Posibilidad de asignar permisos de un proyecto (`Solo Lectura`, `Comentarios` o `Editor`) **a toda una Unidad Organizativa completa** (ej. *"Asignar modo Lectura a toda la Dirección de Recursos Humanos"*), además de la asignación individual por usuario.
3. **Flujo de Aprobación y Ciclo de Vida del Proceso Gobernable:**
   - Transición formal de estados del proyecto controlada por permisos:
     - `DRAFT` (*Borrador*) ➔ `IN_REVIEW` (*En Revisión*) ➔ `APPROVED` (*Aprobado*) ➔ `EFFECTIVE` (*Vigente / Publicado*).
   - Cuando un proceso pasa a estado `APPROVED` o `EFFECTIVE`, queda protegido contra ediciones accidentales salvo que se genere formalmente una **Nueva Revisión / Versión** (`v1.1`, `v2.0`), dejando constancia en el log de auditoría inmutable.

---

### Pilar 4: Desarrollo Completo de ABMs Maestros para Toda la Aplicación (`PST-086`)
*(Objetivo: Eliminar la carga manual repetitiva y estandarizar los datos en toda la organización mediante catálogos corporativos administrables con Altas, Bajas y Modificaciones).*

Se creará el módulo **"Catálogos Maestros (ABMs)"** (`src/components/catalogs/MasterCatalogsModal.tsx` y `src/services/masterCatalogsService.ts`), accesible desde la barra superior y sincronizado con **Neon PostgreSQL** + caché local:

| # | Catálogo Maestro (ABM) | Atributos Administrables (Alta / Baja / Modificación) | Impacto y Automatización en el Lienzo y PDF |
| :--- | :--- | :--- | :--- |
| **1** | **Unidades Organizativas / Dependencias** | Código (`UO-01`), Nombre de Dependencia/Secretaría, Unidad Superior, Responsable/Titular, Color identificatorio, Estado. | Alimenta el selector de área al crear/editar Proyectos, Usuarios y Piscinas (`Pools`) sin tipear a mano. |
| **2** | **Roles y Cargos Funcionales (Swimlanes)** | Código (`ROL-01`), Nombre del Cargo/Puesto, Unidad Organizativa, Responsabilidades base, Costo/Hora (para Simulación). | Permite agregar Carriles (`Swimlanes`) al lienzo eligiendo directamente del catálogo de cargos oficiales. |
| **3** | **Marco Normativo, Leyes y Estándares** | Código/N° Norma (ej. `Ley 24.449`, `ISO 9001:2015`), Título, Tipo (*Ley, Decreto, Ordenanza, Resolución, Norma*), Resumen, Estado. | Permite vincular normas con 1 clic tanto a la Ficha del Proceso como a cualquier actividad del lienzo. |
| **4** | **Sistemas, Formularios y Documentos** | Código (`FOR-001`, `SIS-GEDO`), Nombre, Categoría (*Sistema Informático, Formulario, Expediente, Planilla*), Soporte (*Digital / Papel*). | Alimenta las Entradas/Salidas del inspector de nodos y construye automáticamente la Matriz SIPOC. |
| **5** | **Catálogo de Riesgos y Controles Tipo** | Código (`RSG-01`), Descripción del Riesgo, Nivel de Impacto (*Bajo, Medio, Alto, Crítico*), Control Mitigante Estándar. | Permite asignar riesgos y puntos de control a las tareas en segundos desde un selector preconfigurado. |
| **6** | **Plantillas y Papelera de Proyectos** | Gestión ABM de Plantillas de Procesos + **Papelera de Reciclaje** (*Soft-Delete*) para restaurar proyectos eliminados o purgarlos definitivamente. | Evita pérdidas accidentales de trabajo y acelera el alta de nuevos procesos repetitivos. |

---

### Pilar 5: Usabilidad Amigable, Velocidad Operativa y Asistencia Inteligente (`PST-087`)
*(Objetivo: Que cualquier usuario —incluso sin conocimientos técnicos profundos de BPMN— sienta que el sistema lo lleva de la mano).*

1. **Integración de Selectores Rápidos ABM en el Panel de Propiedades (`RightSidebar.tsx`):**
   - Al seleccionar cualquier tarea en el lienzo, los campos de *Rol/Carril, Normativa aplicable, Documentos de Entrada/Salida, Sistemas y Puntos de Control* tendrán **selectores desplegables conectados a los ABMs Maestros** (con opción de `+ Crear nuevo ítem al vuelo`), ahorrando hasta un 70% de tipeo.
2. **Medidor de Completitud y Salud del Proceso ("Process Readiness Score"):**
   - Indicador visual amigable (0% a 100%) en la cabecera del reporte/lienzo que evalúa en tiempo real si el proceso está listo para publicarse en PDF (ej. *¿Tiene inicio y fin? ¿Todas las tareas tienen responsable y tiempo SLA? ¿Se definió el objetivo?*), con botones de acción directa para completar lo faltante.
3. **Buscador Global y Paleta de Comandos Rápida (`Ctrl + K` - `CommandPaletteModal.tsx`):**
   - Un buscador instantáneo al presionar `Ctrl + K` (o desde un botón en la barra superior) que permite saltar en 1 segundo a cualquier proyecto, nodo dentro del lienzo actual, vista (SIPOC, RACI, Manual PDF), catálogo ABM o acción de exportación.

---

### Pilar 6: Tutorial Interactivo y Centro de Aprendizaje ("Academia ProcesStudio") (`PST-088`)
*(Objetivo: Que cualquier nuevo usuario aprenda a dominar el sistema en menos de 3 minutos sin necesidad de capacitación externa).*

1. **Recorrido Guiado Interactivo sobre la Pantalla Real (*Interactive Spotlight Tour* - `InteractiveTourOverlay.tsx`):**
   - Asistente paso a paso con foco iluminado (*spotlight*) que señala cada sector real de la interfaz con explicaciones breves y amigables:
     - **Paso 1:** *Gestión de Proyectos y Permisos* (Cómo crear o abrir un proceso y gestionar participantes).
     - **Paso 2:** *Paleta de Herramientas BPMN y Carriles* (Cómo arrastrar tareas, decisiones, notas y agregar áreas/roles).
     - **Paso 3:** *El Lienzo Inteligente y Auto-Diseño* (Cómo conectar elementos, usar el menú radial de IA y auto-ordenar el diagrama).
     - **Paso 4:** *Ficha Técnica, SLAs y Bóveda de Contexto* (Cómo cargar tiempos, riesgos, normas y audios).
     - **Paso 5:** *Vistas Automáticas (SIPOC / RACI) y Manual PDF* (Cómo obtener toda la documentación estandarizada en 1 clic).
     - **Paso 6:** *Catálogos Maestros (ABMs)* (Cómo reutilizar áreas, cargos, sistemas y normativas).
   - Se ofrece automáticamente en el primer ingreso del usuario y puede iniciarse en cualquier momento desde el botón **`🎓 Tutorial`** en la cabecera o menú de usuario.
2. **Centro de Ayuda y Guía Rápida Ilustrada (`TutorialCenterModal.tsx`):**
   - Modal estructurado en cápsulas visuales de lectura rápida (menos de 1 minuto por tema):
     - 🚀 **Guía de 5 Pasos:** De cero al Manual PDF en 5 minutos.
     - 🧩 **Diccionario Visual BPMN 2.0:** Qué significa cada figura (Tarea, Compuerta Exclusiva/Paralela, Subproceso, Evento, Nota) con ejemplos claros.
     - 📄 **Cómo generar el Manual PDF Perfecto:** Consejos para que las tablas SIPOC, RACI y descripciones salgan completas.
     - ⌨️ **Atajos de Teclado y Trucos de Productividad** (`Ctrl+S`, `Ctrl+Z`, `Ctrl+K`, `F5` Presentación, Selección múltiple).

---

## 12. Nuevas Historias de Usuario Planificadas (`PST-083` a `PST-088`)

```javascript
[
  {
    id: 'PST-083',
    modulo: 'Lienzo BPMN & Optimización IA',
    titulo: 'Generador de Diagramas desde Texto/Voz, Auto-Layout con 1 Clic y Biblioteca de Plantillas',
    historiaUsuario: 'Como analista de procesos, quiero generar un diagrama BPMN completo a partir de una descripción de texto o voz, contar con un botón de auto-alineación inteligente y disponer de plantillas reutilizables, para ahorrar horas de diagramación manual.',
    criteriosAceptacion: '1. Modal "Texto a Diagrama BPMN" que transforma párrafos o transcripciones en carriles, nodos, compuertas y conectores.\n2. Botón "Auto-Ordenar Lienzo" que organiza topológicamente los nodos por carril sin superposiciones.\n3. Biblioteca de plantillas pre-armadas y opción de guardar el proceso actual como plantilla corporativa.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-084',
    modulo: 'Documentación & Exportación PDF ISO 9001',
    titulo: 'Motor Automatizado de Manual de Procedimientos Estandarizado en PDF y Ficha Complementaria',
    historiaUsuario: 'Como responsable de calidad y documentación, quiero contar con una sección para completar datos complementarios del manual (con autocompletado asistido) y descargar con un solo clic un documento PDF nativo, foliado y estandarizado que unifique portada, control documental, mapa gráfico, descripción paso a paso, matriz SIPOC, matriz RACI, riesgos y firmas, para automatizar al 100% la generación de manuales.',
    criteriosAceptacion: '1. Sección editable de información complementaria (Alcance, Glosario, Políticas de Operación, KPIs, Anexos y Cuadro de Firmas) con botón de autocompletado automático basado en el gráfico.\n2. Compilador PDF nativo (jspdf) que genera el Manual Oficial de Procedimientos completo sin depender de window.print().\n3. Inclusión automática de Portada ISO 9001, Diagrama BPMN en alta resolución, Tabla secuencial de actividades por rol/carril, Matriz SIPOC, Matriz RACI, Riesgos/Controles e Historial de Versiones.\n4. Encabezados estandarizados en cada página, foliado "Página X de Y" y sello de integridad SHA-256.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-085',
    modulo: 'Gobernanza, Usuarios & Ciclo Documental',
    titulo: 'ABM Completo de Usuarios con Reasignación, Permisos por Unidad Organizativa y Flujo de Aprobación',
    historiaUsuario: 'Como administrador de ProcesStudio, quiero gestionar el ciclo de vida completo de usuarios (incluyendo baja con reasignación de procesos), otorgar permisos por Unidad Organizativa completa y controlar el flujo de estados de aprobación de los procesos (Borrador, En Revisión, Aprobado, Vigente), para asegurar una gobernanza empresarial sin fisuras.',
    criteriosAceptacion: '1. Baja/eliminación segura de usuarios con asistente para reasignar sus lienzos creados.\n2. Asignación masiva de permisos de lienzo por Unidad Organizativa / Área.\n3. Selector y flujo de cambio de estado documental (DRAFT, IN_REVIEW, APPROVED, EFFECTIVE) con bloqueo de edición en versiones publicadas y registro en auditoría.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-086',
    modulo: 'Catálogos Maestros & ABMs',
    titulo: 'Centro Maestro de ABMs Corporativos (Unidades, Cargos, Normativas, Sistemas, Riesgos y Papelera)',
    historiaUsuario: 'Como administrador o modelador, quiero contar con un módulo completo de ABMs (Altas, Bajas y Modificaciones) para Unidades Organizativas, Roles/Cargos, Leyes/Normativas, Sistemas/Formularios, Riesgos Tipo y Papelera de Proyectos, para estandarizar la información en toda la aplicación y seleccionarla sin volver a escribirla.',
    criteriosAceptacion: '1. Módulo MasterCatalogsModal con pestañas CRUD completas para: Unidades Organizativas, Cargos/Roles, Marco Normativo, Sistemas/Formularios y Riesgos/Controles.\n2. Persistencia en Neon PostgreSQL y sincronización local con datos semilla institucionales.\n3. Papelera de reciclaje de proyectos con opción de Restaurar o Eliminar definitivamente.\n4. Búsqueda, filtrado y validación de integridad en todos los ABMs.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-087',
    modulo: 'Usabilidad & Experiencia de Usuario (UX)',
    titulo: 'Autocompletado desde ABMs en Propiedades, Medidor de Completitud y Paleta Rápida (Ctrl+K)',
    historiaUsuario: 'Como usuario del sistema, quiero seleccionar cargos, normas, sistemas y riesgos desde desplegables conectados a los ABMs, visualizar un indicador porcentual de completitud del proceso y usar un buscador rápido (Ctrl+K), para trabajar de forma intuitiva, rápida y amigable.',
    criteriosAceptacion: '1. Selectores inteligentes en el panel derecho de propiedades (RightSidebar) y modales de proyecto conectados a los Catálogos ABM.\n2. Indicador visual "Salud Documental del Proceso (%)" que informa qué datos faltan para un manual perfecto.\n3. Paleta de comandos rápida (Ctrl+K) para buscar proyectos, nodos, vistas y herramientas al instante.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  },
  {
    id: 'PST-088',
    modulo: 'Capacitación & Onboarding',
    titulo: 'Tutorial Interactivo Paso a Paso (Spotlight Tour) y Centro de Aprendizaje Ilustrado',
    historiaUsuario: 'Como usuario nuevo o recurrente de ProcesStudio, quiero contar con un recorrido interactivo guiado que me explique paso a paso cómo usar cada parte de la pantalla, junto con un manual visual rápido de símbolos BPMN y generación de PDF, para aprender a utilizar el sistema en pocos minutos.',
    criteriosAceptacion: '1. Tour interactivo paso a paso (InteractiveTourOverlay) que resalta zonas clave de la interfaz (Proyectos, Paleta, Lienzo, Propiedades, Vistas/PDF y ABMs).\n2. Centro de Tutorial y Ayuda (TutorialCenterModal) con guía rápida de 5 minutos, glosario visual BPMN y atajos.\n3. Acceso directo desde un botón visible en la barra superior y desde el menú de perfil de usuario.',
    fechaImplementacion: '2026-10-30',
    estado: 'Implementado / Producción'
  }
];
```

---

## 13. Secuencia de Ejecución Propuesta (Fases de Trabajo)

Para abordar el desarrollo final de manera ordenada, limpia y verificable, se propone ejecutar el plan en **4 Etapas Consecutivas** (o en el orden de prioridad que indiques):

- **Etapa 1 — Centro Maestro de ABMs Corporativos y Gobernanza Completa (`PST-085` y `PST-086`):**
  Construcción de las tablas y servicios de ABMs (Unidades Organizativas, Roles/Cargos, Normativas, Sistemas/Formularios, Riesgos y Papelera), conexión con los formularios de la app y cierre del ciclo ABM de Usuarios y Estados de Aprobación.
- **Etapa 2 — Generador Automatizado de Documentación Estandarizada en PDF (`PST-084`):**
  Incorporación de la Ficha Complementaria editable (con autocompletado inteligente) en la vista de Documento y desarrollo del motor `pdfFullManualExportService.ts` que descarga el Manual de Procedimientos ISO 9001 completo en PDF (Portada + Datos + Mapa Gráfico + Paso a Paso + SIPOC + RACI + Riesgos + Firmas).
- **Etapa 3 — Aceleradores de Graficación y UX Amigable (`PST-083` y `PST-087`):**
  Generador de Diagrama BPMN desde Texto/Voz, botón `Auto-Ordenar Lienzo`, Biblioteca de Plantillas, Medidor de Completitud Documental (%) y Paleta Rápida `Ctrl+K`.
- **Etapa 4 — Tutorial Interactivo y Centro de Aprendizaje (`PST-088`):**
  Implementación del Tour Guiado Interactivo paso a paso (*Spotlight Onboarding*) y el Modal de Tutorial Ilustrado accesible en todo momento desde la cabecera.

---

## 14. Conclusión y Compromiso de Desarrollo

Este documento constituye la **Hoja de Ruta Maestra Oficial para el Desarrollo Final (Versión 2.0)** de ProcesStudio.

Todas las etapas se implementarán respetando rigurosamente:
1. **La aprobación previa del usuario sobre este `PLAN_ACCION.md`** antes de escribir o modificar código.
2. **La arquitectura 100% Web Cloud Nativa** (React + TypeScript + Vite + Neon PostgreSQL).
3. **La actualización del archivo Excel `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`** (`PST-069` a `PST-089`).
4. **La compilación limpia (`npm run build`) y el commit/push automático a Git tras cada entrega aprobada**.

---

## 15. Plan de Acción: Identidad Visual Dinámica por Temática — Logos Vectoriales, Paletas Cromáticas y Tipografía (`PST-089`)

### 15.1. Objetivo del Requerimiento
Alinear integralmente el isotipo/logotipo (`LogoPS`), las paletas de colores de las **6 temáticas oficiales** y la jerarquía tipográfica de **ProcesStudio** con la lámina de identidad visual proporcionada por el usuario, de modo que al cambiar entre cualquiera de los 6 temas (*ProcesStudio Slate Pro (Mate)*, *Midnight Executive*, *Forest Sage*, *Nebula Modern*, *Nordic Studio Light* y *Warm Sandpaper*), el logo, los colores de interfaz y las fuentes se adapten dinámicamente a la versión correspondiente de la imagen.

### 15.2. Análisis Técnico de la Imagen de Referencia

#### A. Isotipo Vectorial `PS` con Flujo de Procesos (SVG Dinámico)
El isotipo reemplazará el recuadro actual por un **vector SVG de alta precisión** que reproduce fielmente el monograma **`PS`** conectado por nodos y flujos de proceso:
- **Letra `P` (izquierda):** Trazo vertical con nodo circular en la base inferior, bucle superior abierto conectado a una flecha horizontal inferior (`→`) hacia la `S`.
- **Línea de flujo diagonal (circuito):** Atraviesa desde el extremo inferior izquierdo (nodo circular), pasa por un nodo circular central dentro del bucle de la `P` y culmina en un nodo cuadrado redondeado en el extremo superior derecho sobre la `S`.
- **Letra `S` (derecha):** Curva sinuosa continua con una flecha interna que acompaña la curvatura central y un sombreado sutil (`drop-shadow`).
- **Gradiente adaptativo por temática (`logoGradientStops`):** Cada una de las 6 temáticas define su propio gradiente multicapa para el isotipo SVG:
  1. **ProcesStudio Slate Pro (Mate) (`antigravity-dark`):** Gradiente tricolor de Violeta/Azul (`#6366F1` → `#0EA5E9`) en la base/izquierda hacia Cian/Verde Esmeralda (`#06B6D4` → `#34D399`) en la cima/derecha.
  2. **Midnight Executive (`antigravity-cosmic`):** Gradiente ejecutivo de Azul Real (`#2563EB`) a Azul Acero Claro (`#60A5FA` → `#93C5FD`).
  3. **Forest Sage (`antigravity-emerald`):** Gradiente orgánico de Verde Bosque Esmeralda (`#10B981`) a Verde Salvia Menta (`#34D399` → `#6EE7B7`).
  4. **Nebula Modern (`antigravity-purple`):** Gradiente espacial de Púrpura Intenso (`#8B5CF6`) a Lavanda Brillante (`#A78BFA` → `#C4B5FD`).
  5. **Nordic Studio Light (`antigravity-light`):** Gradiente nórdico de Azul Océano Profundo (`#0C4A6E` → `#0369A1`) a Cian Cerúleo Vibrante (`#0EA5E9` → `#06B6D4`).
  6. **Warm Sandpaper (`antigravity-solar`):** Gradiente cálido de Marrón Espresso Profundo (`#4A2511` → `#6F3B16`) a Ámbar Dorado Ocre (`#D97706` → `#E59838`).

#### B. Logotipo Tipográfico (`ProcesStudio` + `PLATAFORMA DE PROCESOS`)
- **Primera parte (`Proces`):** Tipografía Sans-Serif geométrica en peso **ExtraBold / Bold (`font-extrabold`)**, estilo recto (normal), color primario de alto contraste según el tema (`#FFFFFF` en los 4 temas oscuros, `#0F2942` en *Nordic Studio Light*, y `#3E1F0D` en *Warm Sandpaper*).
- **Segunda parte (`Studio`):** Tipografía en peso **ExtraBold / Bold Cursiva (`font-extrabold italic`)**, coloreada con el acento identitario exacto de cada temática:
  - *Slate Pro (Mate):* `#29B6F6`
  - *Midnight Executive:* `#60A5FA`
  - *Forest Sage:* `#52B788` / `#6EE7B7`
  - *Nebula Modern:* `#A78BFA`
  - *Nordic Studio Light:* `#0284C7`
  - *Warm Sandpaper:* `#C87D20`
- **Subtítulo (`PLATAFORMA DE PROCESOS`):** Texto en mayúsculas (`uppercase`), peso ligero/regular (`font-normal`), con espaciado expandido (`tracking-[0.22em]`) alineado exactamente debajo de `ProcesStudio`, visible en tamaños `md`, `lg` y `xl` (y configurable mediante prop `showSubtitle`).

#### C. Ajuste de Paletas Cromáticas y Fondos de las 6 Temáticas (`src/types/theme.ts`)
Se calibrarán los códigos hexadecimales de `PRESET_THEMES` y `CARD_THEME_PRESETS` para coincidir con la atmósfera exacta de cada cuadrante de la imagen:

| Temática | ID Interno | Fondo Principal (`appBg`) | Lienzo (`canvasBg`) | Superficie (`surface`) | Texto `"Proces"` (`text`) | Acento `"Studio"` (`accent`) | Subtítulo (`textMuted`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ProcesStudio Slate Pro (Mate)** | `antigravity-dark` | `#101726` | `#141D2F` | `#1B263B` | `#FFFFFF` | `#29B6F6` | `#B0BEC5` |
| **Midnight Executive** | `antigravity-cosmic` | `#090E1A` | `#0C1322` | `#131C31` | `#FFFFFF` | `#5B9BD5` | `#94A3B8` |
| **Forest Sage** | `antigravity-emerald` | `#0A1914` | `#0E211B` | `#142E26` | `#FFFFFF` | `#57B894` | `#98B4AA` |
| **Nebula Modern** | `antigravity-purple` | `#11091C` | `#160D24` | `#1F1333` | `#FFFFFF` | `#9F7AEA` | `#A39BB5` |
| **Nordic Studio Light** | `antigravity-light` | `#F4F6F9` | `#ECF0F5` | `#FFFFFF` | `#0F2942` | `#1A85B8` | `#1E293B` |
| **Warm Sandpaper** | `antigravity-solar` | `#FAF6EE` | `#F3EDE0` | `#FFFDF9` | `#3E1F0D` | `#C87D20` | `#4A2C18` |

#### D. Fuentes Tipográficas (`index.html` y `tailwind.config.js`)
- Incorporación de **`Plus Jakarta Sans`** / **`Inter`** (con soporte explícito para pesos `400, 500, 600, 700, 800` y variantes **`italic` `700i, 800i`** en Google Fonts dentro de `index.html`) para lograr el trazo limpio de `Proces`, la cursiva fluida de `Studio` y el tracking geométrico de `PLATAFORMA DE PROCESOS`.
- Actualización del **Favicon SVG** en `index.html` y de las tarjetas de previsualización en `ThemeCustomizationModal.tsx` para mostrar una vista previa en miniatura del logo de cada temática dentro del selector de temas.

---

### 15.3. Archivos a Modificar

1. **`index.html`:**
   - Actualización de la importación de Google Fonts incluyendo las variantes cursivas (`ital,wght@0,400..800;1,600..800`) para que `Studio` luzca idéntico a la imagen.
   - Actualización del favicon vectorial SVG con el nuevo isotipo `PS`.
2. **`src/types/theme.ts`:**
   - Extensión de `ThemeColors` con tokens específicos de marca (`logoGradStart`, `logoGradMid`, `logoGradEnd`, `logoWordPrimary`, `logoWordAccent`, `logoSubtitle`) e inyección en variables CSS (`--theme-logo-*`).
   - Calibración exacta de los colores de las 6 temáticas en `PRESET_THEMES` según la tabla 15.2.C.
3. **`src/components/common/LogoPS.tsx`:**
   - Rediseño completo del componente con el **isotipo SVG vectorial `PS`** (trazos de letras P y S, línea de flujo diagonal, 3 nodos circulares, 1 nodo cuadrado redondeado y 2 puntas de flecha), gradiente dinámico conectado a la temática activa (o forzado por prop `themePreviewId`), texto **`Proces`** + **`Studio`** (en cursiva coloreada) y subtítulo **`PLATAFORMA DE PROCESOS`**.
4. **`src/components/modals/ThemeCustomizationModal.tsx`:**
   - Integración de la vista previa en vivo del `LogoPS` específico de cada temática dentro de cada tarjeta del selector de temas, permitiendo al usuario ver exactamente las 6 variantes tal como en la imagen compartida.

---

### 15.4. Registro de Historia de Usuario (`PST-089`)

- **ID:** `PST-089`
- **Módulo / Componente:** Identidad Visual, Branding & Temáticas
- **Título:** Rediseño de Logotipo Vectorial `PS`, Tipografía y Paletas Cromáticas Dinámicas por Temática
- **Historia de Usuario:** *Como usuario de ProcesStudio, quiero que el logotipo (isotipo de flujo `PS`, texto `ProcesStudio` con cursiva de acento y leyenda `PLATAFORMA DE PROCESOS`), los colores de interfaz y las fuentes se adapten dinámicamente a cada una de las 6 temáticas oficiales tal como se especifica en la guía de identidad visual, para contar con una estética coherente y fiel al diseño institucional en cada modo visual.*
- **Criterios de Aceptación:**
  1. Nuevo isotipo vectorial SVG en `LogoPS.tsx` que replica el monograma `PS` con circuito de proceso, nodos y flechas, aplicando el gradiente propio de cada temática.
  2. Tipografía del logotipo estructurada con `Proces` en bold recto, `Studio` en bold italic con el color de acento del tema, y el subtítulo `PLATAFORMA DE PROCESOS` con espaciado expandido.
  3. Calibración exacta de fondos, superficies, textos y acentos para las 6 temáticas: *ProcesStudio Slate Pro (Mate)*, *Midnight Executive*, *Forest Sage*, *Nebula Modern*, *Nordic Studio Light* y *Warm Sandpaper*.
  4. Previsualización del logo de cada temática en las tarjetas de `ThemeCustomizationModal.tsx`.
- **Estado:** `Implementado / Producción`

---

## 17. Plan de Acción: Unificación Visual de Opciones y Desplegables al Estilo "Herramientas" (`PST-091`)

### 17.1. Objetivo del Requerimiento
Eliminar la disparidad visual en la barra central de navegación donde `Proyectos`, `Lienzo` y `Vistas & Manual PDF` estaban encerrados dentro de una cápsula segmentada con estilo tab, mientras que `Herramientas` se mostraba como un botón desplegable independiente con su propio estilo y dimensiones. Se unificarán todas las opciones de navegación y sus menús desplegables para que compartan estrictamente la misma lógica de diseño, geometría, estados de foco/activo, colores e iconografía del desplegable **"Herramientas"**.

---

### 17.2. Detalle de Diseño y Especificaciones Técnicas

#### 1. Unificación de los Botones de la Barra de Navegación (`Header.tsx`)
- Se remueve la cápsula exterior asimétrica (`bg-theme-surface-subtle p-1 rounded-xl border border-theme-border/80`).
- Todas las opciones de navegación (`Proyectos`, `Lienzo`, `Vistas & Manual PDF` y `Herramientas`) se dispondrán de forma armónica e individual en un contenedor horizontal fluido (`flex items-center space-x-2`), compartiendo las mismas especificaciones:
  - **Dimensiones y Geometría:** `px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer`.
  - **Estado Inactivo:** `bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border shadow-xs`.
  - **Estado Activo o Desplegado:** `bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold`.
  - **Iconos Acentuados:** Cada botón contará con su respectivo icono acentuado (`text-theme-accent`):
    - `LayoutDashboard` en **Proyectos**.
    - `GitGraph` en **Lienzo**.
    - `Table` (o `Layers`) en **Vistas & Manual PDF** + flecha `ChevronDown` con rotación animada `rotate-180`.
    - `Sparkles` en **Herramientas** + flecha `ChevronDown` con rotación animada `rotate-180`.

#### 2. Unificación del Menú Desplegable "Vistas & Manual PDF" al Estilo "Herramientas" (`Header.tsx`)
- **Contenedor Desplegable:**
  - Ancho ampliado y estandarizado a `w-72` (idéntico al de Herramientas).
  - Fondo opaco sólido `style={{ backgroundColor: 'var(--theme-surface)' }}` con `rounded-xl border border-theme-border shadow-2xl py-1.5`.
- **Estructura Interna de cada Opción:**
  - Botón interactivo: `w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer`.
  - Iconos con efecto zoom al pasar el ratón: `group-hover:scale-110 transition-transform`.
  - Estilo de dos líneas (Título destacado + subtítulo explicativo en `text-[10px] text-theme-text-muted`):
    - **Manual PDF:** Icono `FileCheck` en `text-amber-400`, título en negrita `Manual PDF`, subtítulo *"Generador automatizado de documento oficial"*.
    - **Matriz SIPOC:** Icono `Table` en `text-emerald-400`, título `"Matriz SIPOC"`, subtítulo *"Proveedores, entradas, salidas y clientes"*.
    - **Matriz RACI:** Icono `GitGraph` en `text-purple-400`, título `"Matriz RACI"`, subtítulo *"Roles y responsabilidades por tarea"*.
    - **Flujograma Secuencial:** Icono `Workflow` en `text-sky-400`, título `"Flujograma Secuencial"`, subtítulo *"Vista ejecutiva horizontal paso a paso"*.
  - Indicador visual check cuando la vista está activa.

#### 3. Coherencia en Menú de Perfil de Usuario (`UserProfileMenu.tsx`)
- Asegurar que los botones interactivos y dropdowns del menú de usuario utilicen la misma coherencia de hover, curvaturas `rounded-xl`, padding y tipografías para una experiencia visual integral sin rupturas estéticas.

---

### 17.3. Archivos a Modificar
1. **`src/components/layout/Header.tsx`:** Reemplazo de la cápsula tab por botones uniformes con el diseño de `Herramientas`, y actualización del dropdown `Vistas & Manual PDF` para reflejar la tipografía, dimensiones y colores del desplegable de `Herramientas`.
2. **`src/components/layout/UserProfileMenu.tsx`:** Ajuste fino de padding y consistencia con las clases del estándar unificado.
3. **`src/constants/version.ts` & `package.json`:** Incremento de versión a `2.3.0` (`V 02.03.00`).
4. **`scripts/generate-user-stories.cjs`:** Incorporación de la historia `PST-091`.

---

### 17.4. Registro de Historia de Usuario (`PST-091`)

- **ID:** `PST-091`
- **Módulo / Componente:** Experiencia de Usuario, Cabecera & Estandarización Visual
- **Título:** Unificación Visual de Opciones de Navegación y Menús Desplegables al Estilo "Herramientas"
- **Historia de Usuario:** *Como usuario de ProcesStudio, quiero que todos los botones de navegación (Proyectos, Lienzo, Vistas & Manual PDF y Herramientas) y sus menús desplegables compartan la misma lógica de diseño, curvaturas, tipografía, colores y efectos hover que el desplegable "Herramientas", para disfrutar de una interfaz simétrica, armónica y completamente estandarizada.*
- **Criterios de Aceptación:**
  1. Eliminación de la cápsula segmentada asimétrica que agrupaba Proyectos, Lienzo y Vistas.
  2. Implementación de botones de navegación individuales y homogéneos para Proyectos, Lienzo, Vistas & Manual PDF y Herramientas con idéntica altura (`py-2`), padding (`px-3.5`), bordes (`rounded-xl border border-theme-border`), fondo (`bg-theme-surface-subtle hover:bg-theme-surface`) e iconos en color acento (`text-theme-accent`).
  3. Estado activo y desplegado homogéneo (`bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold`).
  4. Rediseño del menú desplegable "Vistas & Manual PDF" con ancho de 72 (`w-72`), fondo sólido, iconos escalables en hover y descripción de dos líneas (título + subtítulo explicativo) idéntico a "Herramientas".
  5. Sincronización en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` y confirmación de cero errores de compilación.
- **Estado:** `Implementado / Producción`

---

## 16. Plan de Acción: Reorganización de Cabecera/Menús, Corrección de Modales, Opacidad Visual y Control de Acceso por Módulos para cada Usuario (`PST-090`)

### 16.1. Objetivo del Requerimiento
Optimizar la ergonomía y limpieza de la barra superior (`Header.tsx`), el menú de perfil (`UserProfileMenu.tsx`), el modal de temas (`ThemeCustomizationModal.tsx`) y la Consola de Administración (`AdminConsoleModal.tsx`), corrigiendo el recorte superior en modales de cabecera, aumentando la opacidad de los menús desplegables e implementando un **sistema granular de permisos por módulo y vista para cada usuario**.

---

### 16.2. Detalle Técnico de los Ajustes Solicitados

#### 1. Reubicación de Acciones y Limpieza de Cabecera (`Header.tsx`, `UserProfileMenu.tsx`, `AdminConsoleModal.tsx`)
- **Catálogos ABM dentro de la Consola de Administración:**
  - Se retira el botón directo `Catálogos ABM` de la barra superior (`Header.tsx`) y del menú de usuario regular (`UserProfileMenu.tsx`).
  - Se integra una nueva pestaña/sección **`Catálogos Maestros (ABMs)`** dentro de la **Consola de Administración (`AdminConsoleModal.tsx`)** para que el Administrador gestione centralizadamente Unidades Organizativas, Roles/Cargos, Marcos Normativos, Sistemas TI/Formularios, Riesgos y Papelera de Proyectos.
- **Tutorial dentro del desplegable de Herramientas:**
  - Se retira el botón independiente `🎓 Tutorial` de la barra superior (`Header.tsx`).
  - Se incorpora **`Tutorial y Centro de Aprendizaje`** (junto con el acceso al Tour Guiado) dentro del menú desplegable **`Herramientas`** (el cual estará disponible en la barra superior siempre que el usuario tenga permiso a Herramientas o Tutorial).
- **Texto a BPMN / Plantillas exclusivamente en Herramientas:**
  - Se elimina el botón suelto `Texto a BPMN / Plantillas` de la barra superior, manteniendo la opción **`Generar desde Texto / Plantillas`** únicamente dentro del desplegable **`Herramientas`**.
- **Retiro de "Participantes & Permisos" del menú Herramientas:**
  - Se elimina el ítem `Participantes & Permisos` del desplegable `Herramientas` (conservando su botón de icono directo en el clúster de acciones de la derecha y en las tarjetas de proyecto).
- **Simplificación de Textos de Navegación:**
  - El botón **`Lienzo BPMN`** pasa a llamarse **`Lienzo`**.
  - En el desplegable *Vistas & Manual PDF*, la opción **`Manual PDF & Ficha ISO 9001`** pasa a llamarse **`Manual PDF`**.

#### 2. Corrección de Modales Cortados en la Parte Superior (`Header.tsx`)
- **Causa raíz identificada:** Los modales `EditProjectModal` (*Editar Ficha del Proceso*), `ProjectParticipantsModal` (*Participantes y Permisos*) y `NewRevisionModal` estaban renderizados **dentro** de la etiqueta `<header className="... backdrop-blur-md">`. En CSS, la propiedad `backdrop-filter` crea un nuevo bloque contenedor (*containing block*) para elementos `position: fixed`, provocando que los modales quedaran atrapados y recortados por el borde superior del `<header>`.
- **Solución definitiva:** Extraer el renderizado de `EditProjectModal`, `ProjectParticipantsModal` y `NewRevisionModal` **fuera** de la etiqueta `<header>` mediante un fragmento raíz (`<> <header>...</header> {modales} </>`), garantizando que se centren perfectamente en toda la pantalla (`100vw × 100vh`) sin ningún recorte.

#### 3. Opacidad Sólida en Menús Desplegables y Limpieza de Etiquetas (`Header.tsx`, `UserProfileMenu.tsx`, `ThemeCustomizationModal.tsx`)
- **Fondo sólido (no transparente) en desplegables:**
  - Los menús desplegables de **`Herramientas`**, **`Vistas & Manual PDF`** y **`Menú de Perfil de Usuario`** utilizarán fondo 100% sólido (`bg-theme-surface` con `style={{ backgroundColor: 'var(--theme-surface)' }}`) y sombra profunda para evitar que los nodos y líneas del lienzo se trasluzcan por detrás.
- **Limpieza de etiquetas y badges:**
  - En `ThemeCustomizationModal.tsx`: Se elimina el badge `Antigravity IDE`.
  - En `UserProfileMenu.tsx`: Se elimina la palabra `Antigravity` al lado de *Paleta de Colores & Temas*, y se eliminan los textos `CRUD`, `Aprender` y `6 Pasos` junto con las opciones reubicadas.

#### 4. Control Granular de Acceso a Módulos del Sistema por Usuario (`PST-090`)
Se incorpora en el modelo de usuario (`AppUser` en `src/types/auth.ts`) la propiedad `allowedModules: SystemModuleKey[]` administrable desde la **Consola de Administración** (tanto al Crear/Editar un usuario en `UserFormModal.tsx` como en una matriz rápida dentro de `AdminConsoleModal.tsx`):

- **Módulos y Vistas Configurables por Usuario:**
  1. `DASHBOARD` — **Proyectos** (Panel general de proyectos)
  2. `CANVAS` — **Lienzo** (Editor/visor gráfico del proceso)
  3. **Vistas & Manual PDF** (se muestra el desplegable si tiene al menos una sub-vista activa):
     - `VIEW_REPORT` — **Manual PDF**
     - `VIEW_SIPOC` — **Matriz SIPOC**
     - `VIEW_RACI` — **Matriz RACI**
     - `VIEW_FLOWCHART` — **Flujograma Secuencial**
- **Sugerencias adicionales incluidas para un control institucional completo:**
  4. `TOOLS_MENU` — **Desplegable de Herramientas** (Simulador, Auditor de Calidad, Comparador, Presentación, Texto a BPMN, Tutorial)
  5. `EXPORT_CENTER` — **Centro de Exportación** (Botón de descargas múltiples)
  6. `CREATE_PROJECTS` — **Crear Nuevos Procesos** (Botón *+ Nuevo Proceso*)
- **Perfiles Rápidos Predefinidos (1-Clic para el Administrador):**
  - **Acceso Total (Analista / Editor):** Habilita todos los módulos y vistas.
  - **Consulta y Auditoría (Lector Documental):** Habilita *Proyectos*, *Manual PDF*, *Matriz SIPOC*, *Matriz RACI* y *Flujograma Secuencial* (oculta el Lienzo y las herramientas de edición).
  - **Modelador Operativo:** Habilita *Proyectos*, *Lienzo*, *Flujograma Secuencial* y *Herramientas*.
- **Comportamiento reactivo en la interfaz (`Header.tsx` y `App.tsx`):**
  - Cada usuario verá en su barra superior **únicamente** los botones, pestañas y sub-ítems de *Vistas & Manual PDF* que tenga habilitados.
  - Si el usuario no tiene acceso a la vista actual, el sistema lo redirige automáticamente al primer módulo que tenga habilitado.

---

### 16.3. Registro de Historia de Usuario (`PST-090`)

- **ID:** `PST-090`
- **Módulo / Componente:** Gobernanza de Módulos, Cabecera & Experiencia de Usuario
- **Título:** Permisos Granulares por Módulo/Vista para cada Usuario, Reorganización de Cabecera/Herramientas y Corrección de Modales
- **Historia de Usuario:** *Como administrador de ProcesStudio, quiero configurar a qué módulos y vistas del sistema tiene acceso cada usuario (Proyectos, Lienzo, Manual PDF, Matriz SIPOC, Matriz RACI, Flujograma Secuencial, Herramientas y Creación de Procesos), contar con los Catálogos ABM integrados en la Consola de Administración, y disponer de menús desplegables sólidos sin recortes visuales ni textos innecesarios, para adaptar la interfaz al rol exacto de cada colaborador.*
- **Criterios de Aceptación:**
  1. Integración de Catálogos ABM dentro de `AdminConsoleModal.tsx` y retiro de la barra superior.
  2. Ubicación exclusiva de *Generar desde Texto / Plantillas* y *Tutorial* dentro del desplegable `Herramientas`, retirando *Participantes & Permisos* de dicho menú.
  3. Corrección definitiva del posicionamiento de `EditProjectModal`, `ProjectParticipantsModal` y `NewRevisionModal` fuera del contenedor `<header>` para evitar recortes en el borde superior.
  4. Fondos opacos sólidos en los desplegables de `Herramientas`, `Vistas & Manual PDF` y `UserProfileMenu`, y eliminación de las etiquetas `Antigravity IDE`, `Antigravity`, `CRUD`, `Aprender`, `6 Pasos`, `BPMN` (en Lienzo) y `& Ficha ISO 9001` (en Manual PDF).
  5. Gestión por usuario de módulos habilitados (`Proyectos`, `Lienzo`, `Manual PDF`, `Matriz SIPOC`, `Matriz RACI`, `Flujograma Secuencial`, `Herramientas`, `Exportar`, `Crear Proceso`) con presets rápidos de 1 clic y ocultamiento dinámico en la interfaz.
- **Estado:** `Implementado / Producción`

---

## 17. Plan de Acción: Unificación Visual de Opciones y Desplegables al Estilo "Herramientas" (`PST-091`)

### 17.1. Objetivo del Requerimiento
Eliminar la disparidad visual en la barra central de navegación donde `Proyectos`, `Lienzo` y `Vistas & Manual PDF` estaban encerrados dentro de una cápsula segmentada con estilo tab, mientras que `Herramientas` se mostraba como un botón desplegable independiente con su propio estilo y dimensiones. Se unificarán todas las opciones de navegación y sus menús desplegables para que compartan estrictamente la misma lógica de diseño, geometría, estados de foco/activo, colores e iconografía del desplegable **"Herramientas"**.

---

### 17.2. Detalle de Diseño y Especificaciones Técnicas

#### 1. Unificación de los Botones de la Barra de Navegación (`Header.tsx`)
- Se remueve la cápsula exterior asimétrica (`bg-theme-surface-subtle p-1 rounded-xl border border-theme-border/80`).
- Todas las opciones de navegación (`Proyectos`, `Lienzo`, `Vistas & Manual PDF` y `Herramientas`) se dispondrán de forma armónica e individual en un contenedor horizontal fluido (`flex items-center space-x-2`), compartiendo las mismas especificaciones:
  - **Dimensiones y Geometría:** `px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer`.
  - **Estado Inactivo:** `bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border shadow-xs`.
  - **Estado Activo o Desplegado:** `bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold`.
  - **Iconos Acentuados:** Cada botón contará con su respectivo icono acentuado (`text-theme-accent`):
    - `LayoutDashboard` en **Proyectos**.
    - `GitGraph` en **Lienzo**.
    - `Table` (o `Layers`) en **Vistas & Manual PDF** + flecha `ChevronDown` con rotación animada `rotate-180`.
    - `Sparkles` en **Herramientas** + flecha `ChevronDown` con rotación animada `rotate-180`.

#### 2. Unificación del Menú Desplegable "Vistas & Manual PDF" al Estilo "Herramientas" (`Header.tsx`)
- **Contenedor Desplegable:**
  - Ancho ampliado y estandarizado a `w-72` (idéntico al de Herramientas).
  - Fondo opaco sólido `style={{ backgroundColor: 'var(--theme-surface)' }}` con `rounded-xl border border-theme-border shadow-2xl py-1.5`.
- **Estructura Interna de cada Opción:**
  - Botón interactivo: `w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer`.
  - Iconos con efecto zoom al pasar el ratón: `group-hover:scale-110 transition-transform`.
  - Estilo de dos líneas (Título destacado + subtítulo explicativo en `text-[10px] text-theme-text-muted`):
    - **Manual PDF:** Icono `FileCheck` en `text-amber-400`, título en negrita `Manual PDF`, subtítulo *"Generador automatizado de documento oficial"*.
    - **Matriz SIPOC:** Icono `Table` en `text-emerald-400`, título `"Matriz SIPOC"`, subtítulo *"Proveedores, entradas, salidas y clientes"*.
    - **Matriz RACI:** Icono `GitGraph` en `text-purple-400`, título `"Matriz RACI"`, subtítulo *"Roles y responsabilidades por tarea"*.
    - **Flujograma Secuencial:** Icono `Workflow` en `text-sky-400`, título `"Flujograma Secuencial"`, subtítulo *"Vista ejecutiva horizontal paso a paso"*.
  - Indicador visual check cuando la vista está activa.

#### 3. Coherencia en Menú de Perfil de Usuario (`UserProfileMenu.tsx`)
- Asegurar que los botones interactivos y dropdowns del menú de usuario utilicen la misma coherencia de hover, curvaturas `rounded-xl`, padding y tipografías para una experiencia visual integral sin rupturas estéticas.

---

### 17.3. Archivos a Modificar
1. **`src/components/layout/Header.tsx`:** Reemplazo de la cápsula tab por botones uniformes con el diseño de `Herramientas`, y actualización del dropdown `Vistas & Manual PDF` para reflejar la tipografía, dimensiones y colores del desplegable de `Herramientas`.
2. **`src/components/layout/UserProfileMenu.tsx`:** Ajuste fino de padding y consistencia con las clases del estándar unificado.
3. **`src/constants/version.ts` & `package.json`:** Incremento de versión a `2.3.0` (`V 02.03.00`).
4. **`scripts/generate-user-stories.cjs`:** Incorporación de la historia `PST-091`.

---

### 17.4. Registro de Historia de Usuario (`PST-091`)

- **ID:** `PST-091`
- **Módulo / Componente:** Experiencia de Usuario, Cabecera & Estandarización Visual
- **Título:** Unificación Visual de Opciones de Navegación y Menús Desplegables al Estilo "Herramientas"
- **Historia de Usuario:** *Como usuario de ProcesStudio, quiero que todos los botones de navegación (Proyectos, Lienzo, Vistas & Manual PDF y Herramientas) y sus menús desplegables compartan la misma lógica de diseño, curvaturas, tipografía, colores y efectos hover que el desplegable "Herramientas", para disfrutar de una interfaz simétrica, armónica y completamente estandarizada.*
- **Criterios de Aceptación:**
  1. Eliminación de la cápsula segmentada asimétrica que agrupaba Proyectos, Lienzo y Vistas.
  2. Implementación de botones de navegación individuales y homogéneos para Proyectos, Lienzo, Vistas & Manual PDF y Herramientas con idéntica altura (`py-2`), padding (`px-3.5`), bordes (`rounded-xl border border-theme-border`), fondo (`bg-theme-surface-subtle hover:bg-theme-surface`) e iconos en color acento (`text-theme-accent`).
  3. Estado activo y desplegado homogéneo (`bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold`).
  4. Rediseño del menú desplegable "Vistas & Manual PDF" con ancho de 72 (`w-72`), fondo sólido, iconos escalables en hover y descripción de dos líneas (título + subtítulo explicativo) idéntico a "Herramientas".
  5. Sincronización en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` y confirmación de cero errores de compilación.
- **Estado:** `Implementado / Producción`






---

## 18. Plan de Acción: Limpieza Estructural Post-Migración Escritorio → Web (`PST-092`)

### 18.1. Objetivo
Eliminar dependencias, scripts y archivos huérfanos del runtime de escritorio (Electron / lanzador C# / pendrive USB) identificados en la auditoría, sin tocar ningún archivo con referencias activas en la versión web.

### 18.2. Alcance (solo elementos sin referencias activas)

#### A. `package.json` / `package-lock.json`
- Desinstalar `electron` (`npm uninstall electron`).
- Eliminar `"main": "electron/main.cjs"`.
- Eliminar el script `"start:portable"`.
- Quitar `node scripts/sync-dist.cjs` del script `"build"` (queda `tsc && vite build && node scripts/generate-user-stories.cjs`).
- Actualizar `description` (quitar "Portable Windows Desktop").
- Quitar `ELECTRON_SKIP_BINARY_DOWNLOAD` de `.github/workflows/deploy.yml` (ya no hay binario que omitir).

#### B. Archivos y carpetas a eliminar
1. `electron/` (`main.cjs`, `preload.cjs`)
2. `src-launcher/` (`Launcher.cs`, `app.manifest`)
3. `scripts/sign-exe.ps1`
4. `scripts/generate-pdf.cjs`
5. `scripts/sync-dist.cjs`
6. `scripts/sync-local-to-neon.cjs`
7. `src/components/canvas/SelectionToolbar.tsx` (sin importaciones)
8. `src/components/canvas/SwimlaneBackground.tsx` (sin importaciones)
9. `MiAppProcesos_USB/` (ejecutables, binarios Electron, copias de `dist`, caché)
10. `data/` (caché de Chromium, ya ignorada en `.gitignore`)

#### C. Fuera de alcance (se conservan: tienen referencias activas o requieren decisión)
- `src/components/dashboard/DatabaseConfigModal.tsx`: está importado en `ProjectDashboard.tsx`. Se tratará en un paso posterior de refactor.
- Ramas `isElectron()` en `storageService.ts`, `Header.tsx`, `UserProfileMenu.tsx`, `ProjectCard.tsx`, `ProjectDashboard.tsx`: código activo. Se tratarán en el paso de refactor.
- `scripts/setup-neon-db.cjs`, `scripts/*.sql`: esquema de base de datos aún útil.
- `vite.config.ts` (`base: './'`): se mantiene porque funciona en GitHub Pages.

### 18.3. Riesgos y puntos a decidir
> [!WARNING]
> - `MiAppProcesos_USB/` contiene `MANUAL_DE_USO.html/.md/.pdf`, `Proyectos/` y una copia del `.xlsx`. Si querés conservar el manual, hay que moverlo antes de borrar la carpeta.
> - `scripts/setup-neon-db.cjs` y `scripts/sync-local-to-neon.cjs` tienen una cadena de conexión de Neon con contraseña hardcodeada y versionada en git. Recomiendo rotar esa credencial en Neon (aunque se borre el archivo, queda en el historial).
> - Se perderá la capacidad de generar el `.exe` portable (decisión irreversible salvo desde git).

### 18.4. Verificación
`npm install` → `npm run build` (cero errores `tsc`/Vite) → búsqueda de referencias rotas a los archivos eliminados → commit y push.

### 18.5. Registro de Historia de Usuario (`PST-092`)
- **ID:** `PST-092`
- **Módulo / Componente:** Arquitectura, Mantenimiento & Deuda Técnica
- **Título:** Limpieza estructural de dependencias y archivos huérfanos post-migración a web
- **Historia de Usuario:** *Como equipo de desarrollo, quiero eliminar el runtime de escritorio (Electron, lanzador C#, empaquetado USB) y los componentes sin uso, para reducir el peso del repositorio, acelerar la instalación y el build, y evitar confusión sobre la arquitectura vigente.*
- **Criterios de Aceptación:**
  1. `electron` y sus scripts/propiedades eliminados de `package.json` y `package-lock.json`.
  2. Eliminadas las rutas listadas en 18.2.B sin referencias rotas.
  3. `npm run build` finaliza sin errores y el despliegue web no se ve afectado.
  4. Registro en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`.
- **Estado:** `Implementado / Producción`


---

## 19. Plan de Acción: Refactor Web-Native y Saneamiento de Credenciales (`PST-093`)

### 19.1. Objetivo
Completar la migración a web eliminando la lógica de escritorio que sigue activa (puente Electron, modal de base de datos inalcanzable, textos heredados) y sacar la credencial de Neon hardcodeada del código.

### 19.2. Detalle Técnico

#### 1. Credencial de Neon (seguridad)
- `scripts/setup-neon-db.cjs`: eliminar la cadena de conexión con contraseña hardcodeada; leer únicamente `process.env.VITE_NEON_DATABASE_URL` y abortar con mensaje claro si no está definida.
- `.env.example`: documentar la variable (sin valores reales).
- **Acción manual del usuario (no automatizable):** rotar la contraseña del rol `neondb_owner` en el panel de Neon y actualizar `.env`. La contraseña anterior permanece en el historial de git (commit `7881f32`), por lo que la rotación es la única mitigación efectiva. No se reescribirá el historial.

#### 2. `storageService.ts`
- Eliminar `interface Window { procesosStorage }`, `isElectron()`, `openProjectsFolder()`, `openProjectFile()` y todas las ramas `if (this.isElectron())`.
- `StorageMode`: quitar `'ELECTRON'` (`'NEON' | 'LOCALSTORAGE'`).
- `getProjectsPath()`: devuelve solo `Neon Serverless PostgreSQL (Cloud)` o `Navegador Web (localStorage)`.
- Sin cambios en `localStorage`, Neon, exportar/importar JSON ni en las claves de almacenamiento (los datos existentes siguen funcionando).

#### 3. Componentes con lógica heredada
- `Header.tsx`: `handleSave` muestra siempre `Proyecto guardado (archivo)`; eliminar `handleOpenFolder` y la prop `onOpenFolder` hacia `UserProfileMenu`.
- `UserProfileMenu.tsx`: eliminar `handleDefaultOpenFolder`, la prop `onOpenFolder` y el botón "Almacenamiento Local" (en web solo descargaba el JSON; la descarga ya existe en la tarjeta del proyecto).
- `ProjectCard.tsx`: `handleRevealLocation` pasa a `handleDownloadBackup` (siempre descarga el JSON); tooltips: "Descargar respaldo JSON" en lugar de "Explorador de Windows".
- `ProjectDashboard.tsx`: eliminar `handleOpenFolder`, el estado `isDbModalOpen`, el montaje de `<DatabaseConfigModal />` y los iconos sin uso; el `title` de "Importar JSON" deja de mencionar "pendrive".
- Eliminar `src/components/dashboard/DatabaseConfigModal.tsx` (sin vía de apertura desde PST-081). La conexión a Neon se configura por `VITE_NEON_DATABASE_URL`.
- `README.md`: reemplazar las secciones de Electron/portable/USB por instrucciones web (`npm run dev`, `npm run build`, despliegue en GitHub Pages).

#### 4. Fuera de alcance
- `generate-user-stories.cjs` (el texto histórico de historias ya implementadas se conserva) y la ruta USB opcional del `.xlsx`, que se elimina por estar muerta (`fs.existsSync` ya falso).

### 19.3. Riesgos
> [!NOTE]
> - La pérdida del botón "Almacenamiento Local" y del modal de Neon es solo visual: ya eran inalcanzables o redundantes en web.
> - Si alguien aún usa `StorageService.syncAllLocalProjectsToNeon`, se conserva (no depende de Electron).

### 19.4. Registro de Historia de Usuario (`PST-093`)
- **ID:** `PST-093`
- **Módulo / Componente:** Arquitectura, Seguridad & Mantenimiento
- **Título:** Refactor Web-Native (eliminación del puente Electron) y saneamiento de credenciales de base de datos
- **Historia de Usuario:** *Como equipo de desarrollo y responsable de seguridad, quiero eliminar la lógica residual de escritorio y las credenciales hardcodeadas del código, para que la aplicación sea 100% web, más simple de mantener y sin secretos expuestos en el repositorio.*
- **Criterios de Aceptación:**
  1. Sin referencias a `isElectron`, `procesosStorage`, `MiAppProcesos_USB` ni "Explorador de Windows" en `src/`.
  2. `DatabaseConfigModal.tsx` eliminado y `ProjectDashboard.tsx` sin código inalcanzable.
  3. `setup-neon-db.cjs` sin contraseña en el código y `.env.example` documentado.
  4. `README.md` actualizado a arquitectura web.
  5. `npm run build` sin errores; guardado, carga, duplicado, borrado, importación y exportación de proyectos sin regresiones.
- **Estado:** `Implementado / Producción`
