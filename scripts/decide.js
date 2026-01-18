(() => {
  const choices = document.getElementById("choices");
  const bubbles = Array.from(document.querySelectorAll(".choice-bubble"));
  const endScreen = document.getElementById("end-screen");

  let locked = false;

  // Fade-in on load
  window.addEventListener("load", () => {
    bubbles.forEach((b, i) => setTimeout(() => b.classList.add("in"), i * 140));
  });

  // Seeded RNG so targets are identical every time
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Precompute deterministic target field for current viewport
  function makeTargetField(count, w, h) {
    const rng = mulberry32(123456); // change seed to change the fixed pattern
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
        dur: 1000 + rng() * 230,    // <-- speed: increase these to slow further
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

  function spawnPixelsFrom(originX, originY, count = 260) {
    endScreen.innerHTML = "";

    const targets = getTargets(count);
    const animations = [];

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];

      const px = document.createElement("span");
      px.className = "px";
      if (t.tiny) px.classList.add("tiny");
      else if (t.dim) px.classList.add("dim");
      if (t.soft) px.classList.add("soft");

      px.style.left = `${originX}px`;
      px.style.top = `${originY}px`;
      endScreen.appendChild(px);

      const dx = t.x - originX;
      const dy = t.y - originY;

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

      animations.push(anim);
    }

    return Promise.all(animations.map(a => a.finished));
  }

  async function activate(selected) {
    if (locked) return;
    locked = true;

    const href = selected.getAttribute("data-href");
    choices.classList.add("locked");

    for (const b of bubbles) {
      if (b !== selected) b.classList.add("vanish");
    }

    const rect = selected.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    endScreen.classList.add("on");
    selected.classList.add("selected");

    await spawnPixelsFrom(cx, cy, 260);

    // Hold final speckled look before redirect
    setTimeout(() => {
      window.location.href = href;
    }, 0); //change this to be smaller for quicker transition and bigger for longer transition
  }

  for (const b of bubbles) {
    b.addEventListener("click", () => activate(b));
    b.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate(b);
      }
    });
  }

  // Resize safety: rebuild targets and clear pixels if someone resizes mid/end
  window.addEventListener("resize", () => {
    cachedTargets = null;
    if (endScreen.classList.contains("on")) {
      endScreen.innerHTML = "";
    }
  });
})();
