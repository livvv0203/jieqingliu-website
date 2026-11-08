# Jieqing Liu website

A static personal portfolio at [jieqingliu.com](https://jieqingliu.com/). The design uses a compact dark dashboard layout with pink accents, a local Codex activity chart, and project cards. It uses plain HTML and CSS, with no package dependencies.

## Update the site

- Edit `index.html` for copy, links, and project cards. The showcase is the `#projects` section. Update a card's title, summary, status, preview, and destination together when a working demo or repository becomes available. Keep concepts clearly marked until their status is verified.
- Edit `styles.css` for layout, typography, and colors. Main color variables are at the start of the file. The pink accent is `#F7A7BB`.
- Replace `profile.jpg` and update the embedded portrait in `favicon.svg` when changing the profile photo. `build.mjs` inlines both into the deployable page.
- The X, Instagram, and LinkedIn follower counts in `index.html` are a manual snapshot, shown as `5+`, `8K+`, and `1K+` on November 7, 2026. Update them and their accessible labels after checking the profiles. Instagram's and LinkedIn's counts were supplied by Jieqing.
- The GitHub section links to `livvv0203` and currently shows 26 public repositories, checked on November 8, 2026. Its contribution calendar is a separate November 7 snapshot. Update the count, calendar dates, and activity squares when the public profile changes.
- The only professional background claims are TikTok and UCLA, based on Jieqing’s LinkedIn. Check [LinkedIn](https://www.linkedin.com/in/jieqing-liu-8a85aba7/) before adding titles, dates, or achievements.

For future project cards, show the problem, what you made, what you changed after testing, and a working demo or repository link. Use actual screenshots or artifacts once available.

## Preview and build

Run `npm run dev` and open `http://localhost:4173` for a local preview.

Run `npm run build` to create `dist/index.html`, a self-contained page with CSS and favicon embedded. Open that file to review the upload artifact.

The build also refreshes the public Codex token counter and bar chart from `~/.codex/state_5.sqlite` when that database is available. It sums the local `tokens_used` values for primary threads, excluding separate subagent and review threads, and records the session count, distinct workspace count, and snapshot date. The chart shows one anonymous bar per session. It publishes no project names or paths. If the database is unavailable, the previous snapshot stays in the page. Rebuild and redeploy to refresh the live number; it is not a live account-wide API total and may omit activity on other devices.

## Publish on Netlify

The site is hosted on the Netlify `jieqing-portfolio` project in team `livvv0203`. It currently uses manual **Netlify Drop** deployments. GitHub pushes do not update the live site.

1. Run `npm run build`.
2. Open the Netlify project's **Deploys** page.
3. Select **browse files to upload** and choose `dist/index.html`, or drag a ZIP containing only `dist/index.html` onto the deploy drop zone if the file picker is unavailable. Rebuild the ZIP after later edits with `zip -j -FS portfolio-current-upload.zip dist/index.html`.
4. Wait for the deploy to publish and verify `https://jieqingliu.com/`.

Keep the custom domain on this Netlify project. The private `livvv0203/jieqing-portfolio-3d` GitHub repository contains the older 3D template and is not connected to this deployment. The current source is backed up in the public [`livvv0203/jieqingliu-website`](https://github.com/livvv0203/jieqingliu-website) repository.
