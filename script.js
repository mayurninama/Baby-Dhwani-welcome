/**
 * ==========================================================================
 * Baby Dhwani — Editable Invitation Configuration
 * Customize any text below and reload the page!
 * ==========================================================================
 */
const INVITE_CONFIG = {
  // Act 0 Intro ("We are on cloud nine" + Baby Dhwani)
  introLine1: "We are",
  introLine2: "on cloud",
  introLine3: "nine",
  introSubtitle: "INTRODUCING",
  fullBabyTitle: "Baby Dhwani",

  // Act 1 Announcement ("Our baby girl is here")
  girlAnnouncement1: "Our",
  girlAnnouncement2: "baby girl",
  girlAnnouncement3: "is here",

  // Puppy's Basket Placard
  basketSignTop: "WELCOME",
  basketSignBottom: "BABY DHWANI",

  // Main Crest Name & Ribbon Date
  babyLabel: "BABY",
  babyName: "Dhwani",
  dateText: "25TH NOVEMBER 2026",

  // Footer Family Details
  parentsHeading: "PROUD PARENTS",
  parentsNames: "MEERA & AARAV",
  familyHeading: "ELATED FAMILY",
  familyNames: "THE SHARMA & PATEL FAMILIES",

  // Playback defaults
  autoLoop: true,
};

/* ==========================================================================
   Easing & Interpolation Utilities
   ========================================================================== */
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, t0, t1) => clamp((t - t0) / Math.max(0.0001, t1 - t0));

const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOutSine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
const easeOutBack = (x) => {
  const t = clamp(x);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function cubicBezierPt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/* ==========================================================================
   DOM Initialization & Config Binding
   ========================================================================== */
function applyInviteConfig() {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    if (key in INVITE_CONFIG) {
      el.textContent = INVITE_CONFIG[key];
    }
  });

  const dateNode = document.getElementById("ribbonDateTextPath");
  if (dateNode) {
    dateNode.textContent = INVITE_CONFIG.dateText;
  }

  // Update arched BABY characters dynamically if length === 4
  const chars = Array.from(INVITE_CONFIG.babyLabel || "BABY");
  for (let i = 0; i < 4; i++) {
    const span = document.getElementById(`babyChar${i}`);
    if (span) span.textContent = chars[i] ?? "";
  }
}

function createSparkles() {
  const layer = document.getElementById("sparkleLayer");
  if (!layer) return;
  const dots = [
    { x: 18, y: 22, size: 7, dur: 5.5, delay: 0.2 },
    { x: 78, y: 18, size: 5, dur: 6.4, delay: 1.4 },
    { x: 26, y: 44, size: 6, dur: 7.0, delay: 2.1 },
    { x: 74, y: 38, size: 8, dur: 5.8, delay: 0.9 },
    { x: 14, y: 66, size: 5, dur: 6.2, delay: 3.1 },
    { x: 84, y: 62, size: 6, dur: 5.4, delay: 1.8 },
    { x: 42, y: 14, size: 5, dur: 6.8, delay: 2.6 },
    { x: 60, y: 78, size: 7, dur: 7.2, delay: 0.6 },
  ];
  dots.forEach((d) => {
    const el = document.createElement("span");
    el.className = "sparkle-dot";
    el.style.left = `${d.x}%`;
    el.style.top = `${d.y}%`;
    el.style.width = `${d.size}px`;
    el.style.height = `${d.size}px`;
    el.style.setProperty("--dur", `${d.dur}s`);
    el.style.setProperty("--delay", `${d.delay}s`);
    layer.appendChild(el);
  });
}

/* ==========================================================================
   Choreographed Animation Timeline (0.0s -> 24.5s, Loops to 5.4s)
   ========================================================================== */
const LOOP_START = 5.4;
const TOTAL_DURATION = 24.5;

