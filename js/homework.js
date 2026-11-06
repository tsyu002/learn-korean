// Homework page: assignment cards with due-date status and a "done" checkbox.

const list = document.getElementById("hw-list");
const lessonSel = document.getElementById("lesson-filter");
const hideDone = document.getElementById("hide-done");

let homework = [];
let done = new Set(store.get("homeworkDone", []));
hideDone.checked = store.get("hideDone", false);

const DAY = 24 * 60 * 60 * 1000;

// Parse "YYYY-MM-DD" as a local date (new Date("2026-11-12") would be UTC).
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function status(hw) {
  if (done.has(hw.id)) return { cls: "done", label: "Done" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((parseDate(hw.due) - today) / DAY);
  if (days < 0) return { cls: "past", label: "Past due" };
  if (days === 0) return { cls: "soon", label: "Due today" };
  if (days <= 3) return { cls: "soon", label: `Due in ${days} day${days === 1 ? "" : "s"}` };
  return { cls: "upcoming", label: `Due in ${days} days` };
}

function render() {
  const lesson = lessonSel.value;
  const items = homework
    .filter(h => !lesson || String(h.lesson) === lesson)
    .filter(h => !(hideDone.checked && done.has(h.id)))
    .sort((a, b) => a.due.localeCompare(b.due));

  if (!items.length) {
    list.innerHTML = `<div class="empty">No assignments to show.</div>`;
    return;
  }

  list.innerHTML = items.map(h => {
    const s = status(h);
    const due = parseDate(h.due).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    return `
      <article class="card hw-card ${done.has(h.id) ? "done" : ""}">
        <div class="hw-meta">
          <span class="tag">Lesson ${esc(h.lesson)}</span>
          <span class="badge ${s.cls}">${s.label}</span>
        </div>
        <h2 style="font-size:1.2rem">${esc(h.title)}</h2>
        <p class="muted" style="margin:0;font-size:.9rem">Due ${esc(due)}</p>
        <p style="margin:0">${esc(h.instructions)}</p>
        <div class="hw-actions">
          ${h.link ? `<a class="btn btn-primary" href="${esc(h.link)}" target="_blank" rel="noopener">Submit</a>` : ""}
          <label><input type="checkbox" data-id="${esc(h.id)}" ${done.has(h.id) ? "checked" : ""}> Done</label>
        </div>
      </article>`;
  }).join("");
}

list.addEventListener("change", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  e.target.checked ? done.add(id) : done.delete(id);
  store.set("homeworkDone", [...done]);
  render();
});
lessonSel.addEventListener("change", render);
hideDone.addEventListener("change", () => { store.set("hideDone", hideDone.checked); render(); });

(async function init() {
  try {
    homework = await loadData("homework");
  } catch (err) {
    showLoadError(list, err);
    return;
  }
  fillLessonSelect(lessonSel, homework);
  render();
})();
