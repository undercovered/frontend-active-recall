# Active Recall — Front-end

Cliente web del sistema de estudio **Active Recall**. Gestiona materias, temas y
preguntas (flashcards) y las repasa con repetición espaciada. Es una **PWA**
instalable, con **Angular 21** y **PrimeNG**.

Repositorio **independiente** del backend (Node + Express + PostgreSQL). Habla
con él por HTTP bajo el prefijo `/api` y un JWT.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Qué hace la app hoy](#qué-hace-la-app-hoy)
- [Modelos](#modelos)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts](#scripts)
- [Entornos](#entornos)
- [PWA](#pwa)
- [Documentación adicional](#documentación-adicional)

---

## Stack tecnológico

| Componente | Tecnología                                         |
| ---------- | -------------------------------------------------- |
| Framework  | Angular 21 (standalone, zoneless, signals)         |
| UI         | PrimeNG 21 + preset índigo propio                  |
| Estilos    | SCSS + tokens claro/oscuro                         |
| HTTP       | `HttpClient` + interceptor JWT                     |
| PWA        | `@angular/service-worker`                          |
| Tipografía | Inter                                              |
| Tests      | Vitest (`ng test`)                                 |

---

## Estructura del proyecto

Arquitectura **feature-based** (por dominio, no por tipo de archivo):

```
src/app/
├── core/                 # Auth, HTTP, tema, PWA
├── shared/ui/            # Heatmap y piezas sin store
├── features/
│   ├── auth/             # Login / registro / olvido
│   ├── home/             # Dashboard (racha, stats, cards de materia)
│   ├── subjects/         # CRUD materias
│   ├── topics/           # Temas globales, por materia y ficha de tema
│   ├── cards/            # Preguntas globales
│   └── review/           # Sesión de repaso
└── layout/               # Sidebar
```

Cada feature tiene `data/` (modelo + API + store con signals) y `pages/`.

---

## Qué hace la app hoy

- Registro, login y recuperación (contra `/api/auth` y `/api/users`).
- **Materias**, **temas** (tabla global y por materia) y **ficha de tema**
  (`GET /topics/:id`: título, descripción y preguntas).
- **Preguntas** globales (alta con dropdown de materia → tema) o desde el tema
  (sin dropdowns: ya se sabe el dueño).
- **Repasar**: sesión del día, tipos única / múltiple / abierta.
- **Inicio**: heatmap, métricas (debido hoy, nº de temas, retención) y cards
  de materia con **para repasar** y **en proceso** (preguntas con menos de 7
  repasos completados).

La retención del dashboard **no** es “% de aciertos”. Es un modelo de olvido;
un tema creado hoy sale al 100 % aunque no hayas repasado. Detalle en la
arquitectura del backend.

---

## Modelos

Alineados con el `toJSON()` del backend (camelCase):

| Modelo      | Campos extra respecto al CRUD básico |
| ----------- | ------------------------------------ |
| `Subject`   | `title`, `description`               |
| `Topic`     | `subjectId`, `subjectTitle?`, `flashcards?`, `recalls?` |
| `Flashcard` | `topicId`, `subjectId`, `answerType`, `answers` |

---

## Puesta en marcha

Requisitos: Node.js 22+. El backend debe estar en marcha (por defecto
`http://localhost:8080`).

```bash
npm install
npm start                   # http://localhost:4200
```

Si el API usa otro puerto, edita
`src/environments/environment.development.ts`.

---

## Scripts

| Comando         | Descripción                         |
| --------------- | ----------------------------------- |
| `npm start`     | `ng serve` (entorno development)    |
| `npm run build` | Producción en `dist/`               |
| `npm test`      | Vitest vía `ng test`                |

---

## Entornos

`src/environments/`:

| Archivo                       | Cuándo                         | `apiUrl` típico |
| ----------------------------- | ------------------------------ | --------------- |
| `environment.development.ts`  | `ng serve`                     | `http://localhost:8080/api` |
| `environment.ts`              | `ng build` (producción)        | URL pública del backend, **incluido `/api`** |

En producción el front vive en **Vercel** (`*.vercel.app`) y el API en **AWS**.
No dejes `apiUrl: '/api'`: eso pegaría contra Vercel, no contra Node.
El valor correcto es del estilo `https://api.tudominio.com/api`.

---

## PWA

- Service worker **solo en el build de producción**.
- `ngsw-config.json` cachea la app y usa *freshness* para `/api/**`.
- `PwaUpdateService` propone recargar si hay versión nueva.

```bash
npm run build
npx http-server dist/active-recall-front/browser -p 8080
```

---

## Documentación adicional

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — features, signals, diseño, PWA.
- [`deploy.md`](deploy.md) — Vercel (dominio gratis) + cómo apunta a la API en AWS.
  El paso a paso de la VM está en `deploy.md` del backend.
