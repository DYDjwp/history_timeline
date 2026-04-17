/**
 * Recursive sakura tree from test/tree.html — embedded in 1968 marriage slide.
 */
(function initMarriageSakuraTree() {
  const canvas = document.getElementById("marriageSakuraCanvas");
  const host = canvas?.closest(".marriage-visual");
  const slide = host?.closest(".slide.marriage-1968");

  if (!canvas || !host || !slide || !canvas.getContext) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let petals = [];
  let staticLayer = null;
  let rafId = 0;
  let running = false;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function drawBackground() {
    /* 暖色系：与 marriage-1968 幻灯片（玫紫 → 杏桃）一致 */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7a4a5c");
    sky.addColorStop(0.28, "#9b6278");
    sky.addColorStop(0.52, "#c9958e");
    sky.addColorStop(0.78, "#e8bfa8");
    sky.addColorStop(1, "#f4dcc8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const moonX = W * 0.82;
    const moonY = H * 0.18;
    const moonR = Math.min(W, H) * 0.06;

    const glow = ctx.createRadialGradient(
      moonX,
      moonY,
      moonR * 0.2,
      moonX,
      moonY,
      moonR * 2.8
    );
    glow.addColorStop(0, "rgba(255, 236, 210, 0.92)");
    glow.addColorStop(0.35, "rgba(255, 210, 170, 0.38)");
    glow.addColorStop(1, "rgba(255, 200, 160, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 248, 230, 0.96)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(255, 245, 220, ${rand(0.4, 0.95)})`;
      ctx.beginPath();
      ctx.arc(rand(0, W), rand(0, H * 0.45), rand(0.5, 1.8), 0, Math.PI * 2);
      ctx.fill();
    }

    const ground = ctx.createLinearGradient(0, H * 0.78, 0, H);
    ground.addColorStop(0, "#deb892");
    ground.addColorStop(0.5, "#cfa07a");
    ground.addColorStop(1, "#b88968");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.82);
    ctx.quadraticCurveTo(W * 0.25, H * 0.74, W * 0.5, H * 0.82);
    ctx.quadraticCurveTo(W * 0.75, H * 0.9, W, H * 0.8);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawPetal(x, y, size, angle, color = "rgba(255,182,193,0.9)") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * 0.9, -size * 0.8, size * 1.4, size * 0.2, 0, size * 1.5);
    ctx.bezierCurveTo(-size * 1.4, size * 0.2, -size * 0.9, -size * 0.8, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function blossomCluster(x, y, amount) {
    for (let i = 0; i < amount; i++) {
      const px = x + rand(-16, 16);
      const py = y + rand(-16, 16);
      const s = rand(4, 8);
      const a = rand(0, Math.PI * 2);
      const pinks = [
        "rgba(255,183,197,0.95)",
        "rgba(255,192,203,0.92)",
        "rgba(255,170,190,0.9)",
        "rgba(255,220,228,0.95)",
      ];
      drawPetal(px, py, s, a, pinks[Math.floor(Math.random() * pinks.length)]);

      if (Math.random() < 0.2) {
        ctx.fillStyle = "rgba(255,230,120,0.9)";
        ctx.beginPath();
        ctx.arc(px + rand(-1, 1), py + rand(-1, 1), rand(1, 2.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function branch(x, y, len, angle, width, depth) {
    if (depth <= 0 || len < 10) {
      blossomCluster(x, y, 10 + (Math.random() * 8));
      return;
    }

    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;

    ctx.strokeStyle = `rgb(${80 + depth * 7}, ${45 + depth * 4}, ${35 + depth * 3})`;
    ctx.lineWidth = width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x, y);

    const cx = x + Math.cos(angle - rand(0.15, 0.25)) * len * 0.5 + rand(-8, 8);
    const cy = y + Math.sin(angle - rand(0.15, 0.25)) * len * 0.5 + rand(-8, 8);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();

    if (depth < 3) {
      blossomCluster(x2, y2, 8 + (Math.random() * 6));
    }

    const n = 2 + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const newLen = len * rand(0.68, 0.8);
      const newWidth = width * rand(0.65, 0.78);
      const delta =
        i === 0
          ? rand(-0.95, -0.35)
          : i === 1
            ? rand(0.35, 0.95)
            : rand(-0.2, 0.2);

      branch(x2, y2, newLen, angle + delta, Math.max(newWidth, 1), depth - 1);
    }
  }

  function createFallingPetals() {
    petals = [];
    for (let i = 0; i < 90; i++) {
      petals.push({
        x: rand(0, W),
        y: rand(-H, H),
        size: rand(4, 8),
        vx: rand(-0.4, 0.4),
        vy: rand(0.6, 1.6),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.02, 0.02),
        swing: rand(0, Math.PI * 2),
      });
    }
  }

  function drawTree() {
    const baseX = W * 0.5;
    const baseY = H * 0.86;

    branch(baseX, baseY, H * 0.16, -Math.PI / 2, 12, 8);
    branch(baseX, baseY, H * 0.11, -Math.PI / 2 - 0.55, 8, 6);
    branch(baseX, baseY, H * 0.1, -Math.PI / 2 + 0.5, 8, 6);

    for (let i = 0; i < 160; i++) {
      drawPetal(
        rand(0, W),
        rand(H * 0.8, H * 0.97),
        rand(3, 6),
        rand(0, Math.PI * 2),
        `rgba(255,${170 + (Math.random() * 40)},${190 + (Math.random() * 30)},0.8)`
      );
    }
  }

  function generateScene() {
    if (W < 2 || H < 2) return;
    drawBackground();
    drawTree();
    createFallingPetals();
    staticLayer = ctx.getImageData(0, 0, W, H);
  }

  function animate() {
    if (!running) return;

    if (staticLayer) {
      ctx.putImageData(staticLayer, 0, 0);
    }

    for (const p of petals) {
      p.swing += 0.02;
      p.x += p.vx + Math.sin(p.swing) * 0.35;
      p.y += p.vy;
      p.rot += p.vr;

      if (p.y > H + 20 || p.x < -30 || p.x > W + 30) {
        p.x = rand(0, W);
        p.y = rand(-80, -20);
        p.size = rand(4, 8);
      }

      drawPetal(
        p.x,
        p.y,
        p.size,
        p.rot,
        `rgba(255,${175 + (Math.random() * 25)},${195 + (Math.random() * 25)},0.78)`
      );
    }

    rafId = requestAnimationFrame(animate);
  }

  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(2, Math.floor(r.width));
    H = Math.max(2, Math.floor(r.height));
    canvas.width = W;
    canvas.height = H;
    generateScene();
  }

  function startLoop() {
    if (running) return;
    running = true;
    resize();
    if (reduceMotion) {
      return;
    }
    cancelAnimationFrame(rafId);
    animate();
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function syncSlideActive() {
    if (slide.classList.contains("is-active")) {
      startLoop();
    } else {
      stopLoop();
    }
  }

  const ro = new ResizeObserver(() => {
    if (running) resize();
  });
  ro.observe(host);

  const slideObserver = new MutationObserver(syncSlideActive);
  slideObserver.observe(slide, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("resize", () => {
    if (running) resize();
  });

  syncSlideActive();
})();
