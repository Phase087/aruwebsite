/* Shared by both pages: settings, hearts, hot/cold weather, music, and the calendar game. */
/* =========================================================
   Everything personal lives here.
   ========================================================= */
const CONFIG = {
  herName: "my love",
  yourName: "yours",

  // The answer to the guessing game. The calendar shows only this month.
  meetDate: { year: 2026, month: 12, day: 26 },   // month is 1–12
  meetTime: { hour: 23, minute: 0 },              // the countdown runs to this time (her local time)

  // second game: "now guess when I'm leaving" (no countdown)
  leaveDate: { year: 2027, month: 1, day: 17 },
  fakeOutDay: 12,   // picking this day looks right at first… then "wait what" … "galat hai babyyy"

  // the heart shows video.mp4 from the love-letter folder
  photoCaption: "my favourite moment of us",
  foldLabel: "for my aru baby ❤️",   // written on the outside of the folded letter
  photoBack: "I love you so much babyyy",

  // the letter itself is the photo of the handwritten page: letter.jpg
};

/* ========================================================= */

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const answer = new Date(CONFIG.meetDate.year, CONFIG.meetDate.month - 1, CONFIG.meetDate.day);

/* =========================================================
   Paper hearts + confetti
   ========================================================= */
const fx = $("#fx");
const HEART_COLORS = ["#b2403b", "#d98c84", "#8c2a35", "#efe0cc", "#e7b7a8", "#c95f55", "#f6efe2"];
const CONFETTI_COLORS = ["#b2403b", "#e7b7a8", "#f6efe2", "#d98c84", "#26355f", "#e9c27f", "#8c2a35"];
const HEART_PATH = "M12 21 C9 18 2 14 2 8.5 C2 5 4.6 2.8 7.4 2.8 C9.4 2.8 11 4 12 5.6 C13 4 14.6 2.8 16.6 2.8 C19.4 2.8 22 5 22 8.5 C22 14 15 18 12 21 Z";
const heartSvg = (color) => `<svg viewBox="0 0 24 24"><path d="${HEART_PATH}" fill="${color}"/></svg>`;

function paperHearts(count = 40) {
  const H = innerHeight;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "paper-heart";
    el.style.width = rand(14, 30) + "px";
    el.style.left = rand(0, innerWidth) + "px";
    el.innerHTML = heartSvg(pick(HEART_COLORS));
    fx.appendChild(el);

    const sway = rand(20, 70), spin = rand(-260, 260), flutter = rand(1.5, 3.5);
    const frames = [];
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      frames.push({
        transform: `translate(${Math.sin(t * Math.PI * flutter) * sway}px, ${t * (H + 80)}px) rotate(${spin * t}deg) rotateY(${t * 360 * flutter}deg)`,
        opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
      });
    }
    el.animate(frames, { duration: rand(4200, 7500), delay: rand(0, 1400), easing: "linear", fill: "backwards" })
      .onfinish = () => el.remove();
  }
}

// an explosion of hearts and confetti from one point
function burst(x, y, count = 80, heartsOnly = false, power = 1) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    if (heartsOnly || i % 3 === 0) {
      el.style.width = rand(14, 26) + "px";
      el.innerHTML = heartSvg(pick(HEART_COLORS));
    } else {
      el.style.width = rand(5, 9) + "px";
      el.style.height = rand(10, 18) + "px";
      el.style.background = pick(CONFETTI_COLORS);
    }
    fx.appendChild(el);

    const ang = rand(0, Math.PI * 2);
    const speed = rand(250, 750) * power;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed - rand(250, 500) * power;
    const spin = rand(-720, 720), flip = rand(360, 1080);
    const frames = [];
    for (let s = 0; s <= 14; s++) {
      const t = s / 14;      // 0..1 over ~2.4s
      const tt = t * 2.4;
      const drag = 1 - Math.min(0.75, tt * 0.35);
      frames.push({
        transform: `translate(${x + vx * tt * drag * 0.6}px, ${y + vy * tt * drag * 0.6 + 420 * tt * tt}px) rotate(${spin * t}deg) rotateX(${flip * t}deg)`,
        opacity: t > 0.8 ? (1 - t) / 0.2 : 1,
      });
    }
    el.animate(frames, { duration: rand(2000, 2800), easing: "linear", fill: "forwards" }).onfinish = () => el.remove();
  }
}

