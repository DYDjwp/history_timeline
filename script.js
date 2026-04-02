const slides = Array.from(document.querySelectorAll(".slide"));
const dotsWrap = document.getElementById("dots");
const timeline = document.getElementById("timeline");

let current = 0;
let isAnimating = false;

let startX = 0;
let startY = 0;
let deltaX = 0;
let deltaY = 0;
let pointerActive = false;

let wheelLocked = false;

/* ---------- typewriter ---------- */
let typingTimer = null;
const reduceMotion = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

function startTypewriterForSlide(slideIndex) {
  const slide = slides[slideIndex];
  if (!slide) return;

  const typeEl = slide.querySelector(".typewriter-top");
  if (!typeEl) return;

  const text = typeEl.getAttribute("data-type-text") || "";
  const textSpan = typeEl.querySelector(".typewriter-text");
  if (!textSpan) return;

  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }

  textSpan.textContent = "";

  const caret = typeEl.querySelector(".typewriter-caret");
  if (caret) caret.style.visibility = "visible";

  if (reduceMotion) {
    textSpan.textContent = text;
    return;
  }

  let i = 0;
  // 打字速度（单位：毫秒/字符）
  // baseDelay 越大越慢；标点额外延迟用于模拟停顿。
  const baseDelay = 34;
  const punctExtraDelay = 120;

  const tick = () => {
    textSpan.textContent = text.slice(0, i + 1);
    i += 1;

    if (i >= text.length) return;

    const nextChar = text[i] || "";
    const isPunct = /[.,;:!?]/.test(nextChar);
    const jitter = Math.random() * 10;
    const delay = baseDelay + (isPunct ? punctExtraDelay : 0) + jitter;

    typingTimer = setTimeout(tick, delay);
  };

  typingTimer = setTimeout(tick, baseDelay);
}

/* ---------- dots ---------- */
function buildDots() {
  slides.forEach((_, index) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    if (index === 0) dot.classList.add("active");
    dotsWrap.appendChild(dot);
  });
}

function updateDots() {
  Array.from(dotsWrap.children).forEach((dot, index) => {
    dot.classList.toggle("active", index === current);
  });
}

/* ---------- slide switching (vertical) ---------- */
function cleanupSlideClasses(slide) {
  slide.classList.remove(
    "enter-from-bottom",
    "enter-from-top",
    "exit-to-top",
    "exit-to-bottom"
  );
}

function showSlide(nextIndex, direction = 1) {
  if (isAnimating || nextIndex === current) return;
  if (nextIndex < 0 || nextIndex >= slides.length) return;

  isAnimating = true;

  const currentSlide = slides[current];
  const nextSlide = slides[nextIndex];

  cleanupSlideClasses(currentSlide);
  cleanupSlideClasses(nextSlide);

  nextSlide.classList.add("is-active");
  nextSlide.classList.add(direction > 0 ? "enter-from-bottom" : "enter-from-top");

  // Slide 切换后从左上角开始打字
  startTypewriterForSlide(nextIndex);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      nextSlide.classList.remove("enter-from-bottom", "enter-from-top");
      currentSlide.classList.add(direction > 0 ? "exit-to-top" : "exit-to-bottom");
    });
  });

  setTimeout(() => {
    currentSlide.classList.remove("is-active", "exit-to-top", "exit-to-bottom");
    cleanupSlideClasses(currentSlide);
    cleanupSlideClasses(nextSlide);

    current = nextIndex;
    updateDots();
    updateCanvasTheme(current);
    syncSceneEffects();
    isAnimating = false;
  }, 860);
}

function goNext() {
  const next = (current + 1) % slides.length;
  showSlide(next, 1);
}

function goPrev() {
  const next = (current - 1 + slides.length) % slides.length;
  showSlide(next, -1);
}

/* ---------- gesture ---------- */
function onPointerDown(e) {
  pointerActive = true;
  startX = e.clientX;
  startY = e.clientY;
  deltaX = 0;
  deltaY = 0;
}

function onPointerMove(e) {
  if (!pointerActive) return;
  deltaX = e.clientX - startX;
  deltaY = e.clientY - startY;
}

function onPointerUp() {
  if (!pointerActive) return;
  pointerActive = false;

  const threshold = 55;

  if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
    if (deltaY < 0) goNext(); // swipe up
    if (deltaY > 0) goPrev(); // swipe down
  }

  deltaX = 0;
  deltaY = 0;
}

