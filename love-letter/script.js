const PASSWORD = "1231";

// 7 columns x 6 rows pixel heart
const HEART_MAP = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

// builds a box-shadow string that stamps a copy of a 1px element for every
// non-"0" cell in the map; colorFor maps the cell character to a color
function buildPixelShadow(map, size, colorFor) {
  const shadows = [];
  map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== "0") {
        shadows.push(`${x * size}px ${y * size}px 0 0 ${colorFor(cell)}`);
      }
    });
  });
  return shadows.join(", ");
}

function drawPixelHeart() {
  const frame = document.getElementById("heart-frame");
  const heart = document.getElementById("pixel-heart");
  const size = 12; // px per pixel
  const cols = HEART_MAP[0].length;
  const rows = HEART_MAP.length;

  // the frame reserves the full heart's footprint in the layout;
  // the pixel itself stays 1 pixel and box-shadow stamps out copies of it
  frame.style.width = `${cols * size}px`;
  frame.style.height = `${rows * size}px`;
  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;
  heart.style.boxShadow = buildPixelShadow(HEART_MAP, size, () => "currentColor");
}

// ---- falling flower wall transition ----
// watercolor-style flowers rain down and pile into a wall that covers the
// whole screen; the page swaps underneath, then the wall clears away

const WALL_PALETTES = [
  { pale: "#fbeaef", base: "#f4c8d5", edge: "#e79cb4", deep: "#d5738f" },
  { pale: "#fdf3f5", base: "#f7d8e0", edge: "#eeb3c4", deep: "#dd8ba3" },
  { pale: "#f9dfe7", base: "#f1b9ca", edge: "#e290ab", deep: "#c96f89" },
  { pale: "#fff7f8", base: "#fce8ec", edge: "#f2c4cf", deep: "#e3a1b1" },
];

let flowerSeq = 0;

const rand = (min, max) => min + Math.random() * (max - min);

// rounded petal pointing up from the flower's center (50,50); notch splits the tip
function petalPath(halfW, len, notch) {
  const tip = 50 - len;
  if (!notch) {
    return (
      `M50 50 ` +
      `C ${50 - halfW} ${50 - len * 0.2} ${50 - halfW} ${tip + len * 0.25} 50 ${tip} ` +
      `C ${50 + halfW} ${tip + len * 0.25} ${50 + halfW} ${50 - len * 0.2} 50 50 Z`
    );
  }
  const dip = tip + len * 0.14;
  return (
    `M50 50 ` +
    `C ${50 - halfW} ${50 - len * 0.15} ${50 - halfW} ${tip + len * 0.3} ${50 - halfW * 0.45} ${tip + len * 0.05} ` +
    `C ${50 - halfW * 0.18} ${tip - len * 0.02} 50 ${dip} 50 ${dip} ` +
    `C 50 ${dip} ${50 + halfW * 0.18} ${tip - len * 0.02} ${50 + halfW * 0.45} ${tip + len * 0.05} ` +
    `C ${50 + halfW} ${tip + len * 0.3} ${50 + halfW} ${50 - len * 0.15} 50 50 Z`
  );
}

function petalRing(count, halfW, len, fill, opts = {}) {
  const { notch = false, offset = 0, stroke, jitter = 5 } = opts;
  const d = petalPath(halfW, len, notch);
  let out = "";
  for (let i = 0; i < count; i++) {
    const angle = (offset + (360 / count) * i + rand(-jitter, jitter)).toFixed(1);
    const scale = rand(0.93, 1.07).toFixed(3);
    out +=
      `<path d="${d}" fill="${fill}"` +
      (stroke ? ` stroke="${stroke}" stroke-opacity="0.35" stroke-width="0.7"` : "") +
      ` transform="rotate(${angle} 50 50) translate(50 50) scale(${scale}) translate(-50 -50)"/>`;
  }
  return out;
}

function dotRing(count, radius, r, fill) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + rand(-0.15, 0.15);
    const cx = (50 + Math.cos(a) * radius).toFixed(1);
    const cy = (50 + Math.sin(a) * radius).toFixed(1);
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }
  return out;
}

