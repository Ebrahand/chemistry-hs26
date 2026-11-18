# Chemistry HS26 — interactive companion

Interactive pages for the ETH Zurich D-MAVT first-year Chemistry course (HS26).
A static site: plain HTML, CSS and JavaScript, with no build step and no server code.
Nothing a student does on the site is recorded or sent anywhere.

## Structure

```
index.html            landing page, one row per syllabus topic
assets/style.css      shared styles (light and dark mode)
assets/plot.js        small canvas plotting helper (no dependencies)
assets/quiz.js        self-check questions
assets/format.js      number and unit formatting
kinetics-1/           topic 10, Chemical kinetics I
  index.html          page text, equations (KaTeX), controls
  ratelaw.js          module 2: order explorer and initial-rates lab
  orders.js           module 3: zero/first/second order over time
  detective.js        "what order is it?" exercise
```

Equations are rendered with KaTeX 0.16.11, loaded from cdn.jsdelivr.net.

## Run it locally

ES modules do not load from `file://`, so serve the folder:

```bash
python3 -m http.server 8642 --directory website
```

Then open <http://localhost:8642>.

## Publish (GitHub Pages)

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository: Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`. Every push to `main` updates it within a minute or two.

`.nojekyll` tells GitHub Pages to serve the files as they are.

## Adding a topic

Copy `kinetics-1/` as a starting point, keep Brown's notation, and turn the topic's row on `index.html`
into a link (`class="topic live"`). Check every number against Brown or the lecture slides, and open
the page on a desktop and a phone before pushing.
