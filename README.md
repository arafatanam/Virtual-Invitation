# Virtual Invitation

Interactive 3D wedding invitations, built mobile-first. Each folder is a self-contained static site with no build step and no dependencies to install.

The invitations are in two collections:

- **`desi/`** — Bangladeshi and South Asian Muslim weddings, including several royal designs.
- **`western/`** — classic Western-style weddings.

## Desi collection

| # | Invitation | Live link | What happens |
|---|---|---|---|
| 01 | Mehedi | [open](https://arafatanam.github.io/Virtual-Invitation/desi/01-mehndi/) | A mehedi cone pipes the design onto a 3D hand. The paste dries and flakes off to reveal the stain, and then guests hunt for the groom’s hidden initial. |
| 02 | Shahi Mahal (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/02-haveli/) | Carved palace doors swing open onto a walk through Mughal arches hung with marigolds, ending at the couple’s royal pavilion. |
| 03 | Churi | [open](https://arafatanam.github.io/Virtual-Invitation/desi/03-churiyan/) | Glass, gold and kundan bangles drop onto a wrist and jingle when tapped. For each event they re-form into a new shape (stack, spiral, orb, wreath, interlinked pair). |
| 04 | Alpona | [open](https://arafatanam.github.io/Virtual-Invitation/desi/04-alpona/) | An alpona pours in from coloured powder, ringed by brass lanterns. It turns into a new design for each event, including an eight-point Islamic star, and finally spells the couple’s names. |
| 05 | Nikah Farman (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/05-nikah/) | Break the wax seal and a royal scroll unrolls (Bismillah, names in Bengali) in front of a moonlit Mughal palace with a reflecting pool and fireworks. |
| 06 | Gaye Holud | [open](https://arafatanam.github.io/Virtual-Invitation/desi/06-holud/) | A bright daytime design with blooming 3D marigolds, swinging garland ropes and turmeric splashes on every tap. |
| 07 | Shahi Biye (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/07-darbar/) | Haggle over the gate-dhora fee and snip the ribbon, then walk the red carpet through a darbar hall with crystal chandeliers to the couple’s stage. |
| 08 | Jamdani (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/08-jamdani/) | A handloom weaves the invitation thread by thread in jamdani motifs, then the cloth lifts off as a flowing 3D sari. |
| 09 | Jewel Box (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/09-jewel-box/) | A burgundy velvet box opens to a music-box melody. A faceted diamond ring rises from the satin, and each celebration swaps the stone (citrine, diamond, ruby, emerald, sapphire). |
| 10 | Gold Foil (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/10-gold-foil/) | A luxury stationery suite. Break the gold seal and the card slides out of an emerald envelope. The gold foil catches the light as you tilt your phone, and the remaining cards are dealt out as you scroll. |
| 11 | Royal Peacock (royal) | [open](https://arafatanam.github.io/Virtual-Invitation/desi/11-peacock/) | A Mughal peacock fan of iridescent 3D feathers sweeps open around a gold monogram medallion. Tap it and the peacock rattles its train. |
| H&T | Hamza & Tahia | [open](https://arafatanam.github.io/H-T-Virtual-Wedding-Card/) | Moved to its own repository, [H-T-Virtual-Wedding-Card](https://github.com/arafatanam/H-T-Virtual-Wedding-Card): "Our Story" (an illustrated, scroll-scrubbed film) and "The Card" (a curtain-reveal card). |

## Western collection

| # | Invitation | Live link |
|---|---|---|
| 01 | Stardust | [open](https://arafatanam.github.io/Virtual-Invitation/western/01-stardust/) |
| 02 | Theatre | [open](https://arafatanam.github.io/Virtual-Invitation/western/02-theatre/) |
| 03 | Garden | [open](https://arafatanam.github.io/Virtual-Invitation/western/03-garden/) |
| 04 | Storybook | [open](https://arafatanam.github.io/Virtual-Invitation/western/04-storybook/) |
| 05 | Lanterns | [open](https://arafatanam.github.io/Virtual-Invitation/western/05-lanterns/) |
| 06 | Snow Globe | [open](https://arafatanam.github.io/Virtual-Invitation/western/06-snowglobe/) |
| 07 | Pop-up Card | [open](https://arafatanam.github.io/Virtual-Invitation/western/07-popup/) |
| 08 | Vinyl | [open](https://arafatanam.github.io/Virtual-Invitation/western/08-vinyl/) |
| 09 | Kinetic Type | [open](https://arafatanam.github.io/Virtual-Invitation/western/09-kinetic/) |
| 10 | Disco | [open](https://arafatanam.github.io/Virtual-Invitation/western/10-disco/) |

Open the links on a phone with the sound on. Every invitation starts with a tap, because browsers only allow audio to play after the user interacts with the page.

## Folder layout

```
<collection>/0X-name/
  index.html     ← all the text (names, dates, venues, events)
  css/style.css  ← colours and fonts (design tokens at the top, in :root)
  js/main.js     ← animation, countdown date, RSVP handling, music
  vendor/        ← three.js r128 add-ons (where used) + music.js (music generated in code, no audio files)
```

## Editing details

All names, dates and venues are placeholders.

- **Text:** edit `index.html`.
- **Countdown:** in `js/main.js`, search for `new Date('20`.
- **Calendar and map buttons:** update the `href` links in `index.html`.
- **Names drawn in 3D, on canvas or woven:**
  - desi/02 — `makeNames()`
  - desi/04 — `buildNameMask()`
  - desi/08 — `buildMask()`
  - desi/09 — the `lining` canvas
  - desi/11 — `faceTex`


## RSVP

The forms validate input and play their thank-you animations, but **they don’t send replies anywhere yet**. To make them save replies, find the `// NOTE: connect a form backend here` comment in each `main.js` and post the reply from there to Google Forms, Formspree, Supabase or a similar service.

## Running locally

Open any folder’s `index.html` in a browser, or serve the repo root with any static server, for example `npx serve .`.

## Deploying

GitHub Pages serves the site from the root of the `main` branch. Pushing to `main` redeploys it automatically within a minute or two.
