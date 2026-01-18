(() => {
  const speckBg = document.getElementById("speck-bg");
  const map = document.getElementById("map");
  const svg = document.getElementById("links");
  const center = document.getElementById("node-center");
  const backBtn = document.getElementById("back-btn");

  /**
   * =========================
   * EDIT THIS LIST TO ADD/REMOVE BIG NODES + SUB BUBBLES
   * =========================
   *
   * Big node fields:
   *  - id, label, size(px), distance(px or <=1 as fraction of map min), angleDeg(optional), image(optional)
   *
   * Sub-bubble fields (inside children):
   *  - id, label, size(px), distance(px), angleDeg(optional), image(optional)
   *
   * Notes:
   *  - If angleDeg is missing, it auto-distributes evenly around the parent
   *  - Sub-bubbles do NOT navigate; they are just bubbles for now (easy to add href later)
   */
  const NODES = [
    {
      id: "node-about",
      label: "About",
      size: 150,
      distance: 0.42,
      angleDeg: -135,
      image: null, // e.g. "assets/photos/about.jpg"
      children: [
        { id: "about-1", label: "Bio", size: 120, distance: 170, angleDeg: -90 },
        { id: "about-2", label: "Resume", size: 120, distance: 170, angleDeg: 0, image: "assets/me.jpg" },
        { id: "about-3", label: "Contact", size: 120, distance: 170, angleDeg: 90 },
      ],
    },
    {
      id: "node-teams",
      label: "Teams",
      size: 150,
      distance: 0.42,
      angleDeg: 135,
      children: [
        { id: "teams-1", label: "VEX", size: 120, distance: 170, angleDeg: -60 },
        { id: "teams-2", label: "Clubs", size: 120, distance: 170, angleDeg: 60 },
      ],
    },
    {
      id: "node-projects",
      label: "Projects",
      size: 160,
      distance: 0.42,
      angleDeg: 45,
      children: [
        { id: "proj-1", label: "RC Car", size: 120, distance: 170, angleDeg: -90 },
        { id: "proj-2", label: "LoRa", size: 120, distance: 170, angleDeg: 0 },
        { id: "proj-3", label: "PCBs", size: 120, distance: 170, angleDeg: 90 },
      ],
    },
    {
      id: "node-awards",
      label: "Awards",
      size: 150,
      distance: 0.42,
      angleDeg: -45,
      children: [
        { id: "award-1", label: "School", size: 120, distance: 170, angleDeg: -45 },
        { id: "award-2", label: "Competitions", size: 120, distance: 170, angleDeg: 45 },
      ],
    },
  ];

  // DOM refs
  let nodeEls = [];
  let subEls = []; // currently rendered sub-bubbles
  let activeNodeId = null;
  let hoverRAF = 0;

  // Lines map: nodeEl -> svgPath
  const lines = new Map();

  // For restoring node transforms after zoom
  const nodeBaseTransform = new Map();

  // ----------------------------
  // Deterministic speck background (unchanged)
  // ----------------------------
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeTargetField(count, w, h) {
    const rng = mulberry32(123456);
    const targets = [];

    for (let i = 0; i < count; i++) {
      const r = rng();
      const tiny = r < 0.25;
      const dim = !tiny && r < 0.55;
      const soft = rng() < 0.35;

      targets.push({
        x: rng() * w,
        y: rng() * h,
        tiny,
        dim,
        soft,
        delay: rng() * 120,
        dur: 1000 + rng() * 650,
        over: 1.05 + rng() * 0.07,
      });
    }

    return targets;
  }

  let cachedTargets = null;
  let cachedW = 0;
  let cachedH = 0;

  function getTargets(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (!cachedTargets || w !== cachedW || h !== cachedH || cachedTargets.length !== count) {
      cachedTargets = makeTargetField(count, w, h);
      cachedW = w;
      cachedH = h;
    }
    return cachedTargets;
  }

  function buildSpecks(count = 260) {
    speckBg.innerHTML = "";
    const targets = getTargets(count);

    for (const t of targets) {
      const px = document.createElement("span");
      px.className = "px";
      if (t.tiny) px.classList.add("tiny");
      else if (t.dim) px.classList.add("dim");
      if (t.soft) px.classList.add("soft");

      px.style.transform = `translate(${t.x}px, ${t.y}px)`;
      speckBg.appendChild(px);
    }
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function centerPointInMap(el) {
    const mapR = map.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left - mapR.left + r.width / 2,
      y: r.top - mapR.top + r.height / 2,
      w: r.width,
      h: r.height,
    };
  }

  function distanceToPx(distance, mapW, mapH) {
    const minDim = Math.min(mapW, mapH);
    if (typeof distance !== "number") return minDim * 0.42;
    if (distance <= 1) return distance * minDim;
    return distance;
  }

  function computeResponsiveLayoutParams() {
    const r = map.getBoundingClientRect();
    const mapW = r.width;
    const mapH = r.height;
    const minDim = Math.min(mapW, mapH);

    const centerR = center.getBoundingClientRect();
    const centerSize = Math.min(centerR.width, centerR.height);

    const edgePad = Math.max(14, minDim * 0.04);

    const maxNodeSize = Math.max(
      0,
      ...NODES.map((n, i) => (typeof n.size === "number" ? n.size : 150))
    );

    const maxSafeRadiusX = mapW / 2 - maxNodeSize / 2 - edgePad;
    const maxSafeRadiusY = mapH / 2 - maxNodeSize / 2 - edgePad;
    const maxSafeRadius = Math.max(60, Math.min(maxSafeRadiusX, maxSafeRadiusY));

    const baseRadius = Math.min(minDim * 0.42, maxSafeRadius);

    let sizeScale = 1;
    if (minDim < 520) sizeScale = 0.88;
    if (minDim < 420) sizeScale = 0.8;

    const minRadius = Math.max(70, centerSize / 2 + maxNodeSize / 2 + 28);

    return { mapW, mapH, minDim, baseRadius, maxSafeRadius, minRadius, sizeScale };
  }

  // ----------------------------
  // Render big nodes
  // ----------------------------
  function renderNodes() {
    nodeEls.forEach((el) => el.remove());
    nodeEls = [];
    nodeBaseTransform.clear();

    for (const cfg of NODES) {
      const a = document.createElement("a");
      a.className = "bubble node";
      a.id = cfg.id;
      a.href = "#"; // we intercept clicks to zoom instead of navigating
      a.setAttribute("role", "button");
      a.setAttribute("aria-label", cfg.label);
      a.dataset.nodeId = cfg.id;

      if (typeof cfg.size === "number") {
        a.style.width = `${cfg.size}px`;
        a.style.height = `${cfg.size}px`;
      }

      if (cfg.image) {
        a.classList.add("has-image");
        const absImg = new URL(cfg.image, document.baseURI).href;
        a.style.setProperty("--img", `url("${absImg}")`);
        const media = document.createElement("div");
        media.className = "node-media";
        a.appendChild(media);
      }

      const title = document.createElement("div");
      title.className = "node-title";
      title.textContent = cfg.label;
      a.appendChild(title);

      // Click to open/close
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = a.dataset.nodeId;
        if (activeNodeId === id) closeNode();
        else openNode(id);
      });

      // Keyboard (Enter/Space)
      a.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = a.dataset.nodeId;
          if (activeNodeId === id) closeNode();
          else openNode(id);
        }
      });

      map.appendChild(a);
      nodeEls.push(a);
    }
  }

  // ----------------------------
  // Layout big nodes
  // ----------------------------
  function layoutTargets() {
    const { mapW, mapH, baseRadius, maxSafeRadius, minRadius, sizeScale } =
      computeResponsiveLayoutParams();

    const cx = mapW / 2;
    const cy = mapH / 2;

    const autoIdx = [];
    for (let i = 0; i < NODES.length; i++) {
      if (typeof NODES[i].angleDeg !== "number") autoIdx.push(i);
    }

    const startDeg = -90;
    const step = autoIdx.length > 0 ? 360 / autoIdx.length : 360;

    const angleDegByIndex = new Array(NODES.length).fill(0);
    let autoK = 0;
    for (let i = 0; i < NODES.length; i++) {
      if (typeof NODES[i].angleDeg === "number") angleDegByIndex[i] = NODES[i].angleDeg;
      else {
        angleDegByIndex[i] = startDeg + step * autoK;
        autoK++;
      }
    }

    const targets = [];

    for (let i = 0; i < nodeEls.length; i++) {
      const el = nodeEls[i];
      const cfg = NODES[i];

      if (typeof cfg.size === "number") {
        const scaled = Math.round(cfg.size * sizeScale);
        el.style.width = `${scaled}px`;
        el.style.height = `${scaled}px`;
      }

      const size = el.offsetWidth;

      const desired = distanceToPx(cfg.distance, mapW, mapH);
      const radius = Math.min(maxSafeRadius, Math.max(minRadius, desired, baseRadius * 0.65));

      const ang = (angleDegByIndex[i] * Math.PI) / 180;

      let tx = cx + Math.cos(ang) * radius - size / 2;
      let ty = cy + Math.sin(ang) * radius - size / 2;

      const pad = 10;
      const minX = pad;
      const minY = pad;
      const maxX = mapW - size - pad;
      const maxY = mapH - size - pad;

      tx = Math.max(minX, Math.min(maxX, tx));
      ty = Math.max(minY, Math.min(maxY, ty));

      targets.push({ el, tx, ty, cx, cy });
    }

    return targets;
  }

  function setStartAndTargetVars() {
    const r = map.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height / 2;

    const startX = cx;
    const startY = cy + 90;

    const targets = layoutTargets();
    targets.forEach(({ el, tx, ty }) => {
      el.style.setProperty("--sx", `${startX - el.offsetWidth / 2}px`);
      el.style.setProperty("--sy", `${startY - el.offsetHeight / 2}px`);
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
    });
  }

  // After intro animation, lock each node at its final position with an inline transform.
  // This makes later zoom transitions clean and reliable.
  function lockNodesToTargets() {
    nodeEls.forEach((el) => {
      const tx = el.style.getPropertyValue("--tx") || "0px";
      const ty = el.style.getPropertyValue("--ty") || "0px";
      const base = `translate3d(${tx}, ${ty}, 0) scale(1)`;
      el.style.transform = base;
      nodeBaseTransform.set(el.id, base);
    });
  }

  // ----------------------------
  // SVG connectors
  // ----------------------------
  function ensureLines() {
    svg.innerHTML = "";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.6" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 0.25 0" result="glow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    lines.clear();
    for (const nodeEl of nodeEls) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(255, 255, 255, 0.30)");
      path.setAttribute("stroke-width", "2.2");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("filter", "url(#softGlow)");
      svg.appendChild(path);
      lines.set(nodeEl, path);
    }
  }

  function updateLines() {
    // When zoomed, CSS fades the svg anyway; but we can still keep it correct
    const c = centerPointInMap(center);

    for (const nodeEl of nodeEls) {
      if (!nodeEl.classList.contains("ready")) continue;

      const p = centerPointInMap(nodeEl);
      const mx = (c.x + p.x) / 2;
      const my = (c.y + p.y) / 2;
      const bend = 0.18;
      const cx1 = mx + (p.x - c.x) * bend;
      const cy1 = my + (p.y - c.y) * bend;

      const d = `M ${c.x.toFixed(2)} ${c.y.toFixed(2)}
                 Q ${cx1.toFixed(2)} ${cy1.toFixed(2)}
                   ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

      const path = lines.get(nodeEl);
      if (path) path.setAttribute("d", d);
    }
  }

  function startHoverTrack() {
    if (hoverRAF) return;
    const loop = () => {
      updateLines();
      hoverRAF = requestAnimationFrame(loop);
    };
    hoverRAF = requestAnimationFrame(loop);
  }

  function stopHoverTrack() {
    if (!hoverRAF) return;
    cancelAnimationFrame(hoverRAF);
    hoverRAF = 0;
    updateLines();
  }

  function attachHoverLineTracking() {
    nodeEls.forEach((nodeEl) => {
      nodeEl.addEventListener("mouseenter", startHoverTrack);
      nodeEl.addEventListener("mouseleave", stopHoverTrack);
      nodeEl.addEventListener("focus", startHoverTrack);
      nodeEl.addEventListener("blur", stopHoverTrack);
    });
  }

  // ----------------------------
  // Intro animation
  // ----------------------------
  async function playIntro() {
    svg.classList.remove("ready");

    // Clear zoom state on init/re-init
    activeNodeId = null;
    map.classList.remove("zoomed");
    backBtn.classList.remove("show");
    nodeEls.forEach((n) => n.classList.remove("active"));

    // Remove any sub-bubbles
    clearSubs();

    nodeEls.forEach((n) => {
      n.classList.remove("ready");
      n.classList.remove("fly");
      n.style.opacity = "0";
      // important: remove any previous inline transforms so the fly anim uses CSS vars
      n.style.transform = "";
    });

    center.classList.remove("in");
    void center.offsetWidth;
    center.classList.add("in");

    await sleep(540);

    setStartAndTargetVars();
    ensureLines();

    // allow layout to settle
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    nodeEls.forEach((n) => n.classList.add("ready"));
    svg.classList.add("ready");
    updateLines();

    nodeEls.forEach((n, i) => setTimeout(() => n.classList.add("fly"), i * 90));

    // Smoothly update connectors during fly
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      updateLines();
      if (now - start < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // After the fly animation finishes, lock final transforms (for zoom transitions)
    setTimeout(() => {
      lockNodesToTargets();
      updateLines();
    }, 950);
  }

  // ----------------------------
  // Sub-bubbles
  // ----------------------------
  function clearSubs() {
    subEls.forEach((el) => el.remove());
    subEls = [];
  }

  function renderSubsForNode(nodeCfg, parentEl) {
    clearSubs();

    const children = Array.isArray(nodeCfg.children) ? nodeCfg.children : [];
    if (children.length === 0) return;

    // Auto-angle distribution for any child missing angleDeg
    const autoIdx = [];
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i].angleDeg !== "number") autoIdx.push(i);
    }
    const startDeg = -90;
    const step = autoIdx.length ? 360 / autoIdx.length : 360;

    const childAngles = new Array(children.length).fill(0);
    let k = 0;
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i].angleDeg === "number") childAngles[i] = children[i].angleDeg;
      else {
        childAngles[i] = startDeg + step * k;
        k++;
      }
    }

    // Parent center point in map coords
    const p = centerPointInMap(parentEl);

    const mapR = map.getBoundingClientRect();
    const cx = mapR.width / 2;
    const cy = mapR.height / 2;

    // Responsive scale down for sub bubbles on small maps
    const minDim = Math.min(mapR.width, mapR.height);
    let subScale = 1;
    if (minDim < 520) subScale = 0.9;
    if (minDim < 420) subScale = 0.82;

    children.forEach((c, i) => {
      const a = document.createElement("a");
      a.className = "bubble sub";
      a.id = c.id;
      a.href = "#";
      a.setAttribute("role", "button");
      a.setAttribute("aria-label", c.label);

      const size = Math.round((c.size || 110) * subScale);
      a.style.width = `${size}px`;
      a.style.height = `${size}px`;

      if (c.image) {
        a.classList.add("has-image");
        const absImg = new URL(c.image, document.baseURI).href;
        a.style.setProperty("--img", `url("${absImg}")`);
        const media = document.createElement("div");
        media.className = "node-media";
        a.appendChild(media);
      }

      const title = document.createElement("div");
      title.className = "sub-title";
      title.textContent = c.label;
      a.appendChild(title);

      // Start at parent center
      const sx = p.x - size / 2;
      const sy = p.y - size / 2;

      // Target around parent
      const dist = typeof c.distance === "number" ? c.distance : 160;
      const ang = (childAngles[i] * Math.PI) / 180;

      let tx = p.x + Math.cos(ang) * dist - size / 2;
      let ty = p.y + Math.sin(ang) * dist - size / 2;

      // Clamp within map
      const pad = 10;
      tx = Math.max(pad, Math.min(mapR.width - size - pad, tx));
      ty = Math.max(pad, Math.min(mapR.height - size - pad, ty));

      a.style.setProperty("--psx", `${sx}px`);
      a.style.setProperty("--psy", `${sy}px`);
      a.style.setProperty("--ptx", `${tx}px`);
      a.style.setProperty("--pty", `${ty}px`);

      // Show + animate
      map.appendChild(a);
      subEls.push(a);

      // click behavior: for now does nothing besides a subtle pulse (easy to change later)
      a.addEventListener("click", (e) => {
        e.preventDefault();
        // optional: close on sub click, or open deeper, etc.
      });

      // Stagger pop
      setTimeout(() => {
        a.classList.add("ready");
        a.classList.add("pop");
      }, i * 90);
    });

    // A couple frames to ensure layout is committed
    requestAnimationFrame(() => requestAnimationFrame(() => {}));
  }

  // ----------------------------
  // Zoom open/close behavior
  // ----------------------------
  function getNodeCfgById(id) {
    return NODES.find((n) => n.id === id) || null;
  }

  async function openNode(id) {
    const nodeEl = nodeEls.find((el) => el.id === id);
    const cfg = getNodeCfgById(id);
    if (!nodeEl || !cfg) return;

    // Ensure nodes are locked (if user clicks fast during intro)
    if (!nodeBaseTransform.size) lockNodesToTargets();

    activeNodeId = id;
    map.classList.add("zoomed");
    backBtn.classList.add("show");

    nodeEls.forEach((n) => n.classList.toggle("active", n.id === id));

    // Compute zoom transform to bring clicked node to center + scale up
    const mapR = map.getBoundingClientRect();
    const mapCx = mapR.width / 2;
    const mapCy = mapR.height / 2;

    const nodeCenter = centerPointInMap(nodeEl);

    const minDim = Math.min(mapR.width, mapR.height);
    const targetPx = minDim * 0.55;
    const baseSize = nodeCenter.w;

    let scale = targetPx / baseSize;
    scale = Math.max(1.2, Math.min(2.6, scale));

    const dx = mapCx - nodeCenter.x;
    const dy = mapCy - nodeCenter.y;

    const base = nodeBaseTransform.get(nodeEl.id) || nodeEl.style.transform || "";

    // IMPORTANT: set base first, then next frame set zoom transform
    nodeEl.style.transform = base;
    // Force a paint boundary so transition actually runs
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    nodeEl.style.transform = `${base} translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;

    // Keep lines updating while the node is transitioning
    const start = performance.now();
    const dur = 520;
    function tick(now) {
      updateLines();
      if (now - start < dur) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    renderSubsForNode(cfg, nodeEl);
  }


  function closeNode() {
    if (!activeNodeId) return;

    const nodeEl = nodeEls.find((el) => el.id === activeNodeId);
    if (nodeEl) {
      // Restore original transform
      const base = nodeBaseTransform.get(nodeEl.id);
      if (base) nodeEl.style.transform = base;
    }

    activeNodeId = null;
    map.classList.remove("zoomed");
    backBtn.classList.remove("show");
    nodeEls.forEach((n) => n.classList.remove("active"));

    // Remove sub bubbles
    clearSubs();

    // Recompute lines after zoom closes
    updateLines();
  }

  // Back button behavior
  backBtn.addEventListener("click", () => closeNode());

  // Optional: ESC to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeNodeId) closeNode();
  });

  // ----------------------------
  // Init + resize
  // ----------------------------
  function init() {
    buildSpecks(260);

    renderNodes();
    attachHoverLineTracking();

    // Layout + lines + intro animation
    setStartAndTargetVars();
    ensureLines();
    updateLines();
    playIntro();
  }

  window.addEventListener("load", init);

  // Responsive: re-init on resize (keeps everything clamped on-screen)
  window.addEventListener("resize", init);
})();
