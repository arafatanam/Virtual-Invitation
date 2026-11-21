# Virtual Invitation

Ten interactive 3D wedding invitations, built mobile-first. Each folder is a self-contained static site with no build step and no dependencies to install.

**Live demos (GitHub Pages)**

| # | Invitation | Live link | Main effect |
|---|---|---|---|
| 01 | Stardust | [open](https://arafatanam.github.io/Virtual-Invitation/01-stardust/) | Particles morph into names, rings, date, heart and map pin as you scroll |
| 02 | Theatre | [open](https://arafatanam.github.io/Virtual-Invitation/02-theatre/) | 3D theatre: velvet curtains part, spotlights, gold confetti |
| 03 | Garden | [open](https://arafatanam.github.io/Virtual-Invitation/03-garden/) | 3D envelope with wax seal, petals, butterflies, flip clock |
| 04 | Storybook | [open](https://arafatanam.github.io/Virtual-Invitation/04-storybook/) | A 3D book you page through by dragging |
| 05 | Lanterns | [open](https://arafatanam.github.io/Virtual-Invitation/05-lanterns/) | Reflective lake, rising lanterns, tap to release your own |
| 06 | Snow Globe | [open](https://arafatanam.github.io/Virtual-Invitation/06-snowglobe/) | Glass globe with a snowy cabin; swipe to spin, shake your phone to swirl the snow, aurora sky |
| 07 | Pop-up Card | [open](https://arafatanam.github.io/Virtual-Invitation/07-popup/) | Paper pop-up scenes that fold up as you scroll; postcard RSVP |
| 08 | Vinyl | [open](https://arafatanam.github.io/Virtual-Invitation/08-vinyl/) | Sleeve to turntable; scratch the record, live EQ, funk groove |
| 09 | Kinetic Type | [open](https://arafatanam.github.io/Virtual-Invitation/09-kinetic/) | Scroll-scrubbed typography, 3D date cube, horizontal timeline |
| 10 | Disco | [open](https://arafatanam.github.io/Virtual-Invitation/10-disco/) | Mirror ball, beat-synced LED floor you can tap, light beams |

Tip: open the links on a phone with sound on. Every invitation starts with a tap, because browsers only allow audio after the user interacts.

## Folder layout

```
0X-name/
  index.html     ← all the text (names, dates, venue, schedule)
  css/style.css  ← colours and fonts (design tokens at the top in :root)
  js/main.js     ← animation, countdown date, RSVP handling, music
  vendor/        ← three.js r128 add-ons (where used) + music.js (music generated in code, no audio files)
```

## Editing details

All names, dates and venues are placeholders.

- **Text:** edit `index.html`.
- **Countdown:** in `js/main.js`, search for `new Date('20`.
- **Calendar and map buttons:** update the `href` links in `index.html`.
- **Text drawn in 3D or on canvas:** in 01 see `buildShapes()`, in 02 `namesTexture()`, in 05 `personalLantern()`, and in 06 the plaque canvas.

## RSVP

The forms validate input and play their thank-you animations, but **they don't send replies anywhere yet**. Each `main.js` has a `// NOTE: connect a form backend here` comment where you can post to Google Forms, Formspree, Supabase or similar.

## Running locally

Open any folder's `index.html` in a browser, or serve the repo root with any static server, for example `npx serve .`.

## Deploying

The site is served by GitHub Pages from the `main` branch root. Pushing to `main` redeploys it automatically within a minute or two.
