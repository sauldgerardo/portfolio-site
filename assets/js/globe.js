/* ═══════════════════════════════════════════════════════════════════════
   HERO GLOBE

   A wireframe Earth behind the portrait with the four freight modes orbiting
   it. Plain canvas 2D and a bit of trig — no 3D library, since orthographic
   projection of a sphere is just "drop the z and dim the back half".

   Coastlines come from assets/js/world.js (Natural Earth 110m, public
   domain), which must load first. The far side of the globe is drawn faintly
   rather than culled, so it reads as a glass wireframe.

   TUNING — the CONFIG block below.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const canvas = document.getElementById("globe");
  if (!canvas || typeof WORLD === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const CONFIG = {
    spin: 0.055,      // globe rotation, radians/sec
    tilt: 0.36,       // axial tilt toward the viewer, radians
    coast: 1.15,      // coastline stroke width, px
    graticule: true,  // faint lat/lon grid behind the land
    iconSize: 22,     // orbiting (aircraft) glyph size, px
    surfaceIconSize: 12,  // road/rail/sea glyph size, px — much denser, so smaller
    /* Sphere diameter as a fraction of the canvas box. A ring at radius r
       reaches r * globeFrac / 2 of the box, so it clips once that passes 0.5:
       globeFrac 0.78 caps r at ~1.28. Only aircraft orbit now, and the widest
       is 1.22, which is what let the sphere grow from 0.66. Re-check this
       ratio before adding any orbit back. */
    globeFrac: 0.78,
    /* How fast a vehicle turns around when its travel direction flips, in
       units of `face` per second. See FLEET below. */
    turnRate: 5,
  };

  /* Declared up here because the CORRIDORS below are converted to unit
     vectors at load time, before anything else runs. */
  const RAD = Math.PI / 180;

  /* Each mode gets its own orbit, carrying `count` vehicles spaced evenly
     around it. `r` is the ring radius relative to the sphere, `inc` its tilt,
     `phase` where the first vehicle starts, `speed` rad/sec. Signs on `speed`
     are mixed so the rings don't drift into lockstep. `scale` (optional)
     sizes a mode's glyph against CONFIG.iconSize.

     Only aircraft orbit now — trucks, trains and ships ride the surface, see
     CORRIDORS below. Nothing here may exceed the ceiling described on
     CONFIG.globeFrac. */
  const MODES = [
    { key: "drone", r: 1.12, inc: -0.62, phase: 1.2, speed: -0.52, count: 3, scale: 0.78 },
    { key: "plane", r: 1.22, inc: -0.55, phase: 2.1, speed: -0.42, count: 3 },
  ];

  /* ── Surface corridors ──
     Each is a great-circle segment between two real places; vehicles
     ping-pong along it. `speed` is in u-units/sec, so .05 is a ~20s run
     end to end.

     There's no population-density function here — the weighting IS the
     corridor list. Routes sit where freight and people actually are, which
     is why there is nothing in Antarctica, the Sahara, the Canadian north,
     or interior Australia. */
  const CORRIDORS = [
    /* ── road ── */
    { key: "truck", a: [34.0, -118.2], b: [39.7, -105.0], count: 1, speed: .050 }, // LA–Denver
    { key: "truck", a: [41.9,  -87.6], b: [29.8,  -95.4], count: 1, speed: .045 }, // Chicago–Houston
    { key: "truck", a: [40.7,  -74.0], b: [33.7,  -84.4], count: 1, speed: .048 }, // NYC–Atlanta
    { key: "truck", a: [19.4,  -99.1], b: [25.7, -100.3], count: 1, speed: .060 }, // CDMX–Monterrey
    { key: "truck", a: [-23.5, -46.6], b: [-15.8, -47.9], count: 1, speed: .050 }, // São Paulo–Brasília
    { key: "truck", a: [-34.6, -58.4], b: [-31.4, -64.2], count: 1, speed: .060 }, // Buenos Aires–Córdoba
    { key: "truck", a: [48.9,    2.4], b: [45.5,    9.2], count: 1, speed: .055 }, // Paris–Milan
    { key: "truck", a: [52.5,   13.4], b: [52.2,   21.0], count: 1, speed: .065 }, // Berlin–Warsaw
    { key: "truck", a: [40.4,   -3.7], b: [41.4,    2.2], count: 1, speed: .065 }, // Madrid–Barcelona
    { key: "truck", a: [51.5,   -0.1], b: [53.5,   -2.2], count: 1, speed: .075 }, // London–Manchester
    { key: "truck", a: [41.0,   29.0], b: [39.9,   32.9], count: 1, speed: .070 }, // Istanbul–Ankara
    { key: "truck", a: [30.0,   31.2], b: [24.1,   32.9], count: 1, speed: .055 }, // Cairo–Aswan
    { key: "truck", a: [ 6.5,    3.4], b: [12.0,    8.5], count: 1, speed: .055 }, // Lagos–Kano
    { key: "truck", a: [-26.2,  28.0], b: [-29.9,  31.0], count: 1, speed: .065 }, // Johannesburg–Durban
    { key: "truck", a: [28.6,   77.2], b: [22.6,   88.4], count: 2, speed: .045 }, // Delhi–Kolkata
    { key: "truck", a: [19.1,   72.9], b: [17.4,   78.5], count: 1, speed: .060 }, // Mumbai–Hyderabad
    { key: "truck", a: [13.0,   77.6], b: [13.1,   80.3], count: 1, speed: .075 }, // Bangalore–Chennai
    { key: "truck", a: [30.6,  104.1], b: [34.3,  108.9], count: 1, speed: .060 }, // Chengdu–Xi'an
    { key: "truck", a: [23.1,  113.3], b: [31.2,  121.5], count: 2, speed: .045 }, // Guangzhou–Shanghai
    { key: "truck", a: [13.8,  100.5], b: [10.8,  106.7], count: 1, speed: .060 }, // Bangkok–HCMC
    /* Java is the most populous island on Earth and belongs here, but it's a
       thin sliver at the coastline data's 0.55deg simplification — the longer
       Jakarta–Surabaya run put vehicles in the Java Sea. This shorter one
       stays on land. */
    { key: "truck", a: [-6.2,  106.8], b: [-6.9,  107.6], count: 1, speed: .070 }, // Jakarta–Bandung
    { key: "truck", a: [24.9,   67.0], b: [31.5,   74.3], count: 2, speed: .045 }, // Karachi–Lahore
    { key: "truck", a: [23.8,   90.4], b: [22.3,   91.8], count: 1, speed: .070 }, // Dhaka–Chittagong
    { key: "truck", a: [37.6,  127.0], b: [35.2,  129.1], count: 1, speed: .075 }, // Seoul–Busan

    /* ── rail ── */
    { key: "rail",  a: [39.9,  116.4], b: [23.1,  113.3], count: 2, speed: .038 }, // Beijing–Guangzhou HSR
    { key: "rail",  a: [31.2,  121.5], b: [34.3,  108.9], count: 1, speed: .040 }, // Shanghai–Xi'an
    { key: "rail",  a: [28.6,   77.2], b: [19.1,   72.9], count: 2, speed: .040 }, // Delhi–Mumbai
    { key: "rail",  a: [28.6,   77.2], b: [13.1,   80.3], count: 1, speed: .035 }, // Delhi–Chennai
    { key: "rail",  a: [55.8,   37.6], b: [56.8,   60.6], count: 1, speed: .042 }, // Trans-Siberian (west)
    { key: "rail",  a: [48.9,    2.4], b: [52.5,   13.4], count: 1, speed: .050 }, // Paris–Berlin
    { key: "rail",  a: [40.4,   -3.7], b: [37.4,   -6.0], count: 1, speed: .070 }, // Madrid–Seville AVE
    { key: "rail",  a: [35.7,  139.7], b: [34.7,  135.5], count: 1, speed: .075 }, // Shinkansen
    { key: "rail",  a: [41.9,  -87.6], b: [40.7,  -74.0], count: 1, speed: .050 }, // Chicago–NYC
    { key: "rail",  a: [-23.5, -46.6], b: [-22.9, -43.2], count: 1, speed: .075 }, // São Paulo–Rio

    /* ── sea ── slower, and long enough to read as ocean crossings */
    { key: "ship",  a: [31.0,  123.0], b: [33.7, -118.3], count: 2, speed: .016 }, // trans-Pacific
    { key: "ship",  a: [40.5,  -73.5], b: [51.5,    2.0], count: 2, speed: .020 }, // trans-Atlantic
    { key: "ship",  a: [31.5,   32.3], b: [21.5,   39.0], count: 1, speed: .045 }, // Suez–Red Sea
    { key: "ship",  a: [ 1.3,  104.0], b: [ 6.9,   79.9], count: 1, speed: .030 }, // Malacca–Colombo
    { key: "ship",  a: [ 9.0,  -79.5], b: [10.4,  -75.5], count: 1, speed: .060 }, // Panama
    { key: "ship",  a: [-24.0, -46.3], b: [-34.0,  18.4], count: 1, speed: .022 }, // South Atlantic
  ];

  /* 24×24 silhouettes, drawn centered. Kept blocky on purpose — at ~22px
     anything finer turns to mush.

     Every glyph is authored as a horizontal profile FACING RIGHT. The draw
     loop mirrors it on the x axis when the vehicle is travelling left, so a
     glyph that isn't right-facing here will look wrong half the time. */
  const GLYPHS = {
    /* Top-down jet, nose at x≈23, wings swept back, tailplanes at the rear. */
    plane: "M23 12l-8.2 1.1h-.9l-6 7.4H5.3l2.1-7.5-3.6.3-1.5 2.8H1.2l.7-3.2L.8 12l1.1-.9-.7-3.2h1.1l1.5 2.8 3.6.3-2.1-7.5h2.6l6 7.4h.9L23 12z",
    /* Ship and truck are the original artwork, shifted up 2.5 and 0.9 units
       respectively so their ink is centered in the 24×24 box. The glyph is
       drawn centered on the orbit point, so anything off-center rides below
       its own ring. */
    ship:  "M2 14.9h20l-1.9 4.2a1 1 0 0 1-.9.6H4.8a1 1 0 0 1-.9-.6L2 14.9zM5.2 13.4V7.1h6.1V3.7h3.4v3.4h1.9l2.6 6.3H5.2z",
    truck: "M1.6 4.9h11.1v9.9H1.6V4.9zM13.3 8.3h3.9l3.2 3.4v3.1h-7.1V8.3zM5.6 19.1a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM17.9 19.1a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z",
    /* Side-profile locomotive: sloped nose to the right, two windows, three
       wheels sitting on a rail. */
    rail:  "M2.6 4.2h11.9l4.9 4.2v6.1H2.6V4.2zM4.9 6.1h3.4v2.9H4.9V6.1zM10 6.1h3.4v2.9H10V6.1zM1.4 15.4h21.2v1.5H1.4v-1.5zM6.3 20.2a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM12 20.2a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM17.7 20.2a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8z",
    /* Quadcopter: nosed body, four swept arms, four rotor discs. */
    drone: "M9.1 10.2h5.4l3.4 1.3v1l-3.4 1.3H9.1l-2.3-1.3v-1l2.3-1.3zM8.6 11.1L4.9 7.4l1.2-1.2 3.7 3.7-1.2 1.2zM15.4 11.1l3.7-3.7 1.2 1.2-3.7 3.7-1.2-1.2zM8.6 12.9l-3.7 3.7 1.2 1.2 3.7-3.7-1.2-1.2zM15.4 12.9l3.7 3.7-1.2 1.2-3.7-3.7 1.2-1.2zM4.2 8.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zM19.8 8.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zM4.2 20.7a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zM19.8 20.7a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8z",
  };

  const paths = {};
  Object.keys(GLYPHS).forEach(function (k) { paths[k] = new Path2D(GLYPHS[k]); });

  /* Which way is a vehicle at orbit angle `ang` travelling across the screen?
     Screen x is cx + cos(ang) * ring, so dx/dt ∝ -sin(ang) * speed. +1 means
     it's tracking right, -1 left. */
  const facingAt = function (ang, speed) {
    return -Math.sin(ang) * speed >= 0 ? 1 : -1;
  };

  /* ── surface fleet ──
     Corridor endpoints become unit vectors once, using the same convention
     emit() uses below: x = cosLat·sinLon, y = sinLat, z = cosLat·cosLon.
     Position along a corridor is a slerp between them, so vehicles follow the
     great circle rather than cutting through the sphere. */
  const unit = function (lat, lon) {
    const la = lat * RAD, lo = lon * RAD;
    const cl = Math.cos(la);
    return [cl * Math.sin(lo), Math.sin(la), cl * Math.cos(lo)];
  };

  const SURFACE = [];
  CORRIDORS.forEach(function (c) {
    const a = unit(c.a[0], c.a[1]);
    const b = unit(c.b[0], c.b[1]);
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    dot = Math.max(-1, Math.min(1, dot));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);

    for (let i = 0; i < c.count; i++) {
      SURFACE.push({
        key: c.key,
        a: a, b: b, omega: omega, sinOmega: sinOmega,
        /* Spread vehicles along the corridor instead of stacking them at the
           same point, and alternate travel direction so a two-vehicle lane
           reads as two-way traffic. */
        u: c.count > 1 ? i / c.count : Math.random() * 0.8 + 0.1,
        dir: i % 2 === 0 ? 1 : -1,
        speed: c.speed,
        face: 1,
      });
    }
  });

  /* Point at parameter u along a corridor. Degenerate corridors (endpoints
     nearly coincident) fall back to a plain lerp — sinOmega would be ~0. */
  const along = function (s, u) {
    if (s.sinOmega < 1e-6) return s.a;
    const w0 = Math.sin((1 - u) * s.omega) / s.sinOmega;
    const w1 = Math.sin(u * s.omega) / s.sinOmega;
    return [
      s.a[0] * w0 + s.b[0] * w1,
      s.a[1] * w0 + s.b[1] * w1,
      s.a[2] * w0 + s.b[2] * w1,
    ];
  };

  /* Spin about Y, then tilt, then project — identical to what emit() does per
     coastline vertex, just for one arbitrary point. Returns screen x/y plus
     the depth z, where z < 0 is the far side of the globe. */
  const project = function (v, cs, sn, ct, st) {
    const x = v[0] * cs + v[2] * sn;
    const z = v[2] * cs - v[0] * sn;
    const y = v[1];
    return [
      cx + x * R,
      cy - (y * ct - z * st) * R,
      y * st + z * ct,
    ];
  };

  /* MODES describes orbits; FLEET is the individual vehicles on them. Split
     out because `face` is per-vehicle mutable state — the eased mirror used
     when a vehicle rounds the end of its ring and turns around. */
  const FLEET = [];
  MODES.forEach(function (m) {
    for (let i = 0; i < m.count; i++) {
      const phase = m.phase + (i * Math.PI * 2) / m.count;
      FLEET.push({
        key: m.key,
        r: m.r,
        inc: m.inc,
        speed: m.speed,
        phase: phase,
        scale: m.scale || 1,
        /* Seeded to the correct sign rather than 0, so the very first frame
           is already right — which is the only frame the reduced-motion path
           ever draws. */
        face: facingAt(phase, m.speed),
      });
    }
  });

  /* Decode a delta-encoded ring into a flat Float32Array of
     [sinLat, cosLat, sinLon, cosLon, ...] per vertex.

     Baking the trig in at load means the frame loop never calls sin/cos per
     vertex — the spin is applied with the angle-addition identities below,
     which needs only one sin/cos per frame for the whole globe. */
  const bake = function (ring) {
    const n = ring.length / 2;
    const out = new Float32Array(n * 4);
    let lon = ring[0] / 10, lat = ring[1] / 10;
    for (let i = 0; i < n; i++) {
      if (i > 0) {
        lon += ring[i * 2] / 10;
        lat += ring[i * 2 + 1] / 10;
      }
      const la = lat * RAD, lo = lon * RAD;
      out[i * 4]     = Math.sin(la);
      out[i * 4 + 1] = Math.cos(la);
      out[i * 4 + 2] = Math.sin(lo);
      out[i * 4 + 3] = Math.cos(lo);
    }
    return out;
  };

  const LAND = WORLD.map(bake);

  /* Graticule as the same vertex format, so it draws through one code path. */
  const GRID = [];
  if (CONFIG.graticule) {
    for (let lon = 0; lon < 360; lon += 30) {
      const r = [];
      for (let lat = -80; lat <= 80; lat += 10) r.push(lon, lat);
      GRID.push(bakeAbs(r));
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = [];
      for (let lon = 0; lon <= 360; lon += 10) r.push(lon, lat);
      GRID.push(bakeAbs(r));
    }
  }
  /* Same as bake() but for absolute (non-delta) [lon, lat, ...] input. */
  function bakeAbs(pts) {
    const n = pts.length / 2;
    const out = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const lo = pts[i * 2] * RAD, la = pts[i * 2 + 1] * RAD;
      out[i * 4]     = Math.sin(la);
      out[i * 4 + 1] = Math.cos(la);
      out[i * 4 + 2] = Math.sin(lo);
      out[i * 4 + 3] = Math.cos(lo);
    }
    return out;
  }

  let w = 0, h = 0, cx = 0, cy = 0, R = 0;

  const resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    R = (Math.min(w, h) * CONFIG.globeFrac) / 2;
  };

  const theme = function () {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    /* Mirrors --text and --accent per theme; keep in sync with styles.css. */
    return dark
      ? { ink: "255,255,255", accent: "34,211,238",  front: 0.52, back: 0.16, grid: 0.09, limb: 0.18 }
      : { ink: "11,15,18",    accent: "14,116,144",  front: 0.48, back: 0.14, grid: 0.08, limb: 0.16 };
  };

  /* Scratch buffers, reused every frame so the loop allocates nothing. */
  let px = new Float32Array(0), py = new Float32Array(0), pz = new Float32Array(0);
  const ensure = function (n) {
    if (px.length >= n) return;
    px = new Float32Array(n); py = new Float32Array(n); pz = new Float32Array(n);
  };
  LAND.concat(GRID).forEach(function (r) { ensure(r.length / 4); });

  /* Projects one baked polyline into the scratch buffers, then emits its
     segments into whichever of the two open paths matches their depth.
     Segments straddling the limb go to the near path — at this scale the
     difference is a pixel. */
  const emit = function (ring, cs, sn, ct, st, nearPath, farPath) {
    const n = ring.length / 4;
    for (let i = 0; i < n; i++) {
      const sinLat = ring[i * 4], cosLat = ring[i * 4 + 1];
      const sinLon = ring[i * 4 + 2], cosLon = ring[i * 4 + 3];
      // lon + spin, via angle addition — no trig in here.
      const sl = sinLon * cs + cosLon * sn;
      const cl = cosLon * cs - sinLon * sn;
      const x = cosLat * sl, y0 = sinLat, z0 = cosLat * cl;
      px[i] = cx + x * R;
      py[i] = cy - (y0 * ct - z0 * st) * R;
      pz[i] = y0 * st + z0 * ct;
    }
    for (let i = 0; i < n - 1; i++) {
      const p = (pz[i] >= 0 || pz[i + 1] >= 0) ? nearPath : farPath;
      p.moveTo(px[i], py[i]);
      p.lineTo(px[i + 1], py[i + 1]);
    }
  };

  /* Frame delta, for the turn easing. Clamped so a backgrounded tab resuming
     after a long pause doesn't hand us a multi-second dt. */
  let lastTime = -1;

  const draw = function (time) {
    if (!R) return;
    const t = time * 0.001;
    const dt = lastTime < 0 ? 0 : Math.min((time - lastTime) * 0.001, 0.1);
    lastTime = time;
    const p = theme();
    const spin = t * CONFIG.spin;
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const ct = Math.cos(CONFIG.tilt), st = Math.sin(CONFIG.tilt);

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* ── limb ── */
    ctx.strokeStyle = "rgba(" + p.ink + "," + p.limb + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    /* ── graticule ── */
    if (GRID.length) {
      const near = new Path2D(), far = new Path2D();
      for (let i = 0; i < GRID.length; i++) emit(GRID[i], cs, sn, ct, st, near, far);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(" + p.ink + "," + (p.grid * 0.5).toFixed(3) + ")";
      ctx.stroke(far);
      ctx.strokeStyle = "rgba(" + p.ink + "," + p.grid + ")";
      ctx.stroke(near);
    }

    /* ── coastlines ── */
    const near = new Path2D(), far = new Path2D();
    for (let i = 0; i < LAND.length; i++) emit(LAND[i], cs, sn, ct, st, near, far);
    ctx.lineWidth = CONFIG.coast;
    ctx.strokeStyle = "rgba(" + p.ink + "," + p.back + ")";
    ctx.stroke(far);
    ctx.strokeStyle = "rgba(" + p.ink + "," + p.front + ")";
    ctx.stroke(near);

    /* ── orbit rings ── one per mode, not one per vehicle ── */
    ctx.strokeStyle = "rgba(" + p.ink + "," + p.grid + ")";
    ctx.lineWidth = 1;
    for (let m = 0; m < MODES.length; m++) {
      const o = MODES[m];
      const ring = o.r * R;
      const ci = Math.cos(o.inc), si = Math.sin(o.inc);

      ctx.beginPath();
      for (let a = 0; a <= 64; a++) {
        const ang = (a / 64) * Math.PI * 2;
        const bx = Math.cos(ang), bz = Math.sin(ang);
        const yy = -bz * si, zz = bz * ci;
        const sx = cx + bx * ring, sy = cy - (yy * ct - zz * st) * ring;
        if (a === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    /* ── surface traffic: road, rail, sea ── */
    for (let s = 0; s < SURFACE.length; s++) {
      const o = SURFACE[s];

      /* Ping-pong along the corridor. Bouncing at the ends (rather than
         wrapping) is what makes the facing mirror flip, so a vehicle visibly
         turns around at each terminus. */
      if (dt > 0) {
        o.u += o.dir * o.speed * dt;
        if (o.u > 1) { o.u = 2 - o.u; o.dir = -1; }
        else if (o.u < 0) { o.u = -o.u; o.dir = 1; }
      }

      /* `pt`, not `p` — `p` is the theme palette in this scope. */
      const pt = project(along(o, o.u), cs, sn, ct, st);
      const depthZ = pt[2];
      if (depthZ <= 0) continue;   // far side of the globe

      /* Fade in across the limb rather than popping into existence there. */
      const edge = Math.min(1, depthZ / 0.15);

      /* Screen-space travel direction from a finite difference — the orbital
         facingAt() assumes a circle and doesn't apply to a great-circle path. */
      const eps = 0.004 * o.dir;
      const ahead = project(along(o, Math.max(0, Math.min(1, o.u + eps))), cs, sn, ct, st);
      const target = ahead[0] >= pt[0] ? 1 : -1;
      if (dt <= 0) {
        /* Single static frame (reduced motion, or the first frame). Snap,
           because there are no later frames to ease over. */
        o.face = target;
      } else {
        const step = CONFIG.turnRate * dt;
        if (Math.abs(target - o.face) <= step) o.face = target;
        else o.face += Math.sign(target - o.face) * step;
      }

      const depth = 0.72 + 0.28 * depthZ;
      const size = CONFIG.surfaceIconSize * depth;
      const face = Math.abs(o.face) < 0.1 ? Math.sign(o.face || 1) * 0.1 : o.face;

      ctx.save();
      ctx.translate(pt[0], pt[1]);
      ctx.scale((face * size) / 24, size / 24);
      ctx.translate(-12, -12);
      ctx.fillStyle = "rgba(" + p.accent + "," + (edge * (0.45 + 0.5 * depthZ)).toFixed(3) + ")";
      ctx.fill(paths[o.key]);
      ctx.restore();
    }

    /* ── orbiting vehicles: aircraft ── */
    for (let v = 0; v < FLEET.length; v++) {
      const o = FLEET[v];
      const ring = o.r * R;
      const ci = Math.cos(o.inc), si = Math.sin(o.inc);

      const ang = o.phase + t * o.speed;
      const bx = Math.cos(ang), bz = Math.sin(ang);
      const yy = -bz * si, zz = bz * ci;
      const sx = cx + bx * ring;
      const sy = cy - (yy * ct - zz * st) * ring;
      const depthZ = yy * st + zz * ct;

      /* Ease `face` toward ±1 rather than snapping. The sign flips twice per
         orbit, at the far left and right of the ellipse; an instant mirror
         there pops. Easing through zero squashes the glyph horizontally and
         back out, which reads as banking through the turn.

         Stepped before the occlusion test below, so a vehicle that turns
         around while hidden still emerges facing the right way. */
      const target = facingAt(ang, o.speed);
      if (dt > 0) {
        const step = CONFIG.turnRate * dt;
        if (Math.abs(target - o.face) <= step) o.face = target;
        else o.face += Math.sign(target - o.face) * step;
      }

      // Occlusion: hidden only when behind the sphere *and* inside its
      // silhouette. Behind but off to the side still shows.
      if (depthZ < 0 && Math.hypot(sx - cx, sy - cy) < R) continue;

      const depth = 0.82 + 0.18 * (depthZ + 1) / 2;
      const size = CONFIG.iconSize * depth * o.scale;
      /* Never let the mirror pass through exactly 0 — the glyph would vanish
         for a frame mid-turn. */
      const face = Math.abs(o.face) < 0.1 ? Math.sign(o.face || 1) * 0.1 : o.face;

      ctx.save();
      ctx.translate(sx, sy);
      /* Negative x-scale mirrors about the glyph's own center, because the
         translate(-12,-12) below is applied after it in the transform chain.
         Position is unaffected. */
      ctx.scale((face * size) / 24, size / 24);
      ctx.translate(-12, -12);
      ctx.fillStyle = "rgba(" + p.accent + "," + (0.55 + 0.45 * depth).toFixed(2) + ")";
      ctx.fill(paths[o.key]);
      ctx.restore();
    }
  };

  /* ── run loop ── */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let running = false, raf = 0;
  const loop = function (time) { draw(time); raf = requestAnimationFrame(loop); };
  const setRunning = function (on) {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(loop);
    else cancelAnimationFrame(raf);
  };

  resize();

  if (reduceMotion) {
    draw(0);
    window.addEventListener("resize", function () { resize(); draw(0); });
    return;
  }

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  // Off screen it's pure waste.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      setRunning(entries[0].isIntersecting);
    }, { rootMargin: "100px" }).observe(canvas);
  } else {
    setRunning(true);
  }
})();
