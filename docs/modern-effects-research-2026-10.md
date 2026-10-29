# Modern animation and 3D research for DEFORMAT

Research date: 29 October 2026. This is a design and engineering study, not a renderer migration or an implemented-effects announcement. The production site was left unchanged.

## 1. Recommendation

Develop the site around one recognisable transformation: the monochrome female sculpture changes from solid platinum to a flowing field of particles, travels through a real three-dimensional aperture, and reforms in the next scene. Typography and the topographic field should respond to that movement. Improve the figure's surface detail and lighting alongside this choreography.

The strongest next work is a combination of better sculpture presentation, a fluid-metal transformation, a true 3D portal, and more coherent particle movement. These complement the existing black/white/red direction and retain the woman as the visual focus. They can be prototyped in the current WebGL renderer. WebGPU becomes more attractive for larger, persistent simulations.

"Modern" below describes current implementation options and visual treatment. Many underlying techniques, including Fresnel reflections, particles, depth of field and portals, have long histories. A recently updated package does not establish that an effect was invented in 2026.

## 2. Current implementation and constraints

The repository uses Three.js 0.180.0, WebGLRenderer, a bundled local female GLB, MeshPhysicalMaterial, custom GLSL injected with onBeforeCompile, and separate HTML typography and controls. It already contains camera choreography, red 3D bars, monochrome surface/contour/particle modes, reversible particle dispersion, a draggable orientation surface, procedural terrain, and a CSS-perspective contact portal. Its rendering loop is capped around 30fps, with reduced-motion and WebGL-unavailable handling.

Consequently:

- Replacing a CSS effect with genuine geometry or a rendered second scene would be a material visual change.
- Replacing the current independent vertex offsets with persistent velocity, flow and attraction would materially improve the particles.
- Additional lighting and surface detail would improve the woman's appearance. A more anatomically natural or photorealistic result also requires a suitable base sculpt and pose. Shader effects alone have limits on the existing stylised character.
- The vanilla-JavaScript structure can support the proposed effects. React or React Three Fiber would be a separate architecture decision.
- WebGPU migration requires more than changing the renderer import: current onBeforeCompile/GLSL effects need a node/TSL implementation or a retained WebGL rendering path.

## 3. Verified current tooling

Versions and publication dates were read directly from the npm registry during this research. They are a dated snapshot, not instructions to upgrade automatically. The machine-readable record is `research/release-snapshot-2026-10-29.json`.

| Tool | Latest version observed | Published | Relevance |
| --- | --- | --- | --- |
| Three.js | 0.186.1 | 24 Sep 2026 | Current rendering, TSL and WebGPU development |
| GSAP | 3.15.0 | 13 Apr 2026 | Coordinated DOM/camera timelines and scroll choreography |
| Spark | 2.4.0 | 20 Oct 2026 | Gaussian splats integrated into Three.js |
| three-gpu-pathtracer | 0.0.27 | 8 Oct 2026 | Current progressive path tracing; requires WebGPU in the reviewed documentation |
| postprocessing | 6.39.5 | 9 Sep 2026 | Mature WebGL postprocessing; current peer range includes Three.js 0.180.0 |
| Lenis | 1.3.27 | 15 Oct 2026 | Optional smooth-scroll coordination |

The current Spark package declares Three.js >=0.180.0. The reviewed path tracer declares Three.js >=0.185.0, so the site's pinned 0.180.0 does not satisfy it. Package peer compatibility alone does not prove that a library will composite correctly with this site's custom materials, particles and HTML layers.

