# Learn Korean: class website

A simple site for students with three sections: **Words** (list, flashcards, audio, quizzes), **Homework**, and **Videos**.
It's plain HTML/CSS/JavaScript, so there's nothing to install or build.

## Preview it on your computer
The pages load content from the `data/` folder, and browsers block that when you double-click a file. Run a tiny local server instead:

```bash
cd "Desktop/Demo website"
python3 -m http.server 8000
```
Then open <http://localhost:8000>. Press `Ctrl+C` in the terminal to stop it.

## Adding content
All content lives in three files in `data/`. Copy an existing entry, paste it, and edit it. Keep the commas between entries, and give every entry a unique `id`.

### A word: `data/words.json`
```json
{ "id": "w32", "korean": "학교", "romanization": "hakgyo", "english": "school", "lesson": 4, "topic": "Places", "example": "학교에 가요. (I go to school.)" }
```
New lessons and topics show up in the filters automatically. `example` can be `""`.

### Homework: `data/homework.json`
```json
{ "id": "hw4", "title": "Places around town", "lesson": 4, "due": "2026-12-03",
  "instructions": "Write 5 sentences using the Lesson 4 words.",
  "link": "https://forms.gle/your-form-id" }
```
- `due` must be `YYYY-MM-DD`.
- `link` is where the **Submit** button goes. Use a Google Form (recommended, since responses collect in a spreadsheet) or an email link like `mailto:you@school.edu?subject=Homework%204`.

### A video: `data/videos.json`
```json
{ "id": "v4", "title": "Korean places vocabulary", "youtubeId": "dQw4w9WgXcQ", "lesson": 4, "description": "Short description." }
```
`youtubeId` is the part after `v=` in a YouTube URL (`https://www.youtube.com/watch?v=`**`dQw4w9WgXcQ`**). The sample videos have an empty `youtubeId`, so they show a placeholder until you fill one in.

## Setting up homework submissions with Google Forms
1. Go to <https://forms.google.com> and create a form with a "Name" question plus a "File upload" or "Paragraph" question.
2. Click **Send**, then the 🔗 link tab, and copy the short link.
3. Paste it as the `link` for that assignment.

## Putting the site online (free)
**Option A: Netlify Drop (easiest)**
1. Go to <https://app.netlify.com/drop>.
2. Drag the whole `Demo website` folder onto the page. You'll get a public link right away.
3. To update the site later, drag the folder again from the site's **Deploys** page.

**Option B: GitHub Pages**
1. Create a GitHub repository and upload these files.
2. Go to **Settings → Pages**, set Source to the `main` branch, and save.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

## Good to know
- **Student progress** (known words, finished homework) is saved in each student's own browser. It doesn't sync between devices, and you can't see it as the teacher.
- **Audio** uses the browser's built-in Korean voice. It works best in Chrome, Safari and Edge. If a device has no Korean voice, the Words page shows a notice.

## Files
```
index.html, words.html, homework.html, videos.html   pages
css/style.css                                        all styling
js/common.js                                         nav, data loading, audio, storage
js/words.js / homework.js / videos.js                page logic
data/*.json                                          your content
```
