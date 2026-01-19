(async () => {
  const stage = document.getElementById("stage");
  const blackout = document.getElementById("blackout");

  const WORD_COUNT = 50;
  const PHOTO_COUNT = 120;

  // ✅ Hardcode your photo filenames here (must exist in /assets/photos/)
  // Example file paths: assets/photos/01.jpg, assets/photos/IMG_1234.png, etc.
  const PHOTO_FILES = [
    "me.jpg",
    "bioandrewlanding.jpg",

    //"baja2.png",
    //"baja3.png",
    "baja1.jpg",
    
    "HEVT1.png",
    
    "workcell1.png"
    // add more...
  ];

  // Build full URLs from filenames
  const PHOTO_URLS = PHOTO_FILES.map((name) => `assets/photos/${name}`);

  const WORDS = [
    "hello","design","build","ideas","motion","curious","play","craft",
    "systems","type","detail","iterate","ship","learn","create","focus",
    "empathy","clarity","energy","solve","explore","future","signal",
    "rhythm","story","space","light","flow","care"
  ];

  let W = window.innerWidth;
  let H = window.innerHeight;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function pickPhotoUrl() {
    if (!PHOTO_URLS.length) return null;
    return pick(PHOTO_URLS);
  }

  const wordBubbles = [];
  const photoBubbles = [];

  function createWordBubble() {
    const el = document.createElement("div");
    el.className = "bubble word-bubble";
    el.textContent = pick(WORDS);
    stage.appendChild(el);

    const b = {
      el,
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-12, 12),
      vy: rand(20, 50),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.6, 1.4),
      wobbleAmp: rand(4, 14),
      scale: rand(0.8, 1.2),
      mode: Math.random() < 0.35 ? "pop" : "drift",
      hasPopped: false,
      popY: rand(0, H * 0.5)
    };

    el.style.opacity = rand(0.6, 0.95);
    return b;
  }

  function respawnWordBubble(b) {
    b.x = rand(0, W);
    b.y = H + rand(40, 200);
    b.vx = rand(-14, 14);
    b.vy = rand(20, 50);
    b.wobblePhase = rand(0, Math.PI * 2);
    b.wobbleSpeed = rand(0.6, 1.4);
    b.wobbleAmp = rand(4, 14);
    b.scale = rand(0.8, 1.2);
    b.mode = Math.random() < 0.35 ? "pop" : "drift";
    b.hasPopped = false;
    b.popY = rand(0, H * 0.5);
    b.el.textContent = pick(WORDS);
    b.el.classList.remove("pop");
    b.el.style.opacity = rand(0.6, 0.95);
  }

  function createPhotoBubble() {
    const el = document.createElement("div");
    el.className = "bubble photo-bubble";

    const url = pickPhotoUrl();
    if (url) {
      el.style.backgroundImage = `url("${url}")`;
    } else {
      el.style.backgroundImage = "none";
    }

    stage.appendChild(el);

    const b = {
      el,
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-12, 12),
      vy: rand(20, 50),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.6, 1.4),
      wobbleAmp: rand(4, 14),
      scale: rand(2.0, 2.2),
      mode: Math.random() < 0.35 ? "pop" : "drift",
      hasPopped: false,
      popY: rand(0, H * 0.5)
    };

    el.style.opacity = 0.75; //this is the opacity
    return b;
  }

  function respawnPhotoBubble(b) {
    b.x = rand(0, W);
    b.y = H + rand(40, 200);
    b.vx = rand(-14, 14);
    b.vy = rand(20, 50);
    b.wobblePhase = rand(0, Math.PI * 2);
    b.wobbleSpeed = rand(0.6, 1.4);
    b.wobbleAmp = rand(4, 14);
    b.scale = rand(2.0, 2.2);
    b.mode = Math.random() < 0.35 ? "pop" : "drift";
    b.hasPopped = false;
    b.popY = rand(0, H * 0.5);

    const url = pickPhotoUrl();
    if (url) {
      b.el.style.backgroundImage = `url("${url}")`;
    } else {
      b.el.style.backgroundImage = "none";
    }

    b.el.classList.remove("pop");
    b.el.style.opacity = rand(0.6, 0.95);
  }

  // Spawn word bubbles
  for (let i = 0; i < WORD_COUNT; i++) {
    const b = createWordBubble();
    b.y = rand(0, H + 600);
    wordBubbles.push(b);
  }

  // Spawn photo bubbles
  for (let i = 0; i < PHOTO_COUNT; i++) {
    const b = createPhotoBubble();
    b.y = rand(0, H + 600);
    photoBubbles.push(b);
  }

  // Center bubble
  const centerEl = document.createElement("div");
  centerEl.className = "bubble center-bubble";

  const img = document.createElement("img");
  img.src = "assets/me.jpg"; // make sure this file exists

  const text = document.createElement("div");
  text.className = "enter-text";
  text.textContent = "Click To Enter";

  centerEl.appendChild(img);
  centerEl.appendChild(text);
  stage.appendChild(centerEl);

  const centerState = {
    x: W * 0.5 - 105,
    y: H * 0.5 - 105,
    vx: 0,
    vy: 0,
    t: 0,
    wiggleStrength: 18,
    hoverScale: 1
  };

  const SPRING_K = 18;
  const SPRING_DAMP = 7.5;

  let lastTs = performance.now();
  let bursting = false;

  function setCenterTransform(x, y, s = 1) {
    centerEl.style.setProperty("--tx", `${x}px`);
    centerEl.style.setProperty("--ty", `${y}px`);
    centerEl.style.transform = `translate(${x}px, ${y}px) scale(${s})`;

    blackout.style.left = `${x + 105}px`;
    blackout.style.top = `${y + 105}px`;
  }

  centerEl.addEventListener("mouseenter", () => {
    if (bursting) return;
    centerState.hoverScale = 1.15;
    centerEl.classList.add("hovered");
  });

  centerEl.addEventListener("mouseleave", () => {
    if (bursting) return;
    centerState.hoverScale = 1;
    centerEl.classList.remove("hovered");
  });

  centerEl.addEventListener("click", () => {
    if (bursting) return;
    bursting = true;
    stage.classList.add("no-pointer");
    centerEl.classList.remove("hovered");
    centerEl.classList.add("bursting");
  });

  centerEl.addEventListener("animationend", (e) => {
    if (e.animationName === "centerBurst") {
      blackout.classList.add("active");
      blackout.addEventListener(
        "animationend",
        () => {
          window.location.href = "transition.html";
        },
        { once: true }
      );
    }
  });

  function stepBubble(b, dt, respawnFn) {
    b.y -= b.vy * dt;
    b.x += b.vx * dt;

    b.wobblePhase += b.wobbleSpeed * dt;
    const wob = Math.sin(b.wobblePhase) * b.wobbleAmp;

    if (b.mode === "pop" && !b.hasPopped && b.y < b.popY) {
      b.hasPopped = true;
      b.el.classList.add("pop");
      b.el.addEventListener("animationend", () => respawnFn(b), { once: true });
    }

    if (b.y < -120) respawnFn(b);

    const tx = b.x + wob;
    const ty = b.y;

    b.el.style.setProperty("--tx", `${tx}px`);
    b.el.style.setProperty("--ty", `${ty}px`);
    b.el.style.setProperty("--s", b.scale);

    if (!b.el.classList.contains("pop")) {
      b.el.style.transform = `translate(${tx}px, ${ty}px) scale(${b.scale})`;
    }
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;

    for (const b of wordBubbles) stepBubble(b, dt, respawnWordBubble);
    for (const b of photoBubbles) stepBubble(b, dt, respawnPhotoBubble);

    const targetX = W * 0.5 - 105;
    const targetY = H * 0.5 - 105;

    centerState.t += dt;
    const wigX = Math.sin(centerState.t * 1.1) * centerState.wiggleStrength;
    const wigY = Math.cos(centerState.t * 0.9) * centerState.wiggleStrength * 0.7;

    const tx = targetX + wigX;
    const ty = targetY + wigY;

    const dx = tx - centerState.x;
    const dy = ty - centerState.y;

    const ax = SPRING_K * dx - SPRING_DAMP * centerState.vx;
    const ay = SPRING_K * dy - SPRING_DAMP * centerState.vy;

    centerState.vx += ax * dt;
    centerState.vy += ay * dt;

    centerState.x += centerState.vx * dt;
    centerState.y += centerState.vy * dt;

    if (!bursting) {
      setCenterTransform(centerState.x, centerState.y, centerState.hoverScale);
    } else {
      centerEl.style.setProperty("--tx", `${centerState.x}px`);
      centerEl.style.setProperty("--ty", `${centerState.y}px`);
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;
  });

  setCenterTransform(centerState.x, centerState.y, 1);
  requestAnimationFrame(tick);
})();
