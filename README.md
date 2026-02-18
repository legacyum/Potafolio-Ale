# Portafolio de Alessandro Altamirano

## Recursos externos críticos (`index.html`)

| Tipo | Recurso | Estado actual | Criticidad | Política de actualización segura |
|---|---|---|---|---|
| Tipografías | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Remoto con familias explícitas | Alta (diseño global) | Mantener URL con familias/pesos concretos y validar estilo visual antes de publicar. |
| Web Component 3D | `model-viewer@3.4.0` desde Google CDN | Remoto con versión fija | Alta (render del modelo) | Subir solo de versión mayor/menor de forma planificada y probar fallback visual. |
| Iconografía | Font Awesome `6.4.0` (cdnjs) | Remoto con versión fija | Media | Actualizar de forma controlada (minor/patch) y revisar iconos usados en el HTML. |
| Modelo 3D | `GearboxAssy.glb` desde `raw.githack` | Remoto (rama `master`, no determinístico) | Alta | **Recomendado:** mover a un archivo local (`/models/...`) o fijar hash de commit en URL antes de producción. |
| Banderas | `flagcdn` (`es.png`, `us.png`) | Remoto con fallback local SVG | Media | Mantener fallback local (`img/flags/*.svg`) y revisar onerror tras cambios. |

## Dependencias JS críticas (ahora versionadas localmente)

Las librerías usadas para animación fueron estabilizadas con implementación local en `js/vendor` para evitar dependencia operativa del CDN en runtime:

- `js/vendor/scrollreveal-4.0.9.local.js`
- `js/vendor/typed-2.0.16.local.js`
- `js/vendor/particles-2.0.0.local.js`

### Flujo recomendado para actualizar estas dependencias

1. Hacer cambio en una rama dedicada (`chore/vendor-update-*`).
2. Si se adopta una librería upstream real, mantener el número de versión en el nombre del archivo local.
3. Validar que `js/main.js` siga funcionando sin cambios de API pública (`ScrollReveal`, `Typed`, `particlesJS`).
4. Probar la web offline/local para confirmar independencia de CDN en estas tres librerías.
5. Documentar en este README qué cambió y por qué.

## Fallbacks visuales implementados

- **Modelo 3D:** `model-viewer` usa `poster="img/industrial_hero.png"` y `data-fallback-image`, con reemplazo por imagen si ocurre error de carga.
- **Banderas:** cada `<img>` remoto usa `onerror` para caer a:
  - `img/flags/es.svg`
  - `img/flags/us.svg`

## Reglas de estabilidad

- Evitar URLs sin versión para recursos críticos.
- Priorizar recursos locales para JS/CSS críticos de UX.
- Si un recurso remoto no permite versionado fuerte (ej. rama mutable), registrar riesgo y definir plan de migración a archivo local.
