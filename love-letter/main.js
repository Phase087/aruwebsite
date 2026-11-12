/* The letter page: folded letter, heart video, photos, first calendar + countdown. Needs common.js first. */

/* ---------- fill in the words ---------- */
document.querySelectorAll(".her-name").forEach((el) => (el.textContent = CONFIG.herName));
document.querySelectorAll(".your-name").forEach((el) => (el.textContent = CONFIG.yourName));
$("#caption").textContent = CONFIG.photoCaption;
$("#photoBack").textContent = CONFIG.photoBack;

const video = $("#photoVideo");
video.addEventListener("error", () => video.parentElement.classList.add("missing"));

/* =========================================================
   The folded letter
   ========================================================= */
const sheet = $("#sheet");
const wrap = $("#letterWrap");
let fold, panels, shadow, sticker, third, H;

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildFold() {
  lastFoldWidth = sheet.offsetWidth;
  H = sheet.offsetHeight;
  third = H / 3;

  fold = document.createElement("div");
  fold.className = "fold closed";
  fold.tabIndex = 0;
  fold.setAttribute("role", "button");
  fold.setAttribute("aria-label", "Open the letter");
  fold.style.top = sheet.offsetTop + "px";
  fold.style.height = H + "px";

  shadow = document.createElement("div");
  shadow.className = "fold-shadow";
  shadow.style.top = third + "px";
  shadow.style.height = third + "px";
  fold.appendChild(shadow);

  panels = ["p-top", "p-mid", "p-bot"].map((cls, i) => {
    const panel = document.createElement("div");
    panel.className = "panel " + cls;
    panel.style.top = i * third + "px";
    panel.style.height = third + 0.5 + "px";

    const pf = document.createElement("div");
    pf.className = "pf";
    const copy = sheet.cloneNode(true);
    copy.removeAttribute("id");
    copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    copy.classList.remove("hide");
    copy.style.top = -i * third + "px";
    copy.style.height = H + "px";
    pf.appendChild(copy);

    const pb = document.createElement("div");
    pb.className = "pb";
    if (cls === "p-top") pb.innerHTML = `<p class="fold-label">${escapeHtml(CONFIG.foldLabel)}</p>`;
    panel.append(pf, pb);
    fold.appendChild(panel);
    return panel;
  });

  sticker = document.createElement("div");
  sticker.className = "sticker";
  sticker.style.top = 2 * third + "px";
  sticker.innerHTML = `<svg viewBox="0 0 24 24"><path d="${HEART_PATH}" fill="#b2403b"/><path d="M7 6.5 C6 7 5.2 8 5.2 9.2" stroke="rgba(255,255,255,.5)" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;
  fold.appendChild(sticker);

  wrap.appendChild(fold);
  centerFold();
  fold.addEventListener("animationend", () => (fold.style.animation = "none"), { once: true });

  fold.addEventListener("click", openLetter);
  fold.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLetter(); }
  });
}

// while closed, keep the folded part in the middle of the screen
function centerFold() {
  if (!fold || !fold.classList.contains("closed")) return;
  fold.style.setProperty("--off", "0px");
  const r = wrap.getBoundingClientRect();
  const off = innerHeight / 2 - (r.top + sheet.offsetTop + H / 2);
  fold.style.setProperty("--off", off + "px");
  const note = $("#note");
  note.style.top = Math.min(innerHeight / 2 + third / 2 + 30, innerHeight - note.offsetHeight - 14) + "px";
}
// if the screen size changes while it's still folded (e.g. a phone is rotated),
// rebuild the folds at the new size so nothing is stretched or off-centre
let lastFoldWidth = 0;
let resizeTimer = null;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!fold || !fold.classList.contains("closed")) return;
    if (sheet.offsetWidth !== lastFoldWidth) {
      fold.remove();
      buildFold();
      fold.style.animation = "none";
    } else {
      centerFold();
    }
  }, 120);
});

let opened = false;
async function openLetter() {
  if (opened) return;
  opened = true;
  resumeMusic();   // picks up where the song was if she came back from the other page
  fold.classList.remove("closed");
  fold.style.animation = "none";
  $("#note").classList.add("fade");

  // the sticker peels off and flutters away
  sticker.animate(
    [
      { transform: "translateZ(4px) rotate(-8deg)", opacity: 1 },
      { transform: "translateZ(30px) translate(4px,-18px) rotate(-30deg) scale(1.1)", opacity: 1, offset: 0.3 },
      { transform: `translateZ(30px) translate(${rand(120, 200)}px, ${rand(260, 380)}px) rotate(${rand(200, 400)}deg) scale(.9)`, opacity: 0 },
    ],
    { duration: 1100, easing: "cubic-bezier(.4,0,.8,.6)", fill: "forwards" }
  );
  await wait(450);

  fold.classList.add("opening");
  fold.style.setProperty("--off", "0px");
  panels[0].classList.add("open");
  shadow.style.top = "0px";
  shadow.style.height = 2 * third + "px";
  await wait(700);
  panels[2].classList.add("open");
  shadow.style.height = H + "px";
  await wait(1150);

  sheet.classList.remove("hide");
  sheet.classList.add("creased");
  fold.remove();
  document.body.classList.remove("locked");
  $("#after").hidden = false;
  $("#letterNote").classList.add("in");
  watchPhoto();
  enableTapHearts();

  paperHearts(46);
}

/* =========================================================
   Photo section
   ========================================================= */
function watchPhoto() {
  const photo = $("#photo");
  const inner = photo.querySelector(".photo-inner");
  // drop in the first time it's seen; play the video only while it's on screen
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) {
      photo.classList.add("in");
      if (!inner.classList.contains("flipped")) video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, { threshold: 0.35 });
  io.observe($("#photoSpot"));

  // the two printed photos drop in as she scrolls to them
  const picIo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); picIo.unobserve(en.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(".pic").forEach((p) => picIo.observe(p));

  const soundBtn = $("#soundBtn");
  soundBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted) video.play().catch(() => {});
    // turn the song down while the video is talking, back up after
    musicTarget = video.muted ? MUSIC_VOLUME : MUSIC_DUCKED;
    if (!music.paused) fadeMusicTo(musicTarget, 600);
    soundBtn.textContent = video.muted ? "🔈 tap for sound" : "🔊 sound on";
    soundBtn.setAttribute("aria-pressed", String(!video.muted));
  });

  const flip = () => {
    inner.classList.toggle("flipped");
    if (inner.classList.contains("flipped")) video.pause();
    else video.play().catch(() => {});
  };
  photo.addEventListener("click", flip);
  photo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
  });
}

// game 1: when I'll come (shows the countdown when she gets it)
createGame($("#game"), {
  answer,
  label: "mwwwahhh",
  onWin: () => startCountdown(),
});

/* =========================================================
   Split-flap countdown (shown after the right guess)
   ========================================================= */
const meetAt = new Date(
  CONFIG.meetDate.year, CONFIG.meetDate.month - 1, CONFIG.meetDate.day,
  CONFIG.meetTime.hour, CONFIG.meetTime.minute
);

function makeDigit(v) {
  const d = document.createElement("div");
  d.className = "digit";
  d.innerHTML = `<div class="half top"><span>${v}</span></div><div class="half bottom"><span>${v}</span></div>`;
  d.dataset.v = v;
  return d;
}

function flipDigit(d, next) {
  const prev = d.dataset.v;
  if (prev === next) return;
  d.dataset.v = next;
  d.querySelectorAll(".flip-top, .flip-bottom").forEach((n) => n.remove());
  d.querySelector(".half.top span").textContent = next;
  d.querySelector(".half.bottom span").textContent = prev;
  const ft = document.createElement("div");
  ft.className = "half top flip-top";
  ft.innerHTML = `<span>${prev}</span>`;
  const fb = document.createElement("div");
  fb.className = "half bottom flip-bottom";
  fb.innerHTML = `<span>${next}</span>`;
  d.append(ft, fb);
  fb.addEventListener("animationend", () => {
    d.querySelector(".half.bottom span").textContent = next;
    ft.remove();
    fb.remove();
  });
}

function setUnit(unit, str, animate) {
  const box = unit.querySelector(".digits");
  while (box.children.length < str.length) box.prepend(makeDigit("0"));
  while (box.children.length > str.length) box.firstElementChild.remove();
  [...box.children].forEach((d, i) => {
    if (animate) flipDigit(d, str[i]);
    else {
      d.dataset.v = str[i];
      d.querySelectorAll("span").forEach((s) => (s.textContent = str[i]));
    }
  });
}

const units = {};
document.querySelectorAll(".unit").forEach((u) => (units[u.dataset.unit] = u));

function renderCountdown(animate) {
  let diff = Math.max(0, meetAt - Date.now());
  const days = Math.floor(diff / 864e5); diff -= days * 864e5;
  const hours = Math.floor(diff / 36e5); diff -= hours * 36e5;
  const mins = Math.floor(diff / 6e4); diff -= mins * 6e4;
  const secs = Math.floor(diff / 1e3);
  setUnit(units.days, String(days).padStart(2, "0"), animate);
  setUnit(units.hours, String(hours).padStart(2, "0"), animate);
  setUnit(units.mins, String(mins).padStart(2, "0"), animate);
  setUnit(units.secs, String(secs).padStart(2, "0"), animate);
  return meetAt <= Date.now();
}

function startCountdown() {
  const wrap = $("#countdownWrap");
  renderCountdown(false);
  wrap.hidden = false;
  requestAnimationFrame(() => wrap.classList.add("in"));
  const tick = () => {
    const done = renderCountdown(true);
    if (done) $(".cd-label").textContent = "it's time ❤️";
    else setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };
  setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
}

// keep the song going from the same spot on the next page
$("#again").addEventListener("click", rememberMusic);

/* ---------- go ---------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
scrollTo(0, 0);
// wait for the fonts and the letter photo so the folds are measured at the right size
const letterImg = $("#letterImg");
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  letterImg.complete ? Promise.resolve() : new Promise((r) => { letterImg.onload = r; letterImg.onerror = r; }),
]).then(buildFold);
