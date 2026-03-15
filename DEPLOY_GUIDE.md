# Guia para publicar StockIQ en internet (GRATIS)

## Lo que vas a necesitar

- Un ordenador con tu proyecto StockIQ
- Una cuenta de GitHub (gratis) — github.com
- Una cuenta de Vercel (gratis) — vercel.com

Tiempo estimado: 10-15 minutos

---

## PASO 1: Crear cuenta de GitHub (si no tienes)

1. Ve a **https://github.com** en tu navegador
2. Haz clic en **Sign up**
3. Introduce tu email, crea una contrasena, elige un nombre de usuario
4. Verifica tu email
5. Ya tienes cuenta

---

## PASO 2: Instalar Git en tu ordenador (si no lo tienes)

Abre tu terminal (en Mac: busca "Terminal" en Spotlight, en Windows: busca "Git Bash")

Comprueba si ya lo tienes escribiendo:

```
git --version
```

Si te sale un numero de version, ya lo tienes. Si no:

- **Mac**: Se instalara automaticamente al ejecutar el comando anterior (te pedira instalar Xcode tools, dale que si)
- **Windows**: Descarga desde https://git-scm.com/download/win e instala con las opciones por defecto

---

## PASO 3: Crear un repositorio en GitHub

1. Ve a **https://github.com/new**
2. En "Repository name" escribe: **stockiq**
3. Deja marcado **Public** (para que Vercel pueda acceder gratis)
4. NO marques "Add a README file" ni nada mas
5. Haz clic en **Create repository**
6. Te aparecera una pagina con comandos — dejala abierta, la necesitas

---

## PASO 4: Subir tu proyecto a GitHub

Abre tu terminal y navega a la carpeta de tu proyecto. Ejemplo:

```
cd ~/Desktop/stockiq
```

(Ajusta la ruta segun donde tengas la carpeta stockiq en tu ordenador)

Ahora ejecuta estos comandos **uno por uno** (copia y pega cada linea):

```
git init
```

```
git add -A
```

```
git commit -m "StockIQ v1.0"
```

```
git branch -M main
```

```
git remote add origin https://github.com/TU_USUARIO/stockiq.git
```

**IMPORTANTE**: Cambia `TU_USUARIO` por tu nombre de usuario de GitHub. Por ejemplo, si tu usuario es `javieryanez`, el comando seria:
`git remote add origin https://github.com/javieryanez/stockiq.git`

```
git push -u origin main
```

Te pedira tu usuario y contrasena de GitHub.

**NOTA**: GitHub ya no acepta contrasenas normales para push. Necesitas un "Personal Access Token":

1. Ve a https://github.com/settings/tokens
2. Haz clic en "Generate new token (classic)"
3. Ponle un nombre como "stockiq"
4. Marca la casilla **repo** (la primera)
5. Haz clic en "Generate token"
6. **COPIA el token** (solo se muestra una vez)
7. Cuando la terminal te pida la contrasena, pega el token en vez de tu contrasena

Si todo va bien, veras algo como:
```
Enumerating objects: 65, done.
...
To https://github.com/TU_USUARIO/stockiq.git
 * [new branch]      main -> main
```

Ve a https://github.com/TU_USUARIO/stockiq y veras tu codigo subido.

---

## PASO 5: Crear cuenta de Vercel y deployar

1. Ve a **https://vercel.com**
2. Haz clic en **Sign Up**
3. Elige **Continue with GitHub** (asi se conectan automaticamente)
4. Autoriza Vercel para acceder a tu GitHub

---

## PASO 6: Importar el proyecto en Vercel

1. Una vez dentro de Vercel, haz clic en **"Add New..."** > **"Project"**
2. Veras una lista de tus repos de GitHub. Busca **stockiq** y haz clic en **Import**
3. Vercel detectara automaticamente que es un proyecto Vite. Veras:
   - **Framework Preset**: Vite (ya seleccionado)
   - **Build Command**: `vite build` (ya puesto)
   - **Output Directory**: `dist` (ya puesto)
4. **NO necesitas tocar nada**. Solo haz clic en **Deploy**
5. Espera 1-2 minutos mientras construye tu app

---

## PASO 7: Tu web esta ONLINE

Cuando termine, Vercel te mostrara:
- Un confeti de celebracion
- Tu URL: algo como **stockiq-abc123.vercel.app**

Esa URL funciona desde:
- Tu movil
- Cualquier otro ordenador
- Se la puedes mandar a tus amigos por WhatsApp

La app funcionara en **MODO DEMO** con datos simulados (sin gastar llamadas API).

---

## EXTRA: Si quieres datos reales (opcional, NO necesario)

Si en algun momento quieres datos reales de bolsa en vez de simulados:

1. Crea una cuenta gratis en https://financialmodelingprep.com
2. Copia tu API key
3. En Vercel, ve a tu proyecto > **Settings** > **Environment Variables**
4. Anade una variable:
   - Name: `VITE_FMP_API_KEY`
   - Value: (pega tu API key)
5. Haz clic en **Save**
6. Ve a **Deployments** > haz clic en los 3 puntos del ultimo deploy > **Redeploy**

---

## Si haces cambios en el futuro

Cada vez que modifiques algo en tu codigo:

```
git add -A
git commit -m "descripcion de lo que cambiaste"
git push
```

Vercel detectara automaticamente el push y actualizara tu web en 1-2 minutos. No tienes que hacer nada mas.

---

## Resolucion de problemas

**"La pagina me da error 404 en las rutas"**
> Esto no deberia pasar porque ya tenemos `vercel.json` configurado. Si pasa, revisa que el archivo `vercel.json` este en la raiz del proyecto.

**"Los datos no cargan"**
> Normal — la app esta en modo demo con datos simulados. Si quieres datos reales, sigue el paso EXTRA de arriba.

**"Me pide contrasena al hacer git push"**
> Usa un Personal Access Token en vez de tu contrasena (ver Paso 4).

**"Vercel no detecta mi repo"**
> Asegurate de que el repo es Public en GitHub y que autorizaste Vercel para acceder a tus repos.
