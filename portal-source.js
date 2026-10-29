import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A second, depth-correct space viewed through a projective render-texture aperture.
// The renderer is allocated lazily and renders only while this section is on screen.
export function createPortalExperience() {
  const section = document.querySelector('#threshold');
  const stage = section.querySelector('.threshold-stage');
  const canvas = document.querySelector('#portal-world');
  const status = document.querySelector('#portal-status');
  let renderer, target, roomScene, outsideScene, camera, roomCamera;
  let visible = false, failed = false, last = 0, signature = '';
  const uniforms = { uScene: { value: null } };
  const smooth = value => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const mix = THREE.MathUtils.lerp;
  const details = new THREE.Group();
  const floatingForms = new THREE.Group();
  let ribbon, ribbonGeometry, ribbonEdges = [], ribbonTime = 0, worldTime = 0, ribbonFlow = true;
  const ribbonButton = document.querySelector('#ribbon-flow');
  ribbonButton.addEventListener('click', () => {
    ribbonFlow = !ribbonFlow;
    ribbonButton.setAttribute('aria-pressed', String(ribbonFlow));
    ribbonButton.textContent = ribbonFlow ? 'RIBBON FLOW / ON' : 'RIBBON FLOW / OFF';
    signature = '';
  });

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
      roomScene = new THREE.Scene(); roomScene.background = new THREE.Color(0xeee8e3);
      roomScene.fog = new THREE.Fog(0xeee8e3, 12, 48);
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
      // Destination: a procedural red-dune world, with its own geometry and motion.
      const terrain = new THREE.PlaneGeometry(80, 80, innerWidth < 700 ? 100 : 160, innerWidth < 700 ? 100 : 160);
      terrain.rotateX(-Math.PI / 2); terrain.translate(0, 0, -20);
      const ground = terrain.attributes.position;
      for (let index = 0; index < ground.count; index++) {
        const x = ground.getX(index), z = ground.getZ(index);
        const lane = Math.exp(-x*x*.2) * Math.exp(-Math.pow((z+3)/7,2));
        const hills = Math.sin(x*.32+z*.18)*.7 + Math.sin(z*.39-x*.1)*.35 + Math.sin(x*.15-z*.12)**2*.55;
        ground.setY(index, -1.6 + hills * (1 - lane*.7) + Math.sin(x*2.2+z*.7)*.025);
      }
      terrain.computeVertexNormals();
      roomScene.add(new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ color:0x8f0c22, roughness:.88, metalness:.04 })));
      const chrome = new THREE.MeshPhysicalMaterial({ color:0xbcbcbc, metalness:.96, roughness:.14, clearcoat:1, envMapIntensity:1.3 });
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(.72,.155,160,24,2,3), chrome);
      knot.position.set(.15,.45,-7.5); floatingForms.add(knot);
      for (const [x,y,z,size] of [[-1.7,-.25,-5.5,.24],[1.9,.05,-10,.42],[-3,.6,-13,.6]]) {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(size,40,28), chrome);
        orb.position.set(x,y,z); orb.userData.baseY=y; floatingForms.add(orb);
      }
      roomScene.add(floatingForms);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.65,.012,8,160),chrome);
      halo.position.set(.15,.45,-9); halo.rotation.y=.45; roomScene.add(halo);
      const wordCanvas = document.createElement('canvas'); wordCanvas.width=2048; wordCanvas.height=256;
      const wordContext = wordCanvas.getContext('2d');
      wordContext.fillStyle='#161316'; wordContext.font='900 210px Arial'; wordContext.textAlign='center'; wordContext.textBaseline='middle';
      wordContext.fillText('ELSEWHERE',1024,135);
      const word = new THREE.Mesh(new THREE.PlaneGeometry(15,1.875), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(wordCanvas),transparent:true,depthWrite:false,alphaTest:.02}));
      word.position.set(0,3.1,-18); roomScene.add(word);

      const segments=160, positions=new Float32Array((segments+1)*6), indices=[];
      for(let i=0;i<segments;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      ribbonGeometry=new THREE.BufferGeometry();
      ribbonGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      ribbonGeometry.setIndex(indices);
      ribbon=new THREE.Mesh(ribbonGeometry,new THREE.MeshPhysicalMaterial({color:0xea1730,metalness:.35,roughness:.28,clearcoat:.9,side:THREE.DoubleSide}));
      ribbon.frustumCulled=false; roomScene.add(ribbon);
      for(let edge=0;edge<2;edge++){
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((segments+1)*3),3).setUsage(THREE.DynamicDrawUsage));
        const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xffdada,transparent:true,opacity:.55}));
        line.frustumCulled=false; roomScene.add(line); ribbonEdges.push(line);
      }
      updateRibbon(0);
      resize();
      stage.dataset.ready = 'true';
      status.textContent = 'A WINDOW INTO THE RED DUNES';
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

  function updateRibbon(time) {
    if(!ribbonGeometry)return;
    const positions=ribbonGeometry.attributes.position;
    const count=positions.count/2;
    function path(t){const a=t*Math.PI*2.25+time*.16;return new THREE.Vector3(Math.cos(a)*2.1,.65+Math.sin(a*1.4+time*.3)*.55,-7.5+Math.sin(a)*1.6);}
    for(let i=0;i<count;i++){
      const t=i/(count-1), a=t*Math.PI*2.25+time*.16;
      const center=path(t), tangent=path(t+.001).sub(center).normalize();
      const side=new THREE.Vector3(Math.sin(a)*.2,Math.cos(a*.6),Math.sin(a*.6)*.6);
      side.addScaledVector(tangent,-side.dot(tangent)).normalize().multiplyScalar(.075);
      for(let edge=0;edge<2;edge++){
        const point=center.clone().addScaledVector(side,edge===0?1:-1);
        positions.setXYZ(i*2+edge,point.x,point.y,point.z);
        ribbonEdges[edge].geometry.attributes.position.setXYZ(i,point.x,point.y,point.z);
      }
    }
    positions.needsUpdate=true; ribbonGeometry.computeVertexNormals();
    ribbonEdges.forEach(line=>{line.geometry.attributes.position.needsUpdate=true;});
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || failed || !renderer || document.hidden || now - last < 40) return;
    const dt=Math.min((now-last)/1000,.1); last = now;
    const state = window.deformatScene || {};
    const progress = smooth((scrollY - section.offsetTop) / (innerHeight * 1.25));
    const key = `${scrollY}/${state.reduced}/${innerWidth}/${innerHeight}/${ribbonFlow}`;
    if (state.reduced && signature === key) return;
    signature = key;
    if(!state.reduced){
      worldTime+=dt;
      floatingForms.children.forEach((object,index)=>{
        if(index===0){object.rotation.y=worldTime*.12;object.rotation.z=Math.sin(worldTime*.15)*.08;}
        else object.position.y=object.userData.baseY+Math.sin(worldTime*.5+index)*.08;
      });
      if(ribbonFlow)ribbonTime+=dt;
    }
    updateRibbon(ribbonTime);
    canvas.dataset.world='red-dunes';
    canvas.dataset.ribbon=ribbonFlow?'flowing':'still';
    canvas.dataset.ribbonTime=ribbonTime.toFixed(3);
    const pointer = state.reduced ? 0 : 1 - progress;
    const x = (state.pointerX || 0) * .16 * pointer + .9 * smooth((progress-.75)/.25);
    const y = .12 + (state.pointerY || 0) * -.08 * pointer;
    camera.position.set(x, y, mix(innerWidth < 700 ? 7.6 : 4.65, -2.2, progress));
    camera.lookAt(.08, mix(.12,.45,progress), -7.5);
    roomCamera.copy(camera);
    details.rotation.z = (state.pointerX || 0) * .025;
    const inside = camera.position.z <= .025;
    stage.dataset.inside = String(inside);
    canvas.dataset.phase = inside ? 'inside' : 'window';
    canvas.dataset.progress = progress.toFixed(3);
    const message = inside ? 'ELSEWHERE / THE RED DUNES' : 'A WINDOW INTO THE RED DUNES';
    if (status.textContent !== message) status.textContent = message;
    if (inside) {
      renderer.setRenderTarget(null); renderer.render(roomScene, camera);
    } else {
      renderer.setRenderTarget(target); renderer.render(roomScene, roomCamera);
      renderer.setRenderTarget(null); renderer.render(outsideScene, camera);
    }
  }
  requestAnimationFrame(frame);
  return { disable: fallback };
}
