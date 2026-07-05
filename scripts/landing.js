(async () => {
  const stage = document.getElementById("stage");
  const blackout = document.getElementById("blackout");

  // Fewer bubbles on small screens - the same counts that look lively spread
  // across a wide desktop viewport just feel cluttered packed into a phone's
  // width.
  const isSmallScreen = window.innerWidth <= 768;

  // Bubbles never auto-pop - they float up and get removed once off screen,
  // unless clicked, in which case they pop immediately. Automatic popping
  // logic is left in place (see randomPopY/bubbleMode) to bring back later.
  const POP_ENABLED = false;

  const WORD_COUNT = isSmallScreen ? 16 : 40;

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
    "workcell6.PNG",

    // Guitar
    "guitar1.jpg",
    "guitar2.jpg",
    "guitar5.jpg",

    // Other
    "hitachi1.png",
    "hitachi3.jpg",
    "patent1.png",
    "handtrack1.png",
    "cube1.png",
    "cube2.jpg",
    "cube5.png",
    "cube20.jpg",
    // add more...
  ];

  // Build full URLs, pointing at the small pre-generated thumbnails (always .jpg)
  // instead of the multi-megabyte originals used by explore.html's gallery.
  // Regenerate via `python scripts/generate_thumbs.py` after adding/changing photos.
  const PHOTO_URLS = PHOTO_FILES.map((name) => {
    const stem = name.replace(/\.[^.]+$/, "");
    return `assets/photos/thumbs/${stem}.jpg`;
  });

  // Stay below unique image count so there's always a free image to pick (no duplicates)
  const PHOTO_COUNT = isSmallScreen
    ? Math.min(12, PHOTO_URLS.length)
    : PHOTO_URLS.length;

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

  // Desktop pops bubbles just above the screen (unchanged, by request). On
  // mobile that made the pop invisible, so there it pops anywhere on
  // screen instead.
  function randomPopY() {
    return isSmallScreen ? rand(0, H) : rand(-150, -20);
  }

  // Pops only while POP_ENABLED is on; otherwise bubbles just float up and
  // get removed once off screen (see the "b.y < -120" respawn fallback in
  // stepBubble) unless clicked.
  function bubbleMode() {
    return POP_ENABLED ? "pop" : "float";
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
      mode: bubbleMode(),
      hasPopped: false,
      popY: randomPopY()
    };

    // Bubbles don't auto-pop (see POP_ENABLED) - a click/tap pops them
    // instead. Attached once here since respawnBubble reuses this same
    // element/b pair rather than recreating it.
    el.addEventListener("click", () => triggerPop(b, respawnBubble));

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
    b.mode = bubbleMode();
    b.hasPopped = false;
    b.popY = randomPopY();

    if (isPhoto) {
      const url = pickUniquePhotoUrl(b);
      b.photoUrl = url;
      b.el.style.backgroundImage = url ? `url("${url}")` : "none";
    } else {
      b.el.textContent = pick(WORDS);
    }

    b.el.classList.remove("pop");
    // Clear (not "none") - an inline "none" would permanently override the
    // .pop class's animation via inline-style precedence, silently
    // preventing this element from ever animating on a future pop.
    b.el.style.animation = "";
    b.el.style.opacity = isPhoto ? 0.75 : rand(0.6, 0.95);
  }

  // Spawn bubbles gradually across a handful of frames instead of all at once,
  // so creating ~70 DOM nodes + background-images doesn't block the first paint.
  function spawnGradually(count, type, arr, initBubble, perFrame = 8) {
    let created = 0;
    function step() {
      const end = Math.min(count, created + perFrame);
      for (; created < end; created++) {
        const b = createBubble(type);
        initBubble(b);
        arr.push(b);
      }
      if (created < count) requestAnimationFrame(step);
    }
    step();
  }

  // Spawn word bubbles. On mobile, popY can be a real on-screen position
  // (unlike desktop's off-screen negative one), so the initial spread must
  // stay below every possible pop line - otherwise bubbles spawn already
  // past their own pop point and instantly fake-pop on page load. popY
  // now goes up to H itself, so the floor has to clear all of it.
  const initialSpawnFloor = isSmallScreen ? H + 20 : 0;

  spawnGradually(WORD_COUNT, "word", wordBubbles, (b) => {
    b.y = rand(initialSpawnFloor, H + 600);
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale})`;
  });

  // Spawn photo bubbles - spread them out across the screen
  spawnGradually(PHOTO_COUNT, "photo", photoBubbles, (b) => {
    b.x = rand(0, W);
    b.y = rand(isSmallScreen ? initialSpawnFloor : -100, H + 100);
    b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale})`;
  });

  // Center bubble
  const centerEl = document.createElement("div");
  centerEl.className = "bubble center-bubble";

  const img = document.createElement("img");
  img.src = "assets/photos/thumbs/me-avatar.jpg"; // small thumbnail; make sure this file exists

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

  // Half the center bubble's rendered size (CSS shrinks it on small screens),
  // used to keep the bubble truly centered instead of assuming a fixed 210px size.
  let centerHalf = centerEl.offsetWidth / 2;

  const centerState = {
    x: W * 0.5 - centerHalf,
    y: H * 0.5 - centerHalf,
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

    blackout.style.left = `${x + centerHalf}px`;
    blackout.style.top = `${y + centerHalf}px`;
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

  // Shared by the automatic pop check and click-to-pop, so both play the
  // same burst animation and respawn the same way.
  function triggerPop(b, respawnFn) {
    if (b.hasPopped) return;
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

  function stepBubble(b, dt, respawnFn) {
    // Once popped, the CSS animation + triggerPop's own respawn timer own
    // this bubble entirely. Physics used to keep running here, which could
    // carry it past the "b.y < -120" off-screen check below and force an
    // early respawn mid-animation - yanking the pop class off and making it
    // just vanish instead of finishing the burst.
    if (b.hasPopped) return;

    b.y -= b.vy * dt;
    b.x += b.vx * dt;

    b.wobblePhase += b.wobbleSpeed * dt;
    const wob = Math.sin(b.wobblePhase) * b.wobbleAmp;

    if (b.mode === "pop" && b.y < b.popY) {
      triggerPop(b, respawnFn);
    }

    if (b.y < -120) respawnFn(b);

    const tx = b.x + wob;
    const ty = b.y;

    b.el.style.setProperty("--tx", `${tx}px`);
    b.el.style.setProperty("--ty", `${ty}px`);
    b.el.style.setProperty("--s", b.scale);
    b.el.style.transform = `translate(${tx}px, ${ty}px) scale(${b.scale})`;
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;

    for (const b of wordBubbles) stepBubble(b, dt, respawnBubble);
    for (const b of photoBubbles) stepBubble(b, dt, respawnBubble);

    const targetX = W * 0.5 - centerHalf;
    const targetY = H * 0.5 - centerHalf;

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
    centerHalf = centerEl.offsetWidth / 2;
  });

  setCenterTransform(centerState.x, centerState.y, 1);
  requestAnimationFrame(tick);
})();
