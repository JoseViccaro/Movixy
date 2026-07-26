# Proposal: Refactor Limpieza Raíz y Arquitectura de Código

## Intent

Limpiar la contaminación de archivos de log temporales y carpetas de metadatos de herramientas en el directorio raíz de Movixy, e instaurar fronteras claras en la Clean Architecture (`domain`, `data`, `application`, `presentation`) alineando la estructura del código con la documentación.

## Scope

### In Scope
- Eliminar archivos residuales en la raíz (`continue_final.log`, `lint_output.txt`, `test_output.txt`, etc.).
- Actualizar `.gitignore` para ignorar logs temporales (`*.log`, `*_output.txt`) y carpetas de agentes (`.kiro/`, `.atl/`).
- Clarificar las fronteras entre `src/application/` (hooks de casos de uso y React Query) y `src/presentation/` (hooks puramente de UI y componentes).
- Actualizar `ARCHITECTURE.md` para reflejar la capa `application/` y la estrategia de estado con `@tanstack/react-query`.
- Verificar y unificar aliases en `tsconfig.app.json` y `vite.config.ts`.

### Out of Scope
- Reescritura de la lógica de negocio en `domain/`.
- Cambio de framework de UI o rediseño estético de componentes.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

1. **Saneamiento de Raíz**: Limpiar logs residuales y endurecer `.gitignore`.
2. **Refactorización de Capas**: Delimitar responsabilidades en `src/application` (casos de uso / hooks con `@tanstack/react-query`) y `src/presentation` (hooks de vista).
3. **Alineación de Configuración y Docs**: Actualizar `ARCHITECTURE.md` y aliases en `tsconfig`/`vite`.
4. **Verificación**: Ejecutar suite de pruebas (`npm run test:run`) y linter (`npm run lint`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.gitignore` | Modified | Agregar patrones para logs y directorios `.kiro/`, `.atl/`. |
| Root Directory | Modified | Eliminar 13+ archivos de log/debug residuales. |
| `src/application/` | Modified | Organizar hooks de aplicación y casos de uso. |
| `src/presentation/` | Modified | Mantener únicamente componentes y hooks de UI local. |
| `ARCHITECTURE.md` | Modified | Actualizar documentación de Clean Architecture y React Query. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ruptura de importaciones al mover hooks | Med | Ejecutar `npm run test:run` y `npm run lint` tras cada ajuste de ruta. |

## Rollback Plan

Revertir los cambios vía Git (`git checkout .` / `git clean -fd` para descartar los movimientos).

## Dependencies

- Ninguna externa.

## Success Criteria

- [ ] Directorio raíz limpio sin archivos `.log` ni carpetas de agentes rastreadas.
- [ ] Suite de pruebas (`npm run test:run`) pasa exitosamente.
- [ ] Linter (`npm run lint`) ejecuta sin errores.
- [ ] `ARCHITECTURE.md` refleja fielmente la estructura real del proyecto.