/* =========================================================
   Hot / cold weather (frost, snow, heat haze, embers)
   ========================================================= */
const weather = $("#weather");
const pc = $("#particles");
const pctx = pc.getContext("2d");
let DPR = 1;
let parts = [];
let wx = { cold: 0, hot: 0, love: 0 };

function sizeCanvas() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  pc.width = innerWidth * DPR;
  pc.height = innerHeight * DPR;
}
sizeCanvas();
addEventListener("resize", sizeCanvas);

function setWeather({ cold = 0, hot = 0, love = 0 }) {
  wx = { cold, hot, love };
  weather.style.setProperty("--cold", cold.toFixed(2));
  weather.style.setProperty("--hot", hot.toFixed(2));
  weather.style.setProperty("--love", love.toFixed(2));
  document.body.classList.toggle("chilly", cold > 0.4);
  document.body.classList.toggle("toasty", hot > 0.25);
  $("#shimmerMap").setAttribute("scale", (hot * 7).toFixed(1));

  // fill the screen straight away instead of waiting for it to build up
  const W = pc.width, H = pc.height;
  for (let i = 0; i < cold * 160; i++) parts.push(snowflake(rand(0, W), rand(-10, H)));
  for (let i = 0; i < hot * 140; i++) parts.push(ember(rand(0, W), rand(H * 0.2, H + 10)));
}

function snowflake(x, y) {
  return {
    k: "snow", x, y,
    r: rand(1.2, 2.5 + wx.cold * 3.5) * DPR,
    vy: rand(1.2, 2.5 + wx.cold * 3) * DPR, ph: rand(0, 6.28), sw: rand(0.5, 1.5 + wx.cold * 1.5),
  };
}
function ember(x, y) {
  return {
    k: "ember", x, y,
    r: rand(1, 2 + wx.hot * 2.5) * DPR,
    vy: -rand(1.5, 3 + wx.hot * 4) * DPR, ph: rand(0, 6.28), sw: rand(0.6, 2),
    hue: rand(10, 45), life: 1, decay: rand(0.004, 0.01),
  };
}

// a quick blast of cold or heat across the page right when she guesses
function flashTemp(cold, hot) {
  const f = document.createElement("div");
  f.className = "flash";
  f.style.background = cold > hot
    ? `radial-gradient(ellipse at center, rgba(220,235,250,${0.35 * cold}), rgba(150,190,235,${0.75 * cold}))`
    : `radial-gradient(ellipse at center, rgba(255,190,120,${0.3 * hot}), rgba(230,90,30,${0.7 * hot}))`;
  document.body.appendChild(f);
  f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => f.remove();

  const main = document.querySelector("main");
  main.classList.remove("jolt-cold", "jolt-hot");
  void main.offsetWidth;
  main.classList.add(cold > hot ? "jolt-cold" : "jolt-hot");
}

function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  c.fill();
}

