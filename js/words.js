// Words page: list, flashcards, quiz.

const els = {
  lesson: document.getElementById("lesson-filter"),
  topic: document.getElementById("topic-filter"),
  search: document.getElementById("search"),
  rows: document.getElementById("word-rows"),
  count: document.getElementById("count"),
  flash: document.getElementById("flash-area"),
  learningOnly: document.getElementById("learning-only"),
  englishFirst: document.getElementById("english-first"),
  quiz: document.getElementById("quiz-area"),
};

let words = [];
let known = new Set(store.get("knownWords", []));
const saveKnown = () => store.set("knownWords", [...known]);

// Words matching the lesson + topic dropdowns (shared by all tabs).
function filteredWords() {
  const lesson = els.lesson.value;
  const topic = els.topic.value;
  return words.filter(w =>
    (!lesson || String(w.lesson) === lesson) &&
    (!topic || w.topic === topic));
}

const speakBtn = (w) =>
  `<button class="icon-btn" data-speak="${esc(w.korean)}" aria-label="Play pronunciation of ${esc(w.korean)}" title="Listen">🔊</button>`;

// ---------- Tabs ----------
let activeTab = store.get("wordsTab", "list");
function showTab(name) {
  activeTab = name;
  store.set("wordsTab", name);
  document.querySelectorAll(".tabs button").forEach(b =>
    b.setAttribute("aria-selected", b.dataset.tab === name));
  for (const t of ["list", "flash", "quiz"]) {
    document.getElementById(`tab-${t}`).classList.toggle("hidden", t !== name);
  }
  if (name === "flash") startFlashcards();
  if (name === "quiz") renderQuizStart();
}
document.querySelectorAll(".tabs button").forEach(b =>
  b.addEventListener("click", () => showTab(b.dataset.tab)));

// ---------- List ----------
function renderList() {
  const q = els.search.value.trim().toLowerCase();
  const list = filteredWords().filter(w =>
    !q || [w.korean, w.romanization, w.english].some(f => String(f).toLowerCase().includes(q)));

  els.count.textContent = `${list.length} word${list.length === 1 ? "" : "s"}`;
  if (!list.length) {
    els.rows.innerHTML = `<tr><td colspan="5" class="empty">No words match.</td></tr>`;
    return;
  }
  els.rows.innerHTML = list.map(w => `
    <tr>
      <td class="ko" lang="ko">${esc(w.korean)}
        ${known.has(w.id) ? '<span class="tag known">known</span>' : ""}
        ${w.example ? `<div class="example" lang="ko">${esc(w.example)}</div>` : ""}
      </td>
      <td class="muted">${esc(w.romanization)}</td>
      <td>${esc(w.english)}</td>
      <td><span class="tag">L${esc(w.lesson)} · ${esc(w.topic)}</span></td>
      <td>${speakBtn(w)}</td>
    </tr>`).join("");
}

// ---------- Flashcards ----------
let deck = [];
let deckIndex = 0;