// __P__ = petal gradient (deeper base, pale tip), __G__ = soft center shading
function wrapFlower(body, palette) {
  const id = `fw${flowerSeq++}`;
  return (
    `<svg viewBox="0 0 100 100" aria-hidden="true">` +
    `<defs>` +
    `<linearGradient id="${id}-p" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0%" stop-color="${palette.base}"/>` +
    `<stop offset="100%" stop-color="${palette.pale}"/>` +
    `</linearGradient>` +
    `<radialGradient id="${id}-g" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${palette.deep}" stop-opacity="0.35"/>` +
    `<stop offset="60%" stop-color="${palette.deep}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>` +
    body.replaceAll("__P__", `url(#${id}-p)`).replaceAll("__G__", `url(#${id}-g)`) +
    `</svg>`
  );
}

const FLOWER_BUILDERS = [
  // dogwood blossom: notched petals, green-gold center
  (p) =>
    wrapFlower(
      petalRing(5, 16, 41, p.edge, { notch: true, offset: 36, jitter: 3 }) +
        petalRing(5, 17, 43, "__P__", { notch: true, stroke: p.deep, jitter: 3 }) +
        `<circle cx="50" cy="50" r="30" fill="__G__"/>` +
        `<circle cx="50" cy="50" r="5.5" fill="#cdd48e" stroke="#9aa661" stroke-width="0.8"/>` +
        dotRing(8, 7.5, 1.2, "#e3b54e"),
      p
    ),
  // ranunculus rose: concentric rings deepening toward the center
  (p) =>
    wrapFlower(
      petalRing(9, 13, 43, "__P__", { stroke: p.deep }) +
        petalRing(8, 11, 34, p.base, { offset: 20, stroke: p.deep }) +
        `<circle cx="50" cy="50" r="30" fill="__G__"/>` +
        petalRing(7, 9, 26, p.edge, { offset: 8, stroke: p.deep }) +
        petalRing(6, 7, 18, p.deep, { offset: 30 }) +
        `<circle cx="50" cy="50" r="5" fill="${p.deep}"/>` +
        `<circle cx="49" cy="49" r="2.2" fill="${p.pale}" opacity="0.7"/>`,
      p
    ),
  // anemone: broad petals around a dark plum center
  (p) =>
    wrapFlower(
      petalRing(7, 15, 42, p.base, { stroke: p.deep, jitter: 4 }) +
        petalRing(7, 13, 35, "__P__", { offset: 25, stroke: p.deep, jitter: 4 }) +
        `<circle cx="50" cy="50" r="26" fill="__G__"/>` +
        `<circle cx="50" cy="50" r="8.5" fill="#4c3654"/>` +
        dotRing(11, 11.5, 1.4, "#8b6f99") +
        `<circle cx="50" cy="50" r="3.2" fill="#2d1f33"/>`,
      p
    ),
  // dahlia: many slim petals, golden center
  (p) =>
    wrapFlower(
      petalRing(15, 6, 44, p.edge, { jitter: 4 }) +
        petalRing(13, 5.5, 35, "__P__", { offset: 12, jitter: 4 }) +
        petalRing(10, 5, 25, p.pale, { offset: 5, jitter: 4 }) +
        `<circle cx="50" cy="50" r="24" fill="__G__"/>` +
        `<circle cx="50" cy="50" r="6.5" fill="#e0a23e" stroke="#b97f2a" stroke-width="0.8"/>` +
        dotRing(9, 4.2, 1, "#f6d489"),
      p
    ),
];

