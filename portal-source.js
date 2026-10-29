import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A second, depth-correct space viewed through a projective render-texture aperture.
// The renderer is allocated lazily and renders only while this section is on screen.
export function createPortalExperience() {
  const section = document.querySelector('#threshold');
  const stage = section.querySelector('.threshold-stage');
  const canvas = document.querySelector('#portal-world');
  const status = document.querySelector('#portal-status');
  let renderer, target, roomScene, outsideScene, camera, roomCamera, woman;
  let visible = false, failed = false, last = 0, signature = '';
  const uniforms = { uScene: { value: null } };
  const smooth = value => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const mix = THREE.MathUtils.lerp;
  const details = new THREE.Group();

  function fallback() {
    failed = true;
    stage.dataset.fallback = 'true';
    status.textContent = 'THE NEXT SPACE IS AVAILABLE BELOW ↓';
    renderer?.dispose(); target?.dispose();
  }
  function init() {
    if (renderer || failed) return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.4));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .03, 50);
      roomCamera = camera.clone();
      outsideScene = new THREE.Scene(); outsideScene.background = new THREE.Color(0x070709);
      roomScene = new THREE.Scene(); roomScene.background = new THREE.Color(0xe6e6e2);
      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      const environment = generator.fromScene(room, .04);
      roomScene.environment = environment.texture; outsideScene.environment = environment.texture;
      room.dispose(); generator.dispose();
      outsideScene.add(new THREE.HemisphereLight(0xffffff, 0x080808, 1.2));
      const outsideLight = new THREE.DirectionalLight(0xffffff, 3);
      outsideLight.position.set(-2, 3, 4); outsideScene.add(outsideLight);
      roomScene.add(new THREE.HemisphereLight(0xffffff, 0x777777, .8));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(-3, 4, 4); roomScene.add(light);
      const rim = new THREE.DirectionalLight(0xffffff, 2);
      rim.position.set(3, 2, -3); roomScene.add(rim);

      const targetType = renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
      target = new THREE.WebGLRenderTarget(1, 1, { type: targetType, depthBuffer: true });
      uniforms.uScene.value = target.texture;
      const aperture = new THREE.Mesh(new THREE.CircleGeometry(1.12, 128), new THREE.ShaderMaterial({
        uniforms, side: THREE.DoubleSide,
        vertexShader: `varying vec4 vClip; void main(){ vClip=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=vClip; }`,
        fragmentShader: `uniform sampler2D uScene; varying vec4 vClip;
          void main(){ vec2 screenUv=vClip.xy/vClip.w*0.5+0.5; gl_FragColor=texture2D(uScene,screenUv);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }));
      aperture.scale.set(.72, 1.05, 1); aperture.position.z = -.015;
      outsideScene.add(aperture);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1.14, .045, 16, 160), new THREE.MeshPhysicalMaterial({
        color: 0xaaaaaa, metalness: .9, roughness: .19, clearcoat: 1,
      }));
      frame.scale.set(.72, 1.05, 1); outsideScene.add(frame);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(1.205, .008, 6, 160), new THREE.MeshBasicMaterial({ color: 0xe21922 }));
      edge.scale.set(.72, 1.05, 1); outsideScene.add(edge);
      // Foreground monoliths supply visible parallax outside the aperture.
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(.035, 2.8, .2), new THREE.MeshBasicMaterial({ color: 0xe21922 }));
        pillar.position.set(side * 1.55, -.05, .25); pillar.rotation.z = side * .15; details.add(pillar);
      }
      outsideScene.add(details);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0xdadad6, roughness: .72 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -1.18; roomScene.add(floor);
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.53, .55, .16, 80), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .4, metalness: .1 }));
      pedestal.position.set(0, -1.04, -2.9); roomScene.add(pedestal);
      const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
      const shadowContext = shadowCanvas.getContext('2d');
      const gradient = shadowContext.createRadialGradient(32,32,2,32,32,30);
      gradient.addColorStop(0,'rgba(0,0,0,.22)'); gradient.addColorStop(1,'rgba(0,0,0,0)');
      shadowContext.fillStyle=gradient; shadowContext.fillRect(0,0,64,64);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.8,.5), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2; shadow.position.set(0,-.959,-2.9); roomScene.add(shadow);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshStandardMaterial({ color: 0xf0f0ec, roughness: .9 }));
      wall.position.set(0, 2, -5); roomScene.add(wall);
      for (const side of [-1, 1]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(.1, 5, .05), new THREE.MeshBasicMaterial({ color: 0xe21922 }));
        stripe.position.set(side * 1.8, .8, -4.95); roomScene.add(stripe);
      }
      if (woman) roomScene.add(woman);
      resize();
      stage.dataset.ready = 'true';
      status.textContent = 'A SECOND SPACE / RENDERED LIVE';
    } catch (error) {
      console.warn('Portal rendering unavailable', error);
      fallback();
    }
  }
  function resize() {
    if (!renderer || failed) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    roomCamera.copy(camera);
    const ratio = Math.min(devicePixelRatio || 1, 1.25);
    const scale = width < 700 ? .65 : .8;
    target.setSize(Math.round(width * ratio * scale), Math.round(height * ratio * scale));
    signature = '';
  }
  addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) init();
  }, { rootMargin: '150px' });
  observer.observe(section);

  function setModel(source) {
    woman = clone(source);
    const points = [];
    woman.traverse(object => {
      if (object.isPoints) points.push(object);
      else if (object.isMesh) {
        object.material = new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa, metalness: .65, roughness: .32, clearcoat: .4, envMapIntensity: .8, side: THREE.DoubleSide });
        object.frustumCulled = false;
      }
    });
    points.forEach(object => object.removeFromParent());
    woman.position.z -= 2.9;
    roomScene?.add(woman);
    signature = '';
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || failed || !renderer || !woman || document.hidden || now - last < 40) return;
    last = now;
    const state = window.deformatScene || {};
    const progress = smooth((scrollY - section.offsetTop) / (innerHeight * 1.25));
    const key = `${scrollY}/${state.reduced}/${innerWidth}/${innerHeight}`;
    if (state.reduced && signature === key) return;
    signature = key;
    const pointer = state.reduced ? 0 : 1 - progress;
    const x = (state.pointerX || 0) * .16 * pointer;
    const y = .12 + (state.pointerY || 0) * -.08 * pointer;
    camera.position.set(x, y, mix(innerWidth < 700 ? 7.6 : 4.65, -.15, progress));
    camera.lookAt(0, mix(.08, .32, progress), -2.9);
    roomCamera.copy(camera);
    details.rotation.z = (state.pointerX || 0) * .025;
    const inside = camera.position.z <= .025;
    stage.dataset.inside = String(inside);
    canvas.dataset.phase = inside ? 'inside' : 'window';
    canvas.dataset.progress = progress.toFixed(3);
    const message = inside ? 'YOU ARE THROUGH / SAME FORM, NEW SPACE' : 'A SECOND SPACE / RENDERED LIVE';
    if (status.textContent !== message) status.textContent = message;
    if (inside) {
      renderer.setRenderTarget(null); renderer.render(roomScene, camera);
    } else {
      renderer.setRenderTarget(target); renderer.render(roomScene, roomCamera);
      renderer.setRenderTarget(null); renderer.render(outsideScene, camera);
    }
  }
  requestAnimationFrame(frame);
  return { setModel, disable: fallback };
}