Sources: [Three.js registry](https://registry.npmjs.org/three), [GSAP registry](https://registry.npmjs.org/gsap), [Spark registry](https://registry.npmjs.org/@sparkjsdev/spark), [path tracer registry](https://registry.npmjs.org/three-gpu-pathtracer), [postprocessing registry](https://registry.npmjs.org/postprocessing), [Lenis registry](https://registry.npmjs.org/lenis).

## 4. Prioritised effects

These ratings are design and engineering estimates relative to this repository, not measured performance results. Asset quality, screen resolution and device GPU can change the cost substantially.

| Effect | Specific application here | Visual impact | Relative work | Mobile approach |
| --- | --- | --- | --- | --- |
| Sculptural studio lighting and surface detail | Moving white reflection bands describe the woman's curves; soft contact shadows ground the figure | High | Medium; asset work varies | Strong fit with baked/environment lighting |
| Fluid-metal surface transformation | A local touch ripple travels across the platinum sculpture before it disperses | Very high | Medium–high | Reduced mesh/normal-based deformation |
| Flow-field particles and reassembly | Silver particles orbit, stream around typography, then converge into the female silhouette | Very high | Medium–high in WebGL; high for WebGPU migration | Lower particle count, simplified field |
| Genuine 3D portal | Sculpture and particles pass through an aperture into another scene with correct occlusion | Very high | High | One secondary render at reduced resolution |
| Depth-aware 3D typography | Some letters sit in front of the woman and some behind her as the camera passes | High | Medium–high | Limited 3D text; keep readable HTML |
| Sculptural ribbons / restrained cloth motion | A thin red strip reacts to movement and frames the waist or portal | High | Medium; full cloth is higher | Small joint/Verlet strip or shader deformation |
| Reactive topographic terrain | Terrain rises around the figure and is transformed into the next section | High | Medium | Coarser grid or the existing 2D contours |
| Cinematic focus and selective light bloom | A short focus pull emphasises face and silhouette during the close-up | Medium–high | Medium | Disable blur; retain composition and light |
| Screen-space indirect lighting/reflections | White figure picks up subtle environmental light; a floor adds reflected depth | High when staged well | High for the current pipeline | Environment maps and simple AO/shadows |
| Gaussian-splatting scene or portrait | A captured gallery/environment or scanned portrait supplies photographic depth | Very high with a suitable capture | High, asset-dependent | Compressed splats and quality limits |
| Progressive path tracing | A still hero or paused close-up resolves into a highly realistic lit image | Very high for stills | High | Pre-rendered or conventional real-time fallback |
| Native view transitions and scroll-linked layout | Work panels, navigation and editorial elements transition as a unified system | Medium–high | Low–medium | Strong fit with feature detection |

### 4.1 Sculptural lighting and a stronger natural figure

Use a carefully lit monochrome studio environment, broad key light, narrow rim light, roughness variation and subtle normal detail. Let light travel slowly across the curves, rather than relying on a colour change. Add a soft contact shadow or a restrained plinth during the white stage if the figure should feel grounded.

For the requested natural woman, evaluate the base mesh's anatomy, facial structure, hair, hands and pose at the actual close-up distance. A higher-quality sculpt, good topology and well-authored surface detail are more consequential than adding a glow pass. The present model remains stylised after proportional adjustments.

For a porcelain treatment, choose a dedicated material treatment and detail maps. Transparent/transmissive material settings are not by themselves a physically accurate skin subsurface-scattering solution.

**Implementation:** existing WebGL physical materials and environment maps; new roughness/normal maps or a revised GLB where needed. A new asset would need compression/texture optimisation and appropriate rights to use its likeness and model.

**Priority:** first, alongside the next signature interaction.

### 4.2 Fluid-metal transformation

A cursor or touch creates a subtle deformation that travels over the sculpture. During a scene transition, the surface briefly behaves like flowing metal, then returns to a clean female silhouette. Keep the head and hands restrained so the effect remains elegant and recognisable.

There are two useful quality levels: a shader-based displacement/normal perturbation, and a persistent GPU simulation. The first is more practical immediately. Neither should be described as a full fluid simulation unless one is actually implemented.

The current skinned mesh needs deformation after skinning, with consistent normals. Large deformations can reveal mesh intersections, seams and the custom head closure. Prototype the effect at silhouette edges and the close-up camera position before committing to strong amplitudes.

**Reference:** [Three.js TSL raging sea example](https://threejs.org/examples/#webgpu_tsl_raging_sea), [pinned source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_tsl_raging_sea.html). This is a surface-deformation reference, not a ready-made fluid-human implementation.

**Priority:** high, using controlled deformation first.

### 4.3 Flow-field particles and organic reassembly

The current dissolve offsets points away from their positions. A more sophisticated version stores velocity and lifetime, introduces curl/turbulence, reacts to the pointer, and uses attraction back to sampled surface targets. Particles can move in coherent streams rather than a broad random cloud.

For this site: dissolve one shoulder first, let a ribbon of silver particles pass between words, then reassemble from feet to head. Camera motion and the attraction field should share one timeline. The interaction must remain reversible and scrubbable.

Use a stable surface sample distribution. The current indexed mesh can render the same vertex repeatedly; unique or area-weighted samples give more useful visual density per rendered particle. WebGL render-target simulation is a viable route. WebGPU storage buffers/compute are attractive for larger simulations.

**References:** [GPU compute particles](https://threejs.org/examples/#webgpu_compute_particles), [linked-particle VFX](https://threejs.org/examples/#webgpu_tsl_vfx_linkedparticles), [r186 source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_tsl_vfx_linkedparticles.html). The source demonstrates persistent position/velocity buffers and a turbulence field; it is not a plug-in for our sculpture.

**Priority:** high. This would build directly on the existing interaction.

### 4.4 A genuine portal with depth and scene continuity

The existing contact portal is a CSS perspective effect. A genuine 3D portal renders a second view into an aperture, using a render target or a stencil/depth mask. A figure can be partly in the opening and partly outside, with foreground text or the frame occluding it correctly.

For this site: the woman moves toward a red ellipse, her contour becomes a stream of particles at its edge, and the next space becomes visible inside it. The camera passes through the opening to reach the next section. For contact, the portal can remain a navigable email link; any hover or preview interaction should preserve its actual action.

This needs explicit decisions about scene content, camera correspondence, clipping, transparency and compositing. A render-target portal adds another scene render; recursive portals are substantially more expensive. Mobile should use one lower-resolution portal layer.

**Implementation:** custom Three.js render-target/stencil work. This proposal is an engineering design, not a claim that a turnkey portal package was verified.

**Priority:** high as the principal visual signature.

### 4.5 Depth-aware typography

Place a small set of large title glyphs in the 3D scene, with depth testing against the sculpture. Keep supporting copy and controls as accessible HTML. Perspective, scale and controlled occlusion can make the camera feel as though it travels through the words.

For this site: the woman starts inside a narrow gap between words, a foreground letter briefly crosses her shoulder, and the camera emerges into the white scene. An SDF/MSDF text renderer is one option; simple mesh text is another. A depth-mask compositor can also keep HTML text while controlling occlusion, but synchronisation is more involved.

A lens distortion over text is a separate technique: WebGL refraction cannot automatically sample ordinary HTML behind the canvas. The text must be rendered into the relevant scene/texture or the distortion must be a separate DOM effect. Important information must remain readable and in the accessibility tree.

**Priority:** medium–high, after the scene timeline and portal direction are settled.

### 4.6 Red ribbons and sculptural fabric

A restrained red ribbon can arc around the figure, react to movement, and become the portal's edge. This continues the red architectural motif already present in the reference.

A small simulated strip or a bone/shader-driven ribbon may give the desired movement at a modest cost. Full garment simulation is a different scope, involving collision, stability and garment construction. The ribbon should frame the woman without obscuring her anatomy or intercepting controls.

**Priority:** medium. Prototype one ribbon before introducing a full cloth system.

### 4.7 Terrain that participates in the transformation

Upgrade the current contour drawing into a three-dimensional height field during the transition. Use analytic noise, controlled waves and a moving cross-section so the ground rises, folds and clears around the sculpture.

The compelling detail is synchronisation: the terrain wave reaches the head close-up at the same point the red structure rotates and the background turns white. A separate perpetual wave is less connected to the experience.

**Reference:** [TSL procedural terrain](https://threejs.org/examples/#webgpu_tsl_procedural_terrain), [r186 source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_tsl_procedural_terrain.html).

**Priority:** medium–high. Retain the 2D contour version as a lower-cost alternative.

### 4.8 Cinematic focus and controlled optical effects

Use a brief focus pull toward the face during the close-up, then restore focus before the visitor reads the next section. Small selective bloom on highlights or portal edges can support this. Anisotropy can produce controlled brushed-metal highlights where appropriate.

Depth-of-field blur, bloom and motion blur consume pixel bandwidth, especially at high device-pixel ratios. A postprocessing blur applied indiscriminately can soften typography and controls. The render pipeline should isolate the 3D scene from important HTML.

**References:** [WebGPU depth of field](https://threejs.org/examples/#webgpu_postprocessing_dof), [WebGPU bloom](https://threejs.org/examples/#webgpu_postprocessing_bloom), [WebGL postprocessing library](https://github.com/pmndrs/postprocessing).

**Priority:** polish after the main motion is strong. Mobile can disable optical blur while keeping camera framing and light.

### 4.9 Screen-space global illumination and reflections

SSGI estimates indirect illumination from the rendered image; SSR estimates reflections using visible screen data. These can add depth to a white gallery scene and give the sculpture a stronger relationship to its environment.

They have limitations: off-screen objects are missing from screen-space calculations, and temporal techniques can introduce trails or flicker during fast camera movement. Existing transparent-canvas/HTML compositing must be considered because an effect cannot reflect arbitrary DOM content as if it were geometry in the scene.

The r186 examples include normal/depth inputs and, for SSGI, motion-vector-related inputs. This is a meaningful pipeline addition. The classic WebGL `postprocessing` package and Three.js's WebGPU/TSL pipeline should be evaluated as separate integration routes.

**References:** [SSGI demo](https://threejs.org/examples/#webgpu_postprocessing_ssgi), [SSGI source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_ssgi.html), [SSR demo](https://threejs.org/examples/#webgpu_postprocessing_ssr), [SSR source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_ssr.html).

**Priority:** selective high-quality mode, after basic lighting and geometry.

### 4.10 Gaussian splatting and captured realism

Gaussian splatting represents captured appearance with many spatial splats. It is particularly interesting for a photographic gallery or scanned portrait/environment. Spark 2.4.0 integrates splats with Three.js and documents per-splat transformation, GPU editing, displacement and skeletal animation.

Animation is possible; a static scan does not automatically become a clean, anatomically deformable character. Capture quality, unseen surfaces, animation authoring, compression, sorting and editing remain important. The current GLB cannot simply be converted into a photorealistic capture by adding a library.

For this project, a captured environment behind the existing sculpture is a strong first experiment. Replacing the woman with an animated scan is a separate asset and rendering project. Existing mesh contour and dissolve shaders would need equivalent splat operations.

Spark's current documentation demonstrates WebGL rendering and declares Three.js >=0.180.0; WebGPU migration is not a prerequisite for evaluating it. Maintainer portability/performance claims have not been independently benchmarked for our scene.

**References:** [Spark](https://github.com/sparkjsdev/spark), [examples](https://sparkjs.dev/examples/), [registry snapshot](https://registry.npmjs.org/@sparkjsdev/spark).

**Priority:** exploratory, asset-dependent.

### 4.11 Progressive path tracing

Path tracing can produce convincing reflections, material response and indirect light. The current three-gpu-pathtracer documentation uses WebGPU, and its current package requires Three.js >=0.185.0.

It accumulates samples over time. Camera or scene changes affect accumulation, and the reviewed API exposes progressive `renderSample()` calls. Expect a tradeoff between convergence, noise, resolution, denoising and responsiveness; a moving scroll sequence should not be promised offline-render-quality at a guaranteed frame rate.

For this site, evaluate a high-quality paused portrait or opening still that resolves while idle. Keep conventional real-time rendering for continuous navigation until measured results justify another route.

**References:** [project and demos](https://github.com/gkjohnson/three-gpu-pathtracer), [API](https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/src/webgpu/API.md).

**Priority:** experimental hero/idle mode, not the next default renderer change.

### 4.12 Modern native transitions and shared timelines

Use a coherent timeline to coordinate camera, text, material and portal changes. GSAP's current release is one possible orchestration tool; the current custom state system can also be extended. Smooth-scroll middleware is optional, and native vertical scrolling should remain usable.

Same-document View Transitions can coordinate gallery changes or an index overlay with named elements. They operate on captured document states; they do not replace the live 3D simulation or depth buffer.

CSS scroll-driven animations are useful for supported browsers, with a JavaScript fallback where necessary. They should share a consistent progress model with the renderer rather than introducing an unrelated animation clock.

**References:** [GSAP repository](https://github.com/greensock/GSAP), [MDN ViewTransition compatibility data](https://github.com/mdn/browser-compat-data/blob/main/api/ViewTransition.json), [animation-timeline data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json).

**Priority:** high for consistency; moderate visual impact by itself.

## 5. WebGPU: applicability and migration

Three.js r186's WebGPURenderer source documents automatic WebGL2 fallback when WebGPU is unavailable. That renderer-level fallback does not establish identical support, speed or fidelity for every compute or postprocessing effect.

The current material source explicitly documents onBeforeCompile as a WebGLRenderer facility and recommends the node-material/TSL route for WebGPURenderer. Our contour lines, custom dissolve, particles and their skinned-mesh handling must be ported or kept in the existing path. Revisit the current `Points.isSkinnedMesh` adaptation during that work rather than assuming it transfers unchanged.

**Verified sources:** [r186 WebGPURenderer](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPURenderer.js), [r186 Material](https://github.com/mrdoob/three.js/blob/r186/src/materials/Material.js), [Three.js Shading Language](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language).

Use an isolated technical prototype before changing the production renderer: load the existing woman, reproduce one contour material and one particle effect, exercise WebGPU and forced WebGL2 paths, then compare appearance, memory, frame timing and context/device loss handling.

## 6. Browser support checked against current data

MDN's repository contains both released and upcoming versions. The following interpretation uses the research date and the browser release records, rather than treating every version in a compatibility table as generally shipped.

- The consulted release records identify Chrome 156 and Firefox 158 as current releases on 29 October 2026. Firefox 159 is listed as beta.
- GPU support remains dependent on browser, OS and hardware. The GPU table records Firefox platform restrictions and no Firefox Android support. Availability of `navigator.gpu` is not proof that a suitable adapter/device can be obtained.
- Base same-document ViewTransition support is recorded for Chrome 111+, Firefox 144+ and Safari 18+. Specific newer methods and features have their own support entries.
- `animation-timeline` is recorded for Chrome 115+, Safari 26+ and Firefox 159. Because Firefox 159 is beta in the consulted release record, a broadly deployed Firefox-compatible implementation still needs another path.
- `@starting-style` is recorded for Chrome 117+, Firefox 129+ and Safari 17.5+.

These are documentation findings, not cross-device tests conducted for the proposed effects. Use feature detection and actual target-device testing.

Sources: [GPU compatibility](https://github.com/mdn/browser-compat-data/blob/main/api/GPU.json), [Firefox releases](https://github.com/mdn/browser-compat-data/blob/main/browsers/firefox.json), [Chrome releases](https://github.com/mdn/browser-compat-data/blob/main/browsers/chrome.json), [Safari releases](https://github.com/mdn/browser-compat-data/blob/main/browsers/safari.json), [ViewTransition](https://github.com/mdn/browser-compat-data/blob/main/api/ViewTransition.json), [animation-timeline](https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json), [starting-style](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/starting-style.json).

## 7. Proposed visual sequence for this site

1. **Presence:** a balanced female sculpture appears in a quiet dark studio. A narrow reflection reveals her silhouette while typography frames her.
2. **Response:** pointer movement creates a restrained surface ripple; touch and keyboard receive equivalent explicit interactions.
3. **Transformation:** the surface starts dispersing along a deliberate moving boundary. Particles follow a coherent field and travel through the text corridor.
4. **Threshold:** a red ribbon becomes the edge of a real portal. A second environment is visible inside it, with the figure correctly occluded at its boundary.
5. **Reassembly:** particles converge into the woman as the palette turns porcelain white. Terrain and type finish their movement on the same timeline.
6. **Resolution:** the camera settles and information becomes easy to read. The red contact scene uses a restrained version of the portal interaction.

This is an art-direction proposal, not a claim that these effects have already been built.

## 8. Practical delivery order

**First:** refine base asset/presentation and prototype one fluid-metal deformation plus a real portal using the existing renderer. Establish a neutral reference pose and consistent lighting for comparisons.

**Second:** upgrade the particle motion to a sampled-surface flow field and tie it to the portal and typography timeline. Profile typical desktop and phone hardware before selecting particle counts, resolution or simulation density.

**Third:** add carefully isolated focus/lighting effects and depth-aware title geometry. Keep essential text as HTML.

**Exploration branch:** evaluate WebGPU/TSL, Gaussian splats and path tracing as separate prototypes with clear asset and device requirements. A new renderer or capture pipeline should be justified by a visible gain for this site.

## 9. Performance and acceptance criteria

No benchmark or guaranteed frame-rate claim is made for the proposed effects. Keep the existing quality controls until a revised implementation is measured.

- Aim for responsive camera and input on the selected desktop and mobile devices; define quality tiers from frame-time measurements.
- Bound device-pixel ratio, render-target resolution and particle count. A high-resolution phone can have greater pixel cost than a desktop viewport.
- Deactivate invisible effects and release unused render targets/buffers. Avoid stacking every expensive postprocessing pass.
- Preserve native scrolling, keyboard controls, reduced-motion behaviour and context/device loss handling.
- Under reduced motion, use stable final states and explicit interaction rather than automatic perpetual distortion.
- Test the complete loading and transition experience, including file size, texture decode, shader compilation, memory, high-DPI screens and thermal throttling over time.
- Verify readable type, reliable links and controls at every transition phase.

## 10. Research limits

Current package metadata, primary documentation, pinned source examples and selected reference screenshots were inspected. Interactive reference demos were not benchmarked on the user's Windows machine or phone. The original unbelievablycrap.com site remains inaccessible through this environment's network policy; the supplied recording and inspected local project remain the visual baseline. Exact publication dates of individual visual techniques were not established, and no such novelty claim is made.

## Implementation follow-up

The first authorised experiment after this study implements bounded liquid-surface shader deformation, a coherent analytic particle flow and a projective render-to-texture portal into a second gallery scene. It uses the existing WebGL renderer family and does not claim a full fluid simulation, persistent velocity simulation, path tracing, Gaussian splatting or WebGPU migration. See `portal-source.js` and `scene-source.js`.