const els = {
  introOverlay: document.getElementById("introOverlay"),
  introLines: [
    document.querySelector("#introTitle .line-1"),
    document.querySelector("#introTitle .line-2"),
    document.querySelector("#introTitle .line-3"),
  ],
  introNameReveal: document.getElementById("introNameReveal"),
  introBabyWrap: document.querySelector(".intro-baby-name-wrap"),
  girlLines: [
    document.querySelector(".g-line-1"),
    document.querySelector(".g-line-2"),
    document.querySelector(".g-line-3"),
  ],
  crestAssembly: document.getElementById("crestAssembly"),
  heroBalloon: document.getElementById("heroBalloon"),
  crestPathLeft: document.getElementById("crestPathLeft"),
  crestPathRight: document.getElementById("crestPathRight"),
  wingLeft: document.getElementById("wingLeft"),
  wingRight: document.getElementById("wingRight"),
  topFloralLeft: document.getElementById("topFloralLeft"),
  topFloralRight: document.getElementById("topFloralRight"),
  pinkBowWrap: document.getElementById("pinkBowWrap"),
  babyChars: [0, 1, 2, 3].map((i) => document.getElementById(`babyChar${i}`)),
  crestDhwaniWrap: document.getElementById("crestDhwaniWrap"),
  sageRibbonWrap: document.getElementById("sageRibbonWrap"),
  ribbonDateText: document.querySelector(".ribbon-date-text"),
  footerBlock1: document.getElementById("footerBlock1"),
  footerBlock2: document.getElementById("footerBlock2"),
  clouds: {
    introA: document.getElementById("cloudIntroA"),
    introB: document.getElementById("cloudIntroB"),
    climbA: document.getElementById("cloudClimbA"),
    climbB: document.getElementById("cloudClimbB"),
    footer: document.getElementById("cloudFooter"),
  },
  butterflies: [0, 1, 2, 3, 4].map((i) => document.getElementById(`bfly${i}`)),
};

const pathLens = {
  left: els.crestPathLeft ? els.crestPathLeft.getTotalLength() : 420,
  right: els.crestPathRight ? els.crestPathRight.getTotalLength() : 420,
};

if (els.crestPathLeft) {
  els.crestPathLeft.style.strokeDasharray = `${pathLens.left}`;
}
if (els.crestPathRight) {
  els.crestPathRight.style.strokeDasharray = `${pathLens.right}`;
}