function tickParticles() {
  const W = pc.width, H = pc.height;

  // snow
  if (wx.cold > 0 && parts.length < 900) {
    const n = Math.round(wx.cold * 6 * Math.random() + wx.cold * 1.5);
    for (let i = 0; i < n; i++) parts.push(snowflake(rand(0, W), -10 * DPR));
  }
  // embers
  if (wx.hot > 0 && parts.length < 900) {
    const n = Math.round(wx.hot * 6 * Math.random() + wx.hot * 1.5);
    for (let i = 0; i < n; i++) parts.push(ember(rand(0, W), H + 10 * DPR));
  }
  // little hearts drifting up after she gets it right
  if (wx.love > 0 && Math.random() < wx.love * 0.35 && parts.length < 400) {
    parts.push({
      k: "love", x: rand(0, W), y: H + 20 * DPR, r: rand(8, 18) * DPR,
      vy: -rand(0.6, 1.4) * DPR, ph: rand(0, 6.28), sw: rand(0.4, 1.2),
      color: pick(["#d98c84", "#e7b7a8", "#b2403b", "#f3d6cf"]), life: 1, decay: rand(0.002, 0.004), a: 0.8,
    });
  }
  // soft hearts always floating up the background: lots of small ones, a few big dreamy ones
  if (Math.random() < 0.09 && parts.length < 900) {
    const big = Math.random() < 0.18;
    parts.push({
      k: "love", x: rand(0, W), y: H + 40 * DPR,
      r: (big ? rand(34, 60) : rand(10, 26)) * DPR,
      vy: -(big ? rand(0.25, 0.5) : rand(0.4, 1)) * DPR, ph: rand(0, 6.28), sw: rand(0.3, 1),
      color: pick(["#ffd6d2", "#fff1ee", "#f4a3a0", "#a3201b", "#ff8f8a"]),
      life: 1, decay: big ? 0.0008 : 0.0015, a: big ? 0.16 : 0.32,
    });
  }

  pctx.clearRect(0, 0, W, H);
  parts = parts.filter((p) => {
    p.ph += 0.03;
    p.y += p.vy;
    p.x += Math.sin(p.ph) * p.sw * DPR;
    if (p.k === "snow") {
      pctx.globalAlpha = 0.85;
      pctx.fillStyle = "#ffffff";
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fill();
      return p.y < H + 10 * DPR;
    }
    p.life -= p.decay;
    if (p.k === "ember") {
      const flick = 0.6 + Math.random() * 0.4;
      pctx.globalAlpha = Math.max(0, p.life) * flick;
      pctx.fillStyle = `hsl(${p.hue} 95% ${55 + flick * 15}%)`;
      pctx.shadowColor = `hsl(${p.hue} 100% 55%)`;
      pctx.shadowBlur = 6 * DPR;
      pctx.beginPath();
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fill();
      pctx.shadowBlur = 0;
    } else {
      pctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)) * p.a;
      pctx.fillStyle = p.color;
      heartPath(pctx, p.x, p.y, p.r);
    }
    return p.life > 0 && p.y > -30 * DPR;
  });
  pctx.globalAlpha = 1;
  requestAnimationFrame(tickParticles);
}
requestAnimationFrame(tickParticles);

/* =========================================================
   Background music (starts on the first click, since browsers
   don't allow sound before the visitor interacts)
   ========================================================= */
const music = $("#music");
const musicBtn = $("#musicBtn");
const MUSIC_VOLUME = 0.35;      // moderate
const MUSIC_DUCKED = 0.08;      // while the video's sound is on
let musicTarget = MUSIC_VOLUME;
let fadeTimer = null;

function fadeMusicTo(target, ms = 1500) {
  clearInterval(fadeTimer);
  const start = music.volume, t0 = performance.now();
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    music.volume = start + (target - start) * t;
    if (t >= 1) clearInterval(fadeTimer);
  }, 40);
}

function startMusic() {
  if (!music.paused) return;
  music.volume = 0;
  music.play().then(() => {
    musicBtn.hidden = false;
    fadeMusicTo(musicTarget, 2500);
  }).catch(() => {});
}

// carry the song (and mute choice) over when moving between the two pages
function rememberMusic() {
  try {
    sessionStorage.setItem("musicAt", String(music.currentTime || 0));
    sessionStorage.setItem("musicMuted", music.muted ? "1" : "0");
  } catch (_) {}
}
function resumeMusic() {
  try {
    const at = parseFloat(sessionStorage.getItem("musicAt"));
    if (!isNaN(at)) music.currentTime = at;
    if (sessionStorage.getItem("musicMuted") === "1") {
      music.muted = true;
      musicBtn.classList.add("off");
    }
  } catch (_) {}
  startMusic();
}

musicBtn.addEventListener("click", () => {
  music.muted = !music.muted;
  musicBtn.classList.toggle("off", music.muted);
  musicBtn.setAttribute("aria-pressed", String(music.muted));
  musicBtn.setAttribute("aria-label", music.muted ? "Play music" : "Mute music");
});

/* ---------- tap (or click) anywhere on the background for a little puff of hearts ---------- */
function enableTapHearts() {
  let last = 0;
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a, video, .photo, .day, .calendar, .fold, .pic, .sheet")) return;
    const now = performance.now();
    if (now - last < 120) return;   // don't flood on rapid taps
    last = now;
    burst(e.clientX, e.clientY, 9, true, 0.35);
  });
}

