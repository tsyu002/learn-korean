// Shared helpers used by every page.

// Load a JSON file from the data/ folder.
async function loadData(name) {
  const res = await fetch(`data/${name}.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Could not load data/${name}.json`);
  return res.json();
}

// Show a friendly error when data can't load (e.g. the page was opened from disk).
function showLoadError(container, err) {
  console.error(err);
  container.innerHTML = `
    <div class="notice">
      Couldn't load the content. If you opened this file directly, start a local server instead:
      run <code>python3 -m http.server</code> in the project folder and visit
      <a href="http://localhost:8000">http://localhost:8000</a>.
    </div>`;
}

// localStorage wrapper that never throws (private mode, blocked storage, etc.).
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

// Escape text before putting it into innerHTML.
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Fill a <select> with "All lessons" plus each lesson found in the data.
function fillLessonSelect(select, items) {
  const lessons = [...new Set(items.map(i => i.lesson))].sort((a, b) => a - b);
  select.innerHTML = `<option value="">All lessons</option>` +
    lessons.map(l => `<option value="${esc(l)}">Lesson ${esc(l)}</option>`).join("");
}

// Shuffle a copy of an array.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Text-to-speech (Korean) ----------
let koVoice = null;
function pickKoreanVoice() {
  if (!("speechSynthesis" in window)) return null;
  koVoice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("ko")) || null;
  return koVoice;
}
if ("speechSynthesis" in window) {
  pickKoreanVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickKoreanVoice);
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("Sorry, your browser doesn't support audio pronunciation.");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.85;
  if (koVoice) u.voice = koVoice;
  speechSynthesis.speak(u);
}

// ---------- Navigation ----------
function renderNav() {
  const here = location.pathname.split("/").pop() || "index.html";
  const links = [
    ["index.html", "Home"],
    ["words.html", "Words"],
    ["homework.html", "Homework"],
    ["videos.html", "Videos"],
  ];
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <nav aria-label="Main">
      <a class="brand" href="index.html"><span>한국어</span> Learn Korean</a>
      <div class="nav-links">
        ${links.map(([href, label]) =>
          `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </div>
    </nav>`;
  document.body.prepend(header);
}
renderNav();
