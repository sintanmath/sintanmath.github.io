(() => {
  const $ = (id) => document.getElementById(id);
  const curveCv = $("curve");
  const ctx = curveCv.getContext("2d");

  const COL = {
    paper: "#f7f4ee",
    curve: "#c45c26",
    axis: "#8a8176",
    grid: "#ece6dc",
    p: "#d64545",
    q: "#2a7d6f",
    rp: "#6b5ea8",
    sum: "#c9a227",
    chord: "#b7a48c",
    ink: "#2c2a26",
  };

  const vis = {
    axes: true,
    grid: true,
    ticks: true,
    axisLabels: false,
    curve: true,
    cusp: true,
    chord: true,
    third: true,
    reflect: true,
    sum: true,
    preview: true,
    hover: true,
    names: false,
    coords: false,
    t: false,
    glow: false,
    animate: true,
    autofit: true,
    snap: true,
    curveWidth: 2.6,
    lineWidth: 1.6,
    pointR: 6.5,
    gridStep: 1,
  };

  const CURVES = {
    cusp: {
      id: "cusp",
      eq: "y² = x³",
      kind: "cusp",
      param: "t",
      A: 0, a: 0, b: 0,
      view: { x0: -0.55, x1: 3.15, y0: -2.05, y1: 2.05 },
      sing: [{ x: 0, y: 0 }],
      demo: [{ t: 1 }, { t: 2 }],
      slider: { min: -8, max: 8, step: 0.01 },
    },
    node: {
      id: "node",
      eq: "y² = x³ + x²",
      kind: "node",
      param: "s",
      A: 1, a: 0, b: 0,
      view: { x0: -1.7, x1: 3.4, y0: -2.6, y1: 2.6 },
      sing: [{ x: 0, y: 0 }],
      demo: [{ t: 1.3 }, { t: 1.55 }],
      slider: { min: -3, max: 3, step: 0.01 },
    },
    plus1: {
      id: "plus1",
      eq: "y² = x³ + 1",
      kind: "smooth",
      param: "x",
      A: 0, a: 0, b: 1,
      view: { x0: -1.8, x1: 3.3, y0: -2.8, y1: 2.8 },
      sing: [],
      demo: [{ x: 0, y: 1 }, { x: 2, y: 3 }],
      slider: { min: -1.5, max: 4, step: 0.01 },
    },
    minusx: {
      id: "minusx",
      eq: "y² = x³ − x",
      kind: "smooth",
      param: "x",
      A: 0, a: -1, b: 0,
      view: { x0: -2.3, x1: 3.3, y0: -2.8, y1: 2.8 },
      sing: [],
      demo: [{ x: 2, y: Math.sqrt(6) }, { x: -0.5, y: Math.sqrt(0.375) }],
      slider: { min: -2.5, max: 4, step: 0.01 },
    },
    minus2: {
      id: "minus2",
      eq: "y² = x³ − 2",
      kind: "smooth",
      param: "x",
      A: 0, a: 0, b: -2,
      view: { x0: -0.6, x1: 4.4, y0: -5.4, y1: 5.4 },
      sing: [],
      demo: [{ x: 3, y: 5 }, { x: 2, y: Math.sqrt(6) }],
      slider: { min: 1.2, max: 5, step: 0.01 },
    },
    plusx: {
      id: "plusx",
      eq: "y² = x³ + x",
      kind: "smooth",
      param: "x",
      A: 0, a: 1, b: 0,
      view: { x0: -0.5, x1: 3.3, y0: -2.8, y1: 2.8 },
      sing: [],
      demo: [{ x: 1, y: Math.SQRT2 }, { x: 2, y: Math.sqrt(10) }],
      slider: { min: 0, max: 4, step: 0.01 },
    },
  };
  let curve = CURVES.cusp;
  const EPS = 1e-10;
  const T_CUSP = 40;
  const SCALE_MIN = 36;
  const SCALE_MAX = 420;
  const FIT_MAX_X = 6;
  const FIT_MAX_Y = 5;
  const FIT_MIN_T = 0.45;
  const MAX_SPAN_X = 8;
  const MAX_SPAN_Y = 8;
  const SCREEN_LIM = 1e5;
  let camTween = null;

  const state = {
    P: null,
    Q: null,
    hover: null,
    drag: null,
    pan: null,
    result: null,
    preview: null,
  };

  const cam = { ox: 0, oy: 0, scale: 140 };
  const anim = { line: 0, third: 0, reflect: 0, sum: 0 };
  let tl = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fmt(n, d = 3) {
    if (n == null || Number.isNaN(n)) return "";
    if (!Number.isFinite(n)) return "∞";
    if (Math.abs(n) < 1e-10) return "0";
    const r = Math.round(n);
    if (Math.abs(n - r) < 1e-6) return String(r);
    return n.toFixed(d).replace(/\.?0+$/, "");
  }

  function cubicF(x) {
    return ((x + curve.A) * x + curve.a) * x + curve.b;
  }

  function cubicFp(x) {
    return 3 * x * x + 2 * curve.A * x + curve.a;
  }

  function O() {
    return { infinite: true, t: 0, x: Infinity, y: Infinity };
  }

  function isSing(pt) {
    if (!pt || pt.infinite) return false;
    return curve.sing.some((s) => Math.hypot(pt.x - s.x, pt.y - s.y) < 0.045);
  }

  function toParam(pt) {
    if (!pt || pt.infinite) return 0;
    if (curve.kind === "cusp") {
      if (Math.abs(pt.y) < EPS) return Infinity;
      return pt.x / pt.y;
    }
    if (curve.kind === "node") {
      if (Math.abs(pt.x) < 1e-10) return pt.y >= 0 ? 1 : -1;
      return pt.y / pt.x;
    }
    return pt.x;
  }

  function finish(pt) {
    pt.infinite = false;
    pt.t = toParam(pt);
    return pt;
  }

  function nearestValidX(x0) {
    let bestX = x0;
    let best = Infinity;
    for (let i = 0; i <= 500; i++) {
      const x = x0 - 4 + (8 * i) / 500;
      const val = cubicF(x);
      if (val >= -1e-12) {
        const d = Math.abs(x - x0);
        if (d < best) {
          best = d;
          bestX = x;
        }
      }
    }
    return bestX;
  }

  function fromParam(u, sign = 1) {
    if (!Number.isFinite(u)) return null;
    if (curve.kind === "cusp") {
      if (Math.abs(u) < 1e-12) return O();
      if (Math.abs(u) > T_CUSP) return null;
      return { infinite: false, t: u, x: 1 / (u * u), y: 1 / (u * u * u) };
    }
    if (curve.kind === "node") {
      if (Math.abs(Math.abs(u) - 1) < 1e-3) return null;
      const x = u * u - 1;
      return finish({ x, y: u * x });
    }
    let x = u;
    let val = cubicF(x);
    if (val < 0) {
      x = nearestValidX(u);
      val = cubicF(x);
      if (val < 0) return null;
    }
    const y = (sign >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, val));
    return finish({ x, y });
  }

  function pointFromSpec(spec) {
    if (spec.t != null) return fromParam(spec.t, spec.t >= 0 ? 1 : -1);
    return finish({ x: spec.x, y: spec.y });
  }

  function neg(P) {
    if (!P || P.infinite) return O();
    return finish({ x: P.x, y: -P.y });
  }

  function fromT(t) {
    return fromParam(t, t >= 0 ? 1 : -1);
  }

  function tOf(pt) {
    return toParam(pt);
  }

  function nearestOnCurve(mx, my) {
    if (curve.kind === "cusp") {
      const sMax = Math.max(2.4, Math.sqrt(Math.abs(mx) + 1) * 1.8, Math.cbrt(Math.abs(my) + 1) * 1.8);
      let bestS = 1;
      let bestD = Infinity;
      const n = 720;
      for (let i = 0; i <= n; i++) {
        const s = -sMax + (2 * sMax * i) / n;
        if (Math.abs(s) < 1e-4) continue;
        const x = s * s;
        const y = s * s * s;
        const d = (x - mx) ** 2 + (y - my) ** 2;
        if (d < bestD) {
          bestD = d;
          bestS = s;
        }
      }
      let s = bestS;
      for (let k = 0; k < 10; k++) {
        const s2 = s * s;
        const s3 = s2 * s;
        const fp = 4 * s * (s2 - mx) + 6 * s2 * (s3 - my);
        const fpp = 12 * s2 - 4 * mx + 30 * s2 * s2 - 12 * s * my;
        if (Math.abs(fpp) < 1e-12) break;
        const nxt = s - fp / fpp;
        if (!Number.isFinite(nxt)) break;
        s = nxt;
      }
      if (Math.abs(s) < 1e-4) return null;
      const pt = { infinite: false, x: s * s, y: s * s * s, t: 1 / s };
      if (Math.abs(pt.t) > T_CUSP) return null;
      return pt;
    }

    const v = viewRect({ w: curveCv.getBoundingClientRect().width, h: curveCv.getBoundingClientRect().height });
    const x0 = Math.min(mx - 6, v.x0 - 1);
    const x1 = Math.max(mx + 6, v.x1 + 1);
    let best = null;
    let bestD = Infinity;
    const n = 900;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const val = cubicF(x);
      if (val < 0) continue;
      const sy = Math.sqrt(val);
      for (const y of [sy, -sy]) {
        const d = (x - mx) ** 2 + (y - my) ** 2;
        if (d < bestD) {
          bestD = d;
          best = { x, y };
        }
      }
    }
    if (!best) return null;
    const pt = finish(best);
    if (isSing(pt)) return null;
    return pt;
  }

  function addGeometry(P, Q) {
    if (!P || !Q) return null;
    if (P.infinite) return { kind: "copy", R: Q, Rprime: O(), lambda: null };
    if (Q.infinite) return { kind: "copy", R: P, Rprime: O(), lambda: null };

    const sameX = Math.abs(P.x - Q.x) < 1e-8;
    const sameY = Math.abs(P.y - Q.y) < 1e-8;
    const oppY = Math.abs(P.y + Q.y) < 1e-8;

    if (sameX && oppY && !sameY) {
      return { kind: "infinity", lambda: Infinity, Rprime: O(), R: O(), doubling: false };
    }
    if (sameX && sameY && Math.abs(P.y) < 1e-8) {
      return { kind: "infinity", lambda: Infinity, Rprime: O(), R: O(), doubling: true };
    }

    const doubling = sameX && sameY;
    const lambda = doubling ? cubicFp(P.x) / (2 * P.y) : (Q.y - P.y) / (Q.x - P.x);
    if (!Number.isFinite(lambda)) {
      return { kind: "infinity", lambda: Infinity, Rprime: O(), R: O(), doubling };
    }
    const x3 = lambda * lambda - curve.A - P.x - Q.x;
    const yPrime = P.y + lambda * (x3 - P.x);
    const Rprime = finish({ x: x3, y: yPrime });
    const R = finish({ x: x3, y: -yPrime });
    return { kind: "finite", lambda, Rprime, R, doubling };
  }

  function sizeCanvas(cv) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    return { w: rect.width, h: rect.height, dpr };
  }

  function toScreen(x, y) {
    return { x: cam.ox + x * cam.scale, y: cam.oy - y * cam.scale };
  }
  function toWorld(sx, sy) {
    return { x: (sx - cam.ox) / cam.scale, y: (cam.oy - sy) / cam.scale };
  }

  function isNear(p) {
    if (!p || p.infinite) return false;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
    if (curve.kind === "cusp" && Number.isFinite(p.t) && Math.abs(p.t) < FIT_MIN_T) return false;
    const vx = Math.max(FIT_MAX_X, Math.abs(curve.view.x1) + 1);
    const vy = Math.max(FIT_MAX_Y, Math.abs(curve.view.y1) + 1);
    return Math.abs(p.x) <= vx && Math.abs(p.y) <= vy;
  }

  function onScreen(pt, dim, pad = 64) {
    if (!pt || pt.infinite || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return false;
    const s = toScreen(pt.x, pt.y);
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return false;
    if (Math.abs(s.x) > SCREEN_LIM || Math.abs(s.y) > SCREEN_LIM) return false;
    return s.x >= -pad && s.x <= dim.w + pad && s.y >= -pad && s.y <= dim.h + pad;
  }

  function viewRect(dim) {
    const a = toWorld(0, 0);
    const b = toWorld(dim.w, dim.h);
    return {
      x0: Math.min(a.x, b.x),
      x1: Math.max(a.x, b.x),
      y0: Math.min(a.y, b.y),
      y1: Math.max(a.y, b.y),
    };
  }

  function clipLine(x0, y0, x1, y1, r) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t0 = 0;
    let t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x0 - r.x0, r.x1 - x0, y0 - r.y0, r.y1 - y0];
    for (let i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-14) {
        if (q[i] < 0) return null;
        continue;
      }
      const t = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return null;
    }
    return {
      a: { x: x0 + t0 * dx, y: y0 + t0 * dy },
      b: { x: x0 + t1 * dx, y: y0 + t1 * dy },
    };
  }

  function chordInView(px, py, lambda, dim) {
    const v = viewRect(dim);
    const padX = v.x1 - v.x0;
    const padY = v.y1 - v.y0;
    if (!Number.isFinite(lambda) || Math.abs(lambda) > 1e6) {
      return clipLine(px, v.y0 - padY, px, v.y1 + padY, v);
    }
    const xA = v.x0 - padX;
    const xB = v.x1 + padX;
    return clipLine(xA, py + lambda * (xA - px), xB, py + lambda * (xB - px), v);
  }

  function resetCamera(dim) {
    if (camTween) camTween.kill();
    const { x0, x1, y0, y1 } = curve.view;
    cam.scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.min(dim.w / (x1 - x0), dim.h / (y1 - y0)) * 0.92));
    cam.ox = dim.w / 2 - ((x0 + x1) / 2) * cam.scale;
    cam.oy = dim.h / 2 + ((y0 + y1) / 2) * cam.scale;
  }

  function setCamera(targetScale, tox, toy) {
    targetScale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, targetScale));
    if (camTween) camTween.kill();
    if (window.gsap && vis.animate && !reduceMotion) {
      camTween = gsap.to(cam, {
        scale: targetScale,
        ox: tox,
        oy: toy,
        duration: 0.4,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: draw,
      });
    } else {
      cam.scale = targetScale;
      cam.ox = tox;
      cam.oy = toy;
    }
  }

  function fitPoints(points, dim) {
    const pts = points.filter(isNear);
    if (!pts.length) return;
    let minX = 0;
    let maxX = 1.2;
    let minY = -1.2;
    let maxY = 1.2;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    minX -= Math.max(0.55, spanX * 0.28);
    maxX += Math.max(0.55, spanX * 0.28);
    minY -= Math.max(0.7, spanY * 0.32);
    maxY += Math.max(0.7, spanY * 0.32);
    if (maxY - minY < 2.6) {
      const mid = (minY + maxY) / 2;
      minY = mid - 1.3;
      maxY = mid + 1.3;
    }
    if (maxX - minX < 2.4) {
      const mid = (minX + maxX) / 2;
      minX = mid - 1.2;
      maxX = mid + 1.2;
    }
    if (maxX - minX > MAX_SPAN_X) {
      const mid = (minX + maxX) / 2;
      minX = mid - MAX_SPAN_X / 2;
      maxX = mid + MAX_SPAN_X / 2;
    }
    if (maxY - minY > MAX_SPAN_Y) {
      const mid = (minY + maxY) / 2;
      minY = mid - MAX_SPAN_Y / 2;
      maxY = mid + MAX_SPAN_Y / 2;
    }
    const targetScale = Math.min(dim.w / (maxX - minX), dim.h / (maxY - minY)) * 0.88;
    const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, targetScale));
    setCamera(clamped, dim.w / 2 - ((minX + maxX) / 2) * clamped, dim.h / 2 + ((minY + maxY) / 2) * clamped);
  }

  function arrow(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(a - 0.4), y2 - 7 * Math.sin(a - 0.4));
    ctx.lineTo(x2 - 7 * Math.cos(a + 0.4), y2 - 7 * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  function drawAxes(dim) {
    const o = toScreen(0, 0);
    const step = vis.gridStep || 1;
    const xStart = Math.floor((-cam.ox) / cam.scale / step) * step - step;
    const xEnd = Math.ceil((dim.w - cam.ox) / cam.scale / step) * step + step;
    const yStart = Math.floor((cam.oy - dim.h) / cam.scale / step) * step - step;
    const yEnd = Math.ceil(cam.oy / cam.scale / step) * step + step;

    if (vis.grid) {
      ctx.strokeStyle = COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = xStart; x <= xEnd + 1e-9; x += step) {
        const s = toScreen(x, 0);
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x, dim.h);
      }
      for (let y = yStart; y <= yEnd + 1e-9; y += step) {
        const s = toScreen(0, y);
        ctx.moveTo(0, s.y);
        ctx.lineTo(dim.w, s.y);
      }
      ctx.stroke();
    }

    if (vis.axes) {
      arrow(12, o.y, dim.w - 12, o.y, COL.axis, 1.4);
      arrow(o.x, dim.h - 12, o.x, 12, COL.axis, 1.4);
    }

    if (vis.ticks || vis.axisLabels) {
      ctx.fillStyle = COL.axis;
      ctx.font = "11px IBM Plex Mono, ui-monospace, monospace";
    }
    if (vis.ticks) {
      for (let x = xStart; x <= xEnd + 1e-9; x += step) {
        if (Math.abs(x) < 1e-9) continue;
        const s = toScreen(x, 0);
        ctx.fillRect(s.x - 0.5, o.y - 4, 1, 8);
        if (vis.axisLabels) ctx.fillText(fmt(x, 2), s.x - 4, o.y + 14);
      }
      for (let y = yStart; y <= yEnd + 1e-9; y += step) {
        if (Math.abs(y) < 1e-9) continue;
        const s = toScreen(0, y);
        ctx.fillRect(o.x - 4, s.y - 0.5, 8, 1);
        if (vis.axisLabels) ctx.fillText(fmt(y, 2), o.x + 7, s.y + 3);
      }
    }
    if (vis.axisLabels) {
      ctx.fillStyle = COL.axis;
      ctx.fillText("x", dim.w - 22, o.y - 8);
      ctx.fillText("y", o.x + 8, 16);
    }
  }

  function traceCusp(sMax) {
    ctx.beginPath();
    let first = true;
    const n = 900;
    for (let i = 0; i <= n; i++) {
      const s = -sMax + (2 * sMax * i) / n;
      const p = toScreen(s * s, s * s * s);
      if (first) {
        ctx.moveTo(p.x, p.y);
        first = false;
      } else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function traceWeierstrass(dim) {
    const v = viewRect(dim);
    const pad = (v.x1 - v.x0) * 0.08;
    const x0 = v.x0 - pad;
    const x1 = v.x1 + pad;
    const n = 1100;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const sign of [1, -1]) {
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const val = cubicF(x);
        if (val < 0) {
          pen = false;
          continue;
        }
        const p = toScreen(x, sign * Math.sqrt(val));
        if (!pen) {
          ctx.moveTo(p.x, p.y);
          pen = true;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  function drawCurve(dim) {
    if (vis.curve) {
      ctx.strokeStyle = COL.curve;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (curve.kind === "cusp") {
        const yTop = cam.oy / cam.scale + 1;
        const yBot = (cam.oy - dim.h) / cam.scale - 1;
        const sMax = Math.max(Math.cbrt(Math.abs(yTop)), Math.cbrt(Math.abs(yBot)), Math.sqrt((dim.w - cam.ox) / cam.scale + 1), 2.5) + 0.4;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = vis.curveWidth * 3.2;
        traceCusp(sMax);
        ctx.globalAlpha = 1;
        ctx.lineWidth = vis.curveWidth;
        traceCusp(sMax);
      } else {
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = vis.curveWidth * 3.2;
        traceWeierstrass(dim);
        ctx.globalAlpha = 1;
        ctx.lineWidth = vis.curveWidth;
        traceWeierstrass(dim);
      }
    }
    if (vis.cusp && curve.sing.length) {
      ctx.fillStyle = COL.curve;
      for (const s of curve.sing) {
        const o = toScreen(s.x, s.y);
        ctx.beginPath();
        ctx.arc(o.x, o.y, Math.max(3, vis.pointR * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function caption(pt, name) {
    if (!pt) return "";
    const parts = [];
    if (vis.names && name) parts.push(name);
    if (vis.coords && !pt.infinite) parts.push(`(${fmt(pt.x)}, ${fmt(pt.y)})`);
    if (vis.t && !pt.infinite) parts.push(fmt(pt.t));
    return parts.join("  ");
  }

  function drawPoint(pt, color, name, filled = true, side = "right", dim) {
    if (!dim) {
      const r = curveCv.getBoundingClientRect();
      dim = { w: r.width, h: r.height };
    }
    if (!onScreen(pt, dim)) return;
    const s = toScreen(pt.x, pt.y);
    ctx.save();
    if (vis.glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.fillStyle = filled ? color : COL.paper;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.arc(s.x, s.y, vis.pointR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const text = caption(pt, name);
    if (text) {
      ctx.fillStyle = color;
      ctx.font = "12px IBM Plex Mono, Noto Sans SC, sans-serif";
      ctx.textAlign = side === "left" ? "right" : "left";
      ctx.fillText(text, s.x + (side === "left" ? -10 : 10), s.y - 8);
      ctx.textAlign = "left";
    }
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function drawConstruction(dim, cons, fade) {
    if (!cons || !state.P || !state.Q) return;
    const a = fade || anim;
    const P = state.P;
    const Q = state.Q;

    if (cons.kind === "infinity") {
      if (!vis.chord || a.line <= 0) return;
      const seg = chordInView(P.x, P.y, Infinity, dim);
      if (!seg) return;
      const s1 = toScreen(seg.a.x, seg.a.y);
      const s2 = toScreen(seg.b.x, seg.b.y);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a.line);
      ctx.strokeStyle = COL.chord;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = vis.lineWidth;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(lerp(s1.x, s2.x, a.line), lerp(s1.y, s2.y, a.line));
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (vis.chord && a.line > 0) {
      const seg = chordInView(P.x, P.y, cons.lambda, dim);
      if (seg) {
        const p1 = toScreen(seg.a.x, seg.a.y);
        const p2 = toScreen(seg.b.x, seg.b.y);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = COL.chord;
        ctx.lineWidth = vis.lineWidth;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(lerp(p1.x, p2.x, a.line), lerp(p1.y, p2.y, a.line));
        ctx.stroke();
        ctx.restore();
      }
    }

    if (vis.third && cons.Rprime && a.third > 0) {
      ctx.save();
      ctx.globalAlpha = a.third;
      drawPoint(cons.Rprime, COL.rp, "R′", false, "left", dim);
      ctx.restore();
    }

    if (vis.reflect && cons.Rprime && cons.R && a.reflect > 0) {
      const v = viewRect(dim);
      const x = cons.Rprime.x;
      if (Number.isFinite(x) && x >= v.x0 - 1e-6 && x <= v.x1 + 1e-6) {
        const yA = Number.isFinite(cons.Rprime.y) ? cons.Rprime.y : v.y1;
        const yB = Number.isFinite(cons.R.y) ? cons.R.y : v.y0;
        const seg = clipLine(x, yA, x, yB, {
          x0: v.x0 - 1,
          x1: v.x1 + 1,
          y0: v.y0,
          y1: v.y1,
        }) || { a: { x, y: v.y1 }, b: { x, y: v.y0 } };
        const a1 = toScreen(seg.a.x, seg.a.y);
        const a2 = toScreen(seg.b.x, seg.b.y);
        ctx.save();
        ctx.globalAlpha = Math.min(1, a.reflect * 1.2);
        ctx.strokeStyle = COL.rp;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = vis.lineWidth * 0.9;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const my = lerp(a1.y, a2.y, a.reflect);
        if (my >= -20 && my <= dim.h + 20) {
          ctx.fillStyle = COL.sum;
          ctx.beginPath();
          ctx.arc(a1.x, my, Math.max(3, vis.pointR * 0.55), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (vis.sum && cons.R && a.sum > 0) {
      ctx.save();
      ctx.globalAlpha = a.sum;
      drawPoint(cons.R, COL.sum, "P+Q", true, "right", dim);
      ctx.restore();
    }
  }

  function draw() {
    const dim = sizeCanvas(curveCv);
    ctx.setTransform(dim.dpr, 0, 0, dim.dpr, 0, 0);
    ctx.clearRect(0, 0, dim.w, dim.h);
    ctx.fillStyle = COL.paper;
    ctx.fillRect(0, 0, dim.w, dim.h);
    drawAxes(dim);
    drawCurve(dim);

    const cons = state.result || (vis.preview ? state.preview : null);
    if (cons) {
      const fade = state.result ? anim : { line: 1, third: 1, reflect: 1, sum: 1 };
      drawConstruction(dim, cons, fade);
    }

    if (vis.hover && state.hover && !state.drag) {
      drawPoint(state.hover, COL.ink, "", false, "right", dim);
    }
    drawPoint(state.P, COL.p, "P", true, "right", dim);
    drawPoint(state.Q, COL.q, "Q", true, "right", dim);
  }

  function syncInputs() {
    const sl = curve.slider;
    const clamp = (t) => Math.max(sl.min, Math.min(sl.max, t));
    if (state.P && !state.P.infinite && document.activeElement !== $("p-t")) {
      $("p-t").value = fmt(state.P.t, 4);
      if (Number.isFinite(state.P.t)) $("p-range").value = String(clamp(state.P.t));
    }
    if (state.Q && !state.Q.infinite && document.activeElement !== $("q-t")) {
      $("q-t").value = fmt(state.Q.t, 4);
      if (Number.isFinite(state.Q.t)) $("q-range").value = String(clamp(state.Q.t));
    }
  }

  function playAnim() {
    if (tl) tl.kill();
    Object.assign(anim, { line: 0, third: 0, reflect: 0, sum: 0 });
    const cons = state.result;
    if (!cons) return;
    if (!vis.animate || reduceMotion || !window.gsap) {
      Object.assign(anim, { line: 1, third: 1, reflect: 1, sum: 1 });
      draw();
      return;
    }
    const dur = cons.kind === "infinity" ? 0.4 : 0.5;
    tl = gsap.timeline({ onUpdate: draw });
    tl.to(anim, { line: 1, duration: dur, ease: "power2.inOut" });
    if (cons.kind !== "infinity") {
      tl.to(anim, { third: 1, duration: 0.3, ease: "power2.out" });
      tl.to(anim, { reflect: 1, duration: 0.55, ease: "power2.inOut" });
      tl.to(anim, { sum: 1, duration: 0.3, ease: "power2.out" });
    } else {
      tl.to(anim, { sum: 1, duration: 0.3 });
    }
  }

  function compute(play) {
    state.preview = null;
    if (!state.P || !state.Q) {
      state.result = null;
      syncInputs();
      draw();
      return;
    }
    const cons = addGeometry(state.P, state.Q);
    state.result = cons;
    if (vis.autofit) {
      const dim = { w: curveCv.getBoundingClientRect().width, h: curveCv.getBoundingClientRect().height };
      const pts = [state.P, state.Q];
      if (cons && isNear(cons.Rprime)) pts.push(cons.Rprime);
      if (cons && isNear(cons.R)) pts.push(cons.R);
      fitPoints(pts, dim);
    }
    syncInputs();
    if (play !== false) playAnim();
    else {
      Object.assign(anim, { line: 1, third: 1, reflect: 1, sum: 1 });
      draw();
    }
  }

  function placePoint(pt, who) {
    if (!pt) return;
    if (who === "P") {
      state.P = pt;
      if (state.Q) compute(true);
      else {
        state.result = null;
        syncInputs();
        draw();
      }
      return;
    }
    state.Q = pt;
    compute(true);
  }

  function nextSlot() {
    if (!state.P) return "P";
    if (!state.Q) return "Q";
    return "new";
  }

  function hit(pt, sx, sy) {
    if (!pt || pt.infinite) return false;
    const s = toScreen(pt.x, pt.y);
    return Math.hypot(s.x - sx, s.y - sy) < Math.max(12, vis.pointR + 6);
  }

  function localPos(ev) {
    const r = curveCv.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function pickFromEvent(ev) {
    const p = localPos(ev);
    const w = toWorld(p.x, p.y);
    if (vis.snap) return nearestOnCurve(w.x, w.y);
    const val = cubicF(w.x);
    if (val >= 0) {
      const pt = finish({ x: w.x, y: Math.sign(w.y || 1) * Math.sqrt(val) });
      if (!isSing(pt)) return pt;
    }
    return nearestOnCurve(w.x, w.y);
  }

  curveCv.addEventListener("pointermove", (ev) => {
    const p = localPos(ev);
    if (state.pan) {
      cam.ox += ev.clientX - state.pan.x;
      cam.oy += ev.clientY - state.pan.y;
      state.pan = { x: ev.clientX, y: ev.clientY };
      draw();
      return;
    }
    if (state.drag) {
      const pt = pickFromEvent(ev);
      if (pt) {
        state[state.drag] = pt;
        if (state.P && state.Q) {
          state.result = addGeometry(state.P, state.Q);
          Object.assign(anim, { line: 1, third: 1, reflect: 1, sum: 1 });
        }
        syncInputs();
        draw();
      }
      return;
    }
    const pt = pickFromEvent(ev);
    state.hover = pt;
    state.preview = vis.preview && state.P && !state.Q && pt ? addGeometry(state.P, pt) : null;
    draw();
  });

  curveCv.addEventListener("pointerdown", (ev) => {
    const p = localPos(ev);
    if (ev.button === 2 || ev.button === 1) {
      state.pan = { x: ev.clientX, y: ev.clientY };
      curveCv.setPointerCapture(ev.pointerId);
      return;
    }
    if (ev.button !== 0) return;
    if (hit(state.P, p.x, p.y)) {
      state.drag = "P";
      curveCv.setPointerCapture(ev.pointerId);
      return;
    }
    if (hit(state.Q, p.x, p.y)) {
      state.drag = "Q";
      curveCv.setPointerCapture(ev.pointerId);
      return;
    }
    const pt = pickFromEvent(ev);
    const slot = nextSlot();
    if (slot === "new") {
      if (!pt) return;
      state.Q = null;
      state.result = null;
      state.P = pt;
      $("q-t").value = "";
      syncInputs();
      draw();
      return;
    }
    placePoint(pt, slot);
  });

  curveCv.addEventListener("pointerup", () => {
    const wasDrag = state.drag;
    state.drag = null;
    state.pan = null;
    if (wasDrag && state.P && state.Q) compute(false);
  });
  curveCv.addEventListener("pointerleave", () => {
    if (!state.drag && !state.pan) {
      state.hover = null;
      if (!state.Q) state.preview = null;
      draw();
    }
  });
  curveCv.addEventListener("contextmenu", (e) => e.preventDefault());
  curveCv.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const p = localPos(ev);
    const w = toWorld(p.x, p.y);
    cam.scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, cam.scale * (ev.deltaY > 0 ? 0.9 : 1.12)));
    cam.ox = p.x - w.x * cam.scale;
    cam.oy = p.y + w.y * cam.scale;
    draw();
  }, { passive: false });

  function applyT(who, raw, play) {
    const u = Number(raw);
    if (!Number.isFinite(u)) return;
    const cur = who === "P" ? state.P : state.Q;
    const sign = cur && !cur.infinite && cur.y < 0 ? -1 : 1;
    const pt = fromParam(u, sign);
    if (!pt || (pt.infinite && curve.kind !== "cusp")) return;
    if (who === "P") state.P = pt;
    else state.Q = pt;
    if (state.P && state.Q) compute(play !== false);
    else {
      syncInputs();
      draw();
    }
  }

  function updateParamUI() {
    $("p-param-name").innerHTML = `${curve.param}<sub>P</sub>`;
    $("q-param-name").innerHTML = `${curve.param}<sub>Q</sub>`;
    const sl = curve.slider;
    for (const id of ["p-range", "q-range"]) {
      const el = $(id);
      el.min = sl.min;
      el.max = sl.max;
      el.step = sl.step;
    }
    document.title = curve.eq;
  }

  function switchCurve(id) {
    if (!CURVES[id]) return;
    if (tl) tl.kill();
    curve = CURVES[id];
    state.P = state.Q = state.result = state.preview = state.hover = null;
    $("p-t").value = "";
    $("q-t").value = "";
    Object.assign(anim, { line: 0, third: 0, reflect: 0, sum: 0 });
    updateParamUI();
    resetCamera(sizeCanvas(curveCv));
    draw();
  }

  $("p-t").addEventListener("change", (e) => applyT("P", e.target.value));
  $("q-t").addEventListener("change", (e) => applyT("Q", e.target.value));
  $("p-range").addEventListener("input", (e) => applyT("P", e.target.value, false));
  $("q-range").addEventListener("input", (e) => applyT("Q", e.target.value, false));

  $("btn-reset").addEventListener("click", () => {
    if (tl) tl.kill();
    state.P = state.Q = state.result = state.preview = state.hover = null;
    $("p-t").value = "";
    $("q-t").value = "";
    Object.assign(anim, { line: 0, third: 0, reflect: 0, sum: 0 });
    resetCamera(sizeCanvas(curveCv));
    draw();
  });
  $("btn-demo").addEventListener("click", () => {
    state.P = pointFromSpec(curve.demo[0]);
    state.Q = pointFromSpec(curve.demo[1]);
    compute(true);
  });
  $("btn-inv").addEventListener("click", () => {
    if (!state.P) state.P = pointFromSpec(curve.demo[0]);
    state.Q = neg(state.P);
    compute(true);
  });
  $("btn-double").addEventListener("click", () => {
    if (!state.P) state.P = pointFromSpec(curve.demo[0]);
    state.Q = { ...state.P };
    compute(true);
  });
  $("btn-replay").addEventListener("click", () => {
    if (state.result) playAnim();
  });
  $("btn-fit").addEventListener("click", () => {
    const dim = { w: curveCv.getBoundingClientRect().width, h: curveCv.getBoundingClientRect().height };
    if (state.P && state.Q && state.result) {
      const pts = [state.P, state.Q];
      if (isNear(state.result.Rprime)) pts.push(state.result.Rprime);
      if (isNear(state.result.R)) pts.push(state.result.R);
      fitPoints(pts, dim);
    } else resetCamera(sizeCanvas(curveCv));
    draw();
  });

  $("curve-select").addEventListener("change", (e) => switchCurve(e.target.value));

  document.querySelectorAll("[data-vis]").forEach((el) => {
    const key = el.dataset.vis;
    el.addEventListener("change", () => {
      vis[key] = el.checked;
      draw();
    });
  });
  document.querySelectorAll("[data-col]").forEach((el) => {
    el.addEventListener("input", () => {
      COL[el.dataset.col] = el.value;
      if (el.dataset.col === "paper") curveCv.style.background = el.value;
      draw();
    });
  });
  $("curve-w").addEventListener("input", (e) => { vis.curveWidth = Number(e.target.value); draw(); });
  $("line-w").addEventListener("input", (e) => { vis.lineWidth = Number(e.target.value); draw(); });
  $("point-r").addEventListener("input", (e) => { vis.pointR = Number(e.target.value); draw(); });
  $("grid-step").addEventListener("input", (e) => { vis.gridStep = Number(e.target.value); draw(); });

  function init() {
    updateParamUI();
    resetCamera(sizeCanvas(curveCv));
    draw();
  }
  window.addEventListener("resize", () => draw());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else init();
})();
