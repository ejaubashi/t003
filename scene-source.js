import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#figure');
const status = document.querySelector('#scene-status');
let renderer, model, mixer, headBone, materialMode = '', lastWhite = -1;
let lastState = '', lastFrame = 0, lost = false;
const materials = [], pointMaterials = [], pointObjects = [], meshes = [];
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .05, 60);
const sculpture = new THREE.Group();
scene.add(sculpture);
function unavailable(message) {
  document.body.classList.remove('scene-ready');
  document.body.classList.add('scene-unavailable');
  status.textContent = message;
}
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); generator.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x181818, .6));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 4, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 4);
  rim.position.set(3, 2, -2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.2);
  fill.position.set(-3, -1, 2); scene.add(fill);

  new GLTFLoader().load(new URL('./assets/figure.glb?v=woman-1', location.href).href, gltf => {
    model = gltf.scene;
    mixer = new THREE.AnimationMixer(model);
    const pose = gltf.animations.find(clip => clip.name === 'SambaDance');
    if (pose) { mixer.clipAction(pose).play(); mixer.setTime(.7); }
    // Hold a sculptural pose; movement comes from the camera and slow rotation.
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2 / size.y;
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    const originalMaterials = new Set(), textures = new Set();
    model.traverse(object => {
      if (object.isBone && /head$/i.test(object.name)) headBone = object;
      if (!object.isMesh) return;
      meshes.push(object);
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      for (const original of originals) {
        originalMaterials.add(original);
        for (const value of Object.values(original)) if (value?.isTexture) textures.add(value);
      }
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x999999, metalness: .72, roughness: .3,
        clearcoat: .55, clearcoatRoughness: .18, envMapIntensity: 1.4, side: THREE.DoubleSide,
      });
      const lineStrength = { value: .4 };
      material.userData.lineStrength = lineStrength;
      // Antialiased contour lines follow the posed surface in world space.
      material.onBeforeCompile = shader => {
        shader.uniforms.uLineStrength = lineStrength;
        shader.vertexShader = 'varying vec3 vSculpturePosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
          vSculpturePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
          #include <project_vertex>
        `);
        shader.fragmentShader = 'varying vec3 vSculpturePosition;\nuniform float uLineStrength;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
          float contour = vSculpturePosition.y * 42.0 + vSculpturePosition.x * 1.8;
          float distanceToLine = abs(fract(contour - 0.5) - 0.5);
          float lineWidth = max(fwidth(contour) * 0.65, 0.012);
          float ink = 1.0 - smoothstep(lineWidth, lineWidth * 1.8, distanceToLine);
          outgoingLight *= 1.0 - ink * uLineStrength;
          #include <opaque_fragment>
        `);
      };
      object.material = material;
      object.frustumCulled = false;
      materials.push(material);
      // Particle mode follows the same skinned animation instead of a separate static model.
      const pointMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uWhite: { value: 0 }, uPixelRatio: { value: Math.min(devicePixelRatio || 1, 1.75) } },
        vertexShader: `
          #include <common>
          #include <skinning_pars_vertex>
          uniform float uPixelRatio;
          varying vec3 vPosition;
          void main() {
            #include <beginnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <begin_vertex>
            #include <skinning_vertex>
            vPosition = transformed;
            vec4 view = modelViewMatrix * vec4(transformed, 1.0);
            gl_Position = projectionMatrix * view;
            gl_PointSize = clamp(8.0 / -view.z, 1.0, 3.0) * uPixelRatio;
          }`,
        fragmentShader: `
          uniform float uWhite;
          varying vec3 vPosition;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            vec3 color = vec3(0.78);
            gl_FragColor = vec4(mix(color, vec3(0.12), uWhite), 0.8 * smoothstep(0.5, 0.2, d));
          }`,
      });
      const points = new THREE.Points(object.geometry, pointMaterial);
      points.frustumCulled = false;
      // Shader chunks use the parent's skeleton through the renderer's SkinnedMesh path.
      points.isSkinnedMesh = object.isSkinnedMesh;
      if (object.isSkinnedMesh) {
        points.skeleton = object.skeleton;
        points.bindMatrix = object.bindMatrix;
        points.bindMatrixInverse = object.bindMatrixInverse;
      }
      points.visible = false;
      object.add(points);
      pointObjects.push(points); pointMaterials.push(pointMaterial);
    });
    // Close the recess left by removing the decorative bows. Bone units are cm.
    if (headBone && materials[0]) {
      const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), materials[0]);
      skull.scale.set(7, 7.5, 6);
      skull.position.set(0, 10, -1);
      headBone.add(skull);
    }
    originalMaterials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    sculpture.add(model);
    document.body.classList.add('scene-ready');
    status.textContent = 'HUMAN / READY';
    canvas.dataset.ready = 'true';
    resize();
  }, undefined, error => {
    console.error('Unable to load the human figure', error);
    unavailable('THE 3D FIGURE COULD NOT LOAD. REFRESH TO TRY AGAIN.');
  });
} catch (error) {
  console.warn('WebGL unavailable', error);
  unavailable('3D REQUIRES WEBGL. THE REST OF THE SITE REMAINS AVAILABLE.');
}
function resize() {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  lastState = '';
}
addEventListener('resize', resize);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); lost = true;
  unavailable('THE GRAPHICS CONTEXT WAS INTERRUPTED. RESTORING THE SCENE…');
});
canvas.addEventListener('webglcontextrestored', () => location.reload());
function frame(now) {
  requestAnimationFrame(frame);
  if (!renderer || !model || lost || document.hidden || now - lastFrame < 32) return;
  const dt = Math.min((now - lastFrame) / 1000, .05); lastFrame = now;
  const state = window.deformatScene;
  if (!state || state.width === undefined) return;
  const key = `${state.scroll}/${state.manualTurn}/${state.material}/${state.width}/${state.height}/${state.reduced}`;
  if (state.reduced && lastState === key) return;
  lastState = key;

  const enter = smooth((state.intro - .1) / .85);
  const retreat = smooth(state.form);
  const distance = lerp(lerp(state.width < 700 ? 7.8 : 7.4, 1.2, enter), 5.4, retreat);
  sculpture.rotation.y = -.32 + state.rotation * .45 + state.manualTurn + enter * 2.7 + state.pointerX * .22;
  sculpture.rotation.z = state.reduced ? 0 : state.pointerY * .015;
  sculpture.position.x = Math.sin(enter * Math.PI) * .025;
  scene.updateMatrixWorld(true);
  const head = headBone ? headBone.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, .8, 0);
  const focus = head.multiplyScalar(enter * (1 - retreat));
  camera.position.set(focus.x + (state.reduced ? 0 : state.pointerX * .06), focus.y + .03, focus.z + distance);
  camera.lookAt(focus);
  canvas.style.opacity = String(state.visibility);
  if (state.visibility < .001) { renderer.clear(); return; }
  if (materialMode !== state.material) {
    materialMode = state.material;
    const particleMode = materialMode === 'points';
    meshes.forEach(mesh => {
      // Keep the mesh parent visible so its particle child can be rendered.
      mesh.material.visible = !particleMode;
      mesh.material.userData.lineStrength.value = materialMode === 'wire' ? .95 : .4;
    });
    pointObjects.forEach(points => { points.visible = particleMode; });
    document.querySelector('#figure-mode').textContent = { surface: 'PLATINUM / FEMALE FORM', wire: 'CONTOUR STUDY', points: 'PARTICLE PRESENCE' }[materialMode];
  }
  if (Math.abs(lastWhite - state.white) > .005) {
    lastWhite = state.white;
    materials.forEach(material => {
      material.color.lerpColors(new THREE.Color(0x999999), new THREE.Color(0xf5f5f2), state.white);
      material.metalness = lerp(.72, .12, state.white);
      material.roughness = lerp(.3, .5, state.white);
    });
    pointMaterials.forEach(material => { material.uniforms.uWhite.value = state.white; });
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
