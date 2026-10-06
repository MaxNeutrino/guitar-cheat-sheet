# Guitar music theory cheat sheet

A responsive, full-width reference rebuilt from the supplied poster. Open `index.html` directly in a browser. No build, dependencies, external fonts or network access are needed.

## Layout

- **Wide screens (1850 px and up):** the moveable chords sit on the left. On the right, the circle of fifths, Chord construction and Chords in every key are stacked, so both columns end at about the same height.
- **1500–1849 px:** the circle and Chord construction sit beside the moveable chords, and Chords in every key spans the full width below them.
- **1000–1499 px:** the moveable chords take the full width. Below them, the circle sits on the left, with Chord construction and the key tables on the right.
- **Below 1000 px:** everything stacks in one column.
- **Phones (650 px and narrower):**
  - The circle's Play / Next / Stop controls and the step text sit right under the circle, and "How to use the circle" starts collapsed.
  - Chord tables keep the chord-name column pinned while they scroll sideways.
  - Fretboards are drawn larger, with a tap area the size of each note's fret cell.
  - The chord popup shows its chord types in one sideways-scrolling row.
  - The nav bar shows a glow at its right edge while there's more to scroll.
  - Links and buttons are at least 36–44 px tall. Scale maps always run full width.

## Contents

- Fretboard notes across all 24 frets, each clickable to open a chord finder
- 60 basic chord diagrams (12 roots × 5 families)
- 154 moveable chord diagrams (22 families × 7 voicings)
- Chord construction formulas and circle of fourths/fifths
- 11 scale maps: major (Ionian), natural minor (Aeolian), major and minor blues, Dorian, Phrygian, Lydian, Mixolydian, Locrian, harmonic minor and melodic minor; pentatonic omission instructions
- Diatonic triads in all 12 major and natural minor keys

All diagrams are SVG generated from musical data, so browser zoom and high-density displays remain sharp. On narrow screens, dense charts scroll horizontally within their panels.

## Chord finder

Click (or Tab to, and use the arrow keys and Enter on) any note on **Notes on the fretboard**. A popup lists chords with that note as the root, calculated for the selected tuning.

- **Strings 6, 5, 4:** root-position shapes with the note in the bass (E-, A-, D-, C- and G-shape barre and open chords).
- **Strings 3, 2, 1:** compact 3-note (triad) or 4-note shapes on the top strings, with the note as the root. When another chord tone is lowest, the chord gets a slash name and its inversion. For C, for example: string 3, fret 5 gives **C** (xxx553); string 2, fret 13 gives **C/G** (xxx-12-13-12); string 1, fret 8 gives **C/E** (xxx988).
- **Chord types:** 16, all without 9ths or higher: major, minor, 7, maj7, m7, 6, m6, m(maj7), sus2, sus4, 7sus4, dim, dim7, m7♭5, aug and aug7.
- **Shapes per type:** up to 3, ranked by stretch, fingers, gaps and fullness, and kept distinct from each other.
- **"In [key] major" tab:** the chords of the circle's key that contain the note, with its role (root, 3rd or 5th).
- **Limits:** about 1.7% of positions have no compact shape, all at the very ends of the neck (frets 22–24 and some open treble strings). The popup says so.

## Metronome

A round button in the bottom-right corner opens the metronome panel. On phones it opens as a bottom sheet.

- **Tempo:** 30–300 BPM. Set it with − / +, by typing, with the slider, or with **Tap tempo** (the average of your last few taps; a pause of 2 s starts a new count). The Italian tempo marking is shown underneath.
- **Meter:** any time signature. Beats per bar can be 1–32, and the note value 2, 4, 8, 16 or 32, so 17/16 works. Presets fill the fields (4/4, 3/4, 2/4, 6/8, 5/4, 7/8, 9/8, 12/8, 5/8, 11/8, 13/16, 15/16, 17/16). BPM counts every click, which is one note of the bottom number.
- **Accent groups,** e.g. `3+3+3+3+3+2`. Beat 1 gets the strongest click and the start of each group a lighter one. Eighth and sixteenth meters suggest groups of 3s and 2s automatically, and you can edit them. If the groups don't add up to the bar, you get a clear error message. You can also turn off the beat 1 accent, and set the volume.
- **Playing:** beat dots light up in time, and while it plays, the closed button pulses and shows the BPM.
- **Timing:** clicks are scheduled on the Web Audio clock, so they stay exact. They keep going in a background tab, where browsers slow ordinary timers.
- **Memory:** settings are remembered in this browser.

## Tuning selector

Choose from 26 presets: the standard E family and the Drop D family, each lowered by 0–12 semitones. The header shows scientific pitch notation for all six strings, low to high (for example E2–E4 in standard tuning, E1–E3 one octave down).

Fretboard notes, basic chords, moveable chords and scale maps update together. Chord labels refer to sounding pitch: a C chord remains C after retuning, with adjusted fret positions. Moveable examples remain in A. Drop tunings use adapted sixth-string shapes and newly calculated alternate voicings. Chord formulas, the circle of fifths and key tables are independent of tuning.

Scale maps run full width, one scale per row, across all 24 frets. Below about 1300 px of width, each board scrolls sideways inside its panel. Their key selector is linked to the circle of fifths in both directions: changing either one updates the other, the chords-in-key panel and the highlighted rows in Chords in every key. Both start on C. The selector covers all 12 pitch classes, plus checkboxes grouped as Essentials, Modes and Minor variants. The four essentials are shown by default. Seven-note scales also list their spelled notes, e.g. C Dorian: C D E♭ F G A B♭.

