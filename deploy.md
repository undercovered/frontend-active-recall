# Despliegue — Front-end (Vercel + API en AWS)

El **cliente** se publica en **Vercel** (plan Hobby, dominio gratis
`tu-proyecto.vercel.app`). La **API y PostgreSQL** van a **AWS** (capa
gratuita). Esta guía cubre el front y lo que tienes que dejar listo en AWS
para que el navegador pueda hablar con Node.

El paso a paso de la máquina Linux (Lightsail/EC2, Postgres, nginx, systemd)
está en **`deploy.md` del repositorio del backend**. Léelo entero antes de
apuntar `apiUrl` a producción.

---

## Tabla de contenidos

1. [Dibujo del sistema](#1-dibujo-del-sistema)
2. [Qué va en Vercel y qué va en AWS](#2-qué-va-en-vercel-y-qué-va-en-aws)
3. [Capa gratuita AWS (resumen para el front)](#3-capa-gratuita-aws-resumen-para-el-front)
4. [Servicios AWS que usa (y los que no)](#4-servicios-aws-que-usa-y-los-que-no)
5. [Requisito duro: HTTPS en la API](#5-requisito-duro-https-en-la-api)
6. [Configurar `apiUrl` de producción](#6-configurar-apiurl-de-producción)
7. [Paso a paso en Vercel](#7-paso-a-paso-en-vercel)
8. [Dominio `*.vercel.app`](#8-dominio-vercelapp)
9. [Probar el conjunto](#9-probar-el-conjunto)
10. [Actualizar el front](#10-actualizar-el-front)
11. [Problemas frecuentes](#11-problemas-frecuentes)
12. [Checklist](#12-checklist)

---

## 1. Dibujo del sistema

```text
https://active-recall-xxxx.vercel.app     ← este repo (Angular, PWA)
                 │
                 │  fetch('/api/...')  NO
                 │  fetch('https://API-AWS/api/...')  SÍ
                 ▼
http(s)://IP-o-dominio-aws/api            ← repo backend en Lightsail/EC2
                 │
                 ▼
        PostgreSQL en la misma VM
```

Vercel **no** ejecuta Express. Solo entrega el `ng build` (HTML/JS/CSS). Cada
clic del alumno pega contra AWS.

---

## 2. Qué va en Vercel y qué va en AWS

| Pieza | Dónde | Por qué |
| ----- | ----- | ------- |
| Angular (este repo) | **Vercel Hobby** | HTTPS, CDN, dominio `*.vercel.app` gratis, deploys con git |
| Node + Express | **AWS Lightsail o EC2** | Proceso 24/7 y variables secretas (`JWT_SECRET`, pepper) |
| PostgreSQL | **La misma VM de AWS** (por defecto) | En una cuenta de más de 12 meses RDS **no es gratis**; el detalle está en el `deploy.md` del backend |
| Archivos estáticos de la PWA | Vercel | Service worker y `manifest` salen del `dist/.../browser` |

No subas el `.env` del backend a Vercel: ahí no corre Node.

---

## 3. Capa gratuita AWS (resumen para el front)

Esto afecta a **si tu API sigue viva**, no a Vercel.

- Cuentas **nuevas** (desde 15-jul-2025): hasta **200 USD** de créditos y un
  **Free plan** de 6 meses. Si se acaba, **cierran la cuenta**.
- Cuentas **de más de 12 meses** (legacy): el año de EC2/RDS micro **ya no
  aplica**. Lo que queda siempre gratis (Lambda, DynamoDB, Budgets…) no sustituye
  a Node + PostgreSQL 24/7. El camino barato es **Lightsail ~5 USD/mes** con
  Postgres en la misma VM. RDS es un extra de pago; ver el `deploy.md` del backend.
- Crea **AWS Budgets** (alerta a 1–5 USD). Es always-free.

Recomendación de máquina para la API: **Lightsail Ubuntu 24.04, plan 5 USD,
1 GB RAM**, IP estática, Node 22 + Postgres + nginx. Detalle en el
`deploy.md` del backend.

Si la VM se apaga, el front en Vercel seguirá abriéndose pero **login y datos
fallarán**.

---

## 4. Servicios AWS que usa (y los que no)

El front, en sí, **no crea recursos AWS**. Solo necesita que existan:

| En AWS | Rol respecto al front |
| ------ | --------------------- |
| Lightsail o EC2 | Host de `GET/POST /api/...` |
| IP estática | `apiUrl` no cambia al reiniciar la VM |
| Security group / firewall | Puertos 80 y 443 abiertos al mundo |
| nginx (+ opcional Certbot) | HTTPS para no chocar con Vercel |

No uses (para este proyecto): ALB, API Gateway, CloudFront delante de Angular
(Vercel ya es el CDN), S3+CloudFront para el SPA, Lambda.

CORS: el backend ya tiene `app.use(cors())` sin lista blanca, así que
`https://tu-app.vercel.app` puede llamar a la API sin más cambios.

---

## 5. Requisito duro: HTTPS en la API

Vercel sirve el front **siempre por HTTPS**. El navegador bloquea (mixed
content) las peticiones `http://` desde una página `https://`.

Por tanto, antes de dar el enlace `*.vercel.app` a alguien:

1. API con certificado (Let's Encrypt en nginx, dominio tipo
   `api.tudominio.com` → IP estática de Lightsail), **o**
2. Mientras desarrollas, prueba el build contra AWS desde `http://localhost`
   (`ng serve` sí puede pegar a `http://IP`).

Sin dominio para la API, el front en Vercel no podrá hablar en serio con AWS.
Un dominio barato solo para `api.` basta; el de la UI sigue siendo el de Vercel.

---

## 6. Configurar `apiUrl` de producción

Angular **incrusta** la URL en el build. No hay panel de Vercel que la cambie
después (salvo rebuild).

Edita `src/environments/environment.ts` **antes** de desplegar:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api',
};
```

Reglas:

- Incluye el prefijo `/api` (las clases `*Api` concatenan `/subjects`, etc.).
- Sin barra final: `.../api` sí, `.../api/` no.
- `environment.development.ts` **no** se usa en `ng build` (solo en `ng serve`).

Si dejas el valor por defecto `'/api'`, el navegador llamará a
`https://tu-app.vercel.app/api/...` y Vercel devolverá 404.

---

## 7. Paso a paso en Vercel

### 7.1 Cuenta y repo

1. Sube este repositorio a GitHub/GitLab/Bitbucket.
2. Entra en [vercel.com](https://vercel.com) con esa cuenta (plan **Hobby**).
3. **Add New → Project** e importa el repo del **front** (no el del backend).

### 7.2 Ajustes de build

Si Vercel detecta Angular 21, revisa que quede así (Framework Preset:
Angular, o Other):

| Campo | Valor |
| ----- | ----- |
| Root Directory | `.` (o `front-end` si el repo es un monorepo) |
| Install | `npm install` |
| Build | `npm run build` |
| Output | `dist/active-recall-front/browser` |

Este proyecto usa `@angular/build:application`: los estáticos salen en
`dist/active-recall-front/browser/` (`index.html`, `ngsw-worker.js`, iconos).

### 7.3 Rewrites de la SPA (importante)

Sin esto, recargar `/subjects` o `/topics/uuid` en Vercel da 404.

En la raíz del proyecto del front, crea `vercel.json` si aún no existe:

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

Más simple, válido porque **no** hay API en Vercel:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

El service worker y los ficheros con hash (`main-XXXX.js`) se sirven como
archivos reales; Vercel prioriza ficheros existentes sobre el rewrite.

### 7.4 Variables de entorno en Vercel

No hace falta `API_URL` salvo que más adelante parametríces el build. Hoy la
URL va en `environment.ts`. No copies `JWT_SECRET` ni `PGPASSWORD` aquí.

### 7.5 Deploy

**Deploy**. El primer build tarda un par de minutos. Si falla por Node:

- Settings → General → Node.js Version → **22.x**.

Al terminar, Vercel te da algo como:

`https://active-recall-front-xxxx.vercel.app`

---

## 8. Dominio `*.vercel.app`

- Cada proyecto tiene un dominio `nombre.vercel.app`.
- Cada pull request puede tener una URL de preview (`…-git-rama-usuario.vercel.app`).
- HTTPS y certificado los pone Vercel.
- Puedes renombrar el proyecto en Settings → Domains para que el subdominio
  sea más legible (`active-recall.vercel.app` si está libre).

No hace falta comprar dominio para la UI. El único dominio extra que conviene
es el de **la API en AWS** (sección 5).

---

## 9. Probar el conjunto

1. En AWS: `curl https://api.tudominio.com/api/health` (o HTTP en local).
2. Abre `https://tu-app.vercel.app/login`.
3. Registra un usuario (mismas reglas de contraseña que en local).
4. Crea una materia y un tema: deben persistir al recargar (están en Postgres).
5. En Inicio, la card de la materia debe mostrar preguntas **en proceso**.
6. Instala la PWA (navegador → “Instalar”) y comprueba que el icono abre Vercel.

En DevTools → Network las peticiones deben ir al **host de AWS**, no a
`.vercel.app/api`.

---

## 10. Actualizar el front

Cada `git push` a la rama de producción (normalmente `main`) dispara un deploy
en Vercel.

Si cambiaste `apiUrl` o el backend cambió de IP:

1. Edita `environment.ts`.
2. Commit + push (o Redeploy en el dashboard).
3. Los alumnos con la PWA verán el aviso de `PwaUpdateService` para recargar.

---

## 11. Problemas frecuentes

| Síntoma | Causa habitual | Qué hacer |
| ------- | -------------- | --------- |
| 404 al recargar `/topics` | Falta rewrite SPA | Añade `vercel.json` (sección 7.3) |
| Network error / mixed content | Front HTTPS, API HTTP | Certificado en nginx (backend `deploy.md` §9) |
| 404 en `/api/subjects` con host de Vercel | `apiUrl: '/api'` | Pon la URL absoluta de AWS |
| CORS rojo en consola | API caída o no es este backend | `curl` health; confirma `cors()` en Express |
| 401 al instante | JWT de otro `JWT_SECRET` (reinstalaste la VM) | Vuelve a iniciar sesión |
| Build “Cannot find module” | Node 18 en Vercel | Fija Node 22 |
| PWA no instala | No estás en HTTPS o SW falló | Solo el deploy de Vercel, no `ng serve` |

---

## 12. Checklist

- [ ] Backend en AWS con `/api/health` público (guía del otro repo)
- [ ] API por **HTTPS** si vas a usar el dominio de Vercel de verdad
- [ ] `environment.ts` → `https://…/api` (sin barra final)
- [ ] Proyecto Hobby en Vercel, Node 22, output `dist/active-recall-front/browser`
- [ ] `vercel.json` con rewrite a `index.html`
- [ ] Login real contra AWS y datos que sobreviven al F5
- [ ] Presupuesto AWS activo (el front es gratis; la VM no lo es para siempre)

Con esto el alumno entra por `https://….vercel.app` y estudia contra tu API en
la capa gratuita de AWS.
