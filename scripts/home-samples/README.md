# Home sample magnets

The home page shows magnets as pre-rendered WebP images (fast, no canvas work on load).
They are drawn by the real template renderer (`src/lib/polaroid`), so they match the print.
Only the designer section renders live.

- **Photos and magnet specs:** `src/components/home/samplePhotos.js` (one list: photo, template, names, date, crop, output width).
- **Photos:** `public/samples/*.webp`, at most 800px wide.
- **Magnets:** `public/samples/magnets/{id}.webp`.

## Re-rendering after a change

1. Run the dev server: `npm run dev`.
2. Open `http://localhost:5173/scripts/home-samples/` in Chrome (canvas WebP export needs Chrome).
3. Check each magnet: faces fully in frame. If not, adjust that magnet's `crop.panY` in `samplePhotos.js` and reload.
4. Save every file into `public/samples/magnets/`, keeping the names.

The page also exposes the files as `window.__homeSamples` (`[{ file, dataUrl }]`) for a scripted export.
