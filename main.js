/* =====================================================================
   Kicksandtricks concept — WebGL scroll experience (three.js r160)
   Everything is procedural: no external models, no third-party brand marks.
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const html = document.documentElement;
if (!html.classList.contains('no-webgl')) {
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve())
    .then(() => { try { init(); } catch (e) { console.error(e); fallback(); } });
}
function fallback() { html.classList.remove('webgl'); html.classList.add('no-webgl'); }

// ---------- math helpers ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(47);

function init() {
  const reduced = html.classList.contains('reduced');
  const isMobile = matchMedia('(max-width: 900px)').matches || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const canvas = document.getElementById('gl');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fallback(); return; }
  if (!renderer.getContext()) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a0505, 0.7));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.0); key.position.set(3, 5, 6); scene.add(key);
  const rimR = new THREE.PointLight(0xff2a10, 60, 40, 2); rimR.position.set(-5, 1.5, -2.5); scene.add(rimR);
  const rimG = new THREE.PointLight(0xffb22a, 45, 40, 2); rimG.position.set(5, 3, -1.5); scene.add(rimG);
  const fill = new THREE.PointLight(0xff6a2a, 20, 30, 2); fill.position.set(0, -4, 4); scene.add(fill);

  const world = new THREE.Group(); scene.add(world);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const texLoader = new THREE.TextureLoader();
  const loadTex = (url) => { const t = texLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; };
  const canvasTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; };
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const DISPLAY = '"Archivo", "Arial Black", sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const setFont = (ctx, f) => { ctx.font = f; try { ctx.fontStretch = 'expanded'; } catch (e) { } };

  // ---------- shared materials ----------
  const M = {
    gold: new THREE.MeshStandardMaterial({ color: 0xf2b84b, metalness: 1, roughness: 0.2 }),
    goldRough: new THREE.MeshStandardMaterial({ color: 0xe0a83c, metalness: 1, roughness: 0.38 }),
    red: new THREE.MeshPhysicalMaterial({ color: 0xa60605, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, side: THREE.DoubleSide }),
    black: new THREE.MeshStandardMaterial({ color: 0x120d0c, roughness: 0.75 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xf6eedf, roughness: 0.55 }),
    lace: new THREE.MeshStandardMaterial({ color: 0xfff6e2, roughness: 0.7 }),
    fire: new THREE.MeshStandardMaterial({ color: 0xe2521d, roughness: 0.65 }),
    ice: new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, metalness: 0.1, roughness: 0.02, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.8, envMapIntensity: 3.2, flatShading: true }),
  };

  // =====================================================================
  //  SNEAKER (procedural)
  // =====================================================================
  const L = 1.5;
  const halfW = x => 0.5 + 0.07 * (x / L);
  function outline(t) {
    const n = 2.6, c = Math.cos(t), s = Math.sin(t);
    const x = L * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    let z = halfW(x) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    if (s < 0) z += 0.08 * Math.exp(-Math.pow((x + 0.05) / 0.45, 2)); // medial arch
    return { x, z };
  }
  const heel = x => ss(0.4, -1.2, x);
  const OUT_H = 0.09, MID_H = 0.2;
  const midTop = x => OUT_H + MID_H * (1 + 0.7 * heel(x));
  const Hup = x => 0.3 + 0.5 * ss(1.35, -0.4, x) - 0.06 * ss(-0.9, -1.35, x);
  const PULL = 0.16;
  const ridgeY = xr => midTop(xr / (1 - PULL)) + Hup(xr);
  function surfY(x, z) {
    const zr = halfW(x / (1 - PULL)) * 0.98;
    const r = clamp(Math.abs(z) / zr, 0, 0.999);
    const ca = Math.pow(r, 1 / 0.55), sa = Math.sqrt(1 - ca * ca);
    return midTop(x) + Hup(x) * Math.pow(sa, 0.9);
  }
  function bend(geo) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setY(i, p.getY(i) + 0.2 * Math.pow(ss(0.6, 1.6, x), 2) + 0.05 * Math.pow(ss(-1.0, -1.6, x), 2));
    }
    geo.computeVertexNormals();
    return geo;
  }
  function outlineShape(scale = 1, N = 140) {
    const sh = new THREE.Shape();
    for (let i = 0; i < N; i++) { const o = outline(i / N * Math.PI * 2); i ? sh.lineTo(o.x * scale, o.z * scale) : sh.moveTo(o.x * scale, o.z * scale); }
    sh.closePath(); return sh;
  }
  function soleGeo(scale, depth, bevel) {
    const g = new THREE.ExtrudeGeometry(outlineShape(scale), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
    g.rotateX(Math.PI / 2); g.translate(0, depth + bevel, 0);
    return g;
  }
  function hullGeo({ t0 = 0, t1 = Math.PI * 2, v0 = 0, v1 = 1, grow = 0, nu = isMobile ? 90 : 140, nv = isMobile ? 16 : 24, seam = true }) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nu; i++) {
      const t = t0 + (t1 - t0) * i / nu, o = outline(t);
      for (let j = 0; j <= nv; j++) {
        const v = v0 + (v1 - v0) * j / nv, a = v * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        const x = o.x * (1 - PULL * (1 - ca));
        const z = o.z * Math.pow(ca, 0.55);
        const y = midTop(o.x) - 0.012 + Hup(x) * Math.pow(sa, 0.9);
        pos.push(x, y, z); uv.push(i / nu, v);
      }
    }
    const R = nv + 1;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * R + j, b = (i + 1) * R + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const fixSeam = () => {
      if (!seam) return;
      const n = g.attributes.normal;
      for (let j = 0; j <= nv; j++) {
        const a = j, b = nu * R + j; const v = new THREE.Vector3(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
        n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
      }
    };
    fixSeam();
    // orient normals outward
    const p = g.attributes.position, n = g.attributes.normal;
    let dot = 0; for (let i = 0; i < p.count; i += 7) dot += n.getX(i) * p.getX(i) + n.getZ(i) * p.getZ(i) + n.getY(i) * (p.getY(i) - 0.4);
    const sign = dot >= 0 ? 1 : -1;
    if (sign < 0) { for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } }
    if (grow) { for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * grow, p.getY(i) + n.getY(i) * grow, p.getZ(i) + n.getZ(i) * grow); }
    bend(g); fixSeam();
    return g;
  }
  // upper texture: knit + flame print (no brand marks)
  function upperTexture() {
    const [c, x] = mkCanvas(1024, 512);
    x.fillStyle = '#f3e9d6'; x.fillRect(0, 0, 1024, 512);
    x.globalAlpha = 0.18; x.strokeStyle = '#b9a98c';
    for (let y = 0; y < 512; y += 6) { x.beginPath(); x.moveTo(0, y); x.lineTo(1024, y); x.stroke(); }
    x.globalAlpha = 1;
    const flames = (cx, w) => {
      for (let k = 0; k < 7; k++) {
        const fx = cx - w / 2 + (k + 0.5) * w / 7, fh = 140 + Math.sin(k * 1.7) * 60 + (k % 2 ? 0 : 70);
        const g = x.createLinearGradient(0, 512, 0, 512 - fh - 60);
        g.addColorStop(0, '#c81d12'); g.addColorStop(0.55, '#f0682f'); g.addColorStop(1, 'rgba(255,200,90,0.0)');
        x.fillStyle = g; x.beginPath(); x.moveTo(fx - 46, 512);
        x.bezierCurveTo(fx - 50, 512 - fh * 0.5, fx - 6, 512 - fh * 0.6, fx + 8 * Math.sin(k), 512 - fh - 40);
        x.bezierCurveTo(fx + 10, 512 - fh * 0.55, fx + 52, 512 - fh * 0.45, fx + 46, 512); x.fill();
      }
    };
    // uv.y: 0 = sole line, 1 = top ridge -> canvas is flipped (flipY), so bottom of canvas = sole
    flames(256, 360); flames(768, 360);
    // perforations on toe area (u around 0 and 1)
    x.fillStyle = 'rgba(80,60,40,.35)';
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { x.beginPath(); x.arc(20 + i * 10 + (j % 2) * 5, 150 + j * 14, 2.2, 0, 7); x.fill(); x.beginPath(); x.arc(1004 - i * 10 - (j % 2) * 5, 150 + j * 14, 2.2, 0, 7); x.fill(); }
    return canvasTex(c);
  }

  const sneaker = new THREE.Group();      // positioned per chapter
  const sneakerInner = new THREE.Group(); // centered
  sneaker.add(sneakerInner); sneakerInner.position.y = -0.62;
  world.add(sneaker);
  const layers = [];
  const addLayer = (name) => { const g = new THREE.Group(); g.name = name; sneakerInner.add(g); layers.push(g); return g; };

  // L0 outsole
  const L0 = addLayer('outsole');
  L0.add(new THREE.Mesh(bend(soleGeo(1.045, 0.05, 0.02)), M.fire));
  // tread hint: thin dark ring at bottom
  // L1 midsole
  const L1 = addLayer('midsole');
  {
    const g = soleGeo(1.02, 0.16, 0.02); g.translate(0, OUT_H, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const yr = (y - OUT_H) / MID_H; p.setY(i, OUT_H + yr * MID_H * (1 + 0.7 * heel(x))); }
    L1.add(new THREE.Mesh(bend(g), M.cream));
    // gold accent stripe around the midsole
    const pts = []; for (let i = 0; i < 120; i++) { const o = outline(i / 120 * Math.PI * 2); pts.push(new THREE.Vector3(o.x * 1.05, OUT_H + MID_H * 0.45 * (1 + 0.7 * heel(o.x)), o.z * 1.06)); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.014, 6, true);
    L1.add(new THREE.Mesh(bend(tg), M.gold));
  }
  // L2 upper base + collar
  const L2 = addLayer('upper');
  const upperMat = new THREE.MeshStandardMaterial({ map: upperTexture(), roughness: 0.82, side: THREE.DoubleSide });
  L2.add(new THREE.Mesh(hullGeo({}), upperMat));
  {
    const xr = -0.86, yc = ridgeY(xr);
    const tor = new THREE.TorusGeometry(0.36, 0.075, 12, 56); tor.rotateX(Math.PI / 2); tor.scale(1.32, 1, 0.92); tor.rotateZ(0.12); tor.translate(xr, yc + 0.0, 0);
    L2.add(new THREE.Mesh(bend(tor), M.black));
    const disk = new THREE.CircleGeometry(0.36, 40); disk.rotateX(-Math.PI / 2); disk.scale(1.32, 1, 0.92); disk.rotateZ(0.12); disk.translate(xr, yc + 0.012, 0);
    L2.add(new THREE.Mesh(bend(disk), new THREE.MeshBasicMaterial({ color: 0x050303 })));
  }
  // L3 overlays: mudguard, toe cap, heel counter, eyestays, heel tab
  const L3 = addLayer('overlays');
  L3.add(new THREE.Mesh(hullGeo({ v0: 0, v1: 0.3, grow: 0.014 }), M.red));
  L3.add(new THREE.Mesh(hullGeo({ t0: Math.PI - 0.95, t1: Math.PI + 0.95, v0: 0.0, v1: 0.62, grow: 0.026, seam: false }), M.red));
  for (const sgn of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 16; i++) { const x = lerp(0.62, -0.72, i / 16); pts.push(new THREE.Vector3(x, surfY(x, 0.27) + 0.02, sgn * 0.27)); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.05, 8, false); tg.scale(1, 0.55, 1);
    // rescale around tube centre line: re-add y offset lost from scale
    const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) + (surfY(x, 0.27) + 0.02) * 0.45); }
    L3.add(new THREE.Mesh(bend(tg), M.red));
  }
  {
    const tab = new THREE.BoxGeometry(0.08, 0.26, 0.16, 1, 1, 1); tab.translate(-1.33, ridgeY(-1.26) - 0.02, 0);
    L3.add(new THREE.Mesh(bend(tab), M.gold));
  }
  // L4 laces + tongue + eyelets
  const L4 = addLayer('laces');
  {
    const sh = new THREE.Shape(); const w = 0.19, l0 = -0.62, l1 = 0.5, r = 0.12;
    sh.moveTo(l0 + r, -w); sh.lineTo(l1 - r, -w); sh.quadraticCurveTo(l1, -w, l1, -w + r); sh.lineTo(l1, w - r); sh.quadraticCurveTo(l1, w, l1 - r, w);
    sh.lineTo(l0 + r, w); sh.quadraticCurveTo(l0 - 0.1, w, l0 - 0.1, w - r); sh.lineTo(l0 - 0.1, -w + r); sh.quadraticCurveTo(l0 - 0.1, -w, l0 + r, -w);
    const tg = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
    tg.rotateX(-Math.PI / 2);
    // drape tongue on ridge
    const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) + ridgeY(clamp(x, -1.0, 0.7)) + 0.0 + (x < -0.62 ? 0.12 : 0)); }
    L4.add(new THREE.Mesh(bend(tg), M.black));
    const xs = [0.5, 0.28, 0.06, -0.16, -0.38, -0.6], zE = 0.24;
    const laceGeos = [];
    for (let k = 0; k < xs.length - 1; k++) {
      for (const s of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const u = i / 10; const x = lerp(xs[k], xs[k + 1], u), z = lerp(-zE * s, zE * s, u); pts.push(new THREE.Vector3(x, surfY(x, z) + 0.05 + 0.06 * (1 - Math.pow(z / zE, 2)), z)); }
        laceGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.024, 6, false));
      }
    }
    // top bar
    { const pts = []; for (let i = 0; i <= 10; i++) { const z = lerp(-zE, zE, i / 10); pts.push(new THREE.Vector3(xs[0], surfY(xs[0], z) + 0.05 + 0.06 * (1 - Math.pow(z / zE, 2)), z)); } laceGeos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.024, 6, false)); }
    for (const g of laceGeos) L4.add(new THREE.Mesh(bend(g), M.lace));
    // bow loops
    for (const s of [-1, 1]) {
      const tor = new THREE.TorusGeometry(0.12, 0.022, 6, 24); tor.scale(1.2, 0.7, 1); tor.rotateY(Math.PI / 2 + s * 0.6); tor.rotateX(-0.6); tor.translate(xs[5] - 0.04, ridgeY(xs[5]) + 0.17, s * 0.1);
      L4.add(new THREE.Mesh(bend(tor), M.lace));
    }
    const ey = new THREE.TorusGeometry(0.03, 0.012, 6, 14); ey.rotateX(Math.PI / 2);
    for (const x of xs) for (const s of [-1, 1]) { const g = ey.clone(); g.translate(x, surfY(x, zE) + 0.045, s * zE); L4.add(new THREE.Mesh(bend(g), M.gold)); }
  }
  const explodeOffsets = [-1.0, -0.48, 0.0, 0.52, 1.1];
  const sneakerAnchors = [
    { layer: 4, p: new THREE.Vector3(-0.1, 1.38, 0.15), title: 'Laces', copy: 'Tie it together: buy, sell, trade & network.' },
    { layer: 3, p: new THREE.Vector3(0.05, 1.02, 0.3), title: 'Overlays', copy: 'Customs, restorations & live sneaker cleaning.' },
    { layer: 2, p: new THREE.Vector3(0.35, 0.62, 0.5), title: 'Upper', copy: 'Grails and everyday pairs.' },
    { layer: 1, p: new THREE.Vector3(0.5, 0.25, 0.55), title: 'Midsole', copy: 'Something for everyone. Everyone is welcome.' },
    { layer: 0, p: new THREE.Vector3(0.9, 0.05, 0.5), title: 'Outsole', copy: 'Rhode Island & southern New England.' },
  ];

  // =====================================================================
  //  TRADING CARDS
  // =====================================================================
  const CARD_W = 0.64, CARD_H = 0.9;
  const themes = [
    { name: 'SOLE FLAME', a: '#ff6a2a', b: '#a60605', c: '#ffd76a', bg1: '#3a0705', bg2: '#120202', num: '047' },
    { name: 'GOLD LACE', a: '#ffd76a', b: '#b8860b', c: '#fff4c9', bg1: '#3a2a05', bg2: '#140d02', num: '012' },
    { name: 'HOMECOMING', a: '#16dbda', b: '#4b2bd1', c: '#e0fdff', bg1: '#06283a', bg2: '#030b14', num: '024' },
    { name: 'TRICKSTER', a: '#ff4fd8', b: '#6a0dad', c: '#ffe0f7', bg1: '#2a0636', bg2: '#0c0212', num: '099' },
  ];
  function roundRect(x, X, Y, W, H, R) { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
  function cardFront(th) {
    const W = 360, H = 504; const [c, x] = mkCanvas(W, H);
    roundRect(x, 0, 0, W, H, 20); x.save(); x.clip();
    let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.c); g.addColorStop(0.5, th.a); g.addColorStop(1, th.b); x.fillStyle = g; x.fillRect(0, 0, W, H);
    roundRect(x, 12, 12, W - 24, H - 24, 12); g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg1); g.addColorStop(1, th.bg2); x.fillStyle = g; x.fill();
    setFont(x, `900 22px ${DISPLAY}`); x.fillStyle = th.c; x.textBaseline = 'middle'; x.fillText(th.name, 26, 40);
    x.textAlign = 'right'; setFont(x, `800 14px ${MONO}`); x.fillStyle = th.a; x.fillText('★★★', W - 26, 40); x.textAlign = 'left';
    // art window
    const ax = 26, ay = 62, aw = W - 52, ah = 210;
    x.save(); roundRect(x, ax, ay, aw, ah, 8); x.clip();
    g = x.createRadialGradient(ax + aw / 2, ay + ah * 0.62, 10, ax + aw / 2, ay + ah * 0.6, aw * 0.75); g.addColorStop(0, th.c); g.addColorStop(0.35, th.a); g.addColorStop(1, th.bg2); x.fillStyle = g; x.fillRect(ax, ay, aw, ah);
    x.globalAlpha = 0.25; x.fillStyle = th.c; for (let i = 0; i < 24; i++) { const an = i / 24 * Math.PI * 2; x.beginPath(); x.moveTo(ax + aw / 2, ay + ah * 0.62); x.lineTo(ax + aw / 2 + Math.cos(an) * 400, ay + ah * 0.62 + Math.sin(an) * 400); x.lineTo(ax + aw / 2 + Math.cos(an + 0.1) * 400, ay + ah * 0.62 + Math.sin(an + 0.1) * 400); x.fill(); }
    x.globalAlpha = 1;
    // stylised flame emblem
    const cx = ax + aw / 2, cy = ay + ah * 0.85;
    for (let k = 0; k < 3; k++) {
      const s = 1 - k * 0.28; x.fillStyle = [th.b, th.a, th.c][k];
      x.beginPath(); x.moveTo(cx - 60 * s, cy); x.bezierCurveTo(cx - 80 * s, cy - 80 * s, cx - 10 * s, cy - 90 * s, cx, cy - 150 * s);
      x.bezierCurveTo(cx + 20 * s, cy - 90 * s, cx + 85 * s, cy - 70 * s, cx + 60 * s, cy); x.closePath(); x.fill();
    }
    x.restore();
    x.strokeStyle = th.a; x.lineWidth = 3; roundRect(x, ax, ay, aw, ah, 8); x.stroke();
    // text box
    x.fillStyle = 'rgba(255,255,255,.06)'; roundRect(x, 26, 290, W - 52, 150, 8); x.fill();
    setFont(x, `800 13px ${MONO}`); x.fillStyle = th.c; x.fillText('BUY · SELL · TRADE', 40, 314);
    x.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 4; i++) x.fillRect(40, 338 + i * 22, (W - 90) * (i === 3 ? 0.55 : 1), 7);
    setFont(x, `700 11px ${MONO}`); x.fillStyle = th.a; x.fillText('KICKSANDTRICKS SERIES', 26, H - 36); x.textAlign = 'right'; x.fillText(th.num + '/100', W - 26, H - 36);
    x.restore();
    return canvasTex(c);
  }
  function cardBack() {
    const W = 360, H = 504; const [c, x] = mkCanvas(W, H);
    roundRect(x, 0, 0, W, H, 20); x.save(); x.clip();
    x.fillStyle = '#2a0303'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#a60605'; x.lineWidth = 2; for (let i = -H; i < W + H; i += 18) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i - H, H); x.stroke(); }
    x.fillStyle = '#a60605'; roundRect(x, 18, 18, W - 36, H - 36, 14); x.lineWidth = 6; x.strokeStyle = '#f5b821'; x.stroke();
    x.beginPath(); x.arc(W / 2, H / 2, 90, 0, 7); x.fillStyle = '#120202'; x.fill(); x.lineWidth = 5; x.stroke();
    setFont(x, `900 52px ${DISPLAY}`); x.fillStyle = '#f5b821'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('K&T', W / 2, H / 2 + 2);
    x.restore(); return canvasTex(c);
  }
  function slabLabel() {
    const [c, x] = mkCanvas(512, 112);
    let g = x.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, '#7a0404'); g.addColorStop(1, '#a60605'); x.fillStyle = g; x.fillRect(0, 0, 512, 112);
    x.strokeStyle = '#f5b821'; x.lineWidth = 4; x.strokeRect(6, 6, 500, 100);
    setFont(x, `900 30px ${DISPLAY}`); x.fillStyle = '#ffd76a'; x.textBaseline = 'middle'; x.fillText('KICKSANDTRICKS', 22, 40);
    setFont(x, `700 18px ${MONO}`); x.fillStyle = '#fbf1c7'; x.fillText('CERT 00047 · TRADE READY', 22, 80);
    setFont(x, `900 64px ${DISPLAY}`); x.textAlign = 'right'; x.fillStyle = '#fff'; x.fillText('10', 492, 60);
    return canvasTex(c);
  }
  const foilVert = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
  const foilFrag = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uTime; uniform float uOpacity; uniform float uWin;
    float sdRound(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
    void main(){
      float f = dot(vN, vV);
      float t = vUv.x*1.3 + vUv.y*0.9 + f*2.6 + uTime*0.08;
      vec3 col = 0.5 + 0.5*cos(6.2831*(t + vec3(0.0,0.33,0.67)));
      float lines = 0.65 + 0.35*sin((vUv.x - vUv.y)*90.0 + uTime);
      float d = sdRound(vUv-0.5, vec2(0.5), 0.05);
      float mask = 1.0 - smoothstep(-0.005, 0.0, d);
      float win = step(0.074,vUv.x)*step(vUv.x,0.926)*step(0.46,vUv.y)*step(vUv.y,0.877);
      float a = mask * (0.18 + uWin*0.55*win) * uOpacity;
      gl_FragColor = vec4(col*lines*a, a);
    }`;
  const foilMats = [];
  const mkFoil = (win = 1) => { const m = new THREE.ShaderMaterial({ vertexShader: foilVert, fragmentShader: foilFrag, uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uWin: { value: win } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); foilMats.push(m); return m; };

  let cardFronts, cardBackTex, slabTex;
  const cardPlane = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const slabGeo = new THREE.BoxGeometry(0.82, 1.2, 0.08);
  const slabEdges = new THREE.EdgesGeometry(slabGeo);
  const slabMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false });
  const slabLineMat = new THREE.LineBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.45 });

  function makeCard(i, { slab = false } = {}) {
    const root = new THREE.Group();
    const cardL = new THREE.Group(), foilL = new THREE.Group(), slabL = new THREE.Group();
    root.add(cardL, foilL, slabL);
    const front = new THREE.Mesh(cardPlane, new THREE.MeshStandardMaterial({ map: cardFronts[i % 4], roughness: 0.35, metalness: 0.15, alphaTest: 0.5, side: THREE.FrontSide }));
    const back = new THREE.Mesh(cardPlane, new THREE.MeshStandardMaterial({ map: cardBackTex, roughness: 0.4, alphaTest: 0.5 })); back.rotation.y = Math.PI;
    cardL.add(front, back);
    const foil = new THREE.Mesh(cardPlane, mkFoil(1)); foil.position.z = 0.004; foilL.add(foil);
    if (slab) {
      slabL.add(new THREE.Mesh(slabGeo, slabMat));
      slabL.add(new THREE.LineSegments(slabEdges, slabLineMat));
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.16), new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.4 })); lab.position.set(0, 0.48, 0.042); slabL.add(lab);
      cardL.position.y = foilL.position.y = -0.09;
    }
    root.userData = { cardL, foilL, slabL };
    return root;
  }

  // =====================================================================
  //  JEWELRY
  // =====================================================================
  const ice = new THREE.Group(); world.add(ice);
  {
    const N = isMobile ? 44 : 64;
    const link = new THREE.TorusGeometry(0.078, 0.027, 8, 22);
    const chain = new THREE.InstancedMesh(link, M.gold, N);
    const a = 1.0, b = 1.28, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), s = new THREE.Vector3(1.45, 1, 1);
    for (let i = 0; i < N; i++) {
      const th = i / N * Math.PI * 2;
      const p = new THREE.Vector3(a * Math.sin(th), b * Math.cos(th) * (Math.cos(th) < 0 ? 1.12 : 1), 0);
      const tng = new THREE.Vector3(a * Math.cos(th), -b * Math.sin(th), 0).normalize();
      q.setFromUnitVectors(X, tng); q2.setFromAxisAngle(tng, (i % 2) * Math.PI / 2); q.premultiply(q2);
      m4.compose(p, q, s); chain.setMatrixAt(i, m4);
    }
    ice.add(chain);
    const pend = new THREE.Group(); pend.position.set(0, -b * 1.12 - 0.34, 0);
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 40), M.gold); bezel.rotation.x = Math.PI / 2; pend.add(bezel);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), M.ice); gem.scale.set(1, 1.2, 0.6); gem.position.z = 0.06; pend.add(gem);
    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20), M.gold); bail.position.y = 0.31; pend.add(bail);
    for (let k = 0; k < 12; k++) { const st = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), M.ice); const an = k / 12 * Math.PI * 2; st.position.set(Math.cos(an) * 0.23, Math.sin(an) * 0.23, 0.05); pend.add(st); }
    ice.add(pend);
    const rings = [];
    for (let k = 0; k < 2; k++) {
      const r = new THREE.Group();
      r.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.075, 20, 64), k ? M.gold : M.goldRough));
      const g2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), M.ice); g2.position.y = 0.39; g2.scale.y = 1.15; r.add(g2);
      const set = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.08, 16), M.gold); set.position.y = 0.33; r.add(set);
      ice.add(r); rings.push(r);
    }
    ice.userData = { chain, pend, rings };
  }
  // sparkles
  const sparkleTex = (() => { const [c, x] = mkCanvas(64, 64); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,240,200,.8)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = '#fff'; x.fillRect(31, 0, 2, 64); x.fillRect(0, 31, 64, 2); return canvasTex(c); })();
  const sparkles = [];
  for (let k = 0; k < (isMobile ? 10 : 22); k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xfff0c8 }));
    sp.position.set((rand() - 0.5) * 3.2, (rand() - 0.5) * 3.4, (rand() - 0.3) * 1.2); sp.userData.ph = rand() * 10; ice.add(sp); sparkles.push(sp);
  }

  // =====================================================================
  //  CLOTHING (hoodie + tee)
  // =====================================================================
  const fits = new THREE.Group(); world.add(fits);
  function mirrorShape(half) { const sh = new THREE.Shape(); sh.moveTo(half[0][0], half[0][1]); for (let i = 1; i < half.length; i++) sh.lineTo(half[i][0], half[i][1]); for (let i = half.length - 1; i >= 0; i--) if (half[i][0] !== 0) sh.lineTo(-half[i][0], half[i][1]); sh.closePath(); return sh; }
  {
    const half = [[0, 1.2], [0.22, 1.19], [0.42, 1.1], [0.55, 0.94], [0.6, 0.76], [0.8, 0.7], [1.02, 0.6], [1.16, 0.42], [1.3, 0.05], [1.42, -0.42], [1.5, -0.74], [1.2, -0.84], [1.12, -0.5], [0.98, -0.08], [0.88, 0.12], [0.86, -0.5], [0.86, -0.94], [0.8, -1.1], [0, -1.1]];
    const sh = mirrorShape(half);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.09, bevelSegments: isMobile ? 3 : 6, curveSegments: 8 }); g.translate(0, 0, -0.11);
    const fleece = new THREE.MeshPhysicalMaterial({ color: 0xa60605, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color(0xff6a4a), sheenRoughness: 0.6 });
    const fleeceDark = new THREE.MeshPhysicalMaterial({ color: 0x7c0403, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0xff5a3a) });
    const hoodie = new THREE.Group(); fits.add(hoodie);
    hoodie.add(new THREE.Mesh(g, fleece));
    const opening = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), new THREE.MeshBasicMaterial({ color: 0x0a0202 })); opening.scale.set(1, 0.62, 1); opening.position.set(0, 0.93, 0.232); hoodie.add(opening);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 10, 48), fleeceDark); rim.scale.set(1, 0.62, 0.6); rim.position.set(0, 0.93, 0.232); hoodie.add(rim);
    const pk = new THREE.Shape(); pk.moveTo(-0.52, -0.86); pk.lineTo(0.52, -0.86); pk.lineTo(0.4, -0.36); pk.lineTo(-0.4, -0.36); pk.closePath();
    const pkg = new THREE.ExtrudeGeometry(pk, { depth: 0.015, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); pkg.translate(0, 0, 0.21);
    hoodie.add(new THREE.Mesh(pkg, fleeceDark));
    const wb = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.16, 0.48), fleeceDark); wb.position.set(0, -1.02, 0); hoodie.add(wb);
    for (const s of [-1, 1]) {
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.42), fleeceDark); cuff.position.set(s * 1.35, -0.78, 0); cuff.rotation.z = s * -0.25; hoodie.add(cuff);
      const str = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.13, 0.76, 0.25), new THREE.Vector3(s * 0.15, 0.5, 0.27), new THREE.Vector3(s * 0.17, 0.2, 0.26)]), 16, 0.016, 6);
      hoodie.add(new THREE.Mesh(str, M.lace));
      const ag = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 10), M.gold); ag.position.set(s * 0.17, 0.16, 0.26); hoodie.add(ag);
    }
    const print = new THREE.Group(); print.position.set(0, 0.25, 0.236); hoodie.add(print);
    const printMat = new THREE.MeshStandardMaterial({ map: loadTex('assets/logo.svg'), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.655), printMat); print.add(pm);
    // tee (cream) behind
    const teeHalf = [[0, 0.95], [0.26, 0.98], [0.52, 0.9], [1.02, 0.62], [1.2, 0.2], [0.86, 0.06], [0.78, 0.3], [0.78, -1.0], [0, -1.0]];
    const tg = new THREE.ExtrudeGeometry(mirrorShape(teeHalf), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    const tee = new THREE.Group(); tee.add(new THREE.Mesh(tg, new THREE.MeshPhysicalMaterial({ color: 0xf3ead8, roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) })));
    const neck = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a0d08 })); neck.rotation.z = Math.PI; neck.scale.y = 0.6; neck.position.set(0, 0.97, 0.115); tee.add(neck);
    const [tc, tx] = mkCanvas(512, 256); setFont(tx, `900 54px ${DISPLAY}`); tx.textAlign = 'center'; tx.fillStyle = '#a60605'; tx.fillText('SOMETHING', 256, 80); tx.fillText('FOR', 256, 140); tx.fillText('EVERYONE', 256, 200);
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshStandardMaterial({ map: canvasTex(tc), transparent: true, roughness: 0.8 })); tp.position.set(0, 0.25, 0.115); tee.add(tp);
    tee.position.set(-1.25, 0.45, -1.4); tee.rotation.set(0.05, 0.45, 0.12); tee.scale.setScalar(0.85); fits.add(tee);
    fits.userData = { hoodie, tee, print };
  }

  // =====================================================================
  //  ART (frames)
  // =====================================================================
  const art = new THREE.Group(); world.add(art);
  function frame(w, h, tex, mat = M.gold) {
    const g = new THREE.Group(), b = 0.11;
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.closePath();
    const hole = new THREE.Path(); hole.moveTo(-w / 2 + b, -h / 2 + b); hole.lineTo(-w / 2 + b, h / 2 - b); hole.lineTo(w / 2 - b, h / 2 - b); hole.lineTo(w / 2 - b, -h / 2 + b); hole.closePath(); sh.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 2 }); fg.translate(0, 0, -0.04);
    g.add(new THREE.Mesh(fg, mat));
    const cv = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * b + 0.01, h - 2 * b + 0.01), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })); cv.position.z = -0.01; g.add(cv);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.black); back.position.z = -0.075; back.rotation.y = Math.PI; g.add(back);
    return g;
  }
  function dripArt() {
    const [c, x] = mkCanvas(512, 680);
    x.fillStyle = '#a60605'; x.fillRect(0, 0, 512, 680);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${0.04 + rand() * 0.08})`; x.beginPath(); x.arc(rand() * 512, rand() * 680, rand() * 30, 0, 7); x.fill(); }
    setFont(x, `900 150px ${DISPLAY}`); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save(); x.translate(256, 300); x.rotate(-0.08);
    x.fillStyle = '#120202'; x.fillText('K&T', 8, 10); const g = x.createLinearGradient(0, -80, 0, 80); g.addColorStop(0, '#fff4c9'); g.addColorStop(0.5, '#f9b25a'); g.addColorStop(1, '#ef6a3a'); x.fillStyle = g; x.fillText('K&T', 0, 0); x.restore();
    for (let i = 0; i < 18; i++) { const dx = 60 + rand() * 400, dy = 330 + rand() * 40, len = 60 + rand() * 260, w = 5 + rand() * 9; x.fillStyle = i % 3 ? '#f5b821' : '#fff4c9'; x.fillRect(dx, dy, w, len); x.beginPath(); x.arc(dx + w / 2, dy + len, w * 0.9, 0, 7); x.fill(); }
    setFont(x, `800 20px ${MONO}`); x.fillStyle = '#fbf1c7'; x.textAlign = 'left'; x.fillText('BE YOURSELF', 30, 640);
    return canvasTex(c);
  }
  function posterArt(logoImg) {
    const [c, x] = mkCanvas(560, 560);
    const g = x.createRadialGradient(280, 300, 20, 280, 280, 420); g.addColorStop(0, '#fbf1c7'); g.addColorStop(0.6, '#f59a4a'); g.addColorStop(1, '#a60605'); x.fillStyle = g; x.fillRect(0, 0, 560, 560);
    x.fillStyle = 'rgba(120,10,5,.35)'; for (let yy = 0; yy < 560; yy += 14) for (let xx = 0; xx < 560; xx += 14) { const r = 1 + 5 * (Math.hypot(xx - 280, yy - 280) / 400); x.beginPath(); x.arc(xx + (yy / 14 % 2) * 7, yy, Math.min(r, 6), 0, 7); x.fill(); }
    if (logoImg) x.drawImage(logoImg, 40, 120, 480, 480 * logoImg.height / logoImg.width);
    setFont(x, `800 18px ${MONO}`); x.fillStyle = '#120202'; x.textAlign = 'center'; x.fillText('SOMETHING FOR EVERYONE', 280, 70);
    return canvasTex(c);
  }
  const frames = [];

  // =====================================================================
  //  GRAILS (display case, figure, booster)
  // =====================================================================
  const grails = new THREE.Group(); world.add(grails);
  {
    const W = 2.1, H = 1.55, D = 1.25;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, clearcoat: 1, envMapIntensity: 2.5, depthWrite: false, side: THREE.DoubleSide }));
    glass.position.y = H / 2; grails.add(glass);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), new THREE.LineBasicMaterial({ color: 0xf5b821, transparent: true, opacity: 0.85 })); edges.position.y = H / 2; grails.add(edges);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.32, D + 0.2), new THREE.MeshStandardMaterial({ color: 0x0d0a09, roughness: 0.35, metalness: 0.3 })); ped.position.y = -0.16; grails.add(ped);
    const trim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.2, 0.32, D + 0.2)), new THREE.LineBasicMaterial({ color: 0xf5b821 })); trim.position.y = -0.16; grails.add(trim);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.5, D + 0.5), new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 0.5 })); plinth.position.y = -0.57; grails.add(plinth);
    const light = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd38a })); light.rotation.x = Math.PI / 2; light.position.y = H - 0.02; grails.add(light);
    // [placeholder] generic vinyl collectible figure (no licensed character)
    const fig = new THREE.Group();
    const vinyl = new THREE.MeshPhysicalMaterial({ color: 0xa60605, roughness: 0.3, clearcoat: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.22, 6, 16), vinyl); body.position.y = 0.3; fig.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xfbf1c7, roughness: 0.35, clearcoat: 1 })); head.position.y = 0.72; head.scale.set(1.1, 1, 1); fig.add(head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.black); e.position.set(s * 0.1, 0.72, 0.24); e.scale.set(1, 1.3, 0.5); fig.add(e); }
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 16), M.fire); hair.position.set(0, 1.05, -0.02); fig.add(hair);
    const hair2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 16), M.gold); hair2.position.set(0.14, 0.98, 0); hair2.rotation.z = -0.5; fig.add(hair2);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.06, 32), M.gold); base.position.y = 0.03; fig.add(base);
    fig.scale.setScalar(0.85); grails.add(fig);
    // booster pack (generic)
    const [bc, bx] = mkCanvas(256, 400);
    let g = bx.createLinearGradient(0, 0, 256, 400); g.addColorStop(0, '#2a0303'); g.addColorStop(0.5, '#a60605'); g.addColorStop(1, '#f59a4a'); bx.fillStyle = g; bx.fillRect(0, 0, 256, 400);
    bx.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 400; i += 8) bx.fillRect(0, i, 256, 2);
    setFont(bx, `900 34px ${DISPLAY}`); bx.fillStyle = '#ffd76a'; bx.textAlign = 'center'; bx.fillText('K&T', 128, 170); setFont(bx, `800 16px ${MONO}`); bx.fillStyle = '#fbf1c7'; bx.fillText('BOOSTER', 128, 210); bx.fillText('SERIES X', 128, 236);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.04), new THREE.MeshStandardMaterial({ map: canvasTex(bc), metalness: 0.75, roughness: 0.28 }));
    grails.add(pack);
    grails.userData = { fig, pack, glass, W, H };
  }

  // =====================================================================
  //  EMBERS + GLOW
  // =====================================================================
  const EMB = isMobile ? 220 : 650;
  const embGeo = new THREE.BufferGeometry();
  { const p = new Float32Array(EMB * 3), s = new Float32Array(EMB); for (let i = 0; i < EMB; i++) { p[i * 3] = (rand() - 0.5) * 16; p[i * 3 + 1] = (rand() - 0.5) * 9; p[i * 3 + 2] = (rand() - 0.7) * 8; s[i] = rand(); } embGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); embGeo.setAttribute('aSeed', new THREE.BufferAttribute(s, 1)); }
  const embMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uBoost: { value: 1 }, uSize: { value: isMobile ? 7 : 9 } },
    vertexShader: `uniform float uTime,uPR,uSize; attribute float aSeed; varying float vA; varying float vHeat;
      void main(){ vec3 p=position; float sp=0.12+fract(aSeed*7.31)*0.38; p.y=mod(p.y+uTime*sp+4.5,9.0)-4.5; p.x+=sin(uTime*0.7+aSeed*20.0)*0.3;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uSize*uPR*(0.35+fract(aSeed*13.1))*(6.0/-mv.z);
      vHeat=fract(aSeed*3.7); vA=smoothstep(-4.5,-2.5,p.y)*(1.0-smoothstep(2.5,4.5,p.y))*(0.55+0.45*sin(uTime*3.0+aSeed*40.0)); }`,
    fragmentShader: `uniform float uBoost; varying float vA; varying float vHeat;
      void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); a*=a; vec3 col=mix(vec3(1.,.22,.04),vec3(1.,.78,.35),vHeat); gl_FragColor=vec4(col*a*vA*uBoost,1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const embers = new THREE.Points(embGeo, embMat); scene.add(embers);
  const glowTex = (() => { const [c, x] = mkCanvas(256, 256); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,120,40,.55)'); g.addColorStop(0.4, 'rgba(200,30,10,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return canvasTex(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(7, 7, 1); glow.position.z = -2.5; scene.add(glow);
  // contact shadow under the sneaker
  const shadowTex = (() => { const [c, x] = mkCanvas(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return canvasTex(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; sneaker.add(shadow); shadow.position.y = -0.82;

  // ---------- textures that need fonts ----------
  cardFronts = themes.map(cardFront); cardBackTex = cardBack(); slabTex = slabLabel();
  const heroCard = makeCard(0, { slab: true }); world.add(heroCard);
  const swarm = []; const swarmGroup = new THREE.Group(); world.add(swarmGroup);
  const NC = isMobile ? 9 : 22;
  for (let i = 0; i < NC; i++) {
    const c = makeCard(i + 1, { slab: i % 3 === 0 }); swarmGroup.add(c);
    c.userData.o = { th: rand() * Math.PI * 2, r: 1.7 + rand() * 1.9, y: (rand() - 0.5) * 3.0, sp: 0.5 + rand(), far: new THREE.Vector3((rand() - 0.5) * 18, (rand() - 0.5) * 10, -16 - rand() * 10), spin: (rand() - 0.5) * 2, dir: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() * 0.5).normalize(), tilt: (rand() - 0.5) * 0.8 };
    swarm.push(c);
  }
  // art frames (logo texture needed for poster)
  const logoImg = new Image(); logoImg.src = 'assets/logo.svg';
  const posterTex = posterArt(null);
  logoImg.onload = () => { const t = posterArt(logoImg); frames[2] && (frames[2].children[1].material.map = t, frames[2].children[1].material.needsUpdate = true); };
  frames.push(frame(1.3, 1.72, dripArt(), M.black));
  frames.push(frame(2.05, 1.26, loadTex('assets/flyer_homecoming_jan24_2026.svg'), M.gold));
  frames.push(frame(1.15, 1.15, posterTex, M.gold));
  frames[0].position.set(-1.15, 0.7, -1.1); frames[0].rotation.set(0, 0.35, -0.04);
  frames[1].position.set(0.1, -0.05, 0);
  frames[2].position.set(1.15, -0.85, 0.6); frames[2].rotation.set(0, -0.3, 0.05);
  frames.forEach(f => art.add(f));

  // =====================================================================
  //  CALLOUTS (HTML labels + SVG lines projected from 3D)
  // =====================================================================
  const svg = document.getElementById('callout-svg'), coWrap = document.getElementById('callouts');
  const NS = 'http://www.w3.org/2000/svg';
  function mkCallout(title, copy, idx) {
    const el = document.createElement('div'); el.className = 'co-label'; el.innerHTML = `<b><i>0${idx + 1}</i>${title}</b><span>${copy}</span>`; coWrap.appendChild(el);
    const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#f5b821'); path.setAttribute('stroke-width', '1'); path.setAttribute('pathLength', '1'); path.setAttribute('stroke-dasharray', '1'); svg.appendChild(path);
    const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '3.5'); dot.setAttribute('fill', '#ff3b1f'); svg.appendChild(dot);
    const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('r', '8'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'rgba(255,59,31,.6)'); svg.appendChild(ring);
    return { el, path, dot, ring, last: -1 };
  }
  const sneakerCO = sneakerAnchors.map((a, i) => Object.assign(mkCallout(a.title, a.copy, i), a));
  const cardAnch = [
    { part: 'slabL', p: new THREE.Vector3(0.41, 0.3, 0.04), title: 'Slab', copy: 'Cased up and trade-ready.' },
    { part: 'foilL', p: new THREE.Vector3(0.3, 0.05, 0), title: 'Foil', copy: 'The holo shine.' },
    { part: 'cardL', p: new THREE.Vector3(0.3, -0.3, 0), title: 'Card', copy: 'The pull you came for.' },
  ];
  const cardCO = cardAnch.map((a, i) => Object.assign(mkCallout(a.title, a.copy, i), a));
  const v3 = new THREE.Vector3();
  function toScreen(obj, local) { v3.copy(local); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * VW, (1 - v3.y) / 2 * VH]; }
  function layoutCallouts(list, objFn, vis, colX) {
    const pts = list.map(c => toScreen(objFn(c), c.p));
    // label y: follow anchors, enforce min spacing
    const order = pts.map((p, i) => i).sort((a, b) => pts[a][1] - pts[b][1]);
    const gap = mobile ? 34 : 64; let prev = -1e9; const ys = [];
    for (const i of order) { let y = Math.max(pts[i][1], prev + gap); ys[i] = y; prev = y; }
    const top = mobile ? VH * 0.3 : 90, bot = mobile ? VH * 0.62 : VH - 90, maxY = Math.max(...ys);
    if (maxY > bot) { const sh = maxY - bot; for (const i in ys) ys[i] -= sh; }
    list.forEach((c, i) => {
      const k = clamp(vis * 1.4 - i * 0.08);
      const [ax, ay] = pts[i], ly = Math.max(top, ys[i]);
      const lx = colX;
      if (k <= 0.001) { if (c.last !== 0) { c.el.style.opacity = 0; c.path.style.opacity = 0; c.dot.style.opacity = 0; c.ring.style.opacity = 0; c.last = 0; } return; }
      c.last = k;
      c.el.style.opacity = k; c.el.style.transform = `translate(${lx + 12}px, ${ly - 9}px)`;
      const ex = lx - 34;
      c.path.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${ex.toFixed(1)},${ly.toFixed(1)} L${(lx + 4).toFixed(1)},${ly.toFixed(1)}`);
      c.path.style.opacity = 0.9; c.path.setAttribute('stroke-dashoffset', (1 - k).toFixed(3));
      c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.dot.style.opacity = k;
      c.ring.setAttribute('cx', ax); c.ring.setAttribute('cy', ay); c.ring.style.opacity = k * 0.8;
    });
  }

  // =====================================================================
  //  SCROLL STATE
  // =====================================================================
  const ghosts = {}; document.querySelectorAll('[data-ghost]').forEach(g => ghosts[g.dataset.ghost] = g);
  const secEls = {}; document.querySelectorAll('[data-sec]').forEach(s => secEls[s.dataset.sec] = s);
  const S = {}; let VW = innerWidth, VH = innerHeight, hh = 1, hw = 1, mobile = false;
  function measure() {
    VW = innerWidth; VH = innerHeight; mobile = VW / VH < 0.85 || VW < 700;
    camera.aspect = VW / VH; camera.updateProjectionMatrix(); renderer.setSize(VW, VH, false);
    hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; hw = hh * camera.aspect;
    for (const k in secEls) { const r = secEls[k].getBoundingClientRect(); S[k] = { top: r.top + scrollY, h: r.height }; }
  }
  function sec(id) {
    const s = S[id], y = scrollY;
    const enter = clamp((y - s.top + VH) / VH), t = clamp((y - s.top) / Math.max(1, s.h - VH)), exit = clamp((y - (s.top + s.h - VH)) / VH);
    const p = clamp((y - s.top + VH) / (s.h + VH));
    return { enter, t, exit, p, vis: ss(0, 0.7, enter) * (1 - ss(0.3, 1, exit)), on: enter > 0 && exit < 1 };
  }
  measure();
  addEventListener('resize', () => { measure(); embMat.uniforms.uPR.value = renderer.getPixelRatio(); });
  window.addEventListener('load', measure);
  setTimeout(measure, 800);

  // pointer
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  // =====================================================================
  //  RENDER LOOP
  // =====================================================================
  const clock = new THREE.Clock();
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  let canvasOpacity = 1;
  function setPose(obj, pos, rot, sc) { obj.position.copy(pos); obj.rotation.set(rot[0], rot[1], rot[2]); obj.scale.setScalar(Math.max(sc, 0.0001)); }

  let elapsed = 0;
  function frameLoop() {
    requestAnimationFrame(frameLoop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (window.__ktManual) return; // capture mode drives frames via window.__ktRender
    renderFrame(dt);
  }
  window.__ktRender = (dt) => renderFrame(dt);
  function renderFrame(dt) {
    elapsed += dt;
    const time = reduced ? 0 : elapsed;
    ptr.sx += (ptr.x - ptr.sx) * 0.06; ptr.sy += (ptr.y - ptr.sy) * 0.06;

    const H = sec('hero'), E = sec('explode'), C = sec('cards'), I = sec('ice'), F = sec('fits'), A = sec('art'), G = sec('grails'), X = sec('sfe');

    // ---- canvas fade toward the HTML sections ----
    const fade = 1 - ss(0.25, 0.95, X.exit);
    if (Math.abs(fade - canvasOpacity) > 0.001) { canvasOpacity = fade; canvas.style.opacity = fade.toFixed(3); coWrap.style.opacity = fade.toFixed(3); document.querySelector('.ghost-layer').style.opacity = fade.toFixed(3); }
    if (fade <= 0.001) return;

    world.rotation.x = ptr.sy * 0.05; world.rotation.y = ptr.sx * 0.08;
    const bob = Math.sin(time * 1.3) * 0.07;
    const side = mobile ? 0 : 1;
    const objY = mobile ? hh * 0.22 : 0;

    // ---------------- SNEAKER ----------------
    let e = 0, sneakerOn = true;
    if (G.enter > 0) {
      const k = easeOut(G.enter), out = easeIO(G.exit);
      const base = new THREE.Vector3(side * hw * 0.3, objY - (mobile ? 0.25 : 0.35) + lerp(-hh * 2.4, 0, k) + out * hh * 2.6, 0);
      const sc = mobile ? 0.42 : 0.52;
      setPose(sneaker, base.add(new THREE.Vector3(0, 0.55 * sc * 1.0 + 0.05, 0)), [0.12, -0.6 + G.t * 1.4 + time * 0.25, 0], sc);
      shadow.visible = false;
      sneakerOn = G.exit < 1;
    } else {
      shadow.visible = true;
      const heroPos = new THREE.Vector3(mobile ? 0 : 0.05, mobile ? -0.32 : -0.05, 0);
      const heroRot = [0.2 + ptr.sy * 0.25, -0.5 + ptr.sx * 0.45 + Math.sin(time * 0.4) * 0.08, 0.06];
      const heroSc = mobile ? 0.66 : 0.88;
      const exPos = new THREE.Vector3(mobile ? -0.2 : -hw * 0.06, mobile ? -0.22 : 0.12, 0);
      const exRot = [0.55 + ptr.sy * 0.08, -0.82 + ptr.sx * 0.12 + E.t * 0.35, 0.02];
      const exSc = mobile ? 0.5 : 0.78;
      const k = easeIO(E.enter);
      const pos = heroPos.clone().lerp(exPos, k); pos.y += bob * (1 - k * 0.5);
      let rot = heroRot.map((v, i) => lerp(v, exRot[i], k)), sc = lerp(heroSc, exSc, k);
      e = ss(0.06, 0.42, E.t) * (1 - ss(0.1, 0.6, E.exit));
      // drift away as the cards fly in
      const w = ss(0.35, 1.0, E.exit);
      if (w > 0) { pos.lerp(new THREE.Vector3(side * hw * 0.7, hh * 0.9, -6), easeIO(w)); rot[1] += w * 3; sc *= 1 - w * 0.7; }
      setPose(sneaker, pos, rot, sc);
      sneakerOn = w < 0.999;
      shadow.material.opacity = 0.8 * (1 - k);
    }
    sneaker.visible = sneakerOn;
    const eE = easeIO(e);
    layers.forEach((l, i) => { l.position.y = explodeOffsets[i] * eE; l.position.x = (i - 2) * 0.05 * eE; });

    // ---------------- CARDS ----------------
    const cardsOn = C.on;
    heroCard.visible = swarmGroup.visible = cardsOn;
    if (cardsOn) {
      const k = easeOut(ss(0.15, 1, C.enter)), out = easeIO(C.exit);
      const cx = mobile ? 0 : hw * 0.12, cy = objY + (mobile ? 0.05 : 0);
      heroCard.position.set(cx, cy + Math.sin(time * 1.1) * 0.05 + out * hh * 2.4, lerp(-16, 0, k));
      heroCard.rotation.set(0.08 + ptr.sy * 0.15, -0.55 + ptr.sx * 0.3 + (1 - k) * 4 + C.t * 0.5, 0.04);
      heroCard.scale.setScalar(mobile ? 1.05 : 1.55);
      const ce = easeIO(ss(0.08, 0.4, C.t) * (1 - ss(0.78, 1.0, C.t)));
      const u = heroCard.userData; u.cardL.position.z = -0.42 * ce; u.foilL.position.z = 0.02 * ce; u.slabL.position.z = 0.42 * ce;
      u.cardL.position.x = -0.12 * ce; u.slabL.position.x = 0.12 * ce;
      const center = tmpA.set(cx + (mobile ? 0 : hw * 0.12), cy, -0.8);
      swarm.forEach((c, i) => {
        const o = c.userData.o;
        const ki = easeOut(ss(i * 0.012, 0.75 + i * 0.008, C.enter));
        const ang = o.th + time * 0.12 * o.sp + C.t * 2.6 * o.sp;
        const R = o.r * (mobile ? 0.55 : 0.82);
        tmpB.set(center.x + Math.cos(ang) * R * 1.25, center.y + o.y * (mobile ? 0.8 : 1) + Math.sin(time * o.sp + i) * 0.08, center.z + Math.sin(ang) * R * 0.8);
        c.position.copy(o.far).lerp(tmpB, ki);
        if (out > 0) c.position.addScaledVector(o.dir, out * 9);
        c.rotation.set(o.tilt + Math.sin(time * 0.5 + i) * 0.2, ang * 0.5 + o.spin * time * 0.3 + (1 - ki) * 6, o.tilt * 0.5);
        c.scale.setScalar(mobile ? 0.62 : 0.8);
      });
    }
    // ---------------- ICE ----------------
    ice.visible = I.on;
    if (I.on) {
      const k = easeOut(I.enter), out = easeIO(I.exit);
      ice.position.set(mobile ? 0 : -hw * 0.38, objY + (mobile ? 0.1 : 0.15) + lerp(-hh * 2.4, 0, k) + out * hh * 2.6, 0);
      ice.rotation.set(0.3 + ptr.sy * 0.1, I.p * Math.PI * 2.2 + time * 0.15, 0.08 + Math.sin(time * 0.6) * 0.05);
      ice.scale.setScalar(mobile ? 0.58 : 0.95);
      const { rings, pend } = ice.userData;
      rings.forEach((r, j) => { const a = time * 0.6 + j * Math.PI + I.t * 4; r.position.set(Math.cos(a) * 1.75, (j ? 0.7 : -0.8) + Math.sin(a * 1.3) * 0.15, Math.sin(a) * 0.9); r.rotation.set(time * 0.7 + j, time * 0.9 + I.t * 5, 0.3); });
      pend.rotation.y = Math.sin(time * 1.2) * 0.4 - ice.rotation.y * 0.0;
      sparkles.forEach(s => { const tw = Math.pow(Math.max(0, Math.sin(time * 2.5 + s.userData.ph * 3)), 6); s.material.opacity = tw; s.scale.setScalar(0.15 + tw * 0.35); });
    }
    // ---------------- FITS ----------------
    fits.visible = F.on;
    if (F.on) {
      const k = easeOut(F.enter), out = easeIO(F.exit);
      fits.position.set(mobile ? 0.15 : hw * 0.36, objY + (mobile ? 0.15 : 0) + lerp(-hh * 2.4, 0, k) + out * hh * 2.6 + bob * 0.6, 0);
      fits.rotation.set(0.05 + ptr.sy * 0.1, lerp(0.7, -0.5, F.p) + ptr.sx * 0.2, Math.sin(time * 0.7) * 0.03);
      fits.scale.setScalar(mobile ? 0.62 : 1.0);
      const pop = Math.sin(clamp(F.t) * Math.PI);
      fits.userData.print.position.z = 0.236 + pop * 0.45; fits.userData.print.rotation.y = pop * 0.25;
      fits.userData.tee.position.y = 0.45 + Math.sin(time * 0.9) * 0.08;
    }
    // ---------------- ART ----------------
    art.visible = A.on;
    if (A.on) {
      const k = easeOut(A.enter), out = easeIO(A.exit);
      art.position.set(mobile ? 0 : -hw * 0.3, objY + (mobile ? 0.15 : 0) + lerp(-hh * 2.4, 0, k) + out * hh * 2.6, 0);
      art.rotation.set(ptr.sy * 0.08, lerp(0.45, -0.35, A.p) + ptr.sx * 0.15, 0);
      art.scale.setScalar(mobile ? 0.6 : 0.95);
      frames[0].position.y = 0.7 + (A.p - 0.5) * 0.9; frames[2].position.y = -0.85 - (A.p - 0.5) * 0.9;
      frames[0].position.z = -1.1 - A.t * 0.3; frames[2].position.z = 0.6 + A.t * 0.4;
    }
    // ---------------- GRAILS ----------------
    grails.visible = G.on;
    if (G.on) {
      const k = easeOut(G.enter), out = easeIO(G.exit);
      grails.position.set(side * hw * 0.3, objY - (mobile ? 0.25 : 0.35) + lerp(-hh * 2.4, 0, k) + out * hh * 2.6, 0);
      grails.scale.setScalar(mobile ? 0.6 : 1.18);
      grails.rotation.set(0.18 + ptr.sy * 0.08, lerp(-0.45, 0.45, G.t) + ptr.sx * 0.15, 0);
      // keep the sneaker in sync with the case
      if (sneaker.visible) { sneaker.position.copy(grails.position).add(new THREE.Vector3(0, 0.62 * grails.scale.x, 0)); sneaker.scale.setScalar(0.56 * grails.scale.x); sneaker.rotation.set(grails.rotation.x, grails.rotation.y + time * 0.3 + G.t * 2, 0); }
      const { fig, pack } = grails.userData;
      const a = time * 0.5 + G.t * 3;
      fig.position.set(Math.cos(a) * 1.75, 0.85 + Math.sin(time * 1.4) * 0.1, Math.sin(a) * 1.0); fig.rotation.y = -a + Math.PI / 2;
      pack.position.set(Math.cos(a + Math.PI) * 1.75, 1.1 + Math.sin(time * 1.1) * 0.12, Math.sin(a + Math.PI) * 1.0); pack.rotation.set(0.2, time * 0.8, 0.15);
    }

    // ---------------- glow & embers ----------------
    let gx = 0, gy = 0, gs = 7, go = 0.9;
    if (C.on && C.vis > 0.2) { gx = heroCard.position.x; gy = heroCard.position.y; }
    else if (I.on && I.vis > 0.2) { gx = ice.position.x; gy = ice.position.y; }
    else if (F.on && F.vis > 0.2) { gx = fits.position.x; gy = fits.position.y; }
    else if (A.on && A.vis > 0.2) { gx = art.position.x; gy = art.position.y; }
    else if (G.on && G.vis > 0.2) { gx = grails.position.x; gy = grails.position.y + 0.8; }
    else { gx = sneaker.position.x; gy = sneaker.position.y; }
    glow.position.x += (gx - glow.position.x) * 0.08; glow.position.y += (gy - glow.position.y) * 0.08;
    glow.material.opacity = go * (0.85 + 0.15 * Math.sin(time * 2)); glow.scale.set(gs, gs, 1);
    embMat.uniforms.uTime.value = elapsed * (reduced ? 0.2 : 1);
    embMat.uniforms.uBoost.value = 0.9 + 1.6 * X.vis;
    foilMats.forEach(m => m.uniforms.uTime.value = elapsed);

    // ---------------- ghost words ----------------
    for (const id in ghosts) {
      const s = sec(id), g = ghosts[id];
      const o = s.vis;
      if (o <= 0.001) { if (g._o !== 0) { g.style.opacity = 0; g._o = 0; } continue; }
      g._o = o;
      const dx = (0.5 - s.p) * (mobile ? 60 : 40);
      const dy = mobile ? -18 : 0;
      g.style.opacity = o.toFixed(3);
      g.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}vw), calc(-50% + ${dy}vh))`;
    }

    // ---------------- callouts ----------------
    const sv = e * (sneaker.visible ? 1 : 0) * (1 - ss(0.0, 0.25, E.exit));
    layoutCallouts(sneakerCO, c => layers[c.layer], ss(0.55, 1, e) * (1 - ss(0, 0.3, E.exit)), mobile ? VW - 118 : VW * 0.66);
    const cv = cardsOn ? easeIO(ss(0.12, 0.42, C.t) * (1 - ss(0.72, 0.95, C.t))) : 0;
    layoutCallouts(cardCO, c => heroCard.userData[c.part], cv, mobile ? VW - 104 : VW * 0.72);

    renderer.render(scene, camera);
  }
  frameLoop();
  html.classList.add('gl-ready');
  window.__kt = { scene, camera, renderer };
}
