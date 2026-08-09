# Proposal: Sube todos los cambios pendientes al remoto

## Intent

Desbloquear trabajo nuevo limpiando el working tree. Dos ciclos SDD completos (frontend-premium-ui y refactor-limpieza-arquitectura — 18/18 tasks PASS) yacen sin commit ni push, acumulando ~109 archivos modificados/eliminados/sin-track. Esto impide empezar una idea nueva en limpio y pone en riesgo el trabajo local si el disco falla.

## Scope

### In Scope
- **.gitignore patch**: añadir `coverage/`, `android/app/build/`, `assets/` para excluir artefactos de build (33MB total).
- **Commit 1**: `frontend-premium-ui` — staged en commit propio con mensaje convencional.
- **Commit 2**: `refactor-limpieza-arquitectura` — staged en commit propio con mensaje convencional.
- **Commit 3**: el commit pendiente de HLS fix (aec428e) ya está en el repo local pero no en origin.
- **Push**: los 3 commits a `origin/main`.

### Out of Scope
- Optimizar o modificar el CI/CD existente.
- Ejecutar lint o tests antes del push (ya pasaron en verify).
- Husky pre-push hooks o lint-staged.
- Rebase, squash, reset o cualquier reescritura de historia.

## Capabilities

### New Capabilities
- None (cambio de infraestructura/operaciones, no afecta specs de producto)

### Modified Capabilities
- None

## Approach

1. **Parchear .gitignore** — añadir `coverage/`, `android/app/build/`, `assets/` **antes** de cualquier stage, para evitar subir binarios de 33MB al remoto.
2. **Stage por ciclo** — usando `git add` granular por ruta, commitear cada ciclo SDD como commit atómico independiente.
3. **Push seguro** — `git push origin main`.
4. **Verificación post-push** — confirmar que `git status` queda limpio y `origin/main` tiene los commits esperados.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.gitignore` | Modified | Add `coverage/`, `android/app/build/`, `assets/` |
| Working tree | Limpio | ~109 archivos → 0 tras commits + push |
| Remote `main` | +3 commits | HLS fix + frontend-premium-ui + refactor-limpieza |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Push fails por permisos de red/GitHub | Low | `git push` con error explícito; no hay cambios en remoto que dañar |
| Build artifacts trackeados por error | Med | El .gitignore se parchea **antes** de cualquier stage; `git status` confirmará que no hay binarios staged |
| Conflictos con origin/main si alguien pusheó entre | Low | Comprobar `git fetch + log`; si hay divergencia, hacer `--force-with-lease` solo si se entiende la divergencia, o abortar |

## Rollback Plan

1. **Si falla .gitignore antes de commit**: `git checkout .gitignore` y reintentar.
2. **Si falla push**: los commits quedan locales. Se puede recovery con `git push origin main` más tarde.
3. **Si algo se subió mal**: `git reset HEAD~N` localmente (soft para preservar cambios) y `git push --force-with-lease` para corregir — solo bajo supervisión.
4. **Último recurso**: `git reflog` para recuperar cualquier estado perdido. No se espera necesario porque solo son commits + push.

## Dependencies

- Conexión a GitHub con credenciales/configuración de remote válida (`origin` ya configurada).
- Ninguna librería externa ni permiso especial.

## Success Criteria

- [ ] `.gitignore` parcheado (coverage, android/app/build, assets excluidos)
- [ ] `git status` limpio tras los commits
- [ ] `origin/main` incluye los 3 commits en `git log`
- [ ] Working tree listo para empezar nueva idea sin cambios locales pendientes