function updateButterfly(el, t, tStart, tEnd, p0, p1, p2, p3, options = {}) {
  if (!el) return;
  const { perchHold = false, baseScale = 1, fadeOutAtEnd = true } = options;

  if (t < tStart || (!perchHold && t > tEnd)) {
    el.style.opacity = "0";
    el.classList.remove("is-perched");
    return;
  }

  const rawP = clamp((t - tStart) / (tEnd - tStart));
  const p = easeInOutSine(rawP);
  const pt = cubicBezierPt(p0, p1, p2, p3, p);
  const ptNext = cubicBezierPt(p0, p1, p2, p3, Math.min(1, p + 0.02));

  let angle = (Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * 180) / Math.PI + 90;
  if (perchHold && rawP >= 0.96) {
    angle = lerp(angle, -18, (rawP - 0.96) / 0.04);
    el.classList.add("is-perched");
  } else {
    el.classList.remove("is-perched");
  }

  let alpha = 1;
  if (rawP < 0.14) alpha = rawP / 0.14;
  else if (fadeOutAtEnd && !perchHold && rawP > 0.84) alpha = (1 - rawP) / 0.16;

  // Gentle loop-end fade if perched
  if (perchHold && t > 23.1) {
    alpha *= 1 - seg(t, 23.1, 24.1);
  }

  const sc = baseScale * (0.85 + 0.15 * Math.sin(rawP * Math.PI));
  el.style.opacity = `${clamp(alpha)}`;
  el.style.transform = `translate3d(${pt.x}cqw, ${pt.y}cqh, 0) rotate(${angle.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
}

function renderTimeline(t) {
  // Subtle fade out near loop boundary (23.3s -> 24.5s) for seamless restart into Act 1
  const loopFade = t > 23.3 ? 1 - easeInOutSine(seg(t, 23.3, 24.4)) : 1;

  /* ------------------------------------------------------------------------
     ACT 0 (0.0s -> 5.4s): "We are on cloud nine" + Animated Baby Dhwani
     ------------------------------------------------------------------------ */
  const introAlpha = t < 5.4 ? 1 - easeInOutSine(seg(t, 4.25, 5.25)) : 0;
  els.introLines.forEach((line, idx) => {
    if (!line) return;
    const enter = easeOutCubic(seg(t, 0.3 + idx * 0.24, 1.35 + idx * 0.24));
    const exitY = seg(t, 4.2, 5.3) * -6;
    line.style.opacity = `${(enter * introAlpha).toFixed(3)}`;
    line.style.transform = `translate3d(0, ${((1 - enter) * 5 + exitY).toFixed(2)}cqw, 0)`;
  });

  if (els.introNameReveal && els.introBabyWrap) {
    const kIn = easeOutCubic(seg(t, 1.75, 2.55));
    const wipe = easeInOutSine(seg(t, 2.05, 3.25));
    const exitY = seg(t, 4.25, 5.3) * -5;
    els.introNameReveal.style.opacity = `${(kIn * introAlpha).toFixed(3)}`;
    els.introNameReveal.style.transform = `translate3d(0, ${((1 - kIn) * 4 + exitY).toFixed(2)}cqw, 0)`;
    els.introBabyWrap.style.clipPath = `inset(-12% ${((1 - wipe) * 100).toFixed(1)}% -12% -6%)`;
  }

  /* ------------------------------------------------------------------------
     ACT 1 (5.4s -> 9.8s): "Our baby girl is here"
     ------------------------------------------------------------------------ */
  els.girlLines.forEach((line, idx) => {
    if (!line) return;
    if (t < 5.2 || t > 9.9) {
      line.style.opacity = "0";
      return;
    }
    const enter = easeOutCubic(seg(t, 5.6 + idx * 0.22, 6.75 + idx * 0.22));
    const exit = 1 - easeInOutSine(seg(t, 8.2 + idx * 0.12, 9.45 + idx * 0.12));
    const driftY = seg(t, 6.2, 9.5) * 6;
    line.style.opacity = `${(enter * exit).toFixed(3)}`;
    line.style.transform = `translate3d(0, ${((1 - enter) * 4 + driftY).toFixed(2)}cqw, 0)`;
  });

  /* ------------------------------------------------------------------------
     DRIFTING WATERCOLOR CLOUDS
     ------------------------------------------------------------------------ */
  if (els.clouds.introA) {
    const c = els.clouds.introA;
    const p = seg(t, 0.0, 5.4);
    const a = t < 5.4 ? Math.sin(p * Math.PI) * 0.72 : 0;
    c.style.opacity = `${a.toFixed(3)}`;
    c.style.transform = `translate3d(${lerp(-6, 22, p)}cqw, ${lerp(0, -10, p)}cqw, 0)`;
  }
  if (els.clouds.introB) {
    const c = els.clouds.introB;
    const p = seg(t, 0.4, 5.4);
    const a = t < 5.4 ? Math.sin(p * Math.PI) * 0.62 : 0;
    c.style.opacity = `${a.toFixed(3)}`;
    c.style.transform = `scaleX(-1) translate3d(${lerp(-4, 18, p)}cqw, ${lerp(0, -14, p)}cqw, 0)`;
  }
  if (els.clouds.climbA) {
    const c = els.clouds.climbA;
    const p = seg(t, 5.4, 10.6);
    const a = t >= 5.3 && t <= 10.8 ? Math.sin(p * Math.PI) * 0.76 : 0;
    c.style.opacity = `${a.toFixed(3)}`;
    c.style.transform = `translate3d(${lerp(0, 26, p)}cqw, ${lerp(36, -62, p)}cqw, 0)`;
  }
  if (els.clouds.climbB) {
    const c = els.clouds.climbB;
    const p = seg(t, 6.0, 11.4);
    const a = t >= 5.9 && t <= 11.6 ? Math.sin(p * Math.PI) * 0.65 : 0;
    c.style.opacity = `${a.toFixed(3)}`;
    c.style.transform = `scaleX(-1) translate3d(${lerp(0, 20, p)}cqw, ${lerp(56, -42, p)}cqw, 0)`;
  }
  if (els.clouds.footer) {
    const c = els.clouds.footer;
    const p = seg(t, 17.5, 24.4);
    const a = t >= 17.4 ? Math.sin(clamp(p * 1.15) * Math.PI) * 0.58 * loopFade : 0;
    c.style.opacity = `${a.toFixed(3)}`;
    c.style.transform = `translate3d(${lerp(14, -20, p)}cqw, 0, 0)`;
  }

  /* ------------------------------------------------------------------------
     HERO BALLOON POSITION & SCALE CHOREOGRAPHY
     ------------------------------------------------------------------------ */
  let bY = 58; // cqw from top (default top: 20cqw + translateY)
  let bScale = 0.96;
  let bAlpha = 1;

  if (t < 2.2) {
    const p = easeOutCubic(seg(t, 0.0, 2.0));
    bY = lerp(76, 52, p);
    bScale = lerp(0.86, 0.92, p);
    bAlpha = clamp(t / 0.65);
  } else if (t < 4.2) {
    bY = 52;
    bScale = 0.92;
  } else if (t < 5.4) {
    // Rise smoothly into Act 1 aerial starting position
    const p = easeInOutSine(seg(t, 4.2, 5.4));
    bY = lerp(52, -28, p);
    bScale = lerp(0.92, 1.08, p);
  } else if (t < 10.0) {
    // Act 1 aerial descent
    const p = easeInOutSine(seg(t, 5.4, 9.8));
    bY = lerp(-28, 14, p);
    bScale = lerp(1.08, 1.0, p);
  } else if (t < 12.2) {
    // Act 2 settle inside floral crest
    const p = easeInOutSine(seg(t, 10.0, 12.2));
    bY = lerp(14, 15.5, p);
    bScale = lerp(1.0, 0.535, p);
  } else {
    bY = 15.5;
    bScale = 0.535;
    bAlpha = loopFade;
  }

  if (els.heroBalloon) {
    els.heroBalloon.style.opacity = `${bAlpha.toFixed(3)}`;
    els.heroBalloon.style.transform = `translate3d(-50%, ${bY.toFixed(2)}cqw, 0) scale(${bScale.toFixed(3)})`;
  }

  /* ------------------------------------------------------------------------
     CREST ASSEMBLY GLIDE (lifts smoothly as bow blooms to balance footer)
     ------------------------------------------------------------------------ */
  const assemblyLift = t >= 12.0 ? easeInOutSine(seg(t, 12.0, 13.6)) * -4.2 : 0;
  if (els.crestAssembly) {
    els.crestAssembly.style.transform = `translate3d(0, ${assemblyLift.toFixed(2)}cqw, 0)`;
  }

  /* ------------------------------------------------------------------------
     ACT 2: BAROQUE SHIELD CREST + FLORAL WINGS + TOP ROSES + PINK BOW
     ------------------------------------------------------------------------ */
  const crestDraw = easeInOutSine(seg(t, 10.2, 12.2));
  if (els.crestPathLeft && els.crestPathRight) {
    const showCrest = t >= 10.1 ? loopFade : 0;
    els.crestPathLeft.style.opacity = `${(0.88 * showCrest).toFixed(3)}`;
    els.crestPathRight.style.opacity = `${(0.88 * showCrest).toFixed(3)}`;
    els.crestPathLeft.style.strokeDashoffset = `${(pathLens.left * (1 - crestDraw)).toFixed(1)}`;
    els.crestPathRight.style.strokeDashoffset = `${(pathLens.right * (1 - crestDraw)).toFixed(1)}`;
  }

  // Side Floral Garland Wings
  const wingP = easeOutCubic(seg(t, 10.55, 12.85));
  const breeze = t > 12.8 ? Math.sin((t - 12.8) * 1.45) * 1.2 : 0;
  if (els.wingLeft && els.wingRight) {
    const wingAlpha = wingP * loopFade;
    const sc = lerp(0.42, 1.0, wingP);
    els.wingLeft.style.opacity = `${wingAlpha.toFixed(3)}`;
    els.wingRight.style.opacity = `${wingAlpha.toFixed(3)}`;
    els.wingLeft.style.transform = `scale(${sc.toFixed(3)}) rotate(${(lerp(12, 0, wingP) + breeze).toFixed(2)}deg)`;
    els.wingRight.style.transform = `scale(${sc.toFixed(3)}) rotate(${(lerp(-12, 0, wingP) - breeze).toFixed(2)}deg)`;
  }

  // Top Corner Rose Clusters
  const topFloralP = easeOutBack(seg(t, 11.45, 12.95));
  const topAlpha = clamp(seg(t, 11.45, 12.2)) * loopFade;
  if (els.topFloralLeft && els.topFloralRight) {
    const sc = lerp(0.35, 1.0, topFloralP);
    els.topFloralLeft.style.opacity = `${topAlpha.toFixed(3)}`;
    els.topFloralRight.style.opacity = `${topAlpha.toFixed(3)}`;
    els.topFloralLeft.style.transform = `scale(${sc.toFixed(3)}) rotate(${(breeze * 0.7).toFixed(2)}deg)`;
    els.topFloralRight.style.transform = `scale(${sc.toFixed(3)}) rotate(${(-breeze * 0.7).toFixed(2)}deg)`;
  }

  // Pink Satin Bow
  const bowScaleP = easeOutBack(seg(t, 12.15, 13.4));
  const bowAlpha = clamp(seg(t, 12.15, 12.7)) * loopFade;
  if (els.pinkBowWrap) {
    const sc = lerp(0.25, 1.0, bowScaleP);
    els.pinkBowWrap.style.opacity = `${bowAlpha.toFixed(3)}`;
    els.pinkBowWrap.style.transform = `translateX(-50%) scale(${sc.toFixed(3)})`;
  }

  /* ------------------------------------------------------------------------
     ACT 3: ARCHED "BABY" + CALLIGRAPHIC "Dhwani"
     ------------------------------------------------------------------------ */
  els.babyChars.forEach((ch, idx) => {
    if (!ch) return;
    const cp = easeOutCubic(seg(t, 13.2 + idx * 0.22, 13.95 + idx * 0.22));
    ch.style.opacity = `${(cp * loopFade).toFixed(3)}`;
  });

  if (els.crestDhwaniWrap) {
    const wipe = easeInOutSine(seg(t, 14.1, 15.65));
    const dAlpha = clamp(seg(t, 14.1, 14.45)) * loopFade;
    els.crestDhwaniWrap.style.opacity = `${dAlpha.toFixed(3)}`;
    els.crestDhwaniWrap.style.clipPath = `inset(-12% ${((1 - wipe) * 100).toFixed(1)}% -12% -6%)`;
  }

  /* ------------------------------------------------------------------------
     ACT 4: SAGE RIBBON BANNER + CURVED DATE
     ------------------------------------------------------------------------ */
  if (els.sageRibbonWrap) {
    const ribP = easeOutCubic(seg(t, 14.8, 16.5));
    const rAlpha = clamp(seg(t, 14.8, 15.2)) * loopFade;
    const insetX = (1 - ribP) * 50;
    els.sageRibbonWrap.style.opacity = `${rAlpha.toFixed(3)}`;
    els.sageRibbonWrap.style.clipPath = `inset(-8% ${insetX.toFixed(1)}% -8% ${insetX.toFixed(1)}%)`;
    els.sageRibbonWrap.style.transform = `translateX(-50%) scale(${lerp(0.88, 1.0, ribP).toFixed(3)})`;
  }

  if (els.ribbonDateText) {
    const dP = easeInOutSine(seg(t, 15.85, 17.05));
    els.ribbonDateText.style.opacity = `${(dP * loopFade).toFixed(3)}`;
  }

  /* ------------------------------------------------------------------------
     ACT 5: FOOTER TEXT (Proud Parents & Elated Family)
     ------------------------------------------------------------------------ */
  if (els.footerBlock1) {
    const f1 = easeOutCubic(seg(t, 16.6, 17.8));
    els.footerBlock1.style.opacity = `${(f1 * loopFade).toFixed(3)}`;
    els.footerBlock1.style.transform = `translate3d(0, ${((1 - f1) * 4).toFixed(2)}cqw, 0)`;
  }

  if (els.footerBlock2) {
    const f2 = easeOutCubic(seg(t, 17.45, 18.65));
    els.footerBlock2.style.opacity = `${(f2 * loopFade).toFixed(3)}`;
    els.footerBlock2.style.transform = `translate3d(0, ${((1 - f2) * 4).toFixed(2)}cqw, 0)`;
  }

  /* ------------------------------------------------------------------------
     FLAPPING WATERCOLOR BUTTERFLIES (Curved Bezier Paths)
     ------------------------------------------------------------------------ */
  // Butterfly 0 (Intro Act 0): gentle glide past Baby Dhwani & balloon
  updateButterfly(
    els.butterflies[0],
    t,
    2.1,
    4.9,
    { x: -8, y: 42 },
    { x: 26, y: 31 },
    { x: 64, y: 46 },
    { x: 108, y: 26 },
    { baseScale: 0.92 }
  );

  // Butterfly 1 (Act 1): climbs gracefully past balloon & upper cloud
  updateButterfly(
    els.butterflies[1],
    t,
    7.2,
    10.4,
    { x: 68, y: 58 },
    { x: 46, y: 45 },
    { x: 56, y: 28 },
    { x: 34, y: 11 },
    { baseScale: 0.88 }
  );

  // Butterfly 2 (Act 2): arcs diagonally across blooming crest
  updateButterfly(
    els.butterflies[2],
    t,
    12.3,
    15.1,
    { x: 14, y: 74 },
    { x: 36, y: 58 },
    { x: 64, y: 42 },
    { x: 88, y: 24 },
    { baseScale: 0.84 }
  );

  // Butterfly 3 (Act 4): skims smoothly beneath unfurling sage ribbon
  updateButterfly(
    els.butterflies[3],
    t,
    15.0,
    17.5,
    { x: 84, y: 60 },
    { x: 64, y: 71 },
    { x: 42, y: 69 },
    { x: 18, y: 58 },
    { baseScale: 0.82 }
  );

  // Butterfly 4 (Act 5 Finale): flutters in and perches on upper-left of pink bow!
  updateButterfly(
    els.butterflies[4],
    t,
    18.0,
    19.8,
    { x: 14, y: 4 },
    { x: 26, y: 12 },
    { x: 32, y: 7 },
    { x: 36.5, y: 10.2 },
    { perchHold: true, baseScale: 0.74, fadeOutAtEnd: false }
  );
}

/* ==========================================================================
   Playback Loop & UI Controls
   ========================================================================== */
const state = {
  t: 0,
  playing: true,
  loop: INVITE_CONFIG.autoLoop,
  lastTs: null,
};

function tick(ts) {
  if (state.lastTs === null) state.lastTs = ts;
  const dt = Math.min(0.08, (ts - state.lastTs) / 1000);
  state.lastTs = ts;

  if (state.playing) {
    state.t += dt;
    if (state.t >= TOTAL_DURATION) {
      if (state.loop) {
        state.t = LOOP_START;
      } else {
        state.t = 22.0; // Hold gracefully in living finale
        state.playing = false;
        syncControlLabels();
      }
    }
  }

  renderTimeline(state.t);
  requestAnimationFrame(tick);
}

function syncControlLabels() {
  const playIcon = document.getElementById("playPauseIcon");
  const playLabel = document.getElementById("playPauseLabel");
  const btnLoop = document.getElementById("btnLoop");
  const loopLabel = document.getElementById("loopLabel");

  document.body.classList.toggle("is-paused", !state.playing);

  if (playIcon && playLabel) {
    playIcon.textContent = state.playing ? "❚❚" : "▶";
    playLabel.textContent = state.playing ? "Pause" : "Play";
  }
  if (btnLoop && loopLabel) {
    btnLoop.classList.toggle("is-active", state.loop);
    loopLabel.textContent = state.loop ? "Loop: On" : "Loop: Off";
  }
}

function initControls() {
  const btnReplay = document.getElementById("btnReplayIntro");
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnLoop = document.getElementById("btnLoop");

  btnReplay?.addEventListener("click", () => {
    state.t = 0;
    state.playing = true;
    state.lastTs = null;
    syncControlLabels();
    renderTimeline(0);
  });

  btnPlayPause?.addEventListener("click", () => {
    state.playing = !state.playing;
    state.lastTs = null;
    syncControlLabels();
  });

  btnLoop?.addEventListener("click", () => {
    state.loop = !state.loop;
    syncControlLabels();
  });
}

// Expose deterministic inspection API for QA & debugging
window.dhwaniInvite = {
  seek(seconds) {
    state.t = clamp(seconds, 0, TOTAL_DURATION);
    renderTimeline(state.t);
  },
  pause() {
    state.playing = false;
    syncControlLabels();
  },
  play() {
    state.playing = true;
    state.lastTs = null;
    syncControlLabels();
  },
  getState() {
    return { ...state };
  },
};

applyInviteConfig();
createSparkles();
initControls();

// Optional URL parameters (?t=20.5&paused=1) for direct scene previewing
const params = new URLSearchParams(window.location.search);
if (params.has("t")) {
  const tVal = parseFloat(params.get("t"));
  if (!Number.isNaN(tVal)) state.t = clamp(tVal, 0, TOTAL_DURATION);
}
if (params.get("paused") === "1") {
  state.playing = false;
}

syncControlLabels();
renderTimeline(state.t);
requestAnimationFrame(tick);