function onWheel(e) {
  if (wheelLocked || isAnimating) return;

  if (Math.abs(e.deltaY) < 18) return;

  wheelLocked = true;

  if (e.deltaY > 0) goNext();
  if (e.deltaY < 0) goPrev();

  setTimeout(() => {
    wheelLocked = false;
  }, 900);
}

/* ---------- keyboard ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev();
});

/* ---------- canvas ambient particles ---------- */
const canvas = document.getElementById("ambientCanvas");
const ctx = canvas.getContext("2d");

let w = 0;
let h = 0;
let particles = [];
let theme = { r: 245, g: 193, b: 93 };

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createParticles();
}

function updateCanvasTheme(index) {
  if (index === 0) {
    theme = { r: 245, g: 193, b: 93 };
  } else if (index === 1) {
    theme = { r: 196, g: 221, b: 255 };
  } else if (index === 2) {
    theme = { r: 255, g: 229, b: 150 };
  } else if (index === 7) {
    theme = { r: 190, g: 205, b: 235 };
  } else {
    theme = { r: 120, g: 188, b: 255 };
  }
}

function createParticle() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 2.8 + 0.8,
    speed: Math.random() * 0.9 + 0.25,
    alpha: Math.random() * 0.28 + 0.06,
    stretch: Math.random() * 24 + 10,
    dir: Math.random() > 0.5 ? -1 : 1
  };
}

function createParticles() {
  const count = Math.max(36, Math.floor(w / 24));
  particles = Array.from({ length: count }, createParticle);
}