/* =========================================================
   Guess the date
   ========================================================= */
const TEMPS = [
  { max: 2, word: "JAL RAHA HOON 🔥🔥", color: "#b2241b", heat: 0.97 },
  { max: 4, word: "🥵", color: "#c4472f", heat: 0.85 },
  { max: 7, word: "garmi ho rahi hai", color: "#c86a2e", heat: 0.7 },
  { max: 11, word: "mehhhh", color: "#9a7a45", heat: 0.52 },
  { max: 17, word: "thanda hai yaar", color: "#4f78a3", heat: 0.3 },
  { max: Infinity, word: "THANDAAA AHHH 🥶🥶", color: "#2b4a7a", heat: 0.08 },
];
const temperature = (days) => TEMPS.find((t) => days <= t.max);
const dayDiff = (a, b) => Math.round(Math.abs(a - b) / 864e5);

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const RING_SVG = `<svg viewBox="0 0 40 38" preserveAspectRatio="none"><path class="ring" d="M24 3 C12 1 2 8 3 19 C4 30 15 35 25 34 C35 33 39 25 38 16 C37 7 28 2 18 4"/></svg>`;
const X_SVG = `<svg viewBox="0 0 40 38" preserveAspectRatio="none"><path class="x" d="M11 9 L29 29 M29 9 L12 30"/></svg>`;

const SCRIBBLE_SVG = `<svg viewBox="0 0 40 38" preserveAspectRatio="none"><path class="scribble" d="M3 14 C10 9 22 6 37 9 C26 13 12 17 4 21 C14 19 27 15 38 17 C27 22 14 26 5 29 C15 28 26 25 36 26"/></svg>`;

/* One calendar game. Both "when I'll come" and "when I'm leaving" use this.
   options: answer (Date), label (note by the circled day), winMessage (big text on a win),
            onWin(), fakeOut (Date that pretends to be right) */
// a giant heart that thumps in the middle of the screen
function bigHeartPop() {
  const h = document.createElement("div");
  h.className = "big-heart";
  h.innerHTML = heartSvg("#e0262b");
  fx.appendChild(h);
  h.animate(
    [
      { transform: "translate(-50%,-50%) scale(.2)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.15)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%,-50%) scale(.95)", opacity: 1, offset: 0.4 },
      { transform: "translate(-50%,-50%) scale(1.1)", opacity: 1, offset: 0.55 },
      { transform: "translate(-50%,-50%) scale(1.9)", opacity: 0 },
    ],
    { duration: 1800, easing: "ease-out" }
  ).onfinish = () => h.remove();
  // the big heart bursts into lots of small ones
  setTimeout(() => burst(innerWidth / 2, innerHeight / 2, 70, true, 1.3), 900);
}

// the extra-big version for the leaving page's 17th
async function epicCelebration() {
  const flash = document.createElement("div");
  flash.className = "flash";
  flash.style.background = "radial-gradient(ellipse at center, rgba(255,220,225,.85), rgba(255,120,140,.5))";
  document.body.appendChild(flash);
  flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: "ease-out" }).onfinish = () => flash.remove();

  bigHeartPop();
  paperHearts(100);
  // fireworks of hearts popping all over the screen
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 6; i++) {
      burst(rand(innerWidth * 0.1, innerWidth * 0.9), rand(innerHeight * 0.15, innerHeight * 0.75), 32, true, rand(0.9, 1.4));
      await wait(260);
    }
    if (round === 1) bigHeartPop();
    await wait(500);
    paperHearts(45);
  }
}

