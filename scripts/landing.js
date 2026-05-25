(async () => {
  const stage = document.getElementById("stage");
  const blackout = document.getElementById("blackout");

  const WORD_COUNT = 40;

  // ✅ Hardcode your photo filenames here (must exist in /assets/photos/)
  // Example file paths: assets/photos/01.jpg, assets/photos/IMG_1234.png, etc.
  const PHOTO_FILES = [
    // Me
    "me3.jpg",
    "me4.jpg",
    "bioandrewlanding.jpg",

    // HEVT
    "hevt1.png",
    "hevt2.png",
    "hevt3.jpg",
    "hevt4.png",
    "hevt6.png",
    "hevt7.png",
    "hevt8.png",
    "hevt9.png",
    "hevt11.png",

    // Baja
    "baja1.jpg",

    // VEX
    "vex1.jpg",
    "vex3.jpg",
    "vex5.jpg",
    "vex6.jpg",
    "vex19.png",

    // Workcell
    "workcell1.png",
    "workcell3.png",
    "workcell5.png",

    // Guitar
    "guitar1.jpg",
    "guitar2.jpg",
    "guitar5.jpg",

    // Other
    "patent1.png",
    "handtrack1.png",
    "cube1.png",
    "cube2.jpg",
    "cube5.png",
    "cube20.jpg",
    // add more...
  ];

  // Build full URLs from filenames
  const PHOTO_URLS = PHOTO_FILES.map((name) => `assets/photos/${name}`);

  // Stay below unique image count so there's always a free image to pick (no duplicates)
  const PHOTO_COUNT = PHOTO_URLS.length;

  const WORDS = [
    "engineer","build","innovate","curious","create","solder","prototype",
    "systems","leader","iterate","embedded","design","collaborate",
    "maker","inventor","circuits","precision","driven","problem-solver",
    "hardware","software","technical","visionary","passionate"
  ];

  let W = window.innerWidth;
  let H = window.innerHeight;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function pickUniquePhotoUrl(excludeBubble) {
    if (!PHOTO_URLS.length) return null;
    const inUse = new Set();
    for (const b of photoBubbles) {
      if (b === excludeBubble) continue;
      if (b.photoUrl && !b.hasPopped && b.y >= -150 && b.y <= H + 150) {
        inUse.add(b.photoUrl);
      }
    }
    const available = PHOTO_URLS.filter(url => !inUse.has(url));
    return available.length > 0 ? pick(available) : pick(PHOTO_URLS);
  }

  const wordBubbles = [];
  const photoBubbles = [];

  // Unified bubble creation
  function createBubble(type) {
    const isPhoto = type === "photo";
    const el = document.createElement("div");
    el.className = isPhoto ? "bubble photo-bubble" : "bubble word-bubble";

    let photoUrl = null;
    if (isPhoto) {
      photoUrl = pickUniquePhotoUrl();
      el.style.backgroundImage = photoUrl ? `url("${photoUrl}")` : "none";
    } else {
      el.textContent = pick(WORDS);
    }

    stage.appendChild(el);

    const scaleRange = isPhoto ? [1.2, 1.8] : [0.8, 1.2];

    const b = {
      el,
      type,
      photoUrl,
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-12, 12),
      vy: rand(30, 65),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.6, 1.4),
      wobbleAmp: rand(4, 14),
      scale: rand(scaleRange[0], scaleRange[1]),
      mode: "pop", // All bubbles pop
      hasPopped: false,
      popY: rand(-150, -20) // Pop just above the screen
    };

    el.style.opacity = isPhoto ? 0.75 : rand(0.6, 0.95);
    el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale})`;
    return b;
  }

  // Unified bubble respawn
  function respawnBubble(b) {
    const isPhoto = b.type === "photo";
    const scaleRange = isPhoto ? [1.2, 1.8] : [0.8, 1.2];

    b.x = rand(0, W);
    b.y = H + rand(20, 80); // Spawn closer to bottom edge so they appear sooner
    b.vx = rand(-14, 14);
    b.vy = rand(30, 65);
    b.wobblePhase = rand(0, Math.PI * 2);
    b.wobbleSpeed = rand(0.6, 1.4);
    b.wobbleAmp = rand(4, 14);
    b.scale = rand(scaleRange[0], scaleRange[1]);
    b.mode = "pop"; // All bubbles pop
    b.hasPopped = false;
    b.popY = rand(-150, -20); // Pop just above the screen

    if (isPhoto) {
      const url = pickUniquePhotoUrl(b);
      b.photoUrl = url;
      b.el.style.backgroundImage = url ? `url("${url}")` : "none";
    } else {
      b.el.textContent = pick(WORDS);
    }

    b.el.classList.remove("pop");
    b.el.style.animation = "none";
    b.el.style.opacity = isPhoto ? 0.75 : rand(0.6, 0.95);
  }

  // Spawn word bubbles
  for (let i = 0; i < WORD_COUNT; i++) {
    const b = createBubble("word");
    b.y = rand(0, H + 600);
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale})`;
    wordBubbles.push(b);
  }

  // Spawn photo bubbles - spread them out across the screen
  for (let i = 0; i < PHOTO_COUNT; i++) {
    const b = createBubble("photo");
    b.x = rand(0, W);
    b.y = rand(-100, H + 100);
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale})`;
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

  // Click hint with arrow
  const hint = document.createElement("div");
  hint.className = "click-hint";
  hint.innerHTML = '<span class="hint-arrow">&#8592;</span> Click here';

  centerEl.appendChild(img);
  centerEl.appendChild(text);
  centerEl.appendChild(hint);
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
      // Use both animationend and a timeout fallback to ensure respawn
      let respawned = false;
      const doRespawn = () => {
        if (respawned) return;
        respawned = true;
        respawnFn(b);
      };
      b.el.addEventListener("animationend", doRespawn, { once: true });
      setTimeout(doRespawn, 400); // Fallback in case animationend doesn't fire
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

    for (const b of wordBubbles) stepBubble(b, dt, respawnBubble);
    for (const b of photoBubbles) stepBubble(b, dt, respawnBubble);

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
