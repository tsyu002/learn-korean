// Videos page: grid of YouTube embeds filtered by lesson.

const list = document.getElementById("video-list");
const lessonSel = document.getElementById("lesson-filter");
let videos = [];

function render() {
  const lesson = lessonSel.value;
  const items = videos.filter(v => !lesson || String(v.lesson) === lesson);

  if (!items.length) {
    list.innerHTML = `<div class="empty">No videos for this lesson yet.</div>`;
    return;
  }

  list.innerHTML = items.map(v => `
    <article class="card">
      <div class="video-frame">
        ${v.youtubeId
          ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtubeId)}"
               title="${esc(v.title)}" loading="lazy"
               allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
               allowfullscreen></iframe>`
          : `<div class="video-placeholder">🎬 No video yet. Add a <code>youtubeId</code> in data/videos.json.</div>`}
      </div>
      <span class="tag">Lesson ${esc(v.lesson)}</span>
      <h2 style="font-size:1.1rem;margin-top:.5rem">${esc(v.title)}</h2>
      <p class="muted" style="margin:0">${esc(v.description)}</p>
    </article>`).join("");
}

lessonSel.addEventListener("change", render);

(async function init() {
  try {
    videos = await loadData("videos");
  } catch (err) {
    showLoadError(list, err);
    return;
  }
  fillLessonSelect(lessonSel, videos);
  render();
})();