function createGame(root, { answer, label = "", winMessage = "", onWin, fakeOut, epic = false }) {
  const q = (s) => root.querySelector(s);
  const cal = q(".calendar");
  const grid = q(".cal-grid");
  const fb = q(".feedback");
  const marker = q(".t-marker");
  let solved = false;
  let busy = false;

  // ---- draw the month ----
  const y = answer.getFullYear(), m = answer.getMonth();
  q(".cal-month").textContent = answer.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  ["M", "T", "W", "T", "F", "S", "S"].forEach((d) => {   // weeks start on Monday, British style
    const el = document.createElement("span");
    el.className = "dow";
    el.textContent = d;
    grid.appendChild(el);
  });
  const first = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) grid.appendChild(document.createElement("span"));
  for (let d = 1; d <= count; d++) {
    const date = new Date(y, m, d);
    const btn = document.createElement("button");
    btn.className = "day";
    btn.textContent = d;
    btn.setAttribute("aria-label", date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }));
    if (date < today) {
      btn.classList.add("past");
      btn.disabled = true;
    }
    btn.addEventListener("click", () => guess(date, btn));
    grid.appendChild(btn);
  }

  // ---- little helpers ----
  function say(text, big = false) {
    fb.textContent = text;
    fb.classList.toggle("big", big);
    fb.classList.remove("pop");
    void fb.offsetWidth;
    if (text) fb.classList.add("pop");
  }
  function thermo(heat) {
    marker.classList.add("show");
    marker.style.left = heat * 100 + "%";
  }
  function shake() {
    cal.classList.remove("shake", "yay");
    void cal.offsetWidth;
    cal.classList.add("shake");
  }
  function hotCold(diff, message) {
    const temp = temperature(diff);
    thermo(temp.heat);
    say(message || temp.word);
    const cold = clamp((0.55 - temp.heat) / 0.47);
    const hot = clamp((temp.heat - 0.5) / 0.47);
    parts = parts.filter((p) => p.k === "love");   // don't mix snow and embers
    setWeather({ cold, hot });
    if (cold > 0 || hot > 0) flashTemp(cold, hot);
    shake();
  }
  function crossOut(btn) {
    btn.classList.add("guessed");
    btn.disabled = true;
    btn.insertAdjacentHTML("beforeend", X_SVG);
  }

  // ---- a guess ----
  function guess(date, btn) {
    if (solved || busy) return;
    if (sameDay(date, answer)) return win(btn);
    if (fakeOut && sameDay(date, fakeOut)) return fakeWin(btn, date);
    crossOut(btn);
    hotCold(dayDiff(date, answer));
  }

  // looks right… then isn't. Done like someone with a pen changing their mind:
  // circle it, start celebrating, scrawl "wait what" next to it, then scribble the whole thing out.
  async function fakeWin(btn, date) {
    busy = true;
    btn.disabled = true;
    btn.insertAdjacentHTML("beforeend", RING_SVG);
    say("");
    thermo(1);
    parts = [];
    setWeather({ love: 0.9 });
    cal.classList.remove("shake");
    cal.classList.add("yay");
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 45);
    paperHearts(25);

    await wait(2700);   // long enough to believe it
    setWeather({ love: 0 });
    cal.classList.remove("yay");
    btn.insertAdjacentHTML("beforeend", `<span class="us scrawl">wait what</span>`);

    await wait(2000);
    btn.insertAdjacentHTML("beforeend", SCRIBBLE_SVG);
    btn.classList.add("guessed");
    await wait(650);
    hotCold(dayDiff(date, answer), "galat hai babyyy 😜😜");
    busy = false;
  }

  async function win(btn) {
    solved = true;
    btn.disabled = true;
    btn.insertAdjacentHTML("beforeend", RING_SVG + (label ? `<span class="us">${label}</span>` : ""));
    root.querySelectorAll(".day:not(:disabled)").forEach((b) => (b.disabled = true));

    say(winMessage, true);
    thermo(1);
    parts = [];
    setWeather({ love: 1 });
    cal.classList.remove("shake");
    cal.classList.add("yay");

    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 90);
    await wait(350);
    burst(rand(innerWidth * 0.15, innerWidth * 0.35), innerHeight * 0.35, 50);
    await wait(250);
    burst(rand(innerWidth * 0.65, innerWidth * 0.85), innerHeight * 0.3, 50);
    paperHearts(90);
    if (epic) epicCelebration();
    await wait(700);
    if (onWin) onWin();
    await wait(2500);
    paperHearts(50);
    await wait(epic ? 9000 : 4000);
    setWeather({ love: 0.4 });
  }
}
