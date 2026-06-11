# La Previa — Instrucciones de despliegue

Sitio de estadística de fútbol pre-partido. Prototipo v1.

---

## Archivos del proyecto

```
La previa/
├── index.html      ← La página (abre esto en el navegador para verla)
├── style.css       ← Colores y diseño
├── main.js         ← Comportamiento (barras animadas, formulario)
├── netlify.toml    ← Configuración para Netlify
├── .env.example    ← Plantilla de contraseñas (no tocar, es solo ejemplo)
├── .gitignore      ← Le dice a Git qué archivos ignorar
└── README.md       ← Este archivo
```

---

## Cómo publicar en Netlify (paso a paso, sin experiencia previa)

### Paso 1 — Crear cuenta en Netlify

1. Ve a **netlify.com** en tu navegador.
2. Haz clic en **"Sign up"** (registrarse).
3. Elige **"Sign up with email"** y crea una cuenta gratuita.

### Paso 2 — Subir el sitio

Tienes dos opciones. La más fácil es la opción A:

**Opción A — Arrastrar y soltar (recomendada para empezar)**

1. Entra a tu cuenta en netlify.com.
2. En el panel principal verás una zona que dice **"drag and drop your site folder here"**.
3. Abre el Explorador de Windows, busca la carpeta `La previa`.
4. **Arrastra la carpeta completa** y suéltala en esa zona de Netlify.
5. En segundos, Netlify te da una URL pública (algo como `nombre-aleatorio.netlify.app`).
   ¡Tu sitio ya está en internet!

**Opción B — Conectar con GitHub (mejor a largo plazo)**

Esto requiere crear una cuenta en GitHub primero. Te lo explico cuando estés listo para ese paso.

### Paso 3 — Verificar que el formulario funciona

1. Abre tu URL de Netlify en el navegador.
2. Escribe un correo en el formulario y haz clic en "Por correo".
3. Deberías ver el mensaje verde de confirmación.
4. En Netlify, ve a **Forms** en el menú izquierdo — ahí verás los correos recibidos.

> **Importante:** El formulario solo funciona cuando el sitio está publicado en Netlify.
> Si abres `index.html` directamente desde tu computador, el formulario no guarda nada
> (eso es normal — Netlify Forms necesita su servidor para funcionar).

---

## Para el futuro (Milestone 2)

Cuando conectes datos reales de la API de fútbol:

1. Copia `.env.example` y renómbralo a `.env`.
2. Llena `API_FOOTBALL_KEY` con tu clave real.
3. En Netlify, ve a **Site settings → Environment variables** y agrega la misma clave ahí.

---

## Disclaimer legal

Este sitio publica estadística e información.
**No es un pronóstico garantizado ni asesoría financiera. +18.**