function createWallFlower(x, y, size, delayMs, durMs) {
  const el = document.createElement("div");
  el.className = "wall-flower";
  const build = FLOWER_BUILDERS[Math.floor(Math.random() * FLOWER_BUILDERS.length)];
  const palette = WALL_PALETTES[Math.floor(Math.random() * WALL_PALETTES.length)];
  el.innerHTML = build(palette);

  el.style.left = `${x - size / 2}px`;
  el.style.top = `${y - size / 2}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.setProperty("--fall-from", `${-(y + size / 2 + 40)}px`);
  el.style.setProperty("--dx", `${Math.round(rand(-30, 30))}px`);
  el.style.setProperty("--rot-a", `${Math.round(rand(-70, 70))}deg`);
  el.style.setProperty("--rot-b", `${Math.round(rand(-20, 20))}deg`);
  el.style.setProperty("--fall-delay", `${Math.round(delayMs)}ms`);
  el.style.setProperty("--fall-dur", `${Math.round(durMs)}ms`);
  return el;
}

function spawnFlowerWall(onCovered) {
  const overlay = document.createElement("div");
  overlay.id = "flower-overlay";

  const W = window.innerWidth;
  const H = window.innerHeight;
  const base = Math.max(90, Math.min(150, W / 3.4));
  const spacing = base * 0.59;
  const cols = Math.ceil(W / spacing) + 1;
  const rows = Math.ceil(H / spacing) + 1;

  let coveredAt = 0;
  let droppedAt = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const size = base * rand(0.85, 1.35);
      const x = c * spacing + rand(-0.3, 0.3) * spacing;
      const y = r * spacing + rand(-0.3, 0.3) * spacing;
      // bottom rows land first so the wall piles upward
      const delay = (rows - 1 - r) * 70 + rand(0, 500);
      const dur = rand(850, 1500);
      coveredAt = Math.max(coveredAt, delay + dur);
      const flower = createWallFlower(x, y, size, delay, dur);

      // the wall crumbles from the bottom up when it clears
      const dropDelay = ((H - y) / H) * 150 + rand(0, 320);
      const dropDur = rand(650, 1100);
      droppedAt = Math.max(droppedAt, dropDelay + dropDur);
      flower.style.setProperty("--drop-delay", `${Math.round(dropDelay)}ms`);
      flower.style.setProperty("--drop-dur", `${Math.round(dropDur)}ms`);
      flower.style.setProperty("--dx2", `${Math.round(rand(-40, 40))}px`);
      flower.style.setProperty("--rot-c", `${Math.round(rand(-90, 90))}deg`);

      overlay.appendChild(flower);
    }
  }

  document.body.appendChild(overlay);

  setTimeout(() => {
    onCovered();
    // hold the full bloom for a beat, then let it all drop off the screen
    setTimeout(() => {
      overlay.classList.add("dropping");
      setTimeout(() => overlay.remove(), droppedAt + 200);
    }, 700);
  }, coveredAt + 150);
}

function initLock() {
  const dots = [...document.querySelectorAll(".dot")];
  const lockScreen = document.getElementById("lock-screen");
  const mainContent = document.getElementById("main-content");
  let entered = "";

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle("filled", i < entered.length);
    });
  }

  function reset() {
    entered = "";
    updateDots();
  }

  function unlock() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      lockScreen.classList.add("unlocking");
      setTimeout(() => {
        lockScreen.hidden = true;
        mainContent.hidden = false;
      }, 600);
      return;
    }

    // the lock screen stays put while the wall builds over it; only once
    // the viewport is fully covered does the page swap underneath, so the
    // transition itself is never visible
    spawnFlowerWall(() => {
      lockScreen.hidden = true;
      mainContent.hidden = false;
    });
  }

  function wrongAttempt() {
    lockScreen.classList.add("shake");
    setTimeout(() => {
      lockScreen.classList.remove("shake");
      reset();
    }, 400);
  }

  function addDigit(digit) {
    if (entered.length >= PASSWORD.length) return;
    entered += digit;
    updateDots();

    if (entered.length === PASSWORD.length) {
      setTimeout(() => {
        entered === PASSWORD ? unlock() : wrongAttempt();
      }, 150);
    }
  }

  function removeDigit() {
    entered = entered.slice(0, -1);
    updateDots();
  }

  document.querySelectorAll(".key[data-digit]").forEach((key) => {
    key.addEventListener("click", () => addDigit(key.dataset.digit));
  });

  document.getElementById("backspace").addEventListener("click", removeDigit);

  document.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") addDigit(e.key);
    if (e.key === "Backspace") removeDigit();
  });
}

// ---- picture puzzle ----

function scatterBgFlowers() {
  const host = document.querySelector(".bg-flowers");
  for (let i = 0; i < 10; i++) {
    const d = document.createElement("div");
    d.className = "bg-flower";
    const build = FLOWER_BUILDERS[Math.floor(Math.random() * FLOWER_BUILDERS.length)];
    const palette = WALL_PALETTES[Math.floor(Math.random() * WALL_PALETTES.length)];
    d.innerHTML = build(palette);
    const size = rand(70, 180);
    d.style.width = `${size}px`;
    d.style.height = `${size}px`;
    d.style.left = `${rand(-6, 94)}%`;
    d.style.top = `${rand(-6, 94)}%`;
    d.style.opacity = rand(0.15, 0.38).toFixed(2);
    d.style.transform = `rotate(${Math.round(rand(0, 360))}deg)`;
    host.appendChild(d);
  }
}

function initPuzzle() {
  const COLS = 3;
  const ROWS = 4;
  const N = COLS * ROWS;
  const board = document.getElementById("puzzle-board");
  const screen = document.getElementById("puzzle-screen");
  const nextScreen = document.getElementById("envelope-screen");

  // slotOf[i] = which slot tile i currently sits in (tile i belongs in slot i)
  let slotOf = [...Array(N).keys()];
  do {
    for (let i = slotOf.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slotOf[i], slotOf[j]] = [slotOf[j], slotOf[i]];
    }
  } while (slotOf.some((s, i) => s === i)); // keep scrambling until nothing is home

  const tiles = [];
  let selected = null;
  let locked = false;

  function place(i) {
    tiles[i].style.setProperty("--c", slotOf[i] % COLS);
    tiles[i].style.setProperty("--r", Math.floor(slotOf[i] / COLS));
  }

  function onTap(i) {
    if (locked) return;
    if (selected === null) {
      selected = i;
      tiles[i].classList.add("selected");
      return;
    }
    tiles[selected].classList.remove("selected");
    if (selected !== i) {
      [slotOf[selected], slotOf[i]] = [slotOf[i], slotOf[selected]];
      place(selected);
      place(i);
      setTimeout(checkSolved, 400); // let the swap animation finish first
    }
    selected = null;
  }

  function checkSolved() {
    if (slotOf.some((s, i) => s !== i)) return;
    locked = true;
    // gaps close and corners square off so the tiles fuse into one photo,
    // which holds for a moment before giving way to the envelope
    board.classList.add("solved");
    setTimeout(() => {
      screen.classList.add("fading");
      setTimeout(() => {
        screen.hidden = true;
        nextScreen.hidden = false;
      }, 650);
    }, 1900);
  }

  for (let i = 0; i < N; i++) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    tile.style.backgroundPosition = `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
    tile.addEventListener("click", () => onTap(i));
    tiles.push(tile);
    place(i);
    board.appendChild(tile);
  }
}

