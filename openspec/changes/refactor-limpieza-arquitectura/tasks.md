# Tasks: Refactor Limpieza Raíz y Arquitectura de Código

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Saneamiento de raíz, `.gitignore`, aliases, delimitación de `application` y actualización de docs | PR 1 | Single PR, low risk |

## Phase 1: Saneamiento de Raíz y Configuración (Foundation)

- [x] 1.1 Actualizar `.gitignore` agregando reglas para `*.log`, `*_output.txt`, `.kiro/` y `.atl/`.
- [x] 1.2 Eliminar archivos de log/debug residuales en la raíz (`continue_final.log`, `lint_output.txt`, `test_output.txt`, etc.).
- [x] 1.3 Agregar el alias `@application/*` en [tsconfig.app.json](file:///Users/joseviccaro/Desktop/Movixy/tsconfig.app.json) y `@application` en [vite.config.ts](file:///Users/joseviccaro/Desktop/Movixy/vite.config.ts).

## Phase 2: Delimitación de Capas (Core Implementation)

- [x] 2.1 Auditar `src/application/` y consolidar hooks de casos de uso / React Query en `src/application/hooks`.
- [x] 2.2 Reorganizar `src/presentation/hooks` para que contenga únicamente hooks específicos de la interfaz de usuario.
- [x] 2.3 Actualizar importaciones en componentes para utilizar el alias `@application` cuando corresponda.

## Phase 3: Documentación (Documentation)

- [x] 3.1 Actualizar [ARCHITECTURE.md](file:///Users/joseviccaro/Desktop/Movixy/ARCHITECTURE.md) incorporando la capa `application/`, el alias `@application` y la estrategia de estado con `@tanstack/react-query`.

## Phase 4: Verificación (Testing & Quality)

- [x] 4.1 Ejecutar suite de pruebas unitarias/integración con `npm run test:run`.
- [x] 4.2 Ejecutar validación de linter y tipos con `npm run lint` y `npx tsc -b`.
