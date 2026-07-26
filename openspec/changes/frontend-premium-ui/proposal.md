# Proposal: Frontend Premium UI (Estilo Netflix / Apple TV / HBO Max)

## Intent

Transformar la experiencia de usuario y el acabado estético de Movixy a un nivel de aplicación de streaming premium (estilo Netflix / Apple TV / Max) mediante iluminación ambiental dinámica, animaciones de foco TV aceleradas por hardware, esqueletos de carga sin parpadeos y un reproductor OSD rediseñado con controles avanzados.

## Scope

### In Scope
- **Ambient UI & Iluminación Dinámica**: Implementar fondo ambiental con resplandor cromático (*ambient color bleed / glow*) que reaccione al título enfocado.
- **Foco & Navegación TV**: Anillos de foco de alto contraste (*glow rings*), elevación 3D en tarjetas y centrado suave de filas (*smooth center scroll*) con el control remoto.
- **Resiliencia & Cero Parpadeos**: Shimmers/esqueletos de carga durante la obtención de datos y pantallas de error/vacío elegantes con botón de reintento.
- **Modal de Detalles & OSD de Reproductor**: Modal de películas/series rediseñado con grid de episodios y avance visto; reproductor con salto +/-10s, selector flotante de idiomas y botón "Saltar Intro".

### Out of Scope
- Reescritura del backend de Jellyfin o clientes de API HTTP.
- Modificación del esquema de base de datos o lógica de autenticación.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

1. **Sistemas de Diseño & Estilos**: Definir tokens CSS para luces ambientales, animaciones aceleradas por hardware y anillos de foco TV.
2. **Componentes de Navegación & Héroe**: Actualizar `Hero`, `MovieRow` y `MediaCard` con resplandor dinámico, centrado automático y shimmers de carga.
3. **Modal de Detalles & Reproductor OSD**: Mejorar la experiencia de vista previa de episodios y el reproductor de video con accesos rápidos.
4. **Resiliencia & Fallbacks**: Incorporar estados vacíos visualmente pulidos y notificaciones flotantes ante errores.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/presentation/components/Hero/` | Modified | Carrusel automático, gradientes profundos en capas y acciones rápidas. |
| `src/presentation/components/MovieRow/` | Modified | Anillos de foco TV 3D, centrado automático y esqueletos de carga (Shimmers). |
| `src/presentation/components/MediaModal/` | Modified | Pestañas de temporadas/episodios, barra de progreso visto y selector de audio. |
| `src/presentation/components/VideoPlayer/` | Modified | OSD flotante con saltos 10s, selector de audio/subtítulos y botón "Saltar Intro". |
| `src/presentation/components/ImmersiveBackdrop/` | New/Modified | Fondo dinámico con resplandor cromático difuminado. |
| `src/presentation/components/ErrorBoundary/` | Modified | Fallbacks visuales con botón de reintento. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rendimiento de animaciones en televisores de gama baja | Med | Usar exclusivamente propiedades `transform` y `opacity` con aceleración GPU. |

## Rollback Plan

Revertir los cambios de UI vía Git (`git checkout .`).

## Dependencies

- `@tanstack/react-query` ya instalado.
- `lucide-react` para iconografía moderna.

## Success Criteria

- [ ] La interfaz presenta iluminación ambiental dinámica y transiciones de foco suaves de alto contraste en TV.
- [ ] Cero parpadeos blancos durante la carga de datos gracias a esqueletos de carga (*Shimmers*).
- [ ] Modal de detalles y reproductor OSD ofrecen controles estilo streaming premium (saltos 10s, selección de pista de audio/subtítulos).
- [ ] 100% de los tests pasan (`npm run test:run`) y linter ejecuta sin errores (`npm run lint`).
