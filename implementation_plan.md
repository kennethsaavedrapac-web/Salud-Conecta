# Integración de Supabase Auth en Salud-Conecta IA

Este plan detalla los pasos para reemplazar completamente el sistema de autenticación local (`localStorage`) por **Supabase Auth**, manteniendo la compatibilidad con PWA y el funcionamiento offline parcial.

## User Review Required

> [!WARNING]
> **Identificación de Usuarios tras Limpiar Caché**
> Actualmente, los usuarios solo ingresan su **PIN de 4 dígitos** para iniciar sesión, porque el sistema busca en el `localStorage` del dispositivo. Si usamos Supabase Auth y el usuario borra la caché del navegador, un PIN de 4 dígitos (con solo 10,000 combinaciones) no es suficiente para saber **quién** es el usuario a nivel global.
> **Propuesta:** Para mantener la cuenta segura y recuperable, agregaré un campo de **"Nombre de usuario" (o nombre completo)** al formulario de **Login**. 
> Internamente, el sistema convertirá el Nombre de usuario en un formato de correo ficticio (ej. `[usuario]@salud-conecta.local`) y usará el PIN como contraseña para Supabase Auth. ¿Estás de acuerdo con este cambio en la interfaz de Login?

> [!IMPORTANT]
> **Requisito de Contraseña en Supabase**
> Supabase exige que las contraseñas tengan un mínimo de 6 caracteres. Como el PIN tiene 4 dígitos, internamente se guardará combinándolo con una cadena segura (ej. `PIN + "SC"`) al comunicarse con Supabase Auth. El PIN nunca se guardará en texto plano en la base de datos pública. ¿Te parece correcto?

## Open Questions

- ¿Deseas que los usuarios existentes en `localStorage` (si los hay) se migren automáticamente a Supabase la primera vez que abran la aplicación, o que tengan que registrarse de nuevo obligatoriamente?
- ¿Quieres mantener la misma pantalla de PINs separados (4 inputs), pero agregando el campo de usuario arriba en el Login?

## Proposed Changes

### Supabase Setup & Database
Se ejecutará un script SQL usando la herramienta de migraciones para crear la estructura adicional:
- Tabla `profiles` (conectada al ID de `auth.users`) para guardar el nombre, preferencias, y futura información médica.
- Configurar *Row Level Security (RLS)* para que cada usuario solo pueda ver y modificar sus propios datos.
- Trigger automático para crear el `profile` al registrarse.

### UI & HTML (`index.html`)

#### [MODIFY] index.html
- Actualizar `<head>` para importar el SDK de Supabase (`@supabase/supabase-js`).
- Modificar `#form-login` para agregar un `<input>` de **Nombre de usuario**, de forma idéntica al registro.
- Agregar elementos para mostrar "cargando" durante la conexión a Supabase (spinners) y manejar errores de conexión fallida.

### Lógica de Aplicación (`app.js`)

#### [MODIFY] app.js
- Inicializar cliente de Supabase usando `SUPABASE_URL` y la `sb_publishable_key`.
- **Registro (`doRegister`)**:
  - Validar nombre y PIN.
  - Generar email interno: `nombre_slug@saludconecta.local`.
  - Llamar a `supabase.auth.signUp()`.
  - Manejar errores: Usuario ya existe.
- **Login (`doLogin`)**:
  - Leer Nombre y PIN.
  - Llamar a `supabase.auth.signInWithPassword()`.
  - Manejar errores: PIN incorrecto, usuario no encontrado.
- **Verificación de Sesión**:
  - Eliminar funciones de `localStorage` y `sessionStorage`.
  - Usar `supabase.auth.getSession()` al inicio para auto-loguear.
  - Suscribirse a cambios con `supabase.auth.onAuthStateChange()`.
- **Logout (`btn-logout`)**:
  - Llamar a `supabase.auth.signOut()` y reiniciar la UI.
- **Manejo Offline**:
  - Si no hay conexión al intentar login/registro, mostrar error correspondiente.

## Verification Plan

### Manual Verification
1. **Registro:** Ingresar un nombre y PIN de 4 dígitos. Verificar en el dashboard de Supabase (o vía API) que se creó el usuario en Auth y en la tabla de perfiles.
2. **Login:** Cerrar sesión y volver a entrar con el nombre y PIN.
3. **Persistencia:** Recargar la página (F5) o cerrar el navegador; la sesión debe mantenerse iniciada automáticamente.
4. **Limpieza de Caché:** Borrar la caché del navegador. Volver a ingresar nombre y PIN. La sesión debe recuperarse.
5. **Errores:** Intentar registrar un usuario existente. Intentar login con PIN incorrecto.
