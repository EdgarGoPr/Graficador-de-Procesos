# Plan de Acción Integral: Gestión de Usuarios, Roles, Permisos por Lienzo, Acceso con Google, Reseteo por Administrador y Logs de Auditoría

> **Documento:** Plan de Acción Oficial de Seguridad y Gobernanza de ProcesStudio  
> **Versión:** 1.5.1 | **Fecha:** 2026-10-28  
> **Alineación Normativa:** Directivas Obligatorias de Desarrollo (`AGENTS.md` y `.agents/rules/directivas.md`), Estándar BPMN 2.0 (ISO/IEC 19510), Gestión de Calidad ISO 9001:2015 (Control de Cambios y Trazabilidad) y Seguridad de la Información ISO/IEC 27001 (Control de Accesos).  
> **Historias de Usuario:** `PST-069`, `PST-070`, `PST-071`, `PST-072`, `PST-073`, `PST-074`, `PST-075`, `PST-076`, `PST-077`, `PST-078` (Indicador de Versión Dinámica Global `V xx.xx.xx`).

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
    estado: 'Planificado / En Desarrollo'
  }
]
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
7. **Validación, Generación de Historias y Auto-Push:**
   - Ejecutar `npm run build` para validar compilación TypeScript y generar historias de usuario en `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx` incorporando `PST-078`.
   - Ejecutar `git commit` y `git push origin main` de forma automática tras verificación.

---

## 10. Conclusión y Compromiso de Desarrollo

Este documento constituye la **Hoja de Ruta Maestra Oficial de Usuarios, Permisos, Seguridad y Auditoría** de ProcesStudio (Versión 1.5.1).

Todas las fases se implementarán respetando rigurosamente:
1. **La arquitectura 100% Web Cloud Nativa** (React + TypeScript + Vite + Neon PostgreSQL).
2. **La persistencia relacional en Neon PostgreSQL**.
3. **La actualización del archivo Excel `HISTORIAS_DE_USUARIO_PROCESSTUDIO.xlsx`** (`PST-069` a `PST-078`).
4. **La compilación limpia (`npm run build`) y el commit/push automático a Git tras cada conjunto de cambios**.
