# Guía de despliegue — Salud-Conecta IA v8.0.0

## Arquitectura

```
Usuario (Granada) → GitHub Pages (frontend) → Google Gemini API (gemini-2.5-flash)
```

La API key de Gemini se configura directamente en el frontend (`app.js`).
Opcionalmente, puede usarse el Cloudflare Worker como proxy para mayor seguridad.

---

## Opción A — Llamada directa desde frontend (actual)

La API key está configurada en `app.js` como constante `GEMINI_API_KEY`.
No se necesita backend. Solo publicar en GitHub Pages.

### Publicar en GitHub Pages

```bash
git add .
git commit -m "v8.0.0: migración a Gemini API"
git push origin main
```

---

## Opción B — Worker como proxy (más seguro, opcional)

### Requisitos
- Cuenta gratuita en cloudflare.com
- Node.js instalado
- La API key de Gemini (AIzaSy...)

### Comandos

```bash
# Instalar Wrangler (CLI de Cloudflare)
npm install -g wrangler

# Iniciar sesión en Cloudflare
wrangler login

# Ir a la carpeta del proyecto
cd salud-conecta

# Guardar la API key como Secret (seguro, nunca en código)
wrangler secret put GEMINI_API_KEY
# → te pedirá pegar la clave: AIzaSy...

# Guardar el origen permitido (URL de tu GitHub Pages)
wrangler secret put ALLOWED_ORIGIN
# → pegar: https://jp-romero.github.io

# Desplegar el worker
wrangler deploy
```

Al finalizar, Wrangler muestra la URL del worker:
```
https://salud-conecta-api.TU-USUARIO.workers.dev
```

---

## Tier gratuito de Cloudflare Workers

| Recurso         | Límite gratuito     |
|-----------------|---------------------|
| Peticiones/día  | 100,000             |
| CPU por petición| 10ms                |
| Memoria         | 128MB               |
| Dominios custom | Incluido            |

Para una app comunitaria de Granada, 100,000 peticiones/día es más que suficiente.

---

## Actualizar la API key en el futuro

### Si usas llamada directa (Opción A):
Editar la constante `GEMINI_API_KEY` en `app.js`.

### Si usas Worker (Opción B):
```bash
wrangler secret put GEMINI_API_KEY
# → pegar la nueva clave
wrangler deploy
```

---

## Verificar que funciona

Abrir la app en el navegador y enviar un mensaje de prueba en el chat.
La respuesta debe venir del modelo Gemini con el formato de urgencia (🔴/🟡/🟢).