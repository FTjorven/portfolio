import * as THREE from 'three';
import { gsap } from 'gsap';

/*
  3D hero: "fresh prints"
  The projects hang like fresh prints on a line, and that line is tied to the dot of "Florin.".
  1. Intro: the line runs out from the dot, then the prints drop onto it one by one.
  2. They sway in a light breeze. Moving the cursor through them pushes them around.
  3. Hover lifts a print towards you, click opens the case study.
  The real links stay in the HTML (.hero__projects) for keyboard and screen reader users;
  focusing one lifts its print.
*/

const PAPER = '#fbfaf6';
const INK = '#111114'; // caption text on the paper prints

// The line and the pegs follow the page theme (light or dark site)
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const LINE = () => cssVar('--text', INK);
const ACCENT = () => cssVar('--accent', '#15803d');

export async function initHero3d() {
  const hero = document.querySelector('.hero');
  const stage = hero?.querySelector('.hero__stage');
  const accent = hero?.querySelector('.hero__last .accent');
  const nail = hero?.querySelector('.hero__nail');
  const links = [...(hero?.querySelectorAll('.hero__projects a') ?? [])];
  if (!stage || !nail || !links.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    hero.classList.remove('has-3d'); // No WebGL: show the plain project cards
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  hero.classList.add('has-3d');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 10;

  // ---------- Pixel <-> world helpers ----------
  // The canvas spans the full window width; ox is where the hero's content column starts in it
  const view = { w: 1, h: 1, k: 1, ox: 0 }; // k = world units per pixel at z = 0
  const wx = (px) => (px - view.w / 2) * view.k;
  const wy = (py) => (view.h / 2 - py) * view.k;

  // ---------- Prints ----------
  await Promise.all([
    document.fonts.load('800 40px Syne'),
    document.fonts.load('400 26px "JetBrains Mono"'),
  ]).catch(() => {});

  const shadowTexture = makeShadowTexture();
  const paperGeo = new THREE.PlaneGeometry(1, 1.25, 12, 16).translate(0, -0.625, 0);
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.45).translate(0.06, -0.7, 0);
  const pegGeo = new THREE.BoxGeometry(0.07, 0.15, 0.03);
  const threadGeo = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0);
  const inkMaterial = new THREE.MeshBasicMaterial({ color: LINE() });

  const prints = await Promise.all(links.map(async (link, i) => {
    const texture = new THREE.CanvasTexture(await drawPrint(link, i));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uPhase: { value: i * 1.7 },
        uBend: { value: 0 },
        uWind: { value: 1 },
        uAlpha: { value: reduceMotion ? 1 : 0 },
        uFocus: { value: 0 },
        uAccent: { value: new THREE.Color(ACCENT()) },
      },
      vertexShader: PAPER_VERTEX,
      fragmentShader: PAPER_FRAGMENT,
      transparent: true,
    });

    // pivot (on the line) > thread > holder (the print itself, scaled to size)
    const pivot = new THREE.Group();
    const thread = new THREE.Mesh(threadGeo, inkMaterial);
    const holder = new THREE.Group();
    const paper = new THREE.Mesh(paperGeo, material);
    const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
      map: shadowTexture, transparent: true, opacity: reduceMotion ? 0.22 : 0, depthWrite: false,
    }));
    shadow.position.z = -0.08;
    const peg = new THREE.Mesh(pegGeo, new THREE.MeshBasicMaterial({ color: ACCENT() }));
    peg.position.set(0, 0.01, 0.03);
    holder.add(shadow, paper, peg);
    pivot.add(thread, holder);
    scene.add(pivot);

    paper.userData.index = i;
    return {
      link, pivot, thread, holder, paper, shadow, material,
      sway: 0, swayV: 0, blow: 0, blowV: 0,
      lift: 0, drop: reduceMotion ? 0 : 1,
      x: 0, threadPx: 0, w: 0, h: 0,
    };
  }));

  // ---------- The line ----------
  const ROPE_SEGMENTS = 80;
  const ropeGeo = new THREE.BufferGeometry();
  ropeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ROPE_SEGMENTS + 1) * 2 * 3), 3));
  const ropeIndex = [];
  for (let i = 0; i < ROPE_SEGMENTS; i++) {
    const a = i * 2;
    ropeIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  ropeGeo.setIndex(ropeIndex);
  const rope = new THREE.Mesh(ropeGeo, inkMaterial);
  rope.frustumCulled = false;
  scene.add(rope);

  const line = { x0: 0, y0: 0, x1: 0, y1: 0, sag: 0, kick: 0, drawn: reduceMotion ? 1 : 0 };
  const lineY = (x) => {
    const u = (x - line.x0) / (line.x1 - line.x0);
    return line.y0 + (line.y1 - line.y0) * u + (line.sag + line.kick) * 4 * u * (1 - u);
  };

  // Tie the line to the dot of "Florin." (it drifts with the cursor, so this runs every frame)
  let fontSize = 0;
  const updateAnchors = () => {
    const box = canvas.getBoundingClientRect();
    const dot = accent.getBoundingClientRect();
    const baseline = nail.getBoundingClientRect().top;
    line.x1 = dot.left + dot.width / 2 - box.left;
    line.y1 = baseline - fontSize * 0.07 - box.top;
    line.x0 = -20;
    line.y0 = line.y1 - fontSize * 0.12;
  };

  const updateRope = () => {
    const pos = ropeGeo.attributes.position;
    const half = view.k * 1.1; // ~2px thick
    const start = line.x1 - (line.x1 - line.x0) * line.drawn; // the line runs out from the dot
    for (let i = 0; i <= ROPE_SEGMENTS; i++) {
      const x = start + ((line.x1 - start) * i) / ROPE_SEGMENTS;
      const y = wy(lineY(x));
      pos.setXYZ(i * 2, wx(x), y + half, 0);
      pos.setXYZ(i * 2 + 1, wx(x), y - half, 0);
    }
    pos.needsUpdate = true;
  };

  // ---------- Layout ----------
  const layout = () => {
    view.w = canvas.clientWidth;
    view.h = canvas.clientHeight;
    view.ox = hero.getBoundingClientRect().left - canvas.getBoundingClientRect().left;
    renderer.setSize(view.w, view.h, false);
    camera.aspect = view.w / view.h;
    camera.updateProjectionMatrix();
    view.k = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / view.h;

    fontSize = parseFloat(getComputedStyle(accent).fontSize);
    updateAnchors();
    const small = view.w < 700;
    line.sag = small ? 10 : 22;

    // Spread the prints along the line; on phones they overlap and hang at two heights
    const spacing = (line.x1 - view.ox) / prints.length;
    const stageBottom = stage.offsetTop + stage.offsetHeight;
    const room = stageBottom - line.y1;
    const threads = small ? [0, 0.42, 0.04, 0.46] : [0.02, 0.12, 0.05, 0.15];
    const maxThread = Math.max(...threads) * room;
    let h = room - maxThread - 12;
    let w = h / 1.25;
    const maxW = spacing * (small ? 1.45 : 0.74);
    if (w > maxW) { w = maxW; h = w * 1.25; }

    // Line the prints up with the content column
    const first = view.ox + w / 2 + 4;
    const last = Math.min(line.x1, view.ox + hero.clientWidth) - w / 2 - 4;
    prints.forEach((p, i) => {
      p.x = first + ((last - first) * i) / Math.max(prints.length - 1, 1);
      p.threadPx = threads[i % threads.length] * room;
      p.w = w;
      p.h = h;
      p.holder.scale.setScalar(w * view.k);
      p.thread.scale.set(view.k * 1.4, Math.max(p.threadPx, 0.001) * view.k, 1);
      p.thread.visible = p.threadPx > 2;
      p.holder.position.y = -p.threadPx * view.k;
      p.pivot.position.z = small && i % 2 ? -0.15 : 0;
    });
  };

  // ---------- Pointer ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointer = null;
  let hovered = -1;
  let focused = -1;
  let down = null;

  const printAt = (x, y) => {
    ndc.set((x / view.w) * 2 - 1, -(y / view.h) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(prints.map((p) => p.paper))[0];
    return hit ? hit.object.userData.index : -1;
  };

  // Push the prints near the cursor in the direction it moves
  const push = (dx, dy, strength) => {
    prints.forEach((p) => {
      const cx = p.x;
      const cy = lineY(p.x) + p.threadPx + p.h / 2;
      const fx = (pointer.x - cx) / (p.w * 0.9);
      const fy = (pointer.y - cy) / (p.h * 0.75);
      const falloff = Math.max(0, 1 - Math.hypot(fx, fy));
      if (!falloff) return;
      p.swayV += dx * 0.012 * strength * falloff;
      p.blowV += (Math.abs(dx) + Math.abs(dy)) * 0.006 * strength * falloff;
    });
  };

  hero.addEventListener('pointermove', (e) => {
    const box = canvas.getBoundingClientRect();
    const next = { x: e.clientX - box.left, y: e.clientY - box.top };
    if (pointer) push(next.x - pointer.x, next.y - pointer.y, down ? 2.2 : 1);
    pointer = next;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = null; });
  hero.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('pointerup', () => { setTimeout(() => { down = null; }); });

  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .hero__char')) return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return; // it was a drag
    const box = canvas.getBoundingClientRect();
    const i = printAt(e.clientX - box.left, e.clientY - box.top);
    if (i >= 0) window.location.href = prints[i].link.href;
  });

  links.forEach((link, i) => {
    link.addEventListener('focus', () => { focused = i; });
    link.addEventListener('blur', () => { if (focused === i) focused = -1; });
  });

  const cursor = document.querySelector('.cursor');
  const setHovered = (i) => {
    if (i === hovered) return;
    hovered = i;
    hero.classList.toggle('is-over-print', i >= 0);
    cursor?.classList.toggle('is-hover', i >= 0);
  };

  // ---------- Intro ----------
  if (!reduceMotion) {
    const intro = gsap.timeline({ delay: 0.9 });
    intro.to(line, { drawn: 1, duration: 1.1, ease: 'power3.inOut' });
    prints.forEach((p, i) => {
      const at = 0.7 + i * 0.16;
      intro
        .to(p, { drop: 0, duration: 0.6, ease: 'power2.in' }, at)
        .to(p.material.uniforms.uAlpha, { value: 1, duration: 0.2 }, at)
        .to(p.shadow.material, { opacity: 0.22, duration: 0.4 }, at + 0.3)
        .add(() => {
          // Landing: the print swings, the line dips
          p.swayV += (i % 2 ? 1 : -1) * 1.6;
          p.blowV += 2.4;
          line.kick = 10;
        }, at + 0.6);
    });
  }

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  let running = false;

  const frame = () => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const t = clock.elapsedTime;

    updateAnchors();
    line.kick += (0 - line.kick) * 0.08;
    updateRope();

    setHovered(pointer && !down ? printAt(pointer.x, pointer.y) : -1);

    prints.forEach((p, i) => {
      // Springs: sideways sway and blowing back, plus a light breeze
      const breeze = reduceMotion ? 0 : 0.35 * Math.sin(t * 0.8 + i * 1.9) + 0.15 * Math.sin(t * 2.3 + i);
      p.swayV += (-14 * p.sway - 1.4 * p.swayV + breeze) * dt;
      p.sway += p.swayV * dt;
      p.blowV += (-10 * p.blow - 1.8 * p.blowV) * dt;
      p.blow += p.blowV * dt;

      const active = i === hovered || i === focused;
      p.lift += ((active ? 1 : 0) - p.lift) * 0.12;

      const y = lineY(p.x);
      p.pivot.position.x = wx(p.x);
      p.pivot.position.y = wy(y) + p.drop * (view.h * 0.6) * view.k;
      p.pivot.rotation.z = p.sway * 0.35;
      p.pivot.rotation.x = p.blow * 0.3 - p.lift * 0.18;
      p.holder.position.z = p.lift * 0.35;

      const u = p.material.uniforms;
      u.uTime.value = t;
      u.uBend.value = p.blow * 1.2 + p.blowV * 0.08 - p.lift * 0.3;
      u.uWind.value = reduceMotion ? 0 : 0.6 + Math.min(Math.abs(p.swayV), 2) * 0.5;
      u.uFocus.value += ((i === focused ? 1 : 0) - u.uFocus.value) * 0.2;
    });

    renderer.render(scene, camera);
  };

  const start = () => {
    if (running) return;
    running = true;
    clock.getDelta();
    renderer.setAnimationLoop(frame);
  };
  const stop = () => {
    running = false;
    renderer.setAnimationLoop(null);
  };

  layout();
  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(hero);
  resizeObserver.observe(canvas); // the canvas follows the window, the hero stops at its max width
  document.fonts.ready.then(layout);

  // Only animate while the hero is on screen
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// ---------- Print texture: cover image on paper, with title and meta underneath ----------
async function drawPrint(link, i) {
  const W = 600;
  const H = 750;
  const margin = 30;
  const imageH = 540;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = link.dataset.bg || '#e9e6dd';
  ctx.fillRect(margin, margin, W - margin * 2, imageH);
  const img = await loadImage(link.querySelector('img').src);
  if (img) drawCover(ctx, img, margin, margin, W - margin * 2, imageH);

  // Caption
  const title = link.querySelector('strong').textContent;
  const meta = link.querySelector('span').textContent;
  const textY = margin + imageH;
  let size = 46;
  ctx.font = `800 ${size}px Syne`;
  while (ctx.measureText(title).width > W - margin * 2 && size > 26) {
    size -= 2;
    ctx.font = `800 ${size}px Syne`;
  }
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, margin, textY + 74);

  ctx.font = '400 26px "JetBrains Mono"';
  ctx.fillStyle = '#6a6a74';
  ctx.fillText(meta.toUpperCase(), margin, textY + 128);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#15803d'; // always on paper, so the light-theme green
  ctx.fillText(`${String(i + 1).padStart(2, '0')} ↗`, W - margin, textY + 128);
  return c;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Like object-fit: cover
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

