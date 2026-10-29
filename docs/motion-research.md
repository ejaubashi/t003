# Motion research and implementation notes — 29 October 2026

## What the supplied recording shows

The six-second recording shows a small rotating full-body figure surrounded by dense text, followed by the text clearing, a rapid camera move toward a white head silhouette, rotating red geometric bars, rising topographic terrain, and a red contact scene with an elliptical opening. It does not document the original site's complete interaction system. Direct access to that site remains blocked by the environment's HTTP policy.

## Primary sources consulted

- [Codrops — On-Scroll Image Layout Animations](https://github.com/codrops/ScrollBasedLayoutAnimations): scroll-driven layout changes and coordinated departures rather than a sequence of independent fades. The linked article is a 2023 study, not a claim about a newly published trend.
- [Three.js r180 — custom point attributes](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_custom_attributes_points.html): GPU attributes and shader uniforms for particle motion. Applied here to the existing skinned figure's vertices, with a reversible world-space dispersion field.
- [Three.js r180 — physical transmission](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_materials_physical_transmission.html): material and rendering tradeoffs. The sculpture retains neutral platinum/porcelain shading and contour lines, preserving the requested monochrome finish.
- [Three.js r180 — Unreal Bloom postprocessing](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_postprocessing_unreal_bloom.html): reviewed for glow and postprocessing costs. Bloom was not added; the visual emphasis comes from geometry, depth, and movement while keeping the sharp editorial composition.

The Three.js references match the repository's pinned runtime version. The implementation is original and does not copy the reference site's source or original figure asset.

## Implemented direction

1. The two text columns recede and fan outward as the figure becomes isolated, followed by the existing head close-up.
2. Red three-dimensional bars and a fine orbital line move behind the white sculpture, with real depth occlusion.
3. Terrain ridges increase in height through the dark/white and white/red transitions.
4. A dissolve/reform control breaks the surface into monochrome particles and brings it back. Material controls reset the effect.
5. A central drag surface supports horizontal pointer/touch rotation, arrow keys, and Home; vertical scrolling remains native.
6. The contact portal gains nested depth rings and pointer-driven perspective while retaining its actual email link.

Reduced motion snaps explicit effects to their end states, freezes continuous particle motion, and disables portal perspective. The renderer remains capped at approximately 30 frames per second with a bounded pixel ratio. This work adds no new runtime dependency or external CDN requests.
