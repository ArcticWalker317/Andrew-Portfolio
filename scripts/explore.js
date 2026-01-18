(() => {
  const speckBg = document.getElementById("speck-bg");
  const map = document.getElementById("map");
  const svg = document.getElementById("links");
  const center = document.getElementById("node-center");

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
  let childNodeEls = new Map(); // parentId -> [childElements]
  let hoverRAF = 0;
  let openParents = new Set(); // Track which parent nodes have children open

  // Lines map: nodeEl -> svgPath
  const lines = new Map();
  const childLines = new Map(); // childEl -> svgPath

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

    for (const cfg of NODES) {
      const div = document.createElement("div");
      div.className = "bubble node";
      div.id = cfg.id;
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", cfg.label);
      div.dataset.nodeId = cfg.id;

      if (typeof cfg.size === "number") {
        div.style.width = `${cfg.size}px`;
        div.style.height = `${cfg.size}px`;
      }

      if (cfg.image) {
        div.classList.add("has-image");
        const absImg = new URL(cfg.image, document.baseURI).href;
        div.style.setProperty("--img", `url("${absImg}")`);
        const media = document.createElement("div");
        media.className = "node-media";
        div.appendChild(media);
      }

      const title = document.createElement("div");
      title.className = "node-title";
      title.textContent = cfg.label;
      div.appendChild(title);

      map.appendChild(div);
      nodeEls.push(div);
    }
  }

  // ----------------------------
  // Render child nodes for a parent
  // ----------------------------
  function renderChildNodes(parentCfg, parentEl) {
    if (!parentCfg.children || parentCfg.children.length === 0) return [];

    const children = [];
    const parentRect = parentEl.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const parentCenterX = parentRect.left - mapRect.left + parentRect.width / 2;
    const parentCenterY = parentRect.top - mapRect.top + parentRect.height / 2;

    for (const childCfg of parentCfg.children) {
      const childEl = document.createElement("div");
      childEl.className = "bubble child-node";
      childEl.id = childCfg.id;
      childEl.dataset.parentId = parentCfg.id;

      if (typeof childCfg.size === "number") {
        childEl.style.width = `${childCfg.size}px`;
        childEl.style.height = `${childCfg.size}px`;
      }

      if (childCfg.image) {
        childEl.classList.add("has-image");
        const absImg = new URL(childCfg.image, document.baseURI).href;
        childEl.style.setProperty("--img", `url("${absImg}")`);
        const media = document.createElement("div");
        media.className = "node-media";
        childEl.appendChild(media);
      }

      const title = document.createElement("div");
      title.className = "node-title";
      title.textContent = childCfg.label;
      childEl.appendChild(title);

      // Start at parent center
      childEl.style.left = `${parentCenterX - (childCfg.size || 120) / 2}px`;
      childEl.style.top = `${parentCenterY - (childCfg.size || 120) / 2}px`;
      childEl.style.opacity = "0";
      childEl.style.transform = "scale(0)";

      map.appendChild(childEl);
      children.push({ el: childEl, cfg: childCfg });
    }

    return children;
  }

  // ----------------------------
  // Animate child nodes in/out
  // ----------------------------
  async function animateChildrenIn(parentCfg, parentEl, children) {
    const parentRect = parentEl.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const parentCenterX = parentRect.left - mapRect.left + parentRect.width / 2;
    const parentCenterY = parentRect.top - mapRect.top + parentRect.height / 2;

    // Auto-distribute angles if not specified
    const angles = children.map((child, i) => {
      if (typeof child.cfg.angleDeg === "number") {
        return child.cfg.angleDeg;
      }
      const step = 360 / children.length;
      return -90 + step * i;
    });

    // Create SVG paths for each child
    for (let i = 0; i < children.length; i++) {
      const { el, cfg } = children[i];
      const angle = (angles[i] * Math.PI) / 180;
      const distance = cfg.distance || 170;

      const targetX = parentCenterX + Math.cos(angle) * distance - (cfg.size || 120) / 2;
      const targetY = parentCenterY + Math.sin(angle) * distance - (cfg.size || 120) / 2;

      // Create connecting line
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(255, 255, 255, 0.25)");
      path.setAttribute("stroke-width", "1.8");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("filter", "url(#softGlow)");
      svg.appendChild(path);
      childLines.set(el, path);

      // Animate to target position
      await sleep(i * 60);
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
      el.style.left = `${targetX}px`;
      el.style.top = `${targetY}px`;
      el.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    }

    // Update child lines
    updateChildLines(parentEl, children);

    // Continue updating lines during animation
    const animDuration = 500;
    const animStart = performance.now();
    const tick = (now) => {
      updateChildLines(parentEl, children);
      if (now - animStart < animDuration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }


  // ----------------------------
  // Update child node connector lines
  // ----------------------------
  function updateChildLines(parentEl, children) {
    const parentPoint = centerPointInMap(parentEl);

    for (const { el } of children) {
      const childPoint = centerPointInMap(el);
      const mx = (parentPoint.x + childPoint.x) / 2;
      const my = (parentPoint.y + childPoint.y) / 2;
      const bend = 0.15;
      const cx1 = mx + (childPoint.x - parentPoint.x) * bend;
      const cy1 = my + (childPoint.y - parentPoint.y) * bend;

      const d = `M ${parentPoint.x.toFixed(2)} ${parentPoint.y.toFixed(2)}
                 Q ${cx1.toFixed(2)} ${cy1.toFixed(2)}
                   ${childPoint.x.toFixed(2)} ${childPoint.y.toFixed(2)}`;

      const path = childLines.get(el);
      if (path) path.setAttribute("d", d);
    }
  }

  // ----------------------------
  // Animate children out (back to parent)
  // ----------------------------
  async function animateChildrenOut(parentEl, children) {
    const parentRect = parentEl.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const parentCenterX = parentRect.left - mapRect.left + parentRect.width / 2;
    const parentCenterY = parentRect.top - mapRect.top + parentRect.height / 2;

    // Animate lines fading during return
    const animDuration = 400;
    const animStart = performance.now();
    const tick = (now) => {
      updateChildLines(parentEl, children);
      if (now - animStart < animDuration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Animate each child back to parent center in reverse order
    for (let i = children.length - 1; i >= 0; i--) {
      const { el, cfg } = children[i];

      // Move back to parent center with scale down
      el.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.left = `${parentCenterX - (cfg.size || 120) / 2}px`;
      el.style.top = `${parentCenterY - (cfg.size || 120) / 2}px`;
      el.style.opacity = "0";
      el.style.transform = "scale(0)";

      // Fade out the connecting line
      const path = childLines.get(el);
      if (path) {
        path.style.transition = "opacity 0.3s ease";
        path.style.opacity = "0";
      }

      await sleep(60);
    }

    // Wait for animations to complete
    await sleep(350);

    // Clean up DOM elements
    for (const { el } of children) {
      const path = childLines.get(el);
      if (path) {
        path.remove();
        childLines.delete(el);
      }
      el.remove();
    }
  }

  // ----------------------------
  // Toggle child nodes for a parent
  // ----------------------------
  async function toggleChildNodes(parentId) {
    const parentCfg = NODES.find((n) => n.id === parentId);
    if (!parentCfg || !parentCfg.children || parentCfg.children.length === 0) return;

    const parentEl = nodeEls.find((el) => el.id === parentId);
    if (!parentEl) return;

    // If already open, close with animation
    if (openParents.has(parentId)) {
      openParents.delete(parentId);
      const children = childNodeEls.get(parentId);
      if (children) {
        await animateChildrenOut(parentEl, children);
        childNodeEls.delete(parentId);
      }
    } else {
      // Open children with animation
      openParents.add(parentId);
      const children = renderChildNodes(parentCfg, parentEl);
      childNodeEls.set(parentId, children);
      await animateChildrenIn(parentCfg, parentEl, children);
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
  function lockNodesToTargets() {
    nodeEls.forEach((el) => {
      const tx = el.style.getPropertyValue("--tx") || "0px";
      const ty = el.style.getPropertyValue("--ty") || "0px";
      const base = `translate3d(${tx}, ${ty}, 0) scale(1)`;
      el.style.transform = base;
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
  // Attach click handlers for toggling children
  // ----------------------------
  function attachNodeClickHandlers() {
    nodeEls.forEach((nodeEl) => {
      nodeEl.addEventListener("click", () => {
        const nodeId = nodeEl.dataset.nodeId;
        if (nodeId) {
          toggleChildNodes(nodeId);
        }
      });

      // Handle keyboard interaction (Enter/Space)
      nodeEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const nodeId = nodeEl.dataset.nodeId;
          if (nodeId) {
            toggleChildNodes(nodeId);
          }
        }
      });
    });
  }

  // ----------------------------
  // Intro animation
  // ----------------------------
  async function playIntro() {
    svg.classList.remove("ready");

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

    // After the fly animation finishes, lock final transforms
    setTimeout(() => {
      lockNodesToTargets();
      updateLines();
    }, 950);
  }

  // ----------------------------
  // Init + resize
  // ----------------------------
  function init() {
    buildSpecks(260);

    // Close all child nodes on re-init
    for (const children of childNodeEls.values()) {
      for (const { el } of children) {
        const path = childLines.get(el);
        if (path) path.remove();
        el.remove();
      }
    }
    childNodeEls.clear();
    openParents.clear();

    renderNodes();
    attachHoverLineTracking();
    attachNodeClickHandlers();

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