**Positions.** Click (or press Enter on) any red root to highlight its playing position from string 6 to string 1. The rest of the scale dims. Click the root again or press **Clear** to reset. The fingering follows the reference charts in `refs/`:
1. Walk two octaves up from string 6.
2. Stay on a string while the note is within the position (up to 3 frets above the start) and the string spans at most 4 frets.
3. Otherwise move to the next string.

From a sixth-string root, this reproduces all 8 reference charts note for note. Roots on other strings use the nearest string-6 start whose position contains them. Near the nut, the position stretches instead of using impossible negative frets, and it always reaches string 1. Changing the key or the tuning clears selected positions.

## Circle of fifths guide

**Structure.** The outer ring holds the major keys and the inner ring holds their relative minors, which share the same key signature. The edge ring shows how many sharps or flats each signature has. Clockwise is up a perfect fifth (+1 sharp), counterclockwise is down a fifth or up a fourth (+1 flat). Flat-side keys keep their correct names, with the sharp equivalent shown underneath (B♭ / A♯, E♭ / D♯, A♭ / G♯, B♭m / A♯m), and the bottom three slices show both spellings (B/C♭, F♯/G♭, D♭/C♯), so the circle runs from C♯ major (7♯) to C♭ major (7♭). Select any key on the circle with the mouse or keyboard. The key-signature panel then lists that key's sharps or flats in standard order.

**Reading it.** Roman numerals inside the teal window mark the selected key's chords: IV · I · V on the outer ring, ii · vi · iii on the inner ring, and vii° just outside the window. The window and numerals turn to whichever key you select, and the numerals stay upright. Hover over any key to see its role in the selected key, including which root carries the diminished vii°. The **How to use the circle** box lists six rules (key signature with the "Father Charles…" mnemonic, relative minor, chords of the key, progressions, changing key, guitar) with examples spelled for the selected key, plus a symbols key. Each rule has a *Show me* button that plays the matching lesson.

**Guitar help.** The key-signature panel suggests open-chord shapes or a capo position for the current key, and it accounts for the selected tuning. **Chords in [key]** lists the key's seven chords (I ii iii IV V vi vii°) with diagrams in one of two styles:
- **Open chords**: open-position shapes, with barre shapes where no open shape exists.
- **One position**: moveable shapes kept within a few frets. You choose whether the I chord has its root on string 6, 5 or 4.

Each diagram's badge (R6 / R5 / R4) shows which string carries the root.

**Lessons** (the Explore menu):
- *Key signatures*: **Sharps · clockwise** walks C → G → … → C♯, and **Flats · counterclockwise** walks C → F → … → C♭. Each step adds one accidental. These walks always start from C. While a walk is running, selecting a key on the circle jumps to its step.
- *Progressions & modulation*:
  - **I–IV–V neighbours**: adjacent slices differ by one note.
  - **Circle progression**: iii–vi–ii–V–I, with roots stepping counterclockwise on the outer ring.
  - **Modulate to V**, **Modulate to IV** and **Modulate to relative minor**, each through a pivot chord.
  - **Key distance**: badges count the notes each key shares with home: 7, 6, 5, 4, 3, 2, 2.
  - **Dominant resolution**, including V7/ii.
- *Minor keys & colour*: **Relative minor**, **Parallel minor**, **Borrowed chords** (minor iv), and **Minor key harmony**, which explains why minor keys use a major V (E7 in A minor).
- *Common progressions*: Pop (I–V–vi–IV), vi–IV–I–V, '50s (I–vi–IV–V), Jazz ii–V–I with 7th chords, and the 12-bar blues.
- *Guitar*: **Open strings** finds your tuning's open strings on the circle. They're neighbouring slices, except where the B string breaks the pattern.

**Animation.**
- A red arrow draws the move from the previous chord to the current one, and earlier moves stay as a faint trail.
- A halo pulses on the current chord, and the centre of the circle shows the chord and its role.
- The teal diatonic window rotates the shortest way to the current key, and new accidentals pop into the signature panel.

**Controls.**
- Play walks through a lesson once, at the chosen speed (slow, normal or fast). About 3 seconds after the last step, the circle returns to its clean state.
- **Stop** clears a lesson at any time. Pause, Next step, Restart and the individual chord buttons let you explore manually.
- While no lesson is running, selecting a key just selects it. It also sets the **Scale maps** key and highlights that key's rows in **Chords in every key**.
- Rotation uses SVG transform attributes, so it renders the same in Chromium and Firefox-based browsers.
- With `prefers-reduced-motion` set, everything is shown in its final state without motion.

Include `circle-guide.js` alongside the other static files when publishing.

An octave change preserves pitch classes, so note names and scale patterns repeat, while the header's octave numbers change. Run `node verify.cjs` to check chord tones and root-string positions across all 26 presets, plus every circle lesson, key signature and animation anchor.

## Source fidelity

The reference photo is too small to reliably transcribe individual fingering numbers and every alternate voicing. The section inventory and chord families are preserved, while moveable voicings are reconstructed and shown in A. Red dots indicate roots; black dots indicate fretted notes, not specific fingers. Extended voicings can omit the fifth and inner extensions. Formulas describe full theoretical chords. Natural minor key tables do not use the raised seventh of harmonic minor.

## GitHub Pages (when ready)

1. Commit `index.html`, `styles.css`, `app.js`, `circle-guide.js`, `chord-finder.js`, `metronome.js` and `.nojekyll` at the root of a GitHub repository.
2. In the repository, select **Settings → Pages → Deploy from a branch**.
3. Choose the branch and **/ (root)** folder, then save.

---

All asset URLs are relative, including when hosted under a repository path. Nothing has been published as part of this initial build.
