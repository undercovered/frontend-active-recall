# Active Recall — Front-end

Cliente web del sistema de estudio **Active Recall** (active recall + repetición
espaciada). Permite gestionar materias, temas y preguntas (flashcards) y repasarlas.
Es una **PWA** instalable, construida con **Angular 21** y **PrimeNG**.

Este repositorio es **independiente** del backend (API Node.js), al que consume por
HTTP en `/api`.

> Estado actual: base de la app montada (layout, dashboard, CRUD de materias en
> memoria). La conexión a la API se añade cuando el backend exponga los endpoints.

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos de dominio](#modelos-de-dominio)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts disponibles](#scripts-disponibles)
- [Configuración de entornos](#configuración-de-entornos)
- [PWA](#pwa)
- [Documentación adicional](#documentación-adicional)

---

## Stack tecnológico

| Componente | Tecnología                                             |
| ---------- | ------------------------------------------------------ |
| Framework  | Angular 21 (standalone, **zoneless**, **signals**)     |
| UI         | PrimeNG 21 + tema Aura (índigo)                        |
| Estilos    | SCSS + tokens de diseño (claro/oscuro)                 |
| PWA        | `@angular/service-worker`                              |
| Tipografía | Inter                                                  |
| Tests      | Vitest                                                 |

---

## Estructura del proyecto

Arquitectura **feature-based** (organizada por dominio de negocio):

```
src/app/
├── core/                 # Singletons transversales (se cargan una vez)
│   ├── services/         #   ej. pwa-update.service.ts
│   └── theme/            #   theme.service.ts, app-preset.ts (PrimeNG)
├── shared/               # Reutilizable y sin estado propio
│   └── ui/               #   ej. study-heatmap
├── features/             # ← Un módulo por dominio (lazy loading)
│   ├── home/             #   Dashboard
│   ├── subjects/         #   Materias  (data/ = modelos + store; pages/ = rutas)
│   ├── topics/           #   Temas
│   ├── cards/            #   Flashcards
│   └── review/           #   Sesión de repaso
└── layout/               # Shell (sidebar, navegación)
```

---

## Modelos de dominio

Alineados con las entidades del backend (mapeo directo por HTTP):

| Modelo      | Campos clave                                    |
| ----------- | ----------------------------------------------- |
| `Subject`   | `id`, `title`, `description`                     |
| `Topic`     | `id`, `title`, `description`, `subjectId`        |
| `Flashcard` | `id`, `question`, `topicId`                      |

Todos incluyen `createdAt` / `updatedAt`.

---

## Puesta en marcha

Requisitos: Node.js 22+.

```bash
npm install
npm start                   # http://localhost:4200
```

---

## Scripts disponibles

| Comando         | Descripción                                  |
| --------------- | -------------------------------------------- |
| `npm start`     | Servidor de desarrollo (`ng serve`)          |
| `npm run build` | Build de producción en `dist/`               |
| `npm test`      | Pruebas unitarias con Vitest                 |

---

## Configuración de entornos

El `apiUrl` se define por entorno (`src/environments/`):

- `environment.development.ts` → `http://localhost:3000/api` (local)
- `environment.ts` → `/api` (producción)

Cambiar de local a nube solo requiere ajustar estos archivos.

---

## PWA

- Service worker activo **solo en producción** (no en `ng serve`).
- `ngsw-config.json` cachea la app y define un `dataGroups` para `/api/**`.
- `PwaUpdateService` avisa al usuario cuando hay una versión nueva.

Para probarla, sirve el build de producción:

```bash
npm run build
npx http-server dist/active-recall-front/browser -p 8080
```

---

## Documentación adicional

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura detallada, estado con
  signals, sistema de diseño, PWA y justificación de decisiones.