function startFlashcards() {
  deck = filteredWords();
  if (els.learningOnly.checked) deck = deck.filter(w => !known.has(w.id));
  deckIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  if (!deck.length) {
    els.flash.innerHTML = `<div class="empty">${els.learningOnly.checked
      ? "🎉 You know every word in this set! Untick \"Only still learning\" to review them all."
      : "No words in this set."}</div>`;
    return;
  }
  const w = deck[deckIndex];
  const enFirst = els.englishFirst.checked;
  const koFace = `<div class="flash-main ko" lang="ko">${esc(w.korean)}</div><div class="flash-sub">${esc(w.romanization)}</div>`;
  const enFace = `<div class="flash-main" style="font-size:clamp(1.4rem,5vw,2rem)">${esc(w.english)}</div>
                  ${w.example ? `<div class="flash-sub example" lang="ko">${esc(w.example)}</div>` : ""}`;
  const isKnown = known.has(w.id);

  els.flash.innerHTML = `
    <button class="flashcard" id="card" aria-label="Flashcard. Click to flip.">
      <div class="flash-inner">
        <div class="flash-face flash-front">${enFirst ? enFace : koFace}</div>
        <div class="flash-face flash-back">${enFirst ? koFace : enFace}</div>
      </div>
    </button>
    <p class="progress">Card ${deckIndex + 1} of ${deck.length} · tap the card to flip</p>
    <div class="flash-controls">
      <button id="prev" ${deckIndex === 0 ? "disabled" : ""}>← Prev</button>
      ${speakBtn(w)}
      <button id="shuffle">🔀 Shuffle</button>
      <button id="next" ${deckIndex === deck.length - 1 ? "disabled" : ""}>Next →</button>
    </div>
    <div class="flash-controls">
      <button class="btn-warn" id="mark-learning">${!isKnown ? "✓ " : ""}Still learning</button>
      <button class="btn-ok" id="mark-known">${isKnown ? "✓ " : ""}I know it</button>
    </div>`;

  const card = document.getElementById("card");
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  document.getElementById("prev").onclick = () => { deckIndex--; renderFlashcard(); };
  document.getElementById("next").onclick = () => { deckIndex++; renderFlashcard(); };
  document.getElementById("shuffle").onclick = () => { deck = shuffle(deck); deckIndex = 0; renderFlashcard(); };
  document.getElementById("mark-known").onclick = () => mark(w, true);
  document.getElementById("mark-learning").onclick = () => mark(w, false);
}

function mark(w, isKnown) {
  isKnown ? known.add(w.id) : known.delete(w.id);
  saveKnown();
  renderList();
  // In "still learning" mode a newly-known word leaves the deck.
  if (els.learningOnly.checked && isKnown) {
    deck.splice(deckIndex, 1);
    if (deckIndex >= deck.length) deckIndex = Math.max(0, deck.length - 1);
  } else if (deckIndex < deck.length - 1) {
    deckIndex++;
  }
  renderFlashcard();
}

// Arrow keys / space for flashcards.
document.addEventListener("keydown", (e) => {
  if (activeTab !== "flash" || !deck.length || e.target.matches("input, select")) return;
  if (e.key === "ArrowRight" && deckIndex < deck.length - 1) { deckIndex++; renderFlashcard(); }
  else if (e.key === "ArrowLeft" && deckIndex > 0) { deckIndex--; renderFlashcard(); }
  else if (e.key === " ") { e.preventDefault(); document.getElementById("card")?.classList.toggle("flipped"); }
});

// ---------- Quiz ----------
const QUIZ_LENGTH = 10;
let quiz = null;