function updateParticles() {
  for (const p of particles) {
    p.y += p.speed * p.dir;

    if (p.dir < 0 && p.y < -40) {
      p.y = h + 40;
      p.x = Math.random() * w;
    }

    if (p.dir > 0 && p.y > h + 40) {
      p.y = -40;
      p.x = Math.random() * w;
    }
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, w, h);

  for (const p of particles) {
    const rgba = `rgba(${theme.r}, ${theme.g}, ${theme.b}, ${p.alpha})`;

    ctx.beginPath();
    ctx.fillStyle = rgba;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${theme.r}, ${theme.g}, ${theme.b}, ${p.alpha * 0.55})`;
    ctx.lineWidth = 1;
    ctx.moveTo(p.x, p.y - p.stretch * 0.5);
    ctx.lineTo(p.x, p.y + p.stretch * 0.5);
    ctx.stroke();
  }
}

function animateCanvas() {
  updateParticles();
  drawParticles();
  requestAnimationFrame(animateCanvas);
}



/* ---------- geo maps from JSON (1974 advocacy + business globe) ---------- */
const GEO_JSON = {
  advocacy: "./assets/geo/advocacy-1974-map.json",
  businessGlobe: "./assets/geo/business-globe-map.json",
};

function injectAdvocacy1974Map(data) {
  const projection = document.getElementById("advocacyMapProjection");
  const svg = document.querySelector(".advocacy-1974 .usa-map-svg-1974");
  const shell = document.querySelector(".advocacy-1974 .usa-map-shell");
  if (!projection || !data || !svg) return;

  svg.setAttribute("viewBox", data.viewBox || "0 0 1000 620");
  projection.setAttribute("transform", data.transform || "");

  const pathSpecs = [
    ["usa-outline", data.paths?.usaOutline],
    ["usa-shine", data.paths?.usaShine],
    ["texas-glow", data.paths?.texasGlow],
    ["texas-focus", data.paths?.texasFocus],
  ];

  projection.replaceChildren();
  pathSpecs.forEach(([cls, d]) => {
    if (!d) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", cls);
    path.setAttribute("d", d);
    projection.appendChild(path);
  });

  if (data.roads?.road1) {
    const p1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p1.setAttribute("class", "road-arc road-1");
    p1.setAttribute("d", data.roads.road1);
    projection.appendChild(p1);
  }
  if (data.roads?.road2) {
    const p2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p2.setAttribute("class", "road-arc road-2");
    p2.setAttribute("d", data.roads.road2);
    projection.appendChild(p2);
  }

  const dotMap = [
    ["road-dot dot-a", data.dots?.ca],
    ["road-dot dot-b", data.dots?.tx],
    ["road-dot dot-c", data.dots?.ny],
  ];
  dotMap.forEach(([cls, pt]) => {
    if (!pt || pt.cx == null || pt.cy == null) return;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("class", cls);
    c.setAttribute("cx", String(pt.cx));
    c.setAttribute("cy", String(pt.cy));
    c.setAttribute("r", "6");
    projection.appendChild(c);
  });

  if (shell && data.texasPulseOrigin) {
    shell.style.setProperty(
      "--texas-pulse-origin-x",
      `${data.texasPulseOrigin.x}px`
    );
    shell.style.setProperty(
      "--texas-pulse-origin-y",
      `${data.texasPulseOrigin.y}px`
    );
  }
  if (shell && data.labelPosition) {
    shell.style.setProperty(
      "--texas-label-left",
      `${data.labelPosition.leftPct}%`
    );
    shell.style.setProperty(
      "--texas-label-top",
      `${data.labelPosition.topPct}%`
    );
  }
}

function injectBusinessGlobeMap(data) {
  const rotator = document.getElementById("businessGlobeRotator");
  if (!data?.landPath || !rotator) return;
  const svgs = rotator.querySelectorAll(".business-map-svg");
  svgs.forEach((svg) => {
    svg.setAttribute("viewBox", data.viewBox || "0 0 1000 500");
    /* 铺满方形 panel，与热点 left%/top%（按 viewBox 比例）线性对应 */
    svg.setAttribute("preserveAspectRatio", "none");
    const land = svg.querySelector(".business-map-land");
    if (!land) return;
    land.replaceChildren();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data.landPath);
    land.appendChild(path);
  });

  const scene = document.querySelector("#business-world");
  const hotspots = Array.isArray(data.hotspots) ? data.hotspots : [];
  hotspots.forEach((h) => {
    if (!h?.key) return;
    const el = scene?.querySelector(
      `.business-hotspot[data-location="${h.key}"]`
    );
    if (!el) return;
    if (h.leftPct != null) el.style.left = `${h.leftPct}%`;
    if (h.topPct != null) el.style.top = `${h.topPct}%`;
  });
}

/* ---------- business world scene (globe-linked hotspots) ---------- */
const businessScene = document.querySelector("#business-world");
const businessGlobe = document.getElementById("businessGlobe");
const businessGlobeRotator = document.getElementById("businessGlobeRotator");
const businessRouteSvg = document.getElementById("businessRouteSvg");
const businessPlane = document.getElementById("businessPlane");
const businessCard = document.getElementById("businessCard");
const businessCardImage = document.getElementById("businessCardImage");
const businessCardPlace = document.getElementById("businessCardPlace");
const businessCardYears = document.getElementById("businessCardYears");
const businessCardText = document.getElementById("businessCardText");

if (businessGlobeRotator && businessGlobeRotator.children.length === 1) {
  businessGlobeRotator.appendChild(businessGlobeRotator.firstElementChild.cloneNode(true));
}

const businessHotspots = businessScene ? Array.from(businessScene.querySelectorAll('.business-hotspot')) : [];

const businessLocations = [
  {
    key: 'us',
    place: 'United States',
    years: '1956',
    text: 'After leaving law school, he entered business and began moving into a larger commercial world in the United States.',
    image: './assets/justin-us.png',
    angle: -18
  },
  {
    key: 'mexico',
    place: 'Mexico',
    years: 'Late 1950s–early 1960s',
    text: 'Memorial accounts describe him building successful companies in Mexico before his best-documented Japan chapter.',
    image: './assets/justin-mexico.png',
    angle: 10
  },
  {
    key: 'japan',
    place: 'Japan',
    years: '1963–1965',
    text: 'He founded Japan Tupperware, led it as president, and began using business to widen work and dignity for disabled people.',
    image: './assets/justin-japan.png',
    angle: 28
  }
];

let businessIndex = 0;
let businessTimer = null;
let businessObserver = null;
let businessRaf = null;
let businessFlight = {
  active: false,
  fromKey: 'us',
  toKey: 'us',
  start: 0,
  duration: 1900
};

function getBusinessLocationByKey(key) {
  return businessLocations.find((location) => location.key === key) || businessLocations[0];
}

function getBusinessPointFromElement(hotspot) {
  if (!businessGlobe || !hotspot) return null;
  const globeRect = businessGlobe.getBoundingClientRect();
  const hotspotRect = hotspot.getBoundingClientRect();
  const x = hotspotRect.left + hotspotRect.width / 2 - globeRect.left;
  const y = hotspotRect.top + hotspotRect.height / 2 - globeRect.top;
  const cx = globeRect.width / 2;
  const cy = globeRect.height / 2;
  const radius = Math.min(globeRect.width, globeRect.height) / 2 - 4;
  const visible = x >= -18 && y >= -18 && x <= globeRect.width + 18 && y <= globeRect.height + 18 && ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
  return { x, y, visible };
}

function getBusinessVisibleHotspot(key) {
  if (!businessHotspots.length || !businessGlobe) return null;
  const globeRect = businessGlobe.getBoundingClientRect();
  const globeCenterX = globeRect.width / 2;
  const candidates = businessHotspots.filter((hotspot) => hotspot.dataset.location === key);

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((hotspot) => {
    const point = getBusinessPointFromElement(hotspot);
    if (!point) return;
    const score = (point.visible ? 0 : 10000) + Math.abs(point.x - globeCenterX);
    if (score < bestScore) {
      bestScore = score;
      best = { hotspot, ...point };
    }
  });

  return best;
}

function getBusinessControlPoint(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    x: (a.x + b.x) / 2,
    y: Math.min(a.y, b.y) - Math.max(44, Math.abs(dx) * 0.18 + Math.abs(dy) * 0.08)
  };
}

function getBusinessQuadPoint(a, c, b, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y
  };
}

function getBusinessQuadTangent(a, c, b, t) {
  return {
    x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
    y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y)
  };
}

function drawBusinessRouteFromPoints(a, b, showRoute = true) {
  if (!businessRouteSvg || !businessGlobe) return;
  const rect = businessGlobe.getBoundingClientRect();
  businessRouteSvg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  businessRouteSvg.innerHTML = '';

  if (!a || !b || !showRoute) return;

  const control = getBusinessControlPoint(a, b);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}`);
  businessRouteSvg.appendChild(path);
}