// ---- envelope ----

function initEnvelope() {
  const envelope = document.getElementById("envelope");
  const envScreen = document.getElementById("envelope-screen");
  const playerScreen = document.getElementById("player-screen");
  let opened = false;

  envelope.addEventListener("click", () => {
    if (opened) return;
    opened = true;
    // flap folds open, then the camera dives into the envelope
    envelope.classList.add("open");
    setTimeout(() => envScreen.classList.add("zooming"), 500);
    setTimeout(() => {
      envScreen.hidden = true;
      playerScreen.hidden = false;
    }, 1400);
  });
}

// ---- voice recording player ----

function initPlayer() {
  const audio = document.getElementById("voice-audio");
  const playBtn = document.getElementById("play");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const seek = document.getElementById("seek");
  const curEl = document.getElementById("time-cur");
  const durEl = document.getElementById("time-dur");
  let scrubbing = false;

  const fmt = (s) =>
    Number.isFinite(s)
      ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
      : "--:--";

  function setIcon(playing) {
    // svg elements lack the HTMLElement `hidden` property, so toggle the attribute
    iconPlay.toggleAttribute("hidden", playing);
    iconPause.toggleAttribute("hidden", !playing);
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function syncDuration() {
    if (!Number.isFinite(audio.duration)) return;
    durEl.textContent = fmt(audio.duration);
    seek.max = audio.duration;
    document.getElementById("dl").href = audio.currentSrc;
  }
  audio.addEventListener("loadedmetadata", syncDuration);
  audio.addEventListener("durationchange", syncDuration);

  audio.addEventListener("timeupdate", () => {
    curEl.textContent = fmt(audio.currentTime);
    if (!scrubbing) seek.value = audio.currentTime;
  });

  audio.addEventListener("play", () => setIcon(true));
  audio.addEventListener("pause", () => setIcon(false));
  audio.addEventListener("ended", () => setIcon(false));

  playBtn.addEventListener("click", () => {
    audio.paused ? audio.play() : audio.pause();
  });

  document.getElementById("rew").addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  });

  document.getElementById("fwd").addEventListener("click", () => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  });

  seek.addEventListener("pointerdown", () => (scrubbing = true));
  seek.addEventListener("input", () => {
    curEl.textContent = fmt(Number(seek.value));
  });
  seek.addEventListener("change", () => {
    audio.currentTime = Number(seek.value);
    scrubbing = false;
  });
}

drawPixelHeart();
initLock();
scatterBgFlowers();
initPuzzle();
initEnvelope();
initPlayer();
