(() => {
  const speckBg = document.getElementById("speck-bg");

  const COUNT = 260;
  const HOLD_AFTER_MS = 350;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ===== Seeded RNG (same as explore.js) =====
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ===== Same target generator as explore =====
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
        over: 1.05 + rng() * 0.07
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

  function makePx(t) {
    const px = document.createElement("span");
    px.className = "px";
    if (t.tiny) px.classList.add("tiny");
    else if (t.dim) px.classList.add("dim");
    if (t.soft) px.classList.add("soft");
    return px;
  }

  function spawnFromCenter(count = COUNT) {
    speckBg.innerHTML = "";

    const targets = getTargets(count);
    const finished = [];

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (const t of targets) {
      const px = makePx(t);

      px.style.left = `${cx}px`;
      px.style.top = `${cy}px`;

      speckBg.appendChild(px);

      const dx = t.x - cx;
      const dy = t.y - cy;

      const ox = dx * t.over;
      const oy = dy * t.over;

      const anim = px.animate(
        [
          { transform: "translate3d(0,0,0) scale(0.6)", opacity: 0 },
          { offset: 0.12, transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
          { offset: 0.78, transform: `translate3d(${ox}px, ${oy}px, 0) scale(1)`, opacity: 1 },
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(1)`, opacity: 1 }
        ],
        {
          duration: t.dur,
          delay: t.delay,
          easing: "cubic-bezier(.2,.9,.2,1)",
          fill: "forwards"
        }
      );

      finished.push(anim.finished);
    }

    return Promise.all(finished);
  }

  async function run() {
    await spawnFromCenter(COUNT);
    await sleep(HOLD_AFTER_MS);
    window.location.href = "explore.html";
  }

  window.addEventListener("load", run);

  window.addEventListener("resize", () => {
    cachedTargets = null;
    cachedW = 0;
    cachedH = 0;
    speckBg.innerHTML = "";
  });
})();
