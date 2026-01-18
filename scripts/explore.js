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
   *  - id, label, size(px), distance(px), angleDeg(optional), image(optional), textSize(px, optional)
   *
   * Notes:
   *  - If angleDeg is missing, it auto-distributes evenly around the parent
   *  - Sub-bubbles do NOT navigate; they are just bubbles for now (easy to add href later)
   *  - textSize sets the font size for child node labels (default is inherited from CSS)
   */
  const childNodeDefaultSize = 100
  const childNodeDefaultDist = 150
  const NODES = [
    {
      id: "node-teams",
      label: "Student Teams",
      size: 170,
      distance: 0.5,
      angleDeg: -30,
      children: [
        { id: "teams-1", label: "VT BAJA SAE", size: childNodeDefaultSize, distance: 170, angleDeg: -75, textSize: 13, image: "assets/me.jpg" },
        { id: "teams-2", label: "VT CRO WORKCELL", size: childNodeDefaultSize, distance: 170, angleDeg: -12, textSize: 13, image: "assets/me.jpg" },
        { id: "teams-3", label: "HEVT", size: childNodeDefaultSize, distance: 170, angleDeg: -140, textSize: 16, image: "assets/me.jpg" },
        { id: "teams-4", label: "VEX ROBOTICS", size: childNodeDefaultSize, distance: 170, angleDeg: 60, textSize: 13, image: "assets/me.jpg" },
      ],
    },
    {
      id: "node-projects",
      label: "Projects",
      size: 150,
      distance: 0.35,
      angleDeg: 155,
      children: [
        { id: "proj-1", label: "Hand Tracking", size: childNodeDefaultSize, distance: childNodeDefaultDist, angleDeg: 135, image: "assets/me.jpg" },
        { id: "proj-2", label: "THE CUBE", size: childNodeDefaultSize, distance: childNodeDefaultDist, angleDeg: -175, image: "assets/me.jpg" },
      ],
    },
    {
      id: "node-about",
      label: "About Me",
      size: 135,
      distance: 0.36,
      angleDeg: -140,
      image: null, // e.g. "assets/photos/about.jpg"
      children: [
        { id: "about-1", label: "Bio", size: childNodeDefaultSize, distance: childNodeDefaultDist, angleDeg: 160 },
        { id: "about-2", label: "Resume", size: childNodeDefaultSize, distance: 160, angleDeg: -135},
        { id: "about-3", label: "Contact", size: childNodeDefaultSize, distance: childNodeDefaultDist, angleDeg: -60 },
      ],
    },
    {
      id: "node-awards",
      label: "Awards",
      size: 125,
      distance: 0.25,
      angleDeg: 50,
      children: [
        { id: "award-1", label: "Arduino", size: childNodeDefaultSize, distance: childNodeDefaultDist -10, angleDeg: 30, image: "assets/me.jpg" },
        { id: "award-2", label: "Patent", size: childNodeDefaultSize, distance: childNodeDefaultDist -10, angleDeg: 130, image: "assets/me.jpg" },
      ],
    },
  ];

  /**
   * =========================
   * EDIT THIS OBJECT TO ADD/UPDATE POPUP CONTENT
   * =========================
   *
   * Add content for each child node using the child node's ID as the key.
   *
   * Two layout options:
   *
   * 1. HORIZONTAL GROUPS LAYOUT (Recommended for rich content):
   *    - sections: Array of horizontal groups with left/right content
   *    - Each section has a left side (text) and right side (media)
   *    - Sections stack vertically
   *
   * 2. SIMPLE LAYOUT:
   *    - description: HTML content in a single flow
   *
   * Example horizontal groups structure:
   * "child-id": {
   *   title: "Project Title",
   *   sections: [
   *     {
   *       left: `<h3>Updates:</h3><p>Latest updates...</p>`,
   *       right: `<img src="assets/image1.jpg" alt="Image">`
   *     },
   *     {
   *       left: `<h3>To-Do:</h3><ul><li>Task 1</li></ul>`,
   *       right: `<iframe src="..."></iframe>`
   *     }
   *   ]
   * }
   *
   * Example simple structure:
   * "child-id": {
   *   title: "Simple Title",
   *   description: `<p>Your content here...</p>`
   * }
   *
   * CUSTOMIZATION TIPS:
   * - Title gets an underline automatically and is centered
   * - Each section is a horizontal row (left text + right media)
   * - Sections stack on top of each other
   * - You can have as many sections as you want
   * - On mobile, each section's content stacks vertically
   * - Use h3 tags for section headers
   */
  const POPUP_CONTENT = {
    "teams-1": {
      title: "VT BAJA SAE",
      sections: [
        {
          left: `
            <h3>Updates:</h3>
            <p>Breadboard works now 👍</p>
            <p>Range tested - 695m range (range should be higher)</p>
          `,
          right: `
            <img src="assets/me.jpg" alt="BAJA SAE Car">
          `
        },
        {
          left: `
            <h3>To-Do:</h3>
            <ul>
              <li>Redo Range test with better practices</li>
              <li>Improve antenna positioning</li>
            </ul>
          `,
          right: `
            <img src="assets/me.jpg" alt="Team Photo">
          `
        }
      ]
    },
    "teams-2": {
      title: "VT CRO WORKCELL",
      description: `
        <p>Description of the VT CRO Workcell project goes here.</p>
        <p>Add details about what you did, technologies used, and outcomes.</p>
      `
    },
    "teams-3": {
      title: "HEVT",
      description: `
        <p>Description of the HEVT project goes here.</p>
      `
    },
    "teams-4": {
      title: "VEX ROBOTICS",
      description: `
        <p>Description of your VEX Robotics experience goes here.</p>
      `
    },
    "proj-1": {
      title: "Hand Tracking",
      sections: [
        {
          left: `
            <h3>Description:</h3>
            <p>A computer vision project that tracks hand movements in real-time.</p>
            <h3>Technologies Used:</h3>
            <ul>
              <li>Python + OpenCV</li>
              <li>MediaPipe</li>
              <li>TensorFlow</li>
            </ul>
          `,
          right: `
            <img src="assets/me.jpg" alt="Hand tracking demo">
          `
        },
        {
          left: `
            <h3>Status:</h3>
            <p>✅ Completed</p>
            <h3>Demo:</h3>
            <p>Watch the video to see it in action →</p>
          `,
          right: `
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Demo video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          `
        }
      ]
    },
    "proj-2": {
      title: "THE CUBE",
      description: `
        <p>Description of THE CUBE project goes here.</p>
      `
    },
    "about-1": {
      title: "Bio",
      description: `
        <p>Write your bio here. Tell your story!</p>
      `
    },
    "about-2": {
      title: "Resume",
      description: `
        <p>Add resume highlights or a link to download your full resume.</p>
        <a href="#" target="_blank">Download Resume (PDF)</a>
      `
    },
    "about-3": {
      title: "Contact",
      description: `
        <p>Get in touch with me:</p>
        <ul>
          <li>Email: your.email@example.com</li>
          <li>LinkedIn: <a href="#" target="_blank">Your Profile</a></li>
          <li>GitHub: <a href="#" target="_blank">Your GitHub</a></li>
        </ul>
      `
    },
    "award-1": {
      title: "Arduino",
      description: `
        <p>Description of your Arduino award.</p>
      `
    },
    "award-2": {
      title: "Patent",
      description: `
        <p>Description of your patent.</p>
      `
    }
  };

  // DOM refs
  let nodeEls = [];
  let childNodeEls = new Map(); // parentId -> [childElements]
  let hoverRAF = 0;
  let openParents = new Set(); // Track which parent nodes have children open
  let animatingParents = new Set(); // Track which parents are currently animating
  let closeTimers = new Map(); // parentId -> timeout ID for delayed closing

  // Lines map: nodeEl -> svgPath
  const lines = new Map();
  const childLines = new Map(); // childEl -> svgPath

  // Popup refs
  const popup = document.getElementById("description-popup");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  const popupClose = document.querySelector(".popup-close");

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
      if (typeof childCfg.textSize === "number") {
        title.style.fontSize = `${childCfg.textSize}px`;
      }
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

    // Calculate constant stagger delay based on total animation time
    const totalAnimTime = 50; // Total time for all children to start animating
    const staggerDelay = children.length > 1 ? totalAnimTime / (children.length - 1) : 0;

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
      path.setAttribute("stroke", "rgba(255, 255, 255, 0.30)");
      path.setAttribute("stroke-width", "2.2");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("filter", "url(#softGlow)");
      svg.appendChild(path);
      childLines.set(el, path);

      // Animate to target position
      await sleep(i * staggerDelay);
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

    // Attach click and hover handlers to child nodes after they're rendered
    await sleep(100); // Small delay to ensure DOM is ready
    attachChildNodeClickHandlers();
    attachChildNodeHoverHandlers(parentCfg.id);
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

    // Calculate constant stagger delay for closing animation
    const totalAnimTime = 50; // Total time for all children to start closing // TO CHANGE LOOK AT THE OTHER ONE, AROUND LINE 314
    const staggerDelay = children.length > 1 ? totalAnimTime / (children.length - 1) : 0;

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

      await sleep(staggerDelay);
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

    // Prevent multiple simultaneous animations for the same parent
    if (animatingParents.has(parentId)) return;

    // Mark as animating
    animatingParents.add(parentId);

    try {
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
    } finally {
      // Always remove from animating set when done
      animatingParents.delete(parentId);
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
  // Popup functions
  // ----------------------------
  function showPopup(childId) {
    const content = POPUP_CONTENT[childId];
    if (!content) {
      console.warn(`No popup content found for child ID: ${childId}`);
      return;
    }

    popupTitle.textContent = content.title;

    // Check if using sections layout
    if (content.sections && Array.isArray(content.sections)) {
      // Horizontal groups stacked vertically
      const sectionsHTML = content.sections.map(section => `
        <div class="popup-section">
          <div class="popup-section-left">
            ${section.left || ''}
          </div>
          <div class="popup-section-right">
            ${section.right || ''}
          </div>
        </div>
      `).join('');

      popupBody.innerHTML = `<div class="popup-sections-container">${sectionsHTML}</div>`;
    } else if (content.leftColumn || content.rightColumn) {
      // Legacy two-column layout support
      popupBody.innerHTML = `
        <div class="popup-two-column">
          <div class="popup-left">
            ${content.leftColumn || ''}
          </div>
          <div class="popup-right">
            ${content.rightColumn || ''}
          </div>
        </div>
      `;
    } else {
      // Simple single-column layout
      popupBody.innerHTML = content.description || '';
    }

    popup.style.display = "flex";
    // Trigger reflow to enable transition
    void popup.offsetWidth;
    popup.classList.add("show");
  }

  function closePopup() {
    popup.classList.remove("show");
    setTimeout(() => {
      popup.style.display = "none";
    }, 300); // Match transition duration
  }

  // Setup close button and overlay click
  if (popupClose) {
    popupClose.addEventListener("click", closePopup);
  }

  if (popup) {
    popup.addEventListener("click", (e) => {
      // Close if clicking the overlay (not the content)
      if (e.target === popup) {
        closePopup();
      }
    });
  }

  // Close popup with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("show")) {
      closePopup();
    }
  });

  // ----------------------------
  // Hover management for parent nodes
  // ----------------------------
  function cancelCloseTimer(parentId) {
    const timer = closeTimers.get(parentId);
    if (timer) {
      clearTimeout(timer);
      closeTimers.delete(parentId);
    }
  }

  function scheduleClose(parentId) {
    // Cancel any existing timer first
    cancelCloseTimer(parentId);

    // Schedule close after delay (gives time to move cursor to children)
    const timer = setTimeout(() => {
      closeChildNodes(parentId);
      closeTimers.delete(parentId);
    }, 300); // 300ms delay before closing

    closeTimers.set(parentId, timer);
  }

  async function openChildNodes(parentId) {
    const parentCfg = NODES.find((n) => n.id === parentId);
    if (!parentCfg || !parentCfg.children || parentCfg.children.length === 0) return;

    const parentEl = nodeEls.find((el) => el.id === parentId);
    if (!parentEl) return;

    // Already open or animating - do nothing
    if (openParents.has(parentId) || animatingParents.has(parentId)) return;

    // Cancel any pending close
    cancelCloseTimer(parentId);

    // Mark as animating
    animatingParents.add(parentId);

    try {
      openParents.add(parentId);
      const children = renderChildNodes(parentCfg, parentEl);
      childNodeEls.set(parentId, children);
      await animateChildrenIn(parentCfg, parentEl, children);
    } finally {
      animatingParents.delete(parentId);
    }
  }

  async function closeChildNodes(parentId) {
    if (!openParents.has(parentId)) return;
    if (animatingParents.has(parentId)) return;

    const parentEl = nodeEls.find((el) => el.id === parentId);
    if (!parentEl) return;

    animatingParents.add(parentId);

    try {
      openParents.delete(parentId);
      const children = childNodeEls.get(parentId);
      if (children) {
        await animateChildrenOut(parentEl, children);
        childNodeEls.delete(parentId);
      }
    } finally {
      animatingParents.delete(parentId);
    }
  }

  // ----------------------------
  // Attach hover handlers for parent nodes
  // ----------------------------
  function attachNodeHoverHandlers() {
    nodeEls.forEach((nodeEl) => {
      const nodeId = nodeEl.dataset.nodeId;
      if (!nodeId) return;

      // Open on mouse enter
      nodeEl.addEventListener("mouseenter", () => {
        openChildNodes(nodeId);
      });

      // Schedule close on mouse leave (with delay)
      nodeEl.addEventListener("mouseleave", () => {
        scheduleClose(nodeId);
      });

      // Handle keyboard interaction (Enter/Space for accessibility)
      nodeEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleChildNodes(nodeId);
        }
      });
    });
  }

  // ----------------------------
  // Attach hover handlers to child nodes to keep parent open
  // ----------------------------
  function attachChildNodeHoverHandlers(parentId) {
    const children = childNodeEls.get(parentId);
    if (!children) return;

    for (const { el } of children) {
      // When hovering over a child, cancel the parent's close timer
      el.addEventListener("mouseenter", () => {
        cancelCloseTimer(parentId);
      });

      // When leaving a child, schedule close for the parent
      el.addEventListener("mouseleave", () => {
        scheduleClose(parentId);
      });
    }
  }

  // ----------------------------
  // Attach click handlers for child nodes to show popup
  // ----------------------------
  function attachChildNodeClickHandlers() {
    // This will be called after child nodes are rendered
    const allChildNodes = document.querySelectorAll(".child-node");
    allChildNodes.forEach((childEl) => {
      // Check if already has listener to avoid duplicates
      if (!childEl.dataset.hasPopupListener) {
        childEl.dataset.hasPopupListener = "true";
        childEl.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent parent node toggle
          const childId = childEl.id;
          showPopup(childId);
        });
      }
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
    animatingParents.clear();

    // Clear any pending close timers
    for (const timer of closeTimers.values()) {
      clearTimeout(timer);
    }
    closeTimers.clear();

    renderNodes();
    attachHoverLineTracking();
    attachNodeHoverHandlers();

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

/**
 * ===============================================
 * QUICK CUSTOMIZATION GUIDE
 * ===============================================
 *
 * TO ADD/EDIT POPUP CONTENT:
 * 1. Scroll to the POPUP_CONTENT object (around line 122)
 * 2. Find the child node ID (e.g., "teams-1", "proj-1")
 * 3. Use this template:
 *
 *    "your-node-id": {
 *      title: "Your Title Here",
 *      sections: [
 *        {
 *          left: `
 *            <h3>Updates:</h3>
 *            <p>Text content here</p>
 *          `,
 *          right: `
 *            <img src="path/to/image.jpg" alt="Description">
 *          `
 *        },
 *        {
 *          left: `
 *            <h3>To-Do:</h3>
 *            <ul>
 *              <li>Task 1</li>
 *              <li>Task 2</li>
 *            </ul>
 *          `,
 *          right: `
 *            <iframe src="https://youtube.com/embed/..."></iframe>
 *          `
 *        }
 *      ]
 *    }
 *
 * FEATURES:
 * - Title is centered with orange underline
 * - Horizontal sections (left: text, right: media) stack vertically
 * - Each section has a subtle divider line
 * - Add as many sections as you want
 * - Responsive (each section stacks on mobile)
 * - Supports images, videos, iframes, lists, and more
 * - Simple HTML - easy to customize!
 */