// Soft shadow behind each print
function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 160;
  const ctx = c.getContext('2d');
  // Draw the shape off-canvas and keep only its blurred shadow
  ctx.shadowColor = 'rgba(17, 17, 20, 1)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 1000;
  ctx.fillRect(22 - 1000, 22, 84, 116);
  return new THREE.CanvasTexture(c);
}

const PAPER_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uBend;
  uniform float uWind;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vec3 p = position;
    float t = -p.y / 1.25; // 0 at the peg, 1 at the bottom edge
    // Paper: stiff at the top, bending and rippling more towards the bottom
    float ripple = sin(p.x * 4.0 + uTime * 2.4 + uPhase) * 0.03 * uWind;
    p.z += (ripple + uBend * 0.16) * t * t;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const PAPER_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uAlpha;
  uniform float uFocus;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    // Shade by how the paper is bent
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    float light = 0.84 + 0.16 * abs(dot(n, normalize(vec3(-0.35, 0.45, 1.0))));
    vec4 color = texture2D(uMap, vUv);

    // Green outline when the print's link has keyboard focus
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    color.rgb = mix(color.rgb, uAccent, uFocus * step(edge, 0.014));

    gl_FragColor = vec4(color.rgb * light, uAlpha);
    #include <colorspace_fragment>
  }
`;
