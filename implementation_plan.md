# Reemplazo de Supabase Auth por Tabla de Usuarios Personalizada

El objetivo es abandonar el sistema integrado de `Supabase Auth` y utilizar directamente una tabla en la base de datos de Supabase llamada `usuarios` para gestionar los registros, inicios de sesión y la persistencia local.

## User Review Required

> [!WARNING]
> Al dejar de usar `Supabase Auth`, toda la autenticación la manejaremos manualmente. Las consultas se realizarán con el rol `anon` (anónimo), por lo que debemos permitir acceso público para lectura/escritura a esta tabla específica para que la PWA funcione. Los PINs seguirán estando "hasheados" antes de guardarse para mantener la seguridad.

## Proposed Changes

### 1. Base de Datos (Supabase)
Ejecutaremos una migración SQL para:
- Crear la tabla `usuarios`.
- Columnas: `id` (UUID), `nombre_usuario` (TEXT, único), `pin` (TEXT, hasheado), `perfil` (JSONB, para guardar los datos de salud), `fecha_registro` (TIMESTAMP).
- Configurar políticas de RLS para permitir inserciones y selecciones desde el frontend.

### 2. app.js

#### [MODIFY] app.js
- **Inicialización de Sesión:** Volveremos a usar `localStorage.getItem('sc_auth_session')` para saber si el usuario ya inició sesión previamente y mantener la app persistente ante borrados de caché parciales o recargas.
- **Registro (`doRegister`):** 
  - Consultar `supabase.from('usuarios')` para verificar si el `nombre_usuario` ya está en uso.
  - Insertar nuevo usuario con el nombre y PIN hasheado.
  - Guardar el ID en `localStorage`.
- **Login (`doLogin`):** 
  - Consultar la tabla `usuarios` buscando una coincidencia exacta de `nombre_usuario` y `pin` hasheado.
  - Si es correcto, guardar el ID en `localStorage` y cargar la app.
  - Si es incorrecto, mostrar error.
- **Logout:** 
  - Borrar el ID de `localStorage` y recargar/ocultar la interfaz principal.
- **Actualizar Perfil / Cambiar PIN:**
  - Enviar los datos del perfil actualizados directamente a la columna `perfil` de la tabla `usuarios`.
  - Si se ingresa un nuevo PIN, actualizar la columna `pin` en esa misma tabla.
- **Limpieza Total:**
  - Eliminar todas las llamadas a `supabase.auth.*`.

## Verification Plan

### Automated Tests
- Ejecutar la migración a través de las herramientas de MCP en Supabase.
- Validar el código de `app.js` usando `node -c app.js` para asegurar que no haya errores de sintaxis.

### Manual Verification
- Intentar registrar un usuario nuevo y verificar en el dashboard que se crea la fila en `usuarios`.
- Intentar registrar el mismo usuario y confirmar que muestra error.
- Iniciar sesión con un PIN incorrecto y confirmar el error.
- Recargar la página y verificar que la sesión persiste gracias al `localStorage`.
- Modificar datos del perfil y guardarlos; recargar y confirmar que se cargan de la nube.