function setBusinessPlanePixel(x, y, angle) {
  if (!businessPlane) return;
  businessPlane.style.left = `${x}px`;
  businessPlane.style.top = `${y}px`;
  businessPlane.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

function setBusinessCard(location) {
  if (!businessCard) return;
  businessCard.classList.add('is-switching');
  window.setTimeout(() => {
    if (businessCardPlace) businessCardPlace.textContent = location.place;
    if (businessCardYears) businessCardYears.textContent = location.years;
    if (businessCardText) businessCardText.textContent = location.text;
    if (businessCardImage) {
      businessCardImage.src = location.image;
      businessCardImage.alt = `Justin Dart Jr. business period in ${location.place}`;
    }
    businessCard.classList.remove('is-switching');
  }, 140);
}

function setActiveBusinessHotspots(key) {
  businessHotspots.forEach((hotspot) => {
    hotspot.classList.toggle('is-active', hotspot.dataset.location === key);
  });
}

function showBusinessLocation(nextIndex, animate = true) {
  if (!businessScene || !businessGlobe || !businessPlane) return;
  const next = businessLocations[nextIndex];
  const prev = businessLocations[businessIndex] || next;

  setActiveBusinessHotspots(next.key);
  setBusinessCard(next);

  if (animate && prev.key !== next.key) {
    businessFlight = {
      active: true,
      fromKey: prev.key,
      toKey: next.key,
      start: performance.now(),
      duration: 1900
    };
  } else {
    businessFlight = {
      active: false,
      fromKey: next.key,
      toKey: next.key,
      start: 0,
      duration: 0
    };
  }

  businessIndex = nextIndex;
}

function animateBusinessScene(now) {
  businessRaf = window.requestAnimationFrame(animateBusinessScene);
  if (!businessScene || !businessGlobe || !businessPlane) return;

  const shouldRender = businessScene.classList.contains('is-active') || !businessScene.classList.contains('slide');
  if (!shouldRender) return;

  const currentLocation = businessLocations[businessIndex];
  if (!currentLocation) return;

  if (businessFlight.active) {
    const fromPoint = getBusinessVisibleHotspot(businessFlight.fromKey);
    const toPoint = getBusinessVisibleHotspot(businessFlight.toKey);
    if (!fromPoint || !toPoint) return;

    const t = Math.min(1, (now - businessFlight.start) / businessFlight.duration);
    const control = getBusinessControlPoint(fromPoint, toPoint);
    const point = getBusinessQuadPoint(fromPoint, control, toPoint, t);
    const tangent = getBusinessQuadTangent(fromPoint, control, toPoint, Math.min(t, 0.999));
    const angle = Math.atan2(tangent.y, tangent.x) * 180 / Math.PI;

    drawBusinessRouteFromPoints(fromPoint, toPoint, true);
    setBusinessPlanePixel(point.x, point.y, angle);

    if (t >= 1) {
      businessFlight.active = false;
    }
  } else {
    const dockPoint = getBusinessVisibleHotspot(currentLocation.key);
    if (!dockPoint) return;
    drawBusinessRouteFromPoints(dockPoint, dockPoint, false);
    setBusinessPlanePixel(dockPoint.x, dockPoint.y, currentLocation.angle);
  }
}

function startBusinessSceneLoop() {
  if (!businessScene || businessTimer || reduceMotion) return;
  businessTimer = window.setInterval(() => {
    const nextIndex = (businessIndex + 1) % businessLocations.length;
    showBusinessLocation(nextIndex, true);
  }, 4500);
}

function stopBusinessSceneLoop() {
  if (!businessTimer) return;
  window.clearInterval(businessTimer);
  businessTimer = null;
}

function syncSceneEffects() {
  if (!businessScene) return;
  const shouldRun = businessScene.classList.contains('is-active') || !businessScene.classList.contains('slide');
  if (shouldRun) {
    startBusinessSceneLoop();
  } else {
    stopBusinessSceneLoop();
  }
}

businessHotspots.forEach((hotspot) => {
  hotspot.addEventListener('click', () => {
    const nextIndex = businessLocations.findIndex((location) => location.key === hotspot.dataset.location);
    if (nextIndex < 0) return;
    stopBusinessSceneLoop();
    showBusinessLocation(nextIndex, true);
    if (businessScene.classList.contains('is-active')) {
      startBusinessSceneLoop();
    }
  });
});

function setupBusinessGlobeAfterGeo() {
  if (!businessScene || !businessGlobe) return;
  showBusinessLocation(0, false);
  businessRaf = window.requestAnimationFrame(animateBusinessScene);

  if (!businessObserver) {
    businessObserver = new MutationObserver(() => {
      syncSceneEffects();
    });
    businessObserver.observe(businessScene, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  window.addEventListener("resize", () => {
    showBusinessLocation(businessIndex, false);
  });
}

(async () => {
  try {
    const [advocacyGeo, businessGeo] = await Promise.all([
      fetch(GEO_JSON.advocacy).then((r) => r.json()),
      fetch(GEO_JSON.businessGlobe).then((r) => r.json()),
    ]);
    injectAdvocacy1974Map(advocacyGeo);
    injectBusinessGlobeMap(businessGeo);
  } catch (err) {
    console.error("Geo JSON load failed:", err);
  }
  setupBusinessGlobeAfterGeo();
  syncSceneEffects();
})();

function initMarriageStars() {
  const host = document.getElementById("marriageStars");
  if (!host) return;
  const count = reduceMotion ? 36 : 72;
  host.replaceChildren();
  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    star.className = "marriage-star";
    star.style.left = `${Math.random() * 98 + 1}%`;
    star.style.top = `${3 + Math.random() * 50}%`;
    const dur = 2 + Math.random() * 3.2;
    const delay = Math.random() * 6;
    star.style.setProperty("--star-dur", `${dur}s`);
    star.style.setProperty("--star-delay", `${delay}s`);
    const roll = Math.random();
    const px = roll < 0.1 ? 3 : roll < 0.45 ? 1.5 : 2;
    star.style.width = `${px}px`;
    star.style.height = `${px}px`;
    host.appendChild(star);
  }
}


/* ---------- init ---------- */
initMarriageStars();
buildDots();
updateDots();
updateCanvasTheme(current);
resizeCanvas();
animateCanvas();
startTypewriterForSlide(current);
syncSceneEffects();

timeline.addEventListener("pointerdown", onPointerDown);
timeline.addEventListener("pointermove", onPointerMove);
timeline.addEventListener("pointerup", onPointerUp);
timeline.addEventListener("pointercancel", onPointerUp);
timeline.addEventListener("wheel", onWheel, { passive: true });
window.addEventListener("resize", resizeCanvas);