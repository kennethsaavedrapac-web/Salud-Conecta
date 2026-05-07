# Sistema de Usuarios Directo (Tabla Personalizada)

He completado la refactorización para remover el sistema *Supabase Auth* y construir tu sistema de autenticación personalizado usando directamente la tabla `usuarios` en Supabase, respetando exactamente cómo quieres manejar los nombres y el PIN de 4 dígitos.

## 🗄️ Cambios en Base de Datos
- **Se creó la tabla `usuarios`** con las columnas necesarias (`id`, `nombre_usuario`, `pin`, `perfil`, `fecha_registro`).
- **Se configuró RLS (Row Level Security)** pero se incluyeron políticas especiales para que los usuarios anónimos (ya que no existe *Auth*) puedan registrarse (insertar) y hacer login (consultar).

## ⚙️ Cambios en la App (`app.js`)
- **Autenticación "Custom":** Al hacer "Crear cuenta", el sistema ahora consulta si el nombre ya existe en la tabla. Si no existe, lo inserta con el PIN hasheado (con mayor seguridad usando iteración matemática y un *salt*).
- **Inicio de sesión directo:** Al intentar hacer "Login", consultamos la base de datos buscando una coincidencia exacta de `nombre_usuario` y `pin` hasheado. Si existe, devolvemos el perfil.
- **Adiós a Supabase Auth:** Todas las dependencias a métodos como `signInWithPassword` o `signUp` han sido eliminadas por completo del código.
- **Manejo de Perfiles Integrado:** Toda tu información (enfermedades, dirección, alergias) ahora se guarda bajo la misma tabla en la columna `perfil` usando formato JSON. Esto simplifica tu estructura de base de datos a una sola tabla de control absoluto.
- **Persistencia de Sesión Local:** Volví a implementar un pequeño almacenamiento en `localStorage` (clave `sc_auth_session`) que guarda el ID único del usuario al loguearse. Si el usuario recarga la página, esta clave se utiliza para cargar sus datos desde la nube, logrando la persistencia sin el pesado cliente de Auth.
- **Logout:** El botón de salir ahora simplemente destruye la clave local, desconectando el dispositivo sin involucrar al servidor central.
