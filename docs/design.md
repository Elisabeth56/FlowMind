# FlowMind design

Direction: **Clear desk**. The feeling to leave people with is relief: put it down, it gets sorted.

Source of truth for tokens and components: the FlowMind design system (claude.ai artifact). Screens: the "FlowMind screens" canvas. This file records the decisions so the code can follow them without opening either.

## Identity

- **Mark:** "Settle", three filed bars on an ink-blue tile, the top one still landing. `public/brand/mark.svg` (32px and up), `public/brand/favicon.svg` (16px cut: thicker bars, no tilt). The top bar levels on hover and while an item is being organized.
- **Colour:** warm paper `#F2F0EC`, ink `#292826` with a grey ramp, one accent (ink blue `#1F3A5F`, tint `#D3E1EF`) and one warm note (apricot `#F2B27E`, tint `#FBE3CF`, text `#8A4B1F`). Project colours: blue, sage `#5E7F6A`, apricot, plum `#7A5C7E`.
- **Colour means something in the app:** a project's colour on its chips, dot and charts; apricot means "now" (current step, progress, usage, source numbers in Ask, the one thing to try).
- **Type:** Geist 400/500 for everything; Instrument Serif for numerals only.
- **Shape:** no sharp corners. 8 / 14 / 20 / 28 / pill. Flat by default; soft shadow only for floating things.

## Motion

One signature moment per page; everything else is quiet and finishes by the time an element is fully on screen.

- **Landing hero (signature):** a note is typed into the capture bar, drops onto a pile, tidies into a titled card with chips, then flies into the tray render as a square paper slip and lands on the stack. Built on a fixed 600 x 450 stage that matches `hero-tray.webp` (4:3, never cropped) so it lands in the same place at every width. Tray floor: tilted 70deg away from the viewer, turned -33deg; slips use the same angles.
- **Elsewhere:** headline words blur to sharp, apricot underline draws itself, sections rise in, the How-it-works connector draws, Today's checkboxes tick, Ask answers stream, weekly numbers count up. In the app: an item settles once when organized; completing a task ticks, fades and moves with undo.
- `prefers-reduced-motion`: every effect shows its end state.

## Imagery

`public/images/`, WebP, about 250 KB in total.

| File | Where | Source |
|---|---|---|
| `hero-tray.webp` | Landing hero stage | AI render |
| `close-tray-night.webp` | Closing "Empty your head tonight" panel | AI render |
| `capture-commute.webp` | Capture from anywhere, morning | Stock photo |
| `capture-midday.webp` | Capture from anywhere, midday | Stock photo (replace: book text is Cyrillic) |
| `capture-night.webp` | Capture from anywhere, night | Stock photo |

Before launch, check each stock photo's licence page and record the photographer here.

## Copy

Sentence case, short, specific. Only real numbers (pricing from `src/lib/plans.ts`). Pro lists what Pro actually does: unlimited AI actions and Ask your notes. Contact: hello@elisabethnnamani.dev.
