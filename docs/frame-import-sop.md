# Frame Import SOP — Vecteezy

## Design Direction (mandatory)

**Every frame in the library must follow this design language:**

> **White background · Elegant border · Event name at bottom**

- **Background:** White or off-white — never dark, never busy. The photo is the hero.
- **Border:** Elegant decorative border only. The border area is the "canvas" for the design: gold foil, floral illustration, geometric lines, soft watercolour — all fine.
- **Event name:** Each frame has a `text_config` that defines how the event name is rendered at the bottom margin. Font, color, and weight are adapted per frame style (e.g., Playfair Display italic gold for wedding; bold Heebo navy for bar-mitzvah).
- **No dark backgrounds, no full-bleed texture, no embedded text** — these break the consistent family feel.

---

Operator guide for sourcing and uploading real photo-booth frame assets into the MemoriaMagnet frames library.

---

## 1. Find frames

Go to: https://www.vecteezy.com/free-png/photo-booth-frame

**Filters to apply in the Vecteezy UI:**
- File type: PNG
- Background: Transparent
- Orientation: Portrait

**Quality gates (inspect before downloading):**
- **White or off-white background** — reject dark/black/textured backgrounds
- Clear rectangular transparent center — the "hole" for the photo
- Hole occupies at least 30% of the image area
- Visible bottom margin (at least 7% of frame height) for the event name text
- No embedded text (dates, names, greetings are added by the app at print time)
- No visible watermarks
- PNG-32 with true alpha channel (check by opening in Preview/Paint.NET)

**Good search terms by category (always add "white background" to refine):**
| Category | Search terms |
|---|---|
| wedding | elegant white wedding photo frame, gold floral wedding border PNG, luxury wedding photo booth frame |
| bar-mitzvah | Jewish celebration photo frame white, Star of David border elegant, Hebrew celebration frame PNG |
| birthday | birthday photo booth frame white, confetti party photo frame elegant, festive white frame PNG |
| brit | baby blue white photo frame, newborn celebration border elegant, baby shower photo frame |
| general | elegant white photo frame transparent, portrait photo booth border minimal, classic white frame PNG |

---

## 2. Name and organise files

Download into a local folder, rename each file before uploading:

```
{category}-{style-description}-{number}.png
```

Examples:
```
wedding-gold-floral-01.png
wedding-minimal-white-02.png
bar-mitzvah-navy-gold-01.png
birthday-confetti-coral-01.png
brit-soft-blue-01.png
general-elegant-black-01.png
```

**Why naming matters:** The upload dialog auto-detects category and style from the filename prefix, saving you manual selection per file.

Category prefix map:
- `wedding-*` → חתונה
- `bar-*` or `bat-*` → בר/בת מצווה
- `birthday-*` → יום הולדת
- `brit-*` → ברית
- `corporate-*` → קורפורייט
- anything else → כללי

---

## 3. Upload

1. Open `/admin/frames`
2. Click **העלאת מסגרות**
3. Drag your PNG files (or the entire folder) onto the drop zone — multiple files supported
4. The system auto-detects the transparent hole for each frame:
   - Green badge **"✓ זוהה"** = detected cleanly, ready to upload
   - Amber badge **"~ חלקי"** = partial detection, review the blue overlay on the thumbnail
   - Red badge **"! ידני"** = manual required — click **"סמן ידנית"** and drag the rectangle
5. Fill in the Hebrew name for each frame (optional — slug is used if left blank)
6. Verify category and style are correct (auto-filled from filename)
7. Click **"העלה N מסגרות"**

---

## 4. Attribution

Vecteezy's free license requires attribution. After uploading, note the attribution in `frames_meta.notes`:

Format: `{Author name} via Vecteezy — {asset URL}`

Example: `Mia Studio via Vecteezy — https://www.vecteezy.com/vector-art/123456`

You can add/edit notes via the frame detail panel in the library.

---

## 5. Seed batch target

Goal: **20 frames** across 5 categories before first client demo.

| Category | Target count |
|---|---|
| wedding | 5 |
| bar/bat-mitzvah | 4 |
| birthday | 4 |
| brit | 3 |
| general | 4 |

---

## 6. Decommission placeholder SVGs

Once the real PNG batch is verified in production:

1. In Supabase: `DELETE FROM frames_meta WHERE image_url LIKE '/FRAMES/%-01.svg'`
2. In repo: `rm public/FRAMES/*.svg`
3. Commit: `Remove placeholder programmatic SVG seed frames`
