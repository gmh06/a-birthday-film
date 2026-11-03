# A Birthday Film

A small, quiet page for a birthday video.

Live at <https://gmh06.github.io/a-birthday-film/>.

## Files

- `index.html` — page structure and copy
- `styles.css` — layout, type, color, motion
- `app.js` — player controls, keyboard shortcuts, fullscreen
- `assets/poster.jpg` — cover still
- `video/cyz-720.mp4` — web encode, 720p / 24 fps / ~800 kbps
- `robots.txt` — keeps the page out of search engines

## Editing

The visible copy is in `index.html`: the title, the two-line note, and the signature.
Colors and type live at the top of `styles.css` under `:root`.

## Notes

- The page uses no external fonts, scripts, or trackers.
- The video is loaded only when the visitor presses play (`preload="metadata"`).
- The URL is public to anyone who has it. `noindex` and `robots.txt` only ask search
  engines not to list it; they are not access control.