function renderQuizStart() {
  const pool = filteredWords();
  if (words.length < 4) {
    els.quiz.innerHTML = `<div class="empty">Add at least 4 words to make a quiz.</div>`;
    return;
  }
  els.quiz.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>Quiz yourself</h2>
      <p class="muted">${Math.min(QUIZ_LENGTH, pool.length)} multiple-choice questions from the selected lesson/topic.</p>
      <div class="flash-controls">
        <button class="btn-primary" data-dir="ko-en">Korean → English</button>
        <button class="btn-primary" data-dir="en-ko">English → Korean</button>
      </div>
    </div>`;
  els.quiz.querySelectorAll("[data-dir]").forEach(b =>
    b.addEventListener("click", () => startQuiz(b.dataset.dir)));
}

function startQuiz(dir) {
  const pool = filteredWords();
  if (!pool.length) { els.quiz.innerHTML = `<div class="empty">No words in this set.</div>`; return; }
  const questions = shuffle(pool).slice(0, QUIZ_LENGTH).map(answer => {
    // Prefer distractors from the same set; fall back to all words if the set is small.
    let others = pool.filter(w => w.id !== answer.id);
    if (others.length < 3) others = words.filter(w => w.id !== answer.id);
    const options = shuffle([answer, ...shuffle(others).slice(0, 3)]);
    return { answer, options };
  });
  quiz = { dir, questions, i: 0, score: 0, missed: [] };
  renderQuestion();
}

function renderQuestion() {
  const { dir, questions, i } = quiz;
  const { answer, options } = questions[i];
  const prompt = dir === "ko-en" ? answer.korean : answer.english;
  const label = (w) => dir === "ko-en" ? esc(w.english) : `<span class="ko" lang="ko">${esc(w.korean)}</span>`;

  els.quiz.innerHTML = `
    <p class="progress" style="text-align:center">Question ${i + 1} of ${questions.length} · Score ${quiz.score}</p>
    <div class="quiz-q ${dir === "ko-en" ? "ko" : ""}" ${dir === "ko-en" ? 'lang="ko"' : ""}>
      ${esc(prompt)} ${dir === "ko-en" ? speakBtn(answer) : ""}
    </div>
    <div class="options">
      ${options.map(o => `<button data-id="${esc(o.id)}">${label(o)}</button>`).join("")}
    </div>
    <div class="flash-controls" style="margin-top:1rem">
      <button class="btn-primary hidden" id="quiz-next">${i === questions.length - 1 ? "See results" : "Next →"}</button>
    </div>`;

  els.quiz.querySelectorAll(".options button").forEach(btn => {
    btn.addEventListener("click", () => {
      const correct = btn.dataset.id === answer.id;
      if (correct) quiz.score++; else quiz.missed.push(answer);
      els.quiz.querySelectorAll(".options button").forEach(b => {
        b.disabled = true;
        if (b.dataset.id === answer.id) b.classList.add("correct");
      });
      if (!correct) btn.classList.add("wrong");
      if (dir === "en-ko") speak(answer.korean);
      document.getElementById("quiz-next").classList.remove("hidden");
    });
  });
  document.getElementById("quiz-next").onclick = () => {
    quiz.i++;
    quiz.i < questions.length ? renderQuestion() : renderResults();
  };
}

function renderResults() {
  const { score, questions, missed } = quiz;
  const pct = Math.round((score / questions.length) * 100);
  const msg = pct === 100 ? "완벽해요! Perfect!" : pct >= 70 ? "잘했어요! Well done!" : "Keep practicing. 화이팅!";
  els.quiz.innerHTML = `
    <div class="card">
      <p class="score">${score} / ${questions.length}</p>
      <p style="text-align:center">${msg}</p>
      ${missed.length ? `
        <h3>Review these</h3>
        <ul class="missed">
          ${missed.map(w => `<li><span class="ko" lang="ko"><strong>${esc(w.korean)}</strong></span>
            <span class="muted">(${esc(w.romanization)})</span>: ${esc(w.english)} ${speakBtn(w)}</li>`).join("")}
        </ul>` : ""}
      <div class="flash-controls" style="margin-top:1rem">
        <button class="btn-primary" id="quiz-again">Try again</button>
      </div>
    </div>`;
  document.getElementById("quiz-again").onclick = renderQuizStart;
}

// ---------- Wiring ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-speak]");
  if (btn) { e.stopPropagation(); speak(btn.dataset.speak); }
}, true);

function onFilterChange() {
  renderList();
  if (activeTab === "flash") startFlashcards();
  if (activeTab === "quiz") renderQuizStart();
}
els.lesson.addEventListener("change", onFilterChange);
els.topic.addEventListener("change", onFilterChange);
els.search.addEventListener("input", renderList);
els.learningOnly.addEventListener("change", startFlashcards);
els.englishFirst.addEventListener("change", renderFlashcard);

(async function init() {
  try {
    words = await loadData("words");
  } catch (err) {
    showLoadError(document.querySelector("main"), err);
    return;
  }
  fillLessonSelect(els.lesson, words);
  const topics = [...new Set(words.map(w => w.topic))].sort();
  els.topic.innerHTML = `<option value="">All topics</option>` +
    topics.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");

  renderList();
  showTab(activeTab);

  // Voices load asynchronously in some browsers; check after a moment.
  setTimeout(() => {
    if ("speechSynthesis" in window && !pickKoreanVoice()) {
      document.getElementById("voice-notice").classList.remove("hidden");
    }
  }, 1000);
})();
